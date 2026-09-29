// UI primitives: toasts, modal dialogs, confirmation sheets and copy-to-clipboard.

import { icon } from './icons.js';
import { esc } from './util.js';

export function toast(message, { action, onAction, duration = 3200 } = {}) {
  const dialogs = document.querySelectorAll('dialog[open]');
  const host = dialogs[dialogs.length - 1] || document.body;
  let region = host.querySelector(':scope > .toasts');
  if (!region) {
    region = document.createElement('div');
    region.className = 'toasts';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    host.append(region);
  }
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span>${esc(message)}</span>${action ? `<button type="button" class="toast-action">${esc(action)}</button>` : ''}`;
  const timer = setTimeout(dismiss, duration);
  function dismiss() {
    clearTimeout(timer);
    el.classList.add('out');
    setTimeout(() => el.remove(), 220);
  }
  el.querySelector('.toast-action')?.addEventListener('click', () => { onAction?.(); dismiss(); });
  region.append(el);
}

let modalCount = 0;

export function openModal({ title = '', body = '', className = '', bare = false, label = '', onClose } = {}) {
  const dlg = document.createElement('dialog');
  dlg.className = `modal ${className}`.trim();
  const titleId = `modal-title-${++modalCount}`;
  if (title) dlg.setAttribute('aria-labelledby', titleId);
  else if (label) dlg.setAttribute('aria-label', label);
  dlg.innerHTML = bare
    ? body
    : `<div class="modal-card">${title ? `<header class="modal-head"><h2 id="${titleId}">${esc(title)}</h2><button type="button" class="icon-btn" data-close aria-label="Close">${icon('x')}</button></header>` : ''}<div class="modal-body">${body}</div></div>`;
  document.body.append(dlg);
  const close = () => { if (dlg.open) dlg.close(); };
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg || e.target.hasAttribute?.('data-backdrop') || e.target.closest('[data-close]')) close();
  });
  dlg.addEventListener('close', () => {
    onClose?.();
    dlg.remove();
  });
  dlg.showModal();
  return { el: dlg, close };
}

export const closeAllModals = () => document.querySelectorAll('dialog[open]').forEach((d) => d.close());

export function confirmSheet({ title, text, confirmLabel = 'Confirm', danger = false }) {
  return new Promise((resolve) => {
    let confirmed = false;
    const m = openModal({
      className: 'confirm',
      label: title,
      body: `<div class="confirm-body"><h2 class="confirm-title">${esc(title)}</h2><p class="confirm-text">${esc(text)}</p><div class="confirm-actions"><button type="button" class="btn btn-lg btn-block ${danger ? 'btn-danger' : 'btn-primary'}" data-confirm>${esc(confirmLabel)}</button><button type="button" class="btn btn-lg btn-block btn-outline" data-close>Cancel</button></div></div>`,
      onClose: () => resolve(confirmed),
    });
    m.el.querySelector('[data-confirm]').addEventListener('click', () => { confirmed = true; m.close(); });
  });
}

// Must be called from inside a click handler so the clipboard permission applies.
export async function copyText(text, successMessage = 'Copied') {
  try {
    await navigator.clipboard.writeText(text);
    toast(successMessage);
  } catch {
    const m = openModal({
      title: 'Copy link',
      body: `<label class="field-label" for="copy-field">Select the text below and copy it.</label><input class="input" id="copy-field" readonly value="${esc(text)}">`,
    });
    const field = m.el.querySelector('#copy-field');
    field.focus();
    field.select();
  }
}
