/* =========================================================================
   ANALYTICS AND WORKFLOW MODEL
   Value and quantity history, aging, outflow, KPIs and the live workflow
   stage model.

   Provides: valueAt, qtyAt, weeks, shortD, AGE_BUCKETS, ageIdx, agingRows,
   outflow, onOrder, activeWh, whOptions, prodOptions, kpi, deltaHTML,
   workflowModel, WF_LABEL, flowListHTML, flowStripHTML, legendWF
   ========================================================================= */
'use strict';

function valueAt(date) {
  const d = toD(date);
  return (
    stockValue() -
    sum(
      ledger.filter(e => e.date > d),
      e => e.value
    )
  );
}
function qtyAt(pid, date, wid) {
  const d = toD(date);
  const cur = wid ? whQty(pid, wid) : productQty(pid);
  return (
    cur -
    sum(
      ledger.filter(e => e.productId === pid && (!wid || e.warehouseId === wid) && e.date > d),
      e => e.inQty - e.outQty
    )
  );
}
function weeks(n) {
  const out = [];
  const end = new Date(NOW());
  end.setHours(23, 59, 59, 0);
  for (let i = n - 1; i >= 0; i--) out.push(addDays(end, -7 * i));
  return out;
}
const shortD = d => String(toD(d).getDate()).padStart(2, '0') + ' ' + MON[toD(d).getMonth()];
const AGE_BUCKETS = ['0–30 days', '31–60 days', '61–90 days', '91–180 days', '180+ days'];
const ageIdx = a => (a <= 30 ? 0 : a <= 60 ? 1 : a <= 90 ? 2 : a <= 180 ? 3 : 4);
function agingRows() {
  const out = [];
  const now = NOW();
  stock.forEach(r => {
    if (r.qty <= 0) return;
    let rem = r.qty;
    const ins = ledger
      .filter(e => e.productId === r.productId && e.warehouseId === r.warehouseId && e.inQty > 0)
      .sort((a, b) => b.date - a.date);
    const b = [0, 0, 0, 0, 0];
    let oldest = null;
    for (const e of ins) {
      if (rem <= 0) break;
      const t = Math.min(e.inQty, rem);
      rem -= t;
      b[ageIdx(daysBetween(e.date, now))] += t;
      oldest = e.date;
    }
    if (rem > 0) b[4] += rem;
    out.push({ row: r, b, oldest, age: oldest ? daysBetween(oldest, now) : 999 });
  });
  return out;
}
function outflow(pid, days, wid) {
  const from = addDays(NOW(), -days);
  return sum(
    ledger.filter(
      e =>
        e.productId === pid &&
        (!wid || e.warehouseId === wid) &&
        e.date >= from &&
        (e.type === 'Sales' || e.type === 'Goods Issue')
    ),
    e => e.outQty
  );
}
const onOrder = pid =>
  sum(
    purchaseOrders.filter(p => p.status === 'Open' || p.status === 'Partially Received'),
    po =>
      sum(
        po.items.filter(i => i.productId === pid),
        i => Math.max(0, i.qty - i.received)
      )
  );
const activeWh = () => warehouses.filter(w => w.status === 'Active');
const whOptions = all => (all ? warehouses : activeWh()).map(w => [w.id, w.name + ' (' + w.code + ')']);
const prodOptions = list =>
  (list || products.filter(p => p.status !== 'Inactive')).map(p => [p.id, p.name + ' — ' + p.sku]);
function kpi(label, value, ic, tone, foot, route) {
  return (
    '<div class="card kpi" ' +
    (route ? 'data-go="' + route + '" role="link" tabindex="0"' : '') +
    '><div class="kpi-top"><span class="kpi-label">' +
    esc(label) +
    '</span><span class="kpi-ico t-' +
    tone +
    '">' +
    icon(ic, 17) +
    '</span></div><div class="kpi-value">' +
    value +
    '</div><div class="kpi-foot">' +
    foot +
    '</div></div>'
  );
}
function deltaHTML(p, invert) {
  const up = p >= 0;
  const good = invert ? !up : up;
  return (
    '<span class="delta ' +
    (good ? 'up' : 'down') +
    '">' +
    icon(up ? 'arrowUp' : 'arrowDown', 12) +
    Math.abs(p).toFixed(1) +
    '%</span>'
  );
}

/* =========================================================
   WORKFLOW MODEL
   ========================================================= */
function workflowModel() {
  const now = NOW();
  const act = products.filter(p => p.status === 'Active');
  const openPO = purchaseOrders.filter(p => p.status === 'Open' || p.status === 'Partially Received').length;
  const draftG = grns.filter(g => g.status === 'Draft').length,
    qc = grns.filter(g => g.status === 'Pending QC').length,
    put = grns.filter(g => g.status === 'Accepted').length;
  const rej = sum(
    grns.filter(g => daysBetween(g.date, now) <= 30 && g.status !== 'Draft'),
    g => sum(g.items, i => i.rejected)
  );
  const avail = sum(stock, s => Math.max(0, s.qty - s.reserved));
  const outs = act.filter(p => productQty(p.id) <= 0).length;
  const trf = stockTransfers.filter(t => ['Submitted', 'Approved', 'In Transit'].includes(t.status)).length;
  const so = salesOrders.filter(s => s.status === 'Open').length;
  const gi = goodsIssues.filter(g => ['Requested', 'Approved', 'Picked'].includes(g.status)).length;
  const ded = sum(
    ledger.filter(e => (e.type === 'Sales' || e.type === 'Goods Issue') && daysBetween(e.date, now) <= 30),
    e => e.outQty
  );
  const main = [
    {
      t: 'Product',
      ic: 'tag',
      d: 'Item master with units, pricing and reorder rules',
      m: act.length + ' active products',
      s: 'completed',
      r: 'products'
    },
    {
      t: 'Purchase Order',
      ic: 'cart',
      d: 'Buyer raises an order with the supplier',
      m: pl(openPO, 'open purchase order'),
      s: openPO ? 'pending' : 'completed',
      r: 'purchasing'
    },
    {
      t: 'Goods Receipt',
      ic: 'receive',
      d: 'Dock team receives the delivery against the PO',
      m: pl(draftG, 'receipt') + ' in draft',
      s: draftG ? 'pending' : 'completed',
      r: 'grn'
    },
    {
      t: 'Quality Check',
      ic: 'clipboard',
      d: 'Inspection accepts or rejects each received line',
      m: qc + ' awaiting inspection · ' + rej + ' units rejected in 30 days',
      s: rej ? 'error' : qc ? 'pending' : 'completed',
      r: 'grn'
    },
    {
      t: 'Warehouse Putaway',
      ic: 'inbox',
      d: 'Accepted goods are stored in zones and bins',
      m: pl(put, 'receipt') + ' ready for putaway',
      s: put ? 'pending' : 'completed',
      r: 'grn'
    },
    {
      t: 'Available Stock',
      ic: 'box',
      d: 'On-hand quantity less reservations',
      m: fmtN(avail) + ' units available · ' + outs + ' products out of stock',
      s: outs ? 'error' : 'completed',
      r: 'stock'
    },
    {
      t: 'Stock Transfer',
      ic: 'transfer',
      d: 'Rebalance stock between warehouses',
      m: pl(trf, 'transfer') + ' in progress',
      s: trf ? 'pending' : 'completed',
      r: 'stock-transfer'
    },
    {
      t: 'Sales Order',
      ic: 'trending',
      d: 'Customer orders reserve available stock',
      m: pl(so, 'open order') + ' reserving stock',
      s: so ? 'pending' : 'completed',
      r: 'sales'
    },
    {
      t: 'Goods Issue',
      ic: 'issue',
      d: 'Picking and dispatch from storage bins',
      m: pl(gi, 'issue') + ' awaiting completion',
      s: gi ? 'pending' : 'completed',
      r: 'goods-issue'
    },
    {
      t: 'Stock Deduction',
      ic: 'minus',
      d: 'Issued quantities leave on-hand stock',
      m: fmtN(ded) + ' units deducted in 30 days',
      s: 'completed',
      r: 'ledger'
    },
    {
      t: 'Inventory Ledger',
      ic: 'book',
      d: 'Every movement is posted with quantity and value',
      m: fmtN(ledger.length) + ' ledger entries',
      s: 'completed',
      r: 'ledger'
    }
  ];
  const ad = stockAdjustments;
  const adj = [
    {
      t: 'Stock Adjustment',
      ic: 'sliders',
      d: 'Record count variances, damage, loss or found stock',
      m: pl(ad.filter(a => a.status === 'Draft').length, 'draft'),
      s: ad.some(a => a.status === 'Draft') ? 'pending' : 'completed',
      r: 'stock-adjustment'
    },
    {
      t: 'Approval',
      ic: 'shield',
      d: 'Inventory manager reviews value and evidence',
      m:
        ad.filter(a => a.status === 'Submitted').length +
        ' awaiting approval · ' +
        ad.filter(a => a.status === 'Rejected').length +
        ' rejected',
      s: ad.some(a => a.status === 'Rejected')
        ? 'error'
        : ad.some(a => a.status === 'Submitted')
          ? 'pending'
          : 'completed',
      r: 'stock-adjustment'
    },
    {
      t: 'Inventory Update',
      ic: 'refresh',
      d: 'Approved differences are posted to stock',
      m: ad.filter(a => a.status === 'Approved').length + ' approved, ready to post',
      s: ad.some(a => a.status === 'Approved') ? 'pending' : 'completed',
      r: 'stock-adjustment'
    },
    {
      t: 'Inventory Ledger',
      ic: 'book',
      d: 'Adjustment entries carry value impact',
      m: fmtN(ledger.filter(e => e.type === 'Adjustment').length) + ' adjustment entries',
      s: 'completed',
      r: 'ledger?type=Adjustment'
    }
  ];
  return { main, adj };
}
const WF_LABEL = {
  completed: ['Completed', 'success'],
  pending: ['Pending', 'warning'],
  error: ['Attention', 'danger'],
  active: ['In progress', 'info']
};
function flowListHTML(steps) {
  return (
    '<div class="flow">' +
    steps
      .map(
        (s, i) =>
          (i
            ? '<div class="flow-conn' +
              (steps[i - 1].s === 'completed' ? ' done' : '') +
              '" aria-hidden="true"><span class="line"></span></div>'
            : '') +
          '<button class="flow-card ' +
          s.s +
          '" data-go="' +
          s.r +
          '"><span class="flow-num">' +
          String(i + 1).padStart(2, '0') +
          '</span><span class="flow-ico">' +
          icon(s.ic, 20) +
          '</span><span style="min-width:0"><span class="flow-title" style="display:block">' +
          esc(s.t) +
          '</span><span class="flow-desc" style="display:block">' +
          esc(s.d) +
          '</span><span class="flow-metric" style="display:block">' +
          esc(s.m) +
          '</span></span><span class="flow-side">' +
          badge(WF_LABEL[s.s][0], WF_LABEL[s.s][1]) +
          '<span class="link" style="font-size:12.5px">Open</span></span></button>'
      )
      .join('') +
    '</div>'
  );
}
function flowStripHTML(steps) {
  return (
    '<div class="strip">' +
    steps
      .map(
        (s, i) =>
          (i ? '<span class="strip-arrow" aria-hidden="true">' + icon('chevRight', 16) + '</span>' : '') +
          '<button class="strip-step ' +
          s.s +
          '" data-go="' +
          s.r +
          '" title="' +
          esc(s.m) +
          '"><span class="n">Step ' +
          (i + 1) +
          '</span><span class="row" style="gap:6px;color:var(--text-muted)">' +
          icon(s.ic, 16) +
          '<span class="t" style="color:var(--text)">' +
          esc(s.t) +
          '</span></span><span class="m">' +
          esc(WF_LABEL[s.s][0]) +
          '</span></button>'
      )
      .join('') +
    '</div>'
  );
}
const legendWF =
  '<div class="legend"><span><i style="background:var(--success)"></i>Completed — nothing waiting</span><span><i style="background:var(--warning)"></i>Pending — documents waiting</span><span><i style="background:var(--danger)"></i>Attention — exceptions to resolve</span></div>';
