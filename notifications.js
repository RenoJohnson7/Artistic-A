import * as store from '../store.js';
import { icon } from '../icons.js';
import { artURL } from '../art.js';
import { esc, richText, timeAgo } from '../util.js';
import { avatar, emptyState, followButton, pageHead, profileHref } from '../components.js';
import { getCurrent } from '../router.js';
import { syncBadges } from '../sync.js';

const TYPES = {
  like: { icon: 'heart', tone: 'like', text: 'liked your post' },
  'comment-like': { icon: 'heart', tone: 'like', text: 'liked your comment' },
  comment: { icon: 'comment', tone: 'comment', text: 'commented on your post' },
  mention: { icon: 'at-sign', tone: 'mention', text: 'mentioned you in a comment' },
  follow: { icon: 'user-plus', tone: 'follow', text: 'started following you' },
  repost: { icon: 'repeat', tone: 'repost', text: 'reposted your work' },
  sale: { icon: 'bag', tone: 'sale', text: 'bought a print of your work' },
};

const FILTERS = [['all', 'All'], ['mentions', 'Comments and mentions']];
let filter = 'all';
let readTimer = 0;

function item(n) {
  const actor = store.user(n.actorId);
  const t = TYPES[n.type];
  if (!actor || !t) return '';
  const p = n.postId ? store.post(n.postId) : null;
  const l = n.listingId ? store.listing(n.listingId) : null;
  const image = p?.image || (l && store.listingImage(l));
  const target = n.type === 'sale' ? '#/marketplace/listings' : p ? `#/p/${esc(p.id)}` : profileHref(actor);
  const side = n.type === 'follow'
    ? followButton(actor, { label: 'Follow back' })
    : image ? `<a class="notif-thumb" href="${target}" tabindex="-1" aria-hidden="true"><img src="${esc(artURL(image))}" alt="" loading="lazy" decoding="async"></a>` : '';
  return `<article class="notif${n.read ? '' : ' unread'}">
    <a class="notif-avatar" href="${profileHref(actor)}" tabindex="-1" aria-hidden="true">${avatar(actor, 44)}<span class="notif-type tone-${t.tone}">${icon(t.icon, 12)}</span></a>
    <div class="notif-body">
      <p class="notif-text"><a class="notif-actor" href="${profileHref(actor)}">${esc(actor.name)}</a> <a class="notif-link" href="${target}">${t.text}</a> <span class="muted">· ${esc(timeAgo(n.createdAt))}</span>${n.read ? '' : '<span class="sr-only"> (new)</span>'}</p>
      ${n.text ? `<p class="notif-quote">${richText(n.text)}</p>` : ''}
    </div>
    ${side}
  </article>`;
}

export const notificationsView = {
  title: 'Notifications',
  render() {
    const all = store.notifications();
    const list = filter === 'all' ? all : all.filter((n) => n.type === 'comment' || n.type === 'mention');
    const fresh = list.filter((n) => !n.read);
    const earlier = list.filter((n) => n.read);
    const tabs = `<div class="tabs" role="tablist" aria-label="Filter notifications">${FILTERS.map(([k, label]) => `<button type="button" class="tab" role="tab" aria-selected="${filter === k}" data-action="notif-tab" data-tab="${k}">${label}</button>`).join('')}</div>`;
    const markAll = fresh.length ? '<button type="button" class="btn btn-ghost btn-sm" data-action="mark-read">Mark all as read</button>' : '';
    const body = list.length
      ? `${fresh.length ? `<h2 class="group-label">New</h2><div class="notif-list">${fresh.map(item).join('')}</div>` : ''}${earlier.length ? `<h2 class="group-label">Earlier</h2><div class="notif-list">${earlier.map(item).join('')}</div>` : ''}`
      : emptyState({ icon: 'bell', title: 'Nothing here yet', text: filter === 'all' ? 'Likes, comments and new followers will show up here.' : 'When someone comments on your work or mentions you, it will show up here.' });
    return pageHead({ title: 'Notifications', actions: markAll, below: tabs }) + body;
  },
  mount() {
    clearTimeout(readTimer);
    if (!store.unreadNotifications()) return;
    // Clear the badge shortly after the list has been seen; highlights stay until the next visit.
    readTimer = setTimeout(() => {
      if (getCurrent() !== '/notifications') return;
      store.markNotificationsRead();
      syncBadges();
    }, 1500);
  },
  setFilter(next) {
    filter = next;
  },
};
