// Hash router with its own back stack, so navigation keeps working even where
// the History API is unavailable (for example inside sandboxed previews).

let current = '/';
let renderFn = () => {};
let historyOK = true;
const stack = [];
const scrolls = new Map();

const pathFromHash = () => {
  const h = location.hash.slice(1);
  return h.startsWith('/') ? h : '/';
};

export function start(render) {
  renderFn = render;
  current = pathFromHash();
  try { history.scrollRestoration = 'manual'; } catch { /* not supported */ }
  const onHistory = () => {
    const next = pathFromHash();
    if (next === current) return;
    scrolls.set(current, window.scrollY);
    stack.pop();
    current = next;
    renderFn({ restore: true });
  };
  window.addEventListener('popstate', onHistory);
  window.addEventListener('hashchange', onHistory);
  renderFn({ initial: true });
}

export const getCurrent = () => current;
export const savedScroll = () => scrolls.get(current) || 0;

export function navigate(path, { replace = false } = {}) {
  if (path === current && !replace) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  scrolls.set(current, window.scrollY);
  if (!replace) stack.push(current);
  if (historyOK) {
    try { history[replace ? 'replaceState' : 'pushState'](null, '', `#${path}`); } catch { historyOK = false; }
  }
  current = path;
  renderFn({});
}

export function back(fallback = '/') {
  if (!stack.length) {
    navigate(fallback, { replace: true });
    return;
  }
  if (historyOK) {
    history.back();
    return;
  }
  scrolls.set(current, window.scrollY);
  current = stack.pop();
  renderFn({ restore: true });
}

export const refresh = () => renderFn({ keepScroll: true });

const ROUTES = [
  ['home', /^\/(?:home)?$/],
  ['explore', /^\/explore$/],
  ['marketplace', /^\/marketplace(?:\/(listings|orders))?$/],
  ['tag', /^\/tag\/([^/]+)$/],
  ['notifications', /^\/notifications$/],
  ['messages', /^\/messages(?:\/([^/]+))?$/],
  ['saved', /^\/saved$/],
  ['profile', /^\/u\/([^/]+)(?:\/(likes|saved))?$/],
  ['post', /^\/p\/([^/]+)$/],
  ['settings', /^\/settings$/],
];

const decode = (v) => {
  if (v == null) return v;
  try { return decodeURIComponent(v); } catch { return v; }
};

export function match(path = current) {
  const [p, qs = ''] = path.split('?');
  const query = new URLSearchParams(qs);
  for (const [name, re] of ROUTES) {
    const m = p.match(re);
    if (m) return { name, params: m.slice(1).map(decode), query };
  }
  return { name: 'notFound', params: [], query };
}
