import * as store from '../store.js';
import { icon } from '../icons.js';
import { esc, firstName } from '../util.js';
import { avatar, emptyState, pageHead, postCard, storiesRow, userRow } from '../components.js';

const TABS = [['foryou', 'For you'], ['following', 'Following']];

let tab = 'foryou';
try { tab = sessionStorage.getItem('artistic:tab') === 'following' ? 'following' : 'foryou'; } catch { /* storage blocked */ }

function composer() {
  const me = store.me();
  return `<div class="composer">
    ${avatar(me, 40)}
    <button type="button" class="composer-input" data-action="create">What are you working on, ${esc(firstName(me.name))}?</button>
    <button type="button" class="icon-btn" data-action="create" aria-label="Upload artwork">${icon('image')}</button>
    <button type="button" class="icon-btn" data-action="create" data-generate="1" aria-label="Post a generated sample">${icon('sparkles')}</button>
  </div>`;
}

function feedHTML() {
  const posts = store.feed(tab);
  if (!posts.length) {
    const people = store.suggestedUsers(4);
    return `${emptyState({ icon: 'user-plus', title: 'Your following feed is empty', text: 'Follow a few artists and their newest work will show up here, newest first.' })}${people.length ? `<div class="list card-list">${people.map((u) => userRow(u, { bio: true })).join('')}</div>` : ''}`;
  }
  return `${posts.map((p) => postCard(p)).join('')}<p class="feed-end">${icon('check', 18)}<span>You're all caught up. <a href="#/explore">Explore more work</a></span></p>`;
}

export const home = {
  title: 'Home',
  render() {
    const tabs = `<div class="tabs" role="tablist" aria-label="Feed">${TABS.map(([k, label]) => `<button type="button" class="tab" role="tab" aria-selected="${tab === k}" data-action="feed-tab" data-tab="${k}">${label}</button>`).join('')}</div>`;
    return `${pageHead({ below: tabs, className: 'home-head' })}
      ${storiesRow()}
      ${composer()}
      <div class="feed" id="feed">${feedHTML()}</div>`;
  },
  setTab(next) {
    tab = next;
    try { sessionStorage.setItem('artistic:tab', next); } catch { /* storage blocked */ }
    document.querySelectorAll('[data-action="feed-tab"]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === next)));
    const feed = document.getElementById('feed');
    if (feed) feed.innerHTML = feedHTML();
  },
};
