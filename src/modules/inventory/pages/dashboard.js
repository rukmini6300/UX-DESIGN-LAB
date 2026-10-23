/* =========================================================================
   DASHBOARD
   Inventory dashboard and overview.

   Provides: pageDashboard, #/dashboard, #/inventory
   ========================================================================= */
'use strict';

function pageDashboard(param, q, isHome) {
  const act = products.filter(p => p.status === 'Active');
  const totalQty = sum(stock, s => s.qty),
    val = stockValue(),
    val30 = valueAt(addDays(NOW(), -30));
  const low = act.filter(p => ['Low Stock', 'Critical'].includes(pStatus(p))),
    out = act.filter(p => pStatus(p) === 'Out of Stock');
  const pg = grns.filter(g => ['Draft', 'Pending QC', 'Accepted'].includes(g.status)),
    pt = stockTransfers.filter(t => ['Draft', 'Submitted', 'Approved', 'In Transit'].includes(t.status));
  const pa = stockAdjustments.filter(a => ['Draft', 'Submitted', 'Approved'].includes(a.status));
  const m0 = new Date(NOW().getFullYear(), NOW().getMonth(), 1);
  const postedMonth = stockAdjustments.filter(a => a.status === 'Posted' && a.postedAt >= m0).length;
  const ws = weeks(16);
  const trend = ws.map(d => valueAt(d));
  const w8 = weeks(8);
  const mvIn = [],
    mvOut = [];
  w8.forEach(d => {
    const s = addDays(d, -7);
    const es = ledger.filter(
      e => e.date > s && e.date <= d && e.type !== 'Transfer' && e.type !== 'Opening Balance'
    );
    mvIn.push(sum(es, e => e.inQty));
    mvOut.push(sum(es, e => e.outQty));
  });
  const COLS = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)'];
  const dist = activeWh().map((w, i) => ({ label: w.name, value: whValue(w.id), color: COLS[i % 6] }));
  const movers = act
    .map(p => ({ p, v: outflow(p.id, 30) }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 6);
  const ag = agingRows();
  const agB = [0, 0, 0, 0, 0];
  ag.forEach(a => a.b.forEach((q, i) => (agB[i] += q * P_BY(a.row.productId).cost)));
  const wf = workflowModel();
  const lowList = act
    .filter(p => ['Low Stock', 'Critical', 'Out of Stock'].includes(pStatus(p)))
    .sort((a, b) => productQty(a.id) / a.reorder - productQty(b.id) / b.reorder)
    .slice(0, 7);
  const recent = ledger.slice(-8).reverse();
  const qa = (ic, l, s, r) =>
    '<button class="qa" data-go="' +
    r +
    '"><span class="qa-ico">' +
    icon(ic, 17) +
    '</span><span>' +
    icon('plus', 13).replace('class="i"', 'class="i" style="display:inline;vertical-align:-2px"') +
    ' ' +
    esc(l) +
    '<small>' +
    esc(s) +
    '</small></span></button>';
  const body =
    '<div class="quick mb-16">' +
    qa('tag', 'Create Product', 'Add an item to the catalog', 'product-create') +
    qa('receive', 'Receive Stock', 'Record a goods receipt', 'grn-create') +
    qa('transfer', 'Stock Transfer', 'Move stock between sites', 'transfer-create') +
    qa('sliders', 'Stock Adjustment', 'Correct on-hand quantity', 'adjustment-create') +
    qa('issue', 'Goods Issue', 'Issue stock to a department', 'issue-create') +
    '</div>' +
    '<div class="kpis">' +
    kpi(
      'Total Products',
      fmtN(products.length),
      'tag',
      'primary',
      act.length + ' active · ' + (products.length - act.length) + ' draft or inactive',
      'products'
    ) +
    kpi(
      'Total Stock Quantity',
      fmtN(totalQty),
      'layers',
      'purple',
      fmtN(sum(stock, s => s.reserved)) + ' units reserved',
      'stock'
    ) +
    kpi(
      'Inventory Value',
      fmtK(val),
      'dollar',
      'success',
      deltaHTML(((val - val30) / val30) * 100) + ' vs 30 days ago',
      'reports/valuation'
    ) +
    kpi(
      'Low Stock Items',
      fmtN(low.length),
      'alert',
      'warning',
      low.filter(p => pStatus(p) === 'Critical').length + ' critical, below 50% of reorder',
      'low-stock'
    ) +
    kpi(
      'Out of Stock',
      fmtN(out.length),
      'xCircle',
      'danger',
      out.length
        ? esc(
            out
              .map(p => p.name)
              .slice(0, 1)
              .join('')
          ) + (out.length > 1 ? ' and ' + (out.length - 1) + ' more' : '')
        : 'Every active product has stock',
      'low-stock'
    ) +
    kpi(
      'Pending GRNs',
      fmtN(pg.length),
      'receive',
      'primary',
      pg.filter(g => g.status === 'Pending QC').length + ' awaiting quality check',
      'grn'
    ) +
    kpi(
      'Pending Transfers',
      fmtN(pt.length),
      'transfer',
      'purple',
      pt.filter(t => t.status === 'Submitted').length +
        ' need approval · ' +
        pt.filter(t => t.status === 'In Transit').length +
        ' in transit',
      'stock-transfer'
    ) +
    kpi(
      'Stock Adjustments',
      fmtN(pa.length),
      'sliders',
      'warning',
      postedMonth + ' posted this month',
      'stock-adjustment'
    ) +
    '</div>' +
    card('Inventory workflow', flowStripHTML(wf.main), {
      cls: 'mt-16',
      sub: 'Live status of each stage from purchasing to the ledger',
      actions: '<a class="btn btn-sm" href="#/workflow">' + icon('flow', 15) + 'Full workflow</a>'
    }) +
    '<div class="grid g-7-5 mt-16">' +
    card(
      'Stock value trend',
      lineChart({
        labels: ws.map(shortD),
        series: [{ name: 'Inventory value', values: trend, color: 'var(--c1)' }],
        fmt: v => fmtM(v, 0),
        fmtAxis: v => fmtK(v),
        zero: false,
        h: 230,
        title: 'Inventory value by week'
      }),
      { sub: 'Weekly closing value, last 16 weeks' }
    ) +
    card(
      'Warehouse stock distribution',
      donut(dist, { fmt: fmtK, center: fmtK(val), centerSub: 'Total value' }),
      { sub: 'Share of inventory value by site' }
    ) +
    '</div>' +
    '<div class="grid g-7-5 mt-16">' +
    card(
      'Stock movement',
      barChart({
        labels: w8.map(shortD),
        series: [
          { name: 'Receipts', values: mvIn, color: 'var(--c2)' },
          { name: 'Issues and sales', values: mvOut, color: 'var(--c1)' }
        ],
        h: 220,
        title: 'Units received and issued by week'
      }),
      { sub: 'Units in and out per week, transfers excluded' }
    ) +
    card(
      'Top moving products',
      hbars(
        movers.map(m => ({
          html:
            '<a class="link" style="color:var(--text);font-weight:500" href="#/product-view/' +
            m.p.id +
            '">' +
            esc(m.p.name) +
            '</a>',
          value: m.v
        }))
      ),
      { sub: 'Units issued or sold, last 30 days' }
    ) +
    '</div>' +
    '<div class="grid g-2 mt-16">' +
    card(
      'Low stock products',
      '<div class="table-wrap auto"><table class="tbl compact"><thead><tr><th>Product</th><th class="right">Available</th><th class="right">Reorder</th><th>Status</th><th class="act"></th></tr></thead><tbody>' +
        (lowList.length
          ? lowList
              .map(
                p =>
                  '<tr><td>' +
                  prodCell(p) +
                  '</td><td class="right num">' +
                  fmtN(productQty(p.id)) +
                  '</td><td class="right num muted">' +
                  fmtN(p.reorder) +
                  '</td><td>' +
                  badge(pStatus(p)) +
                  '</td><td class="act"><button class="btn btn-sm" data-reorder="' +
                  p.id +
                  '">Reorder</button></td></tr>'
              )
              .join('')
          : '<tr><td colspan="5"><div class="empty"><h4>Stock levels are healthy</h4><p>No active product is below its reorder level.</p></div></td></tr>') +
        '</tbody></table></div>',
      {
        tight: true,
        sub: 'Below reorder level, most urgent first',
        actions: '<a class="btn btn-sm btn-ghost" href="#/low-stock">View all</a>'
      }
    ) +
    card(
      'Inventory aging',
      barChart({
        labels: AGE_BUCKETS,
        series: [{ name: 'Value', values: agB, color: 'var(--c4)' }],
        colors: ['var(--c2)', 'var(--c5)', 'var(--c1)', 'var(--c3)', 'var(--c6)'],
        fmt: v => fmtM(v, 0),
        fmtAxis: fmtK,
        h: 230,
        legend: false,
        title: 'Inventory value by age'
      }),
      {
        sub: 'Value of on-hand stock by receipt age (FIFO)',
        actions: '<a class="btn btn-sm btn-ghost" href="#/reports/aging">Aging report</a>'
      }
    ) +
    '</div>' +
    '<div class="grid g-7-5 mt-16">' +
    card('Warehouse summary', '<div id="whSummary"></div>', {
      tight: true,
      sub: 'Stock position by active site',
      actions: '<a class="btn btn-sm btn-ghost" href="#/warehouses">All warehouses</a>'
    }) +
    card(
      'Recent transactions',
      '<div class="table-wrap auto"><table class="tbl compact"><thead><tr><th>Transaction</th><th>Product</th><th class="right">Qty</th></tr></thead><tbody>' +
        recent
          .map(e => {
            const p = P_BY(e.productId);
            return (
              '<tr class="clickable" data-le="' +
              e.id +
              '"><td><b class="mono" style="font-weight:600">' +
              esc(e.txNo) +
              '</b><div class="muted" style="font-size:12px">' +
              esc(e.type) +
              ' · ' +
              relTime(e.date) +
              '</div></td><td><span class="nowrap" style="display:block;max-width:220px;overflow:hidden;text-overflow:ellipsis">' +
              esc(p ? p.name : '—') +
              '</span><span class="muted" style="font-size:12px">' +
              esc(W_BY(e.warehouseId).code) +
              '</span></td><td class="right num ' +
              (e.inQty ? 'pos' : 'neg') +
              '">' +
              (e.inQty ? '+' + fmtN(e.inQty) : '−' + fmtN(e.outQty)) +
              '</td></tr>'
            );
          })
          .join('') +
        '</tbody></table></div>',
      {
        tight: true,
        sub: 'Latest ledger postings',
        actions: '<a class="btn btn-sm btn-ghost" href="#/ledger">Stock ledger</a>'
      }
    ) +
    '</div>';
  return {
    title: 'Inventory Dashboard',
    nav: isHome ? 'dashboard' : 'inventory',
    crumbs: isHome ? [['Dashboard']] : [['Inventory', 'inventory'], ['Overview']],
    sub:
      'Stock position, workflow status and movements across ' +
      activeWh().length +
      ' active warehouses. Figures as of ' +
      fmtDT(NOW()) +
      '.',
    actions:
      btn('Refresh', 'refresh', '', 'data-refresh') +
      btn('Reports', 'chart', '', 'data-go="reports/valuation"') +
      btn('Create', 'plus', 'primary', 'data-qc'),
    body,
    mount(page) {
      $('[data-refresh]', page).onclick = () => {
        renderRoute();
        toast('success', 'Dashboard refreshed', 'Figures recalculated from the latest postings.');
      };
      $('[data-qc]', page).onclick = e => openMenu(e.currentTarget, quickCreateItems());
      $$('[data-reorder]', page).forEach(b => (b.onclick = () => raisePO(P_BY(b.dataset.reorder))));
      $$('[data-le]', page).forEach(
        r => (r.onclick = () => ledgerDrawer(ledger.find(e => e.id === r.dataset.le)))
      );
      mountTable(page, '#whSummary', {
        search: false,
        noToolbar: true,
        paginate: false,
        auto: true,
        loading: false,
        columns: whColumns().filter(c =>
          ['code', 'name', 'products', 'qty', 'value', 'util'].includes(c.key)
        ),
        data: () => activeWh(),
        onRowClick: w => navigate('warehouse-view/' + w.id),
        footer: rs => [
          '<b>Total</b>',
          '',
          fmtN(sum(rs, w => whStock(w.id).length)),
          fmtN(sum(rs, w => sum(whStock(w.id), s => s.qty))),
          fmtM(
            sum(rs, w => whValue(w.id)),
            0
          ),
          ''
        ]
      });
    }
  };
}
ROUTES.dashboard = (p, q) => pageDashboard(p, q, true);
ROUTES.inventory = (p, q) => pageDashboard(p, q, false);
