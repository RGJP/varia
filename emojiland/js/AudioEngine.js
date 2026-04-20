export class AudioEngine {
    constructor() {
        // Defer AudioContext creation until a user gesture (unlock())
        this.ctx = null;
        this.masterGain = null;

        this.currentMusicAudio = null;
        this.lastSongNumber = -1;
        this.fadeInterval = null;
        this._pendingMusicSeekTimeout = null;
        this._musicRequestId = 0;
        this._bossMusicActive = false;
        this._preBossMusicSnapshot = null;
        this.bossTrackRotation = [
            { track: 28, startAt: 10 },
            { track: 'boss2.mp3', startAt: 0 },
            { track: 'boss3.mp3', startAt: 0 }
        ];
        this.bossTrackPool = [];

        this.totalSongs = 72;
        this.recentHistorySize = Math.max(0, Math.min(5, this.totalSongs - 1));
        this.musicPool = [];
        this.recentSongHistory = [];
        this.unlocked = false;
        this.isMusicMuted = false;
        this.defaultMusicLevel = 0.26;
        this._musicUserVolume = 0;
        this.defaultMusicTrackGain = 1;
        // Fixed per-track linear gains (1.0 = unchanged). Keys can be:
        // - full normalized path (js/music/00.mp3)
        // - file name (00.mp3, boss2.mp3)
        // - bare track id (00, boss2)
        // Add/adjust values here by ear for rough loudness matching.
        this.musicTrackGains = {
            // 'js/music/00.mp3': 0.92,
            // 'boss2.mp3': 0.88
        };
        this.musicNodeChain = null;
        this._musicLoudnessInterval = null;
        this._musicLoudnessState = null;
        this.musicNormalization = {
            targetDb: -22,
            silenceDb: -56,
            minGainDb: -10,
            maxGainDb: 10,
            settleSamples: 24,
            saveEverySamples: 80
        };
        this.musicNormalizationCache = {};
        this._musicNormalizationCacheDirty = false;
        this._lastJumpVariant = -1;
        this._lastBlastOffVariant = -1;
        this._lastHitVariant = -1;
        this._lastThrowVariant = -1;
        this._lastCollectVariant = {
            default: -1,
            coin: -1,
            powerup: -1
        };
        this._lightningBuzzNodes = null;
        this._lightningBuzzInterval = null;
        this._resumeLightningBuzzOnUnpause = false;

        this._loadSettings();
    }

    _ensureContext() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.58;
            this.masterGain.connect(this.ctx.destination);
        }
    }

    getNextSongNumber() {
        if (this.musicPool.length === 0) {
            // Refill and shuffle pool
            this.musicPool = Array.from({ length: this.totalSongs }, (_, i) => i);
            for (let i = this.musicPool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.musicPool[i], this.musicPool[j]] = [this.musicPool[j], this.musicPool[i]];
            }
        }

        let pickIdx = this.musicPool.length - 1;
        if (this.recentHistorySize > 0 && this.musicPool.length > 1 && this.recentSongHistory.length > 0) {
            const recent = new Set(this.recentSongHistory);
            const allowedIdx = [];
            for (let i = 0; i < this.musicPool.length; i++) {
                if (!recent.has(this.musicPool[i])) {
                    allowedIdx.push(i);
                }
            }
            if (allowedIdx.length > 0) {
                pickIdx = allowedIdx[Math.floor(Math.random() * allowedIdx.length)];
            }
        }

        const selected = this.musicPool.splice(pickIdx, 1)[0];
        this.lastSongNumber = (typeof selected === 'number') ? selected : 0;

        if (this.recentHistorySize > 0) {
            this.recentSongHistory.push(this.lastSongNumber);
            while (this.recentSongHistory.length > this.recentHistorySize) {
                this.recentSongHistory.shift();
            }
        }
        this._saveSettings();
        return this.lastSongNumber;
    }

    _buildShuffledIndexPool(size) {
        const pool = Array.from({ length: size }, (_, i) => i);
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        return pool;
    }

    getNextBossTrackSelection() {
        if (!Array.isArray(this.bossTrackRotation) || this.bossTrackRotation.length === 0) {
            return { track: 28, startAt: 10 };
        }
        if (this.bossTrackPool.length === 0) {
            this.bossTrackPool = this._buildShuffledIndexPool(this.bossTrackRotation.length);
        }
        const selectedIdx = this.bossTrackPool.pop();
        const selected = this.bossTrackRotation[selectedIdx];
        if (!selected) {
            return { track: 28, startAt: 10 };
        }
        return {
            track: selected.track,
            startAt: Math.max(0, Number(selected.startAt) || 0)
        };
    }

    _resolveMusicTrack(trackRef) {
        if (Number.isInteger(trackRef)) {
            const normalizedSong = ((trackRef % this.totalSongs) + this.totalSongs) % this.totalSongs;
            return {
                src: `js/music/${String(normalizedSong).padStart(2, '0')}.mp3`,
                songNumber: normalizedSong,
                label: String(normalizedSong).padStart(2, '0')
            };
        }

        if (typeof trackRef === 'string') {
            const trimmed = trackRef.trim();
            if (trimmed.length > 0) {
                const fileNameOnly = trimmed.replace(/\\/g, '/').split('/').pop();
                if (fileNameOnly && /^[A-Za-z0-9_-]+(\.mp3)?$/.test(fileNameOnly)) {
                    const fileName = fileNameOnly.toLowerCase().endsWith('.mp3')
                        ? fileNameOnly
                        : `${fileNameOnly}.mp3`;
                    return {
                        src: `js/music/${fileName}`,
                        songNumber: null,
                        label: fileName
                    };
                }
            }
        }

        return this._resolveMusicTrack(0);
    }

    _loadSettings() {
        try {
            const saved = localStorage.getItem('emojiland_audio_settings');
            if (saved) {
                const data = JSON.parse(saved);
                const cleanPool = [];
                const poolSeen = new Set();
                if (Array.isArray(data.pool)) {
                    for (let i = 0; i < data.pool.length; i++) {
                        const n = data.pool[i];
                        if (Number.isInteger(n) && n >= 0 && n < this.totalSongs && !poolSeen.has(n)) {
                            poolSeen.add(n);
                            cleanPool.push(n);
                        }
                    }
                }
                this.musicPool = cleanPool;
                this.lastSongNumber = (typeof data.last === 'number') ? data.last : -1;
                this.isMusicMuted = !!data.muted;
                this.musicNormalizationCache = {};
                if (data.musicNormCache && typeof data.musicNormCache === 'object') {
                    const entries = Object.entries(data.musicNormCache);
                    for (let i = 0; i < entries.length; i++) {
                        const [key, value] = entries[i];
                        if (typeof key !== 'string') continue;
                        if (typeof value !== 'number' || !Number.isFinite(value)) continue;
                        this.musicNormalizationCache[key] = Math.max(
                            this.musicNormalization.minGainDb,
                            Math.min(this.musicNormalization.maxGainDb, value)
                        );
                    }
                }

                const cleanHistory = [];
                const historySeen = new Set();
                if (Array.isArray(data.history)) {
                    for (let i = 0; i < data.history.length; i++) {
                        const n = data.history[i];
                        if (Number.isInteger(n) && n >= 0 && n < this.totalSongs && !historySeen.has(n)) {
                            historySeen.add(n);
                            cleanHistory.push(n);
                        }
                    }
                } else if (Number.isInteger(this.lastSongNumber) && this.lastSongNumber >= 0 && this.lastSongNumber < this.totalSongs) {
                    cleanHistory.push(this.lastSongNumber);
                }

                if (this.recentHistorySize > 0 && cleanHistory.length > this.recentHistorySize) {
                    this.recentSongHistory = cleanHistory.slice(cleanHistory.length - this.recentHistorySize);
                } else {
                    this.recentSongHistory = cleanHistory;
                }

                // If the library grows (new highest track numbers), ensure they enter
                // the live pool immediately even when an older pool was cached.
                let maxSeenTrack = -1;
                for (let i = 0; i < cleanPool.length; i++) {
                    if (cleanPool[i] > maxSeenTrack) maxSeenTrack = cleanPool[i];
                }
                for (let i = 0; i < cleanHistory.length; i++) {
                    if (cleanHistory[i] > maxSeenTrack) maxSeenTrack = cleanHistory[i];
                }
                if (Number.isInteger(this.lastSongNumber) && this.lastSongNumber > maxSeenTrack) {
                    maxSeenTrack = this.lastSongNumber;
                }
                for (let n = maxSeenTrack + 1; n < this.totalSongs; n++) {
                    if (!poolSeen.has(n)) {
                        poolSeen.add(n);
                        this.musicPool.push(n);
                    }
                }
            }
        } catch (e) {
            console.error("Failed to load audio settings:", e);
        }
    }

    _saveSettings() {
        try {
            localStorage.setItem('emojiland_audio_settings', JSON.stringify({
                pool: this.musicPool,
                history: this.recentSongHistory,
                last: this.lastSongNumber,
                muted: this.isMusicMuted,
                musicNormCache: this.musicNormalizationCache
            }));
        } catch (e) {
            console.error("Failed to save audio settings:", e);
        }
    }

    unlock() {
        if (this.unlocked) return;
        // Create AudioContext now, during user gesture
        this._ensureContext();
        if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => { });
        }
        // Force unlock HTML5 Audio inside user interaction event
        const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
        let p = silentAudio.play();
        if (p !== undefined) {
            p.then(() => {
                this.unlocked = true;
            }).catch(() => {
                // Still mark as unlocked — the context resume is what matters
                this.unlocked = true;
            });
        } else {
            this.unlocked = true;
        }
    }

    _clearPendingMusicSeek() {
        if (this._pendingMusicSeekTimeout) {
            clearTimeout(this._pendingMusicSeekTimeout);
            this._pendingMusicSeekTimeout = null;
        }
    }

    _clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    _musicTrackCacheKey(src) {
        const raw = String(src || '').replace(/\\/g, '/');
        const match = raw.match(/js\/music\/([^?#]+)/i);
        if (match && match[1]) {
            return `js/music/${match[1].toLowerCase()}`;
        }
        return raw.toLowerCase();
    }

    _setMusicUserVolume(vol) {
        const safeVol = this._clamp(Number(vol) || 0, 0, 1);
        this._musicUserVolume = safeVol;
        const hasMusicChain = this.musicNodeChain &&
            this.musicNodeChain.userGain &&
            this.musicNodeChain.audioElement === this.currentMusicAudio &&
            this.ctx;
        if (hasMusicChain) {
            this.musicNodeChain.userGain.gain.setValueAtTime(safeVol, this.ctx.currentTime);
        }
        if (this.currentMusicAudio) {
            this.currentMusicAudio.volume = hasMusicChain ? 1 : safeVol;
        }
    }

    _dbToLinear(db) {
        return Math.pow(10, db / 20);
    }

    _resolveFixedTrackGain(trackKey) {
        const safeDefault = this._clamp(Number(this.defaultMusicTrackGain) || 1, 0.05, 4);
        const key = this._musicTrackCacheKey(trackKey);
        const fileName = key.split('/').pop() || '';
        const bareId = fileName.replace(/\.mp3$/i, '');

        const pickConfiguredGain = () => {
            const configured = [
                this.musicTrackGains[key],
                this.musicTrackGains[fileName],
                this.musicTrackGains[bareId]
            ];
            for (let i = 0; i < configured.length; i++) {
                const value = configured[i];
                if (typeof value === 'number' && Number.isFinite(value)) {
                    return value;
                }
            }
            return null;
        };

        let gain = pickConfiguredGain();

        // Compatibility fallback: reuse previously saved per-track dB offsets.
        // This keeps existing user-tuned loudness data useful without runtime analysis.
        if (gain === null && this.musicNormalizationCache && typeof this.musicNormalizationCache === 'object') {
            const cachedDb = this.musicNormalizationCache[key];
            if (typeof cachedDb === 'number' && Number.isFinite(cachedDb)) {
                gain = this._dbToLinear(cachedDb);
            }
        }

        if (gain === null) return safeDefault;
        return this._clamp(gain, 0.05, 4);
    }

    _persistNormalizationSample(force = false) {
        // Disabled: keep music gain flat over time.
        return;
    }

    _stopMusicLoudnessMonitor() {
        if (this._musicLoudnessInterval) {
            clearInterval(this._musicLoudnessInterval);
            this._musicLoudnessInterval = null;
        }
        this._musicLoudnessState = null;
    }

    _applyCachedTrackNormalization(trackKey) {
        if (!this.musicNodeChain || !this.musicNodeChain.trackGain || !this.ctx) return;
        const gain = this._resolveFixedTrackGain(trackKey);
        this.musicNodeChain.trackGain.gain.setValueAtTime(gain, this.ctx.currentTime);
    }

    _startMusicLoudnessMonitor(trackKey) {
        // Disabled: keep music gain flat over time.
        this._stopMusicLoudnessMonitor();
    }

    _teardownMusicProcessing() {
        this._stopMusicLoudnessMonitor();
        if (!this.musicNodeChain) return;
        const chain = this.musicNodeChain;
        try { chain.source.disconnect(); } catch (e) { }
        try { chain.trackGain.disconnect(); } catch (e) { }
        try { chain.analyser.disconnect(); } catch (e) { }
        try { chain.normalizerGain.disconnect(); } catch (e) { }
        try { chain.compressor.disconnect(); } catch (e) { }
        try { chain.limiter.disconnect(); } catch (e) { }
        try { chain.userGain.disconnect(); } catch (e) { }
        this.musicNodeChain = null;
    }

    _setupMusicProcessingForElement(audioElement, trackSrc = '') {
        if (!audioElement) return;
        this._ensureContext();
        if (!this.masterGain || !this.ctx) return;

        if (this.musicNodeChain && this.musicNodeChain.audioElement !== audioElement) {
            this._teardownMusicProcessing();
        }

        if (!this.musicNodeChain) {
            const source = this.ctx.createMediaElementSource(audioElement);
            const trackGain = this.ctx.createGain();
            trackGain.gain.value = this.defaultMusicTrackGain;
            const userGain = this.ctx.createGain();
            userGain.gain.value = this._musicUserVolume;

            source.connect(trackGain);
            trackGain.connect(userGain);
            userGain.connect(this.masterGain);

            this.musicNodeChain = {
                audioElement,
                source,
                trackGain,
                userGain,
                trackKey: ''
            };
        }

        const trackKey = this._musicTrackCacheKey(trackSrc || audioElement.currentSrc || audioElement.src);
        this.musicNodeChain.trackKey = trackKey;
        this._applyCachedTrackNormalization(trackKey);
        this._setMusicUserVolume(this._musicUserVolume);
        this._startMusicLoudnessMonitor(trackKey);
    }

    playOscillator(type, freq, duration, slideFreq = null) {
        this._ensureContext();
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => { });
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (slideFreq) {
            osc.frequency.exponentialRampToValueAtTime(slideFreq, this.ctx.currentTime + duration);
        }

        gain.gain.setValueAtTime(1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    _playTone(type, startFreq, duration, options = {}) {
        this._ensureContext();
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => { });

        const now = this.ctx.currentTime;
        const {
            endFreq = null,
            gain = 0.12,
            attack = 0.003,
            decayFloor = 0.0001,
            detune = 0
        } = options;

        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(startFreq, now);
        if (endFreq && endFreq > 0) {
            osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
        }
        if (detune !== 0) {
            osc.detune.setValueAtTime(detune, now);
        }

        g.gain.setValueAtTime(decayFloor, now);
        g.gain.exponentialRampToValueAtTime(Math.max(decayFloor, gain), now + Math.max(0.001, attack));
        g.gain.exponentialRampToValueAtTime(decayFloor, now + duration);

        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + duration);
    }

    _playNoiseBurst(duration = 0.08, gain = 0.04, highpassFreq = 1200) {
        this._ensureContext();
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => { });

        const now = this.ctx.currentTime;
        const frameCount = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
        const buffer = this.ctx.createBuffer(1, frameCount, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < frameCount; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / frameCount);
        }

        const src = this.ctx.createBufferSource();
        src.buffer = buffer;

        const hp = this.ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.setValueAtTime(highpassFreq, now);

        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), now + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        src.connect(hp);
        hp.connect(g);
        g.connect(this.masterGain);

        src.start(now);
        src.stop(now + duration);
    }

    startLightningBuzz() {
        if (this._lightningBuzzNodes) return;
        this._resumeLightningBuzzOnUnpause = false;
        this._ensureContext();
        if (!this.ctx || !this.masterGain) return;
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => { });

        const now = this.ctx.currentTime;
        const baseGain = this.ctx.createGain();
        baseGain.gain.setValueAtTime(0.0001, now);
        baseGain.gain.exponentialRampToValueAtTime(0.06, now + 0.05);

        const band = this.ctx.createBiquadFilter();
        band.type = 'bandpass';
        band.frequency.setValueAtTime(620, now);
        band.Q.setValueAtTime(0.85, now);

        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(8.5, now);
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(170, now);

        const hum = this.ctx.createOscillator();
        hum.type = 'sawtooth';
        hum.frequency.setValueAtTime(132, now);
        const edge = this.ctx.createOscillator();
        edge.type = 'triangle';
        edge.frequency.setValueAtTime(268, now);

        hum.connect(band);
        edge.connect(band);
        band.connect(baseGain);
        baseGain.connect(this.masterGain);

        lfo.connect(lfoGain);
        lfoGain.connect(band.frequency);

        hum.start(now);
        edge.start(now);
        lfo.start(now);

        this._lightningBuzzNodes = { hum, edge, lfo, lfoGain, band, baseGain };

        this._lightningBuzzInterval = setInterval(() => {
            if (!this._lightningBuzzNodes || !this.ctx) return;
            const t = this.ctx.currentTime;
            const jitter = (Math.random() - 0.5) * 18;
            const freq = 620 + jitter;
            this._lightningBuzzNodes.band.frequency.cancelScheduledValues(t);
            this._lightningBuzzNodes.band.frequency.setTargetAtTime(freq, t, 0.05);
        }, 90);
    }

    stopLightningBuzz({ preserveResumeFlag = false } = {}) {
        if (!preserveResumeFlag) {
            this._resumeLightningBuzzOnUnpause = false;
        }
        if (!this._lightningBuzzNodes) return;
        if (this._lightningBuzzInterval) {
            clearInterval(this._lightningBuzzInterval);
            this._lightningBuzzInterval = null;
        }

        const n = this._lightningBuzzNodes;
        this._lightningBuzzNodes = null;

        const now = this.ctx ? this.ctx.currentTime : 0;
        try {
            n.baseGain.gain.cancelScheduledValues(now);
            n.baseGain.gain.setValueAtTime(Math.max(0.0001, n.baseGain.gain.value || 0.0001), now);
            n.baseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
        } catch (e) { }

        const stopAt = now + 0.1;
        try { n.hum.stop(stopAt); } catch (e) { }
        try { n.edge.stop(stopAt); } catch (e) { }
        try { n.lfo.stop(stopAt); } catch (e) { }

        setTimeout(() => {
            try { n.hum.disconnect(); } catch (e) { }
            try { n.edge.disconnect(); } catch (e) { }
            try { n.lfo.disconnect(); } catch (e) { }
            try { n.lfoGain.disconnect(); } catch (e) { }
            try { n.band.disconnect(); } catch (e) { }
            try { n.baseGain.disconnect(); } catch (e) { }
        }, 140);
    }

    pauseLightningBuzz() {
        this._resumeLightningBuzzOnUnpause = !!this._lightningBuzzNodes;
        if (this._lightningBuzzNodes) {
            this.stopLightningBuzz({ preserveResumeFlag: true });
        }
    }

    resumeLightningBuzz() {
        if (!this._resumeLightningBuzzOnUnpause) return;
        this._resumeLightningBuzzOnUnpause = false;
        this.startLightningBuzz();
    }

    playBackgroundMusic(isAutoNext = false) {
        const startMusic = () => {
            this._ensureContext();
            if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => { });
            this._clearPendingMusicSeek();
            const requestId = ++this._musicRequestId;

            const songNumber = this.getNextSongNumber();
            console.log(`Playing music track: ${songNumber}`);

            if (!this.currentMusicAudio) {
                this.currentMusicAudio = new Audio();
            }

            this.currentMusicAudio.src = `js/music/${String(songNumber).padStart(2, '0')}.mp3`;
            this.currentMusicAudio.loop = false; // Never loop
            this.currentMusicAudio.volume = 1;
            this.currentMusicAudio.muted = this.isMusicMuted;
            this._setMusicUserVolume(this.defaultMusicLevel);
            this._setupMusicProcessingForElement(this.currentMusicAudio, this.currentMusicAudio.src);

            this.currentMusicAudio.onended = () => {
                if (requestId !== this._musicRequestId) return;
                console.log("Music track ended, playing next...");
                this.playBackgroundMusic(true);
            };

            let playPromise = this.currentMusicAudio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    this._setMusicUserVolume(this.defaultMusicLevel);
                }).catch(e => console.error("Audio playback failed:", e));
            }
        };

        if (this.currentMusicAudio && !isAutoNext) {
            // If changing manually mid-track, fade out the current one
            const fadeTime = 1000;
            this.fadeMusic(this._musicUserVolume, 0, fadeTime, () => {
                if (this.currentMusicAudio) {
                    this.currentMusicAudio.pause();
                    this.currentMusicAudio.onended = null;
                }
                startMusic();
            });
        } else {
            // Auto transitioning after song ends, or first song. Start immediately.
            if (this.currentMusicAudio) {
                this.currentMusicAudio.pause();
                this.currentMusicAudio.onended = null;
            }
            this._setMusicUserVolume(this.defaultMusicLevel);
            startMusic();
        }
    }

    playBackgroundMusicTrack(songRef, options = {}) {
        const resolvedTrack = this._resolveMusicTrack(songRef);
        const startAt = Math.max(0, Number(options.startAt) || 0);
        const fadeInMs = Math.max(0, Number(options.fadeInMs) || 0);

        const startMusic = () => {
            this._ensureContext();
            if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => { });
            this._clearPendingMusicSeek();
            const requestId = ++this._musicRequestId;

            if (Number.isInteger(resolvedTrack.songNumber)) {
                this.lastSongNumber = resolvedTrack.songNumber;
                this._saveSettings();
            }
            console.log(`Playing music track: ${resolvedTrack.label}`);

            const musicAudio = new Audio();
            const baseSrc = resolvedTrack.src;
            musicAudio.src = baseSrc;
            musicAudio.loop = false;
            musicAudio.volume = 1;
            musicAudio.muted = this.isMusicMuted;
            musicAudio.preload = 'auto';
            musicAudio.onended = () => {
                if (requestId !== this._musicRequestId) return;
                console.log("Music track ended, playing next...");
                this.playBackgroundMusic(true);
            };
            this.currentMusicAudio = musicAudio;
            this._setMusicUserVolume(this.defaultMusicLevel);
            this._setupMusicProcessingForElement(musicAudio, baseSrc);

            const isCurrentRequest = () => requestId === this._musicRequestId && this.currentMusicAudio === musicAudio;
            const fadeInCurrent = () => {
                if (!isCurrentRequest()) return;
                if (fadeInMs > 0) this.fadeMusic(0, this.defaultMusicLevel, fadeInMs);
                else this._setMusicUserVolume(this.defaultMusicLevel);
            };

            const seekThenFade = () => {
                if (!isCurrentRequest() || startAt <= 0) {
                    fadeInCurrent();
                    return;
                }

                const normalRate = musicAudio.playbackRate || 1;
                const seekWindowMs = 180;
                const seekStartTs = Date.now();

                const getSafeStart = () => {
                    const duration = musicAudio.duration;
                    return Number.isFinite(duration)
                        ? Math.min(startAt, Math.max(0, duration - 0.1))
                        : startAt;
                };

                const applySeek = () => {
                    const safeStart = getSafeStart();
                    try {
                        if (typeof musicAudio.fastSeek === 'function') {
                            musicAudio.fastSeek(safeStart);
                        }
                    } catch (e) {
                        // Fall back to currentTime assignment.
                    }
                    try {
                        musicAudio.currentTime = safeStart;
                    } catch (e) {
                        // Seek may fail before enough media data is available.
                    }
                    const nowTime = musicAudio.currentTime || 0;
                    return nowTime >= (safeStart - 0.25);
                };

                const beginFastForwardFallback = () => {
                    if (!isCurrentRequest()) return;
                    let fastRate = null;
                    const candidateRates = [16, 8, 4, 2];
                    for (let i = 0; i < candidateRates.length; i++) {
                        try {
                            musicAudio.playbackRate = candidateRates[i];
                            fastRate = candidateRates[i];
                            break;
                        } catch (e) {
                            // Try a lower fallback playback rate.
                        }
                    }
                    if (!fastRate || fastRate <= normalRate) {
                        // Fail-safe: never leave boss music silent if rate change is unsupported.
                        fadeInCurrent();
                        return;
                    }
                    const tick = () => {
                        if (!isCurrentRequest()) return;
                        const safeStart = getSafeStart();
                        if ((musicAudio.currentTime || 0) >= (safeStart - 0.05)) {
                            this._pendingMusicSeekTimeout = null;
                            try {
                                musicAudio.playbackRate = normalRate;
                            } catch (e) {
                                // Keep current supported rate if restoring fails.
                            }
                            fadeInCurrent();
                            return;
                        }
                        this._pendingMusicSeekTimeout = setTimeout(tick, 10);
                    };
                    tick();
                };

                const attemptDirectSeek = () => {
                    if (!isCurrentRequest()) return;
                    if (applySeek()) {
                        this._pendingMusicSeekTimeout = null;
                        musicAudio.playbackRate = normalRate;
                        fadeInCurrent();
                        return;
                    }

                    if (Date.now() - seekStartTs >= seekWindowMs) {
                        beginFastForwardFallback();
                        return;
                    }
                    this._pendingMusicSeekTimeout = setTimeout(attemptDirectSeek, 20);
                };

                if (musicAudio.readyState >= 1) {
                    attemptDirectSeek();
                } else {
                    musicAudio.addEventListener('loadedmetadata', attemptDirectSeek, { once: true });
                }
            };

            const playPromise = musicAudio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    seekThenFade();
                }).catch(e => console.error("Audio playback failed:", e));
            } else {
                seekThenFade();
            }
        };

        if (this.currentMusicAudio) {
            this._clearPendingMusicSeek();
            this.fadeMusic(this._musicUserVolume, 0, 300, () => {
                if (this.currentMusicAudio) {
                    this.currentMusicAudio.pause();
                    this.currentMusicAudio.onended = null;
                }
                startMusic();
            });
        } else {
            startMusic();
        }
    }

    _captureCurrentMusicSnapshot() {
        if (!this.currentMusicAudio) return null;
        const src = this.currentMusicAudio.currentSrc || this.currentMusicAudio.src;
        if (!src) return null;
        return {
            src,
            time: Math.max(0, this.currentMusicAudio.currentTime || 0),
            lastSongNumber: this.lastSongNumber
        };
    }

    enterRandomBossMusic(options = {}) {
        const selection = this.getNextBossTrackSelection();
        const mergedOptions = { ...options };
        if (typeof mergedOptions.startAt === 'undefined') {
            mergedOptions.startAt = selection.startAt;
        }
        this.enterBossMusic(selection.track, mergedOptions);
    }

    enterBossMusic(songNumber = 28, options = {}) {
        if (!this._bossMusicActive) {
            this._preBossMusicSnapshot = this._captureCurrentMusicSnapshot();
        }
        this._bossMusicActive = true;
        this.playBackgroundMusicTrack(songNumber, options);
    }

    exitBossMusicToPrevious(options = {}) {
        if (!this._bossMusicActive) return;
        this._bossMusicActive = false;
        const snapshot = this._preBossMusicSnapshot;
        this._preBossMusicSnapshot = null;
        if (!snapshot) return;

        const fadeOutMs = Math.max(0, Number(options.fadeOutMs) || 220);
        const fadeInMs = Math.max(0, Number(options.fadeInMs) || 260);

        const restore = () => {
            this._ensureContext();
            if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => { });
            this._clearPendingMusicSeek();
            const requestId = ++this._musicRequestId;

            if (!this.currentMusicAudio) {
                this.currentMusicAudio = new Audio();
            }
            this.currentMusicAudio.src = snapshot.src;
            this.currentMusicAudio.loop = false;
            this.currentMusicAudio.volume = 1;
            this.currentMusicAudio.muted = this.isMusicMuted;
            this.currentMusicAudio.preload = 'auto';
            this._setMusicUserVolume(0);
            this._setupMusicProcessingForElement(this.currentMusicAudio, snapshot.src);
            this.currentMusicAudio.onended = () => {
                if (requestId !== this._musicRequestId) return;
                console.log("Music track ended, playing next...");
                this.playBackgroundMusic(true);
            };

            this.lastSongNumber = Number.isInteger(snapshot.lastSongNumber) ? snapshot.lastSongNumber : this.lastSongNumber;
            this._saveSettings();

            const playPromise = this.currentMusicAudio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    const duration = this.currentMusicAudio.duration;
                    const safeTime = Number.isFinite(duration)
                        ? Math.min(snapshot.time, Math.max(0, duration - 0.1))
                        : snapshot.time;
                    if (safeTime > 0) this.currentMusicAudio.currentTime = safeTime;
                    this.fadeMusic(0, this.defaultMusicLevel, fadeInMs);
                }).catch(e => console.error("Audio playback failed:", e));
            }
        };

        if (this.currentMusicAudio) {
            this._clearPendingMusicSeek();
            this.fadeMusic(this._musicUserVolume, 0, fadeOutMs, () => {
                if (this.currentMusicAudio) {
                    this.currentMusicAudio.pause();
                    this.currentMusicAudio.onended = null;
                }
                restore();
            });
        } else {
            restore();
        }
    }

    fadeOutMusic(duration = 1000) {
        this._clearPendingMusicSeek();
        this._musicRequestId++;
        this._bossMusicActive = false;
        this._preBossMusicSnapshot = null;
        if (!this.currentMusicAudio) {
            this._teardownMusicProcessing();
            return;
        }
        this.fadeMusic(this._musicUserVolume, 0, duration, () => {
            if (this.currentMusicAudio) {
                this.currentMusicAudio.pause();
                this.currentMusicAudio = null;
                this._teardownMusicProcessing();
            }
        });
    }

    pauseBackgroundMusic() {
        if (this.currentMusicAudio && !this.currentMusicAudio.paused) {
            this.currentMusicAudio.pause();
        }
    }

    resumeBackgroundMusic() {
        if (this.currentMusicAudio && this.currentMusicAudio.paused && this.ctx && this.ctx.state !== 'suspended') {
            this.currentMusicAudio.play().catch(e => console.error("Audio resume failed:", e));
        }
    }

    toggleMusicMute() {
        this.isMusicMuted = !this.isMusicMuted;
        if (this.currentMusicAudio) {
            this.currentMusicAudio.muted = this.isMusicMuted;
        }
        this._saveSettings();
    }

    fadeMusic(startVol, endVol, duration, callback) {
        this.stopMusicFade();

        const start = this._clamp(Number(startVol) || 0, 0, 1);
        const end = this._clamp(Number(endVol) || 0, 0, 1);
        const safeDuration = Math.max(0, Number(duration) || 0);
        if (safeDuration <= 0) {
            this._setMusicUserVolume(end);
            if (callback) callback();
            return;
        }

        const steps = 60; // Smooth 60 steps
        const stepTime = Math.max(1, safeDuration / steps);
        const volumeStep = (end - start) / steps;
        let currentStep = 0;

        this._setMusicUserVolume(start);

        this.fadeInterval = setInterval(() => {
            currentStep++;
            let newVol = start + (volumeStep * currentStep);

            if (newVol < 0) newVol = 0;
            if (newVol > 1) newVol = 1;

            if (!this.currentMusicAudio) {
                this.stopMusicFade();
                return;
            }
            this._setMusicUserVolume(newVol);

            if (currentStep >= steps) {
                this.stopMusicFade();
                if (callback) callback();
            }
        }, stepTime);
    }

    stopMusicFade() {
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
        }
    }

    _pickVariant(length, lastIndex) {
        if (length <= 1) return 0;
        let idx = Math.floor(Math.random() * length);
        if (idx === lastIndex) idx = (idx + 1 + Math.floor(Math.random() * (length - 1))) % length;
        return idx;
    }

    _jitter(freq, amount = 0.03) {
        const delta = (Math.random() * 2 - 1) * amount;
        return freq * (1 + delta);
    }

    playJump() {
        const variants = [
            { start: 290, end: 590, dur: 0.24, gain: 0.34 },
            { start: 315, end: 640, dur: 0.22, gain: 0.36 },
            { start: 275, end: 560, dur: 0.25, gain: 0.33 },
            { start: 330, end: 680, dur: 0.2, gain: 0.32 }
        ];
        const idx = this._pickVariant(variants.length, this._lastJumpVariant);
        this._lastJumpVariant = idx;
        const v = variants[idx];
        this._playTone('sine', this._jitter(v.start, 0.02), v.dur, {
            endFreq: this._jitter(v.end, 0.02),
            gain: v.gain,
            attack: 0.0018
        });
    }

    playBlastOff() {
        const variants = [
            { boomStart: 92, boomEnd: 66, boomGain: 0.52, bodyStart: 132, bodyEnd: 88, bodyGain: 0.24, crackStart: 620, crackEnd: 300, crackGain: 0.17, whistleStart: 430, whistleEnd: 920, whistleGain: 0.13, ventHp: 520 },
            { boomStart: 98, boomEnd: 72, boomGain: 0.5, bodyStart: 140, bodyEnd: 94, bodyGain: 0.23, crackStart: 680, crackEnd: 330, crackGain: 0.16, whistleStart: 470, whistleEnd: 980, whistleGain: 0.12, ventHp: 560 },
            { boomStart: 88, boomEnd: 62, boomGain: 0.54, bodyStart: 126, bodyEnd: 84, bodyGain: 0.25, crackStart: 590, crackEnd: 280, crackGain: 0.18, whistleStart: 410, whistleEnd: 880, whistleGain: 0.14, ventHp: 500 }
        ];
        const idx = this._pickVariant(variants.length, this._lastBlastOffVariant);
        this._lastBlastOffVariant = idx;
        const v = variants[idx];

        // Barrel launch: deeper boom with a thick low-mid body and softer top-end.
        this._playTone('square', this._jitter(v.boomStart, 0.018), 0.24, {
            endFreq: this._jitter(v.boomEnd, 0.018),
            gain: v.boomGain,
            attack: 0.0018
        });
        this._playTone('triangle', this._jitter(v.bodyStart, 0.018), 0.26, {
            endFreq: this._jitter(v.bodyEnd, 0.018),
            gain: v.bodyGain,
            attack: 0.0022
        });
        this._playTone('triangle', this._jitter(v.crackStart, 0.025), 0.11, {
            endFreq: this._jitter(v.crackEnd, 0.025),
            gain: v.crackGain,
            attack: 0.0011
        });
        this._playNoiseBurst(0.1, 0.055, 280);
        setTimeout(() => {
            this._playTone('sawtooth', this._jitter(v.whistleStart, 0.028), 0.17, {
                endFreq: this._jitter(v.whistleEnd, 0.028),
                gain: v.whistleGain,
                attack: 0.0014
            });
            this._playNoiseBurst(0.07, 0.032, v.ventHp);
            this._playTone('sine', this._jitter(v.bodyEnd * 0.9, 0.015), 0.2, {
                endFreq: this._jitter(v.bodyEnd * 0.68, 0.015),
                gain: v.bodyGain * 0.55,
                attack: 0.0026
            });
        }, 20);
    }

    playHit() {
        // Mid-punch impact with anti-fatigue variation.
        const variants = [
            { bodyStart: 320, bodyEnd: 170, bodyGain: 0.48, sparkStart: 940, sparkEnd: 430, sparkGain: 0.25, tailStart: 720, tailEnd: 340, tailGain: 0.19, noiseHp: 980 },
            { bodyStart: 360, bodyEnd: 190, bodyGain: 0.46, sparkStart: 1040, sparkEnd: 470, sparkGain: 0.24, tailStart: 780, tailEnd: 360, tailGain: 0.18, noiseHp: 1060 },
            { bodyStart: 300, bodyEnd: 165, bodyGain: 0.5, sparkStart: 900, sparkEnd: 390, sparkGain: 0.26, tailStart: 690, tailEnd: 320, tailGain: 0.2, noiseHp: 940 },
            { bodyStart: 345, bodyEnd: 185, bodyGain: 0.47, sparkStart: 980, sparkEnd: 440, sparkGain: 0.25, tailStart: 760, tailEnd: 350, tailGain: 0.19, noiseHp: 1020 }
        ];
        const idx = this._pickVariant(variants.length, this._lastHitVariant);
        this._lastHitVariant = idx;
        const v = variants[idx];

        this._playTone('triangle', this._jitter(v.bodyStart, 0.02), 0.17, {
            endFreq: this._jitter(v.bodyEnd, 0.02),
            gain: v.bodyGain,
            attack: 0.002
        });
        this._playTone('sine', this._jitter(v.sparkStart, 0.02), 0.11, {
            endFreq: this._jitter(v.sparkEnd, 0.02),
            gain: v.sparkGain,
            attack: 0.0014
        });
        setTimeout(() => {
            this._playTone('triangle', this._jitter(v.tailStart, 0.022), 0.1, {
                endFreq: this._jitter(v.tailEnd, 0.02),
                gain: v.tailGain,
                attack: 0.0014
            });
        }, 30);
        this._playNoiseBurst(0.055, 0.075, v.noiseHp);
    }

    playExplosion() {
        // Big, longer bomb blast with a sustained rumble tail.
        this._playTone('square', 120, 0.56, { endFreq: 64, gain: 0.52, attack: 0.002 });
        this._playTone('triangle', 220, 0.5, { endFreq: 110, gain: 0.38, attack: 0.0022, detune: -4 });
        this._playTone('sine', 340, 0.44, { endFreq: 150, gain: 0.22, attack: 0.0018 });
        this._playNoiseBurst(0.18, 0.14, 320);

        // Crack + bloom shortly after impact.
        setTimeout(() => {
            this._playTone('triangle', 920, 0.16, { endFreq: 360, gain: 0.22, attack: 0.0013 });
            this._playNoiseBurst(0.09, 0.08, 980);
        }, 26);

        // Long audible tail so the blast feels large.
        setTimeout(() => {
            this._playTone('triangle', 180, 0.72, { endFreq: 92, gain: 0.22, attack: 0.003 });
            this._playTone('sine', 260, 0.68, { endFreq: 120, gain: 0.16, attack: 0.0025 });
        }, 70);
    }

    playCollect(kind = 'default') {
        const bucket = (kind === 'coin' || kind === 'powerup') ? kind : 'default';
        const variantsByKind = {
            default: [
                { base: 920, tail: 1440, gain: 0.28 },
                { base: 980, tail: 1520, gain: 0.3 },
                { base: 1040, tail: 1620, gain: 0.29 }
            ],
            coin: [
                { base: 1046.5, tail: 1568.0, gain: 0.34 },
                { base: 1174.66, tail: 1760.0, gain: 0.35 },
                { base: 987.77, tail: 1480.0, gain: 0.33 },
                { base: 1318.51, tail: 1975.53, gain: 0.32 }
            ],
            powerup: [
                { base: 740.0, tail: 1174.66, gain: 0.34 },
                { base: 830.61, tail: 1318.51, gain: 0.35 },
                { base: 932.33, tail: 1480.0, gain: 0.34 },
                { base: 1046.5, tail: 1661.22, gain: 0.33 }
            ]
        };

        const variants = variantsByKind[bucket];
        const idx = this._pickVariant(variants.length, this._lastCollectVariant[bucket]);
        this._lastCollectVariant[bucket] = idx;
        const v = variants[idx];

        this._playTone('triangle', this._jitter(v.base, 0.018), 0.085, {
            endFreq: this._jitter(v.base * 1.09, 0.018),
            gain: v.gain,
            attack: 0.0015
        });
        setTimeout(() => {
            this._playTone('sine', this._jitter(v.tail, 0.022), 0.14, {
                endFreq: this._jitter(v.tail * 1.12, 0.02),
                gain: v.gain * 0.72,
                attack: 0.0012
            });
        }, 24);
    }

    playPowerUpCollect(powerUpType = 'powerup') {
        this.playCollect('powerup');

        switch (powerUpType) {
            case 'fire_powerup':
                // Short flame burst: low-mid roar + bright crackle.
                this._playTone('sawtooth', this._jitter(210, 0.03), 0.19, {
                    endFreq: this._jitter(140, 0.03),
                    gain: 0.28,
                    attack: 0.0016
                });
                this._playNoiseBurst(0.085, 0.05, 1800);
                setTimeout(() => {
                    this._playTone('triangle', this._jitter(520, 0.03), 0.1, {
                        endFreq: this._jitter(300, 0.03),
                        gain: 0.16,
                        attack: 0.0012
                    });
                }, 20);
                break;
            case 'frost_powerup':
                // Cold sparkle with a thin icy tail.
                this._playTone('sine', this._jitter(2217, 0.02), 0.12, {
                    endFreq: this._jitter(1680, 0.02),
                    gain: 0.28,
                    attack: 0.0008
                });
                setTimeout(() => {
                    this._playTone('triangle', this._jitter(3120, 0.02), 0.08, {
                        endFreq: this._jitter(2460, 0.02),
                        gain: 0.18,
                        attack: 0.0007
                    });
                }, 16);
                this._playNoiseBurst(0.03, 0.035, 5200);
                break;
            case 'lightning_powerup':
                // Sharp zap transient before the sustained lightning buzz.
                this._playTone('square', this._jitter(1320, 0.025), 0.09, {
                    endFreq: this._jitter(560, 0.025),
                    gain: 0.24,
                    attack: 0.0009
                });
                this._playNoiseBurst(0.032, 0.03, 6800);
                setTimeout(() => {
                    this._playTone('triangle', this._jitter(940, 0.02), 0.08, {
                        endFreq: this._jitter(430, 0.02),
                        gain: 0.13,
                        attack: 0.0009
                    });
                }, 12);
                break;
            case 'wing_powerup':
                // Airy wing whoosh sweep.
                this._playNoiseBurst(0.11, 0.045, 1200);
                this._playTone('sine', this._jitter(430, 0.03), 0.16, {
                    endFreq: this._jitter(860, 0.03),
                    gain: 0.2,
                    attack: 0.0012
                });
                setTimeout(() => {
                    this._playTone('triangle', this._jitter(700, 0.03), 0.12, {
                        endFreq: this._jitter(980, 0.03),
                        gain: 0.11,
                        attack: 0.0011
                    });
                }, 18);
                break;
            case 'diamond_powerup':
                // Crystal-like shimmer.
                this._playTone('triangle', this._jitter(1244, 0.018), 0.14, {
                    endFreq: this._jitter(1661, 0.018),
                    gain: 0.22,
                    attack: 0.0011
                });
                setTimeout(() => {
                    this._playTone('sine', this._jitter(1865, 0.018), 0.11, {
                        endFreq: this._jitter(2349, 0.018),
                        gain: 0.16,
                        attack: 0.0009
                    });
                }, 24);
                break;
            case 'full_health':
            case 'health':
                this._playTone('triangle', this._jitter(660, 0.02), 0.13, {
                    endFreq: this._jitter(990, 0.02),
                    gain: 0.22,
                    attack: 0.0014
                });
                break;
            case 'bomb':
                this._playTone('square', this._jitter(180, 0.03), 0.12, {
                    endFreq: this._jitter(120, 0.03),
                    gain: 0.22,
                    attack: 0.0016
                });
                this._playNoiseBurst(0.05, 0.05, 480);
                break;
            case 'boss_star':
                this._playTone('triangle', this._jitter(987.77, 0.015), 0.12, {
                    endFreq: this._jitter(1318.51, 0.015),
                    gain: 0.24,
                    attack: 0.001
                });
                setTimeout(() => {
                    this._playTone('sine', this._jitter(1568, 0.015), 0.18, {
                        endFreq: this._jitter(2093, 0.015),
                        gain: 0.16,
                        attack: 0.0009
                    });
                }, 22);
                break;
            default:
                break;
        }
    }

    playHurt() {
        // Player hurt: clear "ouch" contour, audible but not piercing.
        this._playTone('triangle', 500, 0.24, { endFreq: 220, gain: 0.46, attack: 0.002 });
        this._playTone('square', 190, 0.3, { endFreq: 95, gain: 0.24, attack: 0.003, detune: -6 });
        setTimeout(() => {
            this._playTone('sine', 760, 0.18, { endFreq: 280, gain: 0.28, attack: 0.002, detune: 5 });
        }, 38);
        this._playNoiseBurst(0.085, 0.07, 760);
    }

    playDeathTune() {
        // Cartoon "sad trombone" style: descending, chunky "woomp" notes.
        const beats = [
            { delay: 0, start: 392.0, end: 293.66, dur: 0.26, gain: 0.48 },    // G4 -> D4
            { delay: 160, start: 349.23, end: 261.63, dur: 0.28, gain: 0.52 }, // F4 -> C4
            { delay: 330, start: 311.13, end: 233.08, dur: 0.32, gain: 0.56 }, // D#4 -> A#3
            { delay: 540, start: 261.63, end: 174.61, dur: 0.66, gain: 0.64 }  // C4 -> F3 (long final woomp)
        ];

        for (let i = 0; i < beats.length; i++) {
            const beat = beats[i];
            setTimeout(() => {
                this._playTone('triangle', beat.start, beat.dur, { endFreq: beat.end, gain: beat.gain, attack: 0.003 });
                this._playTone('square', beat.start * 0.9, beat.dur * 0.92, { endFreq: beat.end * 0.9, gain: beat.gain * 0.42, attack: 0.004, detune: -5 });
                this._playTone('sine', beat.start * 1.8, beat.dur * 0.72, { endFreq: beat.end * 1.55, gain: beat.gain * 0.26, attack: 0.002, detune: 4 });
                this._playNoiseBurst(Math.min(0.09, beat.dur * 0.24), 0.03, 780);
            }, beat.delay);
        }
    }

    playWin() {
        // "TA" - A short, bright opening note
        this.playOscillator('triangle', 523.25, 0.15); // C5

        // "DA!!!" - A triumphant C Major chord with a slight delay
        setTimeout(() => {
            this.playOscillator('triangle', 523.25, 1.2); // C5
            this.playOscillator('triangle', 659.25, 1.2); // E5
            this.playOscillator('triangle', 783.99, 1.2); // G5
            this.playOscillator('sine', 1046.50, 1.2);    // C6 (Octave higher for brilliance)
        }, 150);
    }

    playThrow() {
        // Mid-range throw variants to reduce fatigue while staying mobile-speaker friendly.
        const variants = [
            { start: 560, end: 330, dur: 0.09, gain: 0.24 },
            { start: 620, end: 380, dur: 0.085, gain: 0.23 },
            { start: 680, end: 420, dur: 0.08, gain: 0.22 },
            { start: 600, end: 360, dur: 0.095, gain: 0.24 }
        ];
        const idx = this._pickVariant(variants.length, this._lastThrowVariant);
        this._lastThrowVariant = idx;
        const v = variants[idx];
        this._playTone('sine', this._jitter(v.start, 0.015), v.dur, {
            endFreq: this._jitter(v.end, 0.015),
            gain: v.gain,
            attack: 0.0015
        });
        setTimeout(() => {
            this._playTone('triangle', this._jitter(v.start * 1.45, 0.018), 0.055, {
                endFreq: this._jitter(v.end * 1.35, 0.018),
                gain: v.gain * 0.46,
                attack: 0.001
            });
        }, 10);
    }

    playFrostBlast() {
        // Glassy ice-crystal ping: keep it bright/airy, avoid rapid "chatty" formants.
        this._playTone('sine', 2520, 0.145, { endFreq: 1880, gain: 0.37, attack: 0.0007 });
        this._playTone('triangle', 3460, 0.078, { endFreq: 2660, gain: 0.24, attack: 0.0006 });
        this._playNoiseBurst(0.036, 0.045, 6200);
        setTimeout(() => {
            this._playTone('sine', 4780, 0.06, { endFreq: 3820, gain: 0.17, attack: 0.00055 });
            this._playNoiseBurst(0.022, 0.024, 7600);
        }, 20);
        setTimeout(() => {
            this._playTone('triangle', 1960, 0.115, { endFreq: 1460, gain: 0.16, attack: 0.0009 });
        }, 30);
    }

    playStomp() {
        // Heavy layered thud for impactful ground slam.
        this.playOscillator('square', 90, 0.2, 45);
        this.playOscillator('sine', 65, 0.28, 35);
        setTimeout(() => this.playOscillator('triangle', 140, 0.12, 90), 35);
    }

    playBossVictoryClimb() {
        // 7-note ascending victory climb with a long final tone.
        const notes = [523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77]; // C5 D5 E5 F5 G5 A5 B5
        const steps = [0, 120, 240, 360, 480, 600, 720];
        for (let i = 0; i < notes.length; i++) {
            const duration = i === notes.length - 1 ? 1.0 : 0.13;
            setTimeout(() => {
                this._playTone('triangle', notes[i], duration, {
                    endFreq: notes[i] * 1.015,
                    gain: i === notes.length - 1 ? 0.2 : 0.15,
                    attack: 0.0015
                });
                if (i === notes.length - 1) {
                    // Light harmony on the long final note.
                    this._playTone('sine', notes[i] * 1.25, 0.8, {
                        endFreq: notes[i] * 1.28,
                        gain: 0.1,
                        attack: 0.0012
                    });
                }
            }, steps[i]);
        }
    }

    playVictoryJingle() {
        // Short celebratory level-complete sting (~0.7s).
        const notes = [659.25, 783.99, 987.77, 1318.51]; // E5 G5 B5 E6
        const steps = [0, 120, 240, 370];
        for (let i = 0; i < notes.length; i++) {
            setTimeout(() => {
                const isFinal = i === notes.length - 1;
                this._playTone('triangle', notes[i], isFinal ? 0.24 : 0.15, {
                    endFreq: notes[i] * (isFinal ? 1.06 : 1.03),
                    gain: isFinal ? 0.34 : 0.26,
                    attack: 0.0012
                });
                this._playTone('sine', notes[i] * 2, isFinal ? 0.18 : 0.12, {
                    endFreq: notes[i] * 2.05,
                    gain: isFinal ? 0.16 : 0.11,
                    attack: 0.0009
                });
            }, steps[i]);
        }
    }

    playLetterVictoryStep(stepIndex) {
        // 6-step climb synchronized with E-M-O-J-I-✅ reveal.
        const notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // C5 D5 E5 G5 A5 C6
        if (stepIndex < 0 || stepIndex >= notes.length) return;

        const isFinal = stepIndex === notes.length - 1;
        this.playOscillator('triangle', notes[stepIndex], isFinal ? 0.62 : 0.14);
        if (isFinal) {
            // Longer, brighter final ding for the check mark.
            this.playOscillator('sine', notes[stepIndex] * 1.5, 0.44);
        }
    }

    playLetterCollectChime(letterIndex = 0) {
        // Brighter pickup "ding" so letter grabs cut through gameplay audio.
        const notes = [523.25, 587.33, 659.25, 698.46, 783.99]; // C5 D5 E5 F5 G5
        const idx = Math.max(0, Math.min(notes.length - 1, letterIndex | 0));
        const base = notes[idx];
        this._playTone('triangle', base, 0.16, { endFreq: base * 1.12, gain: 0.44, attack: 0.0018 });
        setTimeout(() => {
            this._playTone('sine', base * 2.0, 0.2, { endFreq: base * 2.35, gain: 0.3, attack: 0.0012 });
        }, 28);
    }

    playCompletion100Cue() {
        // Short 3-tone climb for "Collectibles 100% ✅" confirmation.
        const notes = [659.25, 783.99, 987.77]; // E5 G5 B5
        const delays = [0, 110, 220];
        for (let i = 0; i < notes.length; i++) {
            const n = notes[i];
            const isFinal = i === notes.length - 1;
            setTimeout(() => {
                this._playTone('triangle', n, isFinal ? 0.2 : 0.14, {
                    endFreq: n * 1.04,
                    gain: isFinal ? 0.34 : 0.24,
                    attack: 0.0012
                });
                this._playTone('sine', n * 2, isFinal ? 0.15 : 0.11, {
                    endFreq: n * 2.03,
                    gain: isFinal ? 0.16 : 0.11,
                    attack: 0.0009
                });
            }, delays[i]);
        }
    }

    playPadlockUnlock() {
        // Distinct metallic "click click" for cage/padlock unlock.
        const click = (base, detune = 0) => {
            this._playTone('square', this._jitter(base, 0.01), 0.048, {
                endFreq: this._jitter(base * 0.74, 0.01),
                gain: 0.34,
                attack: 0.0007,
                detune
            });
            this._playTone('triangle', this._jitter(base * 1.58, 0.012), 0.04, {
                endFreq: this._jitter(base * 1.2, 0.012),
                gain: 0.19,
                attack: 0.0006,
                detune: detune * 0.6
            });
            this._playNoiseBurst(0.022, 0.07, 2600);
        };

        click(1480, 2);
        setTimeout(() => click(1280, -3), 88);
    }
}
