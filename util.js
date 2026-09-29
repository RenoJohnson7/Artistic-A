// Small shared helpers: escaping, ids, formatting and rich text.

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (value = '') => String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);

export const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
export const fmtCount = (n = 0) => (n < 1000 ? String(n) : compact.format(n));
export const fmtNumber = (n = 0) => n.toLocaleString('en');
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const fmtPrice = (cents = 0) => usd.format(cents / 100);

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export function timeAgo(ts, now = Date.now()) {
  const diff = Math.max(0, now - ts);
  if (diff < 45_000) return 'now';
  if (diff < HOUR) return `${Math.max(1, Math.floor(diff / MIN))}m`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d`;
  const date = new Date(ts);
  const sameYear = date.getFullYear() === new Date(now).getFullYear();
  return date.toLocaleDateString('en', sameYear ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fullDate(ts) {
  const d = new Date(ts);
  const time = d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' });
  const day = d.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${time} · ${day}`;
}

export const monthYear = (ts) => new Date(ts).toLocaleDateString('en', { month: 'long', year: 'numeric' });

export function dayLabel(ts, now = Date.now()) {
  const d = new Date(ts);
  const time = d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' });
  const today = new Date(now);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  if (ts >= startOfToday) return `Today ${time}`;
  if (ts >= startOfToday - DAY) return `Yesterday ${time}`;
  return `${d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}, ${time}`;
}

export const firstName = (name = '') => name.trim().split(/\s+/)[0] || name;

const TAG_RE = /(^|[^\p{L}\p{N}_&#])#([\p{L}\p{N}_]{1,40})/gu;
const MENTION_RE = /(^|[^\w@.])@([a-z0-9_](?:[a-z0-9_.]{0,28}[a-z0-9_])?)/gi;

// Escapes user text, then links #tags and @mentions to their pages.
export function richText(text = '') {
  return esc(text)
    .replace(TAG_RE, (_, pre, tag) => `${pre}<a class="tag" href="#/tag/${encodeURIComponent(tag.toLowerCase())}">#${tag}</a>`)
    .replace(MENTION_RE, (_, pre, handle) => `${pre}<a class="mention" href="#/u/${handle.toLowerCase()}">@${handle}</a>`)
    .replace(/\n/g, '<br>');
}

export function extractTags(text = '') {
  const tags = [];
  for (const m of String(text).matchAll(TAG_RE)) {
    const tag = m[2].toLowerCase();
    if (!tags.includes(tag)) tags.push(tag);
  }
  return tags;
}

export const stripProtocol = (url = '') => url.trim().replace(/^https?:\/\//i, '').replace(/\/$/, '');
