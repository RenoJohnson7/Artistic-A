// Shared UI pieces rendered as HTML strings. All user text passes through esc().

import * as store from './store.js';
import { icon, verifiedBadge } from './icons.js';
import { artURL, artColors, avatarURL } from './art.js';
import { esc, fmtCount, timeAgo, fullDate, richText } from './util.js';

export const avatarSrc = (u) => u.avatarSrc || avatarURL(u.id);

export const avatar = (u, size = 40, cls = '') =>
  `<img class="avatar ${cls}" src="${esc(avatarSrc(u))}" width="${size}" height="${size}" alt="" loading="lazy" decoding="async">`;

export const displayName = (u) => `<span class="dn">${esc(u.name)}</span>${u.verified ? verifiedBadge() : ''}`;

export const profileHref = (u) => `#/u/${encodeURIComponent(u.handle)}`;

export function altText(p, author) {
  const words = p.caption.replace(/#[\p{L}\p{N}_]+/gu, '').replace(/\s+/g, ' ').trim();
  const excerpt = words.length > 110 ? `${words.slice(0, 107)}…` : words;
  return `Artwork by ${author?.name || 'an artist'}${excerpt ? `: ${excerpt}` : ''}`;
}

export function followButton(u, { size = 'sm', label = 'Follow' } = {}) {
  if (!u || u.id === store.meId()) return '';
  return `<button type="button" class="btn ${size === 'sm' ? 'btn-sm' : ''} follow-btn" data-action="follow" data-id="${esc(u.id)}" aria-pressed="${store.isFollowing(u.id)}"><span class="f-off">${esc(label)}</span><span class="f-on">Following</span><span class="f-un">Unfollow</span></button>`;
}

export function swatches(colors, withHex = false) {
  if (!colors?.length) return '';
  return `<span class="swatches${withHex ? ' with-hex' : ''}" role="group" aria-label="Color palette">${colors
    .map((c) => {
      const hex = esc(c.toUpperCase());
      return `<button type="button" class="swatch" style="--c:${esc(c)}" data-action="copy-hex" data-hex="${hex}" title="Copy ${hex}"><span class="swatch-chip" aria-hidden="true"></span>${withHex ? `<span class="hex">${hex}</span>` : `<span class="sr-only">Copy ${hex}</span>`}</button>`;
    })
    .join('')}</span>`;
}

function actionButton(action, p, iconName, label, count = null, pressed = null) {
  const pressedAttr = pressed === null ? '' : ` aria-pressed="${pressed}"`;
  const countHTML = count === null ? '' : `<span class="count">${count ? fmtCount(count) : ''}</span>`;
  return `<button type="button" class="act act-${action}" data-action="${action}" data-id="${esc(p.id)}"${pressedAttr}>${icon(iconName, 20)}<span class="sr-only">${label}</span>${countHTML}</button>`;
}

export function postCard(p, { detail = false } = {}) {
  const a = store.user(p.authorId);
  if (!a) return '';
  const mine = a.id === store.meId();
  const href = profileHref(a);
  const ratio = detail ? p.image.ratio : Math.max(p.image.ratio, 0.8);
  const time = `<time datetime="${new Date(p.createdAt).toISOString()}" title="${esc(fullDate(p.createdAt))}">${esc(timeAgo(p.createdAt))}</time>`;
  return `<article class="post${detail ? ' post-detail' : ' is-link'}"${detail ? '' : ` data-open-post="${esc(p.id)}"`} aria-labelledby="by-${esc(p.id)}">
  <header class="post-head">
    <a href="${href}" class="post-avatar" tabindex="-1" aria-hidden="true">${avatar(a, 42)}</a>
    <div class="post-who">
      <a class="name" id="by-${esc(p.id)}" href="${href}">${displayName(a)}</a>
      <div class="sub"><a href="${href}">@${esc(a.handle)}</a><span aria-hidden="true">·</span>${detail ? time : `<a href="#/p/${esc(p.id)}">${time}</a>`}</div>
    </div>
    ${!mine && (detail || !store.isFollowing(a.id)) ? followButton(a) : ''}
    <button type="button" class="icon-btn" data-action="post-menu" data-id="${esc(p.id)}" aria-label="More options">${icon('more')}</button>
  </header>
  ${p.feedback ? `<p class="chip chip-feedback">${icon('comment', 14)}Feedback wanted</p>` : ''}
  ${p.caption ? `<p class="caption">${richText(p.caption)}</p>` : ''}
  <div class="media" role="button" tabindex="0" data-action="media" data-id="${esc(p.id)}" style="--ar:${ratio}" aria-label="View artwork full screen">
    <img src="${esc(artURL(p.image))}" alt="${esc(altText(p, a))}" loading="lazy" decoding="async">
    <span class="heart-burst" aria-hidden="true">${icon('heart', 96)}</span>
  </div>
  <div class="post-meta">
    ${p.medium ? `<span class="medium">${icon('palette', 16)}<span>${esc(p.medium)}${p.hours ? ` · ${esc(p.hours)}` : ''}</span></span>` : '<span></span>'}
    ${swatches(artColors(p.image))}
  </div>
  ${detail ? `<p class="post-date">${esc(fullDate(p.createdAt))}</p>` : ''}
  <footer class="post-actions">
    ${actionButton('like', p, 'heart', 'Like', store.likeCount(p), store.isLiked(p))}
    ${actionButton('comment', p, 'comment', 'Comment', store.commentCount(p))}
    ${actionButton('repost', p, 'repeat', 'Repost', store.repostCount(p), store.isReposted(p))}
    ${actionButton('share', p, 'share', 'Copy link to post')}
    <span class="spacer"></span>
    ${actionButton('save', p, 'bookmark', 'Save', null, store.isSaved(p))}
  </footer>
</article>`;
}

export function tile(p) {
  const a = store.user(p.authorId);
  return `<a class="tile" href="#/p/${esc(p.id)}"><img src="${esc(artURL(p.image))}" alt="${esc(altText(p, a))}" loading="lazy" decoding="async"><span class="tile-overlay" aria-hidden="true"><span>${icon('heart', 18)}${fmtCount(store.likeCount(p))}</span><span>${icon('comment', 18)}${fmtCount(store.commentCount(p))}</span></span></a>`;
}

export const galleryGrid = (posts) => `<div class="gallery">${posts.map(tile).join('')}</div>`;

export function masonry(posts) {
  return `<div class="masonry">${posts
    .map((p) => {
      const a = store.user(p.authorId);
      return `<a class="m-item" href="#/p/${esc(p.id)}" style="--ar:${p.image.ratio}"><img src="${esc(artURL(p.image))}" alt="${esc(altText(p, a))}" loading="lazy" decoding="async"><span class="m-cap">${avatar(a, 24)}<span class="m-name">${esc(a.name)}</span><span class="m-likes">${icon('heart', 14)}${fmtCount(store.likeCount(p))}</span></span></a>`;
    })
    .join('')}</div>`;
}

export function userRow(u, { bio = false, followLabel = 'Follow' } = {}) {
  return `<div class="user-row"><a href="${profileHref(u)}" class="user-row-link">${avatar(u, 44)}<span class="user-row-text"><span class="name">${displayName(u)}</span><span class="handle">@${esc(u.handle)}</span>${bio && u.bio ? `<span class="user-row-bio">${esc(u.bio)}</span>` : ''}</span></a>${followButton(u, { label: followLabel })}</div>`;
}

export const emptyState = ({ icon: iconName = 'sparkles', title, text, action = '' }) =>
  `<div class="empty"><span class="empty-icon">${icon(iconName, 26)}</span><h2 class="empty-title">${esc(title)}</h2><p class="empty-text">${esc(text)}</p>${action}</div>`;

// title and sub may contain markup; callers escape user text.
export function pageHead({ title = '', sub = '', back = false, actions = '', below = '', serif = true, className = '' } = {}) {
  const row = title || back || actions
    ? `<div class="page-head-row">${back ? `<button type="button" class="icon-btn" data-action="back" aria-label="Back">${icon('arrow-left')}</button>` : ''}<div class="page-head-titles">${title ? `<h1 class="${serif ? 'page-title' : 'page-title-sm'}">${title}</h1>` : ''}${sub ? `<p class="page-sub">${sub}</p>` : ''}</div>${actions}</div>`
    : '';
  return `<div class="page-head ${className}">${row}${below}</div>`;
}

export function storiesRow() {
  const me = store.me();
  const groups = store.storyGroups();
  const hasMine = groups.some((g) => g.user.id === me.id);
  const add = hasMine ? '' : `<button type="button" class="story" data-action="create" data-story="1"><span class="story-ring is-add">${avatar(me, 60)}<span class="story-plus">${icon('plus', 14)}</span></span><span class="story-name">Your story</span></button>`;
  return `<section class="stories" aria-label="Stories">${add}${groups
    .map((g) => `<button type="button" class="story${g.seen ? ' seen' : ''}" data-action="story" data-user="${esc(g.user.id)}" aria-label="View story from ${esc(g.user.name)}${g.seen ? '' : ', new'}"><span class="story-ring">${avatar(g.user, 60)}</span><span class="story-name">${g.user.id === me.id ? 'Your story' : esc(g.user.handle)}</span></button>`)
    .join('')}</section>`;
}
