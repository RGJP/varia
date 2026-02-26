export class AudioEngine {
    constructor() {
        // Defer AudioContext creation until a user gesture (unlock())
        this.ctx = null;
        this.masterGain = null;

        this.currentMusicAudio = null;
        this.lastSongNumber = -1;
        this.fadeInterval = null;

        this.totalSongs = 39;
        this.recentHistorySize = Math.max(0, Math.min(5, this.totalSongs - 1));
        this.musicPool = [];
        this.recentSongHistory = [];
        this.unlocked = false;
        this.isMusicMuted = false;
        this._lastJumpVariant = -1;
        this._lastHitVariant = -1;
        this._lastThrowVariant = -1;
        this._lastCollectVariant = {
            default: -1,
            coin: -1,
            powerup: -1
        };

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
                muted: this.isMusicMuted
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

    playBackgroundMusic(isAutoNext = false) {
        const startMusic = () => {
            this._ensureContext();
            if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => { });

            const songNumber = this.getNextSongNumber();
            console.log(`Playing music track: ${songNumber}`);

            if (!this.currentMusicAudio) {
                this.currentMusicAudio = new Audio();
            }

            this.currentMusicAudio.src = `js/music/${String(songNumber).padStart(2, '0')}.mp3`;
            this.currentMusicAudio.loop = false; // Never loop
            this.currentMusicAudio.volume = 0;
            this.currentMusicAudio.muted = this.isMusicMuted;

            this.currentMusicAudio.onended = () => {
                console.log("Music track ended, playing next...");
                this.playBackgroundMusic(true);
            };

            let playPromise = this.currentMusicAudio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    this.fadeMusic(0, 0.22, 3000); // Slightly louder music while SFX remain forward.
                }).catch(e => console.error("Audio playback failed:", e));
            }
        };

        if (this.currentMusicAudio && !isAutoNext) {
            // If changing manually mid-track, fade out the current one
            const fadeTime = 1000;
            this.fadeMusic(this.currentMusicAudio.volume, 0, fadeTime, () => {
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
            startMusic();
        }
    }

    fadeOutMusic(duration = 1000) {
        if (!this.currentMusicAudio) return;
        this.fadeMusic(this.currentMusicAudio.volume, 0, duration, () => {
            if (this.currentMusicAudio) {
                this.currentMusicAudio.pause();
                this.currentMusicAudio = null;
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

        const steps = 60; // Smooth 60 steps
        const stepTime = duration / steps;
        const volumeStep = (endVol - startVol) / steps;
        let currentStep = 0;

        if (this.currentMusicAudio) {
            this.currentMusicAudio.volume = startVol;
        }

        this.fadeInterval = setInterval(() => {
            currentStep++;
            let newVol = startVol + (volumeStep * currentStep);

            if (newVol < 0) newVol = 0;
            if (newVol > 1) newVol = 1;

            if (this.currentMusicAudio) {
                this.currentMusicAudio.volume = newVol;
            } else {
                this.stopMusicFade();
                return;
            }

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
        setTimeout(() => {
            this._playTone('triangle', this._jitter(v.end * 1.25, 0.025), 0.08, {
                endFreq: this._jitter(v.end * 1.05, 0.02),
                gain: 0.16,
                attack: 0.001
            });
        }, 18);
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
        // Sharper ice-crystal burst (distinct from rock throw).
        this._playTone('triangle', 1680, 0.15, { endFreq: 1180, gain: 0.44, attack: 0.0011 });
        this._playTone('sine', 2480, 0.2, { endFreq: 1680, gain: 0.33, attack: 0.0009 });
        setTimeout(() => {
            this._playTone('triangle', 3360, 0.11, { endFreq: 2280, gain: 0.26, attack: 0.0008 });
        }, 16);
        setTimeout(() => {
            this._playTone('sine', 3920, 0.085, { endFreq: 2860, gain: 0.17, attack: 0.0007 });
        }, 10);
        this._playNoiseBurst(0.08, 0.058, 4200);
        setTimeout(() => {
            this._playTone('triangle', 1480, 0.24, { endFreq: 980, gain: 0.18, attack: 0.0016 });
        }, 36);
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
                this.playOscillator('triangle', notes[i], duration);
                if (i === notes.length - 1) {
                    // Light harmony on the long final note.
                    this.playOscillator('sine', notes[i] * 1.25, 0.8);
                }
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
}
