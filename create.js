// The "New post" dialog: upload or generate an image, write a caption, publish.

import * as store from './store.js';
import { icon } from './icons.js';
import { artURL, artColors } from './art.js';
import { esc } from './util.js';
import { avatar, displayName, swatches } from './components.js';
import { openModal, toast } from './ui.js';
import { prepareArtwork } from './imaging.js';
import { getCurrent, navigate } from './router.js';

export function openCreate({ caption = '', story = false, generate = false } = {}) {
  const me = store.me();
  let image = null;

  const categories = store.CATEGORIES.map((c) => `<option value="${c.id}">${esc(c.label)}</option>`).join('');
  const m = openModal({
    title: 'New post',
    className: 'wide create-modal',
    body: `<form id="create-form" class="create" novalidate>
      <div class="create-media">
        <div class="drop" id="create-drop" data-state="empty">
          <div class="drop-empty">
            <span class="drop-icon">${icon('upload', 26)}</span>
            <p class="drop-title">Drag your artwork here</p>
            <p class="drop-hint">JPG, PNG, WebP or GIF up to 20 MB</p>
            <div class="drop-actions">
              <label class="btn btn-primary btn-sm" for="create-file">Choose file</label>
              <input type="file" id="create-file" accept="image/*" class="sr-only">
              <button type="button" class="btn btn-outline btn-sm" id="create-generate">${icon('sparkles', 16)}Generate a sample</button>
            </div>
          </div>
          <img id="create-preview" class="drop-preview" alt="Preview of your artwork" hidden>
          <div class="drop-tools" hidden>
            <button type="button" class="icon-btn on-media" id="create-regen" aria-label="Generate a different sample">${icon('refresh', 18)}</button>
            <button type="button" class="icon-btn on-media" id="create-remove" aria-label="Remove image">${icon('x', 18)}</button>
          </div>
        </div>
        <div class="create-palette" id="create-palette"></div>
      </div>
      <div class="create-fields">
        <div class="create-author">${avatar(me, 36)}<span class="name">${displayName(me)}</span></div>
        <div class="field">
          <label class="sr-only" for="create-caption">Caption</label>
          <textarea id="create-caption" class="input textarea" rows="4" maxlength="500" placeholder="Tell people about this piece. Add #tags so others can find it.">${esc(caption)}</textarea>
          <p class="field-hint counter"><span id="create-count">${caption.length}</span>/500</p>
        </div>
        <div class="field">
          <label class="field-label" for="create-medium">Medium and tools</label>
          <input id="create-medium" class="input" maxlength="60" placeholder="Gouache on paper, Procreate, Blender…" autocomplete="off">
        </div>
        <div class="field-row">
          <div class="field"><label class="field-label" for="create-category">Category</label><select id="create-category" class="input">${categories}</select></div>
          <div class="field"><label class="field-label" for="create-hours">Time spent</label><input id="create-hours" class="input" maxlength="16" placeholder="3h" autocomplete="off"></div>
        </div>
        <label class="switch"><input type="checkbox" id="create-feedback"><span class="switch-ui" aria-hidden="true"></span><span class="switch-text"><b>Ask for feedback</b><small>Adds a "Feedback wanted" label so people know critique is welcome.</small></span></label>
        <label class="switch"><input type="checkbox" id="create-story"${story ? ' checked' : ''}><span class="switch-ui" aria-hidden="true"></span><span class="switch-text"><b>Add to your story</b><small>Shows at the top of your followers' home feed.</small></span></label>
      </div>
      <footer class="create-foot">
        <p class="field-error" id="create-error" role="alert"></p>
        <button type="button" class="btn btn-ghost" data-close>Cancel</button>
        <button type="submit" class="btn btn-primary" id="create-submit" disabled>Publish</button>
      </footer>
    </form>`,
  });

  const $ = (sel) => m.el.querySelector(sel);
  const drop = $('#create-drop');
  const preview = $('#create-preview');
  const tools = $('.drop-tools');
  const submit = $('#create-submit');
  const error = $('#create-error');
  const captionEl = $('#create-caption');

  function setImage(next) {
    image = next;
    drop.dataset.state = next ? 'filled' : 'empty';
    preview.hidden = !next;
    tools.hidden = !next;
    $('#create-regen').hidden = !next || next.kind !== 'gen';
    if (next) {
      preview.src = artURL(next);
      preview.style.aspectRatio = String(next.ratio);
    } else {
      preview.removeAttribute('src');
    }
    $('#create-palette').innerHTML = next ? `<span class="create-palette-label">Palette</span>${swatches(artColors(next), true)}` : '';
    submit.disabled = !next;
    error.textContent = '';
  }

  async function useFile(file) {
    if (!file) return;
    drop.dataset.state = 'loading';
    try {
      setImage(await prepareArtwork(file));
    } catch (err) {
      setImage(null);
      error.textContent = err.message;
    }
  }

  $('#create-file').addEventListener('change', (e) => useFile(e.target.files[0]));
  $('#create-generate').addEventListener('click', () => setImage(store.randomSampleImage()));
  $('#create-regen').addEventListener('click', () => setImage(store.randomSampleImage()));
  $('#create-remove').addEventListener('click', () => { setImage(null); $('#create-file').value = ''; });

  ['dragenter', 'dragover'].forEach((type) => drop.addEventListener(type, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach((type) => drop.addEventListener(type, () => drop.classList.remove('is-over')));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    useFile(e.dataTransfer.files[0]);
  });

  captionEl.addEventListener('input', () => { $('#create-count').textContent = captionEl.value.length; });

  $('#create-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!image) {
      error.textContent = 'Add an image first: upload your artwork or generate a sample.';
      return;
    }
    store.addPost({
      caption: captionEl.value,
      image,
      medium: $('#create-medium').value,
      hours: $('#create-hours').value,
      category: $('#create-category').value,
      feedback: $('#create-feedback').checked,
      toStory: $('#create-story').checked,
    });
    m.close();
    const onHome = getCurrent() === '/' || getCurrent() === '/home';
    navigate('/', { replace: onHome });
    toast('Published');
  });

  if (generate) setImage(store.randomSampleImage());
  if (caption) {
    captionEl.focus();
    captionEl.setSelectionRange(caption.length, caption.length);
  }
}
