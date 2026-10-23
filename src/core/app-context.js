/* =========================================================================
   APP CONTEXT
   Build mode flags shared by every file.

   Provides: KG_BUNDLED, KG_SRC, KG_EXPORT
   ========================================================================= */
'use strict';

/** True in the single-file build (dist/): build.js ships the inventory module inside the page as a data block. */
const KG_BUNDLED = !!document.getElementById('kg-inventory-module');

/** The page markup as it is now, without the scripts and styles browser extensions add to every page. */
function kgPageSource() {
  const root = document.documentElement.cloneNode(true);
  root.querySelectorAll('[src*="-extension://"],[href*="-extension://"]').forEach(node => node.remove());
  return '<!DOCTYPE html>\n' + root.outerHTML;
}

/** The single-file page as authored, captured before anything renders: the workflow download copies it. Null in the multi-file build. */
const KG_SRC = KG_BUNDLED ? kgPageSource() : null;
/** Set inside a downloaded workflow app (see design/export.js, dnBuildApp). */
const KG_EXPORT = window.KG_EXPORT || null;
