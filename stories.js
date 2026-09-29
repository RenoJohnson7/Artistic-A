// Full-screen story viewer: tap the right side for next, left for previous,
// hold to pause. Replies go straight into your messages with that artist.

import * as store from './store.js';
import { icon } from './icons.js';
import { artURL } from './art.js';
import { esc, firstName, timeAgo } from './util.js';
import { avatar, profileHref, storiesRow } from './components.js';
import { openModal, toast } from './ui.js';
import { refreshConversationList } from './views/messages.js';

export function openStories(startUserId) {
  const groups = store.storyGroups();
  if (!groups.length) return;
  let gi = Math.max(0, groups.findIndex((g) => g.user.id === startUserId));
  let si = Math.max(0, groups[gi].stories.findIndex((s) => !store.isStorySeen(s.id)));

  const m = openModal({
    className: 'story-viewer',
    bare: true,
    label: 'Stories',
    body: '<div class="story-stage" id="story-stage"></div>',
    onClose: () => {
      const row = document.querySelector('.stories');
      if (row) row.outerHTML = storiesRow();
    },
  });
  const stage = m.el.querySelector('#story-stage');

  function show() {
    const g = groups[gi];
    const s = g.stories[si];
    const mine = g.user.id === store.meId();
    store.markStorySeen(s.id);
    stage.innerHTML = `
      <img class="story-img" src="${esc(artURL(store.storyImage(s)))}" alt="Story from ${esc(g.user.name)}${s.caption ? `: ${esc(s.caption)}` : ''}">
      <div class="story-shade" aria-hidden="true"></div>
      <div class="story-bars" aria-hidden="true">${g.stories.map((_, i) => `<span class="story-bar${i < si ? ' done' : ''}${i === si ? ' active' : ''}"><i></i></span>`).join('')}</div>
      <header class="story-head">
        <a class="story-who" href="${profileHref(g.user)}">${avatar(g.user, 34)}<span><b>${esc(g.user.name)}</b><span>${esc(timeAgo(s.createdAt))}</span></span></a>
        <button type="button" class="icon-btn on-media" data-close aria-label="Close stories">${icon('x')}</button>
      </header>
      <button type="button" class="story-nav prev" aria-label="Previous story"></button>
      <button type="button" class="story-nav next" aria-label="Next story"></button>
      ${s.caption ? `<p class="story-caption">${esc(s.caption)}</p>` : ''}
      ${mine ? '' : `<form class="story-reply" id="story-reply"><label class="sr-only" for="story-reply-input">Reply to ${esc(g.user.name)}</label><input id="story-reply-input" placeholder="Reply to ${esc(firstName(g.user.name))}…" autocomplete="off" maxlength="300"><button type="submit" class="icon-btn on-media" aria-label="Send reply">${icon('send', 18)}</button></form>`}`;
    stage.querySelector('.story-bar.active i')?.addEventListener('animationend', next);
  }

  function next() {
    if (si < groups[gi].stories.length - 1) si += 1;
    else if (gi < groups.length - 1) { gi += 1; si = 0; }
    else { m.close(); return; }
    show();
  }

  function prev() {
    if (si > 0) si -= 1;
    else if (gi > 0) { gi -= 1; si = groups[gi].stories.length - 1; }
    show();
  }

  const pause = (on) => stage.classList.toggle('paused', on);

  stage.addEventListener('click', (e) => {
    if (e.target.closest('.story-nav.next')) next();
    else if (e.target.closest('.story-nav.prev')) prev();
  });
  stage.addEventListener('pointerdown', (e) => { if (e.target.closest('.story-nav')) pause(true); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => stage.addEventListener(t, () => {
    if (document.activeElement?.id !== 'story-reply-input') pause(false);
  }));
  stage.addEventListener('focusin', (e) => { if (e.target.matches('input')) pause(true); });
  stage.addEventListener('focusout', (e) => { if (e.target.matches('input')) pause(false); });
  stage.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = stage.querySelector('#story-reply-input');
    const text = input.value.trim();
    if (!text) return;
    const g = groups[gi];
    const convId = store.startConversation(g.user.id);
    store.sendMessage(convId, text);
    input.value = '';
    input.blur();
    refreshConversationList();
    toast(`Reply sent to ${firstName(g.user.name)}`);
  });
  m.el.addEventListener('keydown', (e) => {
    if (e.target.matches('input')) return;
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  });

  show();
}
