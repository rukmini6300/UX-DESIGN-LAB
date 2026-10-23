/* =========================================================================
   INIT
   Starts the app: header, lab dock, device preview, layout, then the first
   route (after the inventory module when it is on).
   ========================================================================= */
'use strict';

(function init() {
  initHeader();
  initLabDock();
  initDevice();
  applyNavCollapse();
  applyDensity(store('kagami-density') || 'comfortable');
  syncLab();
  window.addEventListener('resize', () => {
    if ((innerWidth < 768 || isHNav()) && $('#app').classList.contains('collapsed'))
      $('#app').classList.remove('collapsed');
    if (innerWidth >= 768) setMobileNav(false);
  });
  const start = () => {
    if (!location.hash || location.hash === '#' || location.hash === '#/')
      history.replaceState(null, '', '#/' + homeRoute());
    syncInventoryUI();
    renderRoute();
    dnServeHandOff(); // a workflow download requested by index.html (design/export.js)
  };
  if (store(INV_KEY) === 'on')
    loadInventory()
      .catch(err => {
        console.error(err);
        store(INV_KEY, 'off');
      })
      .then(start);
  else start();
})();
