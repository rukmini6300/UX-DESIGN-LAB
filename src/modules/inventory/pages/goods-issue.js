/* =========================================================================
   GOODS ISSUE
   Issue list, form, approval, picking and issue.

   Provides: giQty, #/goods-issue, issueFormPage, #/issue-create,
   #/issue-edit, issueAction, #/issue-view
   ========================================================================= */
'use strict';

const giQty = g => sum(g.items, i => i.qty || 0);
ROUTES['goods-issue'] = (p, q) => {
  const c = s => goodsIssues.filter(g => g.status === s);
  return {
    title: 'Goods Issue',
    crumbs: [['Inventory', 'inventory'], ['Goods Issue', 'goods-issue'], ['Issue List']],
    sub: 'Issue stock to internal departments. Stock is deducted when the issue is posted.',
    actions: btn('Create Issue', 'plus', 'primary', 'data-go="issue-create"'),
    body:
      '<div class="kpis mb-16">' +
      kpi('Requested', c('Requested').length, 'clock', 'warning', 'Awaiting approval') +
      kpi('Approved', c('Approved').length, 'checkCircle', 'primary', 'Ready to pick') +
      kpi('Picked', c('Picked').length, 'inbox', 'purple', 'Ready to issue') +
      kpi(
        'Issued last 30 days',
        goodsIssues.filter(g => g.status === 'Issued' && daysBetween(g.postedAt || g.date, NOW()) <= 30)
          .length,
        'issue',
        'success',
        fmtN(
          sum(
            goodsIssues.filter(g => g.status === 'Issued' && daysBetween(g.postedAt || g.date, NOW()) <= 30),
            giQty
          )
        ) + ' units deducted'
      ) +
      '</div><section class="card" id="iT"></section>',
    mount(page) {
      const t = mountTable(page, '#iT', {
        title: 'Goods issues',
        sort: 'date',
        dir: -1,
        columns: [
          {
            key: 'no',
            label: 'Issue Number',
            render: g => '<a class="link mono" href="#/issue-view/' + g.id + '">' + esc(g.no) + '</a>'
          },
          { key: 'date', label: 'Issue Date', render: g => fmtD(g.date) },
          {
            key: 'wh',
            label: 'Warehouse',
            value: g => W_BY(g.warehouseId).code,
            render: g => '<span class="chip">' + esc(W_BY(g.warehouseId).code) + '</span>'
          },
          { key: 'department', label: 'Department' },
          {
            key: 'reference',
            label: 'Reference',
            render: g => '<span class="mono">' + esc(g.reference) + '</span>'
          },
          { key: 'items', label: 'Items', align: 'right', value: g => g.items.length },
          { key: 'qty', label: 'Quantity', align: 'right', value: giQty, render: g => fmtN(giQty(g)) },
          {
            key: 'req',
            label: 'Requested By',
            value: g => g.requestedBy,
            render: g => userCell(g.requestedBy)
          },
          { key: 'status', label: 'Status', render: g => badge(g.status) }
        ],
        data: () => goodsIssues,
        onRowClick: g => navigate('issue-view/' + g.id),
        filters: [
          {
            key: 's',
            label: 'Any status',
            options: ['Requested', 'Approved', 'Picked', 'Issued', 'Rejected', 'Cancelled'],
            test: (g, v) => g.status === v
          },
          {
            key: 'w',
            label: 'All warehouses',
            options: activeWh().map(w => [w.id, w.code]),
            test: (g, v) => g.warehouseId === v
          },
          { key: 'd', label: 'All departments', options: DEPARTMENTS, test: (g, v) => g.department === v }
        ],
        actions: g => [
          { label: 'View', icon: 'eye', onClick: () => navigate('issue-view/' + g.id) },
          {
            label: 'Edit',
            icon: 'edit',
            disabled: g.status !== 'Requested',
            onClick: () => navigate('issue-edit/' + g.id)
          },
          { label: 'Duplicate', icon: 'copy', onClick: () => duplicateDoc('issue', g) },
          '-',
          {
            label: 'Delete',
            icon: 'trash',
            danger: true,
            onClick: () => deleteDoc('issue', g, () => t.refresh())
          }
        ]
      });
    }
  };
};
function issueFormPage(g) {
  const editing = !!g;
  const doc = g
    ? JSON.parse(JSON.stringify(g))
    : {
        no: 'GI-26' + String(counters.GI + 1).padStart(5, '0'),
        date: NOW(),
        warehouseId: 'W1',
        department: '',
        reference: '',
        requestedBy: CURRENT_USER.name,
        issuedBy: 'Daniel Reyes',
        reason: '',
        items: []
      };
  return {
    title: editing ? 'Edit Goods Issue' : 'Create Goods Issue',
    nav: 'issue-create',
    crumbs: [['Inventory', 'inventory'], ['Goods Issue', 'goods-issue'], [editing ? doc.no : 'Create Issue']],
    sub: 'Request → Approval → Pick → Issue → Stock Deduction',
    body:
      '<form class="card" id="iform" novalidate><div class="form-section">' +
      sectionHead(1, 'Issue details', 'Who needs the stock and why') +
      '<div class="form-grid">' +
      F({ name: 'no', label: 'Issue Number', span: 3, value: doc.no, readonly: true }) +
      F({ name: 'date', label: 'Issue Date', type: 'date', req: true, span: 3, value: isoDate(doc.date) }) +
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
        name: 'department',
        label: 'Department',
        type: 'select',
        req: true,
        span: 3,
        value: doc.department,
        options: DEPARTMENTS
      }) +
      F({
        name: 'reference',
        label: 'Reference',
        span: 3,
        value: doc.reference,
        ph: 'Work order or request number'
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
        name: 'issuedBy',
        label: 'Issued By',
        type: 'select',
        req: true,
        span: 3,
        value: doc.issuedBy,
        options: USERS
      }) +
      F({
        name: 'reason',
        label: 'Reason',
        req: true,
        span: 3,
        value: doc.reason,
        ph: 'e.g. Preventive maintenance'
      }) +
      '</div></div>' +
      '<div class="form-section" style="padding-bottom:0">' +
      sectionHead(2, 'Items', 'Issue quantity cannot exceed available stock') +
      '</div><div id="iLines"></div>' +
      '<div class="form-actions"><span class="spacer"></span>' +
      btn(
        'Cancel',
        '',
        '',
        'type="button" data-go="' + (editing ? 'issue-view/' + g.id : 'goods-issue') + '"'
      ) +
      btn(editing ? 'Save Request' : 'Submit Request', 'send', 'primary', 'type="button" data-act') +
      '</div></form>',
    mount(page) {
      const form = $('#iform', page);
      const wid = () => $('[name=warehouseId]', form).value;
      const le = LineEditor({
        lines: doc.items,
        newLine: () => ({ productId: '', qty: null, batch: '', locationId: '' }),
        rerenderOn: ['productId'],
        focusAfter: { productId: 'qty' },
        onChange: (l, k) => {
          if (k === 'productId') {
            const r = stockRow(l.productId, wid());
            l.locationId = r ? r.locationId : '';
          }
        },
        cols: [
          { label: 'Product', req: true },
          { label: 'Available Qty', align: 'right' },
          { label: 'Issue Qty', req: true, w: '120px' },
          { label: 'Batch' },
          { label: 'Location' }
        ],
        rowHTML: l => {
          const p = P_BY(l.productId);
          const bs = p
            ? batches.filter(b => b.productId === p.id && b.warehouseId === wid() && b.qty > 0)
            : [];
          return (
            '<td>' +
            lineProdSelect(
              l,
              products.filter(x => whAvail(x.id, wid()) > 0)
            ) +
            '</td><td class="ro right num">' +
            (p ? fmtN(whAvail(p.id, wid())) + ' ' + esc(p.uom) : '—') +
            '</td><td><input class="input right" type="number" min="1" data-k="qty" value="' +
            (l.qty == null ? '' : l.qty) +
            '" aria-label="Issue quantity"></td><td>' +
            (bs.length
              ? '<select class="select" data-k="batch" aria-label="Batch">' +
                optionsHTML(
                  bs.map(b => [b.batch, b.batch + ' · ' + fmtN(b.qty)]),
                  l.batch,
                  'FIFO (automatic)'
                ) +
                '</select>'
              : '<span class="ro subtle" style="display:block;padding-top:6px">Not batch-tracked</span>') +
            '</td><td><select class="select" data-k="locationId" aria-label="Location" style="min-width:150px">' +
            optionsHTML(
              locsOf(wid()).map(x => [x.id, x.code]),
              l.locationId,
              'Select location'
            ) +
            '</select></td>'
          );
        },
        validateLine: l => {
          const e = {};
          if (!l.productId) e.productId = 'Select a product';
          const av = l.productId ? whAvail(l.productId, wid()) : 0;
          if (!l.qty || l.qty < 1) e.qty = 'Enter a quantity of at least 1';
          else if (l.qty > av) e.qty = 'Only ' + fmtN(av) + ' available';
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
      $('#iLines', page).append(le.el);
      $('[name=warehouseId]', form).addEventListener('change', () => {
        le.lines.splice(0, le.lines.length, { productId: '', qty: null, batch: '', locationId: '' });
        le.render();
      });
      $('[data-act]', page).onclick = () => {
        if (!validateForm(form) || !le.validate()) return;
        const d = formData(form);
        let x = g;
        if (!x) {
          x = {
            id: uid('GI'),
            no: nextNo('GI'),
            history: [],
            createdBy: CURRENT_USER.name,
            createdAt: NOW(),
            status: 'Requested'
          };
          goodsIssues.unshift(x);
          hist(x, 'Requested', d.requestedBy, NOW(), 'Request submitted');
          logAudit('Goods Issue', 'Created', x.no, '—', 'Status: Requested');
        } else
          logAudit('Goods Issue', 'Updated', x.no, 'Items: ' + g.items.length, 'Items: ' + le.lines.length);
        Object.assign(x, {
          date: new Date(d.date + 'T09:00'),
          warehouseId: d.warehouseId,
          department: d.department,
          reference: d.reference,
          requestedBy: d.requestedBy,
          issuedBy: d.issuedBy,
          reason: d.reason,
          items: le.lines.map(l => ({
            productId: l.productId,
            qty: l.qty,
            batch: l.batch || '',
            locationId: l.locationId
          }))
        });
        toast(
          'success',
          'Issue request submitted',
          x.no + ' for ' + d.department + ' is waiting for approval.'
        );
        navigate('issue-view/' + x.id);
      };
    }
  };
}
ROUTES['issue-create'] = () => issueFormPage(null);
ROUTES['issue-edit'] = id => {
  const g = goodsIssues.find(x => x.id === id);
  if (!g) return ROUTES['not-found']();
  return g.status === 'Requested' ? issueFormPage(g) : ROUTES['issue-view'](id);
};
function issueAction(g, act) {
  const set = (s, note) => {
    const o = g.status;
    g.status = s;
    hist(g, s, CURRENT_USER.name, NOW(), note);
    logAudit('Goods Issue', 'Updated', g.no, 'Status: ' + o, 'Status: ' + s);
    renderRoute();
  };
  if (act === 'approve') {
    set('Approved', 'Approved for picking');
    toast('success', 'Issue approved', g.no + ' is ready to pick.');
  }
  if (act === 'reject')
    reasonModal('Reject ' + g.no, 'Reason for rejection', r => {
      set('Rejected', r);
      toast('warning', 'Issue rejected', g.no + ' returned to ' + g.requestedBy + '.');
    });
  if (act === 'cancel')
    confirmDialog({
      danger: true,
      title: 'Cancel ' + g.no + '?',
      message: 'The request will be closed without issuing stock.',
      confirm: 'Cancel issue',
      cancel: 'Keep issue'
    }).then(ok => {
      if (ok) {
        set('Cancelled', 'Cancelled');
        toast('info', 'Issue cancelled', g.no + ' closed.');
      }
    });
  if (act === 'pick') {
    set(
      'Picked',
      'Picked from ' +
        g.items
          .map(i => (L_BY(i.locationId) || {}).code)
          .filter(Boolean)
          .join(', ')
    );
    toast('success', 'Pick confirmed', 'Items staged for issue.');
  }
  if (act === 'issue') {
    const short = g.items.filter(i => i.qty > whQty(i.productId, g.warehouseId));
    if (short.length) {
      messageModal(
        'error',
        'Not enough stock to issue',
        '<p>' +
          short
            .map(
              i =>
                esc(P_BY(i.productId).name) +
                ' needs ' +
                fmtN(i.qty) +
                ', on hand ' +
                fmtN(whQty(i.productId, g.warehouseId))
            )
            .join('<br>') +
          '</p>'
      );
      return;
    }
    confirmDialog({
      title: 'Post ' + g.no + '?',
      message:
        fmtN(giQty(g)) +
        ' units are deducted from ' +
        esc(W_BY(g.warehouseId).name) +
        ' and charged to ' +
        esc(g.department) +
        '.',
      confirm: 'Post issue'
    }).then(ok => {
      if (!ok) return;
      g.items.forEach(i =>
        postMovement({
          type: 'Goods Issue',
          pid: i.productId,
          wid: g.warehouseId,
          outQty: i.qty,
          txNo: g.no,
          ref: g.department,
          bucket: 'issued',
          batch: i.batch || undefined
        })
      );
      g.postedAt = NOW();
      set('Issued', 'Stock deducted');
      toast('success', 'Goods issued', 'Stock reduced by ' + fmtN(giQty(g)) + ' units.', {
        label: 'View ledger',
        onClick: () => navigate('ledger?type=Goods%20Issue')
      });
    });
  }
}
ROUTES['issue-view'] = id => {
  const g = goodsIssues.find(x => x.id === id);
  if (!g) return ROUTES['not-found']();
  const A =
    {
      Requested: [
        ['Edit', 'edit', '', 'edit'],
        ['Cancel', 'x', 'danger-ghost', 'cancel'],
        ['Reject', 'x', 'danger-ghost', 'reject'],
        ['Approve', 'check', 'primary', 'approve']
      ],
      Approved: [['Confirm Pick', 'inbox', 'primary', 'pick']],
      Picked: [['Post Issue', 'issue', 'success', 'issue']]
    }[g.status] || [];
  return {
    title: g.no,
    nav: 'goods-issue',
    crumbs: [['Inventory', 'inventory'], ['Goods Issue', 'goods-issue'], [g.no]],
    titleHTML: 'Goods Issue <span class="mono" style="font-weight:600">' + esc(g.no) + '</span>',
    sub: esc(g.department) + ' · ' + esc(W_BY(g.warehouseId).name) + ' · ' + fmtD(g.date),
    actions: btn('Duplicate', 'copy', '', 'data-dup') + btn('Print', 'print', '', 'data-print'),
    body:
      docHeaderCard(
        g.no,
        g.status,
        flowFor('issue', g.status, histMeta(g, 'issue')),
        A.map(x => btn(x[0], x[1], x[2], 'data-ia="' + x[3] + '"')).join('')
      ) +
      '<div class="grid g-main"><div class="stack">' +
      card(
        'Items',
        '<div class="table-wrap auto"><table class="tbl"><thead><tr><th>Product</th><th class="right">Available Qty</th><th class="right">Issue Qty</th><th>Batch</th><th>Location</th><th class="right">Value</th></tr></thead><tbody>' +
          g.items
            .map(i => {
              const p = P_BY(i.productId);
              return (
                '<tr><td>' +
                prodCell(p) +
                '</td><td class="right num">' +
                fmtN(whAvail(i.productId, g.warehouseId)) +
                '</td><td class="right num"><b>' +
                fmtN(i.qty) +
                '</b></td><td class="mono">' +
                esc(i.batch || 'FIFO') +
                '</td><td class="mono">' +
                esc((L_BY(i.locationId) || {}).code || '—') +
                '</td><td class="right num">' +
                fmtM(i.qty * (p ? p.cost : 0)) +
                '</td></tr>'
              );
            })
            .join('') +
          '</tbody></table></div>',
        { tight: true }
      ) +
      '</div>' +
      '<div class="stack">' +
      card(
        'Details',
        '<dl class="dl"><dt>Issue date</dt><dd>' +
          fmtD(g.date) +
          '</dd><dt>Warehouse</dt><dd>' +
          esc(W_BY(g.warehouseId).name) +
          '</dd><dt>Department</dt><dd>' +
          esc(g.department) +
          '</dd><dt>Reference</dt><dd class="mono">' +
          esc(g.reference || '—') +
          '</dd><dt>Requested by</dt><dd>' +
          esc(g.requestedBy) +
          '</dd><dt>Issued by</dt><dd>' +
          esc(g.issuedBy) +
          '</dd><dt>Reason</dt><dd>' +
          esc(g.reason) +
          '</dd><dt>Posted</dt><dd>' +
          (g.postedAt ? fmtDT(g.postedAt) : '—') +
          '</dd></dl>'
      ) +
      card('Activity', timelineHTML(g.history)) +
      '</div></div>',
    mount(page) {
      $$('[data-ia]', page).forEach(
        b =>
          (b.onclick = () => {
            const k = b.dataset.ia;
            if (k === 'edit') navigate('issue-edit/' + g.id);
            else issueAction(g, k);
          })
      );
      $('[data-dup]', page).onclick = () => duplicateDoc('issue', g);
      $('[data-print]', page).onclick = doPrint;
    }
  };
};
