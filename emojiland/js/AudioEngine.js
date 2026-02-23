export class AudioEngine {
    constructor() {
        // Defer AudioContext creation until a user gesture (unlock())
        this.ctx = null;
        this.masterGain = null;

        this.currentMusicAudio = null;
        this.lastSongNumber = -1;
        this.fadeInterval = null;

        this.totalSongs = 29;
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
        this.playOscillator('square', 100, 0.2, 50);
    }

    playCollect() {
        // Shorter, softer sound
        this.playOscillator('sine', 1000, 0.05, 1200);
        setTimeout(() => this.playOscillator('sine', 1500, 0.1), 50);
    }

    playHurt() {
        this.playOscillator('sawtooth', 200, 0.4, 100);
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
}
