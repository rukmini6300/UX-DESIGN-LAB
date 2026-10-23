/* =========================================================================
   HTML IMPORT · REGISTER
   Hands the module to the shell (shell/feature-modules.js). The api lets
   other code convert a page or open the preview without knowing the
   module's internals.

   Provides: (registers 'html-import')
   ========================================================================= */
'use strict';

registerFeatureModule('html-import', {
  /** convertHtml(source, options) -> { title, html, report, warnings } */
  convert: convertHtml,
  /** buildDocument(result, theme) -> complete HTML page in the current styleguide */
  buildDocument: hiBuildDocument,
  /** importText(fileName, html) converts a page and opens the preview */
  importText: hiLoad,
  openPreview: openImportPanel,
  closePreview: closeImportPanel
});
