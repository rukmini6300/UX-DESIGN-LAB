/* =========================================================================
   INVENTORY PLANNING
   Reorder levels, low stock and expiry tracking.

   Provides: avgDaily, LEAD_DAYS, suggestReorder, daysCover, #/reorder,
   #/low-stock, #/expiry
   ========================================================================= */
'use strict';

const avgDaily = (pid, days) => outflow(pid, days || 90) / (days || 90);
const LEAD_DAYS = 14;
const suggestReorder = p => Math.max(p.min, Math.ceil(avgDaily(p.id) * LEAD_DAYS + p.safety));
const daysCover = p => {
  const a = avgDaily(p.id, 30);
  const q = productQty(p.id) - productReserved(p.id);
  return a > 0 ? Math.floor(q / a) : null;
};
ROUTES.reorder = () => {
  const pending = {};
  return {
    title: 'Reorder Levels',
    crumbs: [['Inventory', 'inventory'], ['Inventory Planning', 'reorder'], ['Reorder Levels']],
    sub:
      'Set stocking rules per product. Suggestions use average daily demand over 90 days × ' +
      LEAD_DAYS +
      '-day lead time + safety stock.',
    actions:
      btn('Discard changes', 'undo', '', 'data-reset disabled') +
      btn('Save changes', 'save', 'primary', 'data-save disabled'),
    body: '<section class="card" id="rT"></section>',
    mount(page) {
      const sync = () => {
        const n = Object.keys(pending).length;
        $('[data-save]', page).disabled = !n;
        $('[data-reset]', page).disabled = !n;
        $('[data-save] span', page).textContent = n
          ? 'Save ' + n + ' change' + (n > 1 ? 's' : '')
          : 'Save changes';
      };
      const val = (p, k) => (pending[p.id] && pending[p.id][k] != null ? pending[p.id][k] : p[k]);
      const inp = (p, k) =>
        '<input class="input input-sm right num" style="width:84px" type="number" min="0" data-ro="' +
        p.id +
        '" data-rk="' +
        k +
        '" value="' +
        val(p, k) +
        '" aria-label="' +
        k +
        ' for ' +
        esc(p.sku) +
        '">';
      const t = mountTable(page, '#rT', {
        title: 'Reorder levels',
        selectable: true,
        pageSize: 25,
        columns: [
          { key: 'name', label: 'Product', value: p => p.name + ' ' + p.sku, render: p => prodCell(p) },
          {
            key: 'avail',
            label: 'Available',
            align: 'right',
            value: p => productQty(p.id) - productReserved(p.id),
            render: p => fmtN(productQty(p.id) - productReserved(p.id))
          },
          {
            key: 'demand',
            label: 'Avg daily demand',
            align: 'right',
            value: p => avgDaily(p.id),
            render: p => avgDaily(p.id).toFixed(1)
          },
          {
            key: 'min',
            label: 'Minimum',
            align: 'right',
            filter: false,
            render: p => inp(p, 'min'),
            export: true
          },
          {
            key: 'reorder',
            label: 'Reorder Level',
            align: 'right',
            filter: false,
            render: p => inp(p, 'reorder')
          },
          { key: 'max', label: 'Maximum', align: 'right', filter: false, render: p => inp(p, 'max') },
          { key: 'safety', label: 'Safety', align: 'right', filter: false, render: p => inp(p, 'safety') },
          {
            key: 'sug',
            label: 'Suggested reorder',
            align: 'right',
            value: suggestReorder,
            render: p => {
              const s = suggestReorder(p);
              const d = s - val(p, 'reorder');
              return (
                fmtN(s) +
                (Math.abs(d) > val(p, 'reorder') * 0.15
                  ? ' <span class="' +
                    (d > 0 ? 'neg' : 'pos') +
                    '" style="font-size:12px">' +
                    (d > 0 ? '+' : '') +
                    fmtN(d) +
                    '</span>'
                  : '')
              );
            }
          },
          { key: 'st', label: 'Status', value: pStatus, render: p => badge(pStatus(p)) }
        ],
        data: () => products.filter(p => p.status !== 'Inactive'),
        rowClass: p => (pending[p.id] ? 'changed-row' : ''),
        filters: [
          {
            key: 'c',
            label: 'All categories',
            options: categories.map(c => [c.id, c.name]),
            test: (p, v) => p.categoryId === v
          },
          {
            key: 's',
            label: 'Any stock level',
            options: ['Healthy', 'Low Stock', 'Critical', 'Out of Stock', 'Overstock'],
            test: (p, v) => pStatus(p) === v
          }
        ],
        bulkActions: [
          {
            label: 'Apply suggested reorder level',
            icon: 'target',
            onClick: ids => {
              ids.forEach(id => {
                const p = P_BY(id);
                pending[id] = Object.assign(pending[id] || {}, { reorder: suggestReorder(p) });
              });
              t.clearSelection();
              sync();
              toast(
                'info',
                'Suggestions applied',
                ids.length + ' products updated. Save to keep the changes.'
              );
            }
          }
        ]
      });
      page.addEventListener('input', e => {
        const i = e.target.closest('[data-ro]');
        if (!i) return;
        const id = i.dataset.ro,
          k = i.dataset.rk;
        const p = P_BY(id);
        const v = i.value === '' ? 0 : Math.max(0, +i.value);
        pending[id] = pending[id] || {};
        if (v === p[k]) {
          delete pending[id][k];
          if (!Object.keys(pending[id]).length) delete pending[id];
        } else pending[id][k] = v;
        i.closest('tr').classList.toggle('changed-row', !!pending[id]);
        sync();
      });
      $('[data-reset]', page).onclick = () => {
        Object.keys(pending).forEach(k => delete pending[k]);
        t.refresh();
        sync();
      };
      $('[data-save]', page).onclick = () => {
        const bad = Object.keys(pending).filter(id => {
          const p = P_BY(id);
          const m = val(p, 'min'),
            r = val(p, 'reorder'),
            x = val(p, 'max');
          return !(m <= r && r < x);
        });
        if (bad.length) {
          messageModal(
            'error',
            'Check the stocking rules',
            '<p>Minimum must not exceed the reorder level, and the reorder level must be below maximum, for:</p><p class="mt-8">' +
              bad.map(id => '<b>' + esc(P_BY(id).name) + '</b>').join(', ') +
              '</p>'
          );
          return;
        }
        const n = Object.keys(pending).length;
        Object.entries(pending).forEach(([id, ch]) => {
          const p = P_BY(id);
          Object.entries(ch).forEach(([k, v]) => {
            logAudit(
              'Inventory',
              'Updated',
              p.sku,
              FIELD_LABELS[k] + ': ' + p[k],
              FIELD_LABELS[k] + ': ' + v
            );
            p[k] = v;
          });
          p.updatedAt = NOW();
          p.updatedBy = CURRENT_USER.name;
          delete pending[id];
        });
        t.refresh();
        sync();
        toast('success', 'Reorder levels saved', n + ' product' + (n > 1 ? 's' : '') + ' updated.');
      };
    }
  };
};
ROUTES['low-stock'] = () => {
  const list = () =>
    products.filter(
      p => p.status === 'Active' && ['Low Stock', 'Critical', 'Out of Stock'].includes(pStatus(p))
    );
  const L = list();
  return {
    title: 'Low Stock',
    crumbs: [['Inventory', 'inventory'], ['Inventory Planning', 'reorder'], ['Low Stock']],
    sub:
      L.length +
      ' active products at or below their reorder level. Open purchase orders are shown as on order.',
    body:
      '<div class="kpis mb-16">' +
      kpi(
        'Out of stock',
        L.filter(p => pStatus(p) === 'Out of Stock').length,
        'xCircle',
        'danger',
        'No available quantity'
      ) +
      kpi(
        'Critical',
        L.filter(p => pStatus(p) === 'Critical').length,
        'alert',
        'warning',
        'Below 50% of reorder level'
      ) +
      kpi(
        'Low stock',
        L.filter(p => pStatus(p) === 'Low Stock').length,
        'target',
        'primary',
        'At or below reorder level'
      ) +
      kpi(
        'Covered by open POs',
        L.filter(p => onOrder(p.id) > 0).length,
        'cart',
        'success',
        fmtN(sum(L, p => onOrder(p.id))) + ' units on order'
      ) +
      '</div><section class="card" id="lsT"></section>',
    mount(page) {
      const t = mountTable(page, '#lsT', {
        title: 'Low stock',
        selectable: true,
        sort: 'cover',
        columns: [
          { key: 'name', label: 'Product', value: p => p.name + ' ' + p.sku, render: p => prodCell(p) },
          { key: 'cat', label: 'Category', value: p => CAT_BY(p.categoryId).name },
          {
            key: 'avail',
            label: 'Available',
            align: 'right',
            value: p => productQty(p.id) - productReserved(p.id),
            render: p => '<b>' + fmtN(productQty(p.id) - productReserved(p.id)) + '</b>'
          },
          { key: 'reorder', label: 'Reorder Level', align: 'right' },
          {
            key: 'short',
            label: 'Shortfall',
            align: 'right',
            value: p => Math.max(0, p.reorder - productQty(p.id)),
            render: p => '<span class="neg">' + fmtN(Math.max(0, p.reorder - productQty(p.id))) + '</span>'
          },
          {
            key: 'oo',
            label: 'On Order',
            align: 'right',
            value: p => onOrder(p.id),
            render: p => (onOrder(p.id) ? fmtN(onOrder(p.id)) : '<span class="subtle">—</span>')
          },
          {
            key: 'sug',
            label: 'Suggested order',
            align: 'right',
            value: p => Math.max(0, p.max - productQty(p.id) - onOrder(p.id)),
            render: p => fmtN(Math.max(0, p.max - productQty(p.id) - onOrder(p.id)))
          },
          {
            key: 'cover',
            label: 'Days of cover',
            align: 'right',
            value: p => {
              const d = daysCover(p);
              return d == null ? 9999 : d;
            },
            render: p => {
              const d = daysCover(p);
              return d == null
                ? '<span class="subtle">No demand</span>'
                : '<span class="' + (d < 7 ? 'neg' : '') + '">' + d + ' days</span>';
            }
          },
          { key: 'st', label: 'Status', value: pStatus, render: p => badge(pStatus(p)) }
        ],
        data: list,
        actions: p => [
          { label: 'Raise purchase order', icon: 'cart', onClick: () => raisePO(p) },
          {
            label: 'Transfer stock',
            icon: 'transfer',
            onClick: () => {
              const src = stock
                .filter(s => s.productId === p.id && s.qty - s.reserved > 0)
                .sort((a, b) => b.qty - a.qty)[0];
              navigate('transfer-create?product=' + p.id + (src ? '&from=' + src.warehouseId : ''));
            }
          },
          { label: 'View product', icon: 'eye', onClick: () => navigate('product-view/' + p.id) },
          { label: 'Edit reorder rules', icon: 'target', onClick: () => navigate('reorder') }
        ],
        bulkActions: [
          {
            label: 'Raise purchase orders',
            icon: 'cart',
            onClick: ids => {
              const by = {};
              ids.forEach(id => {
                const p = P_BY(id);
                const s = SUPPLIERS[p.categoryId];
                (by[s] = by[s] || []).push(p);
              });
              const made = [];
              Object.entries(by).forEach(([s, ps]) => {
                const po = {
                  id: uid('PO'),
                  no: nextNo('PO'),
                  date: NOW(),
                  supplier: s,
                  warehouseId: ps[0].defaultWarehouseId,
                  status: 'Open',
                  expected: addDays(NOW(), 10),
                  items: ps.map(p => ({
                    productId: p.id,
                    qty: Math.max(p.reorder, p.max - productQty(p.id) - onOrder(p.id)),
                    received: 0,
                    cost: p.cost
                  })),
                  createdBy: CURRENT_USER.name,
                  terms: 'Net 30'
                };
                purchaseOrders.unshift(po);
                made.push(po.no);
                logAudit('Purchasing', 'Created', po.no, '—', 'Replenishment for ' + ps.length + ' products');
              });
              toast(
                'success',
                made.length + ' purchase order' + (made.length > 1 ? 's' : '') + ' created',
                made.join(', ') + '.',
                { label: 'View purchase orders', onClick: () => navigate('purchasing') }
              );
              t.clearSelection();
            }
          }
        ],
        emptyIcon: 'checkCircle',
        emptyTitle: 'Stock levels are healthy',
        emptyText: 'No active product is at or below its reorder level.'
      });
    }
  };
};
ROUTES.expiry = () => {
  const list = () => batches.filter(b => b.qty > 0 && b.expiry);
  const L = list();
  const val = bs => sum(bs, b => b.qty * P_BY(b.productId).cost);
  const ex = L.filter(b => expStatus(b) === 'Expired'),
    soon = L.filter(b => expStatus(b) === 'Expiring Soon'),
    q90 = L.filter(b => expStatus(b) === 'Within 90 Days');
  return {
    title: 'Expiry Tracking',
    crumbs: [['Inventory', 'inventory'], ['Inventory Planning', 'reorder'], ['Expiry Tracking']],
    sub:
      'Batches of expiry-controlled products on hand, earliest expiry first. Warning window: ' +
      SETTINGS.expiryWarn +
      ' days.',
    body:
      '<div class="kpis mb-16">' +
      kpi('Expired', ex.length + ' batches', 'xCircle', 'danger', fmtM(val(ex), 0) + ' to write off') +
      kpi(
        'Expiring in ' + SETTINGS.expiryWarn + ' days',
        soon.length + ' batches',
        'hourglass',
        'warning',
        fmtM(val(soon), 0) + ' at risk'
      ) +
      kpi(
        'Within 90 days',
        q90.length + ' batches',
        'calendar',
        'primary',
        fmtN(sum(q90, b => b.qty)) + ' units'
      ) +
      kpi(
        'Tracked batches',
        L.length,
        'layers',
        'success',
        products.filter(p => p.expiry).length + ' expiry-controlled products'
      ) +
      '</div><section class="card" id="eT"></section>',
    mount(page) {
      mountTable(page, '#eT', {
        title: 'Expiry tracking',
        sort: 'expiry',
        columns: [
          {
            key: 'p',
            label: 'Product',
            value: b => P_BY(b.productId).name,
            render: b => prodCell(P_BY(b.productId))
          },
          { key: 'batch', label: 'Batch', render: b => '<span class="mono">' + esc(b.batch) + '</span>' },
          {
            key: 'wh',
            label: 'Warehouse',
            value: b => W_BY(b.warehouseId).code,
            render: b => '<span class="chip">' + esc(W_BY(b.warehouseId).code) + '</span>'
          },
          { key: 'received', label: 'Received', render: b => fmtD(b.received) },
          { key: 'expiry', label: 'Expiry Date', render: b => fmtD(b.expiry) },
          {
            key: 'days',
            label: 'Days left',
            align: 'right',
            value: b => daysBetween(NOW(), b.expiry),
            render: b => {
              const d = daysBetween(NOW(), b.expiry);
              return (
                '<span class="' +
                (d < 0 ? 'neg' : d <= SETTINGS.expiryWarn ? 'neg' : '') +
                '">' +
                (d < 0 ? Math.abs(d) + ' days ago' : d + ' days') +
                '</span>'
              );
            }
          },
          {
            key: 'qty',
            label: 'Quantity',
            align: 'right',
            render: b => fmtN(b.qty) + ' ' + esc(P_BY(b.productId).uom)
          },
          {
            key: 'value',
            label: 'Value',
            align: 'right',
            value: b => b.qty * P_BY(b.productId).cost,
            render: b => fmtM(b.qty * P_BY(b.productId).cost)
          },
          { key: 'st', label: 'Status', value: expStatus, render: b => badge(expStatus(b)) }
        ],
        data: list,
        filters: [
          {
            key: 's',
            label: 'Any status',
            options: ['Expired', 'Expiring Soon', 'Within 90 Days', 'Good'],
            test: (b, v) => expStatus(b) === v
          },
          {
            key: 'w',
            label: 'All warehouses',
            options: activeWh().map(w => [w.id, w.code]),
            test: (b, v) => b.warehouseId === v
          }
        ],
        actions: b => [
          {
            label: 'Write off expired stock',
            icon: 'trash',
            danger: expStatus(b) === 'Expired',
            onClick: () =>
              navigate(
                'adjustment-create?type=Expiry&warehouse=' +
                  b.warehouseId +
                  '&product=' +
                  b.productId +
                  '&qty=' +
                  b.qty +
                  '&reason=' +
                  encodeURIComponent('Expired batch ' + b.batch) +
                  '&ref=' +
                  b.batch
              )
          },
          {
            label: 'Transfer for faster use',
            icon: 'transfer',
            onClick: () => navigate('transfer-create?from=' + b.warehouseId + '&product=' + b.productId)
          },
          { label: 'View product', icon: 'eye', onClick: () => navigate('product-view/' + b.productId) }
        ],
        emptyTitle: 'No expiry-controlled stock',
        emptyText: 'Batches of products with expiry tracking appear here after receipt.'
      });
    }
  };
};
