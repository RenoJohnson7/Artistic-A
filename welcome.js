// Sign-up screen shown when nobody is signed in.

import * as store from './store.js';
import { brandMark } from './icons.js';
import { artURL } from './art.js';

const MOSAIC = [
  ['landscape', 'gouache', 'p_m1', 0.8], ['pixel', 'neon', 'p_h1', 1], ['bauhaus', 'bauhaus', 'p_l1', 0.75], ['wash', 'meadow', 'p_s1', 0.8],
  ['orbit', 'kente', 'p_k1', 0.8], ['dusk', 'nordic', 'p_j1', 1.5], ['topo', 'ink', 'p_y1', 0.8], ['memphis', 'citrus', 'p_d1', 0.75],
  ['waves', 'ocean', 'p_t1', 1.25], ['spheres', 'neon', 'p_a1', 1.25], ['pattern', 'kente', 'p_am1', 0.8], ['landscape', 'sorbet', 'p_m3', 1],
  ['pixel', 'ember', 'p_h2', 1], ['dusk', 'ember', 'p_j2', 0.8], ['bauhaus', 'mono', 'p_l4', 1], ['topo', 'clay', 'p_y2', 1],
];

const HANDLE_RE = /^[a-z0-9_.]{3,20}$/;
const suggestHandle = (name) => name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '').slice(0, 16);

export function renderWelcome(root) {
  const columns = [0, 1, 2, 3].map((c) => `<div class="mosaic-col">${MOSAIC.filter((_, i) => i % 4 === c)
    .map(([style, palette, seed, ratio]) => `<img src="${artURL({ kind: 'gen', style, palette, seed, ratio })}" alt="" style="aspect-ratio:${ratio}" decoding="async">`)
    .join('')}</div>`).join('');

  root.innerHTML = `<div class="welcome">
    <section class="welcome-art" aria-hidden="true">
      <div class="mosaic">${columns}</div>
      <p class="welcome-credit">Featured today: <b>Last light over the Coast Mountains</b> by @mirapaints · gouache, 18×24 cm</p>
    </section>
    <main class="welcome-panel" id="main">
      <p class="brand">${brandMark('bm-welcome', 36)}<span class="brand-word">Artistic</span></p>
      <h1 class="welcome-title">Where artists <em>share the process.</em></h1>
      <p class="welcome-lede">Post finished pieces and works in progress, follow the artists you love, and ask for honest feedback.</p>
      <form id="welcome-form" class="form-stack" novalidate>
        <div class="field">
          <label class="field-label" for="w-name">Display name</label>
          <input id="w-name" class="input" autocomplete="name" maxlength="40" placeholder="Frida K." aria-describedby="w-name-err">
          <p class="field-error" id="w-name-err"></p>
        </div>
        <div class="field">
          <label class="field-label" for="w-handle">Username</label>
          <div class="input-affix"><span aria-hidden="true">@</span><input id="w-handle" class="input" autocomplete="username" maxlength="20" placeholder="fridapaints" spellcheck="false" autocapitalize="off" aria-describedby="w-handle-hint w-handle-err"></div>
          <p class="field-hint" id="w-handle-hint">3 to 20 characters: letters, numbers, dots and underscores.</p>
          <p class="field-error" id="w-handle-err"></p>
        </div>
        <button type="submit" class="btn btn-primary btn-lg btn-block">Create account</button>
      </form>
      <div class="divider"><span>or</span></div>
      <button type="button" class="btn btn-outline btn-lg btn-block" id="w-demo">Explore as Sam, a sample artist</button>
      <p class="welcome-note">Artistic runs in your browser for now: your account and posts are saved on this device only.</p>
    </main>
  </div>`;

  const $ = (sel) => root.querySelector(sel);
  const nameEl = $('#w-name');
  const handleEl = $('#w-handle');
  let handleEdited = false;

  nameEl.addEventListener('input', () => {
    $('#w-name-err').textContent = '';
    if (!handleEdited) handleEl.value = suggestHandle(nameEl.value);
  });
  handleEl.addEventListener('input', () => {
    handleEdited = true;
    $('#w-handle-err').textContent = '';
  });

  $('#welcome-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameEl.value.trim();
    const handle = handleEl.value.trim().replace(/^@/, '').toLowerCase();
    let ok = true;
    if (!name) {
      $('#w-name-err').textContent = 'Enter the name people will see on your posts.';
      ok = false;
    }
    if (!HANDLE_RE.test(handle)) {
      $('#w-handle-err').textContent = 'Use 3 to 20 letters, numbers, dots or underscores.';
      ok = false;
    } else if (store.handleTaken(handle)) {
      $('#w-handle-err').textContent = `@${handle} is taken. Try adding a word or a number.`;
      ok = false;
    }
    if (!ok) {
      (name ? handleEl : nameEl).focus();
      return;
    }
    store.signUp({ name, handle });
  });

  $('#w-demo').addEventListener('click', () => store.useDemo());
}
