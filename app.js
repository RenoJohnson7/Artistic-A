// Entry point: boots the store, renders the shell and wires global events.

import * as store from './store.js';
import * as router from './router.js';
import { VIEWS } from './views/index.js';
import { handleAction } from './actions.js';
import { syncBadges, syncPost } from './sync.js';
import { closeAllModals, toast } from './ui.js';
import { markNav, railHTML, shellHTML } from './shell.js';
import { renderWelcome } from './welcome.js';
import { submitComment, syncComment } from './views/post.js';
import { appendMessage, refreshConversationList, setTyping, submitMessage } from './views/messages.js';

const app = document.getElementById('app');
let shellReady = false;
let firstRender = true;

function render({ restore = false, keepScroll = false } = {}) {
  closeAllModals();

  if (!store.me()) {
    shellReady = false;
    renderWelcome(app);
    document.title = 'Artistic: where artists share the process';
    window.scrollTo(0, 0);
    return;
  }

  if (!shellReady) {
    app.innerHTML = shellHTML();
    shellReady = true;
  }

  const shell = document.getElementById('shell');
  const main = document.getElementById('main');
  const rail = document.getElementById('rail');
  const { name, params, query } = router.match(router.getCurrent());
  const view = VIEWS[name] || VIEWS.notFound;
  const wide = typeof view.wide === 'function' ? view.wide(params) : Boolean(view.wide);

  const y = window.scrollY;
  shell.dataset.route = name;
  shell.toggleAttribute('data-wide', wide);
  main.innerHTML = view.render(params, query);
  view.mount?.(main, params, query);
  if (!wide) rail.innerHTML = railHTML();
  markNav(name, params);
  syncBadges();

  const title = typeof view.title === 'function' ? view.title(params, query) : view.title;
  document.title = `${title} · Artistic`;

  if (keepScroll) window.scrollTo(0, y);
  else window.scrollTo(0, restore ? router.savedScroll() : 0);
  if (!firstRender && !keepScroll) main.focus({ preventScroll: true });
  firstRender = false;
}

function onIncomingMessage({ convId, message }) {
  const viewing = document.querySelector(`.dm-thread[data-conv="${CSS.escape(convId)}"]`);
  if (viewing && document.visibilityState === 'visible') {
    appendMessage(convId, message);
    store.markConversationRead(convId);
  } else {
    const from = store.user(message.from);
    toast(`New message from ${from?.name || 'an artist'}`, { action: 'Open', onAction: () => router.navigate(`/messages/${convId}`) });
  }
  refreshConversationList();
  syncBadges();
}

store.subscribe((type, payload) => {
  switch (type) {
    case 'session':
      shellReady = false;
      render();
      break;
    case 'profile':
      shellReady = false;
      render({ keepScroll: true });
      break;
    case 'engagement':
      syncPost(payload.postId);
      if (payload.commentId) syncComment(payload.commentId);
      syncBadges();
      if (payload.first) {
        const who = store.user(payload.actorId);
        toast(`${who.name} liked your post`, { action: 'View', onAction: () => router.navigate('/notifications') });
      }
      break;
    case 'sale': {
      syncBadges();
      if (router.getCurrent() === '/marketplace/listings' && !document.querySelector('dialog[open]')) render({ keepScroll: true });
      const who = store.user(payload.actorId);
      toast(`${who.name} bought a print of "${payload.title}"`, { action: 'View', onAction: () => router.navigate('/notifications') });
      break;
    }
    case 'message':
      onIncomingMessage(payload);
      break;
    case 'typing':
      setTyping(payload.convId, payload.on);
      break;
    case 'storage-full':
      toast('Your browser storage is full, so new images may not survive a reload.', { duration: 6000 });
      break;
    default:
      break;
  }
});

document.addEventListener('click', (e) => {
  const actionEl = e.target.closest('[data-action]');
  if (actionEl && !actionEl.disabled && handleAction(actionEl, e)) return;

  if (e.target.closest('a[href="#main"]')) {
    e.preventDefault();
    document.getElementById('main')?.focus();
    return;
  }

  const link = e.target.closest('a[href^="#/"]');
  if (link) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    router.navigate(link.getAttribute('href').slice(1));
    return;
  }

  // Clicking the empty parts of a post card opens the post.
  const card = e.target.closest('[data-open-post]');
  if (card && !e.target.closest('a, button, input, textarea, label, [role="button"]') && !String(window.getSelection?.() || '')) {
    router.navigate(`/p/${card.dataset.openPost}`);
  }
});

document.addEventListener('submit', (e) => {
  const form = e.target;
  if (form.matches('[data-search-form]')) {
    e.preventDefault();
    const q = form.querySelector('input').value.trim();
    router.navigate(q ? `/explore?q=${encodeURIComponent(q)}` : '/explore');
  } else if (form.id === 'comment-form') {
    e.preventDefault();
    submitComment(form);
  } else if (form.id === 'dm-form') {
    e.preventDefault();
    submitMessage(form);
  }
});

document.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('[role="button"][data-action]')) {
    e.preventDefault();
    e.target.click();
  }
});

store.init();
router.start(render);
