// Post-level overlays: the full-screen artwork viewer and the options sheet.

import * as store from './store.js';
import { icon } from './icons.js';
import { artURL, artColors } from './art.js';
import { esc, firstName, fmtCount } from './util.js';
import { altText, avatar, displayName, profileHref, swatches } from './components.js';
import { confirmSheet, copyText, openModal, toast } from './ui.js';
import { syncFollow } from './sync.js';
import { getCurrent, navigate, refresh } from './router.js';

export const postLink = (id) => `${location.href.split('#')[0]}#/p/${id}`;

export function openLightbox(id) {
  const p = store.post(id);
  if (!p) return;
  const a = store.user(p.authorId);
  openModal({
    className: 'lightbox',
    bare: true,
    label: `Artwork by ${a.name}`,
    body: `<div class="lb" data-backdrop>
      <button type="button" class="icon-btn on-media lb-close" data-close aria-label="Close">${icon('x')}</button>
      <img class="lb-img" src="${esc(artURL(p.image))}" alt="${esc(altText(p, a))}">
      <div class="lb-bar">
        <a class="lb-who" href="${profileHref(a)}">${avatar(a, 36)}<span class="lb-who-text"><span class="name">${displayName(a)}</span><span class="lb-medium">${esc(p.medium || `@${a.handle}`)}</span></span></a>
        ${swatches(artColors(p.image), true)}
        <button type="button" class="act act-like lb-like" data-action="like" data-id="${esc(p.id)}" aria-pressed="${store.isLiked(p)}">${icon('heart', 20)}<span class="sr-only">Like</span><span class="count">${fmtCount(store.likeCount(p))}</span></button>
      </div>
    </div>`,
  });
}

export function openPostMenu(id) {
  const p = store.post(id);
  if (!p) return;
  const a = store.user(p.authorId);
  const mine = a.id === store.meId();
  const following = store.isFollowing(a.id);
  const m = openModal({
    className: 'sheet',
    label: 'Post options',
    body: `<div class="sheet-list">
      ${mine
        ? `<button type="button" class="sheet-item danger" data-sheet="delete">${icon('trash')}Delete post</button>`
        : `<button type="button" class="sheet-item" data-sheet="follow">${icon(following ? 'user-minus' : 'user-plus')}${following ? 'Unfollow' : 'Follow'} @${esc(a.handle)}</button>
           <button type="button" class="sheet-item" data-sheet="message">${icon('send')}Message ${esc(firstName(a.name))}</button>`}
      <button type="button" class="sheet-item" data-sheet="copy">${icon('link')}Copy link</button>
      <a class="sheet-item" href="#/p/${esc(p.id)}">${icon('maximize')}Open post</a>
      <button type="button" class="sheet-item cancel" data-close>Cancel</button>
    </div>`,
  });
  m.el.addEventListener('click', async (e) => {
    const action = e.target.closest('[data-sheet]')?.dataset.sheet;
    if (!action) return;
    if (action === 'copy') {
      m.close();
      copyText(postLink(p.id), 'Link copied');
    } else if (action === 'follow') {
      m.close();
      const on = store.toggleFollow(a.id);
      syncFollow(a.id);
      toast(on ? `Following @${a.handle}` : `Unfollowed @${a.handle}`);
    } else if (action === 'message') {
      navigate(`/messages/${store.startConversation(a.id)}`);
    } else if (action === 'delete') {
      m.close();
      const ok = await confirmSheet({ title: 'Delete this post?', text: 'It will be removed from your profile and from everyone\'s feeds. This can\'t be undone.', confirmLabel: 'Delete', danger: true });
      if (!ok) return;
      store.deletePost(p.id);
      if (getCurrent() === `/p/${p.id}`) navigate('/', { replace: true });
      else refresh();
      toast('Post deleted');
    }
  });
}
