// Client-side image handling: decode uploads, downscale them, and pull out
// the dominant colors so uploaded work gets a palette like the samples do.

const MAX_BYTES = 20 * 1024 * 1024;

export function loadImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('That file isn\'t an image. Choose a JPG, PNG, WebP or GIF.'));
      return;
    }
    if (file.size > MAX_BYTES) {
      reject(new Error('That image is over 20 MB. Choose a smaller file.'));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That image couldn\'t be opened. Try another file.')); };
    img.src = url;
  });
}

export function extractColors(source, count = 5) {
  const size = 48;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  const buckets = new Map();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const key = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
    const b = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
    b.n += 1;
    b.r += data[i];
    b.g += data[i + 1];
    b.b += data[i + 2];
    buckets.set(key, b);
  }
  const ranked = [...buckets.values()].sort((a, b) => b.n - a.n).map((b) => [b.r / b.n, b.g / b.n, b.b / b.n]);
  const picked = [];
  for (const col of ranked) {
    if (picked.every((o) => Math.hypot(o[0] - col[0], o[1] - col[1], o[2] - col[2]) > 48)) picked.push(col);
    if (picked.length === count) break;
  }
  return picked
    .sort((a, b) => (b[0] * 0.3 + b[1] * 0.59 + b[2] * 0.11) - (a[0] * 0.3 + a[1] * 0.59 + a[2] * 0.11))
    .map((col) => `#${col.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`);
}

// Returns a post image spec: a JPEG data URL no larger than 1600px on its long side.
export async function prepareArtwork(file) {
  const img = await loadImage(file);
  const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return { kind: 'upload', src: canvas.toDataURL('image/jpeg', 0.85), ratio: Math.round((w / h) * 1000) / 1000, colors: extractColors(canvas) };
}

// Square-crops a photo for use as an avatar.
export async function prepareAvatar(file) {
  const img = await loadImage(file);
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const out = 320;
  const canvas = document.createElement('canvas');
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, out, out);
  ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, out, out);
  return canvas.toDataURL('image/jpeg', 0.88);
}
