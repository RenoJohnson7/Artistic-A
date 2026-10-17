import * as store from '../store.js';
import { icon, verifiedBadge } from '../icons.js';
import { artURL, avatarURL } from '../art.js';
import { esc, fmtCount, monthYear, richText, stripProtocol } from '../util.js';
import { avatar, emptyState, followButton, galleryGrid, pageHead } from '../components.js';
import { openModal, toast } from '../ui.js';
import { prepareAvatar } from '../imaging.js';

function emptyFor(tab, mine, u) {
  if (tab === 'likes') return emptyState({ icon: 'heart', title: 'No likes yet', text: 'Posts you like will show up here.' });
  if (tab === 'saved') return emptyState({ icon: 'bookmark', title: 'Nothing saved yet', text: 'Tap the bookmark on any post to keep it here for reference.' });
  if (mine) return emptyState({ icon: 'image', title: 'Share your first piece', text: 'Finished work, sketches and works in progress all belong here.', action: '<button type="button" class="btn btn-primary" data-action="create">Create a post</button>' });
  return emptyState({ icon: 'image', title: 'No posts yet', text: `When ${u.name} shares work, it will show up here.` });
}

export const profile = {
  title: ([handle]) => {
    const u = store.userByHandle(handle);
    return u ? `${u.name} (@${u.handle})` : 'Profile';
  },
  render([handle, sub]) {
    const u = store.userByHandle(handle);
    if (!u) {
      return pageHead({ title: 'Profile', back: true, serif: false }) + emptyState({
        icon: 'user',
        title: 'This account doesn\'t exist',
        text: `There's no artist called @${handle}. Check the spelling or search for them.`,
        action: '<a class="btn btn-primary" href="#/explore">Search artists</a>',
      });
    }
    const mine = u.id === store.meId();
    const tab = mine && (sub === 'likes' || sub === 'saved') ? sub : 'posts';
    const posts = store.postsBy(u.id);
    const list = tab === 'likes' ? store.likedPosts() : tab === 'saved' ? store.savedPosts() : posts;
    const base = `#/u/${encodeURIComponent(u.handle)}`;
    const cover = artURL({ kind: 'gen', style: u.style, palette: u.palette, seed: `${u.id}-cover`, ratio: 3 });

    const actions = mine
      ? '<button type="button" class="btn btn-outline" data-action="edit-profile">Edit profile</button>'
      : `<button type="button" class="icon-btn icon-btn-outline" data-action="message-user" data-id="${esc(u.id)}" aria-label="Message ${esc(u.name)}">${icon('send', 18)}</button>${followButton(u, { size: 'md', label: store.followsMe(u.id) ? 'Follow back' : 'Follow' })}`;

    const site = stripProtocol(u.website);
    const meta = [
      u.location ? `<li>${icon('map-pin', 16)}<span>${esc(u.location)}</span></li>` : '',
      site ? `<li>${icon('link', 16)}<a href="https://${esc(site)}" target="_blank" rel="noopener noreferrer">${esc(site)}</a></li>` : '',
      `<li>${icon('calendar', 16)}<span>Joined ${esc(monthYear(u.joinedAt))}</span></li>`,
    ].join('');

    const tabLink = (key, label, href) => `<a class="tab" href="${href}" aria-current="${tab === key ? 'page' : 'false'}">${label}</a>`;
    const tabs = `<nav class="tabs" aria-label="Profile sections">${tabLink('posts', 'Posts', base)}${mine ? tabLink('likes', 'Likes', `${base}/likes`) + tabLink('saved', 'Saved', `${base}/saved`) : ''}</nav>`;

    return `${pageHead({
      title: esc(u.name),
      sub: `${posts.length} ${posts.length === 1 ? 'post' : 'posts'}`,
      back: true,
      serif: false,
      actions: mine ? `<a class="icon-btn" href="#/settings" aria-label="Settings">${icon('settings')}</a>` : '',
    })}
    <section class="profile" aria-label="About ${esc(u.name)}">
      <div class="profile-cover"><img src="${esc(cover)}" alt="" decoding="async"></div>
      <div class="profile-top">
        ${avatar(u, 112, 'profile-avatar')}
        <div class="profile-actions">${actions}</div>
      </div>
      <h2 class="profile-name">${esc(u.name)}${u.verified ? verifiedBadge(22) : ''}</h2>
      <p class="profile-handle">@${esc(u.handle)}${!mine && store.followsMe(u.id) ? '<span class="chip chip-muted">Follows you</span>' : ''}</p>
      ${u.commissions ? `<p class="chip chip-ok">${icon('check', 14)}Open for commissions</p>` : ''}
      ${u.bio ? `<p class="bio">${richText(u.bio)}</p>` : mine ? '<p class="bio muted">Add a bio so people know what you make.</p>' : ''}
      <ul class="meta-row">${meta}</ul>
      <p class="stats">
        <span><b>${posts.length}</b> ${posts.length === 1 ? 'post' : 'posts'}</span>
        <span><b data-followers="${esc(u.id)}">${fmtCount(store.followerCount(u))}</b> followers</span>
        <span><b>${fmtCount(store.followingCount(u))}</b> following</span>
      </p>
    </section>
    ${tabs}
    ${list.length ? galleryGrid(list) : emptyFor(tab, mine, u)}`;
  },
};

export function openEditProfile() {
  const u = store.me();
  let photo = u.avatarSrc || null;
  const m = openModal({
    title: 'Edit profile',
    body: `<form id="profile-form" class="form-stack" novalidate>
      <div class="avatar-edit">
        <img id="pf-avatar" class="avatar" src="${esc(photo || avatarURL(u.id))}" width="88" height="88" alt="Your profile photo">
        <div class="avatar-edit-actions">
          <label class="btn btn-outline btn-sm" for="pf-file">Upload photo</label>
          <input type="file" id="pf-file" accept="image/*" class="sr-only">
          <button type="button" class="btn btn-ghost btn-sm" id="pf-remove"${photo ? '' : ' hidden'}>Remove photo</button>
        </div>
      </div>
      <div class="field">
        <label class="field-label" for="pf-name">Display name</label>
        <input id="pf-name" class="input" maxlength="40" value="${esc(u.name)}" autocomplete="name" aria-describedby="pf-name-err">
        <p class="field-error" id="pf-name-err"></p>
      </div>
      <div class="field">
        <label class="field-label" for="pf-bio">Bio</label>
        <textarea id="pf-bio" class="input textarea" maxlength="160" rows="3" placeholder="What do you make? What are you learning?">${esc(u.bio)}</textarea>
        <p class="field-hint counter"><span id="pf-bio-count">${u.bio.length}</span>/160</p>
      </div>
      <div class="field-row">
        <div class="field"><label class="field-label" for="pf-location">Location</label><input id="pf-location" class="input" maxlength="40" value="${esc(u.location)}" autocomplete="address-level2"></div>
        <div class="field"><label class="field-label" for="pf-website">Website</label><input id="pf-website" class="input" maxlength="60" placeholder="yourname.art" value="${esc(u.website)}" autocomplete="url" inputmode="url"></div>
      </div>
      <label class="switch"><input type="checkbox" id="pf-commissions"${u.commissions ? ' checked' : ''}><span class="switch-ui" aria-hidden="true"></span><span class="switch-text"><b>Open for commissions</b><small>Shows a badge on your profile so people know they can hire you.</small></span></label>
      <p class="field-error" id="pf-error" role="alert"></p>
      <div class="form-actions"><button type="button" class="btn btn-ghost" data-close>Cancel</button><button type="submit" class="btn btn-primary">Save</button></div>
    </form>`,
  });

  const $ = (sel) => m.el.querySelector(sel);
  const img = $('#pf-avatar');
  $('#pf-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      photo = await prepareAvatar(file);
      img.src = photo;
      $('#pf-remove').hidden = false;
      $('#pf-error').textContent = '';
    } catch (err) {
      $('#pf-error').textContent = err.message;
    }
  });
  $('#pf-remove').addEventListener('click', () => {
    photo = null;
    img.src = avatarURL(u.id);
    $('#pf-remove').hidden = true;
  });
  $('#pf-bio').addEventListener('input', (e) => { $('#pf-bio-count').textContent = e.target.value.length; });
  $('#profile-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#pf-name').value.trim();
    if (!name) {
      $('#pf-name-err').textContent = 'Enter the name people will see on your posts.';
      $('#pf-name').focus();
      return;
    }
    m.close();
    store.updateProfile({
      name,
      bio: $('#pf-bio').value.trim(),
      location: $('#pf-location').value.trim(),
      website: stripProtocol($('#pf-website').value),
      commissions: $('#pf-commissions').checked,
      avatarSrc: photo || undefined,
    });
    toast('Profile updated');
  });
}
