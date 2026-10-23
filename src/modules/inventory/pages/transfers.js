/* =========================================================================
   STOCK TRANSFERS
   Transfer list, form, details and status actions.

   Provides: trfQty, #/stock-transfer, transferFormPage, #/transfer-create,
   #/transfer-edit, transferAction, #/transfer-view, doPrint, duplicateDoc,
   deleteDoc
   ========================================================================= */
'use strict';

const trfQty = t => sum(t.items, i => i.qty || 0);
ROUTES['stock-transfer'] = (p, q) => {
  const c = s => stockTransfers.filter(t => t.status === s).length;
  return {
    title: 'Stock Transfer',
    crumbs: [['Inventory', 'inventory'], ['Stock Management', 'stock'], ['Stock Transfer']],
    sub: 'Move stock between warehouses. Transfers need approval before dispatch.',
    actions: btn('Create Transfer', 'plus', 'primary', 'data-go="transfer-create"'),
    body:
      '<div class="kpis mb-16">' +
      kpi('Awaiting approval', c('Submitted'), 'shield', 'warning', 'Submitted by requesting sites') +
      kpi('Ready to dispatch', c('Approved'), 'checkCircle', 'primary', 'Approved, not yet shipped') +
      kpi(
        'In transit',
        c('In Transit'),
        'truck',
        'purple',
        fmtN(
          sum(
            stockTransfers.filter(t => t.status === 'In Transit'),
            trfQty
          )
        ) + ' units on the road'
      ) +
      kpi('Completed', c('Completed'), 'check', 'success', 'Since go-live') +
      '</div><section class="card" id="tT"></section>',
    mount(page) {
      const t = mountTable(page, '#tT', {
        title: 'Stock transfers',
        selectable: true,
        sort: 'date',
        dir: -1,
        columns: [
          {
            key: 'no',
            label: 'Transfer No',
            render: t => '<a class="link mono" href="#/transfer-view/' + t.id + '">' + esc(t.no) + '</a>'
          },
          { key: 'date', label: 'Date', render: t => fmtD(t.date) },
          {
            key: 'route',
            label: 'Source → Destination',
            value: t => W_BY(t.from).code + ' ' + W_BY(t.to).code,
            render: t =>
              '<span class="row" style="gap:6px"><span class="chip">' +
              esc(W_BY(t.from).code) +
              '</span>' +
              icon('arrowRight', 14) +
              '<span class="chip">' +
              esc(W_BY(t.to).code) +
              '</span></span>'
          },
          { key: 'items', label: 'Items', align: 'right', value: t => t.items.length },
          { key: 'qty', label: 'Quantity', align: 'right', value: trfQty, render: t => fmtN(trfQty(t)) },
          {
            key: 'value',
            label: 'Value',
            align: 'right',
            value: t => sum(t.items, i => i.qty * P_BY(i.productId).cost),
            render: t =>
              fmtM(
                sum(t.items, i => (i.qty || 0) * (P_BY(i.productId) || { cost: 0 }).cost),
                0
              )
          },
          { key: 'priority', label: 'Priority', render: t => badge(t.priority) },
          { key: 'reason', label: 'Reason' },
          { key: 'requestedBy', label: 'Requested By', render: t => userCell(t.requestedBy) },
          { key: 'status', label: 'Status', render: t => badge(t.status) }
        ],
        data: () => stockTransfers,
        onRowClick: t => navigate('transfer-view/' + t.id),
        filters: [
          {
            key: 's',
            label: 'Any status',
            value: q.status || '',
            options: FLOWS.transfer.steps.concat(['Rejected', 'Cancelled']),
            test: (t, v) => t.status === v
          },
          {
            key: 'f',
            label: 'Any source',
            options: activeWh().map(w => [w.id, w.code]),
            test: (t, v) => t.from === v
          },
          {
            key: 'd',
            label: 'Any destination',
            options: activeWh().map(w => [w.id, w.code]),
            test: (t, v) => t.to === v
          },
          {
            key: 'p',
            label: 'Any priority',
            options: ['Urgent', 'High', 'Normal', 'Low'],
            test: (t, v) => t.priority === v
          }
        ],
        actions: x => [
          { label: 'View', icon: 'eye', onClick: () => navigate('transfer-view/' + x.id) },
          {
            label: 'Edit',
            icon: 'edit',
            disabled: x.status !== 'Draft',
            onClick: () => navigate('transfer-edit/' + x.id)
          },
          { label: 'Duplicate', icon: 'copy', onClick: () => duplicateDoc('transfer', x) },
          '-',
          {
            label: 'Delete',
            icon: 'trash',
            danger: true,
            onClick: () => deleteDoc('transfer', x, () => t.refresh())
          }
        ],
        bulkActions: [
          {
            label: 'Approve submitted',
            icon: 'checkCircle',
            onClick: ids => {
              let n = 0;
              ids.forEach(id => {
                const x = stockTransfers.find(t => t.id === id);
                if (x && x.status === 'Submitted') {
                  x.status = 'Approved';
                  x.approvedBy = CURRENT_USER.name;
                  hist(x, 'Approved', CURRENT_USER.name, NOW());
                  logAudit('Stock Transfer', 'Updated', x.no, 'Status: Submitted', 'Status: Approved');
                  n++;
                }
              });
              toast(
                n ? 'success' : 'info',
                n ? n + ' transfers approved' : 'Nothing to approve',
                n ? 'Ready for dispatch.' : 'Only submitted transfers can be approved.'
              );
              t.clearSelection();
            }
          }
        ]
      });
    }
  };
};
function transferFormPage(tr, q) {
  const editing = !!tr;
  q = q || {};
  const doc = tr
    ? JSON.parse(JSON.stringify(tr))
    : {
        no: 'TRF-26' + String(counters.TRF + 1).padStart(5, '0'),
        date: NOW(),
        from: q.from || 'W1',
        to: '',
        requestedBy: CURRENT_USER.name,
        reason: 'Stock rebalancing',
        priority: 'Normal',
        notes: '',
        items: []
      };
  if (!tr && q.product) doc.items = [{ productId: q.product, qty: null, batch: '', locationId: '' }];
  return {
    title: editing ? 'Edit Transfer' : 'Create Stock Transfer',
    nav: 'stock-transfer',
    crumbs: [
      ['Inventory', 'inventory'],
      ['Stock Management', 'stock'],
      ['Stock Transfer', 'stock-transfer'],
      [editing ? doc.no : 'Create Transfer']
    ],
    sub: 'Draft → Submitted → Approved → In Transit → Received → Completed',
    body:
      '<form class="card" id="tform" novalidate><div class="form-section">' +
      sectionHead(1, 'Transfer details', 'Source, destination and urgency') +
      '<div class="form-grid">' +
      F({ name: 'no', label: 'Transfer Number', span: 3, value: doc.no, readonly: true }) +
      F({
        name: 'date',
        label: 'Transfer Date',
        type: 'date',
        req: true,
        span: 3,
        value: isoDate(doc.date)
      }) +
      F({
        name: 'from',
        label: 'Source Warehouse',
        type: 'select',
        req: true,
        span: 3,
        value: doc.from,
        placeholder: false,
        options: whOptions()
      }) +
      F({
        name: 'to',
        label: 'Destination Warehouse',
        type: 'select',
        req: true,
        span: 3,
        value: doc.to,
        options: whOptions()
      }) +
      F({
        name: 'requestedBy',
        label: 'Requested By',
        type: 'select',
        req: true,
        span: 3,
        value: doc.requestedBy,
        options: USERS
      }) +
      F({
        name: 'reason',
        label: 'Reason',
        type: 'select',
        req: true,
        span: 3,
        value: doc.reason,
        placeholder: false,
        options: ['Stock rebalancing', 'Replenishment', 'Customer demand', 'Consolidation', 'Quality hold']
      }) +
      F({
        name: 'priority',
        label: 'Priority',
        type: 'select',
        req: true,
        span: 3,
        value: doc.priority,
        placeholder: false,
        options: ['Low', 'Normal', 'High', 'Urgent']
      }) +
      F({ name: 'notes', label: 'Notes', span: 3, value: doc.notes, ph: 'Carrier, dock or handling notes' }) +
      '</div></div><div class="form-section" style="padding-bottom:0">' +
      sectionHead(2, 'Items', 'Quantities are checked against available stock at the source') +
      '</div><div id="tLines"></div>' +
      '<div class="form-actions"><span class="spacer"></span>' +
      btn(
        'Cancel',
        '',
        '',
        'type="button" data-go="' + (editing ? 'transfer-view/' + tr.id : 'stock-transfer') + '"'
      ) +
      btn('Save Draft', 'save', '', 'type="button" data-act="Draft"') +
      btn('Submit', 'send', 'primary', 'type="button" data-act="Submitted"') +
      '</div></form>',
    mount(page) {
      const form = $('#tform', page);
      const from = () => $('[name=from]', form).value,
        to = () => $('[name=to]', form).value;
      const srcProducts = () => products.filter(p => whAvail(p.id, from()) > 0);
      const le = LineEditor({
        lines: doc.items,
        newLine: () => ({ productId: '', qty: null, batch: '', locationId: '' }),
        rerenderOn: ['productId'],
        focusAfter: { productId: 'qty' },
        cols: [
          { label: 'Product', req: true },
          { label: 'SKU' },
          { label: 'Available Qty', align: 'right' },
          { label: 'Transfer Qty', req: true, w: '120px' },
          { label: 'Unit' },
          { label: 'Batch' },
          { label: 'Destination Location' }
        ],
        rowHTML: l => {
          const p = P_BY(l.productId);
          const bs = p
            ? batches.filter(b => b.productId === p.id && b.warehouseId === from() && b.qty > 0)
            : [];
          return (
            '<td>' +
            lineProdSelect(l, srcProducts()) +
            '</td><td class="ro mono">' +
            (p ? esc(p.sku) : '—') +
            '</td><td class="ro right num">' +
            (p ? fmtN(whAvail(p.id, from())) : '—') +
            '</td><td><input class="input right" type="number" min="1" data-k="qty" value="' +
            (l.qty == null ? '' : l.qty) +
            '" aria-label="Transfer quantity"></td><td class="ro">' +
            (p ? esc(p.uom) : '') +
            '</td><td>' +
            (bs.length
              ? '<select class="select" data-k="batch" aria-label="Batch">' +
                optionsHTML(
                  bs.map(b => [
                    b.batch,
                    b.batch + ' · ' + fmtN(b.qty) + (b.expiry ? ' · exp ' + fmtD(b.expiry) : '')
                  ]),
                  l.batch,
                  'FIFO (automatic)'
                ) +
                '</select>'
              : '<span class="ro subtle" style="display:block;padding-top:6px">Not batch-tracked</span>') +
            '</td><td><select class="select" data-k="locationId" aria-label="Destination location" style="min-width:150px"' +
            (to() ? '' : ' disabled') +
            '>' +
            optionsHTML(
              to() ? locsOf(to()).map(x => [x.id, x.code]) : [],
              l.locationId,
              to() ? 'Default location' : 'Select destination first'
            ) +
            '</select></td>'
          );
        },
        validateLine: l => {
          const e = {};
          if (!l.productId) e.productId = 'Select a product';
          const av = l.productId ? whAvail(l.productId, from()) : 0;
          if (!l.qty || l.qty < 1) e.qty = 'Enter a quantity of at least 1';
          else if (l.qty > av) e.qty = 'Only ' + fmtN(av) + ' available at the source';
          return e;
        },
        footer: ls =>
          '<span class="muted">' +
          ls.filter(l => l.productId).length +
          ' items</span><span>Total quantity <b class="num">' +
          fmtN(sum(ls, l => l.qty || 0)) +
          '</b></span><span>Value <b class="num">' +
          fmtM(
            sum(ls, l => (l.qty || 0) * ((P_BY(l.productId) || {}).cost || 0)),
            0
          ) +
          '</b></span>'
      });
      $('#tLines', page).append(le.el);
      $('[name=from]', form).addEventListener('change', () => {
        le.lines.splice(0, le.lines.length, { productId: '', qty: null, batch: '', locationId: '' });
        le.render();
        toast('info', 'Items cleared', 'Select products available at the new source warehouse.');
      });
      $('[name=to]', form).addEventListener('change', () => {
        le.lines.forEach(l => (l.locationId = ''));
        le.render();
      });
      $$('[data-act]', page).forEach(
        b =>
          (b.onclick = () => {
            const st = b.dataset.act;
            if (
              !validateForm(form, err => {
                if (from() && from() === to()) err('to', 'Destination must differ from the source warehouse');
              })
            )
              return;
            if (!le.validate()) return;
            const d = formData(form);
            const items = le.lines.map(l => ({
              productId: l.productId,
              qty: l.qty,
              batch: l.batch || '',
              locationId: l.locationId || defaultLoc(d.to, P_BY(l.productId).expiry ? 'C' : 'A')
            }));
            let t = tr;
            if (!t) {
              t = {
                id: uid('T'),
                no: nextNo('TRF'),
                history: [],
                createdBy: CURRENT_USER.name,
                createdAt: NOW()
              };
              stockTransfers.unshift(t);
              hist(t, 'Draft', CURRENT_USER.name, NOW(), 'Transfer created');
              logAudit('Stock Transfer', 'Created', t.no, '—', 'Status: Draft');
            } else
              logAudit(
                'Stock Transfer',
                'Updated',
                t.no,
                'Items: ' + t.items.length,
                'Items: ' + items.length
              );
            Object.assign(t, {
              date: new Date(d.date + 'T09:00'),
              from: d.from,
              to: d.to,
              requestedBy: d.requestedBy,
              reason: d.reason,
              priority: d.priority,
              notes: d.notes,
              items,
              status: 'Draft'
            });
            if (st === 'Submitted') {
              t.status = 'Submitted';
              hist(t, 'Submitted', CURRENT_USER.name, NOW(), 'Sent for approval');
              logAudit('Stock Transfer', 'Updated', t.no, 'Status: Draft', 'Status: Submitted');
            }
            toast(
              'success',
              st === 'Submitted' ? 'Transfer submitted' : 'Draft saved',
              t.no +
                ' · ' +
                fmtN(trfQty(t)) +
                ' units from ' +
                W_BY(t.from).code +
                ' to ' +
                W_BY(t.to).code +
                '.'
            );
            navigate('transfer-view/' + t.id);
          })
      );
    }
  };
}
ROUTES['transfer-create'] = (p, q) => transferFormPage(null, q);
ROUTES['transfer-edit'] = id => {
  const t = stockTransfers.find(x => x.id === id);
  if (!t) return ROUTES['not-found']();
  if (t.status !== 'Draft') return ROUTES['transfer-view'](id);
  return transferFormPage(t);
};
function transferAction(t, act) {
  const from = W_BY(t.from),
    to = W_BY(t.to);
  const set = (s, note) => {
    const o = t.status;
    t.status = s;
    hist(t, s, CURRENT_USER.name, NOW(), note);
    logAudit('Stock Transfer', 'Updated', t.no, 'Status: ' + o, 'Status: ' + s);
    renderRoute();
  };
  if (act === 'submit')
    set('Submitted', 'Sent for approval'),
      toast('success', 'Transfer submitted', t.no + ' is waiting for approval.');
  if (act === 'approve')
    confirmDialog({
      title: 'Approve ' + t.no + '?',
      message:
        'Approve moving ' + fmtN(trfQty(t)) + ' units from ' + esc(from.name) + ' to ' + esc(to.name) + '.',
      confirm: 'Approve'
    }).then(ok => {
      if (ok) {
        t.approvedBy = CURRENT_USER.name;
        set('Approved', 'Approved for dispatch');
        toast('success', 'Transfer approved', t.no + ' can now be dispatched.');
      }
    });
  if (act === 'reject')
    reasonModal('Reject ' + t.no, 'Reason for rejection', r => {
      set('Rejected', r);
      toast('warning', 'Transfer rejected', t.no + ' was returned to ' + t.requestedBy + '.');
    });
  if (act === 'cancel')
    confirmDialog({
      danger: true,
      title: 'Cancel ' + t.no + '?',
      message: 'The transfer will be closed without moving stock.',
      confirm: 'Cancel transfer',
      cancel: 'Keep transfer'
    }).then(ok => {
      if (ok) {
        set('Cancelled', 'Cancelled by requester');
        toast('info', 'Transfer cancelled', t.no + ' closed.');
      }
    });
  if (act === 'dispatch') {
    const short = t.items.filter(i => i.qty > whAvail(i.productId, t.from) + 0);
    if (short.length) {
      messageModal(
        'error',
        'Not enough stock to dispatch',
        '<p>Available stock at ' +
          esc(from.code) +
          ' changed since approval:</p><ul style="margin-top:8px;padding-left:18px;list-style:disc">' +
          short
            .map(
              i =>
                '<li>' +
                esc(P_BY(i.productId).name) +
                ': needs ' +
                fmtN(i.qty) +
                ', available ' +
                fmtN(whAvail(i.productId, t.from)) +
                '</li>'
            )
            .join('') +
          '</ul><p>Edit quantities by rejecting and re-creating the transfer, or post a stock adjustment.</p>'
      );
      return;
    }
    confirmDialog({
      title: 'Dispatch ' + t.no + '?',
      message:
        fmtN(trfQty(t)) +
        ' units leave ' +
        esc(from.name) +
        ' now and stay in transit until received at ' +
        esc(to.name) +
        '.',
      confirm: 'Dispatch'
    }).then(ok => {
      if (!ok) return;
      t.items.forEach(i =>
        postMovement({
          type: 'Transfer',
          pid: i.productId,
          wid: t.from,
          outQty: i.qty,
          txNo: t.no,
          ref: 'To ' + to.code,
          bucket: 'transfer',
          batch: i.batch
        })
      );
      set('In Transit', 'Dispatched from ' + from.code);
      toast(
        'success',
        'Transfer dispatched',
        'Stock at ' + from.code + ' reduced by ' + fmtN(trfQty(t)) + ' units.'
      );
    });
  }
  if (act === 'receive')
    confirmDialog({
      title: 'Receive ' + t.no + ' at ' + to.code + '?',
      message:
        'Confirm all ' +
        fmtN(trfQty(t)) +
        ' units arrived in good condition. Stock is added to the destination locations.',
      confirm: 'Receive stock'
    }).then(ok => {
      if (!ok) return;
      t.items.forEach(i => {
        const r = stockRow(i.productId, t.to, true);
        postMovement({
          type: 'Transfer',
          pid: i.productId,
          wid: t.to,
          inQty: i.qty,
          txNo: t.no,
          ref: 'From ' + from.code,
          bucket: 'transfer',
          locationId: i.locationId,
          batch: i.batch || undefined
        });
      });
      set('Received', 'Received at ' + to.code);
      toast('success', 'Stock received', fmtN(trfQty(t)) + ' units added to ' + to.name + '.');
    });
  if (act === 'complete') {
    set('Completed', 'Transfer closed');
    toast('success', 'Transfer completed', t.no + ' is closed.');
  }
}
ROUTES['transfer-view'] = id => {
  const t = stockTransfers.find(x => x.id === id);
  if (!t) return ROUTES['not-found']();
  const A =
    {
      Draft: [
        ['Edit', 'edit', '', 'edit'],
        ['Cancel', 'x', 'danger-ghost', 'cancel'],
        ['Submit', 'send', 'primary', 'submit']
      ],
      Submitted: [
        ['Reject', 'x', 'danger-ghost', 'reject'],
        ['Approve', 'check', 'primary', 'approve']
      ],
      Approved: [
        ['Cancel', 'x', 'danger-ghost', 'cancel'],
        ['Dispatch', 'truck', 'primary', 'dispatch']
      ],
      'In Transit': [['Receive', 'receive', 'primary', 'receive']],
      Received: [['Complete', 'checkCircle', 'success', 'complete']]
    }[t.status] || [];
  const acts = A.map(a => btn(a[0], a[1], a[2], 'data-ta="' + a[3] + '"')).join('');
  return {
    title: t.no,
    nav: 'stock-transfer',
    crumbs: [
      ['Inventory', 'inventory'],
      ['Stock Management', 'stock'],
      ['Stock Transfer', 'stock-transfer'],
      [t.no]
    ],
    titleHTML: 'Stock Transfer <span class="mono" style="font-weight:600">' + esc(t.no) + '</span>',
    sub:
      esc(W_BY(t.from).name) +
      ' → ' +
      esc(W_BY(t.to).name) +
      ' · requested by ' +
      esc(t.requestedBy) +
      ' on ' +
      fmtD(t.date),
    actions: btn('Duplicate', 'copy', '', 'data-dup') + btn('Print', 'print', '', 'data-print'),
    body:
      docHeaderCard(t.no, t.status, flowFor('transfer', t.status, histMeta(t, 'transfer')), acts) +
      '<div class="grid g-main"><div class="stack">' +
      card(
        'Items',
        '<div class="table-wrap auto"><table class="tbl"><thead><tr><th>Product</th><th>SKU</th><th class="right">Source on hand</th><th class="right">Transfer Qty</th><th>Unit</th><th>Batch</th><th>Destination Location</th><th class="right">Value</th></tr></thead><tbody>' +
          t.items
            .map(i => {
              const p = P_BY(i.productId);
              return (
                '<tr><td>' +
                prodCell(p) +
                '</td><td class="mono">' +
                esc(p ? p.sku : '') +
                '</td><td class="right num">' +
                fmtN(whQty(i.productId, t.from)) +
                '</td><td class="right num"><b>' +
                fmtN(i.qty) +
                '</b></td><td>' +
                esc(p ? p.uom : '') +
                '</td><td class="mono">' +
                esc(i.batch || 'FIFO') +
                '</td><td class="mono">' +
                esc((L_BY(i.locationId) || {}).code || 'Default') +
                '</td><td class="right num">' +
                fmtM(i.qty * (p ? p.cost : 0), 0) +
                '</td></tr>'
              );
            })
            .join('') +
          '</tbody><tfoot><tr><td colspan="3"><b>Total</b></td><td class="right num">' +
          fmtN(trfQty(t)) +
          '</td><td colspan="3"></td><td class="right num">' +
          fmtM(
            sum(t.items, i => i.qty * (P_BY(i.productId) || { cost: 0 }).cost),
            0
          ) +
          '</td></tr></tfoot></table></div>',
        { tight: true }
      ) +
      card(
        'Ledger postings',
        ledger.filter(e => e.txNo === t.no).length
          ? '<div class="table-wrap auto"><table class="tbl compact"><thead><tr><th>Date</th><th>Warehouse</th><th>Product</th><th class="right">In</th><th class="right">Out</th><th class="right">Balance</th></tr></thead><tbody>' +
              ledger
                .filter(e => e.txNo === t.no)
                .map(
                  e =>
                    '<tr><td>' +
                    fmtDT(e.date) +
                    '</td><td>' +
                    esc(W_BY(e.warehouseId).code) +
                    '</td><td>' +
                    esc(P_BY(e.productId).name) +
                    '</td><td class="right num pos">' +
                    (e.inQty ? '+' + fmtN(e.inQty) : '—') +
                    '</td><td class="right num neg">' +
                    (e.outQty ? '−' + fmtN(e.outQty) : '—') +
                    '</td><td class="right num">' +
                    fmtN(e.balance) +
                    '</td></tr>'
                )
                .join('') +
              '</tbody></table></div>'
          : '<div class="empty" style="padding:24px"><h4>Nothing posted yet</h4><p>Stock leaves the source when the transfer is dispatched and arrives when it is received.</p></div>',
        { tight: true }
      ) +
      '</div><div class="stack">' +
      card(
        'Details',
        '<dl class="dl"><dt>Transfer date</dt><dd>' +
          fmtD(t.date) +
          '</dd><dt>Source</dt><dd>' +
          esc(W_BY(t.from).name) +
          '</dd><dt>Destination</dt><dd>' +
          esc(W_BY(t.to).name) +
          '</dd><dt>Requested by</dt><dd>' +
          esc(t.requestedBy) +
          '</dd><dt>Reason</dt><dd>' +
          esc(t.reason) +
          '</dd><dt>Priority</dt><dd>' +
          badge(t.priority) +
          '</dd><dt>Approved by</dt><dd>' +
          esc(t.approvedBy || '—') +
          '</dd><dt>Notes</dt><dd>' +
          esc(t.notes || '—') +
          '</dd><dt>Created by</dt><dd>' +
          esc(t.createdBy) +
          '</dd><dt>Created date</dt><dd>' +
          fmtDT(t.createdAt) +
          '</dd></dl>'
      ) +
      card('Activity', timelineHTML(t.history)) +
      '</div></div>',
    mount(page) {
      $$('[data-ta]', page).forEach(
        b =>
          (b.onclick = () => {
            if (b.dataset.ta === 'edit') navigate('transfer-edit/' + t.id);
            else transferAction(t, b.dataset.ta);
          })
      );
      $('[data-dup]', page).onclick = () => duplicateDoc('transfer', t);
      $('[data-print]', page).onclick = doPrint;
    }
  };
};
function doPrint() {
  try {
    window.print();
  } catch (e) {
    toast('warning', 'Printing unavailable', 'Use your browser’s print command instead.');
  }
}
function duplicateDoc(kind, d) {
  const L = {
    transfer: [stockTransfers, 'TRF', 'transfer-view/', 'Stock Transfer'],
    adjustment: [stockAdjustments, 'ADJ', 'adjustment-view/', 'Stock Adjustment'],
    issue: [goodsIssues, 'GI', 'issue-view/', 'Goods Issue']
  }[kind];
  const c = JSON.parse(JSON.stringify(d));
  c.id = uid('D');
  c.no = nextNo(L[1]);
  c.status = kind === 'issue' ? 'Requested' : 'Draft';
  c.date = NOW();
  c.createdAt = NOW();
  c.createdBy = CURRENT_USER.name;
  c.history = [];
  delete c.approvedBy;
  delete c.postedAt;
  if (kind === 'adjustment') c.items.forEach(i => (i.systemQty = whQty(i.productId, c.warehouseId)));
  hist(c, c.status, CURRENT_USER.name, NOW(), 'Duplicated from ' + d.no);
  L[0].unshift(c);
  logAudit(L[3], 'Created', c.no, '—', 'Duplicate of ' + d.no);
  toast('success', 'Duplicate created', c.no + ' created from ' + d.no + '.');
  navigate(L[2] + c.id);
}
function deleteDoc(kind, d, after) {
  const L = {
    transfer: [stockTransfers, 'Stock Transfer', ['Draft', 'Rejected', 'Cancelled']],
    adjustment: [stockAdjustments, 'Stock Adjustment', ['Draft', 'Rejected']],
    issue: [goodsIssues, 'Goods Issue', ['Requested', 'Rejected', 'Cancelled']],
    grn: [grns, 'Goods Receipt', ['Draft']]
  }[kind];
  if (!L[2].includes(d.status)) {
    messageModal(
      'warning',
      'This document can’t be deleted',
      '<p>' +
        esc(d.no) +
        ' is ' +
        esc(d.status) +
        '. Only documents in ' +
        L[2].join(', ') +
        ' status can be deleted, because later stages create inventory transactions.</p>',
      [{ label: 'Close', variant: 'primary' }]
    );
    return;
  }
  confirmDialog({
    danger: true,
    title: 'Delete ' + d.no + '?',
    message:
      'Are you sure you want to delete ' +
      esc(L[1].toLowerCase()) +
      ' ' +
      esc(d.no) +
      '? This action cannot be undone.',
    confirm: 'Delete'
  }).then(ok => {
    if (!ok) return;
    L[0].splice(L[0].indexOf(d), 1);
    logAudit(L[1], 'Deleted', d.no, 'Status: ' + d.status, '—');
    toast('success', 'Document deleted', d.no + ' was deleted.');
    after && after();
  });
}
