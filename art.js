// Generative artwork for the sample community: post images, profile covers,
// stories and avatars are all drawn as SVG from a seed, so the app ships
// with no image files and every piece stays the same across reloads.

// Every palette runs from lightest to darkest.
export const PALETTES = {
  gouache: ['#F3E6CF', '#EDB88B', '#D07A55', '#5E8C85', '#2E4A52'],
  meadow: ['#EEF0D9', '#C9D6A3', '#8DB07A', '#4E7D5B', '#23443A'],
  sorbet: ['#FFF1E6', '#FFC2B4', '#FF8FA3', '#8E7DBE', '#3B3561'],
  bauhaus: ['#F1ECE2', '#F2B134', '#E4572E', '#2E5EAA', '#161616'],
  lagoon: ['#E9F5F2', '#9ED9CC', '#3FA7A1', '#1D5C7A', '#0E2A3F'],
  ember: ['#FFE8C2', '#FFB547', '#F0643A', '#A3284C', '#2B1330'],
  nordic: ['#E6ECF2', '#A9BCD0', '#6B8BA4', '#3A5068', '#141E2B'],
  neon: ['#F7F4FF', '#35F0C8', '#FF5DA2', '#6B4BFF', '#120D2B'],
  clay: ['#F4EDE6', '#D9B8A0', '#B37A5C', '#6E4B3A', '#2B1F1A'],
  citrus: ['#FFFBE8', '#FFE066', '#FF9F1C', '#2EC4B6', '#1B1B3A'],
  ink: ['#F5F2EA', '#D8D2C4', '#8A8478', '#3E3A34', '#141312'],
  plum: ['#F3E9F5', '#D3A5D8', '#A15DAE', '#5B2A6E', '#231030'],
  kente: ['#FFF3D6', '#FFC93C', '#E8501F', '#1E8C5A', '#1A1A1A'],
  ocean: ['#EAF4FF', '#8CC5FF', '#3D7BF2', '#2336A8', '#0B1238'],
  mono: ['#E9E8FF', '#B3AFFF', '#7068FF', '#3B34E0', '#141052'],
};

export const STYLE_PALETTES = {
  landscape: ['gouache', 'meadow', 'sorbet', 'clay', 'lagoon'],
  bauhaus: ['bauhaus', 'citrus', 'kente', 'ember'],
  spheres: ['neon', 'ocean', 'sorbet', 'plum', 'citrus'],
  wash: ['sorbet', 'lagoon', 'meadow', 'plum', 'gouache'],
  pixel: ['neon', 'ember', 'ocean', 'plum'],
  waves: ['ocean', 'nordic', 'gouache', 'ember'],
  pattern: ['kente', 'clay', 'citrus', 'bauhaus'],
  dusk: ['ember', 'nordic', 'plum', 'ocean'],
  topo: ['ink', 'clay', 'nordic'],
  memphis: ['citrus', 'neon', 'kente', 'sorbet'],
  orbit: ['kente', 'neon', 'ember', 'ocean'],
  mesh: ['sorbet', 'neon', 'lagoon', 'plum', 'ocean'],
};

export const STYLES = Object.keys(STYLE_PALETTES);

function hashSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Deterministic PRNG (mulberry32) seeded from any string.
export function rng(seed) {
  let a = hashSeed(String(seed));
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const paletteFor = (style, seed) => {
  const options = STYLE_PALETTES[style] || STYLE_PALETTES.mesh;
  return options[Math.floor(rng(`palette:${seed}`)() * options.length)];
};

const n1 = (v) => Math.round(v * 10) / 10;
const pick = (r, list) => list[Math.floor(r() * list.length)];
const between = (r, a, b) => a + r() * (b - a);

function hexToRgb(hex) {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

export function mix(a, b, t) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return `#${A.map((c, i) => Math.round(c + (B[i] - c) * t).toString(16).padStart(2, '0')).join('')}`;
}

function ramp(colors, t) {
  const x = Math.min(Math.max(t, 0), 1) * (colors.length - 1);
  const i = Math.min(Math.floor(x), colors.length - 2);
  return mix(colors[i], colors[i + 1], x - i);
}

function smoothOpen(pts) {
  let d = `M${n1(pts[0][0])},${n1(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i];
    const [nx, ny] = pts[i + 1];
    d += ` Q${n1(x)},${n1(y)} ${n1((x + nx) / 2)},${n1((y + ny) / 2)}`;
  }
  const [lx, ly] = pts[pts.length - 1];
  return `${d} L${n1(lx)},${n1(ly)}`;
}

function smoothClosed(pts) {
  const n = pts.length;
  let d = `M${n1(pts[0][0])},${n1(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${n1(c1[0])},${n1(c1[1])} ${n1(c2[0])},${n1(c2[1])} ${n1(p2[0])},${n1(p2[1])}`;
  }
  return `${d}Z`;
}

const GRAIN = '<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>';

const DRAW = {
  // Gouache hills receding into haze.
  landscape(r, p, W, H) {
    const sunX = between(r, 0.18, 0.82) * W;
    const sunY = between(r, 0.16, 0.34) * H;
    const sunR = between(r, 0.06, 0.1) * W;
    let s = `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(p[0], p[1], 0.4)}"/><stop offset="1" stop-color="${p[0]}"/></linearGradient></defs>`;
    s += `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
    s += `<circle cx="${n1(sunX)}" cy="${n1(sunY)}" r="${n1(sunR)}" fill="${mix(p[1], p[2], 0.55)}"/>`;
    const layers = 5;
    for (let i = 0; i < layers; i++) {
      const t = i / (layers - 1);
      const base = H * (0.42 + t * 0.42);
      const amp = H * (0.16 - t * 0.08);
      const n = 6 + Math.floor(r() * 3);
      const pts = [];
      for (let k = 0; k <= n; k++) pts.push([(k / n) * (W + 80) - 40, base - r() * amp]);
      s += `<path d="${smoothOpen(pts)} L${W + 40},${H + 10} L-40,${H + 10} Z" fill="${ramp(p.slice(1), t)}"/>`;
    }
    return s;
  },

  // Poster grid of primary shapes.
  bauhaus(r, p, W, H) {
    const cols = r() < 0.5 ? 3 : 4;
    const c = W / cols;
    const rows = Math.ceil(H / c);
    let s = `<rect width="${W}" height="${H}" fill="${p[0]}"/>`;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const X = x * c;
        const Y = y * c;
        const cx = X + c / 2;
        const cy = Y + c / 2;
        const bg = pick(r, p);
        let fg = pick(r, p);
        if (fg === bg) fg = p[(p.indexOf(bg) + 2) % p.length];
        const tf = `transform="rotate(${Math.floor(r() * 4) * 90} ${n1(cx)} ${n1(cy)})"`;
        s += `<rect x="${n1(X)}" y="${n1(Y)}" width="${n1(c + 1)}" height="${n1(c + 1)}" fill="${bg}"/>`;
        switch (Math.floor(r() * 8)) {
          case 0: s += `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(c * 0.36)}" fill="${fg}"/>`; break;
          case 1: s += `<path d="M${n1(X)},${n1(cy)} A${n1(c / 2)},${n1(c / 2)} 0 0 1 ${n1(X + c)},${n1(cy)} Z" fill="${fg}" ${tf}/>`; break;
          case 2: s += `<path d="M${n1(X)},${n1(Y)} L${n1(X + c)},${n1(Y)} A${n1(c)},${n1(c)} 0 0 1 ${n1(X)},${n1(Y + c)} Z" fill="${fg}" ${tf}/>`; break;
          case 3: s += `<path d="M${n1(X)},${n1(Y + c)} L${n1(cx)},${n1(Y)} L${n1(X + c)},${n1(Y + c)} Z" fill="${fg}" ${tf}/>`; break;
          case 4: s += `<rect x="${n1(X + c * 0.22)}" y="${n1(Y + c * 0.22)}" width="${n1(c * 0.56)}" height="${n1(c * 0.56)}" fill="${fg}"/>`; break;
          case 5:
            for (let k = 0; k < 3; k++) s += `<rect x="${n1(X)}" y="${n1(Y + c * (0.16 + k * 0.28))}" width="${n1(c)}" height="${n1(c * 0.12)}" fill="${fg}" ${tf}/>`;
            break;
          case 6: s += `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(c * 0.3)}" fill="none" stroke="${fg}" stroke-width="${n1(c * 0.12)}"/>`; break;
          default: break;
        }
      }
    }
    return s;
  },

  // Soft-lit 3D spheres on a studio floor.
  spheres(r, p, W, H) {
    const hz = H * between(r, 0.55, 0.66);
    const n = 3 + Math.floor(r() * 3);
    let defs = `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(p[0], p[1], 0.28)}"/><stop offset="1" stop-color="${p[0]}"/></linearGradient><linearGradient id="fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(p[0], p[3], 0.2)}"/><stop offset="1" stop-color="${mix(p[0], p[3], 0.06)}"/></linearGradient><filter id="sh" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${n1(W * 0.012)}"/></filter>`;
    const balls = [];
    for (let i = 0; i < n; i++) {
      const depth = r();
      const R = W * (0.06 + depth * 0.12);
      balls.push({ x: between(r, 0.14, 0.86) * W, y: hz + depth * (H - hz) * 0.72 + R * 0.1, R, c: pick(r, p.slice(1)) });
    }
    balls.sort((a, b) => a.y - b.y);
    let s = `<rect width="${W}" height="${H}" fill="url(#bg)"/><rect y="${n1(hz)}" width="${W}" height="${n1(H - hz)}" fill="url(#fl)"/>`;
    balls.forEach((b, i) => {
      defs += `<radialGradient id="g${i}" cx="0.36" cy="0.32" r="0.78"><stop offset="0" stop-color="${mix(b.c, '#ffffff', 0.62)}"/><stop offset="0.45" stop-color="${b.c}"/><stop offset="1" stop-color="${mix(b.c, '#000000', 0.5)}"/></radialGradient>`;
      s += `<ellipse cx="${n1(b.x + b.R * 0.25)}" cy="${n1(b.y)}" rx="${n1(b.R * 1.1)}" ry="${n1(b.R * 0.22)}" fill="#000" opacity="0.28" filter="url(#sh)"/>`;
      s += `<circle cx="${n1(b.x)}" cy="${n1(b.y - b.R)}" r="${n1(b.R)}" fill="url(#g${i})"/>`;
    });
    return `<defs>${defs}</defs>${s}`;
  },

  // Watercolor blooms with ink stems and leaves.
  wash(r, p, W, H) {
    let s = `<defs><filter id="w" x="-30%" y="-30%" width="160%" height="160%"><feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="3" seed="${Math.floor(r() * 1000)}"/><feDisplacementMap in="SourceGraphic" scale="${n1(W * 0.07)}" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation="3"/></filter></defs>`;
    s += `<rect width="${W}" height="${H}" fill="${p[0]}"/>`;
    const blobs = 7 + Math.floor(r() * 4);
    for (let i = 0; i < blobs; i++) {
      s += `<ellipse cx="${n1(between(r, 0.05, 0.95) * W)}" cy="${n1(between(r, 0.05, 0.95) * H)}" rx="${n1(between(r, 0.12, 0.3) * W)}" ry="${n1(between(r, 0.1, 0.26) * W)}" fill="${pick(r, p.slice(1, 4))}" opacity="${n1(between(r, 0.35, 0.6))}" filter="url(#w)" style="mix-blend-mode:multiply"/>`;
    }
    const stems = 2 + Math.floor(r() * 3);
    for (let i = 0; i < stems; i++) {
      const x0 = between(r, 0.2, 0.8) * W;
      const y0 = H * 1.02;
      const x2 = x0 + between(r, -0.25, 0.25) * W;
      const y2 = between(r, 0.18, 0.45) * H;
      const x1 = (x0 + x2) / 2 + between(r, -0.2, 0.2) * W;
      const y1 = (y0 + y2) / 2;
      s += `<path d="M${n1(x0)},${n1(y0)} Q${n1(x1)},${n1(y1)} ${n1(x2)},${n1(y2)}" fill="none" stroke="${p[4]}" stroke-width="${n1(W * 0.006)}" stroke-linecap="round"/>`;
      const leaves = 4 + Math.floor(r() * 4);
      for (let k = 1; k <= leaves; k++) {
        const t = k / (leaves + 1);
        const x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * x1 + t * t * x2;
        const y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * y1 + t * t * y2;
        const side = k % 2 ? 1 : -1;
        const L = W * between(r, 0.04, 0.075) * (1 - t * 0.4);
        const angle = -side * between(r, 20, 50);
        s += `<ellipse cx="${n1(x + side * L * 0.85)}" cy="${n1(y)}" rx="${n1(L)}" ry="${n1(L * 0.38)}" fill="${pick(r, p.slice(2, 5))}" opacity="0.85" transform="rotate(${n1(angle)} ${n1(x)} ${n1(y)})"/>`;
      }
    }
    return s;
  },

  // A 32-column pixel scene with a mirrored sprite.
  pixel(r, p, W, H) {
    const cols = 32;
    const px = W / cols;
    const rows = Math.ceil(H / px);
    const cell = (x, y, c) => `<rect x="${n1(x * px)}" y="${n1(y * px)}" width="${n1(px + 0.6)}" height="${n1(px + 0.6)}" fill="${c}"/>`;
    const groundY = rows - 6;
    let s = '';
    const bands = 6;
    for (let b = 0; b < bands; b++) {
      const y0 = Math.floor((b / bands) * groundY);
      const y1 = Math.floor(((b + 1) / bands) * groundY);
      s += `<rect x="0" y="${n1(y0 * px)}" width="${W}" height="${n1((y1 - y0) * px + 0.6)}" fill="${mix(p[4], p[3], b / (bands - 1))}"/>`;
    }
    for (let i = 0; i < 26; i++) s += cell(Math.floor(r() * cols), Math.floor(r() * groundY * 0.6), i % 5 ? mix(p[0], p[4], 0.35) : p[0]);
    const mx = 3 + Math.floor(r() * (cols - 10));
    const my = 2 + Math.floor(r() * 3);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (!((x === 0 || x === 3) && (y === 0 || y === 3))) s += cell(mx + x, my + y, p[0]);
    s += `<rect x="0" y="${n1(groundY * px)}" width="${W}" height="${n1(px + 0.6)}" fill="${p[1]}"/>`;
    s += `<rect x="0" y="${n1((groundY + 1) * px)}" width="${W}" height="${n1(H - (groundY + 1) * px + 1)}" fill="${mix(p[4], p[3], 0.3)}"/>`;
    for (let i = 0; i < 28; i++) s += cell(Math.floor(r() * cols), groundY + 1 + Math.floor(r() * 5), mix(p[4], p[3], 0.55));

    const sw = 6;
    const sh = 10;
    const grid = [];
    for (let y = 0; y < sh; y++) {
      grid[y] = [];
      for (let x = 0; x < sw; x++) grid[y][x] = r() < (x === 0 ? 0.3 : 0.62) ? 1 : 0;
    }
    for (let y = 2; y < sh - 1; y++) { grid[y][sw - 1] = 1; grid[y][sw - 2] = 1; }
    const ey = 3 + Math.floor(r() * 2);
    grid[ey][3] = 1;
    grid[ey][2] = 1;
    const full = grid.map((row) => [...row, ...row.slice().reverse()]);
    const ox = Math.floor((cols - 12) / 2);
    const oy = groundY - sh;
    const body = pick(r, [p[1], p[2]]);
    const shade = mix(body, p[4], 0.35);
    const outline = mix(p[4], '#000000', 0.3);
    for (let y = -1; y <= sh; y++) {
      for (let x = -1; x <= 12; x++) {
        if (full[y]?.[x]) continue;
        const touches = [full[y - 1]?.[x], full[y + 1]?.[x], full[y]?.[x - 1], full[y]?.[x + 1]].some(Boolean);
        if (touches) s += cell(ox + x, oy + y, outline);
      }
    }
    for (let y = 0; y < sh; y++) for (let x = 0; x < 12; x++) if (full[y][x]) s += cell(ox + x, oy + y, y > sh * 0.6 ? shade : body);
    s += cell(ox + 3, oy + ey, p[0]) + cell(ox + 8, oy + ey, p[0]);
    return `<g shape-rendering="crispEdges">${s}</g>`;
  },

  // Impressionist water: broken horizontal dabs catching the sun.
  waves(r, p, W, H) {
    const hz = H * between(r, 0.38, 0.5);
    const sunX = between(r, 0.25, 0.75) * W;
    const sunR = W * between(r, 0.05, 0.08);
    const sunY = hz - sunR * between(r, 0.4, 1.6);
    let s = `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(p[1], p[0], 0.4)}"/><stop offset="1" stop-color="${p[0]}"/></linearGradient><linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(p[2], p[3], 0.3)}"/><stop offset="1" stop-color="${p[4]}"/></linearGradient></defs>`;
    s += `<rect width="${W}" height="${n1(hz + 2)}" fill="url(#sky)"/>`;
    s += `<circle cx="${n1(sunX)}" cy="${n1(sunY)}" r="${n1(sunR)}" fill="${mix(p[0], '#ffffff', 0.5)}"/>`;
    s += `<rect y="${n1(hz)}" width="${W}" height="${n1(H - hz)}" fill="url(#sea)"/>`;
    for (let i = 0; i < 26; i++) {
      s += `<rect x="${n1(between(r, -0.05, 1) * W)}" y="${n1(between(r, 0.05, 0.9) * hz)}" width="${n1(between(r, 40, 140))}" height="${n1(between(r, 6, 12))}" rx="6" fill="${pick(r, [p[0], p[1], mix(p[0], '#ffffff', 0.4)])}" opacity="${n1(between(r, 0.4, 0.8))}"/>`;
    }
    for (let i = 0; i < 190; i++) {
      const d = r() ** 0.9;
      const y = hz + 6 + d * (H - hz - 10);
      const k = 0.6 + d * 1.6;
      const w = between(r, 18, 70) * k;
      const h = between(r, 4, 9) * k;
      const x = between(r, -0.05, 1) * W;
      const near = Math.abs(x + w / 2 - sunX) < sunR * (1.1 + d * 1.4);
      const c = near ? pick(r, [p[0], mix(p[0], '#ffffff', 0.5), p[1]]) : pick(r, [p[1], p[2], p[3], p[3], p[4]]);
      s += `<rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" rx="${n1(h / 2)}" fill="${c}" opacity="${near ? 0.95 : n1(between(r, 0.45, 0.85))}"/>`;
    }
    return s;
  },

  // Textile repeat: one motif per row, colors alternating across.
  pattern(r, p, W, H) {
    const cols = 5 + Math.floor(r() * 2);
    const t = W / cols;
    const rows = Math.ceil(H / t);
    let s = `<rect width="${W}" height="${H}" fill="${p[0]}"/>`;
    for (let y = 0; y < rows; y++) {
      const motif = Math.floor(r() * 5);
      const a = pick(r, p.slice(1));
      const b = pick(r, p.slice(1).filter((c) => c !== a));
      if (r() < 0.35) s += `<rect y="${n1(y * t)}" width="${W}" height="${n1(t + 1)}" fill="${pick(r, p.filter((c) => c !== a && c !== b))}"/>`;
      for (let x = 0; x < cols; x++) {
        const X = x * t;
        const Y = y * t;
        const c1 = x % 2 ? a : b;
        const c2 = x % 2 ? b : a;
        switch (motif) {
          case 0: s += `<path d="M${n1(X)},${n1(Y + t)} A${n1(t / 2)},${n1(t / 2)} 0 0 1 ${n1(X + t)},${n1(Y + t)} Z" fill="${c1}"/>`; break;
          case 1: s += `<path d="M${n1(X)},${n1(Y)} L${n1(X + t / 2)},${n1(Y + t / 2)} L${n1(X)},${n1(Y + t)} Z M${n1(X + t)},${n1(Y)} L${n1(X + t / 2)},${n1(Y + t / 2)} L${n1(X + t)},${n1(Y + t)} Z" fill="${c1}"/>`; break;
          case 2: s += `<circle cx="${n1(X + t / 2)}" cy="${n1(Y + t / 2)}" r="${n1(t * 0.36)}" fill="${c1}"/><circle cx="${n1(X + t / 2)}" cy="${n1(Y + t / 2)}" r="${n1(t * 0.13)}" fill="${c2}"/>`; break;
          case 3: s += `<path d="M${n1(X + t / 2)},${n1(Y + t * 0.08)} L${n1(X + t * 0.92)},${n1(Y + t / 2)} L${n1(X + t / 2)},${n1(Y + t * 0.92)} L${n1(X + t * 0.08)},${n1(Y + t / 2)} Z" fill="${c1}"/>`; break;
          default:
            for (let k = 0; k < 3; k++) s += `<rect x="${n1(X + t * (0.1 + k * 0.3))}" y="${n1(Y)}" width="${n1(t * 0.18)}" height="${n1(t + 1)}" fill="${k % 2 ? c2 : c1}"/>`;
        }
      }
    }
    return s;
  },

  // Film photograph at dusk: glow, jagged ridgelines, grain and vignette.
  dusk(r, p, W, H) {
    const hz = H * between(r, 0.6, 0.72);
    const sunX = between(r, 0.25, 0.75) * W;
    let s = `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p[4]}"/><stop offset="0.55" stop-color="${p[3]}"/><stop offset="0.85" stop-color="${p[2]}"/><stop offset="1" stop-color="${p[1]}"/></linearGradient><radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${p[0]}" stop-opacity="0.95"/><stop offset="0.25" stop-color="${p[1]}" stop-opacity="0.55"/><stop offset="1" stop-color="${p[1]}" stop-opacity="0"/></radialGradient><radialGradient id="vig" cx="0.5" cy="0.5" r="0.75"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.5"/></radialGradient>${GRAIN}</defs>`;
    s += `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
    s += `<circle cx="${n1(sunX)}" cy="${n1(hz)}" r="${n1(W * 0.45)}" fill="url(#glow)"/>`;
    for (let l = 0; l < 3; l++) {
      const base = hz + l * H * 0.05;
      const amp = H * (0.22 - l * 0.06);
      const n = 9 + Math.floor(r() * 6);
      let d = `M-10,${n1(H + 10)} L-10,${n1(base - r() * amp * 0.5)}`;
      for (let k = 1; k <= n; k++) d += ` L${n1((k / n) * (W + 20) - 10)},${n1(base - r() * amp)}`;
      d += ` L${W + 10},${n1(H + 10)} Z`;
      s += `<path d="${d}" fill="${mix(p[4], '#000000', 0.15 + l * 0.2)}" opacity="${[0.55, 0.8, 1][l]}"/>`;
    }
    s += `<rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.13"/>`;
    s += `<rect width="${W}" height="${H}" fill="url(#vig)"/>`;
    return s;
  },

  // Sketchbook contour lines with every fifth line inked heavier.
  topo(r, p, W, H) {
    let s = `<rect width="${W}" height="${H}" fill="${p[0]}"/>`;
    const cx = between(r, 0.35, 0.65) * W;
    const cy = between(r, 0.35, 0.65) * H;
    s += `<circle cx="${n1(cx + between(r, -0.15, 0.15) * W)}" cy="${n1(cy + between(r, -0.15, 0.15) * H)}" r="${n1(W * between(r, 0.18, 0.3))}" fill="${p[1]}" opacity="0.6"/>`;
    const waves = Array.from({ length: 4 }, () => [between(r, 0, Math.PI * 2), between(r, 0.04, 0.12)]);
    const rings = 16;
    const step = Math.max(W, H) * 0.045;
    const pts = 40;
    for (let k = 1; k <= rings; k++) {
      const ring = [];
      for (let i = 0; i < pts; i++) {
        const a = (i / pts) * Math.PI * 2;
        let wob = 0;
        waves.forEach(([ph, amp], j) => { wob += Math.sin(a * (j + 2) + ph + k * 0.15) * amp; });
        const rad = k * step * (1 + wob);
        ring.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * 1.1]);
      }
      const index = k % 5 === 0;
      s += `<path d="${smoothClosed(ring)}" fill="none" stroke="${index ? p[4] : p[3]}" stroke-width="${index ? 3.2 : 1.6}" opacity="0.9"/>`;
    }
    return s;
  },

  // Memphis-style confetti: squiggles, rings, dots and zigzags.
  memphis(r, p, W, H) {
    const bg = pick(r, [p[0], p[1]]);
    const colors = p.filter((c) => c !== bg);
    let s = `<rect width="${W}" height="${H}" fill="${bg}"/>`;
    s += `<circle cx="${n1(between(r, 0.2, 0.8) * W)}" cy="${n1(between(r, 0.2, 0.8) * H)}" r="${n1(W * between(r, 0.18, 0.28))}" fill="${colors[0]}"/>`;
    s += `<rect x="${n1(between(r, 0, 0.6) * W)}" y="${n1(between(r, 0, 0.7) * H)}" width="${n1(W * 0.4)}" height="${n1(W * 0.16)}" fill="${colors[2]}" transform="rotate(${n1(between(r, -30, 30))} ${W / 2} ${H / 2})"/>`;
    const count = Math.round(26 * (H / W) + 10);
    for (let i = 0; i < count; i++) {
      const x = r() * W;
      const y = r() * H;
      const c = pick(r, colors);
      const size = between(r, 0.03, 0.08) * W;
      const tf = `transform="rotate(${n1(r() * 360)} ${n1(x)} ${n1(y)})"`;
      switch (Math.floor(r() * 7)) {
        case 0: {
          let d = `M${n1(x - size * 1.5)},${n1(y)}`;
          for (let k = 0; k < 4; k++) d += ` q${n1(size * 0.375)},${n1((k % 2 ? 1 : -1) * size * 0.6)} ${n1(size * 0.75)},0`;
          s += `<path d="${d}" fill="none" stroke="${c}" stroke-width="${n1(size * 0.22)}" stroke-linecap="round" ${tf}/>`;
          break;
        }
        case 1: s += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(size * 0.6)}" fill="${c}"/>`; break;
        case 2: s += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(size * 0.7)}" fill="none" stroke="${c}" stroke-width="${n1(size * 0.22)}"/>`; break;
        case 3: s += `<path d="M${n1(x)},${n1(y - size)} L${n1(x + size)},${n1(y + size * 0.7)} L${n1(x - size)},${n1(y + size * 0.7)} Z" fill="${c}" ${tf}/>`; break;
        case 4:
          for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) s += `<circle cx="${n1(x + a * size * 0.5)}" cy="${n1(y + b * size * 0.5)}" r="${n1(size * 0.09)}" fill="${c}"/>`;
          break;
        case 5: s += `<rect x="${n1(x - size)}" y="${n1(y - size * 0.3)}" width="${n1(size * 2)}" height="${n1(size * 0.6)}" rx="${n1(size * 0.3)}" fill="${c}" ${tf}/>`; break;
        default: {
          let d = `M${n1(x - size)},${n1(y)}`;
          for (let k = 0; k < 4; k++) d += ` l${n1(size * 0.5)},${n1((k % 2 ? 1 : -1) * size * 0.5)}`;
          s += `<path d="${d}" fill="none" stroke="${c}" stroke-width="${n1(size * 0.18)}" stroke-linejoin="round" stroke-linecap="round" ${tf}/>`;
        }
      }
    }
    return s;
  },

  // Afrofuturist orbits: arcs, moons and a glowing planet on a night sky.
  orbit(r, p, W, H) {
    const cx = W / 2 + between(r, -0.1, 0.1) * W;
    const cy = H / 2 + between(r, -0.08, 0.08) * H;
    let s = `<defs><radialGradient id="pl" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="${p[1]}"/><stop offset="1" stop-color="${p[2]}"/></radialGradient></defs><rect width="${W}" height="${H}" fill="${p[4]}"/>`;
    for (let i = 0; i < 70; i++) s += `<circle cx="${n1(r() * W)}" cy="${n1(r() * H)}" r="${n1(between(r, 0.8, 2.6))}" fill="${p[0]}" opacity="${n1(between(r, 0.3, 0.9))}"/>`;
    const rings = 6 + Math.floor(r() * 4);
    for (let k = 0; k < rings; k++) {
      const R = W * (0.16 + k * 0.055);
      const circ = 2 * Math.PI * R;
      const arc = circ * between(r, 0.15, 0.7);
      s += `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(R)}" fill="none" stroke="${pick(r, p.slice(0, 4))}" stroke-width="${n1(between(r, 5, 22))}" stroke-dasharray="${n1(arc)} ${n1(circ)}" stroke-linecap="round" transform="rotate(${n1(r() * 360)} ${n1(cx)} ${n1(cy)})"/>`;
      if (r() < 0.4) {
        const a = r() * Math.PI * 2;
        s += `<circle cx="${n1(cx + Math.cos(a) * R)}" cy="${n1(cy + Math.sin(a) * R)}" r="${n1(between(r, 8, 20))}" fill="${pick(r, [p[0], p[1]])}"/>`;
      }
    }
    s += `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(W * 0.11)}" fill="url(#pl)"/>`;
    return s;
  },

  // Blurred color fields with a little grain.
  mesh(r, p, W, H) {
    let s = `<defs><filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${n1(W * 0.08)}"/></filter>${GRAIN}</defs>`;
    s += `<rect width="${W}" height="${H}" fill="${mix(p[0], p[1], 0.3)}"/><g filter="url(#b)">`;
    for (let i = 0; i < 6; i++) s += `<circle cx="${n1(r() * W)}" cy="${n1(r() * H)}" r="${n1(between(r, 0.22, 0.42) * W)}" fill="${pick(r, p.slice(1))}" opacity="${n1(between(r, 0.7, 1))}"/>`;
    s += `</g><rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.08"/>`;
    return s;
  },
};

export function artSVG({ style = 'mesh', palette, seed = 'x', ratio = 1 }) {
  const W = 1000;
  const H = Math.round(1000 / ratio);
  const r = rng(`${style}:${seed}`);
  const p = PALETTES[palette] || PALETTES[paletteFor(style, seed)];
  const draw = DRAW[style] || DRAW.mesh;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice">${draw(r, p, W, H)}</svg>`;
}

const cache = new Map();
const toURL = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

// Returns an <img>-ready URL for a post image spec (generated or uploaded).
export function artURL(spec) {
  if (!spec) return '';
  if (spec.kind === 'upload') return spec.src;
  const key = `${spec.style}|${spec.palette}|${spec.seed}|${spec.ratio}`;
  let url = cache.get(key);
  if (!url) {
    url = toURL(artSVG(spec));
    cache.set(key, url);
  }
  return url;
}

export const artColors = (spec) => (spec?.kind === 'upload' ? spec.colors || [] : PALETTES[spec?.palette] || []);

// Soft orb avatar derived from a user id.
export function avatarURL(seed) {
  const key = `avatar|${seed}`;
  if (cache.has(key)) return cache.get(key);
  const r = rng(`avatar:${seed}`);
  const p = PALETTES[pick(r, Object.keys(PALETTES))];
  const bg = pick(r, p.slice(1, 4));
  const others = p.filter((c) => c !== bg);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><defs><filter id="f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter></defs><rect width="80" height="80" fill="${bg}"/><g filter="url(#f)"><circle cx="${n1(between(r, 10, 70))}" cy="${n1(between(r, 10, 40))}" r="${n1(between(r, 22, 34))}" fill="${others[0]}"/><ellipse cx="${n1(between(r, 20, 60))}" cy="${n1(between(r, 50, 80))}" rx="${n1(between(r, 24, 36))}" ry="${n1(between(r, 14, 22))}" fill="${others[3]}"/><circle cx="${n1(between(r, 50, 80))}" cy="${n1(between(r, 30, 60))}" r="${n1(between(r, 10, 18))}" fill="${others[1]}"/></g></svg>`;
  const url = toURL(svg);
  cache.set(key, url);
  return url;
}
