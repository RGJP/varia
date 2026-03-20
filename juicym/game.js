    (() => {
      'use strict';

const EMOJIS = [
  '🍎', '🍏', '🍊', '🥭', '🍌', '🍉', '🍇', '🍓', '🍈',
  '🍒', '🍑', '🍐', '🍍', '🥝', '🥥', '🫒',
  '🍅', '🥑', '🥒', '🥕', '🌽', '🍆', '🥔', '🍠',
  '🧄', '🧅', '🥬', '🥦', '🍄', '🫑', '🌶️', '🫚', '🫛'
];
      const PALETTE = ['#ff7f7b', '#ffe06f', '#8f7dff', '#ff77bb', '#ffae66', '#ff5e78', '#7af59a', '#75d8ff', '#ffd35e'];
      const POWER_EMOJI = {
        row: '➡️',
        col: '⬇️',
        bomb: '💥',
        prism: '🌈',
        lightning: '⚡',
        vortex: '🌀',
        meteor: '☄️'
      };
      const POWER_COLORS = {
        row: '#7ff6ff',
        col: '#84ffb9',
        bomb: '#ff8f6d',
        prism: '#ffd56f',
        lightning: '#c7a2ff',
        vortex: '#78f1ff',
        meteor: '#ffb27b'
      };
      const POWER_TYPES = ['row', 'col', 'bomb', 'prism', 'lightning', 'vortex', 'meteor'];
      const CELEBRATION_EMOJIS = ['🥳', '🎉', '🎊', '✨', '🏆', '👑', '🌟', '🕺'];
      const VICTORY_CLEAR_STEP_MIN_SECONDS = 0.08;
      const VICTORY_CLEAR_STEP_MAX_SECONDS = 0.12;
      const VICTORY_CLEAR_BLAST_RATIO = 0.32;
      const VICTORY_CLEAR_MIN_BLAST_CELLS = 4;
      const COMBO_CALLOUTS = {
        starter: ['Nice', 'Sweet', 'Great', 'Clean', 'Smooth', 'Solid', 'Neat', 'Tasty', 'Fresh', 'Sharp', 'Crisp', 'Slick'],
        rising: ['Epic', 'Wild', 'Spicy', 'Savage', 'Blazing', 'Cracked', 'On Fire', 'Superb', 'Brilliant', 'Electric', 'Juicy'],
        big: ['Insane', 'Monster', 'Unreal', 'Massive', 'Ferocious', 'Dominant', 'Explosive', 'Ridiculous', 'Fearless', 'Thunderous', 'Unstoppable', 'Mighty'],
        massive: ['Legendary', 'Mythic', 'Godlike', 'Transcendent', 'Apocalyptic', 'Supersonic', 'Meteoric', 'Titanic', 'Overpowered', 'Invincible', 'Astronomical', 'Elite']
      };
      const COMBO_FACES = {
        starter: ['😄', '🤩', '😊', '😎'],
        rising: ['😆', '🤯', '😺', '🥳'],
        big: ['🤯', '😈', '🫨', '🤠'],
        massive: ['🤯', '👑', '🦄', '🚀']
      };
      const LEVEL_CURVE = [
        {
          name: 'Sunlit Orchard',
          boards: [[8, 8], [8, 9]],
          symbolRange: [6, 7],
          moves: [20, 24],
          targetPerCell: [90, 110],
          difficultyText: ['Fresh Mix', 'Easy Bloom', 'Cascade Friendly']
        },
        {
          name: 'Citrus Current',
          boards: [[8, 8], [9, 8], [9, 9]],
          symbolRange: [7, 8],
          moves: [18, 22],
          targetPerCell: [100, 122],
          difficultyText: ['Balanced Rush', 'Zesty Pressure', 'Spicy Flow']
        },
        {
          name: 'Meteor Grove',
          boards: [[9, 9], [8, 10], [10, 8]],
          symbolRange: [7, 9],
          moves: [17, 21],
          targetPerCell: [112, 136],
          difficultyText: ['Wild Board', 'Tricky Orbit', 'Combo Hungry']
        },
        {
          name: 'Aurora Vault',
          boards: [[9, 9], [9, 10], [10, 9]],
          symbolRange: [8, 9],
          moves: [16, 20],
          targetPerCell: [125, 150],
          difficultyText: ['Dense Storm', 'High Voltage', 'Hard Spin']
        }
      ];
      const SCORE_RULES = {
        baseTile: 85,
        comboFactor: 0.35,
        powerBonus: 260,
        spawnBonus: 180,
        bigCombo: 420
      };
      const QUALITY_PRESETS = [
        {
          name: 'high',
          dprCap: 3,
          particleScale: 1,
          maxParticles: 180,
          maxPopups: 16,
          maxBeams: 8,
          maxPulses: 8,
          maxGlows: 14,
          maxTrails: 56,
          trailRate: 1,
          shakeScale: 1,
          pulseFill: 1,
          idleMotion: 1,
          tilePulse: 1,
          flash: 1
        },
        {
          name: 'balanced',
          dprCap: 2,
          particleScale: 0.72,
          maxParticles: 112,
          maxPopups: 13,
          maxBeams: 6,
          maxPulses: 6,
          maxGlows: 10,
          maxTrails: 36,
          trailRate: 0.72,
          shakeScale: 0.8,
          pulseFill: 0.74,
          idleMotion: 0.55,
          tilePulse: 0.6,
          flash: 0.82
        },
        {
          name: 'smooth',
          dprCap: 1.25,
          particleScale: 0.28,
          maxParticles: 34,
          maxPopups: 8,
          maxBeams: 3,
          maxPulses: 3,
          maxGlows: 5,
          maxTrails: 14,
          trailRate: 0.34,
          shakeScale: 0.45,
          pulseFill: 0.35,
          idleMotion: 0.18,
          tilePulse: 0.22,
          flash: 0.46
        }
      ];
      const FORCE_PERFORMANCE_MODE = false;
      const LOCKED_QUALITY_LEVEL = 1;
      const FONT_STACK = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
      const TAU = Math.PI * 2;

      function isLikelyMobileGpuPath() {
        const coarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        const ua = navigator.userAgent || '';
        return coarsePointer || /Android|iPhone|iPad|iPod/i.test(ua);
      }

      const MOBILE_SAFE_RENDERING = isLikelyMobileGpuPath();
      const CANVAS_CONTEXT_OPTIONS = MOBILE_SAFE_RENDERING
        ? { alpha: true, desynchronized: false }
        : { alpha: false, desynchronized: true };

      const canvas = document.getElementById('gameCanvas');
      const ctx = canvas.getContext('2d', CANVAS_CONTEXT_OPTIONS) || canvas.getContext('2d');
      const app = document.querySelector('.app');
      const footer = document.querySelector('.footer');
      const wrap = document.getElementById('canvasWrap');
      const levelProgress = document.getElementById('levelProgress');
      const levelProgressFill = document.getElementById('levelProgressFill');
      const rootStyle = document.documentElement.style;
      const overlay = document.getElementById('overlay');
      const overlayTitle = document.getElementById('overlayTitle');
      const overlaySub = document.getElementById('overlaySub');
      const overlayStats = document.querySelector('.overlay-stats');
      const overlayActions = document.querySelector('.overlay-actions');
      const overlayScoreStat = document.getElementById('overlayScoreStat');
      const overlayTargetStat = document.getElementById('overlayTargetStat');
      const overlayLevelStat = document.getElementById('overlayLevelStat');
      const overlayScore = document.getElementById('overlayScore');
      const overlayTarget = document.getElementById('overlayTarget');
      const overlayLevel = document.getElementById('overlayLevel');
      const overlayPrimary = document.getElementById('overlayPrimary');
      const overlaySecondary = document.getElementById('overlaySecondary');
      const splash = document.getElementById('splash');
      const splashFruitLine = document.getElementById('splashFruitLine');
      const splashTitle = document.getElementById('splashTitle');
      const startBtn = document.getElementById('startBtn');
      const settingsBtn = document.getElementById('settingsBtn');
      const fullscreenBtn = document.getElementById('fullscreenBtn');
      const settingsMenu = document.getElementById('settingsMenu');
      const settingsPanel = document.getElementById('settingsPanel');

      const statusLine = document.getElementById('statusLine');
      const statusMoves = document.getElementById('statusMoves');
      const shuffleBtn = document.getElementById('shuffleBtn');
      const restartBtn = document.getElementById('restartBtn');
      const muteMusicBtn = document.getElementById('muteMusicBtn');
      const muteMusicIcon = document.getElementById('muteMusicIcon');
      const muteMusicLabel = document.getElementById('muteMusicLabel');
      const muteFxBtn = document.getElementById('muteFxBtn');
      const muteFxIcon = document.getElementById('muteFxIcon');
      const muteFxLabel = document.getElementById('muteFxLabel');
      const MUSIC_TRACKS = ['music/1.mp3', 'music/2.mp3', 'music/3.mp3', 'music/4.mp3', 'music/5.mp3', 'music/6.mp3', 'music/7.mp3', 'music/8.mp3', 'music/9.mp3', 'music/10.mp3', 'music/11.mp3', 'music/12.mp3', 'music/13.mp3', 'music/14.mp3', 'music/15.mp3'];
      const MUSIC_FADE_MS = 2000;
      const FX_VOLUME = 0.75;
      const MUSIC_VOLUME = 0.42;
      const IDLE_HINT_DELAY_SECONDS = 10;
      const COMBO_POPUP_LIFE_SECONDS = 2.35;
      const CLEAR_PHASE_BASE_SECONDS = 0.07;
      const CLEAR_PHASE_MAX_SECONDS = 0.17;
      const CLEAR_PHASE_PER_CELL_SECONDS = 0.0018;
      const CLEAR_PHASE_PER_POWER_SECONDS = 0.012;
      const CLEAR_PHASE_PER_SPAWN_SECONDS = 0.008;
      const CLEAR_PHASE_PER_COMBO_SECONDS = 0.007;
      const CLEAR_REMOVE_TARGET_SCALE = 0.2;
      const CLEAR_REMOVE_TARGET_SCALE_POWER = 0.16;
      const CLEAR_REMOVE_SCALE_LERP_SPEED = 26;
      const CLEAR_REMOVE_JITTER_MIN = 0.92;
      const CLEAR_REMOVE_JITTER_MAX = 1.14;
      const CLEAR_REMOVE_STAGGER_BASE_SECONDS = 0.018;
      const CLEAR_REMOVE_STAGGER_MASSIVE_SECONDS = 0.032;
      const CLEAR_REMOVE_MIN_DURATION_SECONDS = 0.045;
      const MASS_CLEAR_COVERAGE = 0.72;
      const MASS_CLEAR_MIN_CELLS = 18;
      const MASS_CLEAR_REMOVE_JITTER_MIN = 0.98;
      const MASS_CLEAR_REMOVE_JITTER_MAX = 1.05;
      const MAX_POWER_VISUALS_PER_CLEAR = 6;
      const MAX_POWER_SHAKE_PER_CLEAR = 18;
      const VICTORY_CLEAR_REMOVE_BASE_SECONDS = 0.055;
      const VICTORY_CLEAR_REMOVE_JITTER_SECONDS = 0.03;
      const LEVEL_TARGET_LENGTH_MULTIPLIER = 1.74;
      const LEVEL_MOVES_LENGTH_MULTIPLIER = 1.12;
      const LEVEL_HARD_TARGET_BOOST_MAX = 0.22;
      const LEVEL_HARD_MOVES_PENALTY_MAX = 0.14;
      const LEVEL_EASY_TARGET_RELIEF_MAX = 0.1;
      const LEVEL_EASY_MOVES_BOOST_MAX = 0.12;
      const SECOND_WIND_BASE_CHANCE = 0.58;
      const SECOND_WIND_PROGRESS_BONUS = 0.34;
      const SECOND_WIND_LEVEL_STEP = 0.012;
      const SECOND_WIND_LEVEL_MAX_BONUS = 0.14;
      const SECOND_WIND_MAX_CHANCE = 0.93;
      const LUCKY_CASCADE_BASE_CHANCE = 0.18;
      const LUCKY_CASCADE_LEVEL_STEP = 0.012;
      const LUCKY_CASCADE_COMBO_STEP = 0.035;
      const LUCKY_CASCADE_MAX_CHANCE = 0.48;
      const CHAOS_DROP_BASE_CHANCE = 0.02;
      const CHAOS_DROP_COMBO_STEP = 0.01;
      const CHAOS_DROP_LEVEL_STEP = 0.0022;
      const CHAOS_DROP_DRY_STREAK_STEP = 0.0032;
      const CHAOS_DROP_DRY_STREAK_MAX = 0.024;
      const CHAOS_DROP_MAX_PER_CLEAR = 2;
      const CHAOS_DROP_MAX_CHANCE = 0.14;
      const BONUS_MATCH_POWER_BASE_CHANCE = 0.16;
      const BONUS_MATCH_POWER_COMBO_STEP = 0.09;
      const BONUS_MATCH_POWER_MAX_CHANCE = 0.48;
      const BONUS_MATCH_POWER_MAX_PER_CLEAR = 1;
      const POWER_VARIETY_RECENT_WINDOW = 8;
      let footerLayoutKey = '';
      let settingsReturnFocusEl = null;

      const state = {
        level: 1,
        score: 0,
        moves: 0,
        target: 0,
        runScore: 0,
        board: [],
        rows: 8,
        cols: 8,
        symbolCount: 7,
        emojiSet: [],
        selected: null,
        phase: 'idle',
        comboChain: 0,
        displayChain: 1,
        luckyCascadeUsed: false,
        secondWindUsed: false,
        chaosDryStreak: 0,
        levelInfo: null,
        boardRect: { x: 0, y: 0, w: 0, h: 0, tile: 0 },
        canvasSize: { w: 0, h: 0, dpr: 1 },
        pointerStart: null,
        pendingSwap: null,
        pendingClear: null,
        particles: [],
        popups: [],
        beams: [],
        pulses: [],
        glows: [],
        trails: [],
        flash: 0,
        shake: { x: 0, y: 0, vx: 0, vy: 0 },
        nextId: 1,
        rng: Math.random,
        started: false,
        overlayMode: null,
        victoryClear: null,
        idleHintTimer: 0,
        hintMove: null,
        audio: {
          ctx: null,
          fxBus: null,
          fxMaster: null,
          enabled: true,
          fxMuted: false,
          musicMuted: false,
          musicEl: null,
          musicTrackIndex: -1,
          pendingMusicTrackIndex: null,
          musicPlaylistOrder: [],
          musicPlaylistCursor: 0,
          musicFadeFrame: 0,
          musicTransitionId: 0,
          backgroundPaused: false,
          shouldResumeMusicOnForeground: false,
          pausedMusicVolume: 0,
          pausedFxGain: 0
        },
        qualityLevel: FORCE_PERFORMANCE_MODE ? LOCKED_QUALITY_LEVEL : detectInitialQualityLevel(),
        powerVariety: {
          usage: {
            row: 0,
            col: 0,
            bomb: 0,
            prism: 0,
            lightning: 0,
            vortex: 0,
            meteor: 0
          },
          recent: []
        },
        renderCache: {
          frameLayer: null,
          boardLayer: null,
          tileSprites: new Map(),
          dirtyFrame: true,
          dirtyBoard: true,
          dirtyTiles: true
        },
        perf: {
          avgDt: 1 / 60,
          slowTime: 0,
          fastTime: 0
        },
        theme: null,
        wakeLock: {
          supported: typeof navigator !== 'undefined' && !!navigator.wakeLock && typeof navigator.wakeLock.request === 'function',
          sentinel: null,
          requesting: false,
          shouldHold: false
        }
      };

      // Utilities
      function createBufferCanvas(width = 1, height = 1) {
        const buffer = document.createElement('canvas');
        buffer.width = Math.max(1, Math.ceil(width));
        buffer.height = Math.max(1, Math.ceil(height));
        return buffer;
      }

      function ensureCanvasSize(buffer, width, height) {
        const nextWidth = Math.max(1, Math.ceil(width));
        const nextHeight = Math.max(1, Math.ceil(height));
        if (!buffer) return createBufferCanvas(nextWidth, nextHeight);
        if (buffer.width !== nextWidth || buffer.height !== nextHeight) {
          buffer.width = nextWidth;
          buffer.height = nextHeight;
        }
        return buffer;
      }

      function detectInitialQualityLevel() {
        const cores = navigator.hardwareConcurrency || 4;
        const memory = navigator.deviceMemory || 4;
        const coarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        const strongDevice = cores >= 8 && memory >= 6;
        if (cores <= 2 || memory <= 2) return 2;
        if (coarsePointer) return strongDevice ? 0 : 1;
        if (cores <= 4 || memory <= 4) return 1;
        return 0;
      }

      function getQualityProfile() {
        return QUALITY_PRESETS[state.qualityLevel] || QUALITY_PRESETS[QUALITY_PRESETS.length - 1];
      }

      function getCanvasDevicePixelRatio() {
        const deviceDpr = Math.max(1, window.devicePixelRatio || 1);
        const coarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        if (coarsePointer) {
          return Math.min(deviceDpr, QUALITY_PRESETS[0].dprCap);
        }
        const quality = getQualityProfile();
        return Math.min(deviceDpr, quality.dprCap);
      }

      function invalidateRenderCache({ frame = false, board = false, tiles = false } = {}) {
        if (frame) state.renderCache.dirtyFrame = true;
        if (board) state.renderCache.dirtyBoard = true;
        if (tiles) state.renderCache.dirtyTiles = true;
      }

      function setQualityLevel(level) {
        const desiredLevel = FORCE_PERFORMANCE_MODE ? LOCKED_QUALITY_LEVEL : level;
        const nextLevel = clamp(desiredLevel, 0, QUALITY_PRESETS.length - 1);
        if (nextLevel === state.qualityLevel) return;
        state.qualityLevel = nextLevel;
        invalidateRenderCache({ frame: true, board: true, tiles: true });
        resizeCanvas();
      }

      function updatePerformanceBudget(dt) {
        if (FORCE_PERFORMANCE_MODE) return;
        const perf = state.perf;
        perf.avgDt = lerp(perf.avgDt, dt, 0.08);

        if (perf.avgDt > 1 / 57) {
          perf.slowTime += dt;
          perf.fastTime = 0;
        } else if (perf.avgDt < 1 / 59.4) {
          perf.fastTime += dt;
          perf.slowTime = Math.max(0, perf.slowTime - dt * 0.3);
        } else {
          perf.slowTime = Math.max(0, perf.slowTime - dt * 0.4);
          perf.fastTime = Math.max(0, perf.fastTime - dt * 0.5);
        }

        if (perf.slowTime > 0.9) {
          perf.slowTime = 0;
          perf.fastTime = 0;
          setQualityLevel(state.qualityLevel + 1);
        } else if (perf.fastTime > 4.5) {
          perf.slowTime = 0;
          perf.fastTime = 0;
          setQualityLevel(state.qualityLevel - 1);
        }
      }

      function getEffectBudgetScale() {
        const avgDt = state.perf.avgDt || 1 / 60;
        if (avgDt > 1 / 52) return 0.44;
        if (avgDt > 1 / 56) return 0.66;
        if (avgDt > 1 / 59) return 0.84;
        return 1;
      }

      function mulberry32(seed) {
        let t = seed >>> 0;
        return function rng() {
          t += 0x6d2b79f5;
          let n = Math.imul(t ^ (t >>> 15), 1 | t);
          n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
          return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
        };
      }

      function randInt(rng, min, max) {
        return Math.floor(rng() * (max - min + 1)) + min;
      }

      function choose(rng, list) {
        return list[Math.floor(rng() * list.length)];
      }

      function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
      }

      function wrapHue(hue) {
        return ((hue % 360) + 360) % 360;
      }

      function hslToRgb(h, s, l) {
        const hue = wrapHue(h) / 360;
        const sat = clamp(s, 0, 100) / 100;
        const light = clamp(l, 0, 100) / 100;
        if (sat === 0) {
          const gray = Math.round(light * 255);
          return { r: gray, g: gray, b: gray };
        }
        const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
        const p = 2 * light - q;
        const toChannel = (t) => {
          let channel = t;
          if (channel < 0) channel += 1;
          if (channel > 1) channel -= 1;
          if (channel < 1 / 6) return p + (q - p) * 6 * channel;
          if (channel < 1 / 2) return q;
          if (channel < 2 / 3) return p + (q - p) * (2 / 3 - channel) * 6;
          return p;
        };
        return {
          r: Math.round(toChannel(hue + 1 / 3) * 255),
          g: Math.round(toChannel(hue) * 255),
          b: Math.round(toChannel(hue - 1 / 3) * 255)
        };
      }

      function hslToHex(h, s, l) {
        const { r, g, b } = hslToRgb(h, s, l);
        const toHex = (value) => value.toString(16).padStart(2, '0');
        return '#' + toHex(r) + toHex(g) + toHex(b);
      }

      function hsla(h, s, l, a) {
        const { r, g, b } = hslToRgb(h, s, l);
        return `rgba(${r}, ${g}, ${b}, ${a})`;
      }

      function generateTheme(seed = Date.now()) {
        const rng = mulberry32(seed >>> 0 || 1);
        const baseHue = randInt(rng, 0, 359);
        const accentHue = wrapHue(baseHue + randInt(rng, 70, 150));
        const accentHue2 = wrapHue(baseHue - randInt(rng, 55, 135));
        const warmHue = wrapHue(baseHue + randInt(rng, 150, 235));
        const dangerHue = wrapHue(warmHue - randInt(rng, 8, 28));

        return {
          bg1: hslToHex(baseHue, randInt(rng, 48, 68), randInt(rng, 10, 16)),
          bg2: hslToHex(wrapHue(baseHue + randInt(rng, 8, 28)), randInt(rng, 46, 70), randInt(rng, 18, 28)),
          bg3: hslToHex(accentHue, randInt(rng, 52, 74), randInt(rng, 30, 44)),
          glow1: hsla(warmHue, randInt(rng, 78, 96), randInt(rng, 62, 74), 0.22),
          glow2: hsla(accentHue, randInt(rng, 72, 92), randInt(rng, 58, 70), 0.19),
          glow3: hsla(accentHue2, randInt(rng, 68, 88), randInt(rng, 54, 68), 0.18),
          panel: hsla(baseHue, randInt(rng, 28, 44), randInt(rng, 8, 13), 0.58),
          panelStrong: hsla(baseHue, randInt(rng, 30, 50), randInt(rng, 6, 10), 0.72),
          surface1: hsla(baseHue, randInt(rng, 34, 56), randInt(rng, 10, 15), 0.74),
          surface2: hsla(accentHue, randInt(rng, 32, 58), randInt(rng, 18, 28), 0.46),
          canvasBg1: hsla(baseHue, randInt(rng, 30, 48), randInt(rng, 7, 12), 0.54),
          canvasBg2: hsla(baseHue, randInt(rng, 30, 48), randInt(rng, 8, 14), 0.76),
          line: hsla(accentHue, randInt(rng, 30, 52), 92, 0.16),
          text: hslToHex(accentHue, randInt(rng, 26, 46), 97),
          muted: hsla(accentHue, randInt(rng, 28, 48), 94, 0.76),
          gold: hslToHex(warmHue, randInt(rng, 82, 96), randInt(rng, 66, 78)),
          accent: hslToHex(accentHue, randInt(rng, 82, 98), randInt(rng, 70, 82)),
          accent2: hslToHex(accentHue2, randInt(rng, 74, 94), randInt(rng, 66, 80)),
          danger: hslToHex(dangerHue, randInt(rng, 78, 96), randInt(rng, 64, 74)),
          shadow: hsla(baseHue, randInt(rng, 24, 40), 3, 0.38),
          button1: hsla(accentHue, randInt(rng, 70, 92), randInt(rng, 56, 68), 0.26),
          button2: hsla(accentHue2, randInt(rng, 66, 88), randInt(rng, 58, 72), 0.2),
          buttonSecondary1: hsla(baseHue, randInt(rng, 24, 40), 98, 0.12),
          buttonSecondary2: hsla(baseHue, randInt(rng, 18, 34), 94, 0.05),
          buttonDanger1: hsla(dangerHue, randInt(rng, 74, 92), randInt(rng, 60, 70), 0.28),
          buttonDanger2: hsla(warmHue, randInt(rng, 74, 94), randInt(rng, 62, 74), 0.18),
          overlayBackdrop: hsla(baseHue, randInt(rng, 26, 42), 5, 0.62),
          overlayGlow: hsla(warmHue, randInt(rng, 80, 96), randInt(rng, 64, 76), 0.16),
          overlayBg1: hsla(baseHue, randInt(rng, 32, 48), randInt(rng, 10, 16), 0.92),
          overlayBg2: hsla(baseHue, randInt(rng, 30, 46), randInt(rng, 6, 11), 0.94),
          frameBg: hslToHex(baseHue, randInt(rng, 38, 58), randInt(rng, 6, 11)),
          boardShell: hsla(baseHue, randInt(rng, 30, 46), randInt(rng, 7, 12), 0.88),
          boardStroke: hsla(accentHue, randInt(rng, 40, 60), 94, 0.12),
          cellLightA: hsla(accentHue, randInt(rng, 56, 80), 96, 0.08),
          cellLightB: hsla(accentHue2, randInt(rng, 44, 68), 92, 0.025)
        };
      }

      function applyTheme(theme) {
        state.theme = theme;
        const entries = {
          '--bg-1': theme.bg1,
          '--bg-2': theme.bg2,
          '--bg-3': theme.bg3,
          '--glow-1': theme.glow1,
          '--glow-2': theme.glow2,
          '--glow-3': theme.glow3,
          '--panel': theme.panel,
          '--panel-strong': theme.panelStrong,
          '--surface-1': theme.surface1,
          '--surface-2': theme.surface2,
          '--canvas-bg-1': theme.canvasBg1,
          '--canvas-bg-2': theme.canvasBg2,
          '--line': theme.line,
          '--text': theme.text,
          '--muted': theme.muted,
          '--gold': theme.gold,
          '--accent': theme.accent,
          '--accent-2': theme.accent2,
          '--danger': theme.danger,
          '--shadow': `0 20px 60px ${theme.shadow}`,
          '--button-1': theme.button1,
          '--button-2': theme.button2,
          '--button-secondary-1': theme.buttonSecondary1,
          '--button-secondary-2': theme.buttonSecondary2,
          '--button-danger-1': theme.buttonDanger1,
          '--button-danger-2': theme.buttonDanger2,
          '--overlay-backdrop': theme.overlayBackdrop,
          '--overlay-glow': theme.overlayGlow,
          '--overlay-bg-1': theme.overlayBg1,
          '--overlay-bg-2': theme.overlayBg2
        };
        for (const [name, value] of Object.entries(entries)) {
          rootStyle.setProperty(name, value);
        }
        invalidateRenderCache({ frame: true, board: true });
      }

      function traceRoundedRect(targetCtx, x, y, w, h, radius) {
        targetCtx.beginPath();
        targetCtx.moveTo(x + radius, y);
        targetCtx.arcTo(x + w, y, x + w, y + h, radius);
        targetCtx.arcTo(x + w, y + h, x, y + h, radius);
        targetCtx.arcTo(x, y + h, x, y, radius);
        targetCtx.arcTo(x, y, x + w, y, radius);
        targetCtx.closePath();
      }

      function lerp(a, b, t) {
        return a + (b - a) * t;
      }

      function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
      }

      function dist(a, b) {
        return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
      }

      function keyOf(r, c) {
        return r + ',' + c;
      }

      function parseKey(key) {
        const parts = key.split(',');
        return { r: Number(parts[0]), c: Number(parts[1]) };
      }

      function isInside(r, c) {
        return r >= 0 && c >= 0 && r < state.rows && c < state.cols;
      }

      function colorForKind(kind) {
        return PALETTE[kind % PALETTE.length];
      }

      function toRgba(color, alpha = 1) {
        const a = clamp(alpha, 0, 1);
        if (typeof color !== 'string') return `rgba(255, 255, 255, ${a})`;
        const value = color.trim();
        const hex = value.startsWith('#') ? value.slice(1) : '';
        if (/^[\da-fA-F]{3}$/.test(hex)) {
          const r = parseInt(hex[0] + hex[0], 16);
          const g = parseInt(hex[1] + hex[1], 16);
          const b = parseInt(hex[2] + hex[2], 16);
          return `rgba(${r}, ${g}, ${b}, ${a})`;
        }
        if (/^[\da-fA-F]{6}$/.test(hex) || /^[\da-fA-F]{8}$/.test(hex)) {
          const r = parseInt(hex.slice(0, 2), 16);
          const g = parseInt(hex.slice(2, 4), 16);
          const b = parseInt(hex.slice(4, 6), 16);
          return `rgba(${r}, ${g}, ${b}, ${a})`;
        }
        if (value.startsWith('rgb(')) {
          const channels = value.slice(4, -1).split(',').map((part) => Number(part.trim()));
          if (channels.length >= 3 && channels.every(Number.isFinite)) {
            return `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, ${a})`;
          }
        }
        if (value.startsWith('rgba(')) {
          const channels = value.slice(5, -1).split(',').map((part) => part.trim());
          if (channels.length >= 3) {
            const r = Number(channels[0]);
            const g = Number(channels[1]);
            const b = Number(channels[2]);
            if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
              return `rgba(${r}, ${g}, ${b}, ${a})`;
            }
          }
        }
        return value;
      }

      function createTile(kind, row, col, power = null, spawnOffset = 0) {
        const offsetY = row - spawnOffset;
        return {
          id: state.nextId++,
          kind,
          power,
          row,
          col,
          x: col,
          y: offsetY,
          vx: 0,
          vy: 0,
          scale: 1,
          targetScale: 1,
          alpha: 1,
          wobble: Math.random() * TAU,
          born: performance.now() * 0.001,
          removing: false,
          removeDelay: 0,
          removeTimer: 0,
          removeLife: 0,
          removeTargetScale: 1,
          pulse: Math.random() * TAU,
          selectedBoost: 0
        };
      }

      function getTile(r, c) {
        return isInside(r, c) ? state.board[r][c] : null;
      }

      function setTile(r, c, tile) {
        if (!isInside(r, c)) return;
        state.board[r][c] = tile;
        if (tile) {
          tile.row = r;
          tile.col = c;
        }
      }

      function snapTileToGrid(tile) {
        if (!tile) return;
        tile.x = tile.col;
        tile.y = tile.row;
        tile.vx = 0;
        tile.vy = 0;
      }

      function confirmShuffle() {
        return window.confirm('Are you sure you want to shuffle? This costs 2 moves.');
      }

      function confirmNewRun() {
        return window.confirm('Are you sure you want to start a new run? Your current progress will be lost.');
      }

      function clearIdleHint(resetTimer = true) {
        if (resetTimer) state.idleHintTimer = 0;
        state.hintMove = null;
      }

      function notePlayerActivity() {
        clearIdleHint(true);
      }

      function shouldHoldWakeLock() {
        return state.started &&
          !overlay.classList.contains('show') &&
          splash.classList.contains('hidden') &&
          state.phase !== 'paused';
      }

      async function requestWakeLock() {
        if (!state.wakeLock.supported) return;
        if (state.wakeLock.requesting || state.wakeLock.sentinel) return;
        if (!state.wakeLock.shouldHold || document.visibilityState !== 'visible') return;
        state.wakeLock.requesting = true;
        try {
          const sentinel = await navigator.wakeLock.request('screen');
          state.wakeLock.sentinel = sentinel;
          sentinel.addEventListener('release', () => {
            if (state.wakeLock.sentinel === sentinel) {
              state.wakeLock.sentinel = null;
            }
            if (state.wakeLock.shouldHold && document.visibilityState === 'visible') {
              requestWakeLock();
            }
          });
        } catch (_error) {
          // Ignore wake lock failures (unsupported/denied/visibility race); gameplay continues normally.
        } finally {
          state.wakeLock.requesting = false;
        }
      }

      async function releaseWakeLock() {
        const sentinel = state.wakeLock.sentinel;
        if (!sentinel) return;
        state.wakeLock.sentinel = null;
        try {
          await sentinel.release();
        } catch (_error) {}
      }

      function syncWakeLock() {
        const shouldHold = shouldHoldWakeLock();
        if (shouldHold === state.wakeLock.shouldHold) return;
        state.wakeLock.shouldHold = shouldHold;
        if (shouldHold) {
          requestWakeLock();
        } else {
          releaseWakeLock();
        }
      }

      function isFullscreenActive() {
        return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
      }

      function updateFullscreenButtonState() {
        if (!fullscreenBtn) return;
        const active = isFullscreenActive();
        fullscreenBtn.textContent = active ? '⬇️' : '⬆️';
        fullscreenBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
        fullscreenBtn.setAttribute('aria-label', active ? 'Exit fullscreen' : 'Enter fullscreen');
      }

      async function enterFullscreen() {
        const target = document.documentElement;
        if (target.requestFullscreen) {
          await target.requestFullscreen();
          return;
        }
        if (target.webkitRequestFullscreen) {
          target.webkitRequestFullscreen();
        }
      }

      async function exitFullscreen() {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          return;
        }
        if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }

      async function toggleFullscreen() {
        try {
          if (isFullscreenActive()) {
            await exitFullscreen();
          } else {
            await enterFullscreen();
          }
        } catch (_error) {}
        updateFullscreenButtonState();
      }

      function isSettingsMenuOpen() {
        return settingsMenu.classList.contains('show');
      }

      function closeSettingsMenu() {
        if (!isSettingsMenuOpen()) return;
        const activeEl = document.activeElement;
        if (activeEl instanceof HTMLElement && settingsMenu.contains(activeEl)) {
          const returnFocusEl = settingsReturnFocusEl && settingsReturnFocusEl.isConnected && !settingsMenu.contains(settingsReturnFocusEl)
            ? settingsReturnFocusEl
            : settingsBtn;
          if (returnFocusEl && typeof returnFocusEl.focus === 'function') {
            returnFocusEl.focus({ preventScroll: true });
          }
        }
        settingsMenu.classList.remove('show');
        settingsMenu.setAttribute('aria-hidden', 'true');
        settingsMenu.setAttribute('inert', '');
        settingsBtn.setAttribute('aria-expanded', 'false');
        settingsReturnFocusEl = null;
      }

      function openSettingsMenu() {
        if (overlay.classList.contains('show')) return;
        const activeEl = document.activeElement;
        settingsReturnFocusEl = activeEl instanceof HTMLElement ? activeEl : settingsBtn;
        settingsMenu.removeAttribute('inert');
        settingsMenu.classList.add('show');
        settingsMenu.setAttribute('aria-hidden', 'false');
        settingsBtn.setAttribute('aria-expanded', 'true');
        requestAnimationFrame(() => {
          if (!isSettingsMenuOpen()) return;
          if (shuffleBtn && typeof shuffleBtn.focus === 'function') {
            shuffleBtn.focus({ preventScroll: true });
          }
        });
      }

      function toggleSettingsMenu() {
        if (isSettingsMenuOpen()) {
          closeSettingsMenu();
          return;
        }
        openSettingsMenu();
      }

      function updateAudioButtons() {
        const isMusicMuted = state.audio.musicMuted;
        const isFxMuted = state.audio.fxMuted;
        if (muteMusicIcon) muteMusicIcon.textContent = isMusicMuted ? '🔇' : '🎵';
        if (muteMusicLabel) muteMusicLabel.textContent = isMusicMuted ? 'Music Off' : 'Music On';
        muteMusicBtn.setAttribute('aria-label', isMusicMuted ? 'Unmute music' : 'Mute music');
        muteMusicBtn.setAttribute('aria-pressed', isMusicMuted ? 'true' : 'false');

        if (muteFxIcon) muteFxIcon.textContent = isFxMuted ? '🔕' : '🔊';
        if (muteFxLabel) muteFxLabel.textContent = isFxMuted ? 'FX Off' : 'FX On';
        muteFxBtn.setAttribute('aria-label', isFxMuted ? 'Unmute sound effects' : 'Mute sound effects');
        muteFxBtn.setAttribute('aria-pressed', isFxMuted ? 'true' : 'false');
      }

      function setFxMuted(isMuted) {
        state.audio.fxMuted = isMuted;
        if (state.audio.fxMaster) {
          const target = state.audio.fxMuted ? 0 : FX_VOLUME;
          setFxMasterGain(target, 0.02);
        }
        updateAudioButtons();
      }

      function setMusicElementVolume(value) {
        const musicEl = state.audio.musicEl;
        if (!musicEl) return;
        musicEl.volume = clamp(value, 0, 1);
      }

      function setFxMasterGain(value, rampSeconds = 0) {
        if (!state.audio.fxMaster) return;
        const ctx = state.audio.ctx;
        const now = ctx ? ctx.currentTime : 0;
        const gainNode = state.audio.fxMaster.gain;
        const target = clamp(value, 0, 1);
        gainNode.cancelScheduledValues(now);
        gainNode.setValueAtTime(gainNode.value, now);
        if (rampSeconds > 0) {
          gainNode.linearRampToValueAtTime(target, now + rampSeconds);
          return;
        }
        gainNode.setValueAtTime(target, now);
      }

      function cancelMusicFade() {
        if (state.audio.musicFadeFrame) {
          cancelAnimationFrame(state.audio.musicFadeFrame);
          state.audio.musicFadeFrame = 0;
        }
      }

      function fadeMusicVolume(from, to, duration = MUSIC_FADE_MS, onComplete = null) {
        const musicEl = state.audio.musicEl;
        if (!musicEl) {
          if (onComplete) onComplete();
          return;
        }
        cancelMusicFade();
        const start = performance.now();
        const step = (now) => {
          const t = duration <= 0 ? 1 : Math.min(1, (now - start) / duration);
          const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          setMusicElementVolume(lerp(from, to, eased));
          if (t < 1) {
            state.audio.musicFadeFrame = requestAnimationFrame(step);
            return;
          }
          state.audio.musicFadeFrame = 0;
          if (onComplete) onComplete();
        };
        setMusicElementVolume(from);
        state.audio.musicFadeFrame = requestAnimationFrame(step);
      }

      function ensureMusicElement() {
        if (!state.audio.musicEl) {
          const musicEl = new Audio();
          musicEl.preload = 'auto';
          musicEl.loop = false;
          musicEl.volume = 0;
          musicEl.addEventListener('ended', () => {
            const previousTrackIndex = state.audio.musicTrackIndex;
            state.audio.musicTrackIndex = -1;
            state.audio.pendingMusicTrackIndex = null;
            startNextMusicTrack(previousTrackIndex);
          });
          state.audio.musicEl = musicEl;
        }
        return state.audio.musicEl;
      }

      function shuffleMusicPlaylist(excludeTrackIndex = -1) {
        const order = Array.from({ length: MUSIC_TRACKS.length }, (_, index) => index);
        for (let i = order.length - 1; i > 0; i -= 1) {
          const j = randInt(Math.random, 0, i);
          [order[i], order[j]] = [order[j], order[i]];
        }
        if (order.length > 1 && excludeTrackIndex >= 0 && order[0] === excludeTrackIndex) {
          [order[0], order[1]] = [order[1], order[0]];
        }
        return order;
      }

      function pickNextMusicTrack(excludeTrackIndex = state.audio.musicTrackIndex) {
        if (!MUSIC_TRACKS.length) return -1;
        if (state.audio.musicPlaylistCursor >= state.audio.musicPlaylistOrder.length) {
          state.audio.musicPlaylistOrder = shuffleMusicPlaylist(excludeTrackIndex);
          state.audio.musicPlaylistCursor = 0;
        }
        const trackIndex = state.audio.musicPlaylistOrder[state.audio.musicPlaylistCursor];
        state.audio.musicPlaylistCursor += 1;
        return trackIndex;
      }

      function startMusicTrack(trackIndex) {
        const musicEl = ensureMusicElement();
        const transitionId = ++state.audio.musicTransitionId;
        state.audio.pendingMusicTrackIndex = trackIndex;

        const beginFadeIn = () => {
          if (transitionId !== state.audio.musicTransitionId) return;
          state.audio.musicTrackIndex = trackIndex;
          state.audio.pendingMusicTrackIndex = null;
          const targetVolume = state.audio.musicMuted ? 0 : MUSIC_VOLUME;
          fadeMusicVolume(0, targetVolume, MUSIC_FADE_MS);
        };

        const startPlayback = () => {
          if (transitionId !== state.audio.musicTransitionId) return;
          musicEl.src = MUSIC_TRACKS[trackIndex];
          musicEl.currentTime = 0;
          musicEl.loop = false;
          musicEl.muted = false;
          setMusicElementVolume(0);
          const playPromise = musicEl.play();
          if (playPromise && typeof playPromise.then === 'function') {
            playPromise.then(beginFadeIn).catch(() => {
              if (transitionId !== state.audio.musicTransitionId) return;
              state.audio.pendingMusicTrackIndex = trackIndex;
              state.audio.musicTrackIndex = -1;
            });
          } else {
            beginFadeIn();
          }
        };

        if (!musicEl.paused || state.audio.musicTrackIndex !== -1) {
          fadeMusicVolume(musicEl.volume, 0, MUSIC_FADE_MS, () => {
            if (transitionId !== state.audio.musicTransitionId) return;
            musicEl.pause();
            startPlayback();
          });
          return;
        }

        startPlayback();
      }

      function startNextMusicTrack(excludeTrackIndex = state.audio.musicTrackIndex) {
        const trackIndex = pickNextMusicTrack(excludeTrackIndex);
        if (trackIndex < 0) return;
        startMusicTrack(trackIndex);
      }

      function ensureContinuousMusic() {
        if (!MUSIC_TRACKS.length) return;
        const musicEl = ensureMusicElement();
        if (state.audio.pendingMusicTrackIndex != null) return;
        if (!musicEl.paused || state.audio.musicTrackIndex !== -1) return;
        startNextMusicTrack();
      }

      function resumePendingMusic() {
        if (state.audio.musicMuted || state.audio.pendingMusicTrackIndex == null) return;
        startMusicTrack(state.audio.pendingMusicTrackIndex);
      }

      function setMusicMuted(isMuted) {
        state.audio.musicMuted = isMuted;
        const musicEl = ensureMusicElement();
        cancelMusicFade();
        if (isMuted) {
          fadeMusicVolume(musicEl.volume, 0, MUSIC_FADE_MS * 0.7);
        } else if (state.audio.pendingMusicTrackIndex != null) {
          resumePendingMusic();
        } else if (!musicEl.paused) {
          fadeMusicVolume(musicEl.volume, MUSIC_VOLUME, MUSIC_FADE_MS * 0.7);
        }
        updateAudioButtons();
      }

      function primeAudio() {
        ensureAudio();
        resumePendingMusic();
      }

      function pauseAudioForBackground() {
        if (state.audio.backgroundPaused) return;
        state.audio.backgroundPaused = true;

        const musicEl = state.audio.musicEl;
        const hasActiveMusic = Boolean(musicEl && !musicEl.paused && state.audio.musicTrackIndex !== -1);
        const hasPendingMusic = state.audio.pendingMusicTrackIndex != null;
        state.audio.shouldResumeMusicOnForeground = !state.audio.musicMuted && (hasActiveMusic || hasPendingMusic);
        state.audio.pausedMusicVolume = musicEl ? musicEl.volume : 0;
        state.audio.pausedFxGain = state.audio.fxMaster ? state.audio.fxMaster.gain.value : 0;

        if (musicEl && !musicEl.paused) {
          cancelMusicFade();
          setMusicElementVolume(0);
          musicEl.pause();
        }

        if (state.audio.ctx && state.audio.ctx.state === 'running') {
          setFxMasterGain(0);
          state.audio.ctx.suspend().catch(() => {});
        }
      }

      function resumeAudioFromBackground() {
        if (!state.audio.backgroundPaused) return;
        state.audio.backgroundPaused = false;

        if (state.audio.ctx && state.audio.ctx.state === 'suspended') {
          state.audio.ctx.resume().then(() => {
            const targetFxGain = state.audio.fxMuted ? 0 : (state.audio.pausedFxGain || FX_VOLUME);
            setFxMasterGain(targetFxGain, 0.05);
          }).catch(() => {});
        }

        if (!state.audio.shouldResumeMusicOnForeground || state.audio.musicMuted) {
          state.audio.shouldResumeMusicOnForeground = false;
          return;
        }

        const musicEl = state.audio.musicEl;
        if (musicEl && musicEl.paused && state.audio.musicTrackIndex !== -1) {
          const resumeVolume = clamp(state.audio.pausedMusicVolume || MUSIC_VOLUME, 0, MUSIC_VOLUME);
          cancelMusicFade();
          setMusicElementVolume(0);
          const resumePromise = musicEl.play();
          if (resumePromise && typeof resumePromise.then === 'function') {
            resumePromise
              .then(() => fadeMusicVolume(0, resumeVolume, MUSIC_FADE_MS * 0.7))
              .catch(() => {});
          } else {
            fadeMusicVolume(0, resumeVolume, MUSIC_FADE_MS * 0.7);
          }
          state.audio.shouldResumeMusicOnForeground = false;
          return;
        }

        if (state.audio.pendingMusicTrackIndex != null) {
          resumePendingMusic();
        }
        state.audio.shouldResumeMusicOnForeground = false;
      }

      function randFloat(min, max) {
        return min + Math.random() * (max - min);
      }

      function ensureAudio() {
        if (!state.audio.enabled) return null;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) {
          state.audio.enabled = false;
          return null;
        }
        if (!state.audio.ctx) {
          const ctx = new AudioCtx();
          const fxBus = ctx.createGain();
          const highpass = ctx.createBiquadFilter();
          const compressor = ctx.createDynamicsCompressor();
          const master = ctx.createGain();
          highpass.type = 'highpass';
          highpass.frequency.value = 28;
          highpass.Q.value = 0.65;
          compressor.threshold.value = -18;
          compressor.knee.value = 12;
          compressor.ratio.value = 3.4;
          compressor.attack.value = 0.004;
          compressor.release.value = 0.14;
          master.gain.value = state.audio.fxMuted ? 0 : FX_VOLUME;
          fxBus.connect(highpass);
          highpass.connect(compressor);
          compressor.connect(master);
          master.connect(ctx.destination);
          state.audio.ctx = ctx;
          state.audio.fxBus = fxBus;
          state.audio.fxMaster = master;
        }
        if (state.audio.ctx.state === 'suspended') {
          state.audio.ctx.resume().catch(() => {});
        }
        return state.audio.ctx;
      }

      function playTone({ frequency, duration = 0.12, type = 'sine', volume = 0.3, attack = 0.003, release = 0.12, detune = 0, when = 0, endFrequency = null, q = 0.8 }) {
        const ctx = ensureAudio();
        if (!ctx || !state.audio.fxBus) return;
        const start = ctx.currentTime + when;
        const end = start + duration;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, start);
        osc.detune.setValueAtTime(detune, start);
        if (endFrequency != null) osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFrequency), end);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(Math.max(700, frequency * 3.2), start);
        filter.Q.value = q;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(volume, start + attack);
        gain.gain.exponentialRampToValueAtTime(0.0001, end + release);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(state.audio.fxBus);
        osc.start(start);
        osc.stop(end + release + 0.01);
      }

      function playNoiseBurst({ duration = 0.05, volume = 0.08, when = 0, lowpass = 2200 }) {
        const ctx = ensureAudio();
        if (!ctx || !state.audio.fxBus) return;
        const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * duration));
        const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        const denom = Math.max(1, sampleCount - 1);
        for (let i = 0; i < sampleCount; i += 1) {
          const t = i / denom;
          const windowed = Math.sin(Math.PI * t);
          data[i] = (Math.random() * 2 - 1) * windowed;
        }
        const source = ctx.createBufferSource();
        const highpass = ctx.createBiquadFilter();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        const start = ctx.currentTime + when;
        source.buffer = buffer;
        highpass.type = 'highpass';
        highpass.frequency.setValueAtTime(150, start);
        highpass.Q.setValueAtTime(0.8, start);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(lowpass, start);
        const attack = Math.min(0.006, duration * 0.35);
        const fadeEnd = start + duration + 0.012;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(Math.max(0.0001, volume), start + attack);
        gain.gain.exponentialRampToValueAtTime(0.0001, fadeEnd);
        source.connect(highpass);
        highpass.connect(filter);
        filter.connect(gain);
        gain.connect(state.audio.fxBus);
        source.start(start);
        source.stop(fadeEnd + 0.01);
      }

      function playMatchSound(cells, specials, activatedPowerCount, comboChain) {
        const cellCount = cells.length;
        const base = randFloat(320, 420) + Math.min(180, cellCount * 9) + comboChain * 16;
        playTone({
          frequency: base,
          endFrequency: base * randFloat(1.08, 1.18),
          duration: randFloat(0.06, 0.085),
          volume: randFloat(0.11, 0.16),
          type: Math.random() < 0.5 ? 'triangle' : 'sine'
        });
        playTone({
          frequency: base * randFloat(1.18, 1.42),
          endFrequency: base * randFloat(1.45, 1.75),
          duration: randFloat(0.08, 0.12),
          volume: randFloat(0.06, 0.1),
          type: 'triangle',
          when: 0.018,
          detune: randFloat(-9, 9)
        });
        if (specials.length > 0 || activatedPowerCount > 0 || comboChain >= 2) {
          playTone({
            frequency: randFloat(180, 240),
            endFrequency: randFloat(120, 170),
            duration: randFloat(0.12, 0.18),
            volume: randFloat(0.05, 0.09),
            type: 'sawtooth',
            when: 0.01,
            q: 1.1
          });
          playNoiseBurst({
            duration: randFloat(0.028, 0.045),
            volume: randFloat(0.015, 0.03),
            when: 0.012,
            lowpass: randFloat(1400, 2400)
          });
        }
      }

      function playShuffleSound() {
        const base = randFloat(230, 290);
        playNoiseBurst({ duration: randFloat(0.035, 0.05), volume: 0.022, lowpass: randFloat(1500, 2600) });
        playTone({
          frequency: base,
          endFrequency: base * randFloat(0.72, 0.84),
          duration: randFloat(0.08, 0.12),
          volume: randFloat(0.05, 0.08),
          type: 'triangle'
        });
      }

      function playOverlaySound(mode) {
        if (mode === 'win') {
          const base = randFloat(440, 500);
          playTone({ frequency: base, endFrequency: base * 1.08, duration: 0.12, volume: 0.08, type: 'triangle' });
          playTone({ frequency: base * 1.25, endFrequency: base * 1.34, duration: 0.14, volume: 0.075, type: 'sine', when: 0.06 });
        } else {
          const base = randFloat(190, 230);
          playTone({ frequency: base, endFrequency: base * 0.72, duration: 0.16, volume: 0.07, type: 'triangle' });
        }
      }

      // UI state
      function updateHud() {
        if (!state.started) {
          if (statusMoves) statusMoves.textContent = '0';
          statusLine.setAttribute('aria-label', '0 moves left');
          shuffleBtn.disabled = true;
          if (levelProgressFill) levelProgressFill.style.transform = 'scaleX(0)';
          if (levelProgress) {
            levelProgress.setAttribute('aria-valuenow', '0');
            levelProgress.setAttribute('aria-valuetext', '0% complete');
          }
          return;
        }
        if (statusMoves) statusMoves.textContent = String(state.moves);
        statusLine.setAttribute('aria-label', `${state.moves} moves left`);
        shuffleBtn.disabled = !(state.phase === 'idle' && state.moves > 1 && !overlay.classList.contains('show'));
        const progress = state.target > 0 ? clamp(state.score / state.target, 0, 1) : 0;
        if (levelProgressFill) {
          levelProgressFill.style.transform = `scaleX(${progress})`;
        }
        if (levelProgress) {
          const percent = Math.round(progress * 100);
          levelProgress.setAttribute('aria-valuenow', String(percent));
          levelProgress.setAttribute('aria-valuetext', `${percent}% complete`);
        }
      }

      function getTargetBoardAspectRatio() {
        const viewportWidth = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1);
        const viewportHeight = Math.max(
          1,
          (window.visualViewport && window.visualViewport.height) || window.innerHeight || document.documentElement.clientHeight || 1
        );
        const rawAspect = viewportHeight / viewportWidth;
        return rawAspect >= 1
          ? clamp(rawAspect, 1.08, 1.55)
          : clamp(rawAspect, 0.72, 0.96);
      }

      function pickResponsiveBoardSize(baseRows, baseCols, minSize, maxSize, rng) {
        const isMobileLikeViewport = window.matchMedia && window.matchMedia('(max-width: 900px)').matches;
        if (!isMobileLikeViewport) {
          return { rows: baseRows, cols: baseCols };
        }

        const targetArea = Math.max(1, baseRows * baseCols);
        const targetAspect = getTargetBoardAspectRatio();
        let bestScore = Number.POSITIVE_INFINITY;
        let candidates = [];

        for (let rows = minSize; rows <= maxSize; rows += 1) {
          for (let cols = minSize; cols <= maxSize; cols += 1) {
            const aspect = rows / cols;
            const area = rows * cols;
            const aspectScore = Math.abs(aspect - targetAspect);
            const areaScore = Math.abs(area - targetArea) / targetArea;
            const score = aspectScore * 1.7 + areaScore * 1.15;
            if (score + 1e-6 < bestScore) {
              bestScore = score;
              candidates = [{ rows, cols }];
            } else if (score <= bestScore + 0.06) {
              candidates.push({ rows, cols });
            }
          }
        }

        return choose(rng, candidates);
      }

      // Procedural level generation
      function pickLevelConfig(level, forcedSeed = null) {
        const MIN_BOARD_SIZE = 5;
        const MAX_BOARD_SIZE = 9;
        const band = LEVEL_CURVE[Math.min(Math.floor((level - 1) / 3), LEVEL_CURVE.length - 1)];
        const seed = forcedSeed == null
          ? (Date.now() ^ (level * 99173) ^ ((performance.now() * 1000) | 0)) >>> 0
          : forcedSeed >>> 0;
        const rng = mulberry32(seed || 1);
        const baseRows = randInt(rng, MIN_BOARD_SIZE, MAX_BOARD_SIZE);
        const baseCols = randInt(rng, MIN_BOARD_SIZE, MAX_BOARD_SIZE);
        const { rows, cols } = pickResponsiveBoardSize(baseRows, baseCols, MIN_BOARD_SIZE, MAX_BOARD_SIZE, rng);
        const easyHardDrift = rng();
        const hardPressure = clamp((easyHardDrift - 0.62) / 0.38, 0, 1);
        const easyRelief = clamp((0.24 - easyHardDrift) / 0.24, 0, 1);
        const movePressureScale = 1 - hardPressure * LEVEL_HARD_MOVES_PENALTY_MAX + easyRelief * LEVEL_EASY_MOVES_BOOST_MAX;
        const targetPressureScale = 1 + hardPressure * LEVEL_HARD_TARGET_BOOST_MAX - easyRelief * LEVEL_EASY_TARGET_RELIEF_MAX;
        const symbolCount = clamp(randInt(rng, band.symbolRange[0], band.symbolRange[1]) + (easyHardDrift > 0.72 ? 1 : 0) - (easyHardDrift < 0.28 ? 1 : 0), 5, EMOJIS.length);
        const rawMoves = randInt(rng, band.moves[0], band.moves[1]) + (easyHardDrift < 0.24 ? 2 : 0) - (easyHardDrift > 0.78 ? 1 : 0);
        const moves = clamp(Math.round(rawMoves * LEVEL_MOVES_LENGTH_MULTIPLIER * movePressureScale), 13, 32);
        const perCell = randInt(rng, band.targetPerCell[0], band.targetPerCell[1]);
        const boardCells = rows * cols;
        const levelDurationBoost = 1.18 + Math.min(0.14, (level - 1) * 0.025);
        const target = Math.round(
          boardCells * perCell * (1 + (level - 1) * 0.1) * levelDurationBoost * LEVEL_TARGET_LENGTH_MULTIPLIER * targetPressureScale
        );
        const difficultyLabel = easyHardDrift < 0.24
          ? band.difficultyText[0]
          : easyHardDrift < 0.7
            ? band.difficultyText[1]
            : band.difficultyText[2];
        return {
          seed,
          rng,
          name: band.name,
          rows,
          cols,
          symbolCount,
          moves,
          target,
          difficultyLabel,
          drift: easyHardDrift
        };
      }

      function resizeCanvas() {
        let tile = 1;
        let boardWidth = state.cols;
        let boardHeight = state.rows;
        for (let pass = 0; pass < 2; pass += 1) {
          const appStyles = getComputedStyle(app);
          const footerStyles = getComputedStyle(footer);
          const appRect = app.getBoundingClientRect();
          const gap = parseFloat(appStyles.rowGap || appStyles.gap) || 0;
          const paddingTop = parseFloat(appStyles.paddingTop) || 0;
          const paddingLeft = parseFloat(appStyles.paddingLeft) || 0;
          const paddingRight = parseFloat(appStyles.paddingRight) || 0;
          const paddingBottom = parseFloat(appStyles.paddingBottom) || 0;
          const footerInFlow = footerStyles.position !== 'fixed' && footerStyles.position !== 'absolute';
          const footerHeight = footerInFlow ? footer.getBoundingClientRect().height : 0;
          const verticalGap = footerInFlow ? gap : 0;
          const viewportHeight = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
          const availableWidth = Math.max(1, appRect.width - paddingLeft - paddingRight);
          const availableHeight = Math.max(
            1,
            viewportHeight
              - paddingTop
              - paddingBottom
              - footerHeight
              - verticalGap
          );
          tile = Math.max(1, Math.floor(Math.min(availableWidth / state.cols, availableHeight / state.rows)));
          boardWidth = tile * state.cols;
          boardHeight = tile * state.rows;
          rootStyle.setProperty('--board-shell-width', `${boardWidth}px`);
          rootStyle.setProperty('--board-shell-height', `${boardHeight}px`);
        }

        rootStyle.setProperty('--board-aspect-ratio', `${state.cols} / ${state.rows}`);

        const rect = wrap.getBoundingClientRect();
        const cssWidth = Math.max(1, Math.round(rect.width));
        const cssHeight = Math.max(1, Math.round(rect.height));
        tile = Math.max(1, Math.floor(Math.min(cssWidth / state.cols, cssHeight / state.rows)));
        const boardPixelWidth = tile * state.cols;
        const boardPixelHeight = tile * state.rows;
        const boardOffsetX = Math.max(0, Math.floor((cssWidth - boardPixelWidth) * 0.5));
        const boardOffsetY = Math.max(0, Math.floor((cssHeight - boardPixelHeight) * 0.5));
        const dpr = getCanvasDevicePixelRatio();
        const prevWidth = state.canvasSize.w;
        const prevHeight = state.canvasSize.h;
        const prevTile = state.boardRect.tile;

        canvas.width = Math.round(cssWidth * dpr);
        canvas.height = Math.round(cssHeight * dpr);
        canvas.style.width = cssWidth + 'px';
        canvas.style.height = cssHeight + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = true;
        state.canvasSize = { w: cssWidth, h: cssHeight, dpr };

        state.boardRect = {
          x: boardOffsetX,
          y: boardOffsetY,
          w: boardPixelWidth,
          h: boardPixelHeight,
          tile
        };

        invalidateRenderCache({
          frame: prevWidth !== cssWidth || prevHeight !== cssHeight,
          board: true,
          tiles: prevTile !== tile
        });
        footerLayoutKey = getFooterLayoutKey();
      }

      function getFooterLayoutKey() {
        const rect = footer.getBoundingClientRect();
        return `${Math.round(rect.width)}x${Math.round(rect.height)}`;
      }

      function tileSpriteKey(kind, power = null) {
        return kind + ':' + (power || 'base');
      }

      function pickEmojiSet(count, rng) {
        const pool = EMOJIS.slice();
        for (let i = pool.length - 1; i > 0; i -= 1) {
          const j = randInt(rng, 0, i);
          const temp = pool[i];
          pool[i] = pool[j];
          pool[j] = temp;
        }
        return pool.slice(0, count);
      }

      function emojiForKind(kind) {
        return state.emojiSet[kind] || EMOJIS[kind] || '✨';
      }

      function buildTileSprite(kind, power = null) {
        const tile = Math.max(1, state.boardRect.tile);
        const spriteScale = Math.max(1, state.canvasSize.dpr || 1);
        const sprite = createBufferCanvas(tile * spriteScale, tile * spriteScale);
        const spriteCtx = sprite.getContext('2d');
        spriteCtx.setTransform(spriteScale, 0, 0, spriteScale, 0, 0);
        const size = tile * 0.86;
        const left = (tile - size) * 0.5;
        const top = (tile - size) * 0.5;
        const baseColor = colorForKind(kind);

        const grad = spriteCtx.createLinearGradient(left, top, left + size, top + size);
        grad.addColorStop(0, 'rgba(255,255,255,0.08)');
        grad.addColorStop(0.12, toRgba(baseColor, 0.43));
        grad.addColorStop(1, 'rgba(14, 22, 40, 0.47)');
        traceRoundedRect(spriteCtx, left, top, size, size, tile * 0.22);
        spriteCtx.fillStyle = grad;
        spriteCtx.fill();
        spriteCtx.lineWidth = tile * 0.03;
        spriteCtx.strokeStyle = power ? toRgba(POWER_COLORS[power], 0.53) : 'rgba(255,255,255,0.12)';
        spriteCtx.stroke();

        if (power) {
          spriteCtx.save();
          spriteCtx.globalAlpha = 0.28;
          spriteCtx.fillStyle = POWER_COLORS[power];
          traceRoundedRect(spriteCtx, left + size * 0.06, top + size * 0.06, size * 0.88, size * 0.88, tile * 0.19);
          spriteCtx.fill();
          spriteCtx.restore();
        }

        spriteCtx.fillStyle = '#ffffff';
        spriteCtx.font = `${Math.floor(size * 0.55)}px ${FONT_STACK}`;
        spriteCtx.textAlign = 'center';
        spriteCtx.textBaseline = 'middle';
        spriteCtx.fillText(emojiForKind(kind), tile * 0.5, tile * 0.51);

        if (power) {
          const bubbleSize = size * 0.32;
          const badgeX = left + size * 0.77;
          const badgeY = top + size * 0.22;
          spriteCtx.beginPath();
          spriteCtx.fillStyle = 'rgba(8,12,24,0.84)';
          spriteCtx.arc(badgeX, badgeY, bubbleSize * 0.52, 0, TAU);
          spriteCtx.fill();
          spriteCtx.lineWidth = tile * 0.02;
          spriteCtx.strokeStyle = POWER_COLORS[power];
          spriteCtx.stroke();
          spriteCtx.font = `${Math.floor(bubbleSize * 0.78)}px ${FONT_STACK}`;
          spriteCtx.fillText(POWER_EMOJI[power], badgeX, badgeY + 1);
        }

        return sprite;
      }

      function rebuildTileSprites() {
        const cache = state.renderCache;
        cache.tileSprites.clear();
        const powers = [null, 'row', 'col', 'bomb', 'prism', 'lightning', 'vortex', 'meteor'];
        for (let kind = 0; kind < EMOJIS.length; kind += 1) {
          for (const power of powers) {
            cache.tileSprites.set(tileSpriteKey(kind, power), buildTileSprite(kind, power));
          }
        }
        cache.dirtyTiles = false;
      }

      function getTileSprite(kind, power = null) {
        if (state.renderCache.dirtyTiles) rebuildTileSprites();
        return state.renderCache.tileSprites.get(tileSpriteKey(kind, power));
      }

      function rebuildFrameLayer() {
        const cache = state.renderCache;
        const { w, h } = state.canvasSize;
        const scale = Math.max(1, state.canvasSize.dpr || 1);
        const theme = state.theme || generateTheme(1);
        cache.frameLayer = ensureCanvasSize(cache.frameLayer, w * scale, h * scale);
        const frameCtx = cache.frameLayer.getContext('2d');
        frameCtx.setTransform(scale, 0, 0, scale, 0, 0);
        frameCtx.clearRect(0, 0, w, h);
        frameCtx.fillStyle = theme.frameBg;
        frameCtx.fillRect(0, 0, w, h);
        cache.dirtyFrame = false;
      }

      function rebuildBoardLayer() {
        const cache = state.renderCache;
        const { w: canvasWidth, h: canvasHeight } = state.canvasSize;
        const { x, y, w, h, tile } = state.boardRect;
        const scale = Math.max(1, state.canvasSize.dpr || 1);
        const theme = state.theme || generateTheme(1);
        cache.boardLayer = ensureCanvasSize(cache.boardLayer, canvasWidth * scale, canvasHeight * scale);
        const boardCtx = cache.boardLayer.getContext('2d');
        boardCtx.setTransform(scale, 0, 0, scale, 0, 0);
        boardCtx.clearRect(0, 0, canvasWidth, canvasHeight);

        traceRoundedRect(boardCtx, x, y, w, h, tile * 0.26);
        boardCtx.fillStyle = theme.boardShell;
        boardCtx.fill();
        boardCtx.strokeStyle = theme.boardStroke;
        boardCtx.lineWidth = 1.5;
        boardCtx.stroke();

        for (let r = 0; r < state.rows; r += 1) {
          for (let c = 0; c < state.cols; c += 1) {
            const cellX = x + c * tile;
            const cellY = y + r * tile;
            const cellGrad = boardCtx.createLinearGradient(cellX, cellY, cellX + tile, cellY + tile);
            cellGrad.addColorStop(0, theme.cellLightA);
            cellGrad.addColorStop(1, theme.cellLightB);
            traceRoundedRect(boardCtx, cellX + tile * 0.06, cellY + tile * 0.06, tile * 0.88, tile * 0.88, tile * 0.18);
            boardCtx.fillStyle = cellGrad;
            boardCtx.fill();
          }
        }

        cache.dirtyBoard = false;
      }

      function ensureRenderCaches() {
        if (state.renderCache.dirtyFrame) rebuildFrameLayer();
        if (state.renderCache.dirtyBoard) rebuildBoardLayer();
        if (state.renderCache.dirtyTiles) rebuildTileSprites();
      }

      // Board construction and match finding
      function randomKind(rng, excluded = []) {
        let kind = randInt(rng, 0, state.symbolCount - 1);
        let tries = 0;
        while (excluded.includes(kind) && tries < 12) {
          kind = randInt(rng, 0, state.symbolCount - 1);
          tries += 1;
        }
        return kind;
      }

      function resetPowerVarietyTracker() {
        for (const power of POWER_TYPES) {
          state.powerVariety.usage[power] = 0;
        }
        state.powerVariety.recent.length = 0;
      }

      function trackSpawnedPower(power) {
        if (!power || !Object.prototype.hasOwnProperty.call(state.powerVariety.usage, power)) return;
        state.powerVariety.usage[power] += 1;
        state.powerVariety.recent.push(power);
        if (state.powerVariety.recent.length > POWER_VARIETY_RECENT_WINDOW) {
          state.powerVariety.recent.shift();
        }
      }

      function pickVariedPower(pool) {
        const uniquePool = [];
        for (const power of pool) {
          if (!Object.prototype.hasOwnProperty.call(state.powerVariety.usage, power)) continue;
          if (!uniquePool.includes(power)) uniquePool.push(power);
        }
        if (uniquePool.length === 0) return null;
        if (uniquePool.length === 1) return uniquePool[0];

        const recent = state.powerVariety.recent;
        const usage = state.powerVariety.usage;
        let bestScore = -Infinity;
        let bestPower = uniquePool[0];

        for (const power of uniquePool) {
          const totalUses = usage[power] || 0;
          let recentUses = 0;
          for (const seen of recent) {
            if (seen === power) recentUses += 1;
          }
          const immediateRepeat = recent.length > 0 && recent[recent.length - 1] === power ? 1 : 0;
          const score = -totalUses * 1.12 - recentUses * 2.1 - immediateRepeat * 2.9 + state.rng() * 0.2;
          if (score > bestScore) {
            bestScore = score;
            bestPower = power;
          }
        }

        return bestPower;
      }

      function pickChaosDropPower(spawnsThisClear = 0) {
        if (spawnsThisClear >= CHAOS_DROP_MAX_PER_CLEAR) return null;
        if (state.comboChain < 1) return null;
        const dryBoost = Math.min(CHAOS_DROP_DRY_STREAK_MAX, state.chaosDryStreak * CHAOS_DROP_DRY_STREAK_STEP);
        const chance = clamp(
          CHAOS_DROP_BASE_CHANCE +
          Math.max(0, state.comboChain - 1) * CHAOS_DROP_COMBO_STEP +
          Math.max(0, state.level - 1) * CHAOS_DROP_LEVEL_STEP +
          dryBoost,
          0,
          CHAOS_DROP_MAX_CHANCE
        );
        if (state.rng() > chance) return null;
        const pool = state.comboChain >= 6
          ? ['row', 'col', 'bomb', 'prism', 'lightning', 'vortex', 'meteor']
          : state.comboChain >= 4
            ? ['row', 'col', 'bomb', 'prism', 'lightning', 'vortex']
            : state.comboChain >= 2
              ? ['row', 'col', 'bomb', 'prism', 'lightning']
              : ['row', 'col', 'bomb'];
        return pickVariedPower(pool);
      }

      function generateBoard() {
        let attempts = 0;
        do {
          attempts += 1;
          state.board = Array.from({ length: state.rows }, () => Array(state.cols).fill(null));
          for (let r = 0; r < state.rows; r += 1) {
            for (let c = 0; c < state.cols; c += 1) {
              const excluded = [];
              if (c > 1 && state.board[r][c - 1] && state.board[r][c - 2] && state.board[r][c - 1].kind === state.board[r][c - 2].kind) {
                excluded.push(state.board[r][c - 1].kind);
              }
              if (r > 1 && state.board[r - 1][c] && state.board[r - 2][c] && state.board[r - 1][c].kind === state.board[r - 2][c].kind) {
                excluded.push(state.board[r - 1][c].kind);
              }
              const kind = randomKind(state.rng, excluded);
              state.board[r][c] = createTile(kind, r, c, null, randInt(state.rng, 1, state.rows));
              state.board[r][c].x = c;
            }
          }
        } while ((findMatches().cells.length > 0 || !hasPossibleMove()) && attempts < 60);
      }

      function resetForNewLevel(level, preserveRunScore = true, forcedSeed = null) {
        hideOverlay();
        state.level = level;
        state.levelInfo = pickLevelConfig(level, forcedSeed);
        state.rows = state.levelInfo.rows;
        state.cols = state.levelInfo.cols;
        state.symbolCount = state.levelInfo.symbolCount;
        state.emojiSet = pickEmojiSet(state.symbolCount, state.levelInfo.rng);
        state.moves = state.levelInfo.moves;
        state.target = state.levelInfo.target;
        state.score = 0;
        state.selected = null;
        state.comboChain = 0;
        state.displayChain = 1;
        state.luckyCascadeUsed = false;
        state.secondWindUsed = false;
        state.chaosDryStreak = 0;
        state.phase = 'settling';
        state.pendingSwap = null;
        state.pendingClear = null;
        state.particles.length = 0;
        state.popups.length = 0;
        state.beams.length = 0;
        state.pulses.length = 0;
        state.glows.length = 0;
        state.trails.length = 0;
        state.flash = 0;
        state.shake.x = 0;
        state.shake.y = 0;
        state.shake.vx = 0;
        state.shake.vy = 0;
        state.victoryClear = null;
        state.rng = state.levelInfo.rng;
        clearIdleHint(true);
        if (!preserveRunScore) state.runScore = 0;
        generateBoard();
        invalidateRenderCache({ board: true, tiles: true });
        resizeCanvas();
        addPopup(state.cols * 0.5, -0.5, 'Level ' + level, '#ffd97a', 0.9, 1.22);
        updateHud();
        syncWakeLock();
        ensureContinuousMusic();
      }

      function startNewRun() {
        state.started = true;
        applyTheme(generateTheme((Date.now() ^ ((performance.now() * 1000) | 0)) >>> 0));
        resetPowerVarietyTracker();
        resetForNewLevel(1, false);
      }

      function pickRandom(arr) {
        return arr[(Math.random() * arr.length) | 0];
      }

      function refreshSplashLook() {
        const hueA = randInt(Math.random, 0, 359);
        const hueB = (hueA + randInt(Math.random, 68, 148)) % 360;
        const hueC = (hueB + randInt(Math.random, 72, 168)) % 360;
        splash.style.setProperty('--splash-card-1', `hsla(${hueA}, 100%, 96%, 0.95)`);
        splash.style.setProperty('--splash-card-2', `hsla(${hueB}, 100%, 92%, 0.9)`);
        splash.style.setProperty('--splash-accent-1', `hsla(${hueB}, 98%, 64%, 0.34)`);
        splash.style.setProperty('--splash-accent-2', `hsla(${hueC}, 96%, 62%, 0.32)`);

        if (splashFruitLine) {
          let fruitsHtml = '';
          for (let i = 0; i < 4; i += 1) {
            const glowHue = randInt(Math.random, 0, 359);
            fruitsHtml += `<span style="filter: drop-shadow(0 4px 10px hsla(${glowHue}, 100%, 52%, 0.46));">${pickRandom(EMOJIS)}</span>`;
          }
          splashFruitLine.innerHTML = fruitsHtml;
        }

        if (splashTitle) {
          splashTitle.textContent = 'JuicyM';
        }
      }

      function showSplash() {
        closeSettingsMenu();
        refreshSplashLook();
        splash.classList.remove('hidden');
        syncWakeLock();
      }

      function hideSplash() {
        splash.classList.add('hidden');
        syncWakeLock();
      }

      function showOverlay(mode) {
        closeSettingsMenu();
        state.overlayMode = mode;
        playOverlaySound(mode);
        overlay.classList.add('show');
        overlaySub.classList.remove('hidden');
        overlaySub.classList.remove('celebration');
        overlayStats.classList.remove('hidden');
        overlayStats.classList.remove('compact');
        overlayActions.classList.remove('single');
        overlayTargetStat.classList.remove('hidden');
        overlayLevelStat.classList.remove('hidden');
        overlaySecondary.classList.remove('hidden');
        overlayScore.textContent = String(state.score);
        overlayTarget.textContent = String(state.target);
        overlayLevel.textContent = state.level;
        if (mode === 'win') {
          overlayTitle.textContent = `Score ${state.score}`;
          overlaySub.textContent = pickCelebrationEmojis();
          overlaySub.classList.add('celebration');
          overlayStats.classList.add('hidden');
          overlaySecondary.classList.add('hidden');
          overlayPrimary.textContent = 'Next Level';
        } else {
          overlayTitle.textContent = 'Out of moves 🥲';
          overlaySub.classList.add('hidden');
          overlayStats.classList.add('compact');
          overlayActions.classList.add('single');
          overlayLevelStat.classList.add('hidden');
          overlaySecondary.classList.add('hidden');
          overlayPrimary.textContent = 'Keep Playing';
        }
        syncWakeLock();
      }

      function hideOverlay() {
        overlay.classList.remove('show');
        state.overlayMode = null;
        syncWakeLock();
      }

      function pickCelebrationEmojis() {
        const pool = CELEBRATION_EMOJIS.slice();
        let line = '';
        for (let i = 0; i < 3; i += 1) {
          const pick = randInt(Math.random, 0, pool.length - 1);
          line += pool[pick];
          pool.splice(pick, 1);
          if (i < 2) line += ' ';
        }
        return line;
      }

      function areAdjacent(a, b) {
        return dist(a, b) === 1;
      }

      function swapCells(a, b) {
        const tileA = getTile(a.r, a.c);
        const tileB = getTile(b.r, b.c);
        setTile(a.r, a.c, tileB);
        setTile(b.r, b.c, tileA);
        if (tileA) {
          tileA.targetScale = 1.06;
        }
        if (tileB) {
          tileB.targetScale = 1.06;
        }
      }

      function boardIsSettled() {
        for (let r = 0; r < state.rows; r += 1) {
          for (let c = 0; c < state.cols; c += 1) {
            const tile = state.board[r][c];
            if (!tile) continue;
            if (Math.abs(tile.x - tile.col) > 0.02 || Math.abs(tile.y - tile.row) > 0.02) return false;
            if (Math.abs(tile.vx) > 0.08 || Math.abs(tile.vy) > 0.08) return false;
          }
        }
        return true;
      }

      function simulateSwapCreatesMatch(a, b) {
        const tileA = getTile(a.r, a.c);
        const tileB = getTile(b.r, b.c);
        if (!tileA || !tileB) return false;
        if (tileA.power || tileB.power) return true;
        const kindA = tileA.kind;
        const kindB = tileB.kind;

        const matchesAt = (r, c, kind) => {
          let count = 1;
          for (let x = c - 1; x >= 0; x -= 1) {
            const tile = x === a.c && r === a.r ? { kind: kindB } : x === b.c && r === b.r ? { kind: kindA } : getTile(r, x);
            if (!tile || tile.kind !== kind) break;
            count += 1;
          }
          for (let x = c + 1; x < state.cols; x += 1) {
            const tile = x === a.c && r === a.r ? { kind: kindB } : x === b.c && r === b.r ? { kind: kindA } : getTile(r, x);
            if (!tile || tile.kind !== kind) break;
            count += 1;
          }
          if (count >= 3) return true;
          count = 1;
          for (let y = r - 1; y >= 0; y -= 1) {
            const tile = c === a.c && y === a.r ? { kind: kindB } : c === b.c && y === b.r ? { kind: kindA } : getTile(y, c);
            if (!tile || tile.kind !== kind) break;
            count += 1;
          }
          for (let y = r + 1; y < state.rows; y += 1) {
            const tile = c === a.c && y === a.r ? { kind: kindB } : c === b.c && y === b.r ? { kind: kindA } : getTile(y, c);
            if (!tile || tile.kind !== kind) break;
            count += 1;
          }
          return count >= 3;
        };

        return matchesAt(a.r, a.c, kindB) || matchesAt(b.r, b.c, kindA);
      }

      function hasPossibleMove() {
        for (let r = 0; r < state.rows; r += 1) {
          for (let c = 0; c < state.cols; c += 1) {
            if (c + 1 < state.cols && simulateSwapCreatesMatch({ r, c }, { r, c: c + 1 })) return true;
            if (r + 1 < state.rows && simulateSwapCreatesMatch({ r, c }, { r: r + 1, c })) return true;
          }
        }
        return false;
      }

      function findPossibleMove() {
        for (let r = 0; r < state.rows; r += 1) {
          for (let c = 0; c < state.cols; c += 1) {
            if (c + 1 < state.cols && simulateSwapCreatesMatch({ r, c }, { r, c: c + 1 })) {
              return { from: { r, c }, to: { r, c: c + 1 } };
            }
            if (r + 1 < state.rows && simulateSwapCreatesMatch({ r, c }, { r: r + 1, c })) {
              return { from: { r, c }, to: { r: r + 1, c } };
            }
          }
        }
        return null;
      }

      function findMatches(preferred = []) {
        const hLen = Array.from({ length: state.rows }, () => Array(state.cols).fill(0));
        const vLen = Array.from({ length: state.rows }, () => Array(state.cols).fill(0));
        const matched = new Set();

        for (let r = 0; r < state.rows; r += 1) {
          let c = 0;
          while (c < state.cols) {
            const tile = getTile(r, c);
            if (!tile) {
              c += 1;
              continue;
            }
            let end = c + 1;
            while (end < state.cols && getTile(r, end) && getTile(r, end).kind === tile.kind) end += 1;
            const length = end - c;
            if (length >= 3) {
              for (let x = c; x < end; x += 1) {
                hLen[r][x] = length;
                matched.add(keyOf(r, x));
              }
            }
            c = end;
          }
        }

        for (let c = 0; c < state.cols; c += 1) {
          let r = 0;
          while (r < state.rows) {
            const tile = getTile(r, c);
            if (!tile) {
              r += 1;
              continue;
            }
            let end = r + 1;
            while (end < state.rows && getTile(end, c) && getTile(end, c).kind === tile.kind) end += 1;
            const length = end - r;
            if (length >= 3) {
              for (let y = r; y < end; y += 1) {
                vLen[y][c] = length;
                matched.add(keyOf(y, c));
              }
            }
            r = end;
          }
        }

        if (!matched.size) return { cells: [], specials: [] };

        const visited = new Set();
        const specials = [];
        const allCells = [];
        const preferredKeys = new Set(preferred.map(({ r, c }) => keyOf(r, c)));
        let bonusSpecials = 0;

        matched.forEach((key) => {
          if (visited.has(key)) return;
          const queue = [parseKey(key)];
          const component = [];
          visited.add(key);
          for (let head = 0; head < queue.length; head += 1) {
            const cell = queue[head];
            component.push(cell);
            allCells.push(cell);
            const neighbors = [
              { r: cell.r - 1, c: cell.c },
              { r: cell.r + 1, c: cell.c },
              { r: cell.r, c: cell.c - 1 },
              { r: cell.r, c: cell.c + 1 }
            ];
            for (const next of neighbors) {
              const nextKey = keyOf(next.r, next.c);
              if (!matched.has(nextKey) || visited.has(nextKey)) continue;
              visited.add(nextKey);
              queue.push(next);
            }
          }

          let hasCross = false;
          let maxLen = 0;
          let rowPower = false;
          let colPower = false;
          let anchor = component[0];
          let bestScore = -1;

          for (const cell of component) {
            const score = (preferredKeys.has(keyOf(cell.r, cell.c)) ? 100 : 0) + hLen[cell.r][cell.c] + vLen[cell.r][cell.c];
            if (score > bestScore) {
              bestScore = score;
              anchor = cell;
            }
            if (hLen[cell.r][cell.c] >= 3 && vLen[cell.r][cell.c] >= 3) hasCross = true;
            if (hLen[cell.r][cell.c] === 4) rowPower = true;
            if (vLen[cell.r][cell.c] === 4) colPower = true;
            maxLen = Math.max(maxLen, hLen[cell.r][cell.c], vLen[cell.r][cell.c]);
          }

          let power = null;
          if (maxLen >= 7) power = pickVariedPower(['meteor', 'vortex']);
          else if (hasCross && component.length >= 7) power = pickVariedPower(['vortex', 'meteor']);
          else if (hasCross) power = pickVariedPower(['bomb', 'row', 'col']);
          else if (maxLen >= 6) power = pickVariedPower(['lightning', 'prism', 'vortex']);
          else if (maxLen >= 5) power = pickVariedPower(['prism', 'lightning']);
          else if (rowPower) power = pickVariedPower(['row', 'col', 'bomb']);
          else if (colPower) power = pickVariedPower(['col', 'row', 'bomb']);
          else if (bonusSpecials < BONUS_MATCH_POWER_MAX_PER_CLEAR && maxLen >= 3) {
            const extraChance = clamp(
              BONUS_MATCH_POWER_BASE_CHANCE + Math.max(0, state.comboChain - 1) * BONUS_MATCH_POWER_COMBO_STEP,
              0,
              BONUS_MATCH_POWER_MAX_CHANCE
            );
            if (state.rng() < extraChance) {
              const bonusPool = component.length >= 5 && state.rng() < 0.32
                ? ['bomb', 'row', 'col']
                : ['row', 'col', 'bomb'];
              power = pickVariedPower(bonusPool);
              bonusSpecials += 1;
            }
          }

          if (power) specials.push({ ...anchor, power });
        });

        return { cells: allCells, specials };
      }

      // Effects and score feedback
      function getComboCallout(comboChain) {
        if (comboChain >= 6) return `${pickRandom(COMBO_FACES.massive)} ${pickRandom(COMBO_CALLOUTS.massive)}`;
        if (comboChain >= 5) return `${pickRandom(COMBO_FACES.big)} ${pickRandom(COMBO_CALLOUTS.big)}`;
        if (comboChain >= 4) return `${pickRandom(COMBO_FACES.rising)} ${pickRandom(COMBO_CALLOUTS.rising)}`;
        return `${pickRandom(COMBO_FACES.starter)} ${pickRandom(COMBO_CALLOUTS.starter)}`;
      }

      function addPopup(c, r, text, color = '#ffffff', life = 0.85, scale = 1, options = {}) {
        const quality = getQualityProfile();
        if (state.popups.length >= quality.maxPopups) state.popups.shift();
        state.popups.push({
          x: c,
          y: r,
          text,
          color,
          life,
          maxLife: life,
          scale,
          drift: (Math.random() - 0.5) * 0.22,
          backdrop: Boolean(options.backdrop)
        });
      }

      function addBeam(type, points, color, life = 0.24, width = 1) {
        const quality = getQualityProfile();
        if (state.beams.length >= quality.maxBeams) state.beams.shift();
        state.beams.push({ type, points, color, life, maxLife: life, width });
      }

      function addPulse(c, r, color, size = 1.2, life = 0.32) {
        const quality = getQualityProfile();
        if (state.pulses.length >= quality.maxPulses) state.pulses.shift();
        state.pulses.push({ x: c, y: r, color, size, life, maxLife: life });
      }

      function addGlow(c, r, color, size = 1.12, life = 0.28, intensity = 0.58) {
        const quality = getQualityProfile();
        if (quality.maxGlows <= 0) return;
        if (state.glows.length >= quality.maxGlows) state.glows.shift();
        state.glows.push({
          x: c,
          y: r,
          color,
          size,
          life,
          maxLife: life,
          intensity: intensity * quality.pulseFill
        });
      }

      function addTrail(c, r, color, vx = 0, vy = 0, size = 0.12, life = 0.14) {
        const quality = getQualityProfile();
        if (quality.maxTrails <= 0) return;
        if (state.trails.length >= quality.maxTrails) state.trails.shift();
        state.trails.push({
          x: c,
          y: r,
          vx,
          vy,
          color,
          size,
          life,
          maxLife: life
        });
      }

      function addParticles(c, r, kind, amount = 8, power = null) {
        const quality = getQualityProfile();
        const effectBudget = getEffectBudgetScale();
        const scaledAmount = Math.max(1, Math.round(amount * quality.particleScale * effectBudget));
        const available = quality.maxParticles - state.particles.length;
        const burstCount = Math.min(scaledAmount, available);
        if (burstCount <= 0) return;
        const baseEmoji = emojiForKind(kind);
        const burstEmoji = ['✨', '💫', baseEmoji, power ? POWER_EMOJI[power] : '✨'];
        for (let i = 0; i < burstCount; i += 1) {
          const angle = (i / burstCount) * TAU + Math.random() * 0.45;
          const isSpark = Math.random() < 0.48;
          const speed = isSpark ? 1 + Math.random() * 2.35 : 0.7 + Math.random() * 1.8;
          const life = isSpark ? 0.24 + Math.random() * 0.18 : 0.48 + Math.random() * 0.22;
          state.particles.push({
            x: c + 0.5,
            y: r + 0.5,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.45,
            life,
            maxLife: life,
            emoji: isSpark ? null : burstEmoji[Math.floor(Math.random() * burstEmoji.length)],
            color: isSpark ? (power ? POWER_COLORS[power] : colorForKind(kind)) : null,
            shape: isSpark ? 'spark' : 'emoji',
            gravity: isSpark ? 3.4 : 2.8,
            drag: isSpark ? 2.1 : 0,
            size: isSpark ? 0.09 + Math.random() * 0.07 : 0.22 + Math.random() * 0.2,
            spin: (Math.random() - 0.5) * 7,
            rot: Math.random() * TAU
          });
        }
        addGlow(c + 0.5, r + 0.5, power ? POWER_COLORS[power] : colorForKind(kind), power ? 1.24 : 0.9, power ? 0.36 : 0.24, power ? 0.76 : 0.5);
      }

      function shake(amount) {
        const quality = getQualityProfile();
        const mobileDampen = MOBILE_SAFE_RENDERING ? 0.55 : 1;
        const scaled = amount * 0.09 * quality.shakeScale * getEffectBudgetScale() * mobileDampen;
        if (scaled <= 0.01) return;
        const angle = Math.random() * TAU;
        state.shake.vx += Math.cos(angle) * scaled * 10.5;
        state.shake.vy += Math.sin(angle) * scaled * 10.5;
      }

      function flash(amount) {
        state.flash = Math.max(state.flash, amount * getQualityProfile().flash);
      }

      function pickKindsOnBoard(count = 1, excludedKinds = []) {
        const excluded = new Set(excludedKinds);
        const kinds = [];
        const seen = new Set();
        for (let r = 0; r < state.rows; r += 1) {
          for (let c = 0; c < state.cols; c += 1) {
            const tile = getTile(r, c);
            if (!tile || tile.removing || excluded.has(tile.kind) || seen.has(tile.kind)) continue;
            seen.add(tile.kind);
            kinds.push(tile.kind);
          }
        }
        for (let i = kinds.length - 1; i > 0; i -= 1) {
          const j = randInt(state.rng, 0, i);
          [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
        }
        return kinds.slice(0, Math.max(0, count));
      }

      function addSquareBlast(cells, centerRow, centerCol, radius = 1) {
        for (let r = centerRow - radius; r <= centerRow + radius; r += 1) {
          for (let c = centerCol - radius; c <= centerCol + radius; c += 1) {
            if (isInside(r, c)) cells.add(keyOf(r, c));
          }
        }
      }

      function getPowerTargets(tile, contextKind = null, options = {}) {
        const suppressVisuals = Boolean(options.suppressVisuals);
        const cells = new Set([keyOf(tile.row, tile.col)]);
        if (!suppressVisuals) {
          addGlow(tile.col + 0.5, tile.row + 0.5, POWER_COLORS[tile.power] || '#ffffff', 1.22, 0.34, 0.72);
        }
        if (tile.power === 'row') {
          for (let c = 0; c < state.cols; c += 1) cells.add(keyOf(tile.row, c));
          if (!suppressVisuals) {
            addBeam('line', [{ r: tile.row + 0.5, c: 0 }, { r: tile.row + 0.5, c: state.cols }], POWER_COLORS.row, 0.22, 0.22);
          }
        } else if (tile.power === 'col') {
          for (let r = 0; r < state.rows; r += 1) cells.add(keyOf(r, tile.col));
          if (!suppressVisuals) {
            addBeam('line', [{ r: 0, c: tile.col + 0.5 }, { r: state.rows, c: tile.col + 0.5 }], POWER_COLORS.col, 0.22, 0.22);
          }
        } else if (tile.power === 'bomb') {
          for (let r = tile.row - 1; r <= tile.row + 1; r += 1) {
            for (let c = tile.col - 1; c <= tile.col + 1; c += 1) {
              if (isInside(r, c)) cells.add(keyOf(r, c));
            }
          }
          if (!suppressVisuals) {
            addPulse(tile.col + 0.5, tile.row + 0.5, POWER_COLORS.bomb, 1.5, 0.36);
          }
        } else if (tile.power === 'prism') {
          const targetKind = contextKind == null ? tile.kind : contextKind;
          for (let r = 0; r < state.rows; r += 1) {
            for (let c = 0; c < state.cols; c += 1) {
              const current = getTile(r, c);
              if (current && current.kind === targetKind) cells.add(keyOf(r, c));
            }
          }
          if (!suppressVisuals) {
            addPulse(tile.col + 0.5, tile.row + 0.5, POWER_COLORS.prism, 2.1, 0.5);
          }
        } else if (tile.power === 'lightning') {
          for (let c = 0; c < state.cols; c += 1) cells.add(keyOf(tile.row, c));
          for (let r = 0; r < state.rows; r += 1) cells.add(keyOf(r, tile.col));
          for (let d = -Math.max(state.rows, state.cols); d <= Math.max(state.rows, state.cols); d += 1) {
            const r1 = tile.row + d;
            const c1 = tile.col + d;
            const r2 = tile.row + d;
            const c2 = tile.col - d;
            if (isInside(r1, c1)) cells.add(keyOf(r1, c1));
            if (isInside(r2, c2)) cells.add(keyOf(r2, c2));
          }
          if (!suppressVisuals) {
            addBeam('line', [{ r: tile.row + 0.5, c: 0 }, { r: tile.row + 0.5, c: state.cols }], POWER_COLORS.lightning, 0.24, 0.18);
            addBeam('line', [{ r: 0, c: tile.col + 0.5 }, { r: state.rows, c: tile.col + 0.5 }], POWER_COLORS.lightning, 0.24, 0.18);
            addBeam('line', [{ r: tile.row - tile.col, c: 0 }, { r: tile.row - tile.col + state.cols, c: state.cols }], POWER_COLORS.lightning, 0.2, 0.12);
            addBeam('line', [{ r: tile.row + tile.col + 1, c: 0 }, { r: tile.row + tile.col + 1 - state.cols, c: state.cols }], POWER_COLORS.lightning, 0.2, 0.12);
          }
        } else if (tile.power === 'vortex') {
          for (let c = 0; c < state.cols; c += 1) cells.add(keyOf(tile.row, c));
          for (let r = 0; r < state.rows; r += 1) cells.add(keyOf(r, tile.col));
          addSquareBlast(cells, tile.row, tile.col, 1);
          const siphonKinds = pickKindsOnBoard(2, [tile.kind]);
          if (siphonKinds.length > 0) {
            for (let r = 0; r < state.rows; r += 1) {
              for (let c = 0; c < state.cols; c += 1) {
                const current = getTile(r, c);
                if (current && siphonKinds.includes(current.kind)) cells.add(keyOf(r, c));
              }
            }
            if (!suppressVisuals) {
              addPopup(tile.col + 0.5, tile.row - 0.2, 'Vortex ' + siphonKinds.map(emojiForKind).join(' '), '#9eeeff', 0.95, 1.12);
            }
          }
          if (!suppressVisuals) {
            addPulse(tile.col + 0.5, tile.row + 0.5, POWER_COLORS.vortex, 1.8, 0.42);
            addBeam('line', [{ r: tile.row + 0.5, c: 0 }, { r: tile.row + 0.5, c: state.cols }], POWER_COLORS.vortex, 0.26, 0.18);
            addBeam('line', [{ r: 0, c: tile.col + 0.5 }, { r: state.rows, c: tile.col + 0.5 }], POWER_COLORS.vortex, 0.26, 0.18);
          }
        } else if (tile.power === 'meteor') {
          const strikeCount = Math.max(3, Math.min(6, Math.round((state.rows + state.cols) / 3.6)));
          for (let i = 0; i < strikeCount; i += 1) {
            const hitR = randInt(state.rng, 0, state.rows - 1);
            const hitC = randInt(state.rng, 0, state.cols - 1);
            addSquareBlast(cells, hitR, hitC, 1);
            if (!suppressVisuals) {
              addPulse(hitC + 0.5, hitR + 0.5, POWER_COLORS.meteor, 1.28, 0.3);
              const spread = state.rng() * 0.7 - 0.35;
              addBeam('line', [{ r: -0.4, c: hitC + 0.5 + spread }, { r: hitR + 0.5, c: hitC + 0.5 }], POWER_COLORS.meteor, 0.2, 0.1);
            }
          }
          if (!suppressVisuals) {
            addPopup(tile.col + 0.5, tile.row - 0.2, 'Meteor Rain!', '#ffd0ad', 0.95, 1.14);
            addPulse(tile.col + 0.5, tile.row + 0.5, POWER_COLORS.meteor, 2, 0.44);
          }
        }
        return Array.from(cells).map(parseKey);
      }

      // Power-up resolution and cascades
      function pickLuckyCascadeCells() {
        const patterns = [
          [{ r: 0, c: -1 }, { r: 0, c: 0 }, { r: 0, c: 1 }],
          [{ r: -1, c: 0 }, { r: 0, c: 0 }, { r: 1, c: 0 }],
          [{ r: -1, c: 0 }, { r: 0, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 }],
          [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }]
        ];

        for (let attempt = 0; attempt < 22; attempt += 1) {
          const anchor = {
            r: randInt(state.rng, 0, state.rows - 1),
            c: randInt(state.rng, 0, state.cols - 1)
          };
          const pattern = patterns[randInt(state.rng, 0, patterns.length - 1)];
          const seen = new Set();
          const cells = [];
          for (const offset of pattern) {
            const r = anchor.r + offset.r;
            const c = anchor.c + offset.c;
            if (!isInside(r, c)) continue;
            const tile = getTile(r, c);
            if (!tile || tile.removing) continue;
            const key = keyOf(r, c);
            if (seen.has(key)) continue;
            seen.add(key);
            cells.push({ r, c });
          }
          if (cells.length >= 3) return cells;
        }
        return [];
      }

      function tryTriggerLuckyCascade() {
        if (state.luckyCascadeUsed || state.comboChain < 1) return false;
        const driftPenalty = state.levelInfo
          ? clamp((state.levelInfo.drift - 0.62) / 0.38, 0, 1) * 0.08
          : 0;
        const baseChance = LUCKY_CASCADE_BASE_CHANCE + Math.min(0.12, state.level * LUCKY_CASCADE_LEVEL_STEP);
        const comboBoost = Math.min(0.11, Math.max(0, state.comboChain - 1) * LUCKY_CASCADE_COMBO_STEP);
        const chance = clamp((baseChance + comboBoost - driftPenalty) * getEffectBudgetScale(), 0, LUCKY_CASCADE_MAX_CHANCE);
        if (Math.random() > chance) return false;

        const bonusCells = pickLuckyCascadeCells();
        if (bonusCells.length < 3) return false;

        const center = bonusCells.reduce(
          (acc, cell) => ({ x: acc.x + cell.c + 0.5, y: acc.y + cell.r + 0.5 }),
          { x: 0, y: 0 }
        );
        const centerX = center.x / bonusCells.length;
        const centerY = center.y / bonusCells.length;

        state.luckyCascadeUsed = true;
        state.comboChain = Math.max(1, state.comboChain + 1);
        addPopup(centerX, centerY - 0.18, 'Lucky Cascade!', '#9fffb7', 0.95, 1.34, { backdrop: true });
        addPulse(centerX, centerY, '#9fffb7', 1.32, 0.36);
        addGlow(centerX, centerY, '#9fffb7', 1.48, 0.42, 0.8);
        flash(0.15);
        shake(12);
        startClearSequence(bonusCells, [], { luckyCascade: true });
        return true;
      }

      function tryGrantSecondWind() {
        if (state.secondWindUsed || state.moves > 0 || state.score >= state.target) return false;
        const progress = state.target > 0 ? clamp(state.score / state.target, 0, 1) : 0;
        const levelBonus = Math.min(SECOND_WIND_LEVEL_MAX_BONUS, Math.max(0, state.level - 1) * SECOND_WIND_LEVEL_STEP);
        const chance = clamp(
          SECOND_WIND_BASE_CHANCE + progress * SECOND_WIND_PROGRESS_BONUS + levelBonus,
          0,
          SECOND_WIND_MAX_CHANCE
        );
        if (state.rng() > chance) return false;

        const deficitRatio = state.target > 0 ? clamp((state.target - state.score) / state.target, 0, 1) : 1;
        const grantedMoves = deficitRatio > 0.7
          ? 7
          : deficitRatio > 0.5
            ? 6
            : deficitRatio > 0.32
              ? 5
              : 4;

        state.secondWindUsed = true;
        state.moves = Math.max(state.moves, grantedMoves);
        state.comboChain = 0;
        state.displayChain = 1;
        state.luckyCascadeUsed = false;

        addPopup(
          state.cols * 0.5,
          state.rows * 0.48,
          `Second Wind +${grantedMoves} moves!`,
          '#9fffb7',
          1.08,
          1.24,
          { backdrop: true }
        );
        addPulse(state.cols * 0.5, state.rows * 0.52, '#9fffb7', 1.26, 0.34);
        addGlow(state.cols * 0.5, state.rows * 0.52, '#9fffb7', 1.44, 0.4, 0.76);
        flash(0.13);
        shake(11);

        if (!hasPossibleMove()) {
          shuffleBoard(false);
        } else {
          state.phase = 'idle';
          clearIdleHint(true);
          updateHud();
        }
        return true;
      }

      function collectClears(initialCells, options = {}) {
        const clearSet = new Set(initialCells.map(({ r, c }) => keyOf(r, c)));
        const queue = [...initialCells];
        const triggered = new Set();
        const specialAnchors = new Set((options.specials || []).map((s) => keyOf(s.r, s.c)));
        const maxPowerVisuals = Math.max(2, options.maxPowerVisuals ?? MAX_POWER_VISUALS_PER_CLEAR);
        let activatedPowerCount = 0;
        let shownPowerVisuals = 0;
        let accumulatedPowerShake = 0;
        let peakPowerFlash = 0;

        for (let head = 0; head < queue.length; head += 1) {
          const cell = queue[head];
          if (!isInside(cell.r, cell.c)) continue;
          const tile = getTile(cell.r, cell.c);
          if (!tile || !tile.power || triggered.has(tile.id)) continue;
          if (specialAnchors.has(keyOf(cell.r, cell.c)) && options.keepSpecialAnchors) continue;
          triggered.add(tile.id);
          activatedPowerCount += 1;
          const showPowerVisual = shownPowerVisuals < maxPowerVisuals;
          const targets = getPowerTargets(tile, options.targetKind, { suppressVisuals: !showPowerVisual });
          const shakeByPower = { bomb: 12, prism: 14, lightning: 11, vortex: 13, meteor: 16 };
          const flashByPower = { bomb: 0.16, prism: 0.22, lightning: 0.16, vortex: 0.2, meteor: 0.24 };
          if (showPowerVisual) {
            shownPowerVisuals += 1;
            addPopup(tile.col + 0.5, tile.row + 0.15, POWER_EMOJI[tile.power], POWER_COLORS[tile.power], 0.7, 1.18);
            accumulatedPowerShake += shakeByPower[tile.power] || 10;
            peakPowerFlash = Math.max(peakPowerFlash, flashByPower[tile.power] || 0.14);
          }
          for (const target of targets) {
            const k = keyOf(target.r, target.c);
            if (!clearSet.has(k)) {
              clearSet.add(k);
              queue.push(target);
            }
          }
        }

        if (options.keepSpecialAnchors) {
          for (const key of specialAnchors) clearSet.delete(key);
        }
        if (accumulatedPowerShake > 0) {
          shake(Math.min(MAX_POWER_SHAKE_PER_CLEAR, accumulatedPowerShake * 0.55));
        }
        if (peakPowerFlash > 0) {
          flash(peakPowerFlash);
        }

        return {
          cells: Array.from(clearSet).map(parseKey),
          activatedPowerCount
        };
      }

      function computeClearPhaseSeconds(cellCount, activatedPowerCount, spawnedSpecialCount, comboChain, luckyCascade = false) {
        const duration = CLEAR_PHASE_BASE_SECONDS +
          Math.min(0.055, cellCount * CLEAR_PHASE_PER_CELL_SECONDS) +
          activatedPowerCount * CLEAR_PHASE_PER_POWER_SECONDS +
          spawnedSpecialCount * CLEAR_PHASE_PER_SPAWN_SECONDS +
          Math.max(0, comboChain - 1) * CLEAR_PHASE_PER_COMBO_SECONDS +
          (luckyCascade ? 0.012 : 0);
        return clamp(duration, CLEAR_PHASE_BASE_SECONDS, CLEAR_PHASE_MAX_SECONDS);
      }

      function startClearSequence(baseCells, specials = [], options = {}) {
        if (state.pendingClear || state.phase === 'clearing') return;
        const totalBoardCells = Math.max(1, state.rows * state.cols);
        const baseCoverage = baseCells.length / totalBoardCells;
        const { cells, activatedPowerCount } = collectClears(baseCells, {
          specials,
          keepSpecialAnchors: true,
          targetKind: options.targetKind ?? null,
          maxPowerVisuals: baseCoverage >= MASS_CLEAR_COVERAGE ? 3 : MAX_POWER_VISUALS_PER_CLEAR
        });
        const clearPhaseSeconds = computeClearPhaseSeconds(
          cells.length,
          activatedPowerCount,
          specials.length,
          state.comboChain,
          Boolean(options.luckyCascade)
        );
        const removeBaseSeconds = clearPhaseSeconds * 0.88;
        const clearCoverage = cells.length / totalBoardCells;
        const massiveClear = cells.length >= MASS_CLEAR_MIN_CELLS && clearCoverage >= MASS_CLEAR_COVERAGE;
        const removeJitterMin = massiveClear ? MASS_CLEAR_REMOVE_JITTER_MIN : CLEAR_REMOVE_JITTER_MIN;
        const removeJitterMax = massiveClear ? MASS_CLEAR_REMOVE_JITTER_MAX : CLEAR_REMOVE_JITTER_MAX;

        const spawnKeys = new Set(specials.map((s) => keyOf(s.r, s.c)));
        const liveCells = [];
        for (const cell of cells) {
          const tile = getTile(cell.r, cell.c);
          if (!tile) continue;
          liveCells.push({ cell, tile });
        }
        if (liveCells.length === 0) {
          state.phase = 'settling';
          return;
        }

        let centerX = 0;
        let centerY = 0;
        for (const entry of liveCells) {
          centerX += entry.cell.c + 0.5;
          centerY += entry.cell.r + 0.5;
        }
        centerX /= liveCells.length;
        centerY /= liveCells.length;

        let maxCenterDistance = 0;
        for (const entry of liveCells) {
          const dist = Math.hypot(entry.cell.c + 0.5 - centerX, entry.cell.r + 0.5 - centerY);
          if (dist > maxCenterDistance) maxCenterDistance = dist;
        }
        const staggerWindow = massiveClear ? CLEAR_REMOVE_STAGGER_MASSIVE_SECONDS : CLEAR_REMOVE_STAGGER_BASE_SECONDS;
        let maxClearSpan = clearPhaseSeconds;

        for (const entry of liveCells) {
          const { cell, tile } = entry;
          const hash = (((cell.r + 1) * 73856093) ^ ((cell.c + 1) * 19349663) ^ ((state.comboChain + 1) * 83492791)) >>> 0;
          const hashNorm = (hash % 4096) / 4095;
          const centerDistance = Math.hypot(cell.c + 0.5 - centerX, cell.r + 0.5 - centerY);
          const wave = maxCenterDistance > 0 ? centerDistance / maxCenterDistance : 0;
          const removeDelay = staggerWindow * (massiveClear ? wave : hashNorm * 0.58);
          const jitter = lerp(removeJitterMin, removeJitterMax, hashNorm);
          const removeLife = clamp(
            removeBaseSeconds * jitter,
            CLEAR_REMOVE_MIN_DURATION_SECONDS,
            Math.max(CLEAR_REMOVE_MIN_DURATION_SECONDS, clearPhaseSeconds - removeDelay * 0.35)
          );

          tile.removing = true;
          tile.removeDelay = removeDelay;
          tile.removeLife = removeLife;
          tile.removeTimer = removeLife;
          tile.removeTargetScale = tile.power ? CLEAR_REMOVE_TARGET_SCALE_POWER : CLEAR_REMOVE_TARGET_SCALE;
          tile.targetScale = 1;
          tile.alpha = 1;
          maxClearSpan = Math.max(maxClearSpan, removeDelay + removeLife);

          const particleBurst = tile.power ? (massiveClear ? 6 : 10) : (massiveClear ? 3 : 6);
          addParticles(cell.c, cell.r, tile.kind, particleBurst, tile.power);
          const glowPatternHit = massiveClear
            ? ((cell.r * 17 + cell.c * 31 + state.comboChain) % 7 === 0)
            : ((cell.r + cell.c + state.comboChain) % 3 === 0);
          if (tile.power || glowPatternHit) {
            addGlow(
              cell.c + 0.5,
              cell.r + 0.5,
              tile.power ? POWER_COLORS[tile.power] : colorForKind(tile.kind),
              tile.power ? 1.15 : (massiveClear ? 0.72 : 0.88),
              tile.power ? 0.32 : (massiveClear ? 0.14 : 0.2),
              tile.power ? 0.72 : (massiveClear ? 0.32 : 0.45)
            );
          }
        }

        if (cells.length > 0) {
          const pulseColor = state.comboChain >= 2 ? '#8ef3ff' : '#ffd97a';
          const pulseSize = clamp(0.9 + cells.length * 0.05, 0.9, 1.75);
          addPulse(centerX, centerY, pulseColor, pulseSize, 0.26 + Math.min(0.14, cells.length * 0.01));
          addGlow(centerX, centerY, pulseColor, pulseSize + 0.15, 0.3, 0.54);
        }

        for (const special of specials) {
          const tile = getTile(special.r, special.c);
          if (!tile) continue;
          tile.targetScale = 1.16;
          addPopup(special.c + 0.5, special.r - 0.15, POWER_EMOJI[special.power], POWER_COLORS[special.power], 0.85, 1.1);
        }

        const bonus = Math.round(
          cells.length * SCORE_RULES.baseTile * (1 + Math.max(0, state.comboChain - 1) * SCORE_RULES.comboFactor) +
          activatedPowerCount * SCORE_RULES.powerBonus +
          specials.length * SCORE_RULES.spawnBonus +
          (cells.length >= 8 ? SCORE_RULES.bigCombo : 0)
        );

        state.score += bonus;
        state.runScore += bonus;
        state.displayChain = Math.max(1, state.comboChain);
        playMatchSound(cells, specials, activatedPowerCount, state.comboChain);
        addPopup(state.cols * 0.5, -0.2, '+' + bonus.toLocaleString(), '#fff2a8', 1.05, 1.28);
        if (state.comboChain >= 2) {
          const comboText = getComboCallout(state.comboChain) + ' ' + state.comboChain + 'x combo!';
          addPopup(state.cols * 0.5, state.rows * 0.45, comboText, '#8ef3ff', COMBO_POPUP_LIFE_SECONDS, 1.5, { backdrop: true });
          flash((0.08 + state.comboChain * 0.02) * (massiveClear ? 0.7 : 1));
          shake(7 + state.comboChain * 2);
        }
        if (cells.length >= 10 || activatedPowerCount >= 2) {
          addPopup(state.cols * 0.5, state.rows * 0.35, 'Sweet Burst!', '#ffd97a', 0.95, 1.4, { backdrop: true });
        }

        state.pendingClear = {
          timer: maxClearSpan,
          cells,
          specials,
          spawnKeys
        };
        state.phase = 'clearing';
        updateHud();
      }

      function applySpecialCombo(tileA, tileB) {
        const a = tileA.power;
        const b = tileB.power;
        const origin = { r: (tileA.row + tileB.row) * 0.5, c: (tileA.col + tileB.col) * 0.5 };
        const clear = new Set([keyOf(tileA.row, tileA.col), keyOf(tileB.row, tileB.col)]);
        const specials = [];
        let targetKind = null;

        const addRange = (rowStart, rowEnd, colStart, colEnd) => {
          for (let r = rowStart; r <= rowEnd; r += 1) {
            for (let c = colStart; c <= colEnd; c += 1) {
              if (isInside(r, c)) clear.add(keyOf(r, c));
            }
          }
        };

        const addKindClear = (kind) => {
          for (let r = 0; r < state.rows; r += 1) {
            for (let c = 0; c < state.cols; c += 1) {
              const tile = getTile(r, c);
              if (tile && tile.kind === kind) clear.add(keyOf(r, c));
            }
          }
        };

        const addLineForPower = (power, row, col) => {
          if (power === 'row' || power === 'vortex' || power === 'lightning') {
            for (let c = 0; c < state.cols; c += 1) clear.add(keyOf(row, c));
          }
          if (power === 'col' || power === 'vortex' || power === 'lightning') {
            for (let r = 0; r < state.rows; r += 1) clear.add(keyOf(r, col));
          }
          if (power === 'lightning') {
            for (let d = -Math.max(state.rows, state.cols); d <= Math.max(state.rows, state.cols); d += 1) {
              const r1 = row + d;
              const c1 = col + d;
              const r2 = row + d;
              const c2 = col - d;
              if (isInside(r1, c1)) clear.add(keyOf(r1, c1));
              if (isInside(r2, c2)) clear.add(keyOf(r2, c2));
            }
          }
        };

        const addMeteorBurst = (strikeCount, radius) => {
          for (let i = 0; i < strikeCount; i += 1) {
            const hitR = randInt(state.rng, 0, state.rows - 1);
            const hitC = randInt(state.rng, 0, state.cols - 1);
            addSquareBlast(clear, hitR, hitC, radius);
            addPulse(hitC + 0.5, hitR + 0.5, POWER_COLORS.meteor, 1.34 + radius * 0.22, 0.3);
            const spread = state.rng() * 0.8 - 0.4;
            addBeam('line', [{ r: -0.4, c: hitC + 0.5 + spread }, { r: hitR + 0.5, c: hitC + 0.5 }], POWER_COLORS.meteor, 0.2, 0.1 + radius * 0.02);
          }
        };

        if (a === 'prism' && b === 'prism') {
          for (let r = 0; r < state.rows; r += 1) {
            for (let c = 0; c < state.cols; c += 1) clear.add(keyOf(r, c));
          }
          addPopup(origin.c + 0.5, origin.r + 0.2, 'Prismatic Nova', '#ffd97a', 1.2, 1.65);
          flash(0.32);
          shake(18);
        } else if (a === 'prism' || b === 'prism') {
          const prismTile = a === 'prism' ? tileA : tileB;
          const otherTile = prismTile === tileA ? tileB : tileA;
          targetKind = otherTile.kind;
          addPopup(origin.c + 0.5, origin.r + 0.1, 'Color Wipe', '#ffe48a', 1, 1.45);
          for (let r = 0; r < state.rows; r += 1) {
            for (let c = 0; c < state.cols; c += 1) {
              const tile = getTile(r, c);
              if (tile && tile.kind === targetKind) {
                if (otherTile.power && tile.id !== otherTile.id) tile.power = otherTile.power;
                clear.add(keyOf(r, c));
              }
            }
          }
          flash(0.28);
          shake(16);
        } else if (a === 'meteor' || b === 'meteor') {
          const bothMeteor = a === 'meteor' && b === 'meteor';
          const otherPower = a === 'meteor' ? b : a;
          addMeteorBurst(bothMeteor ? 10 : 7, bothMeteor ? 2 : 1);
          if (otherPower === 'bomb') {
            addRange(Math.round(origin.r) - 2, Math.round(origin.r) + 2, Math.round(origin.c) - 2, Math.round(origin.c) + 2);
          } else if (otherPower && otherPower !== 'meteor') {
            addLineForPower(otherPower, Math.round(origin.r), Math.round(origin.c));
          }
          addPopup(origin.c + 0.5, origin.r + 0.1, bothMeteor ? 'Extinction Event' : 'Meteor Storm', '#ffc296', 1.05, bothMeteor ? 1.62 : 1.5);
          flash(bothMeteor ? 0.33 : 0.28);
          shake(bothMeteor ? 20 : 17);
        } else if (a === 'vortex' || b === 'vortex') {
          const bothVortex = a === 'vortex' && b === 'vortex';
          const siphonKinds = pickKindsOnBoard(bothVortex ? 3 : 2, []);
          for (const kind of siphonKinds) addKindClear(kind);
          addRange(Math.round(origin.r) - 1, Math.round(origin.r) + 1, 0, state.cols - 1);
          addRange(0, state.rows - 1, Math.round(origin.c) - 1, Math.round(origin.c) + 1);
          if (bothVortex) {
            addRange(0, 0, 0, state.cols - 1);
            addRange(state.rows - 1, state.rows - 1, 0, state.cols - 1);
            addRange(0, state.rows - 1, 0, 0);
            addRange(0, state.rows - 1, state.cols - 1, state.cols - 1);
          }
          const siphonText = siphonKinds.length ? ' ' + siphonKinds.map(emojiForKind).join(' ') : '';
          addPopup(origin.c + 0.5, origin.r + 0.1, 'Vortex Surge' + siphonText, '#9eeeff', 1.04, bothVortex ? 1.54 : 1.42);
          flash(bothVortex ? 0.3 : 0.24);
          shake(bothVortex ? 19 : 16);
        } else if ((a === 'bomb' && b === 'bomb')) {
          addRange(Math.min(tileA.row, tileB.row) - 2, Math.max(tileA.row, tileB.row) + 2, Math.min(tileA.col, tileB.col) - 2, Math.max(tileA.col, tileB.col) + 2);
          addPopup(origin.c + 0.5, origin.r + 0.1, 'Mega Blast', '#ff946d', 1, 1.52);
          flash(0.22);
          shake(18);
        } else if ((a === 'row' || a === 'col') && (b === 'row' || b === 'col')) {
          for (let dr = -1; dr <= 1; dr += 1) {
            const row = Math.round(origin.r) + dr;
            if (row >= 0 && row < state.rows) for (let c = 0; c < state.cols; c += 1) clear.add(keyOf(row, c));
          }
          for (let dc = -1; dc <= 1; dc += 1) {
            const col = Math.round(origin.c) + dc;
            if (col >= 0 && col < state.cols) for (let r = 0; r < state.rows; r += 1) clear.add(keyOf(r, col));
          }
          addPopup(origin.c + 0.5, origin.r + 0.1, 'Crossfire', '#8ef3ff', 1, 1.4);
          flash(0.18);
          shake(14);
        } else if ((a === 'bomb' && (b === 'row' || b === 'col' || b === 'lightning')) || (b === 'bomb' && (a === 'row' || a === 'col' || a === 'lightning'))) {
          addRange(Math.round(origin.r) - 1, Math.round(origin.r) + 1, 0, state.cols - 1);
          addRange(0, state.rows - 1, Math.round(origin.c) - 1, Math.round(origin.c) + 1);
          addPopup(origin.c + 0.5, origin.r + 0.1, 'Shockwave', '#8dffb8', 1, 1.46);
          flash(0.2);
          shake(16);
        } else {
          for (let c = 0; c < state.cols; c += 1) clear.add(keyOf(tileA.row, c));
          for (let r = 0; r < state.rows; r += 1) clear.add(keyOf(r, tileA.col));
          for (let d = -Math.max(state.rows, state.cols); d <= Math.max(state.rows, state.cols); d += 1) {
            const r1 = tileA.row + d;
            const c1 = tileA.col + d;
            const r2 = tileA.row + d;
            const c2 = tileA.col - d;
            if (isInside(r1, c1)) clear.add(keyOf(r1, c1));
            if (isInside(r2, c2)) clear.add(keyOf(r2, c2));
          }
          addPopup(origin.c + 0.5, origin.r + 0.1, 'Storm Chain', '#c7a2ff', 1.05, 1.48);
          flash(0.24);
          shake(18);
        }

        startClearSequence(Array.from(clear).map(parseKey), specials, { targetKind });
      }

      function activateSinglePowerSwap(powerTile, otherTile) {
        let targetKind = null;
        if (powerTile.power === 'prism') targetKind = otherTile.kind;
        startClearSequence([
          { r: powerTile.row, c: powerTile.col },
          { r: otherTile.row, c: otherTile.col }
        ], [], { targetKind });
      }

      function attemptSwap(a, b) {
        if (!areAdjacent(a, b) || overlay.classList.contains('show') || isSettingsMenuOpen()) return;
        if (state.phase !== 'idle' && state.phase !== 'settling') return;
        const tileA = getTile(a.r, a.c);
        const tileB = getTile(b.r, b.c);
        if (!tileA || !tileB) return;

        state.selected = null;
        notePlayerActivity();
        swapCells(a, b);
        state.pendingSwap = {
          from: a,
          to: b,
          tileA,
          tileB,
          powerCombo: Boolean(tileA.power && tileB.power),
          singlePower: Boolean(tileA.power || tileB.power)
        };
        state.phase = 'swapping';
      }

      function resolveAfterSwap() {
        if (!state.pendingSwap) return;
        const { from, to, tileA, tileB, powerCombo, singlePower } = state.pendingSwap;
        state.pendingSwap = null;

        if (powerCombo) {
          state.moves = Math.max(0, state.moves - 1);
          state.comboChain = 1;
          state.luckyCascadeUsed = false;
          applySpecialCombo(tileA, tileB);
          updateHud();
          return;
        }

        if (singlePower) {
          state.moves = Math.max(0, state.moves - 1);
          state.comboChain = 1;
          state.luckyCascadeUsed = false;
          activateSinglePowerSwap(tileA.power ? tileA : tileB, tileA.power ? tileB : tileA);
          updateHud();
          return;
        }

        const matches = findMatches([from, to]);
        if (matches.cells.length > 0) {
          state.moves = Math.max(0, state.moves - 1);
          state.comboChain = 1;
          state.luckyCascadeUsed = false;
          startClearSequence(matches.cells, matches.specials);
          updateHud();
        } else {
          swapCells(from, to);
          state.phase = 'swap-back';
        }
      }

      function commitClearSequence() {
        if (!state.pendingClear) return;
        for (const cell of state.pendingClear.cells) {
          const tile = getTile(cell.r, cell.c);
          if (!tile) continue;
          setTile(cell.r, cell.c, null);
        }
        for (const special of state.pendingClear.specials) {
          let tile = getTile(special.r, special.c);
          if (!tile) {
            tile = createTile(randomKind(state.rng), special.r, special.c, special.power, state.rows);
            setTile(special.r, special.c, tile);
          }
          tile.power = special.power;
          tile.removing = false;
          tile.removeDelay = 0;
          tile.removeTimer = 0;
          tile.removeLife = 0;
          tile.removeTargetScale = 1;
          tile.alpha = 1;
          tile.targetScale = 1.1;
          trackSpawnedPower(special.power);
        }
        state.pendingClear = null;
        collapseBoard();
      }

      function collapseBoard() {
        let chaosDrops = 0;
        for (let c = 0; c < state.cols; c += 1) {
          let writeRow = state.rows - 1;
          for (let r = state.rows - 1; r >= 0; r -= 1) {
            const tile = getTile(r, c);
            if (!tile) continue;
            if (writeRow !== r) {
              state.board[writeRow][c] = tile;
              tile.row = writeRow;
              tile.col = c;
              state.board[r][c] = null;
            }
            writeRow -= 1;
          }
          const spawnCount = writeRow + 1;
          for (let r = writeRow; r >= 0; r -= 1) {
            const kind = randomKind(state.rng);
            const chaosPower = pickChaosDropPower(chaosDrops);
            const tile = createTile(kind, r, c, chaosPower, spawnCount + randInt(state.rng, 1, 3));
            tile.scale = 0.8;
            tile.targetScale = 1;
            state.board[r][c] = tile;
            if (chaosPower) {
              chaosDrops += 1;
              trackSpawnedPower(chaosPower);
            }
          }
        }
        if (chaosDrops > 0) {
          state.chaosDryStreak = 0;
          addPopup(state.cols * 0.5, -0.28, 'Chaos Drop x' + chaosDrops + '!', '#9eeeff', 0.95, 1.22, { backdrop: true });
          addPulse(state.cols * 0.5, 0.45, '#9eeeff', 1.05 + Math.min(0.85, chaosDrops * 0.08), 0.32);
          flash(0.12);
          shake(8 + chaosDrops);
        } else {
          state.chaosDryStreak = Math.min(18, state.chaosDryStreak + 1);
        }
        state.phase = 'falling';
      }

      function collectLiveBoardCells() {
        const cells = [];
        for (let r = 0; r < state.rows; r += 1) {
          for (let c = 0; c < state.cols; c += 1) {
            const tile = getTile(r, c);
            if (!tile || tile.removing) continue;
            cells.push({ r, c });
          }
        }
        return cells;
      }

      function pruneRemovedTiles() {
        const holdDuringClear = Boolean(state.pendingClear && state.phase === 'clearing');
        for (let r = 0; r < state.rows; r += 1) {
          for (let c = 0; c < state.cols; c += 1) {
            const tile = getTile(r, c);
            if (!tile || !tile.removing || tile.removeTimer > 0) continue;
            if (holdDuringClear) {
              tile.removeTimer = 0;
              tile.alpha = 0;
              continue;
            }
            setTile(r, c, null);
          }
        }
      }

      function triggerVictoryClear() {
        if (state.victoryClear) return;
        state.victoryClear = {
          mode: 'clearing',
          timer: VICTORY_CLEAR_STEP_MIN_SECONDS
        };
        state.phase = 'victory-clear';
        addPopup(state.cols * 0.5, state.rows * 0.5, 'Level Complete!', '#ffe07a', 1.2, 1.5, { backdrop: true });
        flash(0.25);
        shake(16);
      }

      function completeVictoryClear() {
        state.victoryClear = null;
        state.phase = 'paused';
        showOverlay('win');
      }

      function runVictoryClearStep() {
        if (!state.victoryClear || state.victoryClear.mode !== 'clearing') return;
        const cells = collectLiveBoardCells();
        if (cells.length === 0) {
          for (let r = 0; r < state.rows; r += 1) {
            for (let c = 0; c < state.cols; c += 1) {
              if (getTile(r, c)) return;
            }
          }
          completeVictoryClear();
          return;
        }

        const blastCount = Math.min(cells.length, Math.max(VICTORY_CLEAR_MIN_BLAST_CELLS, Math.ceil(cells.length * VICTORY_CLEAR_BLAST_RATIO)));
        for (let i = 0; i < blastCount; i += 1) {
          const pickIndex = randInt(Math.random, 0, cells.length - 1);
          const [cell] = cells.splice(pickIndex, 1);
          const tile = getTile(cell.r, cell.c);
          if (!tile) continue;
          tile.removing = true;
          tile.removeDelay = 0;
          tile.removeLife = VICTORY_CLEAR_REMOVE_BASE_SECONDS + Math.random() * VICTORY_CLEAR_REMOVE_JITTER_SECONDS;
          tile.removeTimer = tile.removeLife;
          tile.removeTargetScale = 0.12;
          tile.targetScale = 0.12;
          const burstColor = tile.power ? POWER_COLORS[tile.power] : colorForKind(tile.kind);
          addParticles(cell.c, cell.r, tile.kind, tile.power ? 12 : 9, tile.power);
          addPulse(cell.c + 0.5, cell.r + 0.5, burstColor, tile.power ? 1.18 : 0.96, 0.24 + Math.random() * 0.08);
          addGlow(cell.c + 0.5, cell.r + 0.5, burstColor, tile.power ? 1.34 : 1.02, 0.22 + Math.random() * 0.08, tile.power ? 0.88 : 0.66);
          if (Math.random() < 0.45) {
            addTrail(
              cell.c + 0.5,
              cell.r + 0.5,
              burstColor,
              randFloat(-1.2, 1.2),
              randFloat(-1.5, -0.35),
              0.1 + Math.random() * 0.08,
              0.14 + Math.random() * 0.06
            );
          }
        }
        flash(0.08);
        shake(10);
      }

      function shuffleBoard(costMove = false) {
        if (costMove && state.moves < 2) return;
        notePlayerActivity();
        const tiles = [];
        for (let r = 0; r < state.rows; r += 1) {
          for (let c = 0; c < state.cols; c += 1) {
            const tile = getTile(r, c);
            if (!tile) continue;
            tiles.push(tile);
            state.board[r][c] = null;
          }
        }

        let attempts = 0;
        do {
          attempts += 1;
          for (let i = tiles.length - 1; i > 0; i -= 1) {
            const j = Math.floor(state.rng() * (i + 1));
            [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
          }
          let index = 0;
          for (let r = 0; r < state.rows; r += 1) {
            for (let c = 0; c < state.cols; c += 1) {
              const tile = tiles[index++];
              tile.row = r;
              tile.col = c;
              tile.power = null;
              tile.targetScale = 1;
              state.board[r][c] = tile;
            }
          }
          if (attempts > 20) {
            generateBoard();
            break;
          }
        } while (findMatches().cells.length > 0 || !hasPossibleMove());

        if (costMove) state.moves = Math.max(0, state.moves - 2);
        state.comboChain = 0;
        state.displayChain = 1;
        state.luckyCascadeUsed = false;
        state.phase = 'settling';
        playShuffleSound();
        flash(0.14);
        shake(10);
        updateHud();
      }

      function updateSimulation(dt) {
        if (!state.started || state.board.length !== state.rows) return;
        updatePerformanceBudget(dt);
        const quality = getQualityProfile();
        const effectBudget = getEffectBudgetScale();
        state.flash = Math.max(0, state.flash - dt * 1.8);
        const shake = state.shake;
        shake.x += shake.vx * dt;
        shake.y += shake.vy * dt;
        shake.vx += (-shake.x * 96 - shake.vx * 24) * dt;
        shake.vy += (-shake.y * 96 - shake.vy * 24) * dt;
        if (Math.abs(shake.x) < 0.001) shake.x = 0;
        if (Math.abs(shake.y) < 0.001) shake.y = 0;
        if (Math.abs(shake.vx) < 0.001) shake.vx = 0;
        if (Math.abs(shake.vy) < 0.001) shake.vy = 0;
        if (!overlay.classList.contains('show') && !isSettingsMenuOpen() && state.phase === 'idle') {
          state.idleHintTimer += dt;
          if (state.idleHintTimer >= IDLE_HINT_DELAY_SECONDS && !state.hintMove) {
            state.hintMove = findPossibleMove();
          }
        } else {
          clearIdleHint(false);
        }
        const selected = state.selected;
        const board = state.board;

        for (let r = 0; r < state.rows; r += 1) {
          const row = board[r];
          for (let c = 0; c < state.cols; c += 1) {
            const tile = row[c];
            if (!tile) continue;
            const k = tile.removing ? 300 : 260;
            const damping = tile.removing ? 40 : 34;
            const dx = tile.col - tile.x;
            const dy = tile.row - tile.y;
            tile.vx += (dx * k - tile.vx * damping) * dt;
            tile.vy += (dy * k - tile.vy * damping) * dt;
            tile.x += tile.vx * dt;
            tile.y += tile.vy * dt;
            if (tile.removing) {
              if (tile.removeDelay > 0) {
                tile.removeDelay = Math.max(0, tile.removeDelay - dt);
                tile.targetScale = 1;
                tile.alpha = 1;
              } else {
                tile.targetScale = tile.removeTargetScale || tile.targetScale;
                tile.removeTimer = Math.max(0, tile.removeTimer - dt);
                const removeLife = Math.max(0.001, tile.removeLife || CLEAR_PHASE_BASE_SECONDS);
                const progress = clamp(1 - tile.removeTimer / removeLife, 0, 1);
                tile.alpha = 1 - easeOutCubic(progress);
              }
            }
            const scaleLerpSpeed = tile.removing ? CLEAR_REMOVE_SCALE_LERP_SPEED : 40;
            tile.scale += (tile.targetScale - tile.scale) * Math.min(1, dt * scaleLerpSpeed);
            if (!tile.removing) tile.targetScale += (1 - tile.targetScale) * Math.min(1, dt * 34);
            if (selected && selected.r === r && selected.c === c) {
              tile.selectedBoost = Math.min(1, tile.selectedBoost + dt * 8);
            } else {
              tile.selectedBoost = Math.max(0, tile.selectedBoost - dt * 8);
            }
            if (!tile.removing) {
              tile.alpha += (1 - tile.alpha) * Math.min(1, dt * 12);
              if ((state.phase === 'falling' || state.phase === 'swapping' || state.phase === 'settling') && quality.maxTrails > 0) {
                const velocity = Math.hypot(tile.vx, tile.vy);
                if (velocity > 3 && Math.random() < dt * 14 * quality.trailRate * effectBudget) {
                  const trailColor = tile.power ? POWER_COLORS[tile.power] : colorForKind(tile.kind);
                  const trailStrength = clamp((velocity - 3) / 8, 0, 1);
                  addTrail(
                    tile.x + 0.5,
                    tile.y + 0.5,
                    trailColor,
                    -tile.vx * 0.038,
                    -tile.vy * 0.038,
                    0.09 + trailStrength * 0.13,
                    0.11 + trailStrength * 0.08
                  );
                }
              }
            }
          }
        }

        for (let i = state.particles.length - 1; i >= 0; i -= 1) {
          const particle = state.particles[i];
          particle.life -= dt;
          particle.x += particle.vx * dt;
          particle.y += particle.vy * dt;
          particle.vy += (particle.gravity || 2.8) * dt;
          if (particle.drag > 0) {
            const drag = Math.max(0, 1 - particle.drag * dt);
            particle.vx *= drag;
            particle.vy *= drag;
          }
          particle.rot += particle.spin * dt;
          if (particle.life <= 0) state.particles.splice(i, 1);
        }

        for (let i = state.popups.length - 1; i >= 0; i -= 1) {
          const popup = state.popups[i];
          popup.life -= dt;
          popup.y -= dt * 0.9;
          popup.x += popup.drift * dt;
          if (popup.life <= 0) state.popups.splice(i, 1);
        }

        for (let i = state.beams.length - 1; i >= 0; i -= 1) {
          state.beams[i].life -= dt;
          if (state.beams[i].life <= 0) state.beams.splice(i, 1);
        }

        for (let i = state.pulses.length - 1; i >= 0; i -= 1) {
          state.pulses[i].life -= dt;
          if (state.pulses[i].life <= 0) state.pulses.splice(i, 1);
        }

        for (let i = state.glows.length - 1; i >= 0; i -= 1) {
          state.glows[i].life -= dt;
          if (state.glows[i].life <= 0) state.glows.splice(i, 1);
        }

        for (let i = state.trails.length - 1; i >= 0; i -= 1) {
          const trail = state.trails[i];
          trail.life -= dt;
          trail.x += trail.vx * dt;
          trail.y += trail.vy * dt;
          if (trail.life <= 0) state.trails.splice(i, 1);
        }

        pruneRemovedTiles();

        if (state.pendingClear) {
          state.pendingClear.timer -= dt;
          if (state.pendingClear.timer <= 0) commitClearSequence();
        }

        if (state.phase === 'victory-clear' && state.victoryClear) {
          state.victoryClear.timer -= dt;
          if (state.victoryClear.timer <= 0) {
            runVictoryClearStep();
            if (state.victoryClear && state.victoryClear.mode === 'clearing') {
              state.victoryClear.timer = randFloat(VICTORY_CLEAR_STEP_MIN_SECONDS, VICTORY_CLEAR_STEP_MAX_SECONDS);
            }
          }
        }

        if ((state.phase === 'swapping' || state.phase === 'swap-back' || state.phase === 'falling' || state.phase === 'settling') && boardIsSettled()) {
          if (state.phase === 'swapping') {
            resolveAfterSwap();
          } else if (state.phase === 'swap-back') {
            state.phase = 'idle';
            state.luckyCascadeUsed = false;
          } else {
            const matches = findMatches();
            if (matches.cells.length > 0) {
              state.comboChain = Math.max(1, state.comboChain + 1);
              startClearSequence(matches.cells, matches.specials);
            } else if (tryTriggerLuckyCascade()) {
              // Lucky cascade starts its own clear sequence.
            } else if (state.score >= state.target) {
              triggerVictoryClear();
            } else if (state.moves <= 0) {
              if (!tryGrantSecondWind()) {
                state.phase = 'paused';
                showOverlay('lose');
              }
            } else if (!hasPossibleMove()) {
              shuffleBoard(false);
            } else {
              state.comboChain = 0;
              state.displayChain = 1;
              state.luckyCascadeUsed = false;
              state.phase = 'idle';
              clearIdleHint(true);
              updateHud();
            }
          }
        }
        syncWakeLock();
      }

      function render(now) {
        const { w: width, h: height } = state.canvasSize;
        if (!width || !height) return;
        if (!state.started || state.board.length !== state.rows) return;
        ensureRenderCaches();
        const quality = getQualityProfile();

        ctx.drawImage(state.renderCache.frameLayer, 0, 0, state.renderCache.frameLayer.width, state.renderCache.frameLayer.height, 0, 0, width, height);
        ctx.save();
        const { x, y, w, h, tile } = state.boardRect;
        if (state.shake.x || state.shake.y) ctx.translate(state.shake.x, state.shake.y);
        ctx.drawImage(state.renderCache.boardLayer, 0, 0, state.renderCache.boardLayer.width, state.renderCache.boardLayer.height, 0, 0, width, height);
        // Keep high-frequency effects contained to the board to avoid GPU edge artifacts on mobile.
        ctx.save();
        traceRoundedRect(ctx, x, y, w, h, tile * 0.26);
        ctx.clip();

        for (const beam of state.beams) {
          const alpha = beam.life / beam.maxLife;
          ctx.save();
          ctx.globalAlpha = alpha * 0.32;
          ctx.strokeStyle = beam.color;
          ctx.lineWidth = tile * beam.width * 1.9;
          ctx.lineCap = 'round';
          const start = beam.points[0];
          const end = beam.points[1];
          ctx.beginPath();
          ctx.moveTo(x + start.c * tile, y + start.r * tile);
          ctx.lineTo(x + end.c * tile, y + end.r * tile);
          ctx.stroke();
          ctx.globalAlpha = alpha * 0.95;
          ctx.lineWidth = tile * beam.width;
          ctx.beginPath();
          ctx.moveTo(x + start.c * tile, y + start.r * tile);
          ctx.lineTo(x + end.c * tile, y + end.r * tile);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.globalAlpha = alpha * 0.42;
          ctx.lineWidth = tile * beam.width * 0.42;
          ctx.beginPath();
          ctx.moveTo(x + start.c * tile, y + start.r * tile);
          ctx.lineTo(x + end.c * tile, y + end.r * tile);
          ctx.stroke();
          ctx.restore();
        }

        for (const pulse of state.pulses) {
          const t = 1 - pulse.life / pulse.maxLife;
          const radius = tile * lerp(0.32, pulse.size, easeOutCubic(t));
          ctx.save();
          if (quality.pulseFill > 0) {
            const centerX = x + pulse.x * tile;
            const centerY = y + pulse.y * tile;
            const fillGradient = ctx.createRadialGradient(centerX, centerY, radius * 0.06, centerX, centerY, radius);
            fillGradient.addColorStop(0, toRgba(pulse.color, (1 - t) * 0.44 * quality.pulseFill));
            fillGradient.addColorStop(0.55, toRgba(pulse.color, (1 - t) * 0.2 * quality.pulseFill));
            fillGradient.addColorStop(1, toRgba(pulse.color, 0));
            ctx.fillStyle = fillGradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, TAU);
            ctx.fill();
          }
          ctx.globalAlpha = (1 - t) * 0.55 * (0.7 + quality.pulseFill * 0.3);
          ctx.strokeStyle = pulse.color;
          ctx.lineWidth = tile * 0.11;
          ctx.beginPath();
          ctx.arc(x + pulse.x * tile, y + pulse.y * tile, radius, 0, TAU);
          ctx.stroke();
          ctx.restore();
        }

        if (state.glows.length > 0) {
          ctx.save();
          ctx.globalCompositeOperation = MOBILE_SAFE_RENDERING ? 'source-over' : 'lighter';
          for (const glow of state.glows) {
            const t = 1 - glow.life / glow.maxLife;
            const alpha = (1 - t) * glow.intensity;
            const radius = tile * lerp(0.2, glow.size, easeOutCubic(t));
            const centerX = x + glow.x * tile;
            const centerY = y + glow.y * tile;
            const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.06, centerX, centerY, radius);
            gradient.addColorStop(0, toRgba(glow.color, alpha * 0.95));
            gradient.addColorStop(0.55, toRgba(glow.color, alpha * 0.24));
            gradient.addColorStop(1, toRgba(glow.color, 0));
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, TAU);
            ctx.fill();
          }
          ctx.restore();
        }

        if (state.trails.length > 0) {
          ctx.save();
          ctx.globalCompositeOperation = MOBILE_SAFE_RENDERING ? 'source-over' : 'lighter';
          for (const trail of state.trails) {
            const alpha = clamp(trail.life / trail.maxLife, 0, 1) * 0.72;
            const radius = tile * trail.size;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = trail.color;
            ctx.beginPath();
            ctx.arc(x + trail.x * tile, y + trail.y * tile, radius, 0, TAU);
            ctx.fill();
          }
          ctx.restore();
        }

        const drawTiles = [];
        for (let r = 0; r < state.rows; r += 1) {
          const row = state.board[r];
          if (!row) continue;
          for (let c = 0; c < state.cols; c += 1) {
            const tileData = row[c];
            if (tileData) drawTiles.push(tileData);
          }
        }
        const idlePhase = state.phase === 'idle' || state.phase === 'paused';
        if (!idlePhase) {
          drawTiles.sort((a, b) => a.y - b.y);
        }

        for (const tileData of drawTiles) {
          const centerX = x + (tileData.x + 0.5) * tile;
          const centerY = y + (tileData.y + 0.5) * tile;
          const isHinted = state.hintMove && tileData.row === state.hintMove.from.r && tileData.col === state.hintMove.from.c;
          const scale = tileData.scale * (1 + tileData.selectedBoost * 0.08);
          const size = tile * scale;
          const left = centerX - size * 0.5;
          const top = centerY - size * 0.5;
          const sprite = getTileSprite(tileData.kind, tileData.power);

          ctx.save();
          ctx.globalAlpha = tileData.alpha;
          if (sprite) {
            ctx.drawImage(sprite, 0, 0, sprite.width, sprite.height, left, top, size, size);
          } else {
            const fallbackColor = colorForKind(tileData.kind);
            const innerSize = size * 0.86;
            const innerLeft = centerX - innerSize * 0.5;
            const innerTop = centerY - innerSize * 0.5;
            const grad = ctx.createLinearGradient(innerLeft, innerTop, innerLeft + innerSize, innerTop + innerSize);
            grad.addColorStop(0, 'rgba(255,255,255,0.08)');
            grad.addColorStop(0.12, toRgba(fallbackColor, 0.43));
            grad.addColorStop(1, 'rgba(14, 22, 40, 0.47)');
            traceRoundedRect(ctx, innerLeft, innerTop, innerSize, innerSize, tile * 0.22);
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.lineWidth = tile * 0.03;
            ctx.strokeStyle = tileData.power ? toRgba(POWER_COLORS[tileData.power], 0.53) : 'rgba(255,255,255,0.12)';
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.font = `${Math.floor(innerSize * 0.55)}px ${FONT_STACK}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emojiForKind(tileData.kind), centerX, centerY);
          }

          const highlightInset = size * 0.12;
          const highlightSize = size - highlightInset * 2;
          const highlightRadius = tile * 0.18;

          if (tileData.selectedBoost > 0) {
            ctx.lineWidth = tile * 0.035;
            ctx.strokeStyle = 'rgba(255, 240, 185, 0.9)';
            ctx.globalAlpha = tileData.alpha * tileData.selectedBoost;
            traceRoundedRect(ctx, left + highlightInset, top + highlightInset, highlightSize, highlightSize, highlightRadius);
            ctx.stroke();
          }

          if (isHinted) {
            ctx.lineWidth = tile * 0.032;
            ctx.strokeStyle = 'rgba(142, 243, 255, 0.95)';
            ctx.globalAlpha = tileData.alpha * (0.18 + Math.max(0, Math.sin(now * 4.8)) * 0.52);
            traceRoundedRect(ctx, left + highlightInset, top + highlightInset, highlightSize, highlightSize, highlightRadius);
            ctx.stroke();
          }

          ctx.restore();
        }

        for (const particle of state.particles) {
          const alpha = clamp(particle.life / particle.maxLife, 0, 1);
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.translate(x + particle.x * tile, y + particle.y * tile);
          ctx.rotate(particle.rot);
          if (particle.shape === 'spark') {
            const width = tile * particle.size * 1.6;
            const height = tile * particle.size * 0.56;
            ctx.fillStyle = particle.color || '#ffffff';
            ctx.fillRect(-width * 0.5, -height * 0.5, width, height);
          } else {
            ctx.font = `${Math.floor(tile * particle.size)}px ${FONT_STACK}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(particle.emoji || '✨', 0, 0);
          }
          ctx.restore();
        }
        ctx.restore();

        for (const popup of state.popups) {
          const alpha = clamp(popup.life / popup.maxLife, 0, 1);
          const popupX = x + popup.x * tile;
          const popupY = y + popup.y * tile;
          const fontSize = Math.floor(tile * 0.28 * popup.scale);
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.font = `900 ${fontSize}px "Trebuchet MS", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          if (popup.backdrop) {
            const metrics = ctx.measureText(popup.text);
            const paddingX = Math.max(12, fontSize * 0.45);
            const paddingY = Math.max(8, fontSize * 0.28);
            const boxWidth = metrics.width + paddingX * 2;
            const boxHeight = fontSize + paddingY * 2;
            ctx.fillStyle = 'rgba(7, 12, 24, 0.78)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
            ctx.lineWidth = Math.max(1.25, tile * 0.025);
            traceRoundedRect(ctx, popupX - boxWidth * 0.5, popupY - boxHeight * 0.5, boxWidth, boxHeight, Math.max(10, fontSize * 0.42));
            ctx.fill();
            ctx.stroke();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.32)';
            ctx.shadowBlur = Math.max(10, fontSize * 0.32);
          }

          ctx.fillStyle = popup.color;
          ctx.fillText(popup.text, popupX, popupY);
          ctx.restore();
        }

        ctx.restore();

        if (state.flash > 0) {
          ctx.save();
          ctx.globalAlpha = state.flash;
          const flashGradient = ctx.createRadialGradient(width * 0.5, height * 0.4, 10, width * 0.5, height * 0.4, Math.max(width, height) * 0.55);
          flashGradient.addColorStop(0, 'rgba(255,255,255,0.95)');
          flashGradient.addColorStop(0.28, 'rgba(255,236,188,0.38)');
          flashGradient.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = flashGradient;
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        }
      }

      // Input
      function screenToCell(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const localX = x - state.boardRect.x;
        const localY = y - state.boardRect.y;
        if (localX < 0 || localY < 0 || localX >= state.boardRect.w || localY >= state.boardRect.h) return null;
        return {
          r: Math.floor(localY / state.boardRect.tile),
          c: Math.floor(localX / state.boardRect.tile)
        };
      }

      canvas.addEventListener('pointerdown', (event) => {
        if (!state.started) return;
        primeAudio();
        const cell = screenToCell(event.clientX, event.clientY);
        if (!cell || overlay.classList.contains('show') || isSettingsMenuOpen()) return;
        notePlayerActivity();
        state.pointerStart = cell;
        canvas.setPointerCapture(event.pointerId);
        if (state.phase !== 'idle') return;
        if (!state.selected) {
          state.selected = cell;
        } else if (state.selected.r === cell.r && state.selected.c === cell.c) {
          state.selected = null;
        } else if (areAdjacent(state.selected, cell)) {
          attemptSwap(state.selected, cell);
        } else {
          state.selected = cell;
        }
      });

      canvas.addEventListener('pointermove', (event) => {
        if (!state.started) return;
        const cell = screenToCell(event.clientX, event.clientY);
        if (!state.pointerStart || !cell || state.phase !== 'idle' || overlay.classList.contains('show') || isSettingsMenuOpen()) return;
        if (areAdjacent(state.pointerStart, cell) && (state.pointerStart.r !== cell.r || state.pointerStart.c !== cell.c)) {
          attemptSwap(state.pointerStart, cell);
          state.pointerStart = null;
        }
      });

      canvas.addEventListener('pointerup', () => {
        state.pointerStart = null;
      });

      shuffleBtn.addEventListener('click', () => {
        if (!state.started) return;
        primeAudio();
        if (state.phase !== 'idle' || state.moves <= 1) return;
        if (!confirmShuffle()) return;
        shuffleBoard(true);
        closeSettingsMenu();
      });

      restartBtn.addEventListener('click', () => {
        if (!state.started) return;
        primeAudio();
        if (!confirmNewRun()) return;
        startNewRun();
        closeSettingsMenu();
      });

      muteMusicBtn.addEventListener('click', () => {
        setMusicMuted(!state.audio.musicMuted);
      });

      muteFxBtn.addEventListener('click', () => {
        setFxMuted(!state.audio.fxMuted);
      });

      startBtn.addEventListener('click', () => {
        if (state.started) return;
        primeAudio();
        hideSplash();
        startNewRun();
      });

      settingsBtn.addEventListener('click', () => {
        primeAudio();
        toggleSettingsMenu();
      });

      if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
          toggleFullscreen();
        });
      }

      settingsMenu.addEventListener('click', (event) => {
        if (event.target === settingsMenu) closeSettingsMenu();
      });

      settingsPanel.addEventListener('click', (event) => {
        event.stopPropagation();
      });

      overlayPrimary.addEventListener('click', () => {
        primeAudio();
        closeSettingsMenu();
        if (state.overlayMode === 'win') {
          resetForNewLevel(state.level + 1, true);
        } else {
          resetForNewLevel(state.level, true);
        }
      });

      overlaySecondary.addEventListener('click', () => {
        primeAudio();
        closeSettingsMenu();
        if (!confirmNewRun()) return;
        startNewRun();
      });

      window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeSettingsMenu();
      });

      document.addEventListener('fullscreenchange', updateFullscreenButtonState);
      document.addEventListener('webkitfullscreenchange', updateFullscreenButtonState);

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible') {
          pauseAudioForBackground();
          releaseWakeLock();
          return;
        }
        resumeAudioFromBackground();
        if (state.wakeLock.shouldHold) {
          requestWakeLock();
        }
      });

      window.addEventListener('pagehide', () => {
        pauseAudioForBackground();
        releaseWakeLock();
      });

      window.addEventListener('resize', resizeCanvas, { passive: true });
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', resizeCanvas, { passive: true });
      }
      window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 40), { passive: true });
      if (typeof ResizeObserver === 'function') {
        const footerResizeObserver = new ResizeObserver(() => {
          const nextFooterLayoutKey = getFooterLayoutKey();
          if (nextFooterLayoutKey === footerLayoutKey) return;
          footerLayoutKey = nextFooterLayoutKey;
          resizeCanvas();
        });
        footerResizeObserver.observe(footer);
      }

      let last = performance.now();
      function frame(nowMs) {
        const now = nowMs * 0.001;
        const dt = Math.min((nowMs - last) * 0.001, 1 / 20);
        last = nowMs;
        try {
          updateSimulation(dt);
          render(now);
        } catch (error) {
          console.error('JUICYM render loop error:', error);
        }
        requestAnimationFrame(frame);
      }

      updateAudioButtons();
      updateFullscreenButtonState();
      updateHud();
      resizeCanvas();
      showSplash();
      requestAnimationFrame(frame);
    })();
