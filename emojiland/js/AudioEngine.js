export class AudioEngine {
    constructor() {
        // Defer AudioContext creation until a user gesture (unlock())
        this.ctx = null;
        this.masterGain = null;

        this.currentMusicAudio = null;
        this.lastSongNumber = -1;
        this.fadeInterval = null;

        this.totalSongs = 39;
        this.musicPool = [];
        this.unlocked = false;
        this.isMusicMuted = false;
    }

    _ensureContext() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3;
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

            // If the first song in new pool is same as last song played, swap it
            if (this.musicPool[0] === this.lastSongNumber && this.musicPool.length > 1) {
                const swapIdx = Math.floor(Math.random() * (this.musicPool.length - 1)) + 1;
                [this.musicPool[0], this.musicPool[swapIdx]] = [this.musicPool[swapIdx], this.musicPool[0]];
            }
        }
        this.lastSongNumber = this.musicPool.pop();
        return this.lastSongNumber;
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
                    this.fadeMusic(0, 0.4, 3000); // Fade in to 0.4 volume over 3 seconds
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

    playJump() {
        this.playOscillator('sine', 300, 0.3, 600);
    }

    playHit() {
        // Rock impact: audible mid punch with a short sparkling transient.
        this._playTone('triangle', 330, 0.17, { endFreq: 180, gain: 0.5, attack: 0.002 });
        this._playTone('sine', 980, 0.11, { endFreq: 420, gain: 0.26, attack: 0.0015 });
        setTimeout(() => {
            this._playTone('triangle', 760, 0.1, { endFreq: 360, gain: 0.2, attack: 0.0015 });
        }, 30);
        this._playNoiseBurst(0.055, 0.075, 1050);
    }

    playExplosion() {
        // Bomb detonation: low boom + short crack for punch.
        this._playTone('square', 95, 0.3, { endFreq: 42, gain: 0.5, attack: 0.002 });
        this._playTone('triangle', 180, 0.24, { endFreq: 85, gain: 0.34, attack: 0.0025, detune: -5 });
        this._playNoiseBurst(0.12, 0.12, 380);
        setTimeout(() => {
            this._playTone('sine', 720, 0.09, { endFreq: 260, gain: 0.16, attack: 0.0015 });
            this._playNoiseBurst(0.05, 0.06, 1200);
        }, 24);
    }

    playCollect() {
        // Shorter, softer sound
        this.playOscillator('sine', 1000, 0.05, 1200);
        setTimeout(() => this.playOscillator('sine', 1500, 0.1), 50);
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
        this.playOscillator('sine', 500, 0.1, 200); // Quick descending sweeping sound 
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
}
