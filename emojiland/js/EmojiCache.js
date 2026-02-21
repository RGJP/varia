// Pre-renders emoji text to offscreen canvases so we can use fast drawImage 
// instead of expensive fillText on every frame.
const cache = new Map();

/**
 * Returns a cached canvas containing the pre-rendered emoji.
 * @param {string} emoji  The emoji string to render
 * @param {number} size   The font size in pixels
 * @returns {{ canvas: OffscreenCanvas|HTMLCanvasElement, width: number, height: number }}
 */
export function getEmojiCanvas(emoji, size) {
    const key = `${emoji}_${size}`;
    if (cache.has(key)) return cache.get(key);

    // Use OffscreenCanvas if available, otherwise fallback
    const padding = Math.ceil(size * 0.3); // extra space for emoji overflow
    const canvasSize = size + padding * 2;
    let canvas;
    try {
        canvas = new OffscreenCanvas(canvasSize, canvasSize);
    } catch {
        canvas = document.createElement('canvas');
        canvas.width = canvasSize;
        canvas.height = canvasSize;
    }

    const ctx = canvas.getContext('2d');
    ctx.font = `${size}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, canvasSize / 2, canvasSize / 2);

    const entry = { canvas, width: canvasSize, height: canvasSize };
    cache.set(key, entry);
    return entry;
}

/**
 * Clear the entire cache (e.g. on level reload).
 */
export function clearEmojiCache() {
    cache.clear();
}
