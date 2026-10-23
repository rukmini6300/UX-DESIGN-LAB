/* =========================================================================
   INVENTORY MODULE MANIFEST
   Load order of the module files. The multi-file build loads them in this
   order; build.js inlines them in this order.

   Provides: INVENTORY_FILES
   ========================================================================= */
'use strict';

const INVENTORY_FILES = [
  'src/modules/inventory/index.js',
  'src/modules/inventory/data/mock-database.js',
  'src/modules/inventory/data/seed.js',
  'src/modules/inventory/lib/status-cells.js',
  'src/modules/inventory/lib/document-flows.js',
  'src/modules/inventory/menu.js',
  'src/modules/inventory/lib/analytics.js',
  'src/modules/inventory/pages/dashboard.js',
  'src/modules/inventory/pages/workflow.js',
  'src/modules/inventory/pages/products.js',
  'src/modules/inventory/pages/warehouses.js',
  'src/modules/inventory/pages/stock.js',
  'src/modules/inventory/lib/line-editor.js',
  'src/modules/inventory/pages/transfers.js',
  'src/modules/inventory/pages/adjustments.js',
  'src/modules/inventory/pages/stock-count.js',
  'src/modules/inventory/pages/goods-receipt.js',
  'src/modules/inventory/pages/goods-issue.js',
  'src/modules/inventory/pages/planning.js',
  'src/modules/inventory/pages/reports.js',
  'src/modules/inventory/pages/audit.js',
  'src/modules/inventory/pages/purchasing-sales.js',
  'src/modules/inventory/pages/profile.js',
  'src/modules/inventory/register.js'
];
