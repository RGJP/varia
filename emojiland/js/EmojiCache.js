// Pre-renders emoji text to offscreen canvases so we can use fast drawImage 
// instead of expensive fillText on every frame.
const cache = new Map();

/**
 * Returns a cached canvas containing the pre-rendered emoji.
 * @param {string} emoji  The emoji string to render
 * @param {number} size   The font size in pixels
 * @returns {{ canvas: OffscreenCanvas|HTMLCanvasElement, width: number, height: number }}
 */
export function getEmojiCanvas(emoji, size, hasStroke = false) {
    const key = `${emoji}_${size}_${hasStroke ? 'stroke' : 'nostroke'}`;
    if (cache.has(key)) return cache.get(key);

    // Create a temporary context to measure text
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    const fontStack = `${size}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Segoe UI Symbol", "Android Emoji", "EmojiSymbols", Arial, sans-serif`;
    tempCtx.font = fontStack;
    const metrics = tempCtx.measureText(emoji);
    const textWidth = metrics.width;

    // Use OffscreenCanvas if available, otherwise fallback
    const padding = Math.ceil(size * (hasStroke ? 0.4 : 0.3)); // extra space for emoji overflow
    const width = Math.ceil(textWidth + padding * 2);
    const height = Math.ceil(size + padding * 2);

    let canvas;
    try {
        canvas = new OffscreenCanvas(width, height);
    } catch {
        canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
    }

    const ctx = canvas.getContext('2d');
    ctx.font = fontStack;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (hasStroke) {
        ctx.lineJoin = 'round';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000000';
        ctx.strokeText(emoji, width / 2, height / 2);
    }

    ctx.fillText(emoji, width / 2, height / 2);

    const entry = { canvas, width, height };
    cache.set(key, entry);
    return entry;
}

/**
 * Clear the entire cache (e.g. on level reload).
 */
export function clearEmojiCache() {
    cache.clear();
}
