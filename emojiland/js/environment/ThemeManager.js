export const THEMES = {
    VOLCANIC: {
        name: 'Volcanic/Inferno',
        skyGradient: ['#1a0505', '#ff4500'],
        cloudColor: 'rgba(50, 50, 50, 0.6)',
        mountainColor: '#2a0a0a',
        hillColor: '#4a0f0f',
        platform: {
            dirt: '#1a0d0d',
            grass: '#ff4500',
            texture: '#3d0000',
            outline: '#b22222'
        },
        particleColor: '#ff4500',
        backgroundStyle: 'volcano'
    },
    FOREST: {
        name: 'Forest (Enchanted/Ancient)',
        skyGradient: ['#0a2a0a', '#2e7d32'],
        cloudColor: 'rgba(200, 255, 200, 0.4)',
        mountainColor: '#1b3a1b',
        hillColor: '#2d5a27',
        platform: {
            dirt: '#3e2723',
            grass: '#4caf50',
            texture: '#2e7d32',
            outline: '#1b5e20'
        },
        particleColor: '#81c784',
        backgroundStyle: 'forest'
    },
    SNOW: {
        name: 'Snow/Ice Land',
        skyGradient: ['#e1f5fe', '#4fc3f7'],
        cloudColor: 'rgba(255, 255, 255, 0.8)',
        mountainColor: '#b3e5fc',
        hillColor: '#81d4fa',
        platform: {
            dirt: '#e0f7fa',
            grass: '#ffffff',
            texture: '#b2ebf2',
            outline: '#80deea'
        },
        particleColor: '#ffffff',
        backgroundStyle: 'ice'
    },
    DESERT: {
        name: 'Desert (Sands of Time)',
        skyGradient: ['#fff9c4', '#fbc02d'],
        cloudColor: 'rgba(255, 24de, 179, 0.5)',
        mountainColor: '#f9a825',
        hillColor: '#fbc02d',
        platform: {
            dirt: '#8d6e63',
            grass: '#ffee58',
            texture: '#795548',
            outline: '#5d4037'
        },
        particleColor: '#fdd835',
        backgroundStyle: 'desert'
    },
    SKY: {
        name: 'Sky Islands/Cloud Realm',
        skyGradient: ['#03a9f4', '#b3e5fc'],
        cloudColor: 'rgba(255, 255, 255, 0.9)',
        mountainColor: '#ffffff',
        hillColor: '#e1f5fe',
        platform: {
            dirt: '#f5f5f5',
            grass: '#ffffff',
            texture: '#e0e0e0',
            outline: '#bdbdbd'
        },
        particleColor: '#ffffff',
        backgroundStyle: 'sky'
    },
    SWAMP: {
        name: 'Swamp/Mire',
        skyGradient: ['#1b262c', '#384d48'],
        cloudColor: 'rgba(60, 80, 60, 0.5)',
        mountainColor: '#2d3e40',
        hillColor: '#3d4d3d',
        platform: {
            dirt: '#3e2723',
            grass: '#6b8e23',
            texture: '#556b2f',
            outline: '#2e3d23'
        },
        particleColor: '#8fbc8f',
        backgroundStyle: 'swamp'
    },
    HAUNTED: {
        name: 'Haunted/Cursed Manor',
        skyGradient: ['#1a0a2a', '#4a148c'],
        cloudColor: 'rgba(100, 50, 150, 0.3)',
        mountainColor: '#311b92',
        hillColor: '#4527a0',
        platform: {
            dirt: '#212121',
            grass: '#6a1b9a',
            texture: '#4a148c',
            outline: '#311b92'
        },
        particleColor: '#ba68c8',
        backgroundStyle: 'haunted'
    },
    UNDERWATER: {
        name: 'Underwater/Aquatic Kingdom',
        skyGradient: ['#001021', '#0077be'],
        cloudColor: 'rgba(0, 150, 255, 0.2)',
        mountainColor: '#003366',
        hillColor: '#004c99',
        platform: {
            dirt: '#00264d',
            grass: '#00bfff',
            texture: '#0059b3',
            outline: '#003d7a'
        },
        particleColor: '#00ffff',
        backgroundStyle: 'underwater'
    },
    CYBERPUNK: {
        name: 'Cyberpunk/Futuristic City',
        skyGradient: ['#120458', '#000000'],
        cloudColor: 'rgba(255, 0, 255, 0.2)',
        mountainColor: '#2d005e',
        hillColor: '#0a002e',
        platform: {
            dirt: '#1a1a1a',
            grass: '#00ffcc',
            texture: '#ff00ff',
            outline: '#330066'
        },
        particleColor: '#00ffcc',
        backgroundStyle: 'cyberpunk'
    },
    ANCIENT: {
        name: 'Ancient/Tribal Ruins',
        skyGradient: ['#263238', '#546e7a'],
        cloudColor: 'rgba(144, 164, 174, 0.4)',
        mountainColor: '#37474f',
        hillColor: '#455a64',
        platform: {
            dirt: '#4e342e',
            grass: '#8d6e63',
            texture: '#6d4c41',
            outline: '#3e2723'
        },
        particleColor: '#a1887f',
        backgroundStyle: 'ancient'
    },
    FUNGUS: {
        name: 'Fungus/Spore World',
        skyGradient: ['#301934', '#df73ff'],
        cloudColor: 'rgba(223, 115, 255, 0.3)',
        mountainColor: '#4b0082',
        hillColor: '#800080',
        platform: {
            dirt: '#3b0a3b',
            grass: '#da70d6',
            texture: '#9932cc',
            outline: '#4b0082'
        },
        particleColor: '#ee82ee',
        backgroundStyle: 'fungus'
    },
    CRYSTAL: {
        name: 'Crystal Cavern',
        skyGradient: ['#004d40', '#00acc1'],
        cloudColor: 'rgba(128, 222, 234, 0.3)',
        mountainColor: '#006064',
        hillColor: '#00838f',
        platform: {
            dirt: '#003135',
            grass: '#e0f7fa',
            texture: '#4dd0e1',
            outline: '#006064'
        },
        particleColor: '#b2ebf2',
        backgroundStyle: 'crystal'
    },
    STEAMPUNK: {
        name: 'Steampunk/Victorian',
        skyGradient: ['#3e2723', '#8d6e63'],
        cloudColor: 'rgba(121, 85, 72, 0.4)',
        mountainColor: '#4e342e',
        hillColor: '#5d4037',
        platform: {
            dirt: '#2d1b11',
            grass: '#b8860b',
            texture: '#8b4513',
            outline: '#5d4037'
        },
        particleColor: '#daa520',
        backgroundStyle: 'steampunk'
    },
    DREAMSCAPE: {
        name: 'Dreamscape/Surreal',
        skyGradient: ['#ffc1cc', '#a2d2ff'],
        cloudColor: 'rgba(255, 255, 255, 0.6)',
        mountainColor: '#ff9999',
        hillColor: '#99ccff',
        platform: {
            dirt: '#f8edeb',
            grass: '#fcd5ce',
            texture: '#fae1dd',
            outline: '#d8e2dc'
        },
        particleColor: '#ffafcc',
        backgroundStyle: 'dreamscape'
    },
    PREHISTORIC: {
        name: 'Prehistoric/Dinosaur World',
        skyGradient: ['#fb8c00', '#4caf50'],
        cloudColor: 'rgba(255, 255, 200, 0.4)',
        mountainColor: '#5d4037',
        hillColor: '#795548',
        platform: {
            dirt: '#3e2723',
            grass: '#2e7d32',
            texture: '#388e3c',
            outline: '#1b5e20'
        },
        particleColor: '#8bc34a',
        backgroundStyle: 'prehistoric'
    }
};

export function getRandomTheme() {
    const keys = Object.keys(THEMES);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return THEMES[randomKey];
}
