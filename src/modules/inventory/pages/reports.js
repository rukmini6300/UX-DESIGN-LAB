/* =========================================================================
   REPORTS
   Valuation, movement, aging, low stock, warehouse, product movement, dead
   stock and expiry reports.

   Provides: REPORTS, buildReport, #/reports
   ========================================================================= */
'use strict';

const REPORTS = [
  {
    key: 'valuation',
    label: 'Inventory Valuation',
    icon: 'dollar',
    desc: 'Quantity and value on hand at a date'
  },
  {
    key: 'movement',
    label: 'Stock Movement',
    icon: 'transfer',
    desc: 'Opening, in, out and closing by product'
  },
  { key: 'aging', label: 'Stock Aging', icon: 'clock', desc: 'On-hand stock by receipt age (FIFO)' },
  { key: 'low', label: 'Low Stock', icon: 'alert', desc: 'Products at or below reorder level' },
  { key: 'warehouse', label: 'Warehouse Stock', icon: 'warehouse', desc: 'Position and throughput by site' },
  { key: 'product', label: 'Product Movement', icon: 'activity', desc: 'Movements by transaction type' },
  { key: 'dead', label: 'Dead Stock', icon: 'ban', desc: 'No demand in the last 90 days' },
  { key: 'expiry', label: 'Expiry Report', icon: 'hourglass', desc: 'Batches by expiry date' }
];
function buildReport(key, f) {
  const from = new Date(f.from + 'T00:00'),
    to = new Date(f.to + 'T23:59:59');
  const pf = p => (!f.cat || p.categoryId === f.cat) && (!f.pid || p.id === f.pid);
  const ps = products.filter(pf);
  const inR = e =>
    e.date >= from &&
    e.date <= to &&
    (!f.wid || e.warehouseId === f.wid) &&
    ps.some(p => p.id === e.productId);
  const COLS = [
    'var(--c1)',
    'var(--c2)',
    'var(--c3)',
    'var(--c4)',
    'var(--c5)',
    'var(--c6)',
    'var(--c1)',
    'var(--c2)',
    'var(--c3)'
  ];
  const pc = [
    { key: 'name', label: 'Product', value: p => p.name, render: p => prodCell(p) },
    { key: 'sku', label: 'SKU', render: p => '<span class="mono">' + esc(p.sku) + '</span>' },
    { key: 'cat', label: 'Category', value: p => CAT_BY(p.categoryId).name }
  ];
  if (key === 'valuation') {
    const rows = ps
      .map(p => {
        const q = Math.max(0, qtyAt(p.id, to, f.wid));
        return { id: p.id, p, q, v: q * p.cost };
      })
      .filter(r => r.q > 0);
    const tot = sum(rows, r => r.v);
    const byCat = categories
      .map((c, i) => ({
        label: c.name,
        value: sum(
          rows.filter(r => r.p.categoryId === c.id),
          r => r.v
        ),
        color: COLS[i]
      }))
      .filter(x => x.value > 0);
    return {
      summary: [
        ['Inventory value', fmtM(tot, 0)],
        ['Units on hand', fmtN(sum(rows, r => r.q))],
        ['Products', rows.length],
        ['As of', fmtD(to)]
      ],
      chart: donut(byCat, { fmt: fmtK, center: fmtK(tot), centerSub: 'Total value' }),
      columns: [
        { key: 'name', label: 'Product', value: r => r.p.name, render: r => prodCell(r.p) },
        { key: 'cat', label: 'Category', value: r => CAT_BY(r.p.categoryId).name },
        { key: 'q', label: 'Quantity', align: 'right', render: r => fmtN(r.q) },
        { key: 'uom', label: 'Unit', value: r => r.p.uom },
        { key: 'c', label: 'Unit Cost', align: 'right', value: r => r.p.cost, render: r => fmtM(r.p.cost) },
        { key: 'v', label: 'Value', align: 'right', render: r => '<b>' + fmtM(r.v) + '</b>' },
        {
          key: 's',
          label: 'Share',
          align: 'right',
          value: r => r.v / tot,
          render: r => ((r.v / tot) * 100).toFixed(1) + '%'
        }
      ],
      rows,
      footer: rs => ['<b>Total</b>', '', fmtN(sum(rs, r => r.q)), '', '', fmtM(sum(rs, r => r.v)), '100%']
    };
  }
  if (key === 'movement') {
    const es = ledger.filter(inR);
    const rows = ps
      .map(p => {
        const pe = es.filter(e => e.productId === p.id);
        return {
          id: p.id,
          p,
          o: qtyAt(p.id, from, f.wid),
          i: sum(pe, e => e.inQty),
          out: sum(pe, e => e.outQty),
          c: qtyAt(p.id, to, f.wid),
          n: pe.length
        };
      })
      .filter(r => r.n || r.o || r.c);
    const wk = [];
    for (let d = new Date(from); d <= to; d = addDays(d, 7)) wk.push(new Date(d));
    const wi = wk.map(d =>
        sum(
          es.filter(e => e.date >= d && e.date < addDays(d, 7)),
          e => e.inQty
        )
      ),
      wo = wk.map(d =>
        sum(
          es.filter(e => e.date >= d && e.date < addDays(d, 7)),
          e => e.outQty
        )
      );
    return {
      summary: [
        ['Units in', fmtN(sum(rows, r => r.i))],
        ['Units out', fmtN(sum(rows, r => r.out))],
        ['Movements', fmtN(es.length)],
        ['Products moved', rows.filter(r => r.n).length]
      ],
      chart: barChart({
        labels: wk.map(shortD),
        series: [
          { name: 'In', values: wi, color: 'var(--c2)' },
          { name: 'Out', values: wo, color: 'var(--c1)' }
        ],
        h: 200
      }),
      columns: [
        { key: 'name', label: 'Product', value: r => r.p.name, render: r => prodCell(r.p) },
        { key: 'o', label: 'Opening', align: 'right', render: r => fmtN(r.o) },
        {
          key: 'i',
          label: 'In',
          align: 'right',
          render: r => (r.i ? '<span class="pos">+' + fmtN(r.i) + '</span>' : '—')
        },
        {
          key: 'out',
          label: 'Out',
          align: 'right',
          render: r => (r.out ? '<span class="neg">−' + fmtN(r.out) + '</span>' : '—')
        },
        { key: 'c', label: 'Closing', align: 'right', render: r => '<b>' + fmtN(r.c) + '</b>' },
        { key: 'n', label: 'Movements', align: 'right' },
        {
          key: 't',
          label: 'Turnover',
          align: 'right',
          value: r => r.out / ((r.o + r.c) / 2 || 1),
          render: r => (r.out / ((r.o + r.c) / 2 || 1)).toFixed(2) + '×'
        }
      ],
      rows,
      footer: rs => [
        '<b>Total</b>',
        fmtN(sum(rs, r => r.o)),
        fmtN(sum(rs, r => r.i)),
        fmtN(sum(rs, r => r.out)),
        fmtN(sum(rs, r => r.c)),
        fmtN(sum(rs, r => r.n)),
        ''
      ]
    };
  }
  if (key === 'aging') {
    const rows = agingRows()
      .filter(a => pf(P_BY(a.row.productId)) && (!f.wid || a.row.warehouseId === f.wid))
      .map(a => ({ id: a.row.productId + a.row.warehouseId, a, p: P_BY(a.row.productId) }));
    const vb = [0, 0, 0, 0, 0];
    rows.forEach(r => r.a.b.forEach((q, i) => (vb[i] += q * r.p.cost)));
    return {
      summary: [
        ['Stock older than 90 days', fmtM(vb[3] + vb[4], 0)],
        ['Share of value', (sum(vb) ? ((vb[3] + vb[4]) / sum(vb)) * 100 : 0).toFixed(1) + '%'],
        ['Lines', rows.length],
        ['Method', 'FIFO']
      ],
      chart: barChart({
        labels: AGE_BUCKETS,
        series: [{ name: 'Value', values: vb, color: 'var(--c4)' }],
        colors: ['var(--c2)', 'var(--c5)', 'var(--c1)', 'var(--c3)', 'var(--c6)'],
        fmt: v => fmtM(v, 0),
        fmtAxis: fmtK,
        legend: false,
        h: 200
      }),
      columns: [
        { key: 'name', label: 'Product', value: r => r.p.name, render: r => prodCell(r.p) },
        { key: 'w', label: 'Warehouse', value: r => W_BY(r.a.row.warehouseId).code }
      ]
        .concat(
          AGE_BUCKETS.map((b, i) => ({
            key: 'b' + i,
            label: b,
            align: 'right',
            value: r => r.a.b[i],
            render: r => (r.a.b[i] ? fmtN(r.a.b[i]) : '<span class="subtle">—</span>')
          }))
        )
        .concat([
          { key: 'age', label: 'Oldest (days)', align: 'right', value: r => r.a.age },
          {
            key: 'v',
            label: 'Value',
            align: 'right',
            value: r => r.a.row.qty * r.p.cost,
            render: r => fmtM(r.a.row.qty * r.p.cost)
          }
        ]),
      rows,
      footer: rs =>
        ['<b>Total</b>', '']
          .concat(AGE_BUCKETS.map((_, i) => fmtN(sum(rs, r => r.a.b[i]))))
          .concat(['', fmtM(sum(rs, r => r.a.row.qty * r.p.cost))])
    };
  }
  if (key === 'low') {
    const rows = ps.filter(
      p => p.status === 'Active' && ['Low Stock', 'Critical', 'Out of Stock'].includes(pStatus(p))
    );
    return {
      summary: [
        ['Products', rows.length],
        ['Out of stock', rows.filter(p => pStatus(p) === 'Out of Stock').length],
        ['Total shortfall', fmtN(sum(rows, p => Math.max(0, p.reorder - productQty(p.id))))],
        ['On order', fmtN(sum(rows, p => onOrder(p.id)))]
      ],
      chart: hbars(
        rows
          .slice(0, 8)
          .map(p => ({ label: p.name, value: Math.max(0, p.reorder - productQty(p.id)), cls: 'd' }))
      ),
      columns: pc.concat([
        { key: 'q', label: 'On hand', align: 'right', value: p => productQty(p.id) },
        { key: 'reorder', label: 'Reorder Level', align: 'right' },
        {
          key: 'sh',
          label: 'Shortfall',
          align: 'right',
          value: p => Math.max(0, p.reorder - productQty(p.id))
        },
        { key: 'oo', label: 'On order', align: 'right', value: p => onOrder(p.id) },
        { key: 'st', label: 'Status', value: pStatus, render: p => badge(pStatus(p)) }
      ]),
      rows
    };
  }
  if (key === 'warehouse') {
    const rows = warehouses
      .filter(w => !f.wid || w.id === f.wid)
      .map(w => {
        const es = ledger.filter(e => e.warehouseId === w.id && e.date >= from && e.date <= to);
        return {
          id: w.id,
          w,
          n: whStock(w.id).length,
          q: sum(whStock(w.id), s => s.qty),
          v: whValue(w.id),
          u: whUtil(w),
          i: sum(es, e => e.inQty),
          o: sum(es, e => e.outQty)
        };
      });
    return {
      summary: [
        ['Sites', rows.length],
        ['Units on hand', fmtN(sum(rows, r => r.q))],
        [
          'Value',
          fmtM(
            sum(rows, r => r.v),
            0
          )
        ],
        ['Throughput', fmtN(sum(rows, r => r.i + r.o)) + ' units']
      ],
      chart: barChart({
        labels: rows.map(r => r.w.code),
        series: [
          { name: 'In', values: rows.map(r => r.i), color: 'var(--c2)' },
          { name: 'Out', values: rows.map(r => r.o), color: 'var(--c1)' }
        ],
        h: 200
      }),
      columns: [
        { key: 'name', label: 'Warehouse', value: r => r.w.name, render: r => whCell(r.w) },
        { key: 'n', label: 'Products', align: 'right' },
        { key: 'q', label: 'On hand', align: 'right', render: r => fmtN(r.q) },
        { key: 'v', label: 'Value', align: 'right', render: r => fmtM(r.v, 0) },
        { key: 'u', label: 'Utilization', render: r => utilHTML(r.u), exportValue: r => r.u + '%' },
        { key: 'i', label: 'In (period)', align: 'right', render: r => fmtN(r.i) },
        { key: 'o', label: 'Out (period)', align: 'right', render: r => fmtN(r.o) },
        { key: 'st', label: 'Status', value: r => r.w.status, render: r => badge(r.w.status) }
      ],
      rows,
      footer: rs => [
        '<b>Total</b>',
        fmtN(sum(rs, r => r.n)),
        fmtN(sum(rs, r => r.q)),
        fmtM(
          sum(rs, r => r.v),
          0
        ),
        '',
        fmtN(sum(rs, r => r.i)),
        fmtN(sum(rs, r => r.o)),
        ''
      ]
    };
  }
  if (key === 'product') {
    const es = ledger.filter(inR);
    const types = ['Opening Balance', 'GRN', 'Sales', 'Goods Issue', 'Transfer', 'Adjustment'];
    const rows = types.map(t => {
      const te = es.filter(e => e.type === t);
      return {
        id: t,
        t,
        n: te.length,
        i: sum(te, e => e.inQty),
        o: sum(te, e => e.outQty),
        v: sum(te, e => e.value)
      };
    });
    const p = f.pid ? P_BY(f.pid) : null;
    let chart;
    if (p) {
      const ws = [];
      for (let d = new Date(from); d <= to; d = addDays(d, 7)) ws.push(new Date(d));
      chart = lineChart({
        labels: ws.map(shortD),
        series: [
          { name: p.name, values: ws.map(d => Math.max(0, qtyAt(p.id, d, f.wid))), color: 'var(--c1)' }
        ],
        h: 200
      });
    } else
      chart = barChart({
        labels: rows.map(r => r.t.replace('Opening Balance', 'Opening')),
        series: [
          { name: 'In', values: rows.map(r => r.i), color: 'var(--c2)' },
          { name: 'Out', values: rows.map(r => r.o), color: 'var(--c1)' }
        ],
        h: 200
      });
    return {
      summary: [
        ['Scope', p ? p.name : 'All filtered products'],
        ['Entries', fmtN(es.length)],
        ['Net quantity', fmtN(sum(rows, r => r.i - r.o))],
        [
          'Net value',
          fmtM(
            sum(rows, r => r.v),
            0
          )
        ]
      ],
      chart,
      columns: [
        { key: 't', label: 'Transaction Type' },
        { key: 'n', label: 'Entries', align: 'right' },
        { key: 'i', label: 'In Qty', align: 'right', render: r => fmtN(r.i) },
        { key: 'o', label: 'Out Qty', align: 'right', render: r => fmtN(r.o) },
        {
          key: 'net',
          label: 'Net Qty',
          align: 'right',
          value: r => r.i - r.o,
          render: r => '<b class="' + (r.i - r.o >= 0 ? 'pos' : 'neg') + '">' + fmtN(r.i - r.o) + '</b>'
        },
        { key: 'v', label: 'Value', align: 'right', render: r => fmtM(r.v, 0) }
      ],
      rows,
      footer: rs => [
        '<b>Total</b>',
        fmtN(sum(rs, r => r.n)),
        fmtN(sum(rs, r => r.i)),
        fmtN(sum(rs, r => r.o)),
        fmtN(sum(rs, r => r.i - r.o)),
        fmtM(
          sum(rs, r => r.v),
          0
        )
      ]
    };
  }
  if (key === 'dead') {
    const cut = addDays(to, -90);
    const rows = ps
      .filter(p => productQty(p.id) > 0)
      .map(p => {
        const outs = ledger.filter(
          e =>
            e.productId === p.id &&
            (e.type === 'Sales' || e.type === 'Goods Issue') &&
            (!f.wid || e.warehouseId === f.wid)
        );
        const last = outs.length ? outs[outs.length - 1].date : null;
        return { id: p.id, p, last, q: f.wid ? whQty(p.id, f.wid) : productQty(p.id) };
      })
      .filter(r => r.q > 0 && (!r.last || r.last < cut));
    return {
      summary: [
        ['Products', rows.length],
        ['Units', fmtN(sum(rows, r => r.q))],
        [
          'Value tied up',
          fmtM(
            sum(rows, r => r.q * r.p.cost),
            0
          )
        ],
        ['No demand since', fmtD(cut)]
      ],
      chart: rows.length
        ? hbars(
            rows
              .sort((a, b) => b.q * b.p.cost - a.q * a.p.cost)
              .slice(0, 8)
              .map(r => ({ label: r.p.name, value: Math.round(r.q * r.p.cost) })),
            { fmt: v => fmtM(v, 0) }
          )
        : '<div class="empty"><div class="empty-ico">' +
          icon('checkCircle', 22) +
          '</div><h4>No dead stock</h4><p>Every product with stock had demand in the last 90 days.</p></div>',
      columns: pc
        .concat([
          { key: 'q', label: 'On hand', align: 'right' },
          {
            key: 'last',
            label: 'Last issue',
            value: r => r.last,
            render: r => (r.last ? fmtD(r.last) : 'Never')
          },
          {
            key: 'd',
            label: 'Days idle',
            align: 'right',
            value: r => (r.last ? daysBetween(r.last, to) : 999),
            render: r => (r.last ? daysBetween(r.last, to) : '—')
          },
          {
            key: 'v',
            label: 'Value',
            align: 'right',
            value: r => r.q * r.p.cost,
            render: r => fmtM(r.q * r.p.cost)
          }
        ])
        .map(c =>
          c.key === 'name'
            ? { key: 'name', label: 'Product', value: r => r.p.name, render: r => prodCell(r.p) }
            : c.key === 'sku'
              ? { key: 'sku', label: 'SKU', value: r => r.p.sku }
              : c.key === 'cat'
                ? { key: 'cat', label: 'Category', value: r => CAT_BY(r.p.categoryId).name }
                : c
        ),
      rows
    };
  }
  if (key === 'expiry') {
    const rows = batches.filter(
      b => b.qty > 0 && b.expiry && pf(P_BY(b.productId)) && (!f.wid || b.warehouseId === f.wid)
    );
    const st = s => rows.filter(b => expStatus(b) === s);
    return {
      summary: [
        ['Expired', st('Expired').length + ' batches'],
        ['Expiring soon', st('Expiring Soon').length + ' batches'],
        [
          'Value at risk',
          fmtM(
            sum(st('Expired').concat(st('Expiring Soon')), b => b.qty * P_BY(b.productId).cost),
            0
          )
        ],
        ['Batches', rows.length]
      ],
      chart: donut(
        ['Expired', 'Expiring Soon', 'Within 90 Days', 'Good'].map((s, i) => ({
          label: s,
          value: sum(st(s), b => b.qty * P_BY(b.productId).cost),
          color: ['var(--danger)', 'var(--c6)', 'var(--c3)', 'var(--c2)'][i]
        })),
        { fmt: fmtK, center: String(rows.length), centerSub: 'batches' }
      ),
      columns: [
        {
          key: 'p',
          label: 'Product',
          value: b => P_BY(b.productId).name,
          render: b => prodCell(P_BY(b.productId))
        },
        { key: 'batch', label: 'Batch' },
        { key: 'w', label: 'Warehouse', value: b => W_BY(b.warehouseId).code },
        { key: 'expiry', label: 'Expiry', render: b => fmtD(b.expiry) },
        { key: 'd', label: 'Days left', align: 'right', value: b => daysBetween(NOW(), b.expiry) },
        { key: 'qty', label: 'Qty', align: 'right' },
        {
          key: 'v',
          label: 'Value',
          align: 'right',
          value: b => b.qty * P_BY(b.productId).cost,
          render: b => fmtM(b.qty * P_BY(b.productId).cost)
        },
        { key: 's', label: 'Status', value: expStatus, render: b => badge(expStatus(b)) }
      ],
      rows
    };
  }
}
ROUTES.reports = (key, q) => {
  key = REPORTS.some(r => r.key === key) ? key : 'valuation';
  const R_ = REPORTS.find(r => r.key === key);
  const f = {
    from: q.from || isoDate(addDays(NOW(), -90)),
    to: q.to || isoDate(NOW()),
    wid: q.warehouse || '',
    cat: q.category || '',
    pid: q.product || ''
  };
  const nav =
    'reports/' + (['valuation', 'movement', 'aging', 'warehouse'].includes(key) ? key : 'valuation');
  return {
    title: 'Inventory Reports',
    nav,
    crumbs: [['Inventory', 'inventory'], ['Reports', 'reports/valuation'], [R_.label]],
    sub: R_.desc + '. Filters apply to the report and its export.',
    actions: btn('Print', 'print', '', 'data-print') + btn('Export', 'export', 'primary', 'data-export'),
    body:
      '<div class="grid" style="grid-template-columns:260px minmax(0,1fr)" id="repGrid"><section class="card report-nav-card"><div class="report-nav">' +
      REPORTS.map(
        r =>
          '<button class="' +
          (r.key === key ? 'active' : '') +
          '" data-rep="' +
          r.key +
          '">' +
          icon(r.icon, 17) +
          '<span><b>' +
          esc(r.label) +
          '</b><small>' +
          esc(r.desc) +
          '</small></span></button>'
      ).join('') +
      '</div></section>' +
      '<section class="card"><div class="dt-toolbar no-print" style="gap:12px;align-items:flex-end"><label class="field" style="grid-column:auto;min-width:140px"><span class="lbl">From</span><input class="input" type="date" data-rf="from" value="' +
      f.from +
      '"' +
      (key === 'valuation' || key === 'low' || key === 'expiry' || key === 'aging' ? ' disabled' : '') +
      '></label><label class="field" style="min-width:140px"><span class="lbl">' +
      (key === 'valuation' ? 'As of' : 'To') +
      '</span><input class="input" type="date" data-rf="to" value="' +
      f.to +
      '"></label><label class="field" style="min-width:160px"><span class="lbl">Warehouse</span><select class="select" data-rf="warehouse">' +
      optionsHTML(
        whOptions(true).map(o => [o[0], o[1].split(' (')[0]]),
        f.wid,
        'All warehouses'
      ) +
      '</select></label><label class="field" style="min-width:150px"><span class="lbl">Category</span><select class="select" data-rf="category">' +
      optionsHTML(
        categories.map(c => [c.id, c.name]),
        f.cat,
        'All categories'
      ) +
      '</select></label><label class="field" style="min-width:180px;flex:1"><span class="lbl">Product</span><select class="select" data-rf="product">' +
      optionsHTML(
        products.filter(p => !f.cat || p.categoryId === f.cat).map(p => [p.id, p.name]),
        f.pid,
        'All products'
      ) +
      '</select></label><button class="btn btn-ghost" data-rclear>Reset</button></div><div class="sum-row" id="repSum"></div><div class="card-body" id="repChart" style="border-bottom:1px solid var(--border)"></div><div id="repTable"></div></section></div>',
    mount(page) {
      const g = $('#repGrid', page);
      const mq = () => {
        g.style.gridTemplateColumns = innerWidth < 1100 ? 'minmax(0,1fr)' : '260px minmax(0,1fr)';
      };
      mq();
      const go = () => {
        const v = k => $('[data-rf="' + k + '"]', page).value;
        const qs = new URLSearchParams();
        ['from', 'to', 'warehouse', 'category', 'product'].forEach(k => {
          if (v(k)) qs.set(k, v(k));
        });
        navigate('reports/' + key + '?' + qs.toString());
      };
      $$('[data-rf]', page).forEach(i =>
        i.addEventListener('change', () => {
          if (i.dataset.rf === 'to' && $('[data-rf=from]', page).value > i.value) {
            toast('error', 'Check the date range', 'The end date must be after the start date.');
            return;
          }
          go();
        })
      );
      $('[data-rclear]', page).onclick = () => navigate('reports/' + key);
      $$('[data-rep]', page).forEach(
        b =>
          (b.onclick = () => {
            const qs = location.hash.split('?')[1];
            navigate('reports/' + b.dataset.rep + (qs ? '?' + qs : ''));
          })
      );
      const rep = buildReport(key, f);
      $('#repSum', page).innerHTML = rep.summary
        .map(s => '<div><small>' + esc(s[0]) + '</small><b>' + esc(s[1]) + '</b></div>')
        .join('');
      $('#repChart', page).innerHTML = rep.chart;
      const t = mountTable(page, '#repTable', {
        title: R_.label,
        columns: rep.columns,
        data: () => rep.rows,
        rowId: r => r.id || r.batch || r.t,
        pageSize: 25,
        footer: rep.footer,
        emptyIcon: 'chart',
        emptyTitle: 'No data for these filters',
        emptyText: 'Widen the date range or clear the warehouse, category or product filter.'
      });
      $('[data-export]', page).onclick = () =>
        exportCSV(
          R_.label,
          rep.columns.filter(c => c.export !== false),
          t.rows()
        );
      $('[data-print]', page).onclick = doPrint;
    }
  };
};
