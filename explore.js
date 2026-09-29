import * as store from '../store.js';
import { icon } from '../icons.js';
import { artURL } from '../art.js';
import { esc, fmtCount } from '../util.js';
import { avatar, displayName, emptyState, followButton, masonry, pageHead, profileHref, userRow } from '../components.js';

export function searchForm(q = '', id = 'explore-search') {
  return `<form class="search search-lg" role="search" data-search-form>${icon('search', 18)}<label class="sr-only" for="${id}">Search Artistic</label><input id="${id}" name="q" type="search" value="${esc(q)}" placeholder="Search artists, tags or mediums" autocomplete="off" enterkeyhint="search"></form>`;
}

function chips(active) {
  const all = [{ id: 'all', label: 'All' }, ...store.CATEGORIES];
  return `<nav class="chips" aria-label="Categories">${all
    .map((c) => `<a class="chip-filter" href="#/explore${c.id === 'all' ? '' : `?c=${c.id}`}"${c.id === active ? ' aria-current="true"' : ''}>${esc(c.label)}</a>`)
    .join('')}</nav>`;
}

function artistCard(u) {
  const cover = artURL({ kind: 'gen', style: u.style, palette: u.palette, seed: `${u.id}-cover`, ratio: 2.2 });
  return `<article class="artist-card">
    <a href="${profileHref(u)}" class="artist-link">
      <img class="artist-cover" src="${esc(cover)}" alt="" loading="lazy" decoding="async">
      ${avatar(u, 56, 'artist-avatar')}
      <span class="artist-name name">${displayName(u)}</span>
      <span class="artist-handle">@${esc(u.handle)}</span>
      <span class="artist-stat"><b data-followers="${esc(u.id)}">${fmtCount(store.followerCount(u))}</b> followers</span>
    </a>
    ${followButton(u)}
  </article>`;
}

function results(q) {
  const { users, posts } = store.search(q);
  if (!users.length && !posts.length) {
    return emptyState({ icon: 'search', title: 'Nothing matches that yet', text: `No artists or posts match "${q}". Try a medium like gouache or a tag like #pixelart.` });
  }
  return `${users.length ? `<section class="section"><h2 class="section-title">Artists</h2><div class="list">${users.slice(0, 5).map((u) => userRow(u, { bio: true })).join('')}</div></section>` : ''}
    ${posts.length ? `<section class="section"><div class="section-head"><h2 class="section-title">Posts</h2><span class="section-sub">${posts.length} ${posts.length === 1 ? 'piece' : 'pieces'}</span></div>${masonry(posts)}</section>` : ''}`;
}

export const explore = {
  title: (params, query) => (query.get('q') ? `Search: ${query.get('q')}` : 'Explore'),
  render(params, query) {
    const q = (query.get('q') || '').trim();
    const cat = store.CATEGORIES.some((c) => c.id === query.get('c')) ? query.get('c') : 'all';
    const head = pageHead({ title: 'Explore', below: searchForm(q) + (q ? '' : chips(cat)) });
    if (q) return head + results(q);
    const artists = store.suggestedUsers(8);
    const posts = store.popularPosts(cat);
    return `${head}
      ${cat === 'all' && artists.length ? `<section class="section"><div class="section-head"><h2 class="section-title">Artists to know</h2></div><div class="artist-strip">${artists.map(artistCard).join('')}</div></section>` : ''}
      <section class="section">
        <div class="section-head"><h2 class="section-title">${cat === 'all' ? 'Popular this week' : esc(store.categoryLabel(cat))}</h2><span class="section-sub">${posts.length} ${posts.length === 1 ? 'piece' : 'pieces'}</span></div>
        ${posts.length ? masonry(posts) : emptyState({ icon: 'image', title: 'No work here yet', text: 'Be the first to post in this category.', action: '<button type="button" class="btn btn-primary" data-action="create">Share your work</button>' })}
      </section>`;
  },
};

export const tag = {
  title: ([t]) => `#${t}`,
  render([t]) {
    const name = String(t).toLowerCase().replace(/^#/, '');
    const posts = store.postsByTag(name);
    const head = pageHead({
      title: `#${esc(name)}`,
      back: true,
      sub: `${fmtCount(store.tagCount(name))} posts · ${esc(store.tagKicker(name))}`,
      actions: `<button type="button" class="btn btn-primary btn-sm" data-action="create" data-caption="#${esc(name)} ">${icon('plus', 16)}Post</button>`,
    });
    return head + (posts.length
      ? masonry(posts)
      : emptyState({ icon: 'image', title: `Nothing in #${name} yet`, text: 'Share a piece with this tag and it will show up here.' }));
  },
};
