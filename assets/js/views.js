import { state, categories, category, products, product, money, esc, cartLines, totals, getOrder, getOrders, getPriceOverrides } from './store.js';

// ---------- primitives ----------
export const ICON = {
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  arrowL: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  arrowR: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
  truck: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M3 8h16v14H3zM19 13h6l4 5v4h-10"/><circle cx="9" cy="24" r="2.5"/><circle cx="24" cy="24" r="2.5"/></svg>',
  card: '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="4" y="7" width="24" height="18" rx="2"/><path d="M4 12h24M9 19h6"/></svg>',
  ribbon: '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="5" y="12" width="22" height="15" rx="1"/><path d="M5 17h22M16 12v15M16 12c-3-6-9-6-8-2s8 2 8 2zM16 12c3-6 9-6 8-2s-8 2-8 2z"/></svg>',
  cash: '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="9" width="26" height="14" rx="2"/><circle cx="16" cy="16" r="3.5"/><path d="M7 13v6M25 13v6"/></svg>',
  seal: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 8c4 6 10 6 14 4-1 6 3 11 8 13-5 3-6 9-3 14-6 0-10 4-11 10-5-4-11-4-16 0-1-6-5-10-11-10 3-5 2-11-3-14 5-2 9-7 8-13 4 2 10 2 14-4z"/><path d="M23 33l6 6 12-13"/></svg>'
};

export function img(name, alt = '', { sizes = '(max-width: 760px) 100vw, 50vw', eager = false, cls = '' } = {}) {
  const base = `assets/img/${name}`;
  return `<img class="ph ${cls}" src="${base}-sm.webp" srcset="${base}-sm.webp 720w, ${base}.webp 1600w" sizes="${sizes}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

const SUBS = {
  bouquets: [['roses', 'ورد جوري'], ['pink', 'درجات الوردي'], ['wrapped', 'مغلّفة ومزهريات'], ['signature', 'باقات التوقيع']],
  necklaces: [['necklace', 'قلائد'], ['earrings', 'أقراط'], ['bracelets', 'أساور']],
  rings: [['stones', 'بأحجار ملوّنة'], ['classic', 'كلاسيكية']],
  gifts: [['box', 'علب هدايا'], ['wrap', 'تغليف'], ['flowers', 'هدايا بالورد']],
  perfumes: [['eau', 'عطور'], ['oil', 'زيوت وخلاصات']]
};

const catName = id => category(id)?.name_ar || '';

function quickAdd(p) {
  return `<button class="pc__quick" data-add="${p.id}" aria-label="أضف ${esc(p.name_ar)} إلى السلة">${ICON.plus}</button>`;
}

export function card(p, { sizes, media = '', showShort = true } = {}) {
  return `
  <article class="pc" data-fade>
    <div class="pc__frame">
      <a class="pc__media reveal-img ${media}" href="#/p/${p.id}" data-reveal aria-label="${esc(p.name_ar)}">
        ${p.badge ? `<span class="pc__badge">${esc(p.badge)}</span>` : ''}
        ${img(p.image, `${p.name_ar} — ${p.name_en}`, { sizes })}
      </a>
      ${quickAdd(p)}
    </div>
    <div class="pc__meta">
      <h3 class="pc__name"><a href="#/p/${p.id}">${esc(p.name_ar)}</a><span class="pc__en">${esc(p.name_en)}</span></h3>
      <span class="pc__price">${money(p.price)}</span>
    </div>
    ${showShort ? `<p class="pc__short">${esc(p.short_ar)}</p>` : ''}
  </article>`;
}

function splitHead(tag, cls, html) {
  return `<${tag} class="${cls}" data-split>${html}</${tag}>`;
}

// ---------- HOME ----------
export function home() {
  const cats = categories();
  const b = id => product(id);
  const necklacesStrip = ['halo-pendant', 'crescent-stone', 'pearl-grace', 'sapphire-drops', 'silver-heart', 'tennis-bracelet', 'layered-whisper'].map(product).filter(Boolean);
  const rings3 = ['violet-bloom', 'halo-solitaire', 'rose-stone'].map(product).filter(Boolean);
  const del = state.settings.delivery;

  return `
  <section class="hero" data-theme="dark">
    <div class="hero__glow"></div><div class="hero__glow hero__glow--b"></div>
    <div class="hero__grain"></div>
    <div class="hero__stage">
      <p class="hero__word" aria-hidden="true" data-hero-word>Dokkan <span class="amp">al</span> Werd</p>
      <div class="hero__visual" data-hero-visual>
        <span class="hero__ring"></span>
        <div class="hero__arch" data-hero-arch>${img('b-lilac-reverie', 'باقة حلم الليلك — ورد أبيض وخوخي مع أزهار ليلكية', { eager: true, sizes: '(max-width: 980px) 78vw, 46vh' })}</div>
        <a class="hero__float hero__float--a" href="#/p/velvet-rouge" data-depth="26" aria-label="باقة مخمل أحمر">
          ${img('b-velvet-rouge', '', { eager: true, sizes: '210px' })}<span class="hero__cap en">Velvet Rouge</span></a>
        <a class="hero__float hero__float--b" href="#/p/violet-bloom" data-depth="-34" aria-label="خاتم زهرة البنفسج">
          ${img('r-violet-bloom', '', { eager: true, sizes: '170px' })}</a>
        <a class="hero__float hero__float--c" href="#/p/amber-silk" data-depth="18" aria-label="عطر حرير العنبر">
          ${img('p-amber-silk', '', { eager: true, sizes: '140px' })}</a>
      </div>
      ${sprig()}
      <div class="hero__copy">
        <span class="eyebrow" data-hero-in>ورد · فضة · هدايا · عطور</span>
        <h1 class="hero__title" data-hero-title>ورود تُهدى،<br><em>وأثر</em> يبقى.</h1>
        <p class="hero__sub" data-hero-in>دكانٌ صغير بذوقٍ كبير: باقات تُنسَّق باليد، فضة ناعمة، هدايا مغلّفة بعناية وعطور تُكمل الحكاية.</p>
        <div class="hero__ctas" data-hero-in>
          <a class="btn btn--light" href="#/c/bouquets">تسوّق الورد</a>
          <a class="btn btn--ghost-light" href="#/c/necklaces">اكتشف الفضة</a>
        </div>
      </div>
      <ol class="hero__index" data-hero-index>
        ${cats.map(c => `<li><a href="#/c/${c.id}"><small>${c.chapter}</small>${esc(c.name_ar)}</a></li>`).join('')}
      </ol>
    </div>
    <div class="hero__scroll" aria-hidden="true"><span>scroll</span><i></i></div>
  </section>

  <div class="marquee" aria-hidden="true"><div class="marquee__track">
    ${Array(2).fill(['Bouquets', 'Silver', 'Gifts', 'Perfume', 'Flowers & gifts & perfume', 'Dokkan al Werd'].map(t => `<span>${t}</span>`).join('')).join('')}
  </div></div>

  <section class="section" id="ch1">
    <div class="wrap">
      <header class="chapter-head">
        <span class="numeral" data-fade>I</span>
        <div>
          <span class="eyebrow" data-fade>الفصل الأول <span class="en">Bouquets</span></span>
          ${splitHead('h2', 'h-1', 'بوكيهات الورد')}
        </div>
        <div class="chapter-head__aside" data-fade>
          <p class="lede">${esc(category('bouquets').intro_ar)}</p>
          <a class="link" href="#/c/bouquets">كل الباقات <span class="arrow">←</span></a>
        </div>
      </header>
      <div class="ed-bouquets">
        <div class="ed-bouquets__lead" data-speed="-0.04">${card(b('midnight-garden'), { sizes: '(max-width: 860px) 100vw, 50vw' })}</div>
        <div class="ed-bouquets__a" data-speed="0.06">${card(b('velvet-rouge'), { sizes: '(max-width: 860px) 50vw, 25vw', showShort: false })}</div>
        <div class="ed-bouquets__b" data-speed="0.1">${card(b('tulip-morning'), { sizes: '(max-width: 860px) 50vw, 17vw', showShort: false })}</div>
        <blockquote class="ed-quote" data-fade>«الوردة لا تُشترى، تُختار. نختار كل ساق كأنها الوحيدة.»</blockquote>
      </div>
    </div>
  </section>

  <section class="section section--night" data-theme="dark">
    <div class="wrap">
      <header class="chapter-head">
        <span class="numeral" data-fade>II</span>
        <div>
          <span class="eyebrow" data-fade>الفصل الثاني <span class="en">Necklaces & Accessories</span></span>
          ${splitHead('h2', 'h-1', 'قلائد وإكسسوارات')}
        </div>
        <div class="chapter-head__aside" data-fade>
          <div class="vitrine__nav">
            <button data-vit="prev" aria-label="السابق">${ICON.arrowR}</button>
            <button data-vit="next" aria-label="التالي">${ICON.arrowL}</button>
          </div>
          <a class="link" href="#/c/necklaces">الواجهة كاملة <span class="arrow">←</span></a>
        </div>
      </header>
    </div>
    <div class="vitrine" data-vitrine>
      <div class="vitrine__track" data-vit-track>
        <div class="vitrine__item vitrine__item--wide" data-fade>
          <a class="pc__media reveal-img" href="#/c/necklaces" data-reveal style="display:block;border-radius:6px">${img('e-layered-model', 'قلائد ناعمة متعددة الطبقات', { sizes: '(max-width: 760px) 80vw, 40vw' })}</a>
        </div>
        ${necklacesStrip.map(p => `<div class="vitrine__item">${card(p, { sizes: '(max-width: 760px) 70vw, 26vw' })}</div>`).join('')}
      </div>
      <div class="progress"><i data-vit-progress></i></div>
    </div>
  </section>

  <section class="section section--lilac">
    <div class="wrap">
      <header class="chapter-head">
        <span class="numeral" data-fade>III</span>
        <div>
          <span class="eyebrow" data-fade>الفصل الثالث <span class="en">Silver Rings</span></span>
          ${splitHead('h2', 'h-1', 'خواتم تحت العدسة')}
        </div>
        <div class="chapter-head__aside" data-fade>
          <p class="lede">${esc(category('rings').intro_ar)}</p>
          <a class="link" href="#/c/rings">كل الخواتم <span class="arrow">←</span></a>
        </div>
      </header>
      <div class="loupe-row">
        ${rings3.map(p => `
          <article class="loupe pc" data-fade>
            <a class="loupe__lens" href="#/p/${p.id}" aria-label="${esc(p.name_ar)}">${img(p.image, `${p.name_ar} — خاتم فضة`, { sizes: '(max-width: 760px) 76vw, 30vw' })}</a>
            <div class="pc__meta">
              <h3 class="pc__name"><a href="#/p/${p.id}">${esc(p.name_ar)}</a><span class="pc__en">${esc(p.name_en)}</span></h3>
              <span class="pc__price">${money(p.price)}</span>
            </div>
            <button class="btn btn--ghost" data-add="${p.id}" style="min-height:44px">أضف إلى السلة</button>
          </article>`).join('')}
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="split">
        <a class="split__panel" href="#/c/gifts" data-fade>
          <img src="assets/img/g-noir-box.webp" alt="علب هدايا سوداء بشرائط ذهبية" loading="lazy" decoding="async" data-speed="-0.08">
          <div class="split__copy">
            <span class="numeral">IV</span>
            <h2 class="h-2">الهدايا</h2>
            <p style="margin:0;opacity:.8;max-width:34ch">${esc(category('gifts').intro_ar)}</p>
            <span class="link">اختر التغليف <span class="arrow">←</span></span>
          </div>
        </a>
        <a class="split__panel" href="#/c/perfumes" data-fade>
          <img src="assets/img/p-golden-hour.webp" alt="قوارير عطر بضوء ذهبي" loading="lazy" decoding="async" data-speed="-0.08">
          <div class="split__copy">
            <span class="numeral">V</span>
            <h2 class="h-2">العطور</h2>
            <p style="margin:0;opacity:.8;max-width:34ch">${esc(category('perfumes').intro_ar)}</p>
            <span class="link">اكتشف العطور <span class="arrow">←</span></span>
          </div>
        </a>
      </div>
    </div>
  </section>

  <section class="section section--tight" style="padding-top:0">
    <div class="wrap">
      <div class="story">
        <div class="story__img-a reveal-img" data-reveal>${img('e-flower-shop', 'واجهة محل ورد بدلاء معدنية مليئة بالأزهار', { sizes: '(max-width: 860px) 50vw, 40vw' })}</div>
        <div class="story__copy">
          <span class="eyebrow" data-fade>حكاية الدكان <span class="en">Our story</span></span>
          <blockquote data-fade>بدأنا بطاولة صغيرة ودلو من <em>اللافندر</em>، واليوم نُنسّق الورد والفضة والعطر لكل من يريد أن يقول شيئاً جميلاً.</blockquote>
          <span class="story__sign" data-fade>— Dokkan al Werd</span>
          <a class="link" href="#/about" data-fade style="width:max-content">اقرأ حكايتنا <span class="arrow">←</span></a>
        </div>
        <div class="story__img-b reveal-img" data-reveal data-speed="0.08">${img('e-lavender-field', 'حقل لافندر عند الغروب', { sizes: '(max-width: 860px) 50vw, 25vw' })}</div>
      </div>
    </div>
  </section>

  <section class="section--tight">
    <div class="wrap">
      <div class="services">
        <div class="service" data-fade>${ICON.truck}<b>توصيل</b><p>بغداد ${money(del.zones[0].fee)} · المحافظات ${money(del.zones[1].fee)}${del.free_over ? ` · مجاني فوق ${money(del.free_over)}` : ''}</p></div>
        <div class="service" data-fade>${ICON.card}<b>بطاقة إهداء</b><p>اكتب رسالتك عند الطلب ونكتبها بخط اليد مجاناً.</p></div>
        <div class="service" data-fade>${ICON.ribbon}<b>تغليف يدوي</b><p>ورق قطني، شريط حرير وعلب جاهزة للإهداء.</p></div>
        <div class="service" data-fade>${ICON.cash}<b>الدفع عند الاستلام</b><p>لا حاجة لبطاقة مصرفية، ادفع عند وصول الطلب.</p></div>
      </div>
    </div>
  </section>`;
}

function sprig() {
  // hand-drawn lavender sprig, animated as a line drawing
  const buds = [];
  for (let i = 0; i < 9; i++) {
    const y = 40 + i * 13, side = i % 2 ? 1 : -1;
    buds.push(`<ellipse class="bud" cx="${60 + side * (6 - i * .3)}" cy="${y}" rx="${4.2 - i * .2}" ry="${7 - i * .35}" transform="rotate(${side * 28} ${60 + side * 6} ${y})"/>`);
  }
  return `<svg class="sprig" viewBox="0 0 120 260" aria-hidden="true" data-sprig>
    <path d="M60 255 C58 200 62 150 60 30"/>
    <path d="M60 190 C70 175 84 168 96 166"/>
    <path d="M60 210 C48 198 36 194 22 194"/>
    <path d="M60 30 C60 22 61 16 60 10"/>
    <g data-buds>${buds.join('')}</g>
  </svg>`;
}

// ---------- CATEGORY ----------
const catTheme = { bouquets: '', necklaces: 'night', rings: 'lilac', gifts: 'kraft', perfumes: '' };

export function categoryView(id) {
  const c = category(id);
  if (!c) return notFound();
  const theme = catTheme[id];
  const list = products(id);
  const heroImg = { bouquets: 'b-lilac-reverie', necklaces: 'e-necklace-model', rings: 'e-ring-model', gifts: 'e-gift-hands', perfumes: 'p-oud-drop' }[id];
  const sectionCls = { necklaces: 'section section--night', gifts: 'section section--kraft', rings: 'section', bouquets: 'section', perfumes: 'section' }[id];
  return `
  <section class="cat-hero ${theme ? 'cat-hero--' + theme : ''}" ${theme === 'night' ? 'data-theme="dark"' : ''}>
    <div class="wrap cat-hero__grid">
      <div class="cat-hero__copy">
        <nav class="crumbs" aria-label="مسار التنقل" data-fade><a href="#/">الرئيسية</a><span>/</span><span>${esc(c.name_ar)}</span></nav>
        <span class="numeral" data-fade>${c.chapter}</span>
        <span class="eyebrow" data-fade><span class="en">${esc(c.name_en)}</span></span>
        ${splitHead('h1', 'h-display', esc(c.name_ar))}
        <p class="lede" data-fade>${esc(c.intro_ar)}</p>
      </div>
      <div class="cat-hero__img reveal-img" data-reveal>${img(heroImg, esc(c.name_ar), { eager: true, sizes: '(max-width: 860px) 100vw, 33vw' })}</div>
    </div>
  </section>
  <section class="${sectionCls}" ${theme === 'night' ? 'data-theme="dark"' : ''} style="padding-top:clamp(40px,5vw,72px)">
    <div class="wrap">
      <div class="filters" role="group" aria-label="تصفية ${esc(c.name_ar)}">
        <button class="chip" data-filter="all" aria-pressed="true">الكل</button>
        ${(SUBS[id] || []).filter(([s]) => list.some(p => p.sub === s)).map(([s, label]) => `<button class="chip" data-filter="${s}" aria-pressed="false">${label}</button>`).join('')}
        <span class="count-note" data-count>${list.length} منتج</span>
      </div>
      <div data-grid="${id}">${categoryGrid(id, list)}</div>
    </div>
  </section>`;
}

export function categoryGrid(id, list) {
  if (!list.length) return `<p class="empty">لا توجد منتجات في هذا التصنيف حالياً.</p>`;
  switch (id) {
    case 'bouquets':
      return `<div class="table-grid">${list.map(p => card(p, { sizes: '(max-width: 860px) 50vw, 33vw' })).join('')}</div>`;
    case 'necklaces':
      return `<div class="tray-grid">${list.map((p, i) => `
        <div class="tray" data-fade>
          <div class="tray__no"><span>№ ${String(i + 1).padStart(2, '0')}</span><span>${{ necklace: 'NECKLACE', earrings: 'EARRINGS', bracelets: 'BRACELET' }[p.sub] || ''}</span></div>
          ${card(p, { sizes: '(max-width: 980px) 50vw, 33vw' }).replace(' data-fade', '')}
        </div>`).join('')}</div>`;
    case 'rings':
      return `<div class="ring-view">
        <div class="ring-view__stage" aria-hidden="true">
          <div class="ring-view__lens" data-lens>${img(list[0].image, '', { sizes: '40vw', eager: true })}</div>
          <p class="ring-view__cap" data-lens-cap>${esc(list[0].name_en)}</p>
        </div>
        <ol class="ring-list">${list.map((p, i) => `
          <li class="ring-row ${i === 0 ? 'is-active' : ''}" data-ring="${p.id}" data-img="${p.image}" data-en="${esc(p.name_en)}" data-fade>
            <span class="ring-row__no">${String(i + 1).padStart(2, '0')}</span>
            <a class="ring-row__thumb" href="#/p/${p.id}" aria-hidden="true" tabindex="-1">${img(p.image, '', { sizes: '96px' })}</a>
            <div>
              <a class="ring-row__name" href="#/p/${p.id}">${esc(p.name_ar)}<span class="pc__en">${esc(p.name_en)}</span></a>
              <p class="ring-row__short">${esc(p.short_ar)}</p>
            </div>
            <div class="ring-row__side">
              <span class="pc__price">${money(p.price)}</span>
              <button class="add-mini" data-add="${p.id}" aria-label="أضف ${esc(p.name_ar)} إلى السلة">${ICON.plus}</button>
            </div>
          </li>`).join('')}</ol>
      </div>`;
    case 'gifts':
      return `<div class="tag-grid">${list.map(p => `<div class="gift-tag" data-fade>${card(p, { sizes: '(max-width: 640px) 100vw, 30vw' }).replace(' data-fade', '')}</div>`).join('')}</div>`;
    case 'perfumes':
      return `<div class="arch-grid">${list.map(p => `
        <div class="arch" data-fade>
          ${card(p, { sizes: '(max-width: 860px) 50vw, 30vw', media: '' }).replace(' data-fade', '').replace('class="pc__media reveal-img ', 'class="pc__media reveal-img arch-media ')}
          ${p.notes ? notesDl(p.notes) : ''}
        </div>`).join('')}</div>`;
    default:
      return `<div class="table-grid">${list.map(p => card(p)).join('')}</div>`;
  }
}

const notesDl = n => `<dl class="notes"><dt>المقدمة</dt><dd>${esc(n.top)}</dd><dt>القلب</dt><dd>${esc(n.heart)}</dd><dt>القاعدة</dt><dd>${esc(n.base)}</dd></dl>`;

// ---------- PRODUCT ----------
export function productView(id) {
  const p = product(id);
  if (!p) return notFound();
  const c = category(p.category);
  const mediaCls = p.category === 'rings' ? 'pdp__media--circle' : p.category === 'perfumes' ? 'pdp__media--arch' : '';
  const related = products(p.category).filter(x => x.id !== p.id).slice(0, 4);
  const noteLabel = ['bouquets', 'gifts'].includes(p.category) ? 'رسالة بطاقة الإهداء (اختياري)' : 'إضافة بطاقة إهداء مع القطعة (اختياري)';
  return `
  <section class="pdp">
    <div class="wrap">
      <nav class="crumbs" aria-label="مسار التنقل" style="margin-bottom:20px"><a href="#/">الرئيسية</a><span>/</span><a href="#/c/${c.id}">${esc(c.name_ar)}</a><span>/</span><span>${esc(p.name_ar)}</span></nav>
      <div class="pdp__grid">
        <div>
          <div class="pdp__media ${mediaCls} reveal-img" data-reveal data-zoom>
            <img class="ph" src="assets/img/${p.image}.webp" alt="${esc(p.name_ar)} — ${esc(p.name_en)}" fetchpriority="high" decoding="async">
            <span class="pdp__zoomhint">انقر للتكبير</span>
          </div>
        </div>
        <div class="pdp__info">
          <span class="eyebrow" data-fade>${c.chapter} · ${esc(c.name_ar)}</span>
          <h1 class="pdp__title" data-fade>${esc(p.name_ar)}<span class="pc__en">${esc(p.name_en)}</span></h1>
          <div class="pdp__price" data-fade>${money(p.price)} ${p.badge ? `<small>${esc(p.badge)}</small>` : ''}</div>
          <p class="pdp__desc" data-fade>${esc(p.description_ar)}</p>
          ${p.notes ? `<div data-fade>${notesDl(p.notes)}</div>` : ''}
          <ul class="pdp__details" data-fade>${(p.details_ar || []).map(d => `<li>${esc(d)}</li>`).join('')}</ul>
          <div class="field pdp__note" data-fade>
            <label for="giftNote">${noteLabel}</label>
            <textarea id="giftNote" maxlength="240" placeholder="مثال: كل عام وأنتِ بخير ♡"></textarea>
          </div>
          <div class="pdp__buybar" data-fade>
            <div class="pdp__buy">
              <div class="qty" data-qty>
                <button type="button" data-step="1" aria-label="زيادة الكمية">+</button>
                <output aria-live="polite" data-qty-val>1</output>
                <button type="button" data-step="-1" aria-label="إنقاص الكمية">−</button>
              </div>
              <button class="btn" data-add-pdp="${p.id}">${ICON.bag} أضف إلى السلة</button>
            </div>
            <button class="link" data-buy-now="${p.id}" style="margin-top:12px">اطلب الآن مباشرة <span class="arrow">←</span></button>
          </div>
          <div class="notice notice--lilac" data-fade>${ICON.info}<span>منتج تجريبي — السعر والوصف للعرض فقط ويمكن تعديلهما من ملف البيانات.</span></div>
        </div>
      </div>
    </div>
  </section>
  ${related.length ? `
  <section class="section">
    <div class="wrap">
      <header class="chapter-head" style="grid-template-columns:1fr auto;margin-bottom:36px">
        <div><span class="eyebrow">من نفس الفصل <span class="en">You may also love</span></span>
        ${splitHead('h2', 'h-2', `المزيد من ${esc(c.name_ar)}`)}</div>
        <a class="link" href="#/c/${c.id}">عرض الكل <span class="arrow">←</span></a>
      </header>
      <div class="related-grid">${related.map(r => card(r, { sizes: '(max-width: 760px) 50vw, 25vw', showShort: false })).join('')}</div>
    </div>
  </section>` : ''}`;
}

// ---------- CART ----------
export function cartLinesHTML({ compact = false } = {}) {
  const lines = cartLines();
  if (!lines.length) {
    return `<div class="cart-empty">
      <img src="assets/img/e-rose-vase-sm.webp" alt="" loading="lazy">
      <p class="h-3">سلتك فارغة الآن</p>
      <p>ابدأ بوردة واحدة… أو باقة كاملة.</p>
      <a class="btn" href="#/c/bouquets" data-close-cart>تسوّق الورد</a>
    </div>`;
  }
  return lines.map(l => `
    <div class="line">
      <a class="line__img" href="#/p/${l.product.id}" data-close-cart><img src="assets/img/${l.product.image}-sm.webp" alt="${esc(l.product.name_ar)}" loading="lazy"></a>
      <div>
        <div class="line__top">
          <div><a class="line__name" href="#/p/${l.product.id}" data-close-cart>${esc(l.product.name_ar)}</a><div class="line__cat">${esc(catName(l.product.category))} · ${money(l.product.price)}</div></div>
          <b class="pc__price">${money(l.product.price * l.qty)}</b>
        </div>
        ${l.note ? `<div class="line__note">بطاقة: «${esc(l.note)}»</div>` : ''}
        <div class="line__bottom">
          <div class="qty qty--sm">
            <button type="button" data-line-step="1" data-line="${l.index}" aria-label="زيادة الكمية">+</button>
            <output>${l.qty}</output>
            <button type="button" data-line-step="-1" data-line="${l.index}" aria-label="إنقاص الكمية">−</button>
          </div>
          <button class="line__rm" data-line-rm="${l.index}">إزالة</button>
        </div>
      </div>
    </div>`).join('');
}

export function freeBar(sub) {
  const fo = state.settings.delivery.free_over;
  if (!fo) return '';
  const pct = Math.min(100, (sub / fo) * 100);
  const left = fo - sub;
  return `<div class="freebar">${left > 0 ? `أضف ${money(left)} للحصول على توصيل مجاني` : 'رائع! طلبك مؤهل للتوصيل المجاني'}<div class="freebar__track"><i style="width:${pct}%"></i></div></div>`;
}

export function cartPage() {
  const lines = cartLines();
  const { sub } = totals();
  return `
  <section class="page-head"><div class="wrap">
    <span class="eyebrow" data-fade><span class="en">Your basket</span></span>
    ${splitHead('h1', 'h-1', 'سلة التسوق')}
  </div></section>
  <section class="section--tight" style="padding-top:0;padding-bottom:clamp(60px,8vw,120px)"><div class="wrap">
    <div class="co-grid">
      <div data-cart-page-lines>${cartLinesHTML()}</div>
      ${lines.length ? `<aside class="co-summary">
        <h3>ملخص السلة</h3>
        <div class="sum-row"><span>المجموع الفرعي</span><b>${money(sub)}</b></div>
        <div class="sum-row"><span>التوصيل</span><small>يُحسب حسب المحافظة في الخطوة التالية</small></div>
        ${freeBar(sub)}
        <a class="btn btn--block" href="#/checkout">متابعة إلى مراجعة الطلب</a>
        <a class="link" href="#/c/bouquets" style="justify-self:center">متابعة التسوق</a>
      </aside>` : ''}
    </div>
  </div></section>`;
}

// ---------- CHECKOUT ----------
export function checkoutView() {
  const lines = cartLines();
  if (!lines.length) {
    return `<section class="confirm"><div class="confirm__inner">
      <h1 class="h-1">لا توجد منتجات للطلب</h1><p class="lede">أضف منتجاً إلى السلة أولاً.</p>
      <a class="btn" href="#/c/bouquets">تسوّق الآن</a></div></section>`;
  }
  const s = state.settings;
  const today = new Date().toISOString().slice(0, 10);
  return `
  <section class="page-head"><div class="wrap">
    <nav class="crumbs" style="margin-bottom:12px"><a href="#/cart">السلة</a><span>/</span><span>مراجعة الطلب</span></nav>
    ${splitHead('h1', 'h-1', 'مراجعة الطلب')}
  </div></section>
  <section style="padding-bottom:clamp(60px,8vw,120px)"><div class="wrap">
    <form class="co-grid" id="checkoutForm" novalidate>
      <div>
        <div class="co-step">
          <h3><small>01</small> بيانات المستلم</h3>
          <div class="form-grid">
            <div class="field"><label for="f-name">الاسم الكامل</label><input id="f-name" name="name" autocomplete="name" required><span class="field__err"></span></div>
            <div class="field"><label for="f-phone">رقم الهاتف</label><input id="f-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="07XX XXX XXXX" dir="ltr" required><span class="field__err"></span></div>
          </div>
        </div>
        <div class="co-step">
          <h3><small>02</small> التوصيل</h3>
          <div class="form-grid">
            <div class="field"><label for="f-zone">المحافظة</label>
              <select id="f-zone" name="zone" required><option value="">اختر…</option>${s.delivery.zones.map(z => `<option value="${z.id}">${esc(z.name_ar)} — ${z.fee.toLocaleString('en-US')} ${s.currency_label}</option>`).join('')}</select><span class="field__err"></span></div>
            <div class="field"><label for="f-date">تاريخ التوصيل المفضّل</label><input id="f-date" name="date" type="date" min="${today}" value="${today}"><span class="field__err"></span></div>
            <div class="field full"><label for="f-address">العنوان بالتفصيل</label><input id="f-address" name="address" autocomplete="street-address" placeholder="المنطقة، الشارع، أقرب نقطة دالة" required><span class="field__err"></span></div>
            <div class="field full"><label for="f-notes">ملاحظات للتوصيل (اختياري)</label><textarea id="f-notes" name="notes" maxlength="300"></textarea></div>
          </div>
        </div>
        <div class="co-step" style="border:0;margin:0">
          <h3><small>03</small> الدفع</h3>
          <div class="radio-cards">
            ${s.payment_methods.map((m, i) => `<label class="radio-card"><input type="radio" name="pay" value="${m.id}" ${i === 0 ? 'checked' : ''}><span><b>${esc(m.name_ar)}</b></span>${ICON.cash.replace('<svg', '<svg style="width:26px;height:26px;stroke:var(--violet);fill:none;stroke-width:1.2"')}</label>`).join('')}
          </div>
          <div class="notice">${ICON.info}<span>هذا متجر تجريبي مستضاف كموقع ثابت بدون خادم: عند التأكيد يُحفظ الطلب في هذا المتصفح فقط ولا يُرسل إلى أي جهة${s.contact.whatsapp ? '، ويمكنك إرساله عبر واتساب من صفحة التأكيد' : ''}.</span></div>
        </div>
      </div>
      <aside class="co-summary" data-summary>${checkoutSummary('')}</aside>
    </form>
  </div></section>`;
}

export function checkoutSummary(zone) {
  const t = totals(zone);
  return `
    <h3>طلبك</h3>
    ${cartLines().map(l => `<div class="mini-line"><img src="assets/img/${l.product.image}-sm.webp" alt="" loading="lazy"><span><b>${esc(l.product.name_ar)}</b><small>الكمية ${l.qty}${l.note ? ' · مع بطاقة' : ''}</small></span><span>${money(l.product.price * l.qty)}</span></div>`).join('')}
    <div class="sum-row" style="margin-top:6px"><span>المجموع الفرعي</span><b data-sum-sub>${money(t.sub)}</b></div>
    <div class="sum-row"><span>التوصيل</span><b data-sum-fee>${t.fee === null ? '<small>اختر المحافظة</small>' : t.fee === 0 ? 'مجاني' : money(t.fee)}</b></div>
    ${freeBar(t.sub)}
    <div class="sum-row sum-row--total"><span>الإجمالي</span><b data-sum-total>${money(t.total)}</b></div>
    <button class="btn btn--block" type="submit">تأكيد الطلب</button>
    <a class="link" href="#/cart" style="justify-self:center">تعديل السلة</a>`;
}

export function orderView(no) {
  const o = getOrder(no);
  if (!o) return notFound('لم نجد هذا الطلب في هذا المتصفح.');
  const s = state.settings;
  return `
  <section class="confirm"><div class="confirm__inner">
    <div class="confirm__seal" data-fade>${ICON.seal}</div>
    <span class="eyebrow" data-fade><span class="en">Thank you</span></span>
    ${splitHead('h1', 'h-1', `شكراً ${esc(o.customer.name.split(' ')[0])}، طلبك مسجّل`)}
    <p class="order-no" data-fade>${esc(o.no)}</p>
    <div class="confirm__box" data-fade>
      ${o.items.map(i => `<div class="sum-row"><span>${esc(i.name)} × ${i.qty}</span><b>${money(i.price * i.qty)}</b></div>`).join('')}
      <div class="sum-row"><span>التوصيل (${esc(o.zoneName)})</span><b>${o.fee === 0 ? 'مجاني' : money(o.fee)}</b></div>
      <div class="sum-row sum-row--total"><span>الإجمالي — ${esc(o.payName)}</span><b>${money(o.total)}</b></div>
    </div>
    <div class="notice" data-fade style="text-align:start">${ICON.info}<span>نسخة تجريبية: الطلب محفوظ في هذا المتصفح فقط ولم يُرسل إلى المتجر. ${s.contact.whatsapp ? 'لإرساله فعلياً استخدم زر واتساب.' : 'لم يُضبط رقم واتساب للمتجر بعد في ملف الإعدادات، لذا يمكنك نسخ ملخص الطلب.'}</span></div>
    <div class="confirm__actions" data-fade>
      ${s.contact.whatsapp ? `<a class="btn" data-wa-order="${esc(o.no)}" href="#" target="_blank" rel="noopener">إرسال الطلب عبر واتساب</a>` : ''}
      <button class="btn ${s.contact.whatsapp ? 'btn--ghost' : ''}" data-copy-order="${esc(o.no)}">نسخ ملخص الطلب</button>
      <a class="btn btn--ghost" href="#/">العودة للرئيسية</a>
    </div>
  </div></section>`;
}

// ---------- ABOUT ----------
export function aboutView() {
  const sw = [['#ECDEF5', 'Lilac Mist', 'ليلكي ضبابي', '#241B2B'], ['#C9ADD8', 'Soft Lavender', 'لافندر ناعم', '#241B2B'], ['#B689D2', 'Lavender', 'لافندر', '#241B2B'], ['#744C95', 'Deep Violet', 'بنفسجي عميق', '#FAF7F3'], ['#9A7486', 'Muted Mauve', 'موف هادئ', '#FAF7F3'], ['#7D8A72', 'Botanical Sage', 'أخضر نباتي', '#FAF7F3']];
  return `
  <section class="about-hero" data-theme="dark">
    <img src="assets/img/e-lavender-field.webp" alt="حقل لافندر عند الغروب" fetchpriority="high" data-speed="-0.15">
    <div class="wrap">
      <span class="eyebrow" data-fade>حكايتنا <span class="en">Our story</span></span>
      ${splitHead('h1', 'h-display', 'من حقل لافندر<br>إلى باب بيتك')}
      <p class="lede" data-fade style="color:rgba(250,247,243,.8)">دكان الورد متجر صغير للورد الطبيعي والفضة والهدايا والعطور. نؤمن أن الهدية الجميلة لا تحتاج إلى مناسبة، بل إلى شخص يستحقها.</p>
    </div>
  </section>
  <section class="section"><div class="wrap">
    <header class="chapter-head" style="grid-template-columns:1fr">
      <div><span class="eyebrow" data-fade>ما نؤمن به</span>${splitHead('h2', 'h-1', 'ثلاثة أشياء لا نتنازل عنها')}</div>
    </header>
    <div class="manifest">
      <article data-fade><h3 class="h-3">الورد طازج أو لا شيء</h3><p>نختار الورد صباح يوم التوصيل، وننسّقه يدوياً، ولا نرسل باقة لا نرضى أن نستلمها نحن.</p></article>
      <article data-fade><h3 class="h-3">التفاصيل الصغيرة</h3><p>الشريط، الورقة، البطاقة المكتوبة بخط اليد… هي ما يجعل الهدية تُتذكَّر.</p></article>
      <article data-fade><h3 class="h-3">جمال يُلبس كل يوم</h3><p>قطع فضة ناعمة وعطور هادئة تُكمل الورد، وتبقى بعد أن يذبل.</p></article>
    </div>
  </div></section>
  <section class="section section--lilac"><div class="wrap">
    <div class="about-photos">
      <div class="reveal-img p1" data-reveal>${img('e-rose-pages', 'وردة حمراء على صفحات كتاب', { sizes: '40vw' })}</div>
      <div class="reveal-img p2" data-reveal data-speed="0.1">${img('e-silver-flatlay', 'مجموعة مجوهرات فضية', { sizes: '25vw' })}</div>
      <div class="reveal-img p3" data-reveal>${img('e-peony', 'زهرة فاوانيا وردية', { sizes: '33vw' })}</div>
    </div>
  </div></section>
  <section class="section"><div class="wrap">
    <header class="chapter-head" style="grid-template-columns:1fr auto">
      <div><span class="eyebrow" data-fade>الهوية <span class="en">Drawn from our emblem</span></span>${splitHead('h2', 'h-2', 'ألوان مستخرجة من شعار الدكان')}</div>
      <img src="assets/brand/logo.webp" alt="شعار دكان الورد" width="120" height="120" style="border-radius:50%" loading="lazy" data-fade>
    </header>
    <div class="palette" data-fade>${sw.map(([hex, en, ar, fg]) => `<div style="background:${hex};color:${fg}"><b>${ar}</b><span>${en} · ${hex}</span></div>`).join('')}</div>
    <div style="margin-top:48px;display:flex;gap:12px;flex-wrap:wrap" data-fade><a class="btn" href="#/c/bouquets">ابدأ التسوق</a><a class="btn btn--ghost" href="#/contact">تواصل معنا</a></div>
  </div></section>`;
}

// ---------- CONTACT ----------
export function contactView() {
  const c = state.settings.contact;
  const cards = [
    ['ساعات العمل', esc(c.hours_ar)],
    ['الموقع', esc(c.address_ar)],
    c.whatsapp && ['واتساب', `<a href="https://wa.me/${esc(c.whatsapp.replace(/\D/g, ''))}" target="_blank" rel="noopener" dir="ltr">${esc(c.whatsapp)}</a>`],
    c.phone && ['الهاتف', `<a href="tel:${esc(c.phone)}" dir="ltr">${esc(c.phone)}</a>`],
    c.email && ['البريد', `<a href="mailto:${esc(c.email)}" dir="ltr">${esc(c.email)}</a>`],
    c.instagram && ['إنستغرام', `<a href="https://instagram.com/${esc(c.instagram.replace('@', ''))}" target="_blank" rel="noopener" dir="ltr">@${esc(c.instagram.replace('@', ''))}</a>`]
  ].filter(Boolean);
  const hasChannel = c.whatsapp || c.email;
  return `
  <section class="page-head"><div class="wrap">
    <span class="eyebrow" data-fade>تواصل <span class="en">Say hello</span></span>
    ${splitHead('h1', 'h-display', 'نحب أن نسمع منك')}
  </div></section>
  <section style="padding-bottom:clamp(60px,8vw,120px)"><div class="wrap contact-grid">
    <div>
      <div class="reveal-img" data-reveal style="aspect-ratio:4/5;border-radius:999px 999px 6px 6px;margin-bottom:24px">${img('e-marble-blooms', 'أزهار على رخام', { sizes: '(max-width: 860px) 100vw, 35vw' })}</div>
      ${cards.map(([k, v]) => `<div class="contact-card" data-fade><small>${k}</small><b>${v}</b></div>`).join('')}
    </div>
    <form id="contactForm" novalidate style="display:grid;gap:18px;align-content:start">
      <p class="lede" data-fade>طلب خاص؟ باقة لمناسبة كبيرة أو تنسيق لحفل؟ اكتب لنا التفاصيل.</p>
      <div class="form-grid">
        <div class="field"><label for="c-name">الاسم</label><input id="c-name" name="name" autocomplete="name" required><span class="field__err"></span></div>
        <div class="field"><label for="c-phone">الهاتف</label><input id="c-phone" name="phone" type="tel" inputmode="tel" dir="ltr" placeholder="07XX XXX XXXX" required><span class="field__err"></span></div>
        <div class="field full"><label for="c-topic">الموضوع</label><select id="c-topic" name="topic"><option>طلب باقة خاصة</option><option>تنسيق مناسبة</option><option>استفسار عن طلب</option><option>أخرى</option></select></div>
        <div class="field full"><label for="c-msg">رسالتك</label><textarea id="c-msg" name="message" required maxlength="800"></textarea><span class="field__err"></span></div>
      </div>
      ${hasChannel ? '' : `<div class="notice">${ICON.info}<span>نسخة تجريبية: لم تُضبط بعد قناة استقبال (واتساب أو بريد) في ملف الإعدادات، لذلك سيتم نسخ رسالتك إلى الحافظة بدلاً من إرسالها.</span></div>`}
      <button class="btn" type="submit" style="justify-self:start">${hasChannel ? 'إرسال الرسالة' : 'تجهيز الرسالة ونسخها'}</button>
      <p data-contact-status role="status" style="margin:0;color:var(--violet)"></p>
    </form>
  </div></section>`;
}

// ---------- ADMIN ----------
export function adminView() {
  const s = state.settings;
  const ov = getPriceOverrides();
  const orders = getOrders();
  return `
  <section class="page-head"><div class="wrap">
    <span class="eyebrow"><span class="en">Store settings</span></span>
    <h1 class="h-1">إعدادات المتجر</h1>
  </div></section>
  <section style="padding-bottom:clamp(60px,8vw,120px)"><div class="wrap" style="display:grid;gap:40px">
    <div class="notice" style="font-size:15px">${ICON.info}<div><b>تنبيه: جميع المنتجات والأسعار في هذا الموقع تجريبية.</b><br>
      الأسعار رمزية بالدينار العراقي وُضعت للعرض فقط، وهي قابلة للتعديل بالكامل. البيانات الرسمية موجودة في الملفين
      <code>data/products.json</code> و <code>data/settings.json</code> — عدّلهما على GitHub وسيتحدث الموقع تلقائياً دون إعادة بناء.</div></div>

    <div>
      <h2 class="h-3" style="margin-bottom:14px">إعدادات حالية</h2>
      <dl class="kv">
        <dt>الوضع</dt><dd>${s.demo_mode ? 'تجريبي (Demo)' : 'حي'}</dd>
        <dt>عدد المنتجات</dt><dd>${state.catalog.products.length}</dd>
        <dt>التوصيل</dt><dd>${s.delivery.zones.map(z => `${esc(z.name_ar)}: ${z.fee.toLocaleString('en-US')}`).join(' · ')} — مجاني فوق ${s.delivery.free_over.toLocaleString('en-US')}</dd>
        <dt>واتساب</dt><dd>${s.contact.whatsapp ? esc(s.contact.whatsapp) : '<span style="color:#B0475A">غير مضبوط</span>'}</dd>
        <dt>البريد</dt><dd>${s.contact.email ? esc(s.contact.email) : '<span style="color:#B0475A">غير مضبوط</span>'}</dd>
        <dt>طلبات محفوظة في هذا المتصفح</dt><dd>${orders.length}</dd>
      </dl>
    </div>

    <div>
      <h2 class="h-3" style="margin-bottom:6px">معاينة تعديل الأسعار</h2>
      <p style="margin:0 0 16px;color:var(--ink-2);font-size:14px">التعديلات هنا تُطبَّق للمعاينة في هذا المتصفح فقط. لاعتمادها للجميع: اضغط «تنزيل products.json» ثم ارفع الملف مكان القديم في المستودع.</p>
      <div class="table-scroll"><table class="admin-table">
        <thead><tr><th></th><th>المنتج</th><th>القسم</th><th>السعر الأصلي</th><th>سعر المعاينة (د.ع)</th></tr></thead>
        <tbody>${state.catalog.products.map(p => `<tr>
          <td><img src="assets/img/${p.image}-sm.webp" alt="" loading="lazy"></td>
          <td><a href="#/p/${p.id}">${esc(p.name_ar)}</a><br><small style="color:var(--ink-3)">${esc(p.id)}</small></td>
          <td>${esc(catName(p.category))}</td>
          <td class="num">${state.basePrices.get(p.id).toLocaleString('en-US')}</td>
          <td><input type="number" min="0" step="500" value="${p.price}" data-price="${p.id}" class="${ov[p.id] !== undefined ? 'is-changed' : ''}" aria-label="سعر ${esc(p.name_ar)}"></td>
        </tr>`).join('')}</tbody>
      </table></div>
    </div>
    <div class="admin-actions">
      <button class="btn" data-admin="export">تنزيل products.json</button>
      <button class="btn btn--ghost" data-admin="reset">إلغاء تعديلات المعاينة</button>
      <button class="btn btn--ghost" data-admin="orders">حذف الطلبات التجريبية المحفوظة</button>
    </div>
  </div></section>`;
}

export function notFound(msg = 'الصفحة التي تبحث عنها غير موجودة.') {
  return `<section class="confirm"><div class="confirm__inner">
    <span class="numeral">404</span><h1 class="h-2">${esc(msg)}</h1>
    <a class="btn" href="#/">العودة للرئيسية</a></div></section>`;
}
