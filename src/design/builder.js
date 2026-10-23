/* =========================================================================
   DESIGN BUILDER
   Step 1: pick component variants for your design system.

   Build a design system from the lab: every component starts with 3
   variants, the user ticks more, previews the result and downloads it.

   Provides: DN_SECS, DN_KEY, DN_START, DN_ALL, dnVariants, dnStarter,
   dnSel, dnGet, dnSave, dnSet, dnTotal, dnEdited, dnURL, dnPost, dnObs,
   dnIO, dnTimer, dnBind, dnTabs, dnPage
   ========================================================================= */
'use strict';

const DN_SECS = [
  ['basic', 'Variants'],
  ['layout', 'Layout'],
  ['density', 'Density'],
  ['icon', 'Icons'],
  ['state', 'States'],
  ['content', 'Content'],
  ['size', 'Sizes'],
  ['color', 'Colors'],
  ['case', 'Use cases']
];
const DN_KEY = 'kagami-design';
const DN_START = 3;
const DN_ALL = COMP_GROUPS.reduce((a, g) => a.concat(g.items), []);
const dnVariants = slug => (DN_CAT[slug] || []).filter(v => DN_SECS.some(s => s[0] === v[1]));
const dnStarter = slug => {
  const all = dnVariants(slug),
    b = all.filter(v => v[1] === 'basic');
  return (b.length ? b : all).slice(0, DN_START).map(v => v[0]);
};
let dnSel = (() => {
  try {
    return JSON.parse(store(DN_KEY) || '{}') || {};
  } catch (e) {
    return {};
  }
})();
const dnGet = slug => {
  const ids = new Set(dnVariants(slug).map(v => v[0]));
  return Array.isArray(dnSel[slug]) ? dnSel[slug].filter(i => ids.has(i)) : dnStarter(slug);
};
const dnSave = () => store(DN_KEY, JSON.stringify(dnSel));
const dnSet = (slug, ids) => {
  dnSel[slug] = ids;
  dnSave();
};
const dnTotal = () => sum(DN_ALL, c => dnGet(c.s).length);
const dnEdited = slug => Array.isArray(dnSel[slug]) && dnSel[slug].join() !== dnStarter(slug).join();
function dnURL(slug, hgt) {
  const s = compEmbedState();
  return (
    LAB_HOST +
    '#embed=1&c=' +
    slug +
    (hgt ? '&h=1' : '') +
    '&theme=' +
    s.theme +
    '&lang=' +
    s.lang +
    '&size=' +
    s.size +
    '&density=' +
    s.density +
    '&only=' +
    encodeURIComponent(dnGet(slug).join(','))
  );
}
const dnPost = (f, slug) => {
  try {
    f.contentWindow &&
      f.contentWindow.postMessage(
        Object.assign({}, compEmbedState(), { only: dnGet(slug || f.dataset.slug) }),
        '*'
      );
  } catch (e) {}
};
window.addEventListener('message', e => {
  const m = e.data;
  if (!m || m.type !== 'kagami-lab-h') return;
  $$('.dn-frame').forEach(f => {
    if (f.contentWindow === e.source) f.style.height = Math.max(80, m.h) + 'px';
  });
});
let dnObs = null,
  dnIO = null,
  dnTimer = 0;
function dnBind(page) {
  if (dnObs) dnObs.disconnect();
  if (dnIO) dnIO.disconnect();
  page.addEventListener(
    'load',
    e => {
      const f = e.target;
      if (!f.classList || !f.classList.contains('dn-frame')) return;
      f.dataset.loaded = '1';
      dnPost(f);
      const ld = f.parentNode.querySelector('.cmp-load');
      if (ld) ld.hidden = true;
    },
    true
  );
  const lazy = $$('.dn-frame[data-src]', page);
  if (lazy.length) {
    dnIO = new IntersectionObserver(
      es =>
        es.forEach(en => {
          if (!en.isIntersecting) return;
          const f = en.target;
          dnIO.unobserve(f);
          f.src = dnURL(f.dataset.src, true);
          f.dataset.slug = f.dataset.src;
          f.removeAttribute('data-src');
        }),
      { root: $('#main'), rootMargin: '600px 0px' }
    );
    lazy.forEach(f => dnIO.observe(f));
  }
  dnObs = new MutationObserver(() => {
    if (!document.body.contains(page)) {
      dnObs.disconnect();
      if (dnIO) dnIO.disconnect();
      return;
    }
    clearTimeout(dnTimer);
    dnTimer = setTimeout(() => $$('.dn-frame[data-loaded]', page).forEach(f => dnPost(f)), 60);
  });
  dnObs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-lang', 'data-size', 'data-density']
  });
}
function dnTabs(active) {
  return (
    '<div class="dn-tabs" role="tablist"><a class="dn-tab' +
    (active === 'build' ? ' on' : '') +
    '" role="tab" href="#/design">' +
    icon('sliders', 16) +
    '<span>1 · Build</span></a><a class="dn-tab' +
    (active === 'preview' ? ' on' : '') +
    '" role="tab" href="#/design/preview">' +
    icon('eye', 16) +
    '<span>2 · Preview and download</span></a><a class="dn-tab' +
    (active === 'guide' ? ' on' : '') +
    '" role="tab" href="#/design/styleguide">' +
    icon('book', 16) +
    '<span>3 · Styleguide</span></a><a class="dn-tab' +
    (active === 'import' ? ' on' : '') +
    '" role="tab" href="#/import">' +
    icon('inbox', 16) +
    '<span>4 · Import HTML</span></a><span class="muted dn-count">' +
    dnTotal() +
    ' variants selected in ' +
    DN_ALL.filter(c => dnGet(c.s).length).length +
    ' components</span></div>'
  );
}
/* ---------- step 1: build ---------- */
function dnPage(slug) {
  const c = COMP_BY[slug] || DN_ALL[0],
    vs = dnVariants(c.s),
    sel = new Set(dnGet(c.s));
  const list = COMP_GROUPS.map(
    g =>
      '<div class="dn-gh">' +
      esc(g.g) +
      '</div>' +
      g.items
        .map(
          i =>
            '<a class="dn-item' +
            (i.s === c.s ? ' on' : '') +
            '" href="#/design/' +
            i.s +
            '" data-dn-item="' +
            i.s +
            '"><span>' +
            esc(i.n) +
            '</span><span class="badge' +
            (dnEdited(i.s) ? ' b-info' : '') +
            '" data-dn-n="' +
            i.s +
            '">' +
            dnGet(i.s).length +
            '</span></a>'
        )
        .join('')
  ).join('');
  const picker = DN_SECS.map(([k, l]) => {
    const L = vs.filter(v => v[1] === k);
    if (!L.length) return '';
    return (
      '<div class="dn-sec"><h3>' +
      l +
      ' <span class="muted">' +
      L.length +
      '</span></h3><div class="dn-chips">' +
      L.map(
        v =>
          '<button type="button" class="dn-chip" data-dn-fig="' +
          v[0] +
          '" aria-pressed="' +
          sel.has(v[0]) +
          '"><i aria-hidden="true">' +
          icon('check', 12) +
          '</i>' +
          esc(v[2]) +
          '</button>'
      ).join('') +
      '</div></div>'
    );
  }).join('');
  return {
    title: 'Design system builder',
    nav: '',
    crumbs: [['Design']],
    sub:
      'Every component starts with ' +
      DN_START +
      ' variants. Tick more to add them, then preview the finished design system and download it.',
    actions:
      '<button type="button" class="btn btn-sm" data-dn-more aria-haspopup="menu">' +
      icon('more', 16) +
      '<span>More</span></button><a class="btn btn-primary btn-sm" href="#/design/preview">' +
      icon('eye', 16) +
      '<span>Preview and download</span></a>',
    body:
      dnTabs('build') +
      '<div class="dn-split"><nav class="dn-list" aria-label="Components">' +
      list +
      '</nav><div class="dn-main"><section class="card dn-head"><div class="card-body"><div class="row between" style="gap:12px;flex-wrap:wrap"><div style="min-width:0"><h2 style="font-size:18px;font-weight:650">' +
      esc(c.n) +
      '</h2><p class="muted">' +
      esc(c.d) +
      '</p></div><div class="row" style="gap:8px"><span class="badge b-info" data-dn-cnt>' +
      sel.size +
      ' of ' +
      vs.length +
      ' selected</span><button type="button" class="btn btn-sm" data-dn-starter>' +
      icon('undo', 16) +
      '<span>Starter ' +
      DN_START +
      '</span></button><button type="button" class="btn btn-sm" data-dn-none>Clear</button><button type="button" class="btn btn-sm" data-dn-allv>Select all</button></div></div></div></section>' +
      '<section class="card"><div class="card-head"><div><h2 class="card-title">Pick variants</h2><div class="card-sub">Selected variants are part of your design system. Add as many as you need.</div></div></div><div class="card-body">' +
      picker +
      '</div></section>' +
      '<section class="card"><div class="card-head"><div><h2 class="card-title">Live preview</h2><div class="card-sub">Uses your theme and design lab settings.</div></div></div><div class="cmp-stage dn-stage"><div class="cmp-load">' +
      icon('refresh', 16) +
      '<span>Loading preview…</span></div><iframe class="dn-frame" data-slug="' +
      c.s +
      '" title="' +
      esc(c.n) +
      ' selected variants" src="' +
      dnURL(c.s, true) +
      '"></iframe></div></section></div></div>',
    mount(page) {
      dnBind(page);
      const mo = $('[data-dn-more]', page);
      if (mo) mo.onclick = () => dnMoreMenu(mo);
      const fr = $('.dn-frame', page),
        refresh = () => {
          const ids = dnGet(c.s);
          $$('[data-dn-fig]', page).forEach(b =>
            b.setAttribute('aria-pressed', String(ids.includes(b.dataset.dnFig)))
          );
          $('[data-dn-cnt]', page).textContent = ids.length + ' of ' + vs.length + ' selected';
          const n = $('[data-dn-n="' + c.s + '"]', page);
          n.textContent = ids.length;
          n.classList.toggle('b-info', dnEdited(c.s));
          $('.dn-count', page).textContent =
            dnTotal() +
            ' variants selected in ' +
            DN_ALL.filter(x => dnGet(x.s).length).length +
            ' components';
          dnPost(fr, c.s);
        };
      page.addEventListener('click', e => {
        const b = e.target.closest('[data-dn-fig]');
        if (b) {
          const ids = dnGet(c.s),
            id = b.dataset.dnFig;
          dnSet(
            c.s,
            ids.includes(id)
              ? ids.filter(x => x !== id)
              : vs.map(v => v[0]).filter(x => x === id || ids.includes(x))
          );
          refresh();
          return;
        }
        if (e.target.closest('[data-dn-starter]')) {
          dnSet(c.s, dnStarter(c.s));
          refresh();
          return;
        }
        if (e.target.closest('[data-dn-none]')) {
          dnSet(c.s, []);
          refresh();
          return;
        }
        if (e.target.closest('[data-dn-allv]')) {
          dnSet(
            c.s,
            vs.map(v => v[0])
          );
          refresh();
        }
      });
      const on = $('.dn-item.on', page);
      if (on) on.scrollIntoView({ block: 'nearest' });
    }
  };
}
