// Data layer. Everything the UI reads or changes goes through these functions,
// so replacing localStorage with a real backend (Supabase, Firebase, your own
// API) means reimplementing this module and nothing else.

import { buildSeed, seedListings } from './seed.js';
import { paletteFor, STYLES } from './art.js';
import { uid, extractTags } from './util.js';

const KEY = 'artistic:v2';
const THEME_KEY = 'artistic:theme';

export const CATEGORIES = [
  { id: 'painting', label: 'Painting' },
  { id: 'digital', label: 'Digital' },
  { id: 'illustration', label: 'Illustration' },
  { id: '3d', label: '3D' },
  { id: 'pixel', label: 'Pixel art' },
  { id: 'photography', label: 'Photography' },
  { id: 'street', label: 'Street art' },
  { id: 'textile', label: 'Textile' },
];
export const categoryLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label || 'Art';

// Sample artists answer with one of these, so conversations feel alive in the demo.
const REPLIES = [
  'Thank you, that means a lot 🙏',
  'Sure! Give me a day and I\'ll send it over.',
  'Ha, love that. Tell me more?',
  'Yes, let\'s do it. Send me a sketch when you\'re ready.',
  'Good question! I keep it simple: a size 8 round and a flat brush for skies.',
  'Deal. Let\'s both post ours on Friday.',
  'Try limiting yourself to three colors first. It really helps.',
  'Haha, same. The muddy phase is a rite of passage.',
];

let state = null;
let storageOK = false;
const listeners = new Set();
const timers = new Set();

function readStorage(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function writeStorage(key, value) {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}
function storageAvailable() {
  try {
    localStorage.setItem('artistic:probe', '1');
    localStorage.removeItem('artistic:probe');
    return true;
  } catch { return false; }
}

let saveTimer = 0;
let warnedFull = false;
function persist(immediate = false) {
  if (!storageOK) return;
  clearTimeout(saveTimer);
  const run = () => {
    if (!writeStorage(KEY, JSON.stringify(state)) && !warnedFull) {
      warnedFull = true;
      emit('storage-full');
    }
  };
  if (immediate) run();
  else saveTimer = setTimeout(run, 120);
}

function emit(type, payload) {
  listeners.forEach((fn) => {
    try { fn(type, payload); } catch (err) { console.error(err); }
  });
}
function commit(type, payload) {
  persist();
  emit(type, payload);
}
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function later(fn, ms) {
  const t = setTimeout(() => { timers.delete(t); fn(); }, ms);
  timers.add(t);
}
function clearTimers() {
  timers.forEach(clearTimeout);
  timers.clear();
}

export function init() {
  storageOK = storageAvailable();
  let loaded = null;
  const raw = readStorage(KEY);
  if (raw) {
    try { loaded = JSON.parse(raw); } catch { loaded = null; }
  }
  state = loaded?.version === 2 ? loaded : buildSeed(Date.now());
  if (state.session && !state.users[state.session.userId]) state.session = null;
  if (!state.listings) {
    state.listings = seedListings(state.posts);
    state.orders = [];
    if (loaded) persist(true);
  }
  if (!loaded) persist(true);
}

function toggleIn(list, value) {
  const i = list.indexOf(value);
  if (i >= 0) { list.splice(i, 1); return false; }
  list.push(value);
  return true;
}

/* ---------- people ---------- */

export const meId = () => state.session?.userId ?? null;
export const me = () => (state.session ? state.users[state.session.userId] : null);
export const user = (id) => state.users[id];
export function userByHandle(handle) {
  const h = String(handle).toLowerCase().replace(/^@/, '');
  return Object.values(state.users).find((u) => u.handle.toLowerCase() === h);
}
const followsOf = (id) => state.follows[id] || [];
export const isFollowing = (id) => followsOf(meId()).includes(id);
export const followsMe = (id) => followsOf(id).includes(meId());
export const followerCount = (u) =>
  u.baseFollowers + Object.entries(state.follows).filter(([k, list]) => k !== u.id && list.includes(u.id)).length;
export const followingCount = (u) => u.baseFollowing + followsOf(u.id).length;

export function toggleFollow(id) {
  const mine = (state.follows[meId()] ||= []);
  const on = toggleIn(mine, id);
  commit('follow', id);
  return on;
}

export function suggestedUsers(n = 3) {
  return Object.values(state.users)
    .filter((u) => u.id !== meId() && !u.local && !isFollowing(u.id))
    .sort((a, b) => followerCount(b) - followerCount(a))
    .slice(0, n);
}

export function allArtists() {
  return Object.values(state.users)
    .filter((u) => u.id !== meId())
    .sort((a, b) => Number(isFollowing(b.id)) - Number(isFollowing(a.id)) || a.name.localeCompare(b.name));
}

export function updateProfile(patch) {
  Object.assign(me(), patch);
  commit('profile');
}

/* ---------- posts ---------- */

const byNewest = (a, b) => b.createdAt - a.createdAt;
export const post = (id) => state.posts.find((p) => p.id === id);
export const likeCount = (p) => p.baseLikes + p.likedBy.length;
export const isLiked = (p) => p.likedBy.includes(meId());
export const repostCount = (p) => p.baseReposts + p.repostedBy.length;
export const isReposted = (p) => p.repostedBy.includes(meId());
export const isSaved = (p) => p.savedBy.includes(meId());
export const commentCount = (p) => state.comments.reduce((n, c) => n + (c.postId === p.id ? 1 : 0), 0);

function score(p, now) {
  const hours = (now - p.createdAt) / 3_600_000;
  return Math.sqrt(likeCount(p) + commentCount(p) * 20 + 30) / Math.pow(hours + 2, 1.15);
}

export function feed(tab = 'foryou') {
  const now = Date.now();
  const id = meId();
  if (tab === 'following') {
    const set = new Set([...followsOf(id), id]);
    return state.posts.filter((p) => set.has(p.authorId)).sort(byNewest);
  }
  // Your own posts from the last 15 minutes stay pinned on top so you can see them land.
  const fresh = state.posts.filter((p) => p.authorId === id && now - p.createdAt < 15 * 60_000).sort(byNewest);
  const rest = state.posts
    .filter((p) => !fresh.includes(p))
    .map((p) => [p, score(p, now)])
    .sort((a, b) => b[1] - a[1])
    .map(([p]) => p);
  return [...fresh, ...rest];
}

export const postsBy = (userId) => state.posts.filter((p) => p.authorId === userId).sort(byNewest);
export const likedPosts = () => state.posts.filter((p) => isLiked(p)).sort(byNewest);
export const savedPosts = () => state.posts.filter((p) => isSaved(p)).sort(byNewest);
export const popularPosts = (category = 'all') =>
  state.posts.filter((p) => category === 'all' || p.category === category).sort((a, b) => likeCount(b) - likeCount(a));
export const postsByTag = (tag) => state.posts.filter((p) => p.tags.includes(tag)).sort(byNewest);
export const tagCount = (tag) => (state.tagBase[tag] || 0) + postsByTag(tag).length;
export function tagKicker(tag) {
  const p = state.posts.find((x) => x.tags.includes(tag));
  return p ? `Trending in ${categoryLabel(p.category)}` : 'Trending';
}

export function trendingTags(n = 5) {
  const counts = {};
  state.posts.forEach((p) => p.tags.forEach((t) => { counts[t] = (counts[t] || 0) + 1; }));
  const tags = new Set([...Object.keys(state.tagBase), ...Object.keys(counts)]);
  return [...tags]
    .map((tag) => ({ tag, count: (state.tagBase[tag] || 0) + (counts[tag] || 0), kicker: tagKicker(tag) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

export function toggleLike(id) {
  const p = post(id);
  if (!p) return false;
  const on = toggleIn(p.likedBy, meId());
  commit('post', id);
  return on;
}
export function toggleSave(id) {
  const p = post(id);
  if (!p) return false;
  const on = toggleIn(p.savedBy, meId());
  commit('post', id);
  return on;
}
export function toggleRepost(id) {
  const p = post(id);
  if (!p) return false;
  const on = toggleIn(p.repostedBy, meId());
  commit('post', id);
  return on;
}

export function randomSampleImage() {
  const style = STYLES[Math.floor(Math.random() * STYLES.length)];
  const seed = uid('g');
  return { kind: 'gen', style, palette: paletteFor(style, seed), seed, ratio: [1, 0.8, 1.25][Math.floor(Math.random() * 3)] };
}

export function addPost({ caption = '', image, medium = '', hours = '', category = 'digital', feedback = false, toStory = false }) {
  const p = {
    id: uid('p'),
    authorId: meId(),
    caption: caption.trim(),
    image,
    medium: medium.trim(),
    hours: hours.trim(),
    category,
    feedback,
    tags: extractTags(caption),
    createdAt: Date.now(),
    baseLikes: 0,
    likedBy: [],
    savedBy: [],
    baseReposts: 0,
    repostedBy: [],
  };
  state.posts.unshift(p);
  if (toStory) state.stories.push({ id: uid('s'), userId: meId(), caption: '', postId: p.id, createdAt: p.createdAt });
  commit('post-added', p.id);
  simulateEngagement(p.id);
  return p;
}

export function deletePost(id) {
  state.posts = state.posts.filter((p) => p.id !== id);
  state.comments = state.comments.filter((c) => c.postId !== id);
  state.notifications = state.notifications.filter((n) => n.postId !== id);
  state.stories = state.stories.filter((s) => s.postId !== id);
  state.listings = state.listings.filter((l) => l.postId !== id);
  commit('post-deleted', id);
}

// A few sample artists react to new work so the app feels inhabited.
function simulateEngagement(postId) {
  const pool = Object.values(state.users).filter((u) => !u.local).sort(() => Math.random() - 0.5).slice(0, 3);
  pool.forEach((u, i) => later(() => {
    const p = post(postId);
    if (!p) return;
    p.baseLikes += 1;
    state.notifications.push({ id: uid('n'), toId: p.authorId, type: 'like', actorId: u.id, postId, createdAt: Date.now(), read: false });
    commit('engagement', { postId, actorId: u.id, first: i === 0 });
  }, 5000 + i * 6000 + Math.random() * 2000));
}

/* ---------- comments ---------- */

export const comments = (postId) => state.comments.filter((c) => c.postId === postId).sort((a, b) => a.createdAt - b.createdAt);
export const commentById = (id) => state.comments.find((c) => c.id === id);
export const commentLikeCount = (c) => c.baseLikes + c.likedBy.length;
export const isCommentLiked = (c) => c.likedBy.includes(meId());

export function toggleCommentLike(id) {
  const c = commentById(id);
  if (!c) return false;
  const on = toggleIn(c.likedBy, meId());
  commit('comment-like', id);
  return on;
}

export function addComment(postId, text) {
  const c = { id: uid('c'), postId, authorId: meId(), text: text.trim(), createdAt: Date.now(), baseLikes: 0, likedBy: [] };
  state.comments.push(c);
  const p = post(postId);
  const author = p && user(p.authorId);
  if (author && author.id !== meId() && !author.local) {
    later(() => {
      if (!state.comments.includes(c)) return;
      c.baseLikes += 1;
      state.notifications.push({ id: uid('n'), toId: c.authorId, type: 'comment-like', actorId: author.id, postId, text: c.text, createdAt: Date.now(), read: false });
      commit('engagement', { postId, actorId: author.id, commentId: c.id });
    }, 4000);
  }
  commit('comment', c.id);
  return c;
}

/* ---------- notifications ---------- */

export const notifications = () => state.notifications.filter((n) => n.toId === meId()).sort(byNewest);
export const unreadNotifications = () => notifications().filter((n) => !n.read).length;
export function markNotificationsRead() {
  notifications().forEach((n) => { n.read = true; });
  commit('notifications-read');
}

/* ---------- messages ---------- */

function decorate(c) {
  const id = meId();
  const readAt = c.readAt?.[id] || 0;
  return {
    ...c,
    other: state.users[c.members.find((m) => m !== id)],
    last: c.messages[c.messages.length - 1],
    unread: c.messages.filter((m) => m.from !== id && m.createdAt > readAt).length,
  };
}
const rawConversation = (id) => state.conversations.find((c) => c.id === id && c.members.includes(meId()));
export function conversation(id) {
  const c = rawConversation(id);
  return c ? decorate(c) : null;
}
export function conversations() {
  return state.conversations
    .filter((c) => c.members.includes(meId()))
    .map(decorate)
    .sort((a, b) => (b.last?.createdAt || 0) - (a.last?.createdAt || 0));
}
export const unreadMessages = () => conversations().filter((c) => c.unread).length;

export function markConversationRead(id) {
  const c = rawConversation(id);
  if (!c) return;
  c.readAt = { ...c.readAt, [meId()]: Date.now() };
  commit('read', id);
}

export function startConversation(userId) {
  const id = meId();
  let c = state.conversations.find((x) => x.members.includes(id) && x.members.includes(userId));
  if (!c) {
    c = { id: uid('dm'), members: [id, userId], readAt: {}, messages: [] };
    state.conversations.push(c);
    commit('conversation', c.id);
  }
  return c.id;
}

export function sendMessage(convId, text) {
  const c = rawConversation(convId);
  if (!c) return null;
  const msg = { id: uid('m'), from: meId(), text: text.trim(), createdAt: Date.now() };
  c.messages.push(msg);
  c.readAt = { ...c.readAt, [meId()]: msg.createdAt };
  commit('sent', { convId, message: msg });
  const other = c.members.find((m) => m !== meId());
  if (!user(other)?.local) {
    later(() => {
      emit('typing', { convId, on: true });
      later(() => {
        const reply = { id: uid('m'), from: other, text: REPLIES[c.messages.length % REPLIES.length], createdAt: Date.now() };
        c.messages.push(reply);
        emit('typing', { convId, on: false });
        commit('message', { convId, message: reply });
      }, 1500 + Math.random() * 1200);
    }, 700);
  }
  return msg;
}

/* ---------- stories ---------- */

export const storyImage = (s) => (s.postId ? post(s.postId)?.image : s.image);

export function storyGroups() {
  const id = meId();
  const seen = new Set(state.storySeen[id] || []);
  const groups = new Map();
  [...state.stories]
    .filter((s) => storyImage(s) && state.users[s.userId])
    .sort((a, b) => a.createdAt - b.createdAt)
    .forEach((s) => {
      if (!groups.has(s.userId)) groups.set(s.userId, []);
      groups.get(s.userId).push(s);
    });
  const list = [...groups.entries()].map(([userId, stories]) => ({
    user: state.users[userId],
    stories,
    seen: stories.every((s) => seen.has(s.id)),
    latest: stories[stories.length - 1].createdAt,
  }));
  const mine = list.filter((g) => g.user.id === id);
  const others = list.filter((g) => g.user.id !== id).sort((a, b) => Number(a.seen) - Number(b.seen) || b.latest - a.latest);
  return [...mine, ...others];
}

export const isStorySeen = (storyId) => (state.storySeen[meId()] || []).includes(storyId);

export function markStorySeen(storyId) {
  const list = (state.storySeen[meId()] ||= []);
  if (!list.includes(storyId)) {
    list.push(storyId);
    commit('story-seen', storyId);
  }
}

/* ---------- marketplace ---------- */

// Every listing sells in these sizes; a listing's price is its A4 price.
export const PRINT_SIZES = [
  { id: 'a4', label: 'A4', dims: '21 × 30 cm', factor: 1 },
  { id: 'a3', label: 'A3', dims: '30 × 42 cm', factor: 1.6 },
  { id: 'a2', label: 'A2', dims: '42 × 59 cm', factor: 2.4 },
];
export const FRAME_PRICE = 3500;
export const SHIPPING = 600;
export const FREE_SHIPPING_FROM = 5000;
export const MAX_QTY = 10;
export const sizeLabel = (id) => (PRINT_SIZES.find((s) => s.id === id) || PRINT_SIZES[0]).label;

const LISTING_SORTS = {
  popular: (a, b) => b.sales - a.sales,
  newest: byNewest,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
};

export const listing = (id) => state.listings.find((l) => l.id === id);
export const listingForPost = (postId) => state.listings.find((l) => l.postId === postId);
// Listings made from a post show that post's image, so uploads aren't stored twice.
export const listingImage = (l) => (l.postId ? post(l.postId)?.image : l.image);
export const listingsBy = (userId) => state.listings.filter((l) => l.sellerId === userId && listingImage(l)).sort(byNewest);

export function listings({ category = 'all', sort = 'popular' } = {}) {
  return state.listings
    .filter((l) => state.users[l.sellerId] && listingImage(l) && (category === 'all' || l.category === category))
    .sort(LISTING_SORTS[sort] || LISTING_SORTS.popular);
}

// Unit price in cents, rounded to whole dollars before the frame is added.
export function printPrice(l, sizeId = 'a4', framed = false) {
  const size = PRINT_SIZES.find((s) => s.id === sizeId) || PRINT_SIZES[0];
  return Math.round((l.price * size.factor) / 100) * 100 + (framed ? FRAME_PRICE : 0);
}

export function quote(l, { size = 'a4', framed = false, qty = 1 } = {}) {
  const unit = printPrice(l, size, framed);
  const subtotal = unit * qty;
  const shipping = subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING;
  return { unit, subtotal, shipping, total: subtotal + shipping };
}

export function addListing({ postId = null, image = null, title, price, category = 'digital' }) {
  const l = { id: uid('l'), sellerId: meId(), postId, image: postId ? null : image, title: title.trim(), price, category, sales: 0, createdAt: Date.now() };
  state.listings.unshift(l);
  commit('listing', l.id);
  simulateSale(l.id);
  return l;
}

export function removeListing(id) {
  const l = listing(id);
  if (!l || l.sellerId !== meId()) return;
  state.listings = state.listings.filter((x) => x !== l);
  commit('listing-removed', id);
}

export function placeOrder({ listingId, size = 'a4', framed = false, qty = 1 }) {
  const l = listing(listingId);
  if (!l || l.sellerId === meId()) return null;
  const n = Math.min(MAX_QTY, Math.max(1, Math.floor(qty) || 1));
  const o = { id: uid('o'), buyerId: meId(), listingId, sellerId: l.sellerId, title: l.title, size, framed, qty: n, ...quote(l, { size, framed, qty: n }), createdAt: Date.now() };
  state.orders.push(o);
  l.sales += n;
  commit('order', o.id);
  return o;
}

export const orders = () => state.orders.filter((o) => o.buyerId === meId()).sort(byNewest);

// A sample artist buys a print soon after you list one, so selling feels real in the demo.
function simulateSale(listingId) {
  const pool = Object.values(state.users).filter((u) => !u.local);
  const buyer = pool[Math.floor(Math.random() * pool.length)];
  const size = PRINT_SIZES[Math.floor(Math.random() * PRINT_SIZES.length)];
  later(() => {
    const l = listing(listingId);
    if (!l) return;
    l.sales += 1;
    state.notifications.push({ id: uid('n'), toId: l.sellerId, type: 'sale', actorId: buyer.id, listingId, text: `${size.label} print of "${l.title}"`, createdAt: Date.now(), read: false });
    commit('sale', { listingId, actorId: buyer.id, title: l.title });
  }, 9000 + Math.random() * 5000);
}

/* ---------- search ---------- */

export function search(query) {
  const q = query.toLowerCase().trim().replace(/^[#@]/, '');
  if (!q) return { users: [], posts: [] };
  const users = Object.values(state.users).filter((u) => [u.name, u.handle, u.bio, u.location].some((v) => v?.toLowerCase().includes(q)));
  const posts = state.posts
    .filter((p) => p.caption.toLowerCase().includes(q) || p.medium?.toLowerCase().includes(q) || p.tags.some((t) => t.includes(q)) || categoryLabel(p.category).toLowerCase().includes(q))
    .sort((a, b) => likeCount(b) - likeCount(a));
  return { users, posts };
}

/* ---------- session ---------- */

export const handleTaken = (handle) => Object.values(state.users).some((u) => u.handle.toLowerCase() === handle.toLowerCase());

export function signUp({ name, handle }) {
  const id = uid('u');
  const now = Date.now();
  state.users[id] = {
    id, name, handle, bio: '', location: '', website: '', verified: false, commissions: false, local: true,
    joinedAt: now, baseFollowers: 0, baseFollowing: 0, style: 'mesh', palette: paletteFor('mesh', id),
  };
  state.follows[id] = ['u_mira', 'u_hana', 'u_kofi', 'u_jonas'];
  ['u_mira', 'u_hana'].forEach((a) => { (state.follows[a] ||= []).push(id); });
  state.notifications.push(
    { id: uid('n'), toId: id, type: 'follow', actorId: 'u_hana', createdAt: now - 30_000, read: false },
    { id: uid('n'), toId: id, type: 'follow', actorId: 'u_mira', createdAt: now - 60_000, read: false },
  );
  state.conversations.push({
    id: uid('dm'), members: [id, 'u_mira'], readAt: {},
    messages: [{ id: uid('m'), from: 'u_mira', text: `Welcome to Artistic, ${name.split(' ')[0]}! Post your first piece and tag it #firstpost so we can find you. 👋`, createdAt: now }],
  });
  state.session = { userId: id };
  commit('session');
}

export function useDemo() {
  state.session = { userId: state.demoUserId };
  commit('session');
}

export function logout() {
  clearTimers();
  state.session = null;
  commit('session');
}

export function reset() {
  clearTimers();
  state = buildSeed(Date.now());
  persist(true);
  emit('session');
}

/* ---------- theme ---------- */

export function getTheme() {
  const t = readStorage(THEME_KEY);
  return t === 'light' || t === 'dark' ? t : 'system';
}

export function setTheme(theme) {
  writeStorage(THEME_KEY, theme);
  const root = document.documentElement;
  if (theme === 'light' || theme === 'dark') root.setAttribute('data-theme', theme);
  else root.removeAttribute('data-theme');
}
