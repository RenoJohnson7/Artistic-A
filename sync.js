// Targeted DOM updates after a change, so likes and follows don't re-render
// whole pages (which would reset scroll and re-decode images).

import * as store from './store.js';
import { fmtCount } from './util.js';

const setCount = (el, n) => {
  const c = el.querySelector('.count');
  if (c) c.textContent = n ? fmtCount(n) : '';
};

export function syncPost(id) {
  const p = store.post(id);
  if (!p) return;
  document.querySelectorAll(`[data-id="${CSS.escape(id)}"]`).forEach((el) => {
    switch (el.dataset.action) {
      case 'like':
        el.setAttribute('aria-pressed', String(store.isLiked(p)));
        setCount(el, store.likeCount(p));
        break;
      case 'repost':
        el.setAttribute('aria-pressed', String(store.isReposted(p)));
        setCount(el, store.repostCount(p));
        break;
      case 'save':
        el.setAttribute('aria-pressed', String(store.isSaved(p)));
        break;
      case 'comment':
        setCount(el, store.commentCount(p));
        break;
      default:
        break;
    }
  });
}

export function syncFollow(userId) {
  const u = store.user(userId);
  if (!u) return;
  const on = String(store.isFollowing(userId));
  document.querySelectorAll(`[data-action="follow"][data-id="${CSS.escape(userId)}"]`).forEach((b) => b.setAttribute('aria-pressed', on));
  document.querySelectorAll(`[data-followers="${CSS.escape(userId)}"]`).forEach((el) => { el.textContent = fmtCount(store.followerCount(u)); });
}

export function syncBadges() {
  const counts = { notifications: store.unreadNotifications(), messages: store.unreadMessages() };
  document.querySelectorAll('[data-badge]').forEach((b) => {
    const n = counts[b.dataset.badge] || 0;
    b.hidden = !n;
    b.textContent = n > 9 ? '9+' : String(n);
  });
}

export function pop(el) {
  el.classList.remove('pop');
  void el.offsetWidth;
  el.classList.add('pop');
}
