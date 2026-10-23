/* =========================================================================
   HTML IMPORT · MANIFEST
   The only file of this module the shell loads up front. It declares the
   module's files (load order) and its entry points: the "Import HTML"
   menu item and the #/import route. Everything else loads the first time
   the page is opened (see shell/feature-modules.js).

   Provides: HTML_IMPORT_FILES
   ========================================================================= */
'use strict';

const HTML_IMPORT_FILES = [
  'src/modules/html-import/sample.js',
  'src/modules/html-import/converter.js',
  'src/modules/html-import/stylesheet.js',
  'src/modules/html-import/document.js',
  'src/modules/html-import/ui-styles.js',
  'src/modules/html-import/side-panel.js',
  'src/modules/html-import/page.js',
  'src/modules/html-import/register.js'
];

defineFeatureModule('html-import', HTML_IMPORT_FILES);

ROUTES.import = lazyRoute('import', 'html-import', 'Import HTML');

// A downloaded workflow app shows only inventory and its styleguide.
if (!KG_EXPORT) {
  const after = NAV.findIndex(item => item.route === 'design');
  NAV.splice(after + 1, 0, { label: 'Import HTML', icon: 'inbox', route: 'import' });
  ROUTE_INDEX.push(['Import HTML', 'import']);
}
