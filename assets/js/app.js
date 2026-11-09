import * as S from './store.js';
import * as V from './views.js';
import * as M from './motion.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const app = $('#app');
const hdr = $('#hdr');
const cartEl = $('#cart');
const scrim = $('#scrim');
let route = null;
let firstRender = true;

const TITLES = { home: 'دكان الورد — Dokkan al Werd', cart: 'السلة', checkout: 'مراجعة الطلب', order: 'تم تسجيل الطلب', about: 'حكايتنا', contact: 'تواصل معنا', admin: 'إعدادات المتجر', notfound: 'غير موجود' };

// ---------- routing ----------
function parse() {
  const h = location.hash;
  if (!h || h === '#' || h === '#/') return { name: 'home' };
  if (!h.startsWith('#/')) return null; // in-page anchor, not a route
  const [a, b] = h.slice(2).split('/').map(decodeURIComponent);
  if (a === 'c' && b) return { name: 'category', id: b };
  if (a === 'p' && b) return { name: 'product', id: b };
  if (a === 'order' && b) return { name: 'order', id: b };
  if (['cart', 'checkout', 'about', 'contact', 'admin'].includes(a)) return { name: a };
  return { name: 'notfound' };
}

function viewFor(r) {
  switch (r.name) {
    case 'home': return V.home();
    case 'category': return V.categoryView(r.id);
    case 'product': return V.productView(r.id);
    case 'cart': return V.cartPage();
    case 'checkout': return V.checkoutView();
    case 'order': return V.orderView(r.id);
    case 'about': return V.aboutView();
    case 'contact': return V.contactView();
    case 'admin': return V.adminView();
    default: return V.notFound();
  }
}

function titleFor(r) {
  if (r.name === 'category') return `${S.category(r.id)?.name_ar || ''} — دكان الورد`;
  if (r.name === 'product') { const p = S.product(r.id); return p ? `${p.name_ar} · ${p.name_en} — دكان الورد` : 'دكان الورد'; }
  return r.name === 'home' ? TITLES.home : `${TITLES[r.name] || ''} — دكان الورد`;
}

function render(r) {
  M.reset();
  app.innerHTML = viewFor(r);
  document.title = titleFor(r);
  route = r;
  const dark = app.firstElementChild?.dataset.theme === 'dark';
  hdr.classList.toggle('is-dark', dark);
  $$('.hdr__nav a').forEach(a => a.classList.toggle('is-active', (r.name === 'category' && a.dataset.nav === r.id) || a.dataset.nav === r.name));
  M.scrollTop();
  onScroll();
  mount(r);
}

function mount(r) {
  if (r.name === 'home') { mountVitrine(); }
  if (r.name === 'category') { mountFilters(r.id); mountRings(); }
  if (r.name === 'product') { mountProduct(); }
  if (r.name === 'checkout') { mountCheckout(); }
  if (r.name === 'contact') { mountContact(); }
  if (r.name === 'admin') { mountAdmin(); }
  M.bind(app);
}

async function navigate() {
  const r = parse();
  if (!r) return;
  closeMenu();
  closeCart(false);
  if (firstRender) {
    firstRender = false;
    render(r);
    const introDone = M.intro();
    if (r.name === 'home') { await introDone; M.hero(app); }
    return;
  }
  await M.curtain(() => {
    render(r);
    if (r.name === 'home') M.hero(app, { delay: .25 });
  });
  app.focus({ preventScroll: true });
}

// ---------- header behaviour ----------
let lastY = 0;
let pinUntil = 0; // keep header visible briefly (e.g. right after add-to-cart)
function onScroll() {
  const y = window.scrollY;
  hdr.classList.toggle('is-solid', y > 40);
  const goingDown = y > lastY + 4, goingUp = y < lastY - 4;
  if (y > 420 && goingDown && Date.now() > pinUntil && !document.body.classList.contains('menu-open')) hdr.classList.add('is-hidden');
  else if (goingUp || y < 420) hdr.classList.remove('is-hidden');
  lastY = y;
}
window.addEventListener('scroll', onScroll, { passive: true });

// ---------- mobile menu ----------
const menuBtn = $('#menuBtn');
const mnav = $('#drawerNav');
function openMenu() { document.body.classList.add('menu-open', 'no-scroll'); menuBtn.setAttribute('aria-expanded', 'true'); mnav.setAttribute('aria-hidden', 'false'); M.stopScroll(); }
function closeMenu() {
  if (!document.body.classList.contains('menu-open')) return;
  document.body.classList.remove('menu-open', 'no-scroll'); menuBtn.setAttribute('aria-expanded', 'false'); mnav.setAttribute('aria-hidden', 'true'); M.startScroll();
}
menuBtn.addEventListener('click', () => document.body.classList.contains('menu-open') ? closeMenu() : openMenu());

// ---------- cart drawer ----------
function renderCart() {
  const n = S.cartCount();
  const count = $('#cartCount');
  count.textContent = n;
  count.classList.toggle('has', n > 0);
  $('#cartBtn').setAttribute('aria-label', `سلة التسوق (${n})`);
  $('#cartHeadCount').textContent = n ? `(${n})` : '';
  $('#cartBody').innerHTML = V.cartLinesHTML();
  const sub = S.subtotal();
  $('#cartFoot').innerHTML = n ? `
    ${V.freeBar(sub)}
    <div class="sum-row"><span>المجموع الفرعي</span><b>${S.money(sub)}</b></div>
    <a class="btn btn--block" href="#/checkout" data-close-cart>إتمام الطلب</a>
    <a class="btn btn--ghost btn--block" href="#/cart" data-close-cart>عرض السلة كاملة</a>` : '';
  $('#cartFoot').hidden = !n;
}
let lastFocus = null;
function openCart() {
  lastFocus = document.activeElement;
  scrim.hidden = false;
  requestAnimationFrame(() => scrim.classList.add('is-on'));
  cartEl.classList.add('is-open');
  cartEl.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
  M.stopScroll();
  setTimeout(() => $('#cartClose').focus(), 50);
}
function closeCart(restore = true) {
  if (!cartEl.classList.contains('is-open')) return;
  cartEl.classList.remove('is-open');
  cartEl.setAttribute('aria-hidden', 'true');
  scrim.classList.remove('is-on');
  setTimeout(() => { scrim.hidden = true; }, 450);
  document.body.classList.remove('no-scroll');
  M.startScroll();
  if (restore) lastFocus?.focus?.();
}
$('#cartBtn').addEventListener('click', openCart);
$('#cartClose').addEventListener('click', () => closeCart());
scrim.addEventListener('click', () => closeCart());
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeCart(); closeMenu(); }
  if (e.key === 'Tab' && cartEl.classList.contains('is-open')) {
    const f = $$('a[href],button:not([disabled]),input,textarea,select', cartEl).filter(el => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

// ---------- toast ----------
let toastT;
function toast(html) {
  const t = $('#toast');
  t.innerHTML = html;
  t.classList.add('is-on');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('is-on'), 3200);
}
function addedToast(p, qty = 1) {
  toast(`<img src="assets/img/${p.image}-sm.webp" alt=""><span>أُضيف «${S.esc(p.name_ar)}»${qty > 1 ? ` × ${qty}` : ''} إلى السلة</span><a href="#" data-open-cart>عرض السلة</a>`);
  hdr.classList.remove('is-hidden'); // make sure the badge bump is visible
  pinUntil = Date.now() + 2500;
  const c = $('#cartCount');
  c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump');
}

// ---------- delegated interactions ----------
document.addEventListener('click', e => {
  const t = e.target.closest('a,button,[data-zoom]');
  if (!t) return;

  if (t.matches('a[href="#app"]')) { e.preventDefault(); app.focus(); return; }
  if (t.matches('[data-open-cart]')) { e.preventDefault(); $('#toast').classList.remove('is-on'); openCart(); return; }
  if (t.matches('[data-close-cart]')) { closeCart(false); }
  if (t.closest('#drawerNav') && t.matches('a')) { closeMenu(); }

  if (t.dataset.add) {
    e.preventDefault();
    const p = S.product(t.dataset.add);
    S.addToCart(p.id, 1);
    addedToast(p);
    if (t.classList.contains('pc__quick') || t.classList.contains('add-mini')) {
      const prev = t.innerHTML;
      t.classList.add('is-added'); t.innerHTML = V.ICON.check;
      setTimeout(() => { t.classList.remove('is-added'); t.innerHTML = prev; }, 1400);
    } else {
      const prev = t.textContent; t.textContent = 'أُضيف ✓';
      setTimeout(() => { t.textContent = prev; }, 1400);
    }
    return;
  }
  if (t.dataset.addPdp || t.dataset.buyNow) {
    const id = t.dataset.addPdp || t.dataset.buyNow;
    const qty = parseInt($('[data-qty-val]')?.textContent, 10) || 1;
    const note = $('#giftNote')?.value || '';
    S.addToCart(id, qty, note);
    if (t.dataset.buyNow) { location.hash = '#/checkout'; return; }
    addedToast(S.product(id), qty);
    if ($('#giftNote')) $('#giftNote').value = '';
    return;
  }
  if (t.dataset.step) {
    const out = $('[data-qty-val]');
    out.textContent = Math.max(1, Math.min(99, (parseInt(out.textContent, 10) || 1) + parseInt(t.dataset.step, 10)));
    return;
  }
  if (t.dataset.lineStep) {
    const i = parseInt(t.dataset.line, 10);
    const line = S.state.cart[i];
    if (line) S.setQty(i, line.qty + parseInt(t.dataset.lineStep, 10));
    return;
  }
  if (t.dataset.lineRm !== undefined) { S.removeLine(parseInt(t.dataset.lineRm, 10)); return; }
  if (t.dataset.vit) { scrollVitrine(t.dataset.vit); return; }
  if (t.dataset.copyOrder) { copyText(orderText(S.getOrder(t.dataset.copyOrder))).then(ok => toast(ok ? 'تم نسخ ملخص الطلب' : 'تعذّر النسخ — يمكنك تحديد النص يدوياً')); return; }
  if (t.dataset.waOrder) {
    e.preventDefault();
    const num = S.state.settings.contact.whatsapp.replace(/\D/g, '');
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(orderText(S.getOrder(t.dataset.waOrder)))}`, '_blank', 'noopener');
    return;
  }
  if (t.dataset.admin) { adminAction(t.dataset.admin); return; }
  if (t.matches('[data-zoom]') && M.finePointer) { t.classList.toggle('is-zoom'); return; }
});

// ---------- home: vitrine ----------
function mountVitrine() {
  const track = $('[data-vit-track]', app);
  const bar = $('[data-vit-progress]', app);
  if (!track) return;
  const update = () => {
    const max = track.scrollWidth - track.clientWidth;
    const r = max > 0 ? Math.abs(track.scrollLeft) / max : 1;
    bar.style.transform = `scaleX(${Math.max(.08, r)})`;
  };
  track.addEventListener('scroll', update, { passive: true });
  update();
}
function scrollVitrine(dir) {
  const track = $('[data-vit-track]', app);
  if (!track) return;
  const item = track.querySelector('.vitrine__item:nth-child(2)') || track.firstElementChild;
  const step = item.getBoundingClientRect().width + 24;
  const rtl = getComputedStyle(track).direction === 'rtl';
  const sign = (dir === 'next' ? 1 : -1) * (rtl ? -1 : 1);
  track.scrollBy({ left: sign * step, behavior: M.reduced ? 'auto' : 'smooth' });
}

// ---------- category: filters + rings viewer ----------
function mountFilters(cat) {
  const chips = $$('[data-filter]', app);
  const grid = $(`[data-grid="${cat}"]`, app);
  chips.forEach(ch => ch.addEventListener('click', () => {
    chips.forEach(c => c.setAttribute('aria-pressed', String(c === ch)));
    const f = ch.dataset.filter;
    const list = S.products(cat).filter(p => f === 'all' || p.sub === f);
    $('[data-count]', app).textContent = `${list.length} منتج`;
    M.softSwap(grid, V.categoryGrid(cat, list), () => {
      grid.querySelectorAll('[data-fade]').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
      grid.querySelectorAll('[data-reveal]').forEach(el => el.removeAttribute('data-reveal'));
      mountRings();
      window.ScrollTrigger?.refresh();
    });
  }));
}

function mountRings() {
  const lens = $('[data-lens]', app);
  if (!lens) return;
  const cap = $('[data-lens-cap]', app);
  const rows = $$('[data-ring]', app);
  let currentImg = lens.dataset.current || rows[0]?.dataset.img;
  const show = row => {
    rows.forEach(r => r.classList.toggle('is-active', r === row));
    if (row.dataset.img === currentImg) return;
    currentImg = row.dataset.img;
    cap.textContent = row.dataset.en;
    const old = lens.querySelectorAll('img');
    const im = new Image();
    im.alt = ''; im.decoding = 'async'; im.className = 'is-out';
    im.src = `assets/img/${row.dataset.img}.webp`;
    lens.appendChild(im);
    const reveal = () => requestAnimationFrame(() => { im.classList.remove('is-out'); old.forEach(o => { o.classList.add('is-out'); setTimeout(() => o.remove(), 700); }); });
    im.complete ? reveal() : im.addEventListener('load', reveal, { once: true });
  };
  rows.forEach(r => { r.addEventListener('mouseenter', () => show(r)); r.addEventListener('focusin', () => show(r)); });
  if ('IntersectionObserver' in window && matchMedia('(min-width: 861px)').matches) {
    const io = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) show(en.target); }), { rootMargin: '-45% 0px -45% 0px' });
    rows.forEach(r => io.observe(r));
  }
}

// ---------- product ----------
function mountProduct() {
  const m = $('[data-zoom]', app);
  if (!m || !M.finePointer) { m?.querySelector('.pdp__zoomhint')?.remove(); return; }
  const im = m.querySelector('img');
  m.addEventListener('pointermove', e => {
    const r = m.getBoundingClientRect();
    im.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
  });
  m.addEventListener('pointerleave', () => m.classList.remove('is-zoom'));
}

// ---------- checkout ----------
const IQ_PHONE = /^(?:\+?964|0)?7\d{9}$/;
function setErr(field, msg) {
  const wrap = field.closest('.field');
  wrap.classList.toggle('has-error', !!msg);
  wrap.querySelector('.field__err').textContent = msg || '';
  field.setAttribute('aria-invalid', msg ? 'true' : 'false');
}
function clearErrorsOnInput(form) {
  form.addEventListener('input', e => { if (e.target.closest('.field.has-error')) setErr(e.target, ''); });
}
function mountCheckout() {
  const form = $('#checkoutForm', app);
  if (!form) return;
  clearErrorsOnInput(form);
  const summary = $('[data-summary]', app);
  form.zone.addEventListener('change', () => { summary.innerHTML = V.checkoutSummary(form.zone.value); setErr(form.zone, ''); });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = form.name.value.trim();
    const phone = form.phone.value.replace(/[\s\-()]/g, '');
    const zone = form.zone.value;
    const address = form.address.value.trim();
    const errs = [];
    setErr(form.name, name.length < 2 ? 'يرجى كتابة الاسم' : ''); if (name.length < 2) errs.push(form.name);
    const phoneOk = IQ_PHONE.test(phone);
    setErr(form.phone, phoneOk ? '' : 'رقم عراقي صحيح مثل 07701234567'); if (!phoneOk) errs.push(form.phone);
    setErr(form.zone, zone ? '' : 'اختر المحافظة'); if (!zone) errs.push(form.zone);
    setErr(form.address, address.length < 6 ? 'يرجى كتابة العنوان بالتفصيل' : ''); if (address.length < 6) errs.push(form.address);
    const today = new Date().toISOString().slice(0, 10);
    const dateBad = form.date.value && form.date.value < today;
    setErr(form.date, dateBad ? 'اختر تاريخاً من اليوم فصاعداً' : ''); if (dateBad) errs.push(form.date);
    if (errs.length) { errs[0].focus(); return; }

    const t = S.totals(zone);
    const set = S.state.settings;
    const pay = form.pay.value;
    const order = {
      no: S.newOrderNo(),
      createdAt: new Date().toISOString(),
      items: S.cartLines().map(l => ({ id: l.product.id, name: l.product.name_ar, qty: l.qty, price: l.product.price, note: l.note })),
      sub: t.sub, fee: t.fee, total: t.total,
      zone, zoneName: set.delivery.zones.find(z => z.id === zone).name_ar,
      pay, payName: set.payment_methods.find(m => m.id === pay)?.name_ar || '',
      customer: { name, phone, address, date: form.date.value, notes: form.notes.value.trim() }
    };
    S.saveOrder(order);
    S.clearCart();
    location.hash = `#/order/${order.no}`;
  });
}

function orderText(o) {
  if (!o) return '';
  const m = S.moneyText;
  return [
    'طلب جديد — دكان الورد', `رقم الطلب: ${o.no}`, '',
    ...o.items.map(i => `• ${i.name} × ${i.qty} = ${m(i.price * i.qty)}${i.note ? `\n  بطاقة: «${i.note}»` : ''}`),
    '', `المجموع الفرعي: ${m(o.sub)}`, `التوصيل (${o.zoneName}): ${o.fee === 0 ? 'مجاني' : m(o.fee)}`, `الإجمالي: ${m(o.total)} — ${o.payName}`, '',
    `الاسم: ${o.customer.name}`, `الهاتف: ${o.customer.phone}`, `العنوان: ${o.customer.address}`,
    o.customer.date ? `تاريخ التوصيل: ${o.customer.date}` : '', o.customer.notes ? `ملاحظات: ${o.customer.notes}` : ''
  ].filter(x => x !== null).join('\n').trim();
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch { /* ignore */ }
    ta.remove(); return ok;
  }
}

// ---------- contact ----------
function mountContact() {
  const form = $('#contactForm', app);
  const status = $('[data-contact-status]', app);
  clearErrorsOnInput(form);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const name = form.name.value.trim(), phone = form.phone.value.replace(/[\s\-()]/g, ''), msg = form.message.value.trim();
    const errs = [];
    setErr(form.name, name.length < 2 ? 'يرجى كتابة الاسم' : ''); if (name.length < 2) errs.push(form.name);
    setErr(form.phone, IQ_PHONE.test(phone) ? '' : 'رقم عراقي صحيح مثل 07701234567'); if (!IQ_PHONE.test(phone)) errs.push(form.phone);
    setErr(form.message, msg.length < 5 ? 'اكتب رسالتك' : ''); if (msg.length < 5) errs.push(form.message);
    if (errs.length) { errs[0].focus(); return; }
    const text = `رسالة إلى دكان الورد\nالموضوع: ${form.topic.value}\nالاسم: ${name}\nالهاتف: ${phone}\n\n${msg}`;
    const c = S.state.settings.contact;
    if (c.whatsapp) { window.open(`https://wa.me/${c.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank', 'noopener'); status.textContent = 'فُتحت محادثة واتساب مع رسالتك.'; }
    else if (c.email) { location.href = `mailto:${c.email}?subject=${encodeURIComponent(form.topic.value)}&body=${encodeURIComponent(text)}`; status.textContent = 'فُتح تطبيق البريد مع رسالتك.'; }
    else { const ok = await copyText(text); status.textContent = ok ? 'تم تجهيز رسالتك ونسخها إلى الحافظة (لا توجد قناة إرسال مفعّلة في النسخة التجريبية).' : 'تعذّر النسخ. لا توجد قناة إرسال مفعّلة في النسخة التجريبية.'; }
    form.reset();
  });
}

// ---------- admin ----------
function mountAdmin() {
  $$('[data-price]', app).forEach(inp => inp.addEventListener('change', () => {
    const v = Math.round(Number(inp.value));
    if (!Number.isFinite(v) || v < 0) { inp.value = S.product(inp.dataset.price).price; return; }
    S.setPriceOverride(inp.dataset.price, v);
    inp.classList.toggle('is-changed', v !== S.state.basePrices.get(inp.dataset.price));
    toast('تم تحديث سعر المعاينة');
  }));
}
function adminAction(a) {
  if (a === 'export') {
    const blob = new Blob([S.exportCatalogJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = Object.assign(document.createElement('a'), { href: url, download: 'products.json' });
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('تم تنزيل products.json');
  }
  if (a === 'reset') { S.resetPriceOverrides(); render(route); toast('أُلغيت تعديلات المعاينة'); }
  if (a === 'orders') { S.clearOrders(); render(route); toast('حُذفت الطلبات التجريبية من هذا المتصفح'); }
}

// ---------- cart reactions ----------
S.onCart(() => {
  renderCart();
  if (route?.name === 'cart') {
    const holder = $('[data-cart-page-lines]', app);
    if (holder && S.cartCount()) {
      holder.innerHTML = V.cartLinesHTML();
      const aside = $('.co-summary', app);
      if (aside) {
        const sub = S.subtotal();
        aside.querySelector('.sum-row b').innerHTML = S.money(sub);
        const fb = aside.querySelector('.freebar'); if (fb) fb.outerHTML = V.freeBar(sub);
      }
    } else render(route);
  }
  if (route?.name === 'checkout') {
    const form = $('#checkoutForm', app);
    if (!S.cartCount()) return;
    if (form) $('[data-summary]', app).innerHTML = V.checkoutSummary(form.zone.value);
  }
});

// ---------- boot ----------
async function boot() {
  $('#year').textContent = new Date().getFullYear();
  M.init();
  try {
    await S.loadData();
  } catch (err) {
    console.error(err);
    document.documentElement.classList.remove('has-intro');
    $('#intro')?.classList.add('is-done');
    app.innerHTML = `<section class="confirm"><div class="confirm__inner"><h1 class="h-2">تعذّر تحميل بيانات المتجر</h1><p class="lede">تحقّق من الاتصال ثم أعد تحميل الصفحة.</p><button class="btn" onclick="location.reload()">إعادة المحاولة</button></div></section>`;
    return;
  }
  renderCart();
  window.addEventListener('hashchange', navigate);
  await navigate();
  document.body.classList.remove('is-loading');
}
boot();
