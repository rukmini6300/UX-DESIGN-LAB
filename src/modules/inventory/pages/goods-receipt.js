/* =========================================================================
   GOODS RECEIPT
   GRN list, form, quality check and putaway.

   Provides: grnRec, grnRej, #/grn, grnFormPage, #/grn-create, #/grn-edit,
   grnAction, #/grn-view
   ========================================================================= */
'use strict';

const grnRec = g => sum(g.items, i => i.received || 0),
  grnRej = g => sum(g.items, i => i.rejected || 0);
ROUTES.grn = (p, q) => {
  const c = s => grns.filter(g => g.status === s);
  const m0 = new Date(NOW().getFullYear(), NOW().getMonth(), 1);
  return {
    title: 'Goods Receipt',
    crumbs: [['Inventory', 'inventory'], ['Goods Receipt', 'grn'], ['GRN List']],
    sub: 'Receive deliveries against purchase orders, inspect them and put them away.',
    actions:
      btn('Purchase Orders', 'cart', '', 'data-go="purchasing"') +
      btn('Create GRN', 'plus', 'primary', 'data-go="grn-create"'),
    body:
      '<div class="kpis mb-16">' +
      kpi('Draft receipts', c('Draft').length, 'edit', 'primary', 'Being recorded at the dock') +
      kpi(
        'Pending quality check',
        c('Pending QC').length,
        'clipboard',
        'warning',
        fmtN(sum(c('Pending QC'), grnRec)) + ' units in inspection'
      ) +
      kpi('Ready for putaway', c('Accepted').length, 'inbox', 'purple', 'Accepted, not yet stored') +
      kpi(
        'Completed this month',
        grns.filter(g => g.status === 'Completed' && g.date >= m0).length,
        'checkCircle',
        'success',
        fmtN(
          sum(
            grns.filter(g => g.status === 'Completed' && g.date >= m0),
            g => sum(g.items, i => i.accepted)
          )
        ) + ' units put away'
      ) +
      '</div><section class="card" id="gT"></section>',
    mount(page) {
      const t = mountTable(page, '#gT', {
        title: 'Goods receipts',
        sort: 'date',
        dir: -1,
        selectable: true,
        columns: [
          {
            key: 'no',
            label: 'GRN Number',
            render: g => '<a class="link mono" href="#/grn-view/' + g.id + '">' + esc(g.no) + '</a>'
          },
          { key: 'date', label: 'Receipt Date', render: g => fmtD(g.date) },
          { key: 'supplier', label: 'Supplier' },
          {
            key: 'poNo',
            label: 'Purchase Order',
            render: g => '<span class="mono">' + esc(g.poNo || 'Direct') + '</span>'
          },
          {
            key: 'wh',
            label: 'Warehouse',
            value: g => W_BY(g.warehouseId).code,
            render: g => '<span class="chip">' + esc(W_BY(g.warehouseId).code) + '</span>'
          },
          { key: 'items', label: 'Items', align: 'right', value: g => g.items.length },
          { key: 'rec', label: 'Received', align: 'right', value: grnRec, render: g => fmtN(grnRec(g)) },
          {
            key: 'rej',
            label: 'Rejected',
            align: 'right',
            value: grnRej,
            render: g =>
              grnRej(g) ? '<span class="neg">' + fmtN(grnRej(g)) + '</span>' : '<span class="subtle">0</span>'
          },
          { key: 'by', label: 'Received By', value: g => g.receivedBy, render: g => userCell(g.receivedBy) },
          { key: 'status', label: 'Status', render: g => badge(g.status) }
        ],
        data: () => grns,
        onRowClick: g => navigate('grn-view/' + g.id),
        filters: [
          {
            key: 's',
            label: 'Any status',
            value: q.status || '',
            options: ['Draft', 'Pending QC', 'Accepted', 'Completed', 'Rejected'],
            test: (g, v) => g.status === v
          },
          {
            key: 'w',
            label: 'All warehouses',
            options: activeWh().map(w => [w.id, w.code]),
            test: (g, v) => g.warehouseId === v
          },
          {
            key: 'sp',
            label: 'All suppliers',
            options: [...new Set(grns.map(g => g.supplier))].sort(),
            test: (g, v) => g.supplier === v
          }
        ],
        actions: g => [
          { label: 'View', icon: 'eye', onClick: () => navigate('grn-view/' + g.id) },
          {
            label: 'Edit',
            icon: 'edit',
            disabled: g.status !== 'Draft',
            onClick: () => navigate('grn-edit/' + g.id)
          },
          { label: 'Stock History', icon: 'history', onClick: () => navigate('ledger?type=GRN') },
          '-',
          {
            label: 'Delete',
            icon: 'trash',
            danger: true,
            onClick: () => deleteDoc('grn', g, () => t.refresh())
          }
        ]
      });
    }
  };
};
function grnFormPage(g, q) {
  q = q || {};
  const editing = !!g;
  const po0 = q.po ? purchaseOrders.find(p => p.id === q.po) : null;
  const doc = g
    ? JSON.parse(JSON.stringify(g))
    : {
        no: 'GRN-26' + String(counters.GRN + 1).padStart(5, '0'),
        date: NOW(),
        supplier: po0 ? po0.supplier : '',
        poNo: po0 ? po0.no : '',
        warehouseId: po0 ? po0.warehouseId : 'W1',
        receivedBy: CURRENT_USER.name,
        items: []
      };
  const linesFromPO = po =>
    po.items
      .filter(i => i.qty > i.received)
      .map(i => {
        const p = P_BY(i.productId);
        const rem = i.qty - i.received;
        return {
          productId: i.productId,
          ordered: rem,
          received: rem,
          accepted: rem,
          rejected: 0,
          batch: p.batch || p.expiry ? batchCode(NOW()) : '',
          expiry: p.expiry && p.shelfLife ? isoDate(addDays(NOW(), p.shelfLife)) : '',
          locationId: defaultLoc(po.warehouseId, p.expiry ? 'C' : 'A'),
          cost: i.cost
        };
      });
  if (po0 && !g) doc.items = linesFromPO(po0);
  doc.items.forEach(i => {
    if (i.expiry && typeof i.expiry !== 'string') i.expiry = isoDate(i.expiry);
    else if (i.expiry && i.expiry.length > 10) i.expiry = i.expiry.slice(0, 10);
  });
  const openPOs = purchaseOrders.filter(
    p => p.status === 'Open' || p.status === 'Partially Received' || (g && p.no === g.poNo)
  );
  return {
    title: editing ? 'Edit GRN' : 'Create GRN',
    nav: 'grn-create',
    crumbs: [['Inventory', 'inventory'], ['Goods Receipt', 'grn'], [editing ? doc.no : 'Create GRN']],
    sub: 'Purchase Order → Goods Receipt → Quality Check → Accepted → Putaway → Available Stock',
    body:
      '<form class="card" id="gform" novalidate><div class="form-section">' +
      sectionHead(1, 'Receipt details', 'Delivery, supplier and receiving site') +
      '<div class="form-grid">' +
      F({ name: 'no', label: 'GRN Number', span: 3, value: doc.no, readonly: true }) +
      F({ name: 'date', label: 'Receipt Date', type: 'date', req: true, span: 3, value: isoDate(doc.date) }) +
      F({
        name: 'poNo',
        label: 'Purchase Order',
        type: 'select',
        span: 3,
        value: doc.poNo,
        options: openPOs.map(p => [p.no, p.no + ' · ' + p.supplier.split(' ')[0]]),
        placeholder: 'Direct receipt (no PO)'
      }) +
      F({
        name: 'supplier',
        label: 'Supplier',
        type: 'select',
        req: true,
        span: 3,
        value: doc.supplier,
        options: [...new Set(Object.values(SUPPLIERS))]
      }) +
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
        name: 'receivedBy',
        label: 'Received By',
        type: 'select',
        req: true,
        span: 3,
        value: doc.receivedBy,
        options: USERS
      }) +
      F({ name: 'status', label: 'Status', span: 3, value: editing ? g.status : 'Draft', readonly: true }) +
      F({
        name: 'notes',
        label: 'Delivery note',
        span: 3,
        value: doc.notes || '',
        ph: 'Carrier delivery note number'
      }) +
      '</div></div>' +
      '<div class="form-section" style="padding-bottom:0">' +
      sectionHead(2, 'Items', 'Rejected quantity is received minus accepted') +
      '</div><div id="gLines"></div>' +
      '<div class="form-actions"><span class="spacer"></span>' +
      btn('Cancel', '', '', 'type="button" data-go="' + (editing ? 'grn-view/' + g.id : 'grn') + '"') +
      btn('Save Draft', 'save', '', 'type="button" data-act="Draft"') +
      btn('Submit for QC', 'send', 'primary', 'type="button" data-act="Pending QC"') +
      '</div></form>',
    mount(page) {
      const form = $('#gform', page);
      const wid = () => $('[name=warehouseId]', form).value;
      const poSel = () => purchaseOrders.find(p => p.no === $('[name=poNo]', form).value);
      const le = LineEditor({
        lines: doc.items,
        newLine: () => ({
          productId: '',
          ordered: null,
          received: null,
          accepted: null,
          rejected: 0,
          batch: '',
          expiry: '',
          locationId: '',
          cost: 0
        }),
        rerenderOn: ['productId'],
        focusAfter: { productId: 'received' },
        onChange: (l, k) => {
          const p = P_BY(l.productId);
          if (k === 'productId' && p) {
            l.cost = p.cost;
            l.locationId = defaultLoc(wid(), p.expiry ? 'C' : 'A');
            if (p.batch || p.expiry) l.batch = l.batch || batchCode(NOW());
            if (p.expiry && p.shelfLife) l.expiry = isoDate(addDays(NOW(), p.shelfLife));
          }
          if (k === 'received' && (l.accepted == null || l.accepted > l.received)) l.accepted = l.received;
          l.rejected = Math.max(0, (l.received || 0) - (l.accepted || 0));
          if (k === 'received') {
            const tr = $('tr[data-i="' + le.lines.indexOf(l) + '"]', le.el);
            const a = tr && $('[data-k=accepted]', tr);
            if (a) a.value = l.accepted == null ? '' : l.accepted;
          }
        },
        cols: [
          { label: 'Product', req: true },
          { label: 'Ordered Qty', align: 'right', w: '100px' },
          { label: 'Received Qty', req: true, w: '110px' },
          { label: 'Accepted Qty', w: '110px' },
          { label: 'Rejected Qty', align: 'right' },
          { label: 'Batch' },
          { label: 'Expiry Date' },
          { label: 'Location' }
        ],
        calc: l =>
          l.rejected ? '<b class="neg">' + fmtN(l.rejected) + '</b>' : '<span class="subtle">0</span>',
        rowHTML: l => {
          const p = P_BY(l.productId);
          const fromPO = !!poSel();
          return (
            '<td>' +
            lineProdSelect(
              l,
              products.filter(x => x.status !== 'Inactive')
            ) +
            '</td><td>' +
            (fromPO
              ? '<span class="ro right num" style="display:block;padding-top:6px">' +
                fmtN(l.ordered) +
                '</span>'
              : '<input class="input right" type="number" min="0" data-k="ordered" value="' +
                (l.ordered == null ? '' : l.ordered) +
                '" aria-label="Ordered quantity">') +
            '</td><td><input class="input right" type="number" min="0" data-k="received" value="' +
            (l.received == null ? '' : l.received) +
            '" aria-label="Received quantity"></td><td><input class="input right" type="number" min="0" data-k="accepted" value="' +
            (l.accepted == null ? '' : l.accepted) +
            '" aria-label="Accepted quantity"></td><td class="ro right num" data-calc="rej"></td><td><input class="input mono" data-k="batch" value="' +
            esc(l.batch || '') +
            '" placeholder="' +
            (p && (p.batch || p.expiry) ? 'Required' : 'Optional') +
            '" style="min-width:110px" aria-label="Batch"></td><td><input class="input" type="date" data-k="expiry" value="' +
            esc(l.expiry || '') +
            '"' +
            (p && p.expiry ? '' : ' disabled') +
            ' aria-label="Expiry date"></td><td><select class="select" data-k="locationId" style="min-width:150px" aria-label="Location">' +
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
          const p = P_BY(l.productId);
          if (!p) e.productId = 'Select a product';
          if (l.received == null || l.received < 1) e.received = 'Enter the received quantity';
          else if (l.ordered && l.received > Math.ceil(l.ordered * 1.1))
            e.received = 'Over-receipt beyond 10% tolerance of ' + fmtN(l.ordered);
          if (l.accepted != null && l.accepted > (l.received || 0))
            e.accepted = 'Accepted cannot exceed received';
          if (p && (p.batch || p.expiry) && !l.batch) e.batch = 'Batch is required for this product';
          if (p && p.expiry) {
            if (!l.expiry) e.expiry = 'Expiry date is required';
            else if (new Date(l.expiry) <= NOW()) e.expiry = 'Expiry date must be in the future';
          }
          if (!l.locationId) e.locationId = 'Select a putaway location';
          return e;
        },
        footer: ls =>
          '<span class="muted">' +
          ls.filter(l => l.productId).length +
          ' items</span><span>Received <b class="num">' +
          fmtN(sum(ls, l => l.received || 0)) +
          '</b></span><span>Accepted <b class="num pos">' +
          fmtN(sum(ls, l => l.accepted || 0)) +
          '</b></span><span>Rejected <b class="num neg">' +
          fmtN(sum(ls, l => l.rejected || 0)) +
          '</b></span><span>Value <b class="num">' +
          fmtM(
            sum(ls, l => (l.accepted || 0) * (l.cost || 0)),
            0
          ) +
          '</b></span>'
      });
      $('#gLines', page).append(le.el);
      $('[name=poNo]', form).addEventListener('change', () => {
        const po = poSel();
        if (po) {
          $('[name=supplier]', form).value = po.supplier;
          $('[name=warehouseId]', form).value = po.warehouseId;
          le.lines.splice(0, le.lines.length, ...linesFromPO(po));
          toast(
            'info',
            'Lines loaded from ' + po.no,
            le.lines.length + ' open lines from ' + po.supplier + '.'
          );
        } else
          le.lines.splice(0, le.lines.length, {
            productId: '',
            ordered: null,
            received: null,
            accepted: null,
            rejected: 0,
            batch: '',
            expiry: '',
            locationId: '',
            cost: 0
          });
        le.render();
      });
      $('[name=warehouseId]', form).addEventListener('change', () => {
        le.lines.forEach(l => {
          const p = P_BY(l.productId);
          l.locationId = p ? defaultLoc(wid(), p.expiry ? 'C' : 'A') : '';
        });
        le.render();
      });
      $$('[data-act]', page).forEach(
        b =>
          (b.onclick = () => {
            if (
              !validateForm(form, err => {
                const d = formData(form);
                const po = poSel();
                if (po && po.supplier !== d.supplier)
                  err('supplier', 'Supplier must match ' + po.no + ' (' + po.supplier + ')');
                if (new Date(d.date) > addDays(NOW(), 1)) err('date', 'Receipt date cannot be in the future');
              }) ||
              !le.validate()
            )
              return;
            const d = formData(form);
            let x = g;
            if (!x) {
              x = {
                id: uid('G'),
                no: nextNo('GRN'),
                history: [],
                createdBy: CURRENT_USER.name,
                createdAt: NOW()
              };
              grns.unshift(x);
              hist(x, 'Draft', CURRENT_USER.name, NOW(), 'Goods received at dock');
              logAudit('Goods Receipt', 'Created', x.no, '—', 'Status: Draft');
            }
            Object.assign(x, {
              date: new Date(d.date + 'T' + String(NOW().getHours()).padStart(2, '0') + ':00'),
              supplier: d.supplier,
              poNo: d.poNo,
              warehouseId: d.warehouseId,
              receivedBy: d.receivedBy,
              notes: d.notes,
              status: 'Draft',
              items: le.lines.map(l => ({
                productId: l.productId,
                ordered: l.ordered || l.received,
                received: l.received,
                accepted: l.accepted == null ? l.received : l.accepted,
                rejected: Math.max(0, l.received - (l.accepted == null ? l.received : l.accepted)),
                batch: l.batch,
                expiry: l.expiry ? new Date(l.expiry) : null,
                locationId: l.locationId,
                cost: l.cost
              }))
            });
            if (b.dataset.act === 'Pending QC') {
              x.status = 'Pending QC';
              hist(x, 'Pending QC', CURRENT_USER.name, NOW(), 'Submitted for quality check');
              logAudit('Goods Receipt', 'Updated', x.no, 'Status: Draft', 'Status: Pending QC');
            }
            toast(
              'success',
              x.status === 'Pending QC' ? 'GRN submitted for QC' : 'GRN saved as draft',
              x.no + ' · ' + fmtN(grnRec(x)) + ' units from ' + x.supplier + '.'
            );
            navigate('grn-view/' + x.id);
          })
      );
    }
  };
}
ROUTES['grn-create'] = (p, q) => grnFormPage(null, q);
ROUTES['grn-edit'] = id => {
  const g = grns.find(x => x.id === id);
  if (!g) return ROUTES['not-found']();
  return g.status === 'Draft' ? grnFormPage(g) : ROUTES['grn-view'](id);
};
function grnAction(g, act) {
  const set = (s, note) => {
    const o = g.status;
    g.status = s;
    hist(g, s, CURRENT_USER.name, NOW(), note);
    logAudit('Goods Receipt', 'Updated', g.no, 'Status: ' + o, 'Status: ' + s);
    renderRoute();
  };
  if (act === 'submit') {
    set('Pending QC', 'Submitted for quality check');
    toast('success', 'Submitted for QC', g.no + ' is waiting for inspection.');
  }
  if (act === 'qc') {
    const body = el(
      '<div><p class="muted" style="margin-bottom:12px">Record the inspection result for each line. Rejected units stay in quarantine and are not added to stock.</p><div class="table-wrap auto" style="border:1px solid var(--border);border-radius:var(--r-md)"><table class="tbl items-tbl"><thead><tr><th>Product</th><th class="right">Received</th><th style="width:120px">Accepted</th><th class="right">Rejected</th></tr></thead><tbody>' +
        g.items
          .map(
            (i, k) =>
              '<tr data-k="' +
              k +
              '"><td>' +
              esc(P_BY(i.productId).name) +
              '</td><td class="ro right num">' +
              fmtN(i.received) +
              '</td><td><input class="input right" type="number" min="0" max="' +
              i.received +
              '" value="' +
              i.accepted +
              '" aria-label="Accepted quantity"></td><td class="ro right num" data-r>' +
              fmtN(i.rejected) +
              '</td></tr>'
          )
          .join('') +
        '</tbody></table></div><div class="form-grid mt-16">' +
        F({
          name: 'note',
          label: 'Inspection notes',
          span: 12,
          ph: 'e.g. 2 cartons crushed, outer packaging wet'
        }) +
        F({
          name: 'inspector',
          label: 'Inspector',
          type: 'select',
          span: 12,
          value: 'Ethan Brooks',
          placeholder: false,
          options: USERS
        }) +
        '</div></div>'
    );
    body.addEventListener('input', e => {
      const tr = e.target.closest('tr[data-k]');
      if (tr) {
        const i = g.items[+tr.dataset.k];
        $('[data-r]', tr).textContent = fmtN(Math.max(0, i.received - (+e.target.value || 0)));
      }
    });
    openModal({
      type: 'edit',
      icon: 'clipboard',
      title: 'Quality check · ' + g.no,
      subtitle: esc(g.supplier) + ' · ' + fmtN(grnRec(g)) + ' units',
      size: 'lg',
      body,
      actions: [
        { label: 'Cancel' },
        {
          label: 'Reject all',
          variant: 'danger-ghost',
          onClick: () => {
            g.items.forEach(i => {
              i.accepted = 0;
              i.rejected = i.received;
            });
            g.qcBy = formData(body).inspector;
            g.qcAt = NOW();
            set('Rejected', 'All lines failed inspection. ' + (formData(body).note || ''));
            toast('warning', 'Receipt rejected', g.no + ' returned to supplier.');
          }
        },
        {
          label: 'Accept inspected quantities',
          variant: 'primary',
          icon: 'check',
          onClick: api => {
            let bad = false;
            $$('tr[data-k]', body).forEach(tr => {
              const i = g.items[+tr.dataset.k];
              const inp = $('input', tr);
              const v = +inp.value;
              if (inp.value === '' || v < 0 || v > i.received) {
                inp.classList.add('invalid');
                bad = true;
              }
            });
            if (bad) {
              toast(
                'error',
                'Check accepted quantities',
                'Accepted must be between 0 and the received quantity.'
              );
              return false;
            }
            $$('tr[data-k]', body).forEach(tr => {
              const i = g.items[+tr.dataset.k];
              i.accepted = +$('input', tr).value;
              i.rejected = i.received - i.accepted;
            });
            const d = formData(body);
            g.qcBy = d.inspector;
            g.qcAt = NOW();
            set(
              'Accepted',
              (grnRej(g) ? fmtN(grnRej(g)) + ' units rejected. ' : 'All lines passed. ') + (d.note || '')
            );
            toast(
              'success',
              'Quality check recorded',
              fmtN(sum(g.items, i => i.accepted)) +
                ' accepted' +
                (grnRej(g) ? ', ' + fmtN(grnRej(g)) + ' rejected' : '') +
                '.'
            );
          }
        }
      ]
    });
  }
  if (act === 'putaway')
    confirmDialog({
      title: 'Put away ' + g.no + '?',
      message:
        fmtN(sum(g.items, i => i.accepted)) +
        ' accepted units are added to stock at ' +
        esc(W_BY(g.warehouseId).name) +
        ' in the assigned locations.',
      confirm: 'Post putaway'
    }).then(ok => {
      if (!ok) return;
      g.items.forEach(i => {
        if (i.accepted > 0)
          postMovement({
            type: 'GRN',
            pid: i.productId,
            wid: g.warehouseId,
            inQty: i.accepted,
            txNo: g.no,
            ref: g.poNo || g.supplier,
            bucket: 'received',
            batch: i.batch || undefined,
            expiry: i.expiry,
            locationId: i.locationId,
            cost: i.cost
          });
      });
      const po = purchaseOrders.find(p => p.no === g.poNo);
      if (po) {
        g.items.forEach(i => {
          const pi = po.items.find(x => x.productId === i.productId);
          if (pi) pi.received += i.accepted;
        });
        const o = po.status;
        po.status = po.items.every(x => x.received >= x.qty) ? 'Received' : 'Partially Received';
        if (o !== po.status) logAudit('Purchasing', 'Updated', po.no, 'Status: ' + o, 'Status: ' + po.status);
      }
      g.postedAt = NOW();
      set('Completed', 'Put away to storage. Stock available.');
      toast(
        'success',
        'Stock received',
        'Available stock increased by ' + fmtN(sum(g.items, i => i.accepted)) + ' units.',
        { label: 'View ledger', onClick: () => navigate('ledger?type=GRN') }
      );
    });
}
ROUTES['grn-view'] = id => {
  const g = grns.find(x => x.id === id);
  if (!g) return ROUTES['not-found']();
  const A =
    {
      Draft: [
        ['Edit', 'edit', '', 'edit'],
        ['Delete', 'trash', 'danger-ghost', 'delete'],
        ['Submit for QC', 'send', 'primary', 'submit']
      ],
      'Pending QC': [['Record Quality Check', 'clipboard', 'primary', 'qc']],
      Accepted: [['Put Away', 'inbox', 'success', 'putaway']]
    }[g.status] || [];
  return {
    title: g.no,
    nav: 'grn',
    crumbs: [['Inventory', 'inventory'], ['Goods Receipt', 'grn'], [g.no]],
    titleHTML: 'Goods Receipt <span class="mono" style="font-weight:600">' + esc(g.no) + '</span>',
    sub:
      esc(g.supplier) +
      ' · ' +
      esc(g.poNo || 'Direct receipt') +
      ' · ' +
      esc(W_BY(g.warehouseId).name) +
      ' · ' +
      fmtD(g.date),
    actions: btn('Print', 'print', '', 'data-print'),
    body:
      docHeaderCard(
        g.no,
        g.status,
        flowFor('grn', g.status, histMeta(g, 'grn')),
        A.map(x => btn(x[0], x[1], x[2], 'data-ga="' + x[3] + '"')).join('')
      ) +
      '<div class="grid g-main"><div class="stack">' +
      card(
        'Items',
        '<div class="table-wrap auto"><table class="tbl"><thead><tr><th>Product</th><th class="right">Ordered Qty</th><th class="right">Received Qty</th><th class="right">Accepted Qty</th><th class="right">Rejected Qty</th><th>Batch</th><th>Expiry Date</th><th>Location</th></tr></thead><tbody>' +
          g.items
            .map(
              i =>
                '<tr><td>' +
                prodCell(P_BY(i.productId)) +
                '</td><td class="right num">' +
                fmtN(i.ordered) +
                '</td><td class="right num">' +
                fmtN(i.received) +
                '</td><td class="right num pos">' +
                fmtN(i.accepted) +
                '</td><td class="right num ' +
                (i.rejected ? 'neg' : 'subtle') +
                '">' +
                fmtN(i.rejected) +
                '</td><td class="mono">' +
                esc(i.batch || '—') +
                '</td><td>' +
                (i.expiry ? fmtD(i.expiry) : '—') +
                '</td><td class="mono">' +
                esc((L_BY(i.locationId) || {}).code || '—') +
                '</td></tr>'
            )
            .join('') +
          '</tbody><tfoot><tr><td><b>Total</b></td><td class="right num">' +
          fmtN(sum(g.items, i => i.ordered)) +
          '</td><td class="right num">' +
          fmtN(grnRec(g)) +
          '</td><td class="right num">' +
          fmtN(sum(g.items, i => i.accepted)) +
          '</td><td class="right num">' +
          fmtN(grnRej(g)) +
          '</td><td colspan="3"></td></tr></tfoot></table></div>',
        { tight: true }
      ) +
      '</div>' +
      '<div class="stack">' +
      card(
        'Details',
        '<dl class="dl"><dt>GRN number</dt><dd class="mono">' +
          esc(g.no) +
          '</dd><dt>Receipt date</dt><dd>' +
          fmtD(g.date) +
          '</dd><dt>Supplier</dt><dd>' +
          esc(g.supplier) +
          '</dd><dt>Purchase order</dt><dd class="mono">' +
          esc(g.poNo || 'Direct') +
          '</dd><dt>Warehouse</dt><dd>' +
          esc(W_BY(g.warehouseId).name) +
          '</dd><dt>Received by</dt><dd>' +
          esc(g.receivedBy) +
          '</dd><dt>Inspected by</dt><dd>' +
          esc(g.qcBy || '—') +
          '</dd><dt>Delivery note</dt><dd>' +
          esc(g.notes || '—') +
          '</dd><dt>Value accepted</dt><dd class="num">' +
          fmtM(sum(g.items, i => i.accepted * (i.cost || 0))) +
          '</dd></dl>'
      ) +
      card('Activity', timelineHTML(g.history)) +
      '</div></div>',
    mount(page) {
      $$('[data-ga]', page).forEach(
        b =>
          (b.onclick = () => {
            const k = b.dataset.ga;
            if (k === 'edit') navigate('grn-edit/' + g.id);
            else if (k === 'delete') deleteDoc('grn', g, () => navigate('grn'));
            else grnAction(g, k);
          })
      );
      $('[data-print]', page).onclick = doPrint;
    }
  };
};
