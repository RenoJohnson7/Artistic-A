// Every clickable [data-action] element is handled here through one delegated listener.

import * as store from './store.js';
import { back, getCurrent, navigate, refresh } from './router.js';
import { pop, syncBadges, syncFollow, syncPost } from './sync.js';
import { confirmSheet, copyText, toast } from './ui.js';
import { openCreate } from './create.js';
import { openStories } from './stories.js';
import { openLightbox, openPostMenu, postLink } from './post-ui.js';
import { home } from './views/home.js';
import { notificationsView } from './views/notifications.js';
import { openEditProfile } from './views/profile.js';
import { openNewMessage } from './views/messages.js';
import { requestCommentFocus, syncComment } from './views/post.js';
import { openBuy, openSell } from './views/marketplace.js';

let mediaTimer = 0;
let mediaId = null;

function burst(el) {
  el.classList.remove('burst');
  void el.offsetWidth;
  el.classList.add('burst');
}

const HANDLERS = {
  like(el) {
    const on = store.toggleLike(el.dataset.id);
    syncPost(el.dataset.id);
    if (on) pop(el);
  },
  save(el) {
    const on = store.toggleSave(el.dataset.id);
    syncPost(el.dataset.id);
    toast(on ? 'Saved to your collection' : 'Removed from saved');
  },
  repost(el) {
    const on = store.toggleRepost(el.dataset.id);
    syncPost(el.dataset.id);
    if (on) pop(el);
    toast(on ? 'Reposted to your followers' : 'Repost removed');
  },
  share(el) {
    copyText(postLink(el.dataset.id), 'Link copied');
  },
  comment(el) {
    const path = `/p/${el.dataset.id}`;
    if (getCurrent() === path) {
      document.getElementById('comment-input')?.focus();
      return;
    }
    requestCommentFocus();
    navigate(path);
  },
  // Single tap opens the viewer; double tap likes, like on Instagram.
  media(el) {
    const id = el.dataset.id;
    if (mediaTimer && mediaId === id) {
      clearTimeout(mediaTimer);
      mediaTimer = 0;
      const p = store.post(id);
      if (p && !store.isLiked(p)) {
        store.toggleLike(id);
        syncPost(id);
      }
      burst(el);
      return;
    }
    clearTimeout(mediaTimer);
    mediaId = id;
    mediaTimer = setTimeout(() => {
      mediaTimer = 0;
      openLightbox(id);
    }, 260);
  },
  'post-menu'(el) {
    openPostMenu(el.dataset.id);
  },
  follow(el) {
    store.toggleFollow(el.dataset.id);
    syncFollow(el.dataset.id);
  },
  create(el) {
    openCreate({ story: el.dataset.story === '1', generate: el.dataset.generate === '1', caption: el.dataset.caption || '' });
  },
  challenge() {
    openCreate({ caption: '#monochrome ' });
  },
  story(el) {
    openStories(el.dataset.user);
  },
  'copy-hex'(el) {
    copyText(el.dataset.hex, `Copied ${el.dataset.hex}`);
  },
  back() {
    back();
  },
  'feed-tab'(el) {
    home.setTab(el.dataset.tab);
  },
  'notif-tab'(el) {
    notificationsView.setFilter(el.dataset.tab);
    refresh();
  },
  'mark-read'(el) {
    store.markNotificationsRead();
    syncBadges();
    document.querySelectorAll('.notif.unread').forEach((n) => n.classList.remove('unread'));
    el.hidden = true;
  },
  theme(el) {
    store.setTheme(el.dataset.value);
    document.querySelectorAll('[data-action="theme"]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === el.dataset.value)));
  },
  async logout() {
    const ok = await confirmSheet({ title: 'Log out of Artistic?', text: 'Your posts and messages stay saved in this browser, so you can pick up where you left off.', confirmLabel: 'Log out' });
    if (!ok) return;
    store.logout();
    navigate('/', { replace: true });
  },
  async reset() {
    const ok = await confirmSheet({ title: 'Reset the sample community?', text: 'This deletes your posts, comments, messages and any accounts created in this browser. It can\'t be undone.', confirmLabel: 'Reset everything', danger: true });
    if (!ok) return;
    store.reset();
    navigate('/', { replace: true });
    toast('Sample community restored');
  },
  'edit-profile'() {
    openEditProfile();
  },
  'message-user'(el) {
    navigate(`/messages/${store.startConversation(el.dataset.id)}`);
  },
  'new-message'() {
    openNewMessage();
  },
  'buy-print'(el) {
    openBuy(el.dataset.id);
  },
  'sell-art'(el) {
    openSell({ postId: el.dataset.post || '' });
  },
  async 'remove-listing'(el) {
    const l = store.listing(el.dataset.id);
    if (!l) return;
    const ok = await confirmSheet({ title: `Stop selling "${l.title}"?`, text: 'It comes off the marketplace right away. Orders already placed are not affected.', confirmLabel: 'Remove listing', danger: true });
    if (!ok) return;
    store.removeListing(l.id);
    refresh();
    toast('Listing removed');
  },
  'like-comment'(el) {
    const on = store.toggleCommentLike(el.dataset.id);
    syncComment(el.dataset.id);
    if (on) pop(el);
  },
};

export function handleAction(el, event) {
  const fn = HANDLERS[el.dataset.action];
  if (!fn) return false;
  event.preventDefault();
  fn(el, event);
  return true;
}
