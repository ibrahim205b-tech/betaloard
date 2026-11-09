// Data + cart store. Catalog and settings live in /data/*.json so they can be
// edited without touching code or rebuilding the site.

const LS = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  },
  del(key) { try { localStorage.removeItem(key); } catch { /* ignore */ } }
};

const KEYS = { cart: 'dw_cart_v1', orders: 'dw_orders_v1', prices: 'dw_price_overrides_v1' };

export const state = {
  catalog: null,
  settings: null,
  byId: new Map(),
  basePrices: new Map(),
  cart: LS.get(KEYS.cart, []),
  listeners: new Set()
};

export async function loadData() {
  const [catalog, settings] = await Promise.all([
    fetch('data/products.json', { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error('products.json ' + r.status); return r.json(); }),
    fetch('data/settings.json', { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error('settings.json ' + r.status); return r.json(); })
  ]);
  state.catalog = catalog;
  state.settings = settings;
  const overrides = LS.get(KEYS.prices, {});
  for (const p of catalog.products) {
    state.basePrices.set(p.id, p.price);
    if (Number.isFinite(overrides[p.id]) && overrides[p.id] >= 0) p.price = overrides[p.id];
    state.byId.set(p.id, p);
  }
  // drop cart lines whose product no longer exists
  state.cart = state.cart.filter(l => state.byId.has(l.id) && l.qty > 0);
  persist();
}

export const categories = () => state.catalog.categories;
export const category = id => state.catalog.categories.find(c => c.id === id);
export const products = cat => state.catalog.products.filter(p => !cat || p.category === cat);
export const product = id => state.byId.get(id);

// ---------- formatting ----------
const nf = new Intl.NumberFormat('en-US');
export const money = n => `<span class="num">${nf.format(Math.round(n))}</span><span class="price-cur">${state.settings?.currency_label || 'د.ع'}</span>`;
export const moneyText = n => `${nf.format(Math.round(n))} ${state.settings?.currency_label || 'د.ع'}`;
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- cart ----------
function persist() { LS.set(KEYS.cart, state.cart); }
function emit() { persist(); state.listeners.forEach(fn => fn(state.cart)); }
export const onCart = fn => { state.listeners.add(fn); return () => state.listeners.delete(fn); };

const lineKey = (id, note) => `${id}::${(note || '').trim()}`;

export function addToCart(id, qty = 1, note = '') {
  if (!state.byId.has(id)) return;
  qty = Math.max(1, Math.min(99, qty | 0));
  const key = lineKey(id, note);
  const existing = state.cart.find(l => lineKey(l.id, l.note) === key);
  if (existing) existing.qty = Math.min(99, existing.qty + qty);
  else state.cart.push({ id, qty, note: (note || '').trim().slice(0, 240) });
  emit();
}
export function setQty(index, qty) {
  const line = state.cart[index];
  if (!line) return;
  qty = qty | 0;
  if (qty <= 0) state.cart.splice(index, 1); else line.qty = Math.min(99, qty);
  emit();
}
export function removeLine(index) { state.cart.splice(index, 1); emit(); }
export function clearCart() { state.cart = []; emit(); }

export const cartCount = () => state.cart.reduce((n, l) => n + l.qty, 0);
export const cartLines = () => state.cart.map((l, i) => ({ ...l, index: i, product: state.byId.get(l.id) })).filter(l => l.product);
export const subtotal = () => cartLines().reduce((s, l) => s + l.product.price * l.qty, 0);

export function deliveryFee(zoneId, sub = subtotal()) {
  const d = state.settings.delivery;
  if (!zoneId) return null;
  if (d.free_over && sub >= d.free_over) return 0;
  const z = d.zones.find(z => z.id === zoneId);
  return z ? z.fee : null;
}
export function totals(zoneId) {
  const sub = subtotal();
  const fee = deliveryFee(zoneId, sub);
  return { sub, fee, total: sub + (fee || 0) };
}

// ---------- orders (stored locally — there is no backend) ----------
export function saveOrder(order) {
  const orders = LS.get(KEYS.orders, []);
  orders.unshift(order);
  LS.set(KEYS.orders, orders.slice(0, 50));
}
export const getOrders = () => LS.get(KEYS.orders, []);
export const getOrder = no => getOrders().find(o => o.no === no);
export const clearOrders = () => LS.del(KEYS.orders);

export function newOrderNo() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rnd = Math.floor(Math.random() * 9000 + 1000);
  return `DW-${ymd}-${rnd}`;
}

// ---------- admin price overrides (preview in this browser only) ----------
export const getPriceOverrides = () => LS.get(KEYS.prices, {});
export function setPriceOverride(id, price) {
  const o = getPriceOverrides();
  const p = state.byId.get(id);
  if (!p) return;
  if (!Number.isFinite(price) || price < 0) return;
  if (price === state.basePrices.get(id)) delete o[id]; else o[id] = price;
  p.price = price;
  LS.set(KEYS.prices, o);
  emit();
}
export function resetPriceOverrides() {
  LS.del(KEYS.prices);
  for (const [id, base] of state.basePrices) state.byId.get(id).price = base;
  emit();
}
export function exportCatalogJSON() {
  const copy = JSON.parse(JSON.stringify(state.catalog));
  return JSON.stringify(copy, null, 2);
}
