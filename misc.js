import * as store from '../store.js';
import { icon } from '../icons.js';
import { esc } from '../util.js';
import { avatar, emptyState, galleryGrid, pageHead } from '../components.js';

export const saved = {
  title: 'Saved',
  render() {
    const posts = store.savedPosts();
    return pageHead({ title: 'Saved', sub: 'Only you can see what you save.' }) + (posts.length
      ? galleryGrid(posts)
      : emptyState({ icon: 'bookmark', title: 'Nothing saved yet', text: 'Tap the bookmark on any post to keep it here for reference.', action: '<a class="btn btn-primary" href="#/explore">Explore work</a>' }));
  },
};

const THEMES = [['system', 'System', 'monitor'], ['light', 'Light', 'sun'], ['dark', 'Dark', 'moon']];

export const settings = {
  title: 'Settings',
  render() {
    const theme = store.getTheme();
    const u = store.me();
    return `${pageHead({ title: 'Settings' })}
    <section class="settings-group" aria-labelledby="set-look">
      <h2 class="settings-title" id="set-look">Appearance</h2>
      <div class="setting-row">
        <div><p class="setting-name">Theme</p><p class="setting-desc">System follows your device setting.</p></div>
        <div class="segmented" role="group" aria-label="Theme">${THEMES.map(([v, label, ic]) => `<button type="button" data-action="theme" data-value="${v}" aria-pressed="${theme === v}">${icon(ic, 16)}<span>${label}</span></button>`).join('')}</div>
      </div>
    </section>
    <section class="settings-group" aria-labelledby="set-account">
      <h2 class="settings-title" id="set-account">Account</h2>
      <div class="setting-row">
        <div class="setting-user">${avatar(u, 44)}<div><p class="setting-name">${esc(u.name)}</p><p class="setting-desc">@${esc(u.handle)}</p></div></div>
        <button type="button" class="btn btn-outline btn-sm" data-action="edit-profile">Edit profile</button>
      </div>
      <div class="setting-row">
        <div><p class="setting-name">Log out</p><p class="setting-desc">Your posts and messages stay saved in this browser.</p></div>
        <button type="button" class="btn btn-outline btn-sm" data-action="logout">${icon('logout', 16)}Log out</button>
      </div>
    </section>
    <section class="settings-group" aria-labelledby="set-data">
      <h2 class="settings-title" id="set-data">Data</h2>
      <div class="setting-row">
        <div><p class="setting-name">Reset the sample community</p><p class="setting-desc">Deletes your posts, comments, messages and any accounts you created in this browser, then restores the sample artists.</p></div>
        <button type="button" class="btn btn-danger-outline btn-sm" data-action="reset">Reset</button>
      </div>
    </section>
    <p class="settings-foot">Artistic currently keeps everything in this browser. Nothing you post is uploaded to a server.</p>`;
  },
};

export const notFound = {
  title: 'Page not found',
  render() {
    return pageHead({ title: 'Lost?', back: true }) + emptyState({
      icon: 'compass',
      title: 'This page doesn\'t exist',
      text: 'The link may be broken, or the page may have been removed.',
      action: '<a class="btn btn-primary" href="#/">Go home</a>',
    });
  },
};
