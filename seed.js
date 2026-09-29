// The sample community: twelve artists, their work, conversations and
// notifications for the demo account. Timestamps are relative to first load.

import { paletteFor, rng } from './art.js';
import { extractTags } from './util.js';

const MIN = 60_000;

const USERS = [
  { id: 'u_mira', name: 'Mira Chen', handle: 'mirapaints', bio: 'Gouache landscapes and small quiet moments. Prints drop on Fridays. Spring commissions are open.', location: 'Vancouver, BC', website: 'mirachen.art', verified: true, commissions: true, baseFollowers: 48210, baseFollowing: 312, joined: [2022, 4], style: 'landscape', palette: 'gouache' },
  { id: 'u_kofi', name: 'Kofi Mensah', handle: 'kofi.draws', bio: 'Character designer. Afrofuturist worlds, loud color, soft hearts. Currently drawing a graphic novel about a lighthouse on Mars.', location: 'Accra, Ghana', website: 'kofimensah.studio', verified: true, baseFollowers: 31940, baseFollowing: 588, joined: [2021, 9], style: 'orbit', palette: 'kente' },
  { id: 'u_lena', name: 'Lena Vogel', handle: 'lenavogel', bio: 'Poster designer. Grids, primaries and the occasional risograph accident.', location: 'Berlin', website: 'lenavogel.de', baseFollowers: 22410, baseFollowing: 201, joined: [2023, 1], style: 'bauhaus', palette: 'bauhaus' },
  { id: 'u_arjun', name: 'Arjun Mehta', handle: 'arjun3d', bio: '3D generalist. Blender, soft light and far too much coffee. Free .blend files in my links.', location: 'Pune, India', website: 'arjun3d.gumroad.com', baseFollowers: 15120, baseFollowing: 440, joined: [2023, 6], style: 'spheres', palette: 'neon' },
  { id: 'u_sofia', name: 'Sofía Reyes', handle: 'sofi.ink', bio: 'Ink and watercolor. Plants, cats and slow mornings in Oaxaca.', location: 'Oaxaca, México', website: '', commissions: true, baseFollowers: 9820, baseFollowing: 610, joined: [2024, 2], style: 'wash', palette: 'meadow' },
  { id: 'u_hana', name: 'Hana Sato', handle: 'hanapixel', bio: 'Pixel artist. Tiny worlds, 32 pixels at a time. Making a cozy farming game.', location: 'Osaka', website: 'hanapixel.itch.io', verified: true, baseFollowers: 64530, baseFollowing: 150, joined: [2020, 11], style: 'pixel', palette: 'neon' },
  { id: 'u_theo', name: 'Théo Laurent', handle: 'theolaurent', bio: 'Oil painter. Light on water, mostly. Studio on the Saône.', location: 'Lyon', website: 'theolaurent.fr', baseFollowers: 12230, baseFollowing: 98, joined: [2022, 7], style: 'waves', palette: 'ocean' },
  { id: 'u_amara', name: 'Amara Okafor', handle: 'amara.makes', bio: 'Textile artist and collage maker. Every scrap is a pattern waiting to happen.', location: 'Lagos', website: '', commissions: true, baseFollowers: 7410, baseFollowing: 902, joined: [2024, 5], style: 'pattern', palette: 'kente' },
  { id: 'u_jonas', name: 'Jonas Berg', handle: 'jonasframes', bio: 'Film photographer. Nordic light and long exposures. Portra 400 forever.', location: 'Tromsø, Norway', website: 'jonasberg.no', baseFollowers: 18760, baseFollowing: 245, joined: [2021, 3], style: 'dusk', palette: 'nordic' },
  { id: 'u_yuna', name: 'Yuna Park', handle: 'yunasketch', bio: 'One page a day in my sketchbook. Contours, maps and coffee rings.', location: 'Seoul', website: '', baseFollowers: 26310, baseFollowing: 377, joined: [2023, 3], style: 'topo', palette: 'ink' },
  { id: 'u_diego', name: 'Diego Álvarez', handle: 'diegomurals', bio: 'Muralist. I paint walls that talk back. Next up: a 40-meter wall in Guadalajara.', location: 'Mexico City', website: 'diegomurals.mx', verified: true, baseFollowers: 40120, baseFollowing: 530, joined: [2021, 6], style: 'memphis', palette: 'citrus' },
  { id: 'u_sam', name: 'Sam Taylor', handle: 'samcreates', bio: 'Learning to paint one mistake at a time. Digital and gouache. Say hi!', location: 'Bristol, UK', website: '', baseFollowers: 308, baseFollowing: 208, joined: [2025, 10], style: 'mesh', palette: 'sorbet', local: true },
];

// ago is in minutes before first load.
const POSTS = [
  { id: 'p_m1', author: 'u_mira', style: 'landscape', palette: 'gouache', ratio: 0.8, ago: 38, likes: 2841, reposts: 112, category: 'painting', medium: 'Gouache on cold-press paper, 18×24 cm', hours: '3h', caption: 'Last light over the Coast Mountains. I kept the palette to five tubes this time and it made every decision easier. #gouache #landscape #pleinair' },
  { id: 'p_h1', author: 'u_hana', style: 'pixel', palette: 'neon', ratio: 1, ago: 64, likes: 6120, reposts: 540, category: 'pixel', medium: 'Aseprite, 32×32 upscaled', hours: '3h', caption: 'Meet Moss, the night-shift farmhand in my game. 32×32 and full of opinions. #pixelart #gamedev #indiedev' },
  { id: 'p_y1', author: 'u_yuna', style: 'topo', palette: 'ink', ratio: 0.8, ago: 95, likes: 1760, reposts: 44, category: 'illustration', medium: 'Fineliner in a Moleskine', hours: '35m', caption: 'Day 412. Traced the contour lines of the hill behind my apartment from memory. #sketchbook #dailydrawing' },
  { id: 'p_k1', author: 'u_kofi', style: 'orbit', palette: 'kente', ratio: 0.8, ago: 128, likes: 3902, reposts: 301, category: 'digital', medium: 'Procreate on iPad Pro', hours: '9h', caption: 'Concept piece for "The Keeper of Olympus Mons". The lighthouse beam is the only warm thing on Mars. #afrofuturism #conceptart #characterdesign' },
  { id: 'p_j1', author: 'u_jonas', style: 'dusk', palette: 'nordic', ratio: 1.5, ago: 190, likes: 3320, reposts: 150, category: 'photography', medium: 'Portra 400, 35mm', hours: '30s exposure', caption: 'Polar dusk over Kvaløya. Thirty-second exposure, frozen hands, no regrets. #filmphotography #35mm #norway' },
  { id: 'p_l1', author: 'u_lena', style: 'bauhaus', palette: 'bauhaus', ratio: 0.75, ago: 245, likes: 2210, reposts: 188, category: 'illustration', medium: 'Risograph, 4 colors, A3', hours: '6h', caption: 'Poster for a jazz night at Kantine. Four colors, one grid, zero regrets. #bauhaus #posterdesign #risograph' },
  { id: 'p_s1', author: 'u_sofia', style: 'wash', palette: 'meadow', ratio: 0.8, ago: 300, likes: 1204, reposts: 36, category: 'painting', medium: 'Ink and watercolor, A4', hours: '2h', caption: 'Monstera for a slow Sunday. The wet-into-wet leaves bloomed exactly where I didn\'t plan, which is my favorite part. #watercolor #botanical' },
  { id: 'p_a1', author: 'u_arjun', style: 'spheres', palette: 'neon', ratio: 1.25, ago: 370, likes: 1893, reposts: 97, category: '3d', medium: 'Blender 4.2, Cycles', hours: '5h', caption: 'Soft-body study. Five spheres, one area light and a lot of patience with the denoiser. Free .blend in my links. #blender #3dart #render' },
  { id: 'p_t1', author: 'u_theo', style: 'waves', palette: 'ocean', ratio: 1.25, ago: 440, likes: 2604, reposts: 120, category: 'painting', medium: 'Oil on linen, 60×80 cm', hours: '11h', caption: 'The Saône at 7am. I scraped the reflections in with a palette knife while the paint was still wet. #oilpainting #impressionism' },
  { id: 'p_am1', author: 'u_amara', style: 'pattern', palette: 'kente', ratio: 0.8, ago: 545, likes: 1870, reposts: 88, category: 'textile', medium: 'Fabric collage, 90×110 cm', hours: '30h', caption: 'Quilt panel three of five. Every triangle comes from my grandmother\'s old wrappers. #textileart #quilting #collage' },
  { id: 'p_d1', author: 'u_diego', style: 'memphis', palette: 'citrus', ratio: 0.75, ago: 610, likes: 5810, reposts: 420, category: 'street', medium: 'Spray paint and acrylic on brick', hours: '11 days', caption: 'Wall one of the Guadalajara series is done. 40 meters, 11 days, 212 cans. Thanks to everyone who brought tacos. #muralart #streetart' },
  { id: 'p_a3', author: 'u_arjun', style: 'spheres', palette: 'mono', ratio: 1, ago: 20 * 60, likes: 980, reposts: 31, category: '3d', medium: 'Blender 4.2, Eevee', hours: '1h 30m', caption: 'My #monochrome entry. Blue on blue on blue. #blender' },
  { id: 'p_l4', author: 'u_lena', style: 'bauhaus', palette: 'mono', ratio: 1, ago: 26 * 60, likes: 1650, reposts: 97, category: 'illustration', medium: 'Risograph, 1 color, A4', hours: '2h', caption: 'This week\'s #monochrome challenge in ultramarine only. Turns out one ink is plenty. #risograph' },
  { id: 'p_k2', author: 'u_kofi', style: 'orbit', palette: 'neon', ratio: 1, ago: 30 * 60, likes: 1488, reposts: 21, category: 'digital', feedback: true, medium: 'Procreate', hours: '2h', caption: 'Color key for chapter 2. Does the teal read as night to you, or does it feel too tropical? #colorscript #conceptart' },
  { id: 'p_d2', author: 'u_diego', style: 'memphis', palette: 'kente', ratio: 1, ago: 44 * 60, likes: 2011, reposts: 64, category: 'street', feedback: true, medium: 'Procreate mockup', hours: '2h', caption: 'Sketch for the next wall. Too busy? I keep adding shapes. #muralart #sketch' },
  { id: 'p_m2', author: 'u_mira', style: 'landscape', palette: 'meadow', ratio: 1.25, ago: 50 * 60, likes: 1620, reposts: 40, category: 'painting', feedback: true, medium: 'Gouache, travel palette', hours: '1h 20m', caption: 'A greener study from the ferry ride. The water was harder than the hills, as always. Would love thoughts on the foreground. #gouache #studies' },
  { id: 'p_a2', author: 'u_arjun', style: 'spheres', palette: 'ocean', ratio: 0.8, ago: 56 * 60, likes: 744, reposts: 12, category: '3d', feedback: true, medium: 'Blender 4.2, Eevee', hours: '1h 10m', caption: 'Morning render before work. Trying to make the contact shadows feel heavier. Any tips? #blender #lighting' },
  { id: 'p_y2', author: 'u_yuna', style: 'topo', palette: 'clay', ratio: 1, ago: 70 * 60, likes: 2201, reposts: 80, category: 'illustration', medium: 'Fineliner and coffee', hours: '20m', caption: 'Day 409. A coffee ring became a mountain. #sketchbook #inkdrawing' },
  { id: 'p_h2', author: 'u_hana', style: 'pixel', palette: 'ember', ratio: 1, ago: 76 * 60, likes: 4380, reposts: 260, category: 'pixel', medium: 'Aseprite', hours: '2h', caption: 'Sunset palette pass. I swapped every cool shadow for a purple and it finally feels warm. #pixelart #palette' },
  { id: 'p_s2', author: 'u_sofia', style: 'wash', palette: 'sorbet', ratio: 1, ago: 96 * 60, likes: 690, reposts: 9, category: 'painting', feedback: true, medium: 'Watercolor on cotton paper', hours: '45m', caption: 'Swatches for a new pink series. Trying to get peach without going muddy. #watercolor #colorstudy' },
  { id: 'p_j2', author: 'u_jonas', style: 'dusk', palette: 'ember', ratio: 0.8, ago: 100 * 60, likes: 2140, reposts: 77, category: 'photography', medium: 'Ektar 100, 6×7 medium format', hours: '1/60s', caption: 'Last frame on the roll, and the best one. #filmphotography #mediumformat' },
  { id: 'p_t2', author: 'u_theo', style: 'waves', palette: 'gouache', ratio: 1.25, ago: 120 * 60, likes: 1433, reposts: 29, category: 'painting', medium: 'Oil on panel, 20×25 cm', hours: '50m', caption: 'Small study, painted fast before the light moved. #oilpainting #pleinair' },
  { id: 'p_sam1', author: 'u_sam', style: 'mesh', palette: 'sorbet', ratio: 0.8, ago: 125 * 60, likes: 86, reposts: 3, category: 'painting', feedback: true, medium: 'Gouache, A5 sketchbook', hours: '2h', caption: 'My first gouache gradient that didn\'t turn to mud! Gradients are hard. Tips welcome. #gouache #beginner #firstpost' },
  { id: 'p_m3', author: 'u_mira', style: 'landscape', palette: 'sorbet', ratio: 1, ago: 140 * 60, likes: 4210, reposts: 230, category: 'painting', medium: 'Gouache, 20×20 cm', hours: '4h', caption: 'Pink hour. Prints of this one go live Friday. #gouache #prints' },
  { id: 'p_am2', author: 'u_amara', style: 'pattern', palette: 'clay', ratio: 1, ago: 150 * 60, likes: 802, reposts: 18, category: 'textile', medium: 'Hand-carved stamp on linen', hours: '3h', caption: 'Stamp test for the next panel. Carved from an eraser, printed on linen. #blockprint #pattern' },
  { id: 'p_y3', author: 'u_yuna', style: 'topo', palette: 'nordic', ratio: 0.8, ago: 170 * 60, likes: 1905, reposts: 51, category: 'illustration', medium: 'Fineliner and gray wash', hours: '40m', caption: 'Day 404. Mapping the river bends along the Hangang. #sketchbook #maps' },
  { id: 'p_l2', author: 'u_lena', style: 'bauhaus', palette: 'citrus', ratio: 1, ago: 190 * 60, likes: 1307, reposts: 55, category: 'digital', medium: 'Illustrator', hours: '40m', caption: 'Daily grid no. 88. Rotated one tile and the whole thing started to swing. #dailygrid #geometric' },
  { id: 'p_h3', author: 'u_hana', style: 'pixel', palette: 'ocean', ratio: 0.8, ago: 215 * 60, likes: 5022, reposts: 310, category: 'pixel', medium: 'Aseprite', hours: '4h', caption: 'Night variant for the harbor level. #pixelart #gamedev' },
  { id: 'p_sam2', author: 'u_sam', style: 'mesh', palette: 'lagoon', ratio: 1, ago: 290 * 60, likes: 54, reposts: 1, category: 'digital', medium: 'Procreate', hours: '1h', caption: 'Digital color study after watching @mirapaints paint the coast. #colorstudy #procreate' },
];

const GENERAL_COMMENTS = [
  'The light in this is unreal.',
  'That palette is so calm. Saving it for reference.',
  'How long did the layering take?',
  'The composition pulls my eye straight in.',
  'I would hang this in my studio.',
  'The negative space is doing so much work here.',
  'Your color choices always surprise me.',
  'Would you ever do a process video for this one?',
  'Texture goals.',
  'This made my morning.',
  'Print when?',
  'Every time I scroll past your work I stop.',
];

const FEEDBACK_COMMENTS = [
  'Try pushing the shadows a little cooler. It will make the warm tones sing.',
  'The focal point is clear, but the bottom left feels busy. Maybe simplify that corner?',
  'Reads as night to me. You could drop the saturation in the background by about 10%.',
  'Honestly it works. I would only soften the edge on the right side.',
  'A darker value right at the contact point would ground it more.',
  'Love it. If anything, give the eye one quiet spot to rest.',
];

const STORY_CAPTIONS = {
  u_hana: 'Moss got a hat',
  u_mira: 'Palette for today',
  u_kofi: 'Chapter 2 thumbnails',
  u_diego: 'Wall prep at 6am',
  u_yuna: 'Page 413 in progress',
  u_jonas: 'Waiting for the light',
  u_lena: 'Fresh prints drying',
  u_arjun: 'Render farm is cooking',
};

const TAG_BASE = {
  pixelart: 92300, gamedev: 71000, watercolor: 55700, sketchbook: 47100, blender: 41200,
  filmphotography: 38900, oilpainting: 29800, gouache: 18400, muralart: 12600, risograph: 9300,
  colorstudy: 8800, afrofuturism: 6800, textileart: 5400, monochrome: 1284, firstpost: 3100,
};

// Prints for sale in the marketplace: [postId, title, A4 price in cents, prints sold].
const LISTINGS = [
  ['p_m1', 'Last Light, Coast Mountains', 3200, 184],
  ['p_h1', 'Moss, Night-Shift Farmhand', 1800, 412],
  ['p_k1', 'The Keeper of Olympus Mons', 3600, 157],
  ['p_m3', 'Pink Hour', 2800, 231],
  ['p_d1', 'Guadalajara Wall No. 1', 3800, 96],
  ['p_j1', 'Polar Dusk, Kvaløya', 4000, 73],
  ['p_l1', 'Jazz Night at Kantine', 3000, 128],
  ['p_t1', 'The Saône at 7am', 4500, 61],
  ['p_h3', 'Harbor at Night', 2200, 203],
  ['p_am1', 'Quilt Panel Three', 2600, 44],
  ['p_s1', 'Monstera for a Slow Sunday', 2400, 88],
  ['p_y1', 'Day 412: The Hill', 2000, 52],
];

// Also used to add the marketplace to communities saved before it existed.
export function seedListings(posts, now = Date.now()) {
  return LISTINGS.map(([postId, title, price, sales], i) => {
    const p = posts.find((x) => x.id === postId);
    return p && { id: `l_${postId}`, sellerId: p.authorId, postId, image: null, title, price, category: p.category, sales, createdAt: now - (i + 1) * 5 * 60 * MIN };
  }).filter(Boolean);
}

export function buildSeed(now = Date.now()) {
  const ago = (minutes) => now - minutes * MIN;

  const users = {};
  USERS.forEach(({ joined, ...u }) => {
    users[u.id] = { bio: '', location: '', website: '', verified: false, commissions: false, local: false, ...u, joinedAt: new Date(joined[0], joined[1], 12).getTime() };
  });

  const posts = POSTS.map((p) => ({
    id: p.id,
    authorId: p.author,
    caption: p.caption,
    image: { kind: 'gen', style: p.style, palette: p.palette || paletteFor(p.style, p.id), seed: p.id, ratio: p.ratio },
    medium: p.medium,
    hours: p.hours,
    category: p.category,
    feedback: !!p.feedback,
    tags: extractTags(p.caption),
    createdAt: ago(p.ago),
    baseLikes: p.likes,
    likedBy: [],
    savedBy: [],
    baseReposts: p.reposts,
    repostedBy: [],
  }));
  const byId = Object.fromEntries(posts.map((p) => [p.id, p]));

  ['p_m1', 'p_h1', 'p_k1', 'p_t1'].forEach((id) => byId[id].likedBy.push('u_sam'));
  ['p_m1', 'p_t1', 'p_j1', 'p_a1', 'p_h2'].forEach((id) => byId[id].savedBy.push('u_sam'));

  const comments = [];
  const others = Object.keys(users).filter((id) => id !== 'u_sam');
  posts.forEach((p) => {
    if (p.authorId === 'u_sam') return;
    const pr = rng(`comments:${p.id}`);
    const bank = p.feedback ? FEEDBACK_COMMENTS : GENERAL_COMMENTS;
    const count = Math.floor(pr() * 4) + (p.feedback ? 2 : 1);
    const used = new Set();
    const pool = others.filter((id) => id !== p.authorId);
    for (let i = 0; i < count; i++) {
      let text = bank[Math.floor(pr() * bank.length)];
      while (used.has(text) && used.size < bank.length) text = bank[Math.floor(pr() * bank.length)];
      used.add(text);
      comments.push({
        id: `c_${p.id}_${i}`,
        postId: p.id,
        authorId: pool[Math.floor(pr() * pool.length)],
        text,
        createdAt: p.createdAt + (now - p.createdAt) * (0.05 + (i / count) * 0.8),
        baseLikes: Math.floor(pr() * 40),
        likedBy: [],
      });
    }
    if (p.feedback) {
      comments.push({ id: `c_${p.id}_reply`, postId: p.id, authorId: p.authorId, text: 'Thank you, this is really helpful. Trying it on the next pass.', createdAt: p.createdAt + (now - p.createdAt) * 0.9, baseLikes: Math.floor(pr() * 20), likedBy: [] });
    }
  });

  comments.push(
    { id: 'c_sam1_kofi', postId: 'p_sam1', authorId: 'u_kofi', text: 'Clean gradient! Next time try a cooler blue on the shadow side.', createdAt: ago(40), baseLikes: 6, likedBy: [] },
    { id: 'c_sam1_theo', postId: 'p_sam1', authorId: 'u_theo', text: 'Great start. Keep a jar of clean water just for rinsing between colors and the mud goes away.', createdAt: ago(3 * 24 * 60), baseLikes: 11, likedBy: [] },
    { id: 'c_sam2_mira', postId: 'p_sam2', authorId: 'u_mira', text: 'This made my day. The teal is lovely.', createdAt: ago(4 * 24 * 60), baseLikes: 4, likedBy: [] },
    { id: 'c_s1_sam', postId: 'p_s1', authorId: 'u_sofia', text: '@samcreates you asked about brushes: this was all a size 8 round.', createdAt: ago(3 * 60), baseLikes: 3, likedBy: [] },
  );

  const stories = Object.entries(STORY_CAPTIONS).map(([userId, caption], i) => ({
    id: `s_${userId}`,
    userId,
    caption,
    image: { kind: 'gen', style: users[userId].style, palette: paletteFor(users[userId].style, `story-${userId}`), seed: `story-${userId}`, ratio: 0.5625 },
    createdAt: ago(i * 47 + 12),
  }));

  const n = (id, type, actorId, minutes, extra = {}) => ({ id, toId: 'u_sam', type, actorId, createdAt: ago(minutes), read: minutes > 6 * 60, ...extra });
  const notifications = [
    n('n1', 'like', 'u_mira', 12, { postId: 'p_sam1' }),
    n('n2', 'comment', 'u_kofi', 40, { postId: 'p_sam1', text: 'Clean gradient! Next time try a cooler blue on the shadow side.' }),
    n('n3', 'follow', 'u_hana', 2 * 60),
    n('n4', 'mention', 'u_sofia', 3 * 60, { postId: 'p_s1', text: '@samcreates you asked about brushes: this was all a size 8 round.' }),
    n('n5', 'repost', 'u_yuna', 5 * 60, { postId: 'p_sam2' }),
    n('n6', 'like', 'u_diego', 26 * 60, { postId: 'p_sam1' }),
    n('n7', 'like', 'u_lena', 30 * 60, { postId: 'p_sam2' }),
    n('n8', 'follow', 'u_kofi', 2 * 24 * 60),
    n('n9', 'follow', 'u_lena', 3 * 24 * 60),
    n('n10', 'comment', 'u_theo', 3 * 24 * 60, { postId: 'p_sam1', text: 'Great start. Keep a jar of clean water just for rinsing between colors and the mud goes away.' }),
    n('n11', 'follow', 'u_amara', 5 * 24 * 60),
    n('n12', 'like', 'u_arjun', 6 * 24 * 60, { postId: 'p_sam2' }),
  ];

  const m = (from, minutes, text) => ({ id: `m_${from}_${minutes}`, from, text, createdAt: ago(minutes) });
  const conversations = [
    { id: 'dm_mira', members: ['u_sam', 'u_mira'], readAt: { u_sam: ago(60) }, messages: [
      m('u_mira', 2 * 24 * 60, 'Hey! Saw your gouache post. You are getting the hang of it.'),
      m('u_sam', 2 * 24 * 60 - 20, 'Thank you!! Your coast video helped a lot.'),
      m('u_sam', 2 * 24 * 60 - 19, 'What paper do you use?'),
      m('u_mira', 30, 'Arches cold press, 300gsm. It takes a lot of water without buckling.'),
    ] },
    { id: 'dm_kofi', members: ['u_sam', 'u_kofi'], readAt: { u_sam: ago(3 * 60) }, messages: [
      m('u_kofi', 26 * 60, 'Would you be up for a collab on the #monochrome challenge?'),
      m('u_sam', 25 * 60, 'Yes! Which color?'),
      m('u_kofi', 2 * 60, 'Ultramarine. Obviously.'),
    ] },
    { id: 'dm_hana', members: ['u_sam', 'u_hana'], readAt: { u_sam: ago(0) }, messages: [
      m('u_sam', 3 * 24 * 60, 'How do you pick palettes for your sprites?'),
      m('u_hana', 3 * 24 * 60 - 30, 'I start with four colors and only add one when something breaks. Lospec has great ones.'),
      m('u_sam', 3 * 24 * 60 - 25, 'Going to try that tonight 🙌'),
    ] },
    { id: 'dm_lena', members: ['u_sam', 'u_lena'], readAt: { u_sam: ago(0) }, messages: [
      m('u_lena', 6 * 24 * 60, 'Thanks for the follow! If you are ever in Berlin, my riso studio has open days on Saturdays.'),
    ] },
  ];

  return {
    version: 2,
    session: null,
    demoUserId: 'u_sam',
    users,
    posts,
    comments,
    follows: {
      u_sam: ['u_mira', 'u_hana', 'u_kofi', 'u_yuna', 'u_theo', 'u_lena'],
      u_kofi: ['u_sam'],
      u_lena: ['u_sam'],
      u_hana: ['u_sam'],
      u_amara: ['u_sam'],
    },
    notifications,
    conversations,
    stories,
    storySeen: { u_sam: ['s_u_lena', 's_u_arjun'] },
    tagBase: { ...TAG_BASE },
    listings: seedListings(posts, now),
    orders: [],
  };
}
