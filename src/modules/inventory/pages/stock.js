/* =========================================================================
   STOCK OVERVIEW AND LEDGER
   Stock position and the stock ledger.

   Provides: #/stock, #/ledger
   ========================================================================= */
'use strict';

ROUTES.stock = (p, q) => {
  const cnt = {};
  stock.forEach(r => {
    const s = rowStatus(r);
    cnt[s] = (cnt[s] || 0) + 1;
  });
  return {
    title: 'Stock Overview',
    crumbs: [['Inventory', 'inventory'], ['Stock Management', 'stock'], ['Stock Overview']],
    sub: 'Movement summary for every product and warehouse since go-live on 01 Jul 2026.',
    actions:
      btn('Stock Count', 'count', '', 'data-go="stock-count"') +
      btn('Adjust Stock', 'sliders', '', 'data-go="adjustment-create"') +
      btn('Transfer Stock', 'transfer', 'primary', 'data-go="transfer-create"'),
    body:
      '<div class="row wrap mb-16" style="gap:8px">' +
      ['Healthy', 'Low Stock', 'Critical', 'Out of Stock', 'Overstock']
        .map(
          s =>
            '<button class="card row" data-stf="' +
            s +
            '" style="padding:10px 14px;gap:10px;cursor:pointer">' +
            badge(s) +
            '<b class="num" style="font-size:16px">' +
            (cnt[s] || 0) +
            '</b><span class="muted" style="font-size:12.5px">lines</span></button>'
        )
        .join('') +
      '</div><section class="card" id="sT"></section>',
    mount(page) {
      const t = mountTable(page, '#sT', {
        title: 'Stock overview',
        columns: [
          {
            key: 'p',
            label: 'Product',
            value: r => P_BY(r.productId).name,
            render: r => prodCell(P_BY(r.productId), P_BY(r.productId).brand)
          },
          {
            key: 'sku',
            label: 'SKU',
            value: r => P_BY(r.productId).sku,
            render: r => '<span class="mono">' + esc(P_BY(r.productId).sku) + '</span>'
          },
          {
            key: 'w',
            label: 'Warehouse',
            value: r => W_BY(r.warehouseId).code,
            render: r => '<span class="chip">' + esc(W_BY(r.warehouseId).code) + '</span>'
          },
          {
            key: 'l',
            label: 'Location',
            value: r => (L_BY(r.locationId) || {}).code,
            render: r => '<span class="mono">' + esc((L_BY(r.locationId) || {}).code || '—') + '</span>'
          },
          { key: 'opening', label: 'Opening Qty', align: 'right', render: r => fmtN(r.opening) },
          {
            key: 'received',
            label: 'Received',
            align: 'right',
            render: r => (r.received ? '<span class="pos">+' + fmtN(r.received) + '</span>' : '—')
          },
          {
            key: 'issued',
            label: 'Issued',
            align: 'right',
            render: r => (r.issued ? '<span class="neg">−' + fmtN(r.issued) + '</span>' : '—')
          },
          {
            key: 'tr',
            label: 'Transferred',
            align: 'right',
            value: r => r.transferredIn - r.transferredOut,
            render: r => {
              const v = r.transferredIn - r.transferredOut;
              return v
                ? '<span class="' +
                    (v > 0 ? 'pos' : 'neg') +
                    '">' +
                    (v > 0 ? '+' : '−') +
                    fmtN(Math.abs(v)) +
                    '</span>'
                : '—';
            }
          },
          {
            key: 'adjusted',
            label: 'Adjusted',
            align: 'right',
            render: r =>
              r.adjusted
                ? '<span class="' +
                  (r.adjusted > 0 ? 'pos' : 'neg') +
                  '">' +
                  (r.adjusted > 0 ? '+' : '−') +
                  fmtN(Math.abs(r.adjusted)) +
                  '</span>'
                : '—'
          },
          { key: 'reserved', label: 'Reserved', align: 'right', render: r => fmtN(r.reserved) },
          {
            key: 'avail',
            label: 'Available',
            align: 'right',
            value: r => r.qty - r.reserved,
            render: r => '<b style="font-weight:600">' + fmtN(r.qty - r.reserved) + '</b>'
          },
          { key: 'st', label: 'Status', value: rowStatus, render: r => badge(rowStatus(r)) }
        ],
        data: () => stock,
        rowId: r => r.productId + '|' + r.warehouseId,
        pageSize: 25,
        filters: [
          {
            key: 'w',
            label: 'All warehouses',
            options: activeWh().map(w => [w.id, w.name]),
            test: (r, v) => r.warehouseId === v
          },
          {
            key: 'c',
            label: 'All categories',
            options: categories.map(c => [c.id, c.name]),
            test: (r, v) => P_BY(r.productId).categoryId === v
          },
          {
            key: 's',
            label: 'Any status',
            value: q.status || '',
            options: ['Healthy', 'Low Stock', 'Critical', 'Out of Stock', 'Overstock'],
            test: (r, v) => rowStatus(r) === v
          }
        ],
        actions: r => [
          { label: 'View product', icon: 'eye', onClick: () => navigate('product-view/' + r.productId) },
          {
            label: 'Stock History',
            icon: 'history',
            onClick: () => navigate('ledger?product=' + r.productId + '&warehouse=' + r.warehouseId)
          },
          {
            label: 'Transfer from here',
            icon: 'transfer',
            onClick: () => navigate('transfer-create?from=' + r.warehouseId + '&product=' + r.productId)
          },
          {
            label: 'Adjust',
            icon: 'sliders',
            onClick: () =>
              navigate('adjustment-create?warehouse=' + r.warehouseId + '&product=' + r.productId)
          }
        ],
        footer: rs => [
          '<b>' + rs.length + ' lines</b>',
          '',
          '',
          '',
          fmtN(sum(rs, r => r.opening)),
          fmtN(sum(rs, r => r.received)),
          fmtN(sum(rs, r => r.issued)),
          fmtN(sum(rs, r => r.transferredIn - r.transferredOut)),
          fmtN(sum(rs, r => r.adjusted)),
          fmtN(sum(rs, r => r.reserved)),
          fmtN(sum(rs, r => r.qty - r.reserved)),
          ''
        ]
      });
      $$('[data-stf]', page).forEach(
        b =>
          (b.onclick = () => {
            const s = $('[data-dt-f=s]', page);
            s.value = b.dataset.stf;
            s.dispatchEvent(new Event('change', { bubbles: true }));
          })
      );
    }
  };
};
ROUTES.ledger = (p, q) => ({
  title: 'Stock Ledger',
  crumbs: [['Inventory', 'inventory'], ['Stock Management', 'stock'], ['Stock Ledger']],
  sub: 'Immutable record of every inventory movement with running balance per product and warehouse.',
  body: '<section class="card" id="ledT"></section>',
  mount(page) {
    const range = v => e => daysBetween(e.date, NOW()) <= +v;
    mountTable(page, '#ledT', {
      title: 'Stock ledger',
      columns: ledgerColumns(),
      data: () => ledger.slice().reverse(),
      pageSize: 25,
      searchPlaceholder: 'Search transaction, product, reference',
      filters: [
        {
          key: 't',
          label: 'All transaction types',
          value: q.type || '',
          options: ['GRN', 'Goods Issue', 'Transfer', 'Adjustment', 'Sales', 'Purchase', 'Opening Balance'],
          test: (e, v) => e.type === v
        },
        {
          key: 'w',
          label: 'All warehouses',
          value: q.warehouse || '',
          options: warehouses.map(w => [w.id, w.name]),
          test: (e, v) => e.warehouseId === v
        },
        {
          key: 'p',
          label: 'All products',
          value: q.product || '',
          options: products.map(x => [x.id, x.name]),
          test: (e, v) => e.productId === v
        },
        {
          key: 'd',
          label: 'All dates',
          options: [
            ['7', 'Last 7 days'],
            ['30', 'Last 30 days'],
            ['90', 'Last 90 days']
          ],
          test: (e, v) => range(v)(e)
        }
      ],
      footer: rs => [
        '<b>' + fmtN(rs.length) + ' entries</b>',
        '',
        '',
        '',
        '',
        '',
        '<span class="pos">+' + fmtN(sum(rs, e => e.inQty)) + '</span>',
        '<span class="neg">−' + fmtN(sum(rs, e => e.outQty)) + '</span>',
        '',
        '',
        fmtM(
          sum(rs, e => e.value),
          0
        ),
        '',
        ''
      ],
      emptyTitle: 'No ledger entries',
      emptyText: 'Postings from receipts, issues, transfers and adjustments appear here.'
    });
    page.addEventListener('click', e => {
      const a = e.target.closest('[data-le]');
      if (a) {
        e.preventDefault();
        ledgerDrawer(ledger.find(x => x.id === a.dataset.le));
      }
    });
  }
});
