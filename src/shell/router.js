/* =========================================================================
   ROUTER
   Hash routes (#/name/param?query), page rendering, breadcrumbs and the
   page building blocks btn, card and mountTable.

   Provides: ROUTES, ROUTE_INDEX, parseHash, navigate, currentRoute,
   renderRoute, btn, card, mountTable, pageError, #/not-found
   ========================================================================= */
'use strict';

const ROUTES = {};
const ROUTE_INDEX = [
  ['All components', 'components'],
  ['Design system builder', 'design'],
  ['Styleguide', 'design/styleguide'],
  ['Settings', 'settings']
];
if (KG_EXPORT) {
  NAV.splice(0, NAV.length, { label: 'Styleguide', icon: 'book', route: 'design/styleguide' });
  ROUTE_INDEX.splice(0, ROUTE_INDEX.length, ['Styleguide', 'design/styleguide']);
}
function parseHash() {
  const h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  const qi = h.indexOf('?');
  const path = qi > -1 ? h.slice(0, qi) : h;
  const qs = qi > -1 ? h.slice(qi + 1) : '';
  const parts = path.split('/');
  const query = {};
  new URLSearchParams(qs).forEach((v, k) => (query[k] = v));
  return { name: parts[0] || 'inventory', param: parts.slice(1).join('/'), query };
}
function navigate(r) {
  const target = '#/' + r;
  if (location.hash === target) renderRoute();
  else location.hash = target;
}
let currentRoute = null;
function renderRoute() {
  closeMenu();
  while (modalStack.length) modalStack[modalStack.length - 1].close();
  const { name, param, query } = parseHash();
  const R_ =
    !invOn() && invMod && invMod.routeSet.has(name) ? invOffPage : ROUTES[name] || ROUTES['not-found'];
  let pg;
  try {
    pg = R_(param, query);
  } catch (err) {
    console.error(err);
    pg = pageError(err);
  }
  currentRoute = { name, param, query };
  activeNav = pg.nav || name + (param && name === 'reports' ? '/' + param : '');
  const page = $('#page');
  page.innerHTML = '';
  const crumbs = [['Home', homeRoute()]].concat(pg.crumbs || []);
  page.append(
    el(
      '<nav class="crumbs" aria-label="Breadcrumb">' +
        crumbs
          .map((c, i) =>
            i === crumbs.length - 1
              ? '<span class="cur" aria-current="page">' + esc(c[0]) + '</span>'
              : (c[1] ? '<a href="#/' + c[1] + '">' + esc(c[0]) + '</a>' : '<span>' + esc(c[0]) + '</span>') +
                '<span class="sep">/</span>'
          )
          .join('') +
        '</nav>'
    )
  );
  page.append(
    el(
      '<div class="page-head"><div style="min-width:0"><h1 class="page-title">' +
        (pg.titleHTML || esc(pg.title)) +
        '</h1>' +
        (pg.sub ? '<p class="page-sub">' + pg.sub + '</p>' : '') +
        '</div>' +
        (pg.actions ? '<div class="page-actions">' + pg.actions + '</div>' : '') +
        '</div>'
    )
  );
  const body = document.createElement('div');
  body.className = 'page-body';
  if (typeof pg.body === 'string') body.innerHTML = pg.body;
  else if (pg.body) body.append(pg.body);
  page.append(body);
  document.title = (pg.title || 'Kagami ERP') + ' · ' + (KG_EXPORT ? KG_EXPORT.name : 'Kagami ERP');
  page.classList.remove('fl-fit');
  if (pg.mount) pg.mount(page);
  if (FORM_ROUTES.test(name)) {
    try {
      formLayoutInit(page);
    } catch (err) {
      console.error(err);
    }
  }
  renderSidebar();
  $('#main').scrollTop = 0;
  if (innerWidth < 768) setMobileNav(false);
}
window.addEventListener('hashchange', renderRoute);
function btn(label, ic, variant, attrs) {
  return (
    '<button class="btn ' +
    (variant
      ? variant
          .split(' ')
          .map(v => 'btn-' + v)
          .join(' ')
      : '') +
    '" ' +
    (attrs || '') +
    '>' +
    (ic ? icon(ic, 16) : '') +
    (label ? '<span>' + esc(label) + '</span>' : '') +
    '</button>'
  );
}
function card(title, body, o) {
  o = o || {};
  return (
    '<section class="card ' +
    (o.cls || '') +
    '"' +
    (o.id ? ' id="' + o.id + '"' : '') +
    '>' +
    (title
      ? '<div class="card-head"><div><h2 class="card-title">' +
        esc(title) +
        '</h2>' +
        (o.sub ? '<div class="card-sub">' + o.sub + '</div>' : '') +
        '</div>' +
        (o.actions ? '<div class="row">' + o.actions + '</div>' : '') +
        '</div>'
      : '') +
    '<div class="card-body' +
    (o.tight ? ' tight' : '') +
    '">' +
    body +
    '</div></section>'
  );
}
function mountTable(page, sel, o) {
  const t = DataTable(o);
  const host = $(sel, page);
  host.innerHTML = '';
  host.append(t.el);
  return t;
}
function pageError(err) {
  return {
    title: 'Something went wrong',
    crumbs: [['Error']],
    body: card(
      '',
      `<div class="empty"><div class="empty-ico">${icon('xCircle', 22)}</div><h4>This page couldn’t be displayed</h4><p>${esc((err && err.message) || 'Unexpected error')}. Go back to the home page and try again.</p><button class="btn btn-primary" data-go="${homeRoute()}">Go to home</button></div>`
    )
  };
}
ROUTES['not-found'] = () => ({
  title: 'Page not found',
  crumbs: [['Not found']],
  body: card(
    '',
    '<div class="empty"><div class="empty-ico">' +
      icon('search', 22) +
      '</div><h4>This page doesn’t exist</h4><p>The link may be outdated, or the record may have been deleted.</p><div class="row" style="gap:8px;justify-content:center"><button class="btn btn-primary" data-go="' +
      homeRoute() +
      '">Go to home</button>' +
      (invOn() ? '' : '<button class="btn" data-inv-on="here">Turn on inventory workflow</button>') +
      '</div></div>'
  )
});
