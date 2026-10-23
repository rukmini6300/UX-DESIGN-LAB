/* =========================================================================
   PURCHASING AND SALES
   Purchase and sales orders with their drawers and shipping.

   Provides: poQty, poRec, poDrawer, #/purchasing, soDrawer, shipSO,
   #/sales
   ========================================================================= */
'use strict';

const poQty = po => sum(po.items, i => i.qty),
  poRec = po => sum(po.items, i => i.received);
function poDrawer(po) {
  openDrawer({
    title: po.no,
    icon: 'cart',
    subtitle: esc(po.supplier) + ' · ' + badge(po.status),
    body:
      '<dl class="dl mb-16"><dt>Order date</dt><dd>' +
      fmtD(po.date) +
      '</dd><dt>Expected</dt><dd>' +
      fmtD(po.expected) +
      '</dd><dt>Deliver to</dt><dd>' +
      esc(W_BY(po.warehouseId).name) +
      '</dd><dt>Terms</dt><dd>' +
      esc(po.terms || 'Net 30') +
      '</dd><dt>Buyer</dt><dd>' +
      esc(po.createdBy) +
      '</dd></dl><div class="table-wrap auto" style="border:1px solid var(--border);border-radius:var(--r-md)"><table class="tbl compact"><thead><tr><th>Product</th><th class="right">Ordered</th><th class="right">Received</th><th class="right">Value</th></tr></thead><tbody>' +
      po.items
        .map(
          i =>
            '<tr><td>' +
            esc((P_BY(i.productId) || { name: 'Deleted' }).name) +
            '</td><td class="right num">' +
            fmtN(i.qty) +
            '</td><td class="right num">' +
            fmtN(i.received) +
            '</td><td class="right num">' +
            fmtM(i.qty * i.cost, 0) +
            '</td></tr>'
        )
        .join('') +
      '</tbody></table></div><h3 class="card-title mt-24 mb-16">Receipts</h3>' +
      (grns
        .filter(g => g.poNo === po.no)
        .map(
          g =>
            '<a class="row between" style="padding:8px 0;border-bottom:1px solid var(--border)" href="#/grn-view/' +
            g.id +
            '"><span class="mono link">' +
            esc(g.no) +
            '</span><span class="muted">' +
            fmtD(g.date) +
            '</span>' +
            badge(g.status) +
            '</a>'
        )
        .join('') || '<p class="muted">No goods receipts yet.</p>'),
    actions: [{ label: 'Close' }].concat(
      po.status === 'Open' || po.status === 'Partially Received'
        ? [
            {
              label: 'Receive goods',
              variant: 'primary',
              icon: 'receive',
              onClick: () => navigate('grn-create?po=' + po.id)
            }
          ]
        : []
    )
  });
}
ROUTES.purchasing = (p, q) => ({
  title: 'Purchase Orders',
  nav: 'purchasing',
  crumbs: [['Purchasing', 'purchasing'], ['Purchase Orders']],
  sub: 'Orders placed with suppliers. Receive goods against an open order to create a GRN.',
  actions: btn('Create Purchase Order', 'plus', 'primary', 'data-new'),
  body:
    '<div class="kpis mb-16">' +
    kpi(
      'Open orders',
      purchaseOrders.filter(x => x.status === 'Open').length,
      'cart',
      'primary',
      fmtM(
        sum(
          purchaseOrders.filter(x => x.status === 'Open'),
          po => sum(po.items, i => i.qty * i.cost)
        ),
        0
      ) + ' committed'
    ) +
    kpi(
      'Partially received',
      purchaseOrders.filter(x => x.status === 'Partially Received').length,
      'receive',
      'warning',
      'Balance still due'
    ) +
    kpi(
      'Due this week',
      purchaseOrders.filter(x => x.status === 'Open' && daysBetween(NOW(), x.expected) <= 7).length,
      'calendar',
      'purple',
      'Expected within 7 days'
    ) +
    kpi(
      'Received',
      purchaseOrders.filter(x => x.status === 'Received').length,
      'checkCircle',
      'success',
      'Fully received orders'
    ) +
    '</div><section class="card" id="poT"></section>',
  mount(page) {
    const t = mountTable(page, '#poT', {
      title: 'Purchase orders',
      sort: 'date',
      dir: -1,
      q: q.q || '',
      columns: [
        {
          key: 'no',
          label: 'PO Number',
          render: x => '<a class="link mono" data-po="' + x.id + '">' + esc(x.no) + '</a>'
        },
        { key: 'date', label: 'Order Date', render: x => fmtD(x.date) },
        { key: 'supplier', label: 'Supplier' },
        {
          key: 'wh',
          label: 'Deliver To',
          value: x => W_BY(x.warehouseId).code,
          render: x => '<span class="chip">' + esc(W_BY(x.warehouseId).code) + '</span>'
        },
        { key: 'items', label: 'Items', align: 'right', value: x => x.items.length },
        { key: 'qty', label: 'Ordered', align: 'right', value: poQty, render: x => fmtN(poQty(x)) },
        {
          key: 'rec',
          label: 'Received',
          value: x => poRec(x) / poQty(x),
          render: x => utilHTML(Math.round((poRec(x) / poQty(x)) * 100))
        },
        {
          key: 'val',
          label: 'Value',
          align: 'right',
          value: x => sum(x.items, i => i.qty * i.cost),
          render: x =>
            fmtM(
              sum(x.items, i => i.qty * i.cost),
              0
            )
        },
        { key: 'expected', label: 'Expected', render: x => fmtD(x.expected) },
        { key: 'status', label: 'Status', render: x => badge(x.status) }
      ],
      data: () => purchaseOrders,
      onRowClick: poDrawer,
      filters: [
        {
          key: 's',
          label: 'Any status',
          options: ['Open', 'Partially Received', 'Received', 'Cancelled'],
          test: (x, v) => x.status === v
        },
        {
          key: 'sp',
          label: 'All suppliers',
          options: [...new Set(purchaseOrders.map(x => x.supplier))].sort(),
          test: (x, v) => x.supplier === v
        }
      ],
      actions: x => [
        { label: 'View', icon: 'eye', onClick: () => poDrawer(x) },
        {
          label: 'Receive goods',
          icon: 'receive',
          disabled: !(x.status === 'Open' || x.status === 'Partially Received'),
          onClick: () => navigate('grn-create?po=' + x.id)
        },
        '-',
        {
          label: 'Cancel order',
          icon: 'x',
          danger: true,
          disabled: x.status !== 'Open',
          onClick: () =>
            confirmDialog({
              danger: true,
              title: 'Cancel ' + x.no + '?',
              message: 'The supplier order is closed and no goods can be received against it.',
              confirm: 'Cancel order',
              cancel: 'Keep order'
            }).then(ok => {
              if (ok) {
                x.status = 'Cancelled';
                logAudit('Purchasing', 'Updated', x.no, 'Status: Open', 'Status: Cancelled');
                toast('info', 'Order cancelled', x.no + ' closed.');
                t.refresh();
              }
            })
        }
      ]
    });
    page.addEventListener('click', e => {
      const a = e.target.closest('[data-po]');
      if (a) {
        e.preventDefault();
        poDrawer(purchaseOrders.find(x => x.id === a.dataset.po));
      }
    });
    $('[data-new]', page).onclick = () => {
      const b = el(
        '<form novalidate><div class="form-grid">' +
          F({
            name: 'pid',
            label: 'Product',
            type: 'select',
            req: true,
            span: 12,
            options: prodOptions(products.filter(x => x.status === 'Active'))
          }) +
          '</div><p class="hint mt-16">Supplier, quantity and price are proposed on the next step.</p></form>'
      );
      openModal({
        type: 'create',
        title: 'Create purchase order',
        subtitle: 'Choose the product to order',
        body: b,
        actions: [
          { label: 'Cancel' },
          {
            label: 'Continue',
            variant: 'primary',
            onClick: () => {
              if (!validateForm(b)) return false;
              const pid = formData(b).pid;
              setTimeout(() => raisePO(P_BY(pid)), 0);
            }
          }
        ]
      });
    };
  }
});
TONE.Cancelled = 'neutral';
function soDrawer(so) {
  openDrawer({
    title: so.no,
    icon: 'trending',
    subtitle: esc(so.customer) + ' · ' + badge(so.status),
    body:
      '<dl class="dl mb-16"><dt>Order date</dt><dd>' +
      fmtD(so.date) +
      '</dd><dt>Ship from</dt><dd>' +
      esc(W_BY(so.warehouseId).name) +
      '</dd><dt>Sales rep</dt><dd>' +
      esc(so.createdBy) +
      '</dd></dl><div class="table-wrap auto" style="border:1px solid var(--border);border-radius:var(--r-md)"><table class="tbl compact"><thead><tr><th>Product</th><th class="right">Qty</th><th class="right">Price</th><th class="right">Amount</th></tr></thead><tbody>' +
      so.items
        .map(
          i =>
            '<tr><td>' +
            esc((P_BY(i.productId) || { name: 'Deleted' }).name) +
            '</td><td class="right num">' +
            fmtN(i.qty) +
            '</td><td class="right num">' +
            fmtM(i.price) +
            '</td><td class="right num">' +
            fmtM(i.qty * i.price) +
            '</td></tr>'
        )
        .join('') +
      '</tbody></table></div>',
    actions: [{ label: 'Close' }]
  });
}
function shipSO(so, after) {
  const short = so.items.filter(i => i.qty > whQty(i.productId, so.warehouseId));
  if (short.length) {
    messageModal(
      'error',
      'Not enough stock to ship',
      '<p>' +
        short
          .map(
            i =>
              esc(P_BY(i.productId).name) +
              ' needs ' +
              fmtN(i.qty) +
              ', on hand ' +
              fmtN(whQty(i.productId, so.warehouseId))
          )
          .join('<br>') +
        '</p>'
    );
    return;
  }
  confirmDialog({
    title: 'Ship ' + so.no + '?',
    message:
      'Reserved stock is released and ' +
      fmtN(sum(so.items, i => i.qty)) +
      ' units are deducted from ' +
      esc(W_BY(so.warehouseId).name) +
      '.',
    confirm: 'Ship order'
  }).then(ok => {
    if (!ok) return;
    so.items.forEach(i => {
      const r = stockRow(i.productId, so.warehouseId);
      r.reserved = Math.max(0, r.reserved - i.qty);
      postMovement({
        type: 'Sales',
        pid: i.productId,
        wid: so.warehouseId,
        outQty: i.qty,
        txNo: so.no,
        ref: so.customer,
        bucket: 'issued'
      });
    });
    so.status = 'Shipped';
    logAudit('Sales', 'Updated', so.no, 'Status: Open', 'Status: Shipped');
    toast('success', 'Order shipped', so.no + ' to ' + so.customer + '. Stock deducted.');
    after();
  });
}
ROUTES.sales = () => ({
  title: 'Sales Orders',
  nav: 'sales',
  crumbs: [['Sales', 'sales'], ['Sales Orders']],
  sub: 'Customer orders. Open orders reserve stock; shipping deducts it through the ledger.',
  actions: btn('Create Sales Order', 'plus', 'primary', 'data-new'),
  body:
    '<div class="kpis mb-16">' +
    kpi(
      'Open orders',
      salesOrders.filter(x => x.status === 'Open').length,
      'clock',
      'warning',
      fmtN(
        sum(
          salesOrders.filter(x => x.status === 'Open'),
          s => sum(s.items, i => i.qty)
        )
      ) + ' units reserved'
    ) +
    kpi(
      'Shipped last 30 days',
      salesOrders.filter(x => x.status === 'Shipped' && daysBetween(x.date, NOW()) <= 30).length,
      'truck',
      'success',
      fmtM(
        sum(
          salesOrders.filter(x => x.status === 'Shipped' && daysBetween(x.date, NOW()) <= 30),
          s => sum(s.items, i => i.qty * i.price)
        ),
        0
      ) + ' revenue'
    ) +
    kpi('Customers', new Set(salesOrders.map(s => s.customer)).size, 'user', 'primary', 'Active accounts') +
    kpi(
      'Average order',
      fmtM(sum(salesOrders, s => sum(s.items, i => i.qty * i.price)) / Math.max(1, salesOrders.length), 0),
      'dollar',
      'purple',
      'All orders since go-live'
    ) +
    '</div><section class="card" id="soT"></section>',
  mount(page) {
    const t = mountTable(page, '#soT', {
      title: 'Sales orders',
      sort: 'date',
      dir: -1,
      columns: [
        {
          key: 'no',
          label: 'SO Number',
          render: x => '<a class="link mono" data-so="' + x.id + '">' + esc(x.no) + '</a>'
        },
        { key: 'date', label: 'Order Date', render: x => fmtD(x.date) },
        { key: 'customer', label: 'Customer' },
        {
          key: 'wh',
          label: 'Ship From',
          value: x => W_BY(x.warehouseId).code,
          render: x => '<span class="chip">' + esc(W_BY(x.warehouseId).code) + '</span>'
        },
        { key: 'items', label: 'Items', align: 'right', value: x => x.items.length },
        { key: 'qty', label: 'Quantity', align: 'right', value: x => sum(x.items, i => i.qty) },
        {
          key: 'val',
          label: 'Amount',
          align: 'right',
          value: x => sum(x.items, i => i.qty * i.price),
          render: x => fmtM(sum(x.items, i => i.qty * i.price))
        },
        { key: 'status', label: 'Status', render: x => badge(x.status) }
      ],
      data: () => salesOrders,
      onRowClick: soDrawer,
      filters: [
        {
          key: 's',
          label: 'Any status',
          options: ['Open', 'Shipped', 'Cancelled'],
          test: (x, v) => x.status === v
        },
        { key: 'c', label: 'All customers', options: CUSTOMERS, test: (x, v) => x.customer === v }
      ],
      actions: x => [
        { label: 'View', icon: 'eye', onClick: () => soDrawer(x) },
        {
          label: 'Ship order',
          icon: 'truck',
          disabled: x.status !== 'Open',
          onClick: () => shipSO(x, () => t.refresh())
        },
        '-',
        {
          label: 'Cancel order',
          icon: 'x',
          danger: true,
          disabled: x.status !== 'Open',
          onClick: () =>
            confirmDialog({
              danger: true,
              title: 'Cancel ' + x.no + '?',
              message: 'Reserved stock is released back to available.',
              confirm: 'Cancel order',
              cancel: 'Keep order'
            }).then(ok => {
              if (!ok) return;
              x.items.forEach(i => {
                const r = stockRow(i.productId, x.warehouseId);
                if (r) r.reserved = Math.max(0, r.reserved - i.qty);
              });
              x.status = 'Cancelled';
              logAudit('Sales', 'Updated', x.no, 'Status: Open', 'Status: Cancelled');
              toast('info', 'Order cancelled', 'Reserved stock released.');
              t.refresh();
            })
        }
      ]
    });
    page.addEventListener('click', e => {
      const a = e.target.closest('[data-so]');
      if (a) {
        e.preventDefault();
        soDrawer(salesOrders.find(x => x.id === a.dataset.so));
      }
    });
    $('[data-new]', page).onclick = () => {
      const b = el(
        '<form novalidate><div class="form-grid">' +
          F({ name: 'customer', label: 'Customer', type: 'select', req: true, span: 6, options: CUSTOMERS }) +
          F({
            name: 'wid',
            label: 'Ship from',
            type: 'select',
            req: true,
            span: 6,
            value: 'W1',
            placeholder: false,
            options: whOptions()
          }) +
          F({
            name: 'pid',
            label: 'Product',
            type: 'select',
            req: true,
            span: 8,
            options: prodOptions(products.filter(x => x.status === 'Active'))
          }) +
          F({ name: 'qty', label: 'Quantity', type: 'number', req: true, min: 1, span: 4 }) +
          '</div><p class="hint mt-16" id="soAvail">Select a product to see available stock.</p></form>'
      );
      const upd = () => {
        const d = formData(b);
        $('#soAvail', b).textContent = d.pid
          ? fmtN(whAvail(d.pid, d.wid)) +
            ' ' +
            P_BY(d.pid).uom +
            ' available at ' +
            W_BY(d.wid).code +
            ' · unit price ' +
            fmtM(P_BY(d.pid).price)
          : 'Select a product to see available stock.';
      };
      b.addEventListener('change', upd);
      openModal({
        type: 'create',
        title: 'Create sales order',
        subtitle: 'Stock is reserved when the order is saved',
        body: b,
        actions: [
          { label: 'Cancel' },
          {
            label: 'Create order',
            variant: 'primary',
            onClick: () => {
              if (
                !validateForm(b, err => {
                  const d = formData(b);
                  if (d.pid && d.qty > whAvail(d.pid, d.wid))
                    err('qty', 'Only ' + fmtN(whAvail(d.pid, d.wid)) + ' available at this warehouse');
                })
              )
                return false;
              const d = formData(b);
              const p = P_BY(d.pid);
              const so = {
                id: uid('SO'),
                no: nextNo('SO'),
                date: NOW(),
                customer: d.customer,
                warehouseId: d.wid,
                status: 'Open',
                items: [{ productId: p.id, qty: d.qty, price: p.price }],
                createdBy: CURRENT_USER.name
              };
              salesOrders.unshift(so);
              stockRow(p.id, d.wid).reserved += d.qty;
              logAudit('Sales', 'Created', so.no, '—', 'Reserved ' + d.qty + ' × ' + p.sku);
              toast('success', 'Sales order created', so.no + ' reserves ' + fmtN(d.qty) + ' ' + p.uom + '.');
              t.refresh();
            }
          }
        ]
      });
    };
  }
});
