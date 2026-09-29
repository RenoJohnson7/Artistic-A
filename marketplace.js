// Print-on-demand marketplace: browse prints, buy one, and list your own work.

import * as store from '../store.js';
import { icon } from '../icons.js';
import { artURL } from '../art.js';
import { esc, fmtCount, fmtPrice, fullDate } from '../util.js';
import { avatar, emptyState, pageHead, profileHref } from '../components.js';
import { navigate, refresh } from '../router.js';
import { openModal, toast } from '../ui.js';
import { prepareArtwork } from '../imaging.js';

const SORTS = [['popular', 'Most popular'], ['newest', 'Newest'], ['price-asc', 'Price: low to high'], ['price-desc', 'Price: high to low']];
const SECTIONS = [['', 'Shop'], ['listings', 'Your listings'], ['orders', 'Orders']];

const excerpt = (text, n = 48) => {
  const words = text.replace(/#[\p{L}\p{N}_]+/gu, '').replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s/)[0] || '';
  if (words.length <= n) return words.replace(/[.!?]$/, '');
  const cut = words.slice(0, n);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 20 ? cut.lastIndexOf(' ') : n).replace(/[\s,;:]+$/, '')}…`;
};

export function listingCard(l) {
  const seller = store.user(l.sellerId);
  const image = store.listingImage(l);
  if (!seller || !image) return '';
  const mine = seller.id === store.meId();
  const img = `<img src="${esc(artURL(image))}" alt="${esc(`${l.title} by ${seller.name}`)}" loading="lazy" decoding="async"><span class="price-tag"><small>from</small>${esc(fmtPrice(l.price))}</span>`;
  return `<article class="product">
    ${mine
      ? `<div class="product-media">${img}</div>`
      : `<button type="button" class="product-media" data-action="buy-print" data-id="${esc(l.id)}" aria-label="Buy a print of ${esc(l.title)}">${img}</button>`}
    <div class="product-body">
      <h3 class="product-title" title="${esc(l.title)}">${esc(l.title)}</h3>
      <a class="product-by" href="${profileHref(seller)}">${avatar(seller, 20)}<span>by ${esc(seller.name)}</span></a>
      <p class="product-sold">${l.sales ? `${fmtCount(l.sales)} sold` : 'New listing'}</p>
      <div class="product-foot">${mine
        ? `<button type="button" class="btn btn-outline btn-sm btn-block" data-action="remove-listing" data-id="${esc(l.id)}">Remove listing</button>`
        : `<button type="button" class="btn btn-primary btn-sm btn-block" data-action="buy-print" data-id="${esc(l.id)}">${icon('bag', 16)}Buy print</button>`}</div>
    </div>
  </article>`;
}

const grid = (list) => `<div class="products">${list.map(listingCard).join('')}</div>`;

function shopHref(cat, sort) {
  const q = new URLSearchParams();
  if (cat !== 'all') q.set('c', cat);
  if (sort !== 'popular') q.set('sort', sort);
  const s = q.toString();
  return `#/marketplace${s ? `?${s}` : ''}`;
}

function shop(query) {
  const cat = store.CATEGORIES.some((c) => c.id === query.get('c')) ? query.get('c') : 'all';
  const sort = SORTS.some(([k]) => k === query.get('sort')) ? query.get('sort') : 'popular';
  const list = store.listings({ category: cat, sort });
  const chips = [{ id: 'all', label: 'All' }, ...store.CATEGORIES]
    .map((c) => `<a class="chip-filter" href="${shopHref(c.id, sort)}"${c.id === cat ? ' aria-current="true"' : ''}>${esc(c.label)}</a>`)
    .join('');
  return `<ul class="market-perks">
      <li>${icon('frame', 18)}Printed to order in A4, A3 or A2</li>
      <li>${icon('tag', 18)}Artists set their own prices</li>
      <li>${icon('truck', 18)}Free shipping over ${esc(fmtPrice(store.FREE_SHIPPING_FROM))}</li>
    </ul>
    <div class="market-bar">
      <nav class="chips" aria-label="Categories">${chips}</nav>
      <label class="sr-only" for="market-sort">Sort prints</label>
      <select id="market-sort" class="input sort" data-cat="${esc(cat)}">${SORTS.map(([k, label]) => `<option value="${k}"${k === sort ? ' selected' : ''}>${label}</option>`).join('')}</select>
    </div>
    ${list.length
      ? grid(list)
      : emptyState({ icon: 'bag', title: 'No prints here yet', text: 'Nobody has listed work in this category. Yours could be the first.', action: '<button type="button" class="btn btn-primary" data-action="sell-art">Sell your art</button>' })}`;
}

function yourListings() {
  const list = store.listingsBy(store.meId());
  if (!list.length) {
    return emptyState({ icon: 'tag', title: 'Nothing for sale yet', text: 'List a piece and people can order prints of it in three sizes. You set the price.', action: '<button type="button" class="btn btn-primary" data-action="sell-art">Sell your art</button>' });
  }
  const sold = list.reduce((n, l) => n + l.sales, 0);
  return `<p class="stats market-stats"><span><b>${list.length}</b> ${list.length === 1 ? 'listing' : 'listings'}</span><span><b>${fmtCount(sold)}</b> ${sold === 1 ? 'print' : 'prints'} sold</span></p>${grid(list)}`;
}

function orderRow(o) {
  const l = store.listing(o.listingId);
  const image = l && store.listingImage(l);
  const seller = store.user(o.sellerId);
  const thumb = image ? `<img src="${esc(artURL(image))}" alt="" loading="lazy" decoding="async">` : icon('image', 22);
  return `<article class="order">
    <span class="order-thumb">${thumb}</span>
    <div class="order-main">
      <p class="order-title">${esc(o.title)}</p>
      <p class="order-meta">${esc(store.sizeLabel(o.size))}${o.framed ? ', framed' : ''} · Qty ${o.qty}${seller ? ` · by ${esc(seller.name)}` : ''}</p>
      <p class="order-meta">Ordered ${esc(fullDate(o.createdAt))} · <span class="order-id">#${esc(o.id.slice(-6).toUpperCase())}</span></p>
    </div>
    <span class="order-total">${esc(fmtPrice(o.total))}</span>
  </article>`;
}

function yourOrders() {
  const list = store.orders();
  if (!list.length) {
    return emptyState({ icon: 'bag', title: 'No orders yet', text: 'Prints you buy show up here.', action: '<a class="btn btn-primary" href="#/marketplace">Browse prints</a>' });
  }
  return `<div class="order-list">${list.map(orderRow).join('')}</div>`;
}

export const marketplace = {
  wide: true,
  title: ([section]) => (section === 'orders' ? 'Your orders' : section === 'listings' ? 'Your listings' : 'Marketplace'),
  render([section = ''], query) {
    const tabs = `<nav class="tabs" aria-label="Marketplace">${SECTIONS.map(([k, label]) => `<a class="tab" href="#/marketplace${k ? `/${k}` : ''}"${k === section ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>`;
    const head = pageHead({
      title: 'Marketplace',
      sub: 'Prints made to order, straight from the artists.',
      actions: `<button type="button" class="btn btn-primary btn-sm" data-action="sell-art">${icon('tag', 16)}Sell your art</button>`,
      below: tabs,
    });
    const body = section === 'listings' ? yourListings() : section === 'orders' ? yourOrders() : shop(query);
    return head + body;
  },
  mount(root) {
    const sort = root.querySelector('#market-sort');
    sort?.addEventListener('change', () => navigate(shopHref(sort.dataset.cat, sort.value).slice(1), { replace: true }));
  },
};

/* ---------- buy a print ---------- */

export function openBuy(listingId) {
  const l = store.listing(listingId);
  const seller = l && store.user(l.sellerId);
  const image = l && store.listingImage(l);
  if (!l || !seller || !image) {
    toast('That print is no longer for sale');
    return;
  }
  const choice = { size: store.PRINT_SIZES[0].id, framed: false, qty: 1 };
  let ordered = false;
  const m = openModal({
    title: 'Buy a print',
    // Refresh sold counts behind the dialog once it closes.
    onClose: () => { if (ordered) refresh(); },
    className: 'wide buy-modal',
    body: `<div class="buy">
      <div class="buy-media"><img src="${esc(artURL(image))}" alt="${esc(`${l.title} by ${seller.name}`)}"></div>
      <form class="buy-form" id="buy-form" novalidate>
        <div>
          <h3 class="buy-title">${esc(l.title)}</h3>
          <a class="product-by" href="${profileHref(seller)}">${avatar(seller, 22)}<span>by ${esc(seller.name)}</span></a>
        </div>
        <fieldset class="field">
          <legend class="field-label">Size</legend>
          <div class="size-options">${store.PRINT_SIZES.map((s, i) => `<label class="size-opt"><input type="radio" name="size" value="${s.id}"${i === 0 ? ' checked' : ''}><span><b>${s.label}</b><small>${esc(s.dims)}</small><em>${esc(fmtPrice(store.printPrice(l, s.id)))}</em></span></label>`).join('')}</div>
        </fieldset>
        <label class="switch"><input type="checkbox" name="framed"><span class="switch-ui" aria-hidden="true"></span><span class="switch-text"><b>Add a black frame</b><small>${esc(fmtPrice(store.FRAME_PRICE))} per print, ready to hang.</small></span></label>
        <div class="field">
          <span class="field-label" id="buy-qty-label">Quantity</span>
          <div class="stepper" role="group" aria-labelledby="buy-qty-label">
            <button type="button" class="icon-btn icon-btn-outline" data-step="-1" aria-label="One fewer">${icon('minus', 18)}</button>
            <output id="buy-qty" aria-live="polite">1</output>
            <button type="button" class="icon-btn icon-btn-outline" data-step="1" aria-label="One more">${icon('plus', 18)}</button>
          </div>
        </div>
        <dl class="summary">
          <div><dt>Subtotal</dt><dd id="buy-subtotal"></dd></div>
          <div><dt>Shipping</dt><dd id="buy-shipping"></dd></div>
          <div class="summary-total"><dt>Total</dt><dd id="buy-total"></dd></div>
        </dl>
        <button type="submit" class="btn btn-primary btn-lg btn-block">${icon('bag', 18)}Place order</button>
        <p class="field-hint buy-note">Demo checkout: no payment is taken and nothing ships yet.</p>
      </form>
    </div>`,
  });

  const $ = (sel) => m.el.querySelector(sel);
  const form = $('#buy-form');

  function update() {
    const q = store.quote(l, choice);
    $('#buy-qty').textContent = choice.qty;
    $('#buy-subtotal').textContent = fmtPrice(q.subtotal);
    $('#buy-shipping').textContent = q.shipping ? fmtPrice(q.shipping) : 'Free';
    $('#buy-total').textContent = fmtPrice(q.total);
    $('[data-step="-1"]').disabled = choice.qty <= 1;
    $('[data-step="1"]').disabled = choice.qty >= store.MAX_QTY;
  }

  form.addEventListener('change', () => {
    choice.size = form.elements.size.value;
    choice.framed = form.elements.framed.checked;
    update();
  });
  m.el.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => {
    choice.qty = Math.min(store.MAX_QTY, Math.max(1, choice.qty + Number(b.dataset.step)));
    update();
  }));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const o = store.placeOrder({ listingId: l.id, ...choice });
    ordered = Boolean(o);
    if (!o) {
      toast('You can\'t buy your own print');
      return;
    }
    m.el.querySelector('.modal-body').innerHTML = `<div class="order-done">
      <span class="empty-icon">${icon('check', 26)}</span>
      <h2 class="empty-title">Order placed</h2>
      <p class="empty-text">${o.qty} × ${esc(store.sizeLabel(o.size))}${o.framed ? ' framed' : ''} print of "${esc(o.title)}" for ${esc(fmtPrice(o.total))}. We've let ${esc(seller.name)} know. This was a demo, so no payment was taken.</p>
      <div class="order-done-actions"><a class="btn btn-primary" href="#/marketplace/orders">View your orders</a><button type="button" class="btn btn-outline" data-close>Keep browsing</button></div>
    </div>`;
  });
  update();
}

/* ---------- sell your art ---------- */

export function openSell({ postId = '' } = {}) {
  const me = store.me();
  const mine = store.postsBy(me.id);
  const pick = { postId: null, image: null };
  const categories = store.CATEGORIES.map((c) => `<option value="${c.id}">${esc(c.label)}</option>`).join('');

  const m = openModal({
    title: 'Sell prints of your work',
    className: 'wide create-modal',
    body: `<form id="sell-form" class="create" novalidate>
      <div class="create-media">
        <div class="drop" id="sell-drop" data-state="empty">
          <div class="drop-empty">
            <span class="drop-icon">${icon('upload', 26)}</span>
            <p class="drop-title">Upload the artwork to print</p>
            <p class="drop-hint">JPG, PNG, WebP or GIF up to 20 MB</p>
            <div class="drop-actions">
              <label class="btn btn-primary btn-sm" for="sell-file">Choose file</label>
              <input type="file" id="sell-file" accept="image/*" class="sr-only">
            </div>
          </div>
          <img id="sell-preview" class="drop-preview" alt="Preview of the artwork to print" hidden>
          <div class="drop-tools" hidden>
            <button type="button" class="icon-btn on-media" id="sell-remove" aria-label="Remove image">${icon('x', 18)}</button>
          </div>
        </div>
        ${mine.length ? `<div class="pick-wrap">
          <p class="create-palette-label">Or pick one of your posts</p>
          <div class="pick-strip">${mine.map((p) => {
            const listed = Boolean(store.listingForPost(p.id));
            return `<button type="button" class="pick" data-post="${esc(p.id)}" aria-pressed="false"${listed ? ' disabled title="Already for sale"' : ''}><img src="${esc(artURL(p.image))}" alt="${esc(excerpt(p.caption) || 'Your post')}" loading="lazy" decoding="async">${listed ? `<span class="pick-flag">${icon('tag', 12)}Listed</span>` : ''}</button>`;
          }).join('')}</div>
        </div>` : ''}
      </div>
      <div class="create-fields">
        <div class="field">
          <label class="field-label" for="sell-title">Title</label>
          <input id="sell-title" class="input" maxlength="60" placeholder="Last light over the coast" autocomplete="off">
        </div>
        <div class="field">
          <label class="field-label" for="sell-price">Price for an A4 print</label>
          <div class="input-affix"><span>$</span><input id="sell-price" class="input" type="number" inputmode="decimal" min="5" max="500" step="1" value="25"></div>
          <p class="field-hint" id="sell-sizes"></p>
        </div>
        <div class="field"><label class="field-label" for="sell-category">Category</label><select id="sell-category" class="input">${categories}</select></div>
        <p class="field-hint">Buyers choose A4, A3 or A2 and can add a frame. Larger sizes are priced from your A4 price.</p>
      </div>
      <footer class="create-foot">
        <p class="field-error" id="sell-error" role="alert"></p>
        <button type="button" class="btn btn-ghost" data-close>Cancel</button>
        <button type="submit" class="btn btn-primary" id="sell-submit" disabled>List for sale</button>
      </footer>
    </form>`,
  });

  const $ = (sel) => m.el.querySelector(sel);
  const drop = $('#sell-drop');
  const preview = $('#sell-preview');
  const error = $('#sell-error');
  const titleEl = $('#sell-title');
  const priceEl = $('#sell-price');

  const cents = () => Math.round(Number(priceEl.value) * 100);

  function showSizes() {
    const c = cents();
    const ok = c >= 500 && c <= 50000;
    $('#sell-sizes').textContent = ok
      ? store.PRINT_SIZES.map((s) => `${s.label} ${fmtPrice(store.printPrice({ price: c }, s.id))}`).join(' · ')
      : 'Set a price between $5 and $500.';
  }

  function setImage(image, postId = null) {
    pick.image = image;
    pick.postId = postId;
    drop.dataset.state = image ? 'filled' : 'empty';
    preview.hidden = !image;
    $('.drop-tools').hidden = !image;
    if (image) {
      preview.src = artURL(image);
      preview.style.aspectRatio = String(image.ratio);
    } else {
      preview.removeAttribute('src');
    }
    m.el.querySelectorAll('.pick').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.post === postId)));
    $('#sell-submit').disabled = !image;
    error.textContent = '';
  }

  function usePost(id) {
    const p = store.post(id);
    if (!p) return;
    setImage(p.image, p.id);
    if (!titleEl.value.trim()) titleEl.value = excerpt(p.caption);
    $('#sell-category').value = p.category;
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

  $('#sell-file').addEventListener('change', (e) => useFile(e.target.files[0]));
  $('#sell-remove').addEventListener('click', () => { setImage(null); $('#sell-file').value = ''; });
  m.el.querySelectorAll('.pick').forEach((b) => b.addEventListener('click', () => usePost(b.dataset.post)));
  ['dragenter', 'dragover'].forEach((type) => drop.addEventListener(type, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach((type) => drop.addEventListener(type, () => drop.classList.remove('is-over')));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    useFile(e.dataTransfer.files[0]);
  });
  priceEl.addEventListener('input', showSizes);

  $('#sell-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = titleEl.value.trim();
    const price = cents();
    if (!pick.image) error.textContent = 'Add the artwork first: upload it or pick one of your posts.';
    else if (!title) error.textContent = 'Give the print a title.';
    else if (!(price >= 500 && price <= 50000)) error.textContent = 'Set a price between $5 and $500.';
    else {
      store.addListing({ postId: pick.postId, image: pick.image, title, price, category: $('#sell-category').value });
      m.close();
      navigate('/marketplace/listings');
      toast('Your print is for sale');
      return;
    }
    if (!title) titleEl.focus();
  });

  showSizes();
  if (postId && !store.listingForPost(postId)) usePost(postId);
}
