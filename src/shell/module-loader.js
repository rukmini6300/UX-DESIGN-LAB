/* =========================================================================
   MODULE LOADER
   Loads the inventory module on demand and connects it to the shell: menu
   sections, routes, search, notifications, quick create. Holds the
   Inventory workflow toggle.

   Provides: INV_KEY, invMod, invLoading, invOn, homeRoute, navList,
   notifList, pageIndex, auditLog, registerInventory, loadInventory,
   setInventory, syncInventoryUI, invOffPage
   ========================================================================= */
'use strict';

/** localStorage key that remembers whether the Inventory workflow toggle is on. */
const INV_KEY = 'kagami-inventory';

/** The registered inventory module (see registerInventory), or null until it has loaded. */
let invMod = null;
/** The pending load, so several callers share one download. */
let invLoading = null;

/** True when the module is loaded and the toggle is on. */
const invOn = () => !!invMod && store(INV_KEY) === 'on';

/** Route the logo, breadcrumbs and empty states point at. */
const homeRoute = () => (invOn() ? 'dashboard' : 'components');

/** Menu entries: the module's sections first, then the design system's own. */
const navList = () => (invOn() ? invMod.nav.concat(NAV) : NAV);

/** Header notifications (only the module produces any). */
const notifList = () => (invOn() ? invMod.notifications : []);

/** Pages offered by global search. */
const pageIndex = () => (invOn() ? invMod.pages.concat(ROUTE_INDEX) : ROUTE_INDEX);

/** Writes to the module's audit log when it is loaded (sign-in and sign-out events). */
function auditLog(...args) {
  if (invMod) invMod.logAudit(...args);
}

/**
 * Called once by the module's last file (modules/inventory/register.js).
 * @param {{nav:Array, pages:Array, routes:string[], notifications:Array, quickCreate:Function,
 *          search:Function, sidebarFoot:Function, logAudit:Function}} m
 */
function registerInventory(m) {
  m.routeSet = new Set(m.routes);
  invMod = m;
}

/**
 * Loads the inventory module once.
 * Single-file build: the module ships inside the page as an inert <script type="text/plain"> block.
 * Multi-file build: each file in INVENTORY_FILES (modules/inventory/manifest.js) is loaded in order.
 */
function loadInventory() {
  if (invMod) return Promise.resolve(invMod);
  const inline = document.getElementById('kg-inventory-module');
  if (inline) {
    runInlineScript(inline.textContent);
    return invMod
      ? Promise.resolve(invMod)
      : Promise.reject(new Error('The built-in inventory module did not register'));
  }
  if (!invLoading) {
    invLoading = INVENTORY_FILES.reduce((chain, src) => chain.then(() => loadScript(src)), Promise.resolve())
      .then(() => {
        if (!invMod) throw new Error('The inventory module did not register');
        return invMod;
      })
      .catch(err => {
        invLoading = null;
        throw err;
      });
  }
  return invLoading;
}

/**
 * Turns the inventory workflow on or off.
 * @param {boolean} on
 * @param {string} [route] page to open after turning on (default: the dashboard)
 */
function setInventory(on, route) {
  if (!on) {
    store(INV_KEY, 'off');
    syncInventoryUI();
    if (invMod && currentRoute && invMod.routeSet.has(currentRoute.name)) navigate(homeRoute());
    else renderRoute();
    toast(
      'info',
      'Inventory workflow turned off',
      'Showing the design system only. Inventory data is kept for this session.'
    );
    return Promise.resolve();
  }
  const button = $('#invToggle');
  button.disabled = true;
  return loadInventory()
    .then(() => {
      store(INV_KEY, 'on');
      syncInventoryUI();
      navigate(route || 'dashboard');
      toast('success', 'Inventory workflow turned on', 'Inventory sections are added to the menu.');
    })
    .catch(err => {
      console.error(err);
      toast(
        'error',
        'Inventory workflow unavailable',
        err.message + '. Keep the src/modules/inventory folder next to this page.'
      );
    })
    .finally(() => {
      button.disabled = false;
    });
}

/** Updates the header (toggle, Create button, search hint, brand) to the module state. */
function syncInventoryUI() {
  const on = invOn();
  $('#invToggle').setAttribute('aria-checked', on);
  $('#quickCreateBtn').style.display = on ? '' : 'none';
  $('#globalSearch').placeholder = on ? 'Search SKUs, products, documents' : 'Search components and pages';
  $('.brand-name').innerHTML = KG_EXPORT
    ? esc(KG_EXPORT.name) + ' <span>Inventory</span>'
    : ' ERP <span>' + (on ? 'Inventory' : 'Design System') + '</span>';
  $('.brand a').setAttribute('href', '#/' + homeRoute());
  renderNotifBadge();
}

/** Shown for an inventory page while the workflow is off. */
function invOffPage() {
  return {
    title: 'Inventory workflow is off',
    crumbs: [['Inventory workflow']],
    body: card(
      '',
      '<div class="empty"><div class="empty-ico">' +
        icon('box', 22) +
        '</div><h4>This page belongs to the inventory workflow</h4>' +
        '<p>Turn on the inventory workflow to open products, warehouses, stock movements and reports.</p>' +
        '<button class="btn btn-primary" data-inv-on="here">Turn on inventory workflow</button></div>'
    )
  };
}

/* Any [data-inv-on] button turns the workflow on; "here" keeps the current page. */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-inv-on]');
  if (t) setInventory(true, t.dataset.invOn === 'here' ? location.hash.replace(/^#\/?/, '') : 'dashboard');
});

$('#invToggle').onclick = () => setInventory(!invOn());
