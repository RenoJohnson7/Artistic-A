import * as store from '../store.js';
import { icon } from '../icons.js';
import { dayLabel, esc, firstName, fmtCount, richText, timeAgo } from '../util.js';
import { avatar, displayName, emptyState, profileHref } from '../components.js';
import { openModal } from '../ui.js';
import { syncBadges } from '../sync.js';

const HOUR = 3_600_000;

export const bubble = (m, meId) => `<p class="bubble ${m.from === meId ? 'me' : 'them'}">${richText(m.text)}</p>`;

function messagesHTML(msgs, meId) {
  let out = '';
  let last = 0;
  msgs.forEach((m) => {
    if (m.createdAt - last > HOUR) out += `<p class="dm-day">${esc(dayLabel(m.createdAt))}</p>`;
    last = m.createdAt;
    out += bubble(m, meId);
  });
  return out;
}

function convItem(c, activeId) {
  const o = c.other;
  const last = c.last;
  const preview = last ? `${last.from === store.meId() ? 'You: ' : ''}${esc(last.text)}` : 'Say hello';
  return `<a class="dm-item${c.unread ? ' unread' : ''}" href="#/messages/${esc(c.id)}"${c.id === activeId ? ' aria-current="page"' : ''}>
    ${avatar(o, 48)}
    <span class="dm-item-main">
      <span class="dm-item-top"><span class="name">${displayName(o)}</span><span class="muted">${last ? esc(timeAgo(last.createdAt)) : ''}</span></span>
      <span class="dm-preview">${preview}</span>
    </span>
    ${c.unread ? '<span class="dot"><span class="sr-only">Unread</span></span>' : ''}
  </a>`;
}

const listHTML = (activeId) => {
  const convs = store.conversations();
  return convs.length
    ? convs.map((c) => convItem(c, activeId)).join('')
    : '<p class="dm-none">No conversations yet.</p>';
};

function threadHTML(c) {
  const o = c.other;
  const meId = store.meId();
  return `<header class="dm-thread-head">
      <a class="icon-btn dm-back" href="#/messages" aria-label="All conversations">${icon('arrow-left')}</a>
      <a class="dm-peer" href="${profileHref(o)}">${avatar(o, 40)}<span class="dm-peer-text"><span class="name">${displayName(o)}</span><span class="handle">@${esc(o.handle)}</span></span></a>
    </header>
    <div class="dm-scroll" id="dm-scroll">
      <div class="dm-intro">${avatar(o, 72)}<p class="name">${displayName(o)}</p><p class="muted">@${esc(o.handle)} · ${fmtCount(store.followerCount(o))} followers</p><a class="btn btn-outline btn-sm" href="${profileHref(o)}">View profile</a></div>
      <div class="dm-messages" id="dm-messages" aria-live="polite">${messagesHTML(c.messages, meId)}</div>
      <div class="typing" id="dm-typing" hidden><span class="sr-only">${esc(firstName(o.name))} is typing</span><i></i><i></i><i></i></div>
    </div>
    <form class="dm-compose" id="dm-form" data-conv="${esc(c.id)}">
      <label class="sr-only" for="dm-input">Message ${esc(o.name)}</label>
      <input id="dm-input" class="dm-input" placeholder="Message ${esc(firstName(o.name))}…" autocomplete="off" maxlength="1000">
      <button class="icon-btn icon-btn-accent" type="submit" aria-label="Send">${icon('send', 18)}</button>
    </form>`;
}

const scrollToEnd = () => {
  const s = document.getElementById('dm-scroll');
  if (s) s.scrollTop = s.scrollHeight;
};

export const messages = {
  wide: true,
  title: ([id]) => {
    const c = id && store.conversation(id);
    return c ? `Messages with ${c.other.name}` : 'Messages';
  },
  render([id]) {
    const active = id ? store.conversation(id) : null;
    const thread = active
      ? threadHTML(active)
      : `<div class="dm-empty">${emptyState({
        icon: id ? 'comment' : 'send',
        title: id ? 'Conversation not found' : 'Your messages',
        text: id ? 'It may have been removed. Pick another conversation or start a new one.' : 'Swap tips, plan collaborations or ask about commissions.',
        action: '<button type="button" class="btn btn-primary" data-action="new-message">New message</button>',
      })}</div>`;
    return `<div class="dm"${id ? ' data-open' : ''}>
      <section class="dm-list" aria-label="Conversations">
        <header class="dm-list-head"><h1 class="page-title">Messages</h1><button type="button" class="icon-btn" data-action="new-message" aria-label="New message">${icon('edit')}</button></header>
        <nav class="dm-items" id="dm-items" aria-label="Conversations">${listHTML(active?.id)}</nav>
      </section>
      <section class="dm-thread"${active ? ` data-conv="${esc(active.id)}"` : ''} aria-label="Conversation">${thread}</section>
    </div>`;
  },
  mount(root, [id]) {
    if (!id || !store.conversation(id)) return;
    store.markConversationRead(id);
    syncBadges();
    root.querySelector('.dm-item[aria-current="page"]')?.classList.remove('unread');
    root.querySelector('.dm-item[aria-current="page"] .dot')?.remove();
    scrollToEnd();
    if (window.matchMedia('(hover: hover)').matches) root.querySelector('#dm-input')?.focus({ preventScroll: true });
  },
};

export function refreshConversationList() {
  const items = document.getElementById('dm-items');
  if (!items) return;
  const active = document.querySelector('.dm-thread[data-conv]')?.dataset.conv;
  items.innerHTML = listHTML(active);
}

export function appendMessage(convId, message) {
  const wrap = document.querySelector(`.dm-thread[data-conv="${CSS.escape(convId)}"] #dm-messages`);
  if (!wrap) return false;
  wrap.insertAdjacentHTML('beforeend', bubble(message, store.meId()));
  scrollToEnd();
  return true;
}

export function setTyping(convId, on) {
  const el = document.querySelector(`.dm-thread[data-conv="${CSS.escape(convId)}"] #dm-typing`);
  if (!el) return;
  el.hidden = !on;
  scrollToEnd();
}

export function submitMessage(form) {
  const input = form.querySelector('#dm-input');
  const text = input.value.trim();
  if (!text) return;
  const msg = store.sendMessage(form.dataset.conv, text);
  if (!msg) return;
  input.value = '';
  appendMessage(form.dataset.conv, msg);
  refreshConversationList();
}

export function openNewMessage() {
  const people = store.allArtists();
  openModal({
    title: 'New message',
    body: `<div class="picker">${people.map((u) => `<button type="button" class="picker-item" data-action="message-user" data-id="${esc(u.id)}">${avatar(u, 40)}<span class="picker-text"><span class="name">${displayName(u)}</span><span class="handle">@${esc(u.handle)}${store.isFollowing(u.id) ? ' · Following' : ''}</span></span></button>`).join('')}</div>`,
  });
}
