// App frame: side navigation, mobile top bar and tab bar, and the discovery rail.

import * as store from './store.js';
import { brandMark, icon } from './icons.js';
import { artURL } from './art.js';
import { esc, fmtCount, fmtNumber } from './util.js';
import { avatar, displayName, userRow } from './components.js';

function navItems(me) {
  return [
    { key: 'home', href: '#/', icon: 'home', label: 'Home' },
    { key: 'explore', href: '#/explore', icon: 'compass', label: 'Explore' },
    { key: 'marketplace', href: '#/marketplace', icon: 'bag', label: 'Marketplace' },
    { key: 'notifications', href: '#/notifications', icon: 'bell', label: 'Notifications', badge: 'notifications' },
    { key: 'messages', href: '#/messages', icon: 'send', label: 'Messages', badge: 'messages' },
    { key: 'saved', href: '#/saved', icon: 'bookmark', label: 'Saved' },
    { key: 'profile', href: `#/u/${encodeURIComponent(me.handle)}`, icon: 'user', label: 'Profile' },
    { key: 'settings', href: '#/settings', icon: 'settings', label: 'Settings' },
  ];
}

const badge = (name) => (name ? `<span class="badge" data-badge="${name}" hidden></span>` : '');

export function shellHTML() {
  const me = store.me();
  const items = navItems(me);
  const tab = (key) => items.find((i) => i.key === key);
  return `<a class="skip-link" href="#main">Skip to content</a>
  <div class="shell" id="shell">
    <header class="topbar">
      <a href="#/" class="brand" aria-label="Artistic, home">${brandMark('bm-top', 28)}<span class="brand-word">Artistic</span></a>
      <div class="topbar-actions">
        <a class="icon-btn" href="#/explore" aria-label="Search">${icon('search')}</a>
        <a class="icon-btn" href="#/marketplace" data-nav="marketplace" aria-label="Marketplace">${icon('bag')}</a>
        <a class="icon-btn has-badge" href="#/messages" data-nav="messages" aria-label="Messages">${icon('send')}${badge('messages')}</a>
      </div>
    </header>

    <nav class="sidenav" aria-label="Main">
      <a href="#/" class="brand" aria-label="Artistic, home">${brandMark('bm-side')}<span class="brand-word">Artistic</span></a>
      <ul class="nav-list">
        ${items.map((i) => `<li><a class="nav-link" href="${i.href}" data-nav="${i.key}" title="${i.label}"><span class="nav-icon">${icon(i.icon, 24)}${badge(i.badge)}</span><span class="label">${i.label}</span></a></li>`).join('')}
      </ul>
      <button type="button" class="create-btn" data-action="create" title="Create a post">${icon('plus', 22)}<span class="label">Create</span></button>
      <a class="account-chip" href="#/u/${encodeURIComponent(me.handle)}" title="Your profile">
        ${avatar(me, 40)}
        <span class="who"><span class="name">${displayName(me)}</span><span class="handle">@${esc(me.handle)}</span></span>
      </a>
    </nav>

    <main class="main" id="main" tabindex="-1"></main>

    <aside class="rail" id="rail" aria-label="Discover"></aside>

    <nav class="tabbar" aria-label="Main">
      ${['home', 'explore'].map((k) => `<a class="tab-link" href="${tab(k).href}" data-nav="${k}" aria-label="${tab(k).label}">${icon(tab(k).icon, 26)}</a>`).join('')}
      <button type="button" class="tab-link tab-create" data-action="create" aria-label="Create a post"><span>${icon('plus', 22)}</span></button>
      <a class="tab-link" href="#/notifications" data-nav="notifications" aria-label="Notifications">${icon('bell', 26)}${badge('notifications')}</a>
      <a class="tab-link" href="${tab('profile').href}" data-nav="profile" aria-label="Your profile">${avatar(me, 28)}</a>
    </nav>
  </div>`;
}

export function railHTML() {
  const tags = store.trendingTags(5);
  const people = store.suggestedUsers(3);
  const challenge = artURL({ kind: 'gen', style: 'mesh', palette: 'mono', seed: 'challenge-monochrome', ratio: 2.6 });
  return `<form class="search" role="search" data-search-form>${icon('search', 18)}<label class="sr-only" for="rail-search">Search Artistic</label><input id="rail-search" name="q" type="search" placeholder="Search artists, tags or mediums" autocomplete="off" enterkeyhint="search"></form>

  <section class="rail-card challenge" aria-labelledby="challenge-title">
    <img class="challenge-art" src="${esc(challenge)}" alt="" decoding="async">
    <div class="challenge-body">
      <p class="eyebrow">${icon('trophy', 14)}Weekly challenge</p>
      <h2 class="challenge-title" id="challenge-title">#monochrome</h2>
      <p class="challenge-text">Make a piece with one hue plus black and white.</p>
      <p class="challenge-meta"><span><b>${fmtNumber(store.tagCount('monochrome'))}</b> entries</span><span>Ends Sunday</span></p>
      <button type="button" class="btn btn-light btn-sm btn-block" data-action="challenge">Join the challenge</button>
    </div>
  </section>

  <section class="rail-card" aria-labelledby="trending-title">
    <h2 class="rail-title" id="trending-title">Trending tags</h2>
    <ul class="trend-list">${tags.map((t) => `<li><a class="trend" href="#/tag/${encodeURIComponent(t.tag)}"><span class="trend-kicker">${esc(t.kicker)}</span><span class="trend-tag">#${esc(t.tag)}</span><span class="trend-count">${fmtCount(t.count)} posts</span></a></li>`).join('')}</ul>
  </section>

  ${people.length ? `<section class="rail-card" aria-labelledby="follow-title">
    <h2 class="rail-title" id="follow-title">Artists to follow</h2>
    <div class="list">${people.map((u) => userRow(u)).join('')}</div>
    <a class="rail-more" href="#/explore">See more artists</a>
  </section>` : ''}

  <footer class="rail-foot"><p>© ${new Date().getFullYear()} Artistic · A home for working artists</p></footer>`;
}

export function markNav(name, params) {
  const me = store.me();
  let key = name;
  if (name === 'profile') key = store.userByHandle(params[0])?.id === me.id ? 'profile' : '';
  if (name === 'tag') key = 'explore';
  document.querySelectorAll('[data-nav]').forEach((a) => {
    if (a.dataset.nav === key) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}
