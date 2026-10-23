/* =========================================================================
   STOCK COUNT
   Cycle counts and their variances.

   Provides: #/stock-count, #/count-view
   ========================================================================= */
'use strict';

ROUTES['stock-count'] = () => ({
  title: 'Stock Count',
  crumbs: [['Inventory', 'inventory'], ['Stock Management', 'stock'], ['Stock Count']],
  sub: 'Cycle counts compare physical quantities with system stock. Variances become a correction adjustment.',
  actions: btn('Start Count', 'plus', 'primary', 'data-new'),
  body: '<section class="card" id="cT"></section>',
  mount(page) {
    const t = mountTable(page, '#cT', {
      title: 'Stock counts',
      sort: 'date',
      dir: -1,
      columns: [
        {
          key: 'no',
          label: 'Count No',
          render: c => '<a class="link mono" href="#/count-view/' + c.id + '">' + esc(c.no) + '</a>'
        },
        { key: 'date', label: 'Date', render: c => fmtD(c.date) },
        { key: 'wh', label: 'Warehouse', value: c => W_BY(c.warehouseId).name },
        { key: 'zone', label: 'Zone', value: c => 'Zone ' + c.zone },
        { key: 'lines', label: 'Lines', align: 'right', value: c => c.lines.length },
        {
          key: 'done',
          label: 'Counted',
          value: c => c.lines.filter(l => l.counted != null).length / c.lines.length,
          render: c =>
            utilHTML(Math.round((c.lines.filter(l => l.counted != null).length / c.lines.length) * 100))
        },
        {
          key: 'var',
          label: 'Variances',
          align: 'right',
          value: c => c.lines.filter(l => l.counted != null && l.counted !== l.system).length
        },
        { key: 'by', label: 'Counted By', render: c => userCell(c.countedBy) },
        {
          key: 'adj',
          label: 'Adjustment',
          value: c => c.adjNo || '—',
          render: c =>
            c.adjNo ? '<span class="mono">' + esc(c.adjNo) + '</span>' : '<span class="subtle">—</span>'
        },
        { key: 'status', label: 'Status', render: c => badge(c.status) }
      ],
      data: () => stockCounts,
      onRowClick: c => navigate('count-view/' + c.id),
      actions: c => [
        { label: 'Open count sheet', icon: 'eye', onClick: () => navigate('count-view/' + c.id) },
        '-',
        {
          label: 'Delete',
          icon: 'trash',
          danger: true,
          disabled: c.status === 'Completed',
          onClick: () =>
            confirmDialog({
              danger: true,
              title: 'Delete ' + c.no + '?',
              message:
                'The count sheet and entered quantities will be deleted. This action cannot be undone.',
              confirm: 'Delete count'
            }).then(ok => {
              if (ok) {
                stockCounts.splice(stockCounts.indexOf(c), 1);
                logAudit('Stock Count', 'Deleted', c.no, 'In Progress', '—');
                toast('success', 'Count deleted', c.no + ' removed.');
                t.refresh();
              }
            })
        }
      ],
      emptyTitle: 'No counts yet',
      emptyText: 'Start a cycle count for a warehouse zone.',
      emptyAction: { label: 'Start Count', onClick: () => $('[data-new]', page).click() }
    });
    $('[data-new]', page).onclick = () => {
      const b = el(
        '<form novalidate><div class="form-grid">' +
          F({
            name: 'wid',
            label: 'Warehouse',
            type: 'select',
            req: true,
            span: 6,
            value: 'W1',
            placeholder: false,
            options: whOptions()
          }) +
          F({
            name: 'zone',
            label: 'Zone',
            type: 'select',
            req: true,
            span: 6,
            value: '',
            placeholder: 'All zones',
            options: [
              ['A', 'A · Bulk storage'],
              ['B', 'B · Pick face'],
              ['C', 'C · Controlled'],
              ['Q', 'Q · Quarantine']
            ]
          }) +
          F({
            name: 'by',
            label: 'Counter',
            type: 'select',
            req: true,
            span: 12,
            value: CURRENT_USER.name,
            options: USERS
          }) +
          '</div><p class="hint mt-16">System quantities are frozen when the count sheet is created.</p></form>'
      );
      b.querySelector('[name=zone]').removeAttribute('data-req');
      openModal({
        type: 'create',
        title: 'Start stock count',
        subtitle: 'Generate a count sheet for a warehouse zone',
        body: b,
        actions: [
          { label: 'Cancel' },
          {
            label: 'Create count sheet',
            variant: 'primary',
            onClick: () => {
              if (!validateForm(b)) return false;
              const d = formData(b);
              const rows = stock.filter(
                s =>
                  s.warehouseId === d.wid &&
                  s.qty > 0 &&
                  (!d.zone || (L_BY(s.locationId) || {}).zone === d.zone)
              );
              if (!rows.length) {
                toast('warning', 'Nothing to count', 'No stock is held in that zone.');
                return false;
              }
              const c = {
                id: uid('CNT'),
                no: nextNo('CNT'),
                date: NOW(),
                warehouseId: d.wid,
                zone: d.zone || 'All',
                status: 'In Progress',
                countedBy: d.by,
                lines: rows.map(s => ({ productId: s.productId, system: s.qty, counted: null })),
                adjNo: ''
              };
              stockCounts.unshift(c);
              logAudit('Stock Count', 'Created', c.no, '—', rows.length + ' lines');
              toast('success', 'Count sheet created', c.no + ' with ' + rows.length + ' lines.');
              navigate('count-view/' + c.id);
            }
          }
        ]
      });
    };
  }
});
TONE['In Progress'] = 'info';
ROUTES['count-view'] = id => {
  const c = stockCounts.find(x => x.id === id);
  if (!c) return ROUTES['not-found']();
  const done = c.status === 'Completed';
  return {
    title: c.no,
    nav: 'stock-count',
    crumbs: [
      ['Inventory', 'inventory'],
      ['Stock Management', 'stock'],
      ['Stock Count', 'stock-count'],
      [c.no]
    ],
    titleHTML:
      'Count Sheet <span class="mono" style="font-weight:600">' + esc(c.no) + '</span> ' + badge(c.status),
    sub:
      esc(W_BY(c.warehouseId).name) +
      ' · Zone ' +
      esc(c.zone) +
      ' · counted by ' +
      esc(c.countedBy) +
      ' · started ' +
      fmtDT(c.date),
    actions: done
      ? btn('Print', 'print', '', 'data-print')
      : btn('Save progress', 'save', '', 'data-save') +
        btn('Complete count', 'checkCircle', 'primary', 'data-done'),
    body:
      (done
        ? '<div class="alert alert-success mb-16">' +
          icon('checkCircle', 16) +
          '<span>Count completed.' +
          (c.adjNo
            ? ' Variances were sent for approval as <b>' + esc(c.adjNo) + '</b>.'
            : ' No variances found.') +
          '</span></div>'
        : '<div class="alert alert-info mb-16">' +
          icon('info', 16) +
          '<span>Enter the physical quantity for each line. Lines with a variance are highlighted.</span></div>') +
      '<section class="card"><div class="table-wrap auto"><table class="tbl" id="cnt"><thead><tr><th>Product</th><th>Location</th><th class="right">System Qty</th><th class="right" style="width:140px">Counted Qty</th><th class="right">Variance</th><th class="right">Value</th></tr></thead><tbody>' +
      c.lines
        .map((l, i) => {
          const p = P_BY(l.productId);
          const r = stockRow(l.productId, c.warehouseId);
          const v = l.counted == null ? null : l.counted - l.system;
          return (
            '<tr data-i="' +
            i +
            '" class="' +
            (v ? 'var-row' : '') +
            '"><td>' +
            prodCell(p) +
            '</td><td class="mono">' +
            esc(r ? (L_BY(r.locationId) || {}).code : '—') +
            '</td><td class="right num">' +
            fmtN(l.system) +
            '</td><td class="right">' +
            (done
              ? '<span class="num">' + fmtN(l.counted) + '</span>'
              : '<input class="input input-sm right" type="number" min="0" value="' +
                (l.counted == null ? '' : l.counted) +
                '" data-cnt aria-label="Counted quantity">') +
            '</td><td class="right num" data-v>' +
            (v == null
              ? '<span class="subtle">—</span>'
              : '<b class="' +
                (v > 0 ? 'pos' : v < 0 ? 'neg' : 'muted') +
                '">' +
                (v > 0 ? '+' : v < 0 ? '−' : '') +
                fmtN(Math.abs(v)) +
                '</b>') +
            '</td><td class="right num" data-val>' +
            (v ? fmtM(v * p.cost) : '—') +
            '</td></tr>'
          );
        })
        .join('') +
      '</tbody></table></div><div class="items-foot"><span class="muted" id="cntSum"></span></div></section>',
    mount(page) {
      const sumUp = () => {
        const n = c.lines.filter(l => l.counted != null).length,
          v = c.lines.filter(l => l.counted != null && l.counted !== l.system);
        $('#cntSum', page).innerHTML =
          n +
          ' of ' +
          c.lines.length +
          ' lines counted · ' +
          v.length +
          ' variance' +
          (v.length === 1 ? '' : 's') +
          ' · net ' +
          fmtM(sum(v, l => (l.counted - l.system) * P_BY(l.productId).cost));
      };
      sumUp();
      $$('[data-cnt]', page).forEach(inp =>
        inp.addEventListener('input', () => {
          const tr = inp.closest('tr');
          const l = c.lines[+tr.dataset.i];
          l.counted = inp.value === '' ? null : Math.max(0, +inp.value);
          const v = l.counted == null ? null : l.counted - l.system;
          tr.classList.toggle('var-row', !!v);
          $('[data-v]', tr).innerHTML =
            v == null
              ? '<span class="subtle">—</span>'
              : '<b class="' +
                (v > 0 ? 'pos' : v < 0 ? 'neg' : 'muted') +
                '">' +
                (v > 0 ? '+' : v < 0 ? '−' : '') +
                fmtN(Math.abs(v)) +
                '</b>';
          $('[data-val]', tr).textContent = v ? fmtM(v * P_BY(l.productId).cost) : '—';
          sumUp();
        })
      );
      const pr = $('[data-print]', page);
      if (pr) pr.onclick = doPrint;
      const sv = $('[data-save]', page);
      if (sv)
        sv.onclick = () => {
          logAudit(
            'Stock Count',
            'Updated',
            c.no,
            '—',
            c.lines.filter(l => l.counted != null).length + ' lines counted'
          );
          toast(
            'success',
            'Progress saved',
            c.lines.filter(l => l.counted != null).length + ' of ' + c.lines.length + ' lines counted.'
          );
        };
      const dn = $('[data-done]', page);
      if (dn)
        dn.onclick = () => {
          const miss = c.lines.filter(l => l.counted == null).length;
          if (miss) {
            messageModal(
              'warning',
              'Count incomplete',
              '<p>' +
                miss +
                ' lines have no counted quantity. Enter a quantity for every line, including zero for empty bins.</p>'
            );
            $$('[data-cnt]', page).forEach(i => {
              if (i.value === '') i.classList.add('invalid');
            });
            return;
          }
          const vars = c.lines.filter(l => l.counted !== l.system);
          confirmDialog({
            title: 'Complete ' + c.no + '?',
            message: vars.length
              ? vars.length + ' variances will be submitted as a Correction adjustment for approval.'
              : 'No variances were found. The count will be closed.',
            confirm: 'Complete count'
          }).then(ok => {
            if (!ok) return;
            if (vars.length) {
              const a = {
                id: uid('ADJ'),
                no: nextNo('ADJ'),
                date: NOW(),
                warehouseId: c.warehouseId,
                type: 'Correction',
                reason: 'Cycle count variance',
                reference: c.no,
                status: 'Submitted',
                items: vars.map(l => ({
                  productId: l.productId,
                  systemQty: l.system,
                  physicalQty: l.counted,
                  cost: P_BY(l.productId).cost,
                  reason: 'Count variance'
                })),
                history: [],
                createdBy: CURRENT_USER.name,
                createdAt: NOW()
              };
              hist(a, 'Draft', CURRENT_USER.name, NOW(), 'Created from ' + c.no);
              hist(a, 'Submitted', CURRENT_USER.name, NOW(), 'Sent for approval');
              stockAdjustments.unshift(a);
              c.adjNo = a.no;
              logAudit('Stock Adjustment', 'Created', a.no, '—', 'From count ' + c.no);
            }
            c.status = 'Completed';
            logAudit('Stock Count', 'Updated', c.no, 'Status: In Progress', 'Status: Completed');
            toast(
              'success',
              'Count completed',
              vars.length ? c.adjNo + ' created for approval.' : 'No variances found.'
            );
            renderRoute();
          });
        };
    }
  };
};
