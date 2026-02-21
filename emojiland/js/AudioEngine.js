export class AudioEngine {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3;
        this.masterGain.connect(this.ctx.destination);

        this.currentMusicAudio = null;
        this.lastSongNumber = -1;
        this.fadeInterval = null;

        this.totalSongs = 17;
        this.musicPool = [];
    }

    getNextSongNumber() {
        if (this.musicPool.length === 0) {
            // Refill and shuffle pool
            this.musicPool = Array.from({ length: this.totalSongs }, (_, i) => i + 1);
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

    playOscillator(type, freq, duration, slideFreq = null) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
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
            if (this.ctx.state === 'suspended') this.ctx.resume();

            const songNumber = this.getNextSongNumber();
            console.log(`Playing music track: ${songNumber}`);

            this.currentMusicAudio = new Audio(`js/music/music (${songNumber}).mp3`);
            this.currentMusicAudio.loop = false; // Never loop
            this.currentMusicAudio.volume = 0;

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

        if (this.currentMusicAudio) {
            // If it's an auto-played next track, we can transition faster
            const fadeTime = isAutoNext ? 100 : 1000;
            this.fadeMusic(this.currentMusicAudio.volume, 0, fadeTime, () => {
                if (this.currentMusicAudio) {
                    this.currentMusicAudio.pause();
                    this.currentMusicAudio.onended = null;
                    this.currentMusicAudio = null;
                }
                startMusic();
            });
        } else {
            startMusic();
        }
    }

    fadeOutMusic(duration = 3000) {
        if (!this.currentMusicAudio) return;
        this.fadeMusic(this.currentMusicAudio.volume, 0, duration, () => {
            if (this.currentMusicAudio) {
                this.currentMusicAudio.pause();
                this.currentMusicAudio = null;
            }
        });
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
        this.playOscillator('sine', 800, 0.1, 400); // Quick descending sweeping sound 
    }
}
