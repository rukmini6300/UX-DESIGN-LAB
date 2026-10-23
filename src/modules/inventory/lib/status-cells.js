/* =========================================================================
   STATUS AND CELL HELPERS
   Stock status, values and table cells for products, warehouses and users.

   Provides: stockStatus, pStatus, rowStatus, stockValue, pValue, whStock,
   whValue, uomName, CAT_COLORS, thumb, prodCell, whCell, userCell
   ========================================================================= */
'use strict';

function stockStatus(qty, reorder, max) {
  if (qty <= 0) return 'Out of Stock';
  if (qty <= reorder * 0.5) return 'Critical';
  if (qty <= reorder) return 'Low Stock';
  if (max && qty > max) return 'Overstock';
  return 'Healthy';
}
const pStatus = p => stockStatus(productQty(p.id), p.reorder, p.max);
function rowStatus(r) {
  const p = P_BY(r.productId);
  const n = stock.filter(s => s.productId === r.productId).length || 1;
  return stockStatus(r.qty, p.reorder / n, p.max / n);
}
const stockValue = () => sum(stock, s => s.qty * P_BY(s.productId).cost);
const pValue = p => productQty(p.id) * p.cost;
const whStock = wid => stock.filter(s => s.warehouseId === wid && s.qty > 0);
const whValue = wid => sum(whStock(wid), s => s.qty * P_BY(s.productId).cost);
const uomName = c => {
  const u = units.find(u => u.code === c);
  return u ? u.name : c;
};
const CAT_COLORS = {
  C01: ['#B8430E', '#FEF0E8'],
  C02: ['#0E7490', '#ECFDFF'],
  C03: ['#B54708', '#FFFAEB'],
  C04: ['#5925DC', '#F4F3FF'],
  C05: ['#475467', '#F2F4F7'],
  C06: ['#1D4ED8', '#EFF4FF'],
  C07: ['#067647', '#ECFDF3'],
  C08: ['#C11574', '#FDF2FA'],
  C09: ['#1D2939', '#EAECF0']
};
function thumb(p) {
  const c = CAT_COLORS[p.categoryId] || ['#475467', '#F2F4F7'];
  return (
    '<span class="thumb" style="color:' +
    c[0] +
    ';background:' +
    c[1] +
    '">' +
    esc(initials(p.name.replace(/[^A-Za-z ]/g, ''))) +
    '</span>'
  );
}
function prodCell(p, sub) {
  if (!p) return '<span class="muted">Deleted product</span>';
  return (
    '<div class="cell-main">' +
    thumb(p) +
    '<div style="min-width:0"><b><a class="link" style="color:var(--text);font-weight:600" href="#/product-view/' +
    p.id +
    '">' +
    esc(p.name) +
    '</a></b><small>' +
    esc(sub != null ? sub : p.sku) +
    '</small></div></div>'
  );
}
function whCell(w) {
  return w
    ? '<div class="cell-main"><div><b>' + esc(w.name) + '</b><small>' + esc(w.code) + '</small></div></div>'
    : '—';
}
function userCell(u) {
  return (
    '<div class="row" style="gap:8px"><span class="avatar" style="width:24px;height:24px;font-size:10px">' +
    esc(initials(u)) +
    '</span><span class="nowrap">' +
    esc(u) +
    '</span></div>'
  );
}
