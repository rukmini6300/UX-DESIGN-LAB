/* =========================================================================
   STOCK ADJUSTMENTS
   Adjustment list, form, details and approval.

   Provides: ADJ_TYPES, adjDiff, adjValue, #/stock-adjustment,
   adjustmentFormPage, #/adjustment-create, #/adjustment-edit,
   adjustmentAction, #/adjustment-view
   ========================================================================= */
'use strict';

const ADJ_TYPES = ['Increase', 'Decrease', 'Damage', 'Loss', 'Found Stock', 'Correction', 'Expiry'];
const adjDiff = i => (i.physicalQty == null ? 0 : i.physicalQty) - (i.systemQty || 0);
const adjValue = a => sum(a.items, i => adjDiff(i) * (i.cost || 0));
ROUTES['stock-adjustment'] = (p, q) => {
  const c = s => stockAdjustments.filter(a => a.status === s);
  return {
    title: 'Stock Adjustment',
    crumbs: [['Inventory', 'inventory'], ['Stock Management', 'stock'], ['Stock Adjustment']],
    sub:
      'Correct on-hand quantities for damage, loss, found stock and count variances. Adjustments above ' +
      fmtM(SETTINGS.adjLimit, 0) +
      ' need manager approval.',
    actions: btn('Create Adjustment', 'plus', 'primary', 'data-go="adjustment-create"'),
    body:
      '<div class="kpis mb-16">' +
      kpi('Drafts', c('Draft').length, 'edit', 'primary', 'Not yet submitted') +
      kpi(
        'Awaiting approval',
        c('Submitted').length,
        'shield',
        'warning',
        fmtM(sum(c('Submitted'), adjValue), 0) + ' net value'
      ) +
      kpi(
        'Approved, not posted',
        c('Approved').length,
        'checkCircle',
        'purple',
        'Ready to update inventory'
      ) +
      kpi(
        'Posted this month',
        c('Posted').filter(a => a.postedAt >= new Date(NOW().getFullYear(), NOW().getMonth(), 1)).length,
        'book',
        'success',
        fmtM(
          sum(
            c('Posted').filter(a => a.postedAt >= new Date(NOW().getFullYear(), NOW().getMonth(), 1)),
            adjValue
          ),
          0
        ) + ' net value'
      ) +
      '</div><section class="card" id="aT"></section>',
    mount(page) {
      const t = mountTable(page, '#aT', {
        title: 'Stock adjustments',
        selectable: true,
        sort: 'date',
        dir: -1,
        columns: [
          {
            key: 'no',
            label: 'Adjustment No',
            render: a => '<a class="link mono" href="#/adjustment-view/' + a.id + '">' + esc(a.no) + '</a>'
          },
          { key: 'date', label: 'Date', render: a => fmtD(a.date) },
          {
            key: 'wh',
            label: 'Warehouse',
            value: a => W_BY(a.warehouseId).code,
            render: a => '<span class="chip">' + esc(W_BY(a.warehouseId).code) + '</span>'
          },
          { key: 'type', label: 'Adjustment Type' },
          { key: 'reason', label: 'Reason', render: a => '<span class="muted">' + esc(a.reason) + '</span>' },
          { key: 'items', label: 'Items', align: 'right', value: a => a.items.length },
          {
            key: 'qty',
            label: 'Net Qty',
            align: 'right',
            value: a => sum(a.items, adjDiff),
            render: a => {
              const v = sum(a.items, adjDiff);
              return (
                '<span class="' +
                (v >= 0 ? 'pos' : 'neg') +
                '">' +
                (v > 0 ? '+' : v < 0 ? '−' : '') +
                fmtN(Math.abs(v)) +
                '</span>'
              );
            }
          },
          {
            key: 'value',
            label: 'Value',
            align: 'right',
            value: adjValue,
            render: a =>
              '<span class="' + (adjValue(a) >= 0 ? 'pos' : 'neg') + '">' + fmtM(adjValue(a)) + '</span>'
          },
          { key: 'ref', label: 'Reference', value: a => a.reference },
          { key: 'by', label: 'Created By', value: a => a.createdBy, render: a => userCell(a.createdBy) },
          { key: 'status', label: 'Status', render: a => badge(a.status) }
        ],
        data: () => stockAdjustments,
        onRowClick: a => navigate('adjustment-view/' + a.id),
        filters: [
          {
            key: 's',
            label: 'Any status',
            options: ['Draft', 'Submitted', 'Approved', 'Posted', 'Rejected'],
            test: (a, v) => a.status === v
          },
          { key: 't', label: 'All types', options: ADJ_TYPES, test: (a, v) => a.type === v },
          {
            key: 'w',
            label: 'All warehouses',
            options: activeWh().map(w => [w.id, w.code]),
            test: (a, v) => a.warehouseId === v
          }
        ],
        actions: a => [
          { label: 'View', icon: 'eye', onClick: () => navigate('adjustment-view/' + a.id) },
          {
            label: 'Edit',
            icon: 'edit',
            disabled: a.status !== 'Draft',
            onClick: () => navigate('adjustment-edit/' + a.id)
          },
          { label: 'Duplicate', icon: 'copy', onClick: () => duplicateDoc('adjustment', a) },
          '-',
          {
            label: 'Delete',
            icon: 'trash',
            danger: true,
            onClick: () => deleteDoc('adjustment', a, () => t.refresh())
          }
        ]
      });
    }
  };
};
function adjustmentFormPage(a, q) {
  q = q || {};
  const editing = !!a;
  const doc = a
    ? JSON.parse(JSON.stringify(a))
    : {
        no: 'ADJ-26' + String(counters.ADJ + 1).padStart(5, '0'),
        date: NOW(),
        warehouseId: q.warehouse || 'W1',
        type: q.type || 'Correction',
        reason: q.reason || '',
        reference: q.ref || '',
        items: []
      };
  if (!a && q.product) {
    const qty = whQty(q.product, doc.warehouseId);
    doc.items = [
      {
        productId: q.product,
        systemQty: qty,
        physicalQty: q.qty != null ? Math.max(0, qty - Number(q.qty)) : null,
        cost: P_BY(q.product).cost,
        reason: q.reason || ''
      }
    ];
  }
  return {
    title: editing ? 'Edit Adjustment' : 'Create Stock Adjustment',
    nav: 'stock-adjustment',
    crumbs: [
      ['Inventory', 'inventory'],
      ['Stock Management', 'stock'],
      ['Stock Adjustment', 'stock-adjustment'],
      [editing ? doc.no : 'Create Adjustment']
    ],
    sub: 'Draft → Submitted → Approval → Posted. Stock changes only when the adjustment is posted.',
    body:
      '<form class="card" id="aform" novalidate><div class="form-section">' +
      sectionHead(1, 'Adjustment details', 'Where and why stock is being corrected') +
      '<div class="form-grid">' +
      F({ name: 'no', label: 'Adjustment Number', span: 3, value: doc.no, readonly: true }) +
      F({ name: 'date', label: 'Date', type: 'date', req: true, span: 3, value: isoDate(doc.date) }) +
      F({
        name: 'warehouseId',
        label: 'Warehouse',
        type: 'select',
        req: true,
        span: 3,
        value: doc.warehouseId,
        placeholder: false,
        options: whOptions()
      }) +
      F({
        name: 'type',
        label: 'Adjustment Type',
        type: 'select',
        req: true,
        span: 3,
        value: doc.type,
        placeholder: false,
        options: ADJ_TYPES
      }) +
      F({
        name: 'reason',
        label: 'Reason',
        req: true,
        span: 6,
        value: doc.reason,
        ph: 'e.g. Pallet damaged by forklift in aisle 4'
      }) +
      F({
        name: 'reference',
        label: 'Reference',
        span: 3,
        value: doc.reference,
        ph: 'Count sheet, incident or claim number'
      }) +
      '<div class="s-3" id="typeHint"></div></div></div>' +
      '<div class="form-section" style="padding-bottom:0">' +
      sectionHead(
        2,
        'Items',
        'Enter the physical quantity; the difference is calculated against system stock'
      ) +
      '</div><div id="aLines"></div>' +
      '<div class="form-actions"><span class="spacer"></span>' +
      btn(
        'Cancel',
        '',
        '',
        'type="button" data-go="' + (editing ? 'adjustment-view/' + a.id : 'stock-adjustment') + '"'
      ) +
      btn('Save Draft', 'save', '', 'type="button" data-act="Draft"') +
      btn('Submit for Approval', 'send', 'primary', 'type="button" data-act="Submitted"') +
      '</div></form>',
    mount(page) {
      const form = $('#aform', page);
      const wid = () => $('[name=warehouseId]', form).value,
        type = () => $('[name=type]', form).value;
      const dir = () =>
        ({ Increase: 1, 'Found Stock': 1, Decrease: -1, Damage: -1, Loss: -1, Expiry: -1, Correction: 0 })[
          type()
        ];
      const hint = () => {
        const d = dir();
        $('#typeHint', form).innerHTML =
          '<div class="alert ' +
          (d > 0 ? 'alert-success' : d < 0 ? 'alert-warning' : 'alert-info') +
          '" style="margin-top:22px;padding:8px 12px">' +
          icon(d > 0 ? 'arrowUp' : d < 0 ? 'arrowDown' : 'refresh', 15) +
          '<span>' +
          (d > 0
            ? 'Physical quantity must be higher than system stock'
            : d < 0
              ? 'Physical quantity must be lower than system stock'
              : 'Quantity can move in either direction') +
          '</span></div>';
      };
      hint();
      const pool = () =>
        dir() > 0
          ? products.filter(p => p.status === 'Active')
          : products.filter(p => whQty(p.id, wid()) > 0);
      const le = LineEditor({
        lines: doc.items,
        newLine: () => ({ productId: '', systemQty: 0, physicalQty: null, cost: 0, reason: '' }),
        rerenderOn: ['productId'],
        focusAfter: { productId: 'physicalQty' },
        onChange: (l, k) => {
          if (k === 'productId') {
            const p = P_BY(l.productId);
            l.systemQty = p ? whQty(p.id, wid()) : 0;
            l.cost = p ? p.cost : 0;
          }
        },
        cols: [
          { label: 'Product', req: true },
          { label: 'System Qty', align: 'right' },
          { label: 'Physical Qty', req: true, w: '120px' },
          { label: 'Difference', align: 'right' },
          { label: 'Unit Cost', align: 'right' },
          { label: 'Adjustment Value', align: 'right' },
          { label: 'Reason' }
        ],
        calc: (l, k) => {
          const d = adjDiff(l);
          if (k === 'diff')
            return l.physicalQty == null
              ? '—'
              : '<b class="' +
                  (d > 0 ? 'pos' : d < 0 ? 'neg' : 'muted') +
                  '">' +
                  (d > 0 ? '+' : d < 0 ? '−' : '') +
                  fmtN(Math.abs(d)) +
                  '</b>';
          if (k === 'val')
            return l.physicalQty == null
              ? '—'
              : '<span class="' + (d >= 0 ? 'pos' : 'neg') + '">' + fmtM(d * l.cost) + '</span>';
        },
        rowHTML: l =>
          '<td>' +
          lineProdSelect(l, pool()) +
          '</td><td class="ro right num">' +
          (l.productId ? fmtN(l.systemQty) : '—') +
          '</td><td><input class="input right" type="number" min="0" data-k="physicalQty" value="' +
          (l.physicalQty == null ? '' : l.physicalQty) +
          '" aria-label="Physical quantity"></td><td class="ro right num" data-calc="diff">' +
          (l.physicalQty == null ? '—' : '') +
          '</td><td class="ro right num">' +
          (l.productId ? fmtM(l.cost) : '—') +
          '</td><td class="ro right num" data-calc="val"></td><td><input class="input" data-k="reason" value="' +
          esc(l.reason || '') +
          '" placeholder="Line reason" aria-label="Line reason"></td>',
        validateLine: l => {
          const e = {};
          if (!l.productId) e.productId = 'Select a product';
          if (l.physicalQty == null || l.physicalQty < 0) e.physicalQty = 'Enter the counted quantity';
          else {
            const d = adjDiff(l),
              D = dir();
            if (d === 0) e.physicalQty = 'Physical quantity equals system quantity';
            else if (D > 0 && d < 0) e.physicalQty = type() + ' requires a higher physical quantity';
            else if (D < 0 && d > 0) e.physicalQty = type() + ' requires a lower physical quantity';
          }
          return e;
        },
        footer: ls => {
          const q = sum(ls, adjDiff),
            v = sum(ls, l => adjDiff(l) * l.cost);
          return (
            '<span class="muted">' +
            ls.filter(l => l.productId).length +
            ' items</span><span>Net quantity <b class="num ' +
            (q >= 0 ? 'pos' : 'neg') +
            '">' +
            (q > 0 ? '+' : '') +
            fmtN(q) +
            '</b></span><span>Net value <b class="num ' +
            (v >= 0 ? 'pos' : 'neg') +
            '">' +
            fmtM(v) +
            '</b></span>' +
            (Math.abs(v) > SETTINGS.adjLimit ? badge('Manager approval required', 'warning') : '')
          );
        }
      });
      $('#aLines', page).append(le.el);
      const refreshSys = () => {
        le.lines.forEach(l => {
          if (l.productId) l.systemQty = whQty(l.productId, wid());
        });
        le.render();
      };
      $('[name=warehouseId]', form).addEventListener('change', () => {
        le.lines.splice(0, le.lines.length, {
          productId: '',
          systemQty: 0,
          physicalQty: null,
          cost: 0,
          reason: ''
        });
        le.render();
      });
      $('[name=type]', form).addEventListener('change', () => {
        hint();
        refreshSys();
      });
      $$('[data-act]', page).forEach(
        b =>
          (b.onclick = () => {
            if (!validateForm(form) || !le.validate()) return;
            const d = formData(form);
            let x = a;
            if (!x) {
              x = {
                id: uid('ADJ'),
                no: nextNo('ADJ'),
                history: [],
                createdBy: CURRENT_USER.name,
                createdAt: NOW()
              };
              stockAdjustments.unshift(x);
              hist(x, 'Draft', CURRENT_USER.name, NOW(), 'Adjustment created');
              logAudit('Stock Adjustment', 'Created', x.no, '—', 'Status: Draft');
            }
            Object.assign(x, {
              date: new Date(d.date + 'T09:00'),
              warehouseId: d.warehouseId,
              type: d.type,
              reason: d.reason,
              reference: d.reference,
              status: 'Draft',
              items: le.lines.map(l => ({
                productId: l.productId,
                systemQty: l.systemQty,
                physicalQty: l.physicalQty,
                cost: l.cost,
                reason: l.reason || d.reason
              }))
            });
            if (b.dataset.act === 'Submitted') {
              x.status = 'Submitted';
              hist(x, 'Submitted', CURRENT_USER.name, NOW(), 'Sent for approval');
              logAudit('Stock Adjustment', 'Updated', x.no, 'Status: Draft', 'Status: Submitted');
            }
            toast(
              'success',
              x.status === 'Submitted' ? 'Adjustment submitted' : 'Draft saved',
              x.no + ' · net ' + fmtM(adjValue(x)) + '.'
            );
            navigate('adjustment-view/' + x.id);
          })
      );
    }
  };
}
ROUTES['adjustment-create'] = (p, q) => adjustmentFormPage(null, q);
ROUTES['adjustment-edit'] = id => {
  const a = stockAdjustments.find(x => x.id === id);
  if (!a) return ROUTES['not-found']();
  return a.status === 'Draft' ? adjustmentFormPage(a) : ROUTES['adjustment-view'](id);
};
function adjustmentAction(a, act) {
  const set = (s, note) => {
    const o = a.status;
    a.status = s;
    hist(a, s, CURRENT_USER.name, NOW(), note);
    logAudit('Stock Adjustment', 'Updated', a.no, 'Status: ' + o, 'Status: ' + s);
    renderRoute();
  };
  if (act === 'submit') {
    set('Submitted', 'Sent for approval');
    toast('success', 'Adjustment submitted', a.no + ' is waiting for approval.');
  }
  if (act === 'approve')
    confirmDialog({
      title: 'Approve ' + a.no + '?',
      message:
        'Net impact ' +
        fmtM(adjValue(a)) +
        ' at ' +
        esc(W_BY(a.warehouseId).name) +
        '. Approved adjustments can be posted to inventory.',
      confirm: 'Approve'
    }).then(ok => {
      if (ok) {
        a.approvedBy = CURRENT_USER.name;
        set('Approved', 'Approved');
        toast('success', 'Adjustment approved', 'Post it to update stock.');
      }
    });
  if (act === 'reject')
    reasonModal('Reject ' + a.no, 'Reason for rejection', r => {
      set('Rejected', r);
      toast('warning', 'Adjustment rejected', a.no + ' was returned to ' + a.createdBy + '.');
    });
  if (act === 'post') {
    const bad = a.items.filter(i => adjDiff(i) < 0 && -adjDiff(i) > whQty(i.productId, a.warehouseId));
    if (bad.length) {
      messageModal(
        'error',
        'Adjustment can’t be posted',
        '<p>Posting would make stock negative for:</p><ul style="margin-top:8px;padding-left:18px;list-style:disc">' +
          bad
            .map(
              i =>
                '<li>' +
                esc(P_BY(i.productId).name) +
                ': reduce by ' +
                fmtN(-adjDiff(i)) +
                ', on hand ' +
                fmtN(whQty(i.productId, a.warehouseId)) +
                '</li>'
            )
            .join('') +
          '</ul>'
      );
      return;
    }
    confirmDialog({
      title: 'Post ' + a.no + ' to inventory?',
      message:
        'On-hand stock at ' +
        esc(W_BY(a.warehouseId).name) +
        ' changes by ' +
        fmtN(sum(a.items, adjDiff)) +
        ' units (' +
        fmtM(adjValue(a)) +
        '). Ledger entries are created and cannot be edited.',
      confirm: 'Post adjustment'
    }).then(ok => {
      if (!ok) return;
      a.items.forEach(i => {
        const d = adjDiff(i);
        postMovement({
          type: 'Adjustment',
          pid: i.productId,
          wid: a.warehouseId,
          inQty: d > 0 ? d : 0,
          outQty: d < 0 ? -d : 0,
          txNo: a.no,
          ref: a.type,
          bucket: 'adjusted',
          cost: i.cost
        });
      });
      a.postedAt = NOW();
      set('Posted', 'Inventory updated');
      toast(
        'success',
        'Adjustment posted',
        'Stock updated for ' + a.items.length + ' product' + (a.items.length > 1 ? 's' : '') + '.',
        { label: 'View ledger', onClick: () => navigate('ledger?type=Adjustment') }
      );
    });
  }
}
ROUTES['adjustment-view'] = id => {
  const a = stockAdjustments.find(x => x.id === id);
  if (!a) return ROUTES['not-found']();
  const A =
    {
      Draft: [
        ['Edit', 'edit', '', 'edit'],
        ['Delete', 'trash', 'danger-ghost', 'delete'],
        ['Submit', 'send', 'primary', 'submit']
      ],
      Submitted: [
        ['Reject', 'x', 'danger-ghost', 'reject'],
        ['Approve', 'check', 'primary', 'approve']
      ],
      Approved: [['Post to Inventory', 'book', 'success', 'post']]
    }[a.status] || [];
  return {
    title: a.no,
    nav: 'stock-adjustment',
    crumbs: [
      ['Inventory', 'inventory'],
      ['Stock Management', 'stock'],
      ['Stock Adjustment', 'stock-adjustment'],
      [a.no]
    ],
    titleHTML: 'Stock Adjustment <span class="mono" style="font-weight:600">' + esc(a.no) + '</span>',
    sub: esc(a.type) + ' at ' + esc(W_BY(a.warehouseId).name) + ' · ' + fmtD(a.date),
    actions: btn('Duplicate', 'copy', '', 'data-dup') + btn('Print', 'print', '', 'data-print'),
    body:
      docHeaderCard(
        a.no,
        a.status,
        flowFor('adjustment', a.status, histMeta(a, 'adjustment')),
        A.map(x => btn(x[0], x[1], x[2], 'data-aa="' + x[3] + '"')).join('')
      ) +
      (Math.abs(adjValue(a)) > SETTINGS.adjLimit && a.status === 'Submitted'
        ? '<div class="alert alert-warning mb-16">' +
          icon('alert', 16) +
          '<span>Net value ' +
          fmtM(adjValue(a)) +
          ' exceeds the ' +
          fmtM(SETTINGS.adjLimit, 0) +
          ' approval threshold. Attach count evidence before approving.</span></div>'
        : '') +
      '<div class="grid g-main"><div class="stack">' +
      card(
        'Items',
        '<div class="table-wrap auto"><table class="tbl"><thead><tr><th>Product</th><th class="right">System Qty</th><th class="right">Physical Qty</th><th class="right">Difference</th><th class="right">Unit Cost</th><th class="right">Adjustment Value</th><th>Reason</th></tr></thead><tbody>' +
          a.items
            .map(i => {
              const d = adjDiff(i);
              return (
                '<tr><td>' +
                prodCell(P_BY(i.productId)) +
                '</td><td class="right num">' +
                fmtN(i.systemQty) +
                '</td><td class="right num">' +
                fmtN(i.physicalQty) +
                '</td><td class="right num ' +
                (d >= 0 ? 'pos' : 'neg') +
                '"><b>' +
                (d > 0 ? '+' : '−') +
                fmtN(Math.abs(d)) +
                '</b></td><td class="right num">' +
                fmtM(i.cost) +
                '</td><td class="right num ' +
                (d >= 0 ? 'pos' : 'neg') +
                '">' +
                fmtM(d * i.cost) +
                '</td><td class="muted">' +
                esc(i.reason) +
                '</td></tr>'
              );
            })
            .join('') +
          '</tbody><tfoot><tr><td><b>Total</b></td><td></td><td></td><td class="right num">' +
          fmtN(sum(a.items, adjDiff)) +
          '</td><td></td><td class="right num">' +
          fmtM(adjValue(a)) +
          '</td><td></td></tr></tfoot></table></div>',
        { tight: true }
      ) +
      '</div>' +
      '<div class="stack">' +
      card(
        'Details',
        '<dl class="dl"><dt>Warehouse</dt><dd>' +
          esc(W_BY(a.warehouseId).name) +
          '</dd><dt>Type</dt><dd>' +
          esc(a.type) +
          '</dd><dt>Reason</dt><dd>' +
          esc(a.reason) +
          '</dd><dt>Reference</dt><dd>' +
          esc(a.reference || '—') +
          '</dd><dt>Approved by</dt><dd>' +
          esc(a.approvedBy || '—') +
          '</dd><dt>Posted</dt><dd>' +
          (a.postedAt ? fmtDT(a.postedAt) : '—') +
          '</dd><dt>Created by</dt><dd>' +
          esc(a.createdBy) +
          '</dd><dt>Created date</dt><dd>' +
          fmtDT(a.createdAt) +
          '</dd></dl>'
      ) +
      card('Activity', timelineHTML(a.history)) +
      '</div></div>',
    mount(page) {
      $$('[data-aa]', page).forEach(
        b =>
          (b.onclick = () => {
            const k = b.dataset.aa;
            if (k === 'edit') navigate('adjustment-edit/' + a.id);
            else if (k === 'delete') deleteDoc('adjustment', a, () => navigate('stock-adjustment'));
            else adjustmentAction(a, k);
          })
      );
      $('[data-dup]', page).onclick = () => duplicateDoc('adjustment', a);
      $('[data-print]', page).onclick = doPrint;
    }
  };
};
