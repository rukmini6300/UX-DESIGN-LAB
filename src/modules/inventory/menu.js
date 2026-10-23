/* =========================================================================
   MENU, SEARCH AND QUICK CREATE
   The inventory menu sections, searchable pages, sidebar footer, record
   search and Create menu.

   Merged into the design system menu while the module is on.

   Provides: INV_NAV, INV_PAGES, sidebarFoot, searchInventory,
   quickCreateItems
   ========================================================================= */
'use strict';

const INV_NAV = [
  { label: 'Dashboard', icon: 'home', route: 'dashboard' },
  {
    section: true,
    label: 'Inventory',
    icon: 'box',
    id: 'sec-inv',
    children: [
      { label: 'Overview', icon: 'grid', route: 'inventory' },
      { label: 'Inventory Workflow', icon: 'flow', route: 'workflow' },
      {
        label: 'Products',
        icon: 'tag',
        id: 'g-prod',
        children: [
          ['Product List', 'products'],
          ['Create Product', 'product-create'],
          ['Product Categories', 'categories'],
          ['Product Units', 'units']
        ]
      },
      {
        label: 'Warehouses',
        icon: 'warehouse',
        id: 'g-wh',
        children: [
          ['Warehouse List', 'warehouses'],
          ['Storage Locations', 'locations'],
          ['Warehouse Stock', 'warehouse-stock']
        ]
      },
      {
        label: 'Stock Management',
        icon: 'layers',
        id: 'g-stock',
        children: [
          ['Stock Overview', 'stock'],
          ['Stock Ledger', 'ledger'],
          ['Stock Adjustment', 'stock-adjustment'],
          ['Stock Transfer', 'stock-transfer'],
          ['Stock Count', 'stock-count']
        ]
      },
      {
        label: 'Goods Receipt',
        icon: 'receive',
        id: 'g-grn',
        children: [
          ['GRN List', 'grn'],
          ['Create GRN', 'grn-create']
        ]
      },
      {
        label: 'Goods Issue',
        icon: 'issue',
        id: 'g-gi',
        children: [
          ['Issue List', 'goods-issue'],
          ['Create Issue', 'issue-create']
        ]
      },
      {
        label: 'Inventory Planning',
        icon: 'target',
        id: 'g-plan',
        children: [
          ['Reorder Levels', 'reorder'],
          ['Low Stock', 'low-stock'],
          ['Expiry Tracking', 'expiry']
        ]
      },
      {
        label: 'Reports',
        icon: 'chart',
        id: 'g-rep',
        children: [
          ['Inventory Valuation', 'reports/valuation'],
          ['Stock Movement', 'reports/movement'],
          ['Stock Aging', 'reports/aging'],
          ['Warehouse Report', 'reports/warehouse']
        ]
      },
      { label: 'Audit Log', icon: 'shield', route: 'audit' }
    ]
  },
  { sep: true },
  { label: 'Purchasing', icon: 'cart', route: 'purchasing' },
  { label: 'Sales', icon: 'trending', route: 'sales' }
];
const INV_PAGES = [
  ['Inventory Dashboard', 'inventory'],
  ['Inventory Workflow', 'workflow'],
  ['Product List', 'products'],
  ['Create Product', 'product-create'],
  ['Product Categories', 'categories'],
  ['Product Units', 'units'],
  ['Warehouse List', 'warehouses'],
  ['Storage Locations', 'locations'],
  ['Warehouse Stock', 'warehouse-stock'],
  ['Stock Overview', 'stock'],
  ['Stock Ledger', 'ledger'],
  ['Stock Adjustment', 'stock-adjustment'],
  ['Stock Transfer', 'stock-transfer'],
  ['Stock Count', 'stock-count'],
  ['GRN List', 'grn'],
  ['Create GRN', 'grn-create'],
  ['Goods Issue List', 'goods-issue'],
  ['Create Goods Issue', 'issue-create'],
  ['Reorder Levels', 'reorder'],
  ['Low Stock', 'low-stock'],
  ['Expiry Tracking', 'expiry'],
  ['Inventory Reports', 'reports/valuation'],
  ['Audit Log', 'audit'],
  ['Purchase Orders', 'purchasing'],
  ['Sales Orders', 'sales'],
  ['My Profile', 'profile']
];
function sidebarFoot() {
  const used = sum(stock, s => s.qty),
    cap = sum(
      warehouses.filter(w => w.status === 'Active'),
      w => w.capacity
    );
  const pct = Math.round((used / cap) * 100);
  return (
    '<div class="sb-foot"><div class="sb-card"><b>Network capacity</b>' +
    fmtN(used) +
    ' units across ' +
    warehouses.filter(w => w.status === 'Active').length +
    ' active sites<div class="bar ' +
    (pct > 85 ? 'd' : pct > 70 ? 'w' : '') +
    '"><i style="width:' +
    pct +
    '%"></i></div><div class="row between mt-8"><span>' +
    pct +
    '% utilized</span><a class="link" href="#/warehouses">View sites</a></div></div></div>'
  );
}
function searchInventory(q) {
  const res = [];
  const add = (group, items) => {
    if (items.length) res.push([group, items]);
  };
  add(
    'Products',
    products
      .filter(p => (p.name + ' ' + p.sku + ' ' + p.barcode + ' ' + p.brand).toLowerCase().includes(q))
      .map(p => ({ icon: 'tag', label: p.name, sub: p.sku, route: 'product-view/' + p.id }))
  );
  add(
    'Warehouses',
    warehouses
      .filter(w => (w.name + ' ' + w.code + ' ' + w.city).toLowerCase().includes(q))
      .map(w => ({ icon: 'warehouse', label: w.name, sub: w.code, route: 'warehouse-view/' + w.id }))
  );
  const docs = [].concat(
    grns.map(g => ({
      icon: 'receive',
      label: g.no,
      sub: 'Goods receipt · ' + g.status,
      route: 'grn-view/' + g.id,
      s: g.no + ' ' + g.supplier
    })),
    stockTransfers.map(t => ({
      icon: 'transfer',
      label: t.no,
      sub: 'Transfer · ' + t.status,
      route: 'transfer-view/' + t.id,
      s: t.no
    })),
    stockAdjustments.map(a => ({
      icon: 'sliders',
      label: a.no,
      sub: 'Adjustment · ' + a.status,
      route: 'adjustment-view/' + a.id,
      s: a.no + ' ' + a.type
    })),
    goodsIssues.map(g => ({
      icon: 'issue',
      label: g.no,
      sub: 'Goods issue · ' + g.status,
      route: 'issue-view/' + g.id,
      s: g.no + ' ' + g.department
    })),
    purchaseOrders.map(p => ({
      icon: 'cart',
      label: p.no,
      sub: 'Purchase order · ' + p.status,
      route: 'purchasing?q=' + p.no,
      s: p.no + ' ' + p.supplier
    }))
  );
  add(
    'Documents',
    docs.filter(d => d.s.toLowerCase().includes(q))
  );
  return res;
}
function quickCreateItems() {
  return [
    { label: 'Product', icon: 'tag', onClick: () => navigate('product-create') },
    { label: 'Goods receipt', icon: 'receive', onClick: () => navigate('grn-create') },
    { label: 'Stock transfer', icon: 'transfer', onClick: () => navigate('transfer-create') },
    { label: 'Stock adjustment', icon: 'sliders', onClick: () => navigate('adjustment-create') },
    { label: 'Goods issue', icon: 'issue', onClick: () => navigate('issue-create') },
    '-',
    { label: 'Warehouse', icon: 'warehouse', onClick: () => navigate('warehouse-create') },
    { label: 'Category', icon: 'folder', onClick: () => categoryModal() }
  ];
}
