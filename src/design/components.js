/* =========================================================================
   COMPONENTS MENU
   Component index and pages; each embeds the component lab and keeps it in
   step with the theme.

   Every component of the UX Design Lab, with all its variants, in the ERP
   shell. Each page embeds the lab page (?embed=1) and keeps it in step
   with the ERP theme and Design lab options.

   Provides: LAB_HOST, COMP_BY, compTotal, DIM_LABEL, compCss, compArch,
   compEmbedState, compEmbedURL, compSel, compToolbar, compToolbarSync,
   compObs, compTimer, compBind, compDims, compPage, compIndex,
   #/components
   ========================================================================= */
'use strict';

/* The UX Design Lab page that renders every component variant: a string in the single-file build, a file otherwise. */
const LAB_HOST = window.KG_COMPONENT_LAB_HTML
  ? URL.createObjectURL(new Blob([window.KG_COMPONENT_LAB_HTML], { type: 'text/html' }))
  : 'src/design/component-lab.html';
const COMP_BY = {};
COMP_GROUPS.forEach(g =>
  g.items.forEach(i => {
    i.group = g.g;
    COMP_BY[i.s] = i;
  })
);
const compTotal = c => sum(c.dims, d => d[1]);
if (!KG_EXPORT) {
  COMP_GROUPS.forEach(g =>
    g.items.forEach(i => ROUTE_INDEX.push([i.n + ' (component)', 'components/' + i.s]))
  );
  ROUTE_INDEX.push(['Components', 'components']);
}
const DIM_LABEL = {
  variant: 'Variant',
  layout: 'Layout',
  icon: 'Icon',
  state: 'State',
  content: 'Content',
  scheme: 'Scheme'
};
/* ERP design tokens re-expressed as the lab's own variables, so brand, accent, font, radius, elevation, icon stroke and motion carry into every variant */
function compCss(kag) {
  const cs = getComputedStyle(document.documentElement),
    g = n => cs.getPropertyValue(n).trim();
  const M = {
    '--pri': '--primary',
    '--pri-h': '--primary-hover',
    '--pri-p': '--primary-hover',
    '--pri-sub': '--primary-soft',
    '--pri-txt': '--primary-text',
    '--on-pri': '--on-primary',
    '--font': '--font',
    '--mono': '--mono',
    '--r-s': '--r-sm',
    '--r': '--r',
    '--r-l': '--r-md',
    '--sh-1': '--shadow-sm',
    '--sh-2': '--shadow-md',
    '--sh-3': '--shadow-lg',
    '--ic-sw': '--ic-sw',
    '--dur': '--lab-dur',
    '--ease': '--lab-ease'
  };
  if (kag)
    Object.assign(M, {
      '--bg': '--surface',
      '--canvas': '--bg',
      '--sunk': '--surface-sunken',
      '--raised': '--surface',
      '--fg': '--text',
      '--fg2': '--text-muted',
      '--fg3': '--text-subtle',
      '--bd': '--border',
      '--bd-strong': '--border-strong',
      '--fill': '--surface-secondary',
      '--fill-h': '--surface-hover',
      '--hov': '--surface-hover',
      '--ok': '--success',
      '--ok-bg': '--success-soft',
      '--err': '--danger',
      '--err-bg': '--danger-soft'
    });
  let b = '';
  for (const k in M) {
    const v = g(M[k]);
    if (v) b += k + ':' + v + ';';
  }
  return (
    'html:root [class*="sys-"][class*="sys-"][class*="sys-"]{' +
    b +
    '}html:root body{background:var(--canvas,var(--bg))}'
  );
}
let compArch = store('kagami-comp-arch') === '1';
function compEmbedState() {
  const S = LABX.state,
    th = LABX.themeKey(),
    kag = S.lang === 'kagami';
  return {
    type: 'kagami-lab',
    theme: th,
    lang: kag ? 'f' : S.lang,
    size: S.size,
    density: document.documentElement.getAttribute('data-density') || 'comfortable',
    css: compCss(kag),
    arch: false
  };
}
function compEmbedURL(slug) {
  const s = compEmbedState();
  return (
    LAB_HOST +
    '#embed=1&c=' +
    slug +
    '&theme=' +
    s.theme +
    '&lang=' +
    s.lang +
    '&size=' +
    s.size +
    '&density=' +
    s.density
  );
}
function compSel(k, label, list, cur) {
  return (
    '<label class="cmp-ctl"><span>' +
    esc(label) +
    '</span><select class="select select-sm" data-cmp="' +
    k +
    '" aria-label="' +
    esc(label) +
    '">' +
    list
      .map(
        o =>
          '<option value="' +
          o[0] +
          '"' +
          (String(o[0]) === String(cur) ? ' selected' : '') +
          '>' +
          esc(o[1]) +
          '</option>'
      )
      .join('') +
    '</select></label>'
  );
}
/* No selection panel: theme, language, size, density and the other options come from the user's Design lab settings */
function compToolbar() {
  return '';
}
function compToolbarSync(page) {
  $$('[data-cmp]', page).forEach(s => {
    const v = s.dataset.cmp === 'arch' ? (compArch ? '1' : '0') : String(labCur(s.dataset.cmp));
    if (s.value !== v) s.value = v;
  });
}
let compObs = null,
  compTimer = 0;
function compBind(page) {
  if (compObs) {
    compObs.disconnect();
    compObs = null;
  }
  page.addEventListener('change', e => {
    const s = e.target.closest('[data-cmp]');
    if (!s) return;
    const k = s.dataset.cmp,
      v = s.value;
    if (k === 'arch') {
      compArch = v === '1';
      store('kagami-comp-arch', v);
      const fr = $('.cmp-frame', page);
      try {
        fr.contentWindow.postMessage(compEmbedState(), '*');
      } catch (e) {}
    } else if (k === 'mode') setMode(v);
    else if (k === 'density') applyDensity(v);
    else LABX.set(k, v);
    compToolbarSync(page);
  });
  const dk = $('[data-cmp-dock]', page);
  if (dk) dk.onclick = () => setLabDock(true);
  const fr = $('.cmp-frame', page),
    post = () => {
      try {
        fr && fr.contentWindow && fr.contentWindow.postMessage(compEmbedState(), '*');
      } catch (e) {}
    };
  if (fr)
    fr.addEventListener('load', () => {
      post();
      const ld = $('.cmp-load', page);
      if (ld) ld.hidden = true;
    });
  compObs = new MutationObserver(() => {
    if (!document.body.contains(page)) {
      compObs.disconnect();
      compObs = null;
      return;
    }
    clearTimeout(compTimer);
    compTimer = setTimeout(() => {
      compToolbarSync(page);
      post();
    }, 60);
  });
  compObs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-lang', 'data-size', 'data-density']
  });
}
function compDims(c) {
  return (
    '<div class="cmp-dims">' +
    c.dims
      .map(
        d =>
          '<div class="cmp-dim"><div class="cmp-dim-h"><b>' +
          esc(DIM_LABEL[d[0]] || d[0]) +
          '</b><span class="badge">' +
          d[1] +
          '</span></div><div class="cmp-chips">' +
          d[2]
            .split(/, (?![^(]*\))/)
            .map(v => '<span class="cmp-chip">' + esc(v) + '</span>')
            .join('') +
          '</div></div>'
      )
      .join('') +
    '</div>'
  );
}
function compPage(c) {
  const flat = COMP_GROUPS.reduce((a, g) => a.concat(g.items), []),
    i = flat.indexOf(c),
    prev = flat[i - 1],
    next = flat[i + 1];
  return {
    title: c.n,
    nav: 'components/' + c.s,
    crumbs: [['Components', 'components'], [c.group], [c.n]],
    sub:
      esc(c.d) +
      ' <span class="muted">· ' +
      compTotal(c) +
      ' variations in ' +
      c.dims.length +
      ' dimension' +
      (c.dims.length === 1 ? '' : 's') +
      '.</span>',
    actions:
      (prev
        ? '<a class="btn btn-sm" href="#/components/' +
          prev.s +
          '">' +
          icon('chevLeft', 16) +
          '<span>' +
          esc(prev.n) +
          '</span></a>'
        : '') +
      (next
        ? '<a class="btn btn-sm" href="#/components/' +
          next.s +
          '"><span>' +
          esc(next.n) +
          '</span>' +
          icon('chevRight', 16) +
          '</a>'
        : ''),
    body:
      compToolbar() +
      '<div class="cmp-stage"><div class="cmp-load">' +
      icon('refresh', 16) +
      '<span>Loading ' +
      esc(c.n) +
      ' from the UX Design Lab…</span></div><iframe class="cmp-frame" title="' +
      esc(c.n) +
      ' variants" src="' +
      compEmbedURL(c.s) +
      '"></iframe></div>',
    mount(page) {
      compBind(page);
    }
  };
}
function compIndex() {
  const all = COMP_GROUPS.reduce((a, g) => a.concat(g.items), []);
  return {
    title: 'Components',
    nav: 'components',
    crumbs: [['Components']],
    sub:
      all.length +
      ' components, ' +
      sum(all, compTotal) +
      ' variations. Pick one to see every variant using your design lab settings.',
    body:
      compToolbar() +
      COMP_GROUPS.map(
        g =>
          '<h2 class="cmp-gh">' +
          esc(g.g) +
          ' <span class="badge">' +
          g.items.length +
          '</span></h2><div class="cmp-grid">' +
          g.items
            .map(
              i =>
                '<a class="card cmp-card" href="#/components/' +
                i.s +
                '"><b>' +
                esc(i.n) +
                '</b><span class="muted">' +
                esc(i.d) +
                '</span><span class="cmp-meta"><span class="badge b-info">' +
                compTotal(i) +
                ' variations</span>' +
                i.dims
                  .map(d => '<span class="badge">' + esc(DIM_LABEL[d[0]] || d[0]) + ' ' + d[1] + '</span>')
                  .join('') +
                '</span></a>'
            )
            .join('') +
          '</div>'
      ).join(''),
    mount(page) {
      compBind(page);
    }
  };
}
ROUTES.components = slug => {
  if (!slug) return compIndex();
  const c = COMP_BY[slug];
  return c ? compPage(c) : ROUTES['not-found']();
};
