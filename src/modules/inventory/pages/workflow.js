/* =========================================================================
   WORKFLOW
   Procure-to-issue and adjustment workflow maps.

   Provides: #/workflow
   ========================================================================= */
'use strict';

ROUTES.workflow = () => {
  const wf = workflowModel();
  const dist = (name, list, flow, route) => {
    const c = {};
    list.forEach(d => (c[d.status] = (c[d.status] || 0) + 1));
    return (
      '<div style="padding:14px 0;border-bottom:1px solid var(--border)"><div class="row between"><b style="font-weight:600">' +
      name +
      '</b><a class="link" style="font-size:12.5px" href="#/' +
      route +
      '">Open list</a></div><div class="row wrap mt-8" style="gap:6px">' +
      flow
        .map(
          s =>
            '<span class="chip">' +
            esc(s) +
            ' <b class="num" style="margin-left:6px;color:var(--text)">' +
            (c[s] || 0) +
            '</b></span>'
        )
        .join('') +
      '</div></div>'
    );
  };
  return {
    title: 'Inventory Workflow',
    crumbs: [['Inventory', 'inventory'], ['Inventory Workflow']],
    sub: 'How stock moves from the item master to the ledger. Each stage shows live counts; select a stage to open the documents behind it.',
    actions: btn('Refresh', 'refresh', '', 'data-go="workflow"'),
    body:
      '<div class="grid g-7-5"><div class="stack">' +
      card('Procure-to-issue flow', legendWF + '<div class="mt-16">' + flowListHTML(wf.main) + '</div>', {
        sub: '11 stages, purchasing to inventory ledger'
      }) +
      '</div><div class="stack">' +
      card('Stock adjustment flow', flowListHTML(wf.adj), {
        sub: 'Corrections require approval before posting'
      }) +
      card(
        'Document status',
        dist(
          'Stock transfers',
          stockTransfers,
          ['Draft', 'Submitted', 'Approved', 'In Transit', 'Received', 'Completed', 'Rejected'],
          'stock-transfer'
        ) +
          dist(
            'Stock adjustments',
            stockAdjustments,
            ['Draft', 'Submitted', 'Approved', 'Posted', 'Rejected'],
            'stock-adjustment'
          ) +
          dist('Goods receipts', grns, ['Draft', 'Pending QC', 'Accepted', 'Completed'], 'grn') +
          '<div style="padding-top:14px">' +
          dist(
            'Goods issues',
            goodsIssues,
            ['Requested', 'Approved', 'Picked', 'Issued', 'Rejected'],
            'goods-issue'
          ).replace('border-bottom:1px solid var(--border)', '') +
          '</div>',
        { sub: 'Documents by lifecycle stage' }
      ) +
      '</div></div>'
  };
};
