import * as store from '../store.js';
import { icon } from '../icons.js';
import { esc, firstName, fmtPrice, richText, timeAgo } from '../util.js';
import { avatar, displayName, emptyState, galleryGrid, pageHead, postCard, profileHref } from '../components.js';
import { syncPost } from '../sync.js';

let focusComposer = false;
export const requestCommentFocus = () => { focusComposer = true; };

export function commentHTML(c, postAuthorId) {
  const a = store.user(c.authorId);
  if (!a) return '';
  const likes = store.commentLikeCount(c);
  return `<article class="comment" id="comment-${esc(c.id)}">
    <a href="${profileHref(a)}" tabindex="-1" aria-hidden="true">${avatar(a, 36)}</a>
    <div class="comment-main">
      <p class="comment-head"><a class="name" href="${profileHref(a)}">${displayName(a)}</a>${a.id === postAuthorId ? '<span class="chip chip-artist">Artist</span>' : ''}<span class="muted">${esc(timeAgo(c.createdAt))}</span></p>
      <p class="comment-text">${richText(c.text)}</p>
    </div>
    <button type="button" class="act act-like act-sm" data-action="like-comment" data-id="${esc(c.id)}" aria-pressed="${store.isCommentLiked(c)}">${icon('heart', 16)}<span class="sr-only">Like comment</span><span class="count">${likes || ''}</span></button>
  </article>`;
}

function printBar(p, mine) {
  const l = store.listingForPost(p.id);
  if (l && !mine) {
    return `<div class="print-cta">${icon('bag', 22)}<p class="print-cta-text"><b>Prints available</b><span>A4 to A2, from ${esc(fmtPrice(l.price))}</span></p><button type="button" class="btn btn-primary btn-sm" data-action="buy-print" data-id="${esc(l.id)}">Buy print</button></div>`;
  }
  if (l) {
    return `<div class="print-cta">${icon('tag', 22)}<p class="print-cta-text"><b>For sale in the marketplace</b><span>${l.sales} ${l.sales === 1 ? 'print' : 'prints'} sold, from ${esc(fmtPrice(l.price))}</span></p><a class="btn btn-outline btn-sm" href="#/marketplace/listings">Manage</a></div>`;
  }
  if (mine) {
    return `<div class="print-cta">${icon('tag', 22)}<p class="print-cta-text"><b>Sell prints of this piece</b><span>People can order it in A4, A3 or A2.</span></p><button type="button" class="btn btn-outline btn-sm" data-action="sell-art" data-post="${esc(p.id)}">Sell prints</button></div>`;
  }
  return '';
}

export const postView = {
  title: ([id]) => {
    const p = store.post(id);
    const a = p && store.user(p.authorId);
    return a ? `${a.name} on Artistic` : 'Post';
  },
  render([id]) {
    const p = store.post(id);
    if (!p) {
      return pageHead({ title: 'Post', back: true, serif: false }) + emptyState({
        icon: 'image',
        title: 'This post is gone',
        text: 'The artist may have deleted it.',
        action: '<a class="btn btn-primary" href="#/">Back to home</a>',
      });
    }
    const a = store.user(p.authorId);
    const me = store.me();
    const list = store.comments(p.id);
    const more = store.postsBy(a.id).filter((x) => x.id !== p.id).slice(0, 3);
    const placeholder = a.id === me.id ? 'Reply to your commenters…' : `Add a comment for ${firstName(a.name)}…`;
    return `${pageHead({ title: 'Post', back: true, serif: false })}
      ${postCard(p, { detail: true })}
      ${printBar(p, a.id === me.id)}
      <section class="comments" aria-label="Comments">
        ${p.feedback && a.id !== me.id ? `<p class="feedback-note">${icon('comment', 16)}<span>${esc(firstName(a.name))} asked for feedback. Be specific and kind.</span></p>` : ''}
        <form class="reply" id="comment-form" data-post="${esc(p.id)}">
          ${avatar(me, 36)}
          <label class="sr-only" for="comment-input">Add a comment</label>
          <input id="comment-input" class="reply-input" maxlength="300" placeholder="${esc(placeholder)}" autocomplete="off">
          <button class="btn btn-primary btn-sm" type="submit">Reply</button>
        </form>
        <div class="comment-list" id="comment-list">
          ${list.length ? list.map((c) => commentHTML(c, a.id)).join('') : '<p class="comments-empty" id="comments-empty">No comments yet. Start the conversation.</p>'}
        </div>
      </section>
      ${more.length ? `<section class="section"><div class="section-head"><h2 class="section-title">More from ${esc(firstName(a.name))}</h2><a class="section-link" href="${profileHref(a)}">View profile</a></div>${galleryGrid(more)}</section>` : ''}`;
  },
  mount(root) {
    if (focusComposer) {
      focusComposer = false;
      root.querySelector('#comment-input')?.focus();
    }
  },
};

export function submitComment(form) {
  const input = form.querySelector('#comment-input');
  const text = input.value.trim();
  if (!text) {
    input.focus();
    return;
  }
  const p = store.post(form.dataset.post);
  if (!p) return;
  const c = store.addComment(p.id, text);
  input.value = '';
  document.getElementById('comments-empty')?.remove();
  const list = document.getElementById('comment-list');
  list.insertAdjacentHTML('beforeend', commentHTML(c, p.authorId));
  list.lastElementChild?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  syncPost(p.id);
}

export function syncComment(id) {
  const c = store.commentById(id);
  if (!c) return;
  document.querySelectorAll(`[data-action="like-comment"][data-id="${CSS.escape(id)}"]`).forEach((b) => {
    b.setAttribute('aria-pressed', String(store.isCommentLiked(c)));
    const count = b.querySelector('.count');
    if (count) count.textContent = store.commentLikeCount(c) || '';
  });
}
