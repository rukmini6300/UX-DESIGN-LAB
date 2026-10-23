/* =========================================================================
   REGISTER
   Hands the module to the shell (shell/module-loader.js,
   registerInventory).
   ========================================================================= */
'use strict';

registerInventory({
  nav: INV_NAV,
  pages: INV_PAGES,
  routes: Object.keys(ROUTES).filter(k => !ROUTES_BEFORE.has(k)),
  notifications,
  quickCreate: quickCreateItems,
  search: searchInventory,
  sidebarFoot,
  logAudit
});
