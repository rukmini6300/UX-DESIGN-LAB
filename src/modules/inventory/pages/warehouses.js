/* =========================================================================
   WAREHOUSES
   Warehouse list, form, details, storage locations and warehouse stock.

   Provides: whUtil, utilHTML, whColumns, deleteWarehouse, whActions,
   #/warehouses, warehouseForm, whFormPage, #/warehouse-create,
   #/warehouse-edit, #/warehouse-view, locStock, locColumns, locActions,
   locationModal, #/locations, #/warehouse-stock
   ========================================================================= */
'use strict';

const whUtil = w => Math.round((sum(whStock(w.id), s => s.qty) / w.capacity) * 100);
function utilHTML(p) {
  return (
    '<div class="util" style="min-width:120px"><div class="bar ' +
    (p > 90 ? 'd' : p > 75 ? 'w' : 's') +
    '"><i style="width:' +
    clamp(p, 0, 100) +
    '%"></i></div><span>' +
    p +
    '%</span></div>'
  );
}
function whColumns() {
  return [
    {
      key: 'code',
      label: 'Warehouse Code',
      render: w => '<span class="mono strong">' + esc(w.code) + '</span>'
    },
    {
      key: 'name',
      label: 'Warehouse Name',
      render: w =>
        '<div class="cell-main"><span class="thumb" style="background:var(--primary-soft);color:var(--primary-text)">' +
        icon('warehouse', 16) +
        '</span><div><b><a class="link" style="color:var(--text);font-weight:600" href="#/warehouse-view/' +
        w.id +
        '">' +
        esc(w.name) +
        '</a></b><small>' +
        esc(w.type) +
        '</small></div></div>'
    },
    { key: 'location', label: 'Location', value: w => w.city + ', ' + w.state },
    { key: 'manager', label: 'Manager', render: w => userCell(w.manager) },
    { key: 'products', label: 'Total Products', align: 'right', value: w => whStock(w.id).length },
    {
      key: 'qty',
      label: 'Stock Quantity',
      align: 'right',
      value: w => sum(whStock(w.id), s => s.qty),
      render: w => fmtN(sum(whStock(w.id), s => s.qty))
    },
    {
      key: 'value',
      label: 'Stock Value',
      align: 'right',
      value: w => whValue(w.id),
      render: w => fmtM(whValue(w.id), 0)
    },
    { key: 'util', label: 'Utilization', value: whUtil, render: w => utilHTML(whUtil(w)), export: false },
    { key: 'status', label: 'Status', render: w => badge(w.status) }
  ];
}
function deleteWarehouse(w, after) {
  const q = sum(whStock(w.id), s => s.qty);
  const tx = ledger.filter(e => e.warehouseId === w.id).length;
  if (q > 0 || tx) {
    openModal({
      type: 'warning',
      title: 'This warehouse can’t be deleted',
      size: 'sm',
      body:
        '<p>This warehouse cannot be deleted because inventory transactions exist.</p><div class="callout"><b>' +
        esc(w.name) +
        '</b> holds ' +
        fmtN(q) +
        ' units across ' +
        whStock(w.id).length +
        ' products and has ' +
        fmtN(tx) +
        ' ledger entries. Set it to Inactive to stop new receipts.</div>',
      actions: [
        { label: 'Close' },
        {
          label: 'View Transactions',
          variant: 'primary',
          icon: 'history',
          onClick: () => navigate('ledger?warehouse=' + w.id)
        }
      ]
    });
    return;
  }
  confirmDialog({
    danger: true,
    title: 'Delete warehouse?',
    message:
      'Are you sure you want to delete “' +
      esc(w.name) +
      '”? Its ' +
      locsOf(w.id).length +
      ' storage locations are deleted too. This action cannot be undone.',
    confirm: 'Delete Warehouse'
  }).then(ok => {
    if (!ok) return;
    warehouses.splice(warehouses.indexOf(w), 1);
    for (let i = locations.length - 1; i >= 0; i--)
      if (locations[i].warehouseId === w.id) locations.splice(i, 1);
    logAudit('Inventory', 'Deleted', w.code, w.name, '—');
    toast('success', 'Warehouse deleted', w.name + ' was removed.');
    after && after();
  });
}
function whActions(w, refresh) {
  return [
    { label: 'View', icon: 'eye', onClick: () => navigate('warehouse-view/' + w.id) },
    { label: 'Edit', icon: 'edit', onClick: () => navigate('warehouse-edit/' + w.id) },
    { label: 'Duplicate', icon: 'copy', onClick: () => navigate('warehouse-create?from=' + w.id) },
    { label: 'Stock History', icon: 'history', onClick: () => navigate('ledger?warehouse=' + w.id) },
    '-',
    { label: 'Delete', icon: 'trash', danger: true, onClick: () => deleteWarehouse(w, refresh) }
  ];
}
ROUTES.warehouses = () => ({
  title: 'Warehouses',
  crumbs: [['Inventory', 'inventory'], ['Warehouses', 'warehouses'], ['Warehouse List']],
  sub:
    warehouses.length +
    ' sites · ' +
    activeWh().length +
    ' active · ' +
    locations.length +
    ' storage locations',
  actions:
    btn('Storage Locations', 'pin', '', 'data-go="locations"') +
    btn('Create Warehouse', 'plus', 'primary', 'data-go="warehouse-create"'),
  body: '<section class="card" id="whT"></section>',
  mount(page) {
    const t = mountTable(page, '#whT', {
      title: 'Warehouses',
      selectable: true,
      columns: whColumns(),
      data: () => warehouses,
      searchPlaceholder: 'Search code, name, city',
      filters: [
        { key: 'st', label: 'Any status', options: ['Active', 'Inactive'], test: (w, v) => w.status === v },
        {
          key: 'type',
          label: 'All types',
          options: [...new Set(warehouses.map(w => w.type))],
          test: (w, v) => w.type === v
        }
      ],
      actions: w => whActions(w, () => t.refresh()),
      onRowClick: w => navigate('warehouse-view/' + w.id),
      bulkActions: [
        {
          label: 'Mark active',
          icon: 'checkCircle',
          onClick: ids => {
            ids.forEach(id => {
              const w = W_BY(id);
              if (w.status !== 'Active') {
                logAudit('Inventory', 'Updated', w.code, 'Status: ' + w.status, 'Status: Active');
                w.status = 'Active';
              }
            });
            toast('success', 'Warehouses updated', ids.length + ' set to Active.');
            t.clearSelection();
          }
        },
        {
          label: 'Mark inactive',
          icon: 'ban',
          onClick: ids => {
            const blocked = ids.filter(id => whStock(id).length);
            if (blocked.length) {
              messageModal(
                'warning',
                'Some warehouses hold stock',
                '<p>' +
                  blocked.map(id => esc(W_BY(id).name)).join(', ') +
                  ' still hold stock. Transfer it out before deactivating.</p>'
              );
              return;
            }
            ids.forEach(id => {
              const w = W_BY(id);
              logAudit('Inventory', 'Updated', w.code, 'Status: ' + w.status, 'Status: Inactive');
              w.status = 'Inactive';
            });
            toast('success', 'Warehouses updated', ids.length + ' set to Inactive.');
            t.clearSelection();
          }
        },
        {
          label: 'Export selected',
          icon: 'export',
          onClick: ids =>
            exportCSV(
              'Selected warehouses',
              whColumns().filter(c => c.export !== false),
              warehouses.filter(w => ids.includes(w.id))
            )
        }
      ],
      footer: rs => [
        '<b>' + rs.length + ' warehouses</b>',
        '',
        '',
        '',
        fmtN(sum(rs, w => whStock(w.id).length)),
        fmtN(sum(rs, w => sum(whStock(w.id), s => s.qty))),
        fmtM(
          sum(rs, w => whValue(w.id)),
          0
        ),
        '',
        ''
      ],
      emptyTitle: 'No warehouses yet',
      emptyText: 'Add a warehouse to start receiving stock.',
      emptyAction: { label: 'Create Warehouse', onClick: () => navigate('warehouse-create') }
    });
  }
});
function warehouseForm(w, mode) {
  const v = k => (w ? w[k] : '');
  return (
    '<div class="form-section">' +
    sectionHead(1, 'Warehouse details', 'Name, code and type') +
    '<div class="form-grid">' +
    F({
      name: 'name',
      label: 'Warehouse Name',
      req: true,
      span: 6,
      value: v('name'),
      ph: 'e.g. Phoenix Distribution Center'
    }) +
    F({
      name: 'code',
      label: 'Warehouse Code',
      req: true,
      span: 3,
      value: mode === 'dup' ? '' : v('code'),
      pattern: '^WH-[A-Z]{3}$',
      patternMsg: 'Use the format WH-ABC',
      ph: 'WH-PHX',
      readonly: mode === 'edit'
    }) +
    F({
      name: 'type',
      label: 'Warehouse type',
      type: 'select',
      req: true,
      span: 3,
      value: v('type') || 'Distribution Center',
      placeholder: false,
      options: [
        'Distribution Center',
        'Fulfillment Hub',
        'Port Warehouse',
        'Regional Store',
        'Overflow',
        'Plant Store'
      ]
    }) +
    F({
      name: 'capacity',
      label: 'Capacity',
      type: 'number',
      req: true,
      min: 1,
      span: 3,
      suffix: 'units',
      value: v('capacity') || 5000
    }) +
    F({
      name: 'status',
      label: 'Status',
      type: 'select',
      req: true,
      span: 3,
      value: v('status') || 'Active',
      placeholder: false,
      options: ['Active', 'Inactive']
    }) +
    '</div></div>' +
    '<div class="form-section">' +
    sectionHead(2, 'Address', 'Physical site location') +
    '<div class="form-grid">' +
    F({ name: 'address', label: 'Address', req: true, span: 12, value: v('address'), ph: 'Street address' }) +
    F({ name: 'city', label: 'City', req: true, span: 4, value: v('city') }) +
    F({ name: 'state', label: 'State', req: true, span: 4, value: v('state'), ph: 'e.g. AZ' }) +
    F({
      name: 'country',
      label: 'Country',
      type: 'select',
      req: true,
      span: 4,
      value: v('country') || 'United States',
      placeholder: false,
      options: ['United States', 'Canada', 'Mexico', 'Japan', 'Germany', 'United Kingdom']
    }) +
    '</div></div>' +
    '<div class="form-section">' +
    sectionHead(3, 'Contact', 'Site manager and communications') +
    '<div class="form-grid">' +
    F({
      name: 'manager',
      label: 'Manager',
      type: 'select',
      req: true,
      span: 4,
      value: v('manager'),
      options: USERS
    }) +
    F({
      name: 'contact',
      label: 'Contact',
      req: true,
      span: 4,
      value: v('contact'),
      pattern: '^[+0-9 ()-]{7,20}$',
      patternMsg: 'Enter a valid phone number',
      ph: '+1 (602) 555-0100'
    }) +
    F({
      name: 'email',
      label: 'Email',
      type: 'email',
      req: true,
      span: 4,
      value: v('email'),
      ph: 'site@kagami-erp.com'
    }) +
    '</div></div>'
  );
}
function whFormPage(w, mode, src) {
  const title = mode === 'edit' ? 'Edit Warehouse' : src ? 'Duplicate Warehouse' : 'Create Warehouse';
  return {
    title,
    nav: 'warehouses',
    crumbs: [
      ['Inventory', 'inventory'],
      ['Warehouses', 'warehouses']
    ].concat(mode === 'edit' ? [[w.name, 'warehouse-view/' + w.id], ['Edit']] : [[title]]),
    sub:
      mode === 'edit'
        ? '<span class="mono">' +
          esc(w.code) +
          '</span> · created ' +
          fmtD(w.createdAt || new Date(2025, 0, 6)) +
          ' · ' +
          locsOf(w.id).length +
          ' storage locations'
        : src
          ? 'Copying details from ' + esc(src.name) + '. Storage locations are generated for the new site.'
          : 'Register a new storage site. A default zone layout is created automatically.',
    body:
      '<form class="card" id="wform" novalidate>' +
      warehouseForm(w, mode) +
      (mode !== 'edit'
        ? '<div class="form-section">' +
          sectionHead(4, 'Default layout', 'Zones created with the warehouse') +
          '<div class="form-grid">' +
          F({ name: 'zA', label: 'Zone A · Bulk storage', type: 'toggle', span: 3, value: true }) +
          F({ name: 'zB', label: 'Zone B · Pick face', type: 'toggle', span: 3, value: true }) +
          F({ name: 'zC', label: 'Zone C · Controlled', type: 'toggle', span: 3, value: false }) +
          F({ name: 'zQ', label: 'Zone Q · Quarantine', type: 'toggle', span: 3, value: true }) +
          '</div></div>'
        : '') +
      '<div class="form-actions"><span class="spacer"></span>' +
      btn(
        'Cancel',
        '',
        '',
        'type="button" data-go="' + (mode === 'edit' ? 'warehouse-view/' + w.id : 'warehouses') + '"'
      ) +
      (mode !== 'edit' ? btn('Save & New', '', '', 'type="button" data-save="new"') : '') +
      btn(mode === 'edit' ? 'Save Changes' : 'Save Warehouse', 'save', 'primary', 'type="submit"') +
      '</div></form>',
    mount(page) {
      const form = $('#wform', page);
      const save = how => {
        if (
          !validateForm(form, err => {
            const d = formData(form);
            if (mode !== 'edit' && warehouses.some(x => x.code === d.code))
              err('code', 'Code ' + d.code + ' is already used');
            if (d.status === 'Inactive' && w && whStock(w.id).length)
              err(
                'status',
                'Transfer out the ' +
                  fmtN(sum(whStock(w.id), s => s.qty)) +
                  ' units on hand before deactivating'
              );
          })
        )
          return;
        const d = formData(form);
        if (mode === 'edit') {
          const ch = [
            'name',
            'type',
            'capacity',
            'status',
            'address',
            'city',
            'state',
            'country',
            'manager',
            'contact',
            'email'
          ].filter(k => String(w[k]) !== String(d[k]));
          if (!ch.length) {
            toast('info', 'No changes to save', '');
            return;
          }
          ch.forEach(k => logAudit('Inventory', 'Updated', w.code, k + ': ' + w[k], k + ': ' + d[k]));
          [
            'name',
            'type',
            'capacity',
            'status',
            'address',
            'city',
            'state',
            'country',
            'manager',
            'contact',
            'email'
          ].forEach(k => (w[k] = d[k]));
          toast(
            'success',
            'Warehouse updated',
            ch.length + ' field' + (ch.length > 1 ? 's' : '') + ' changed on ' + w.code + '.'
          );
          navigate('warehouse-view/' + w.id);
          return;
        }
        const nw = { id: 'W' + Date.now().toString().slice(-5), createdAt: NOW() };
        [
          'name',
          'code',
          'type',
          'capacity',
          'status',
          'address',
          'city',
          'state',
          'country',
          'manager',
          'contact',
          'email'
        ].forEach(k => (nw[k] = d[k]));
        warehouses.push(nw);
        const short = nw.code.split('-')[1];
        [
          ['A', 'Bulk storage', 'zA'],
          ['B', 'Pick face', 'zB'],
          ['C', 'Controlled', 'zC'],
          ['Q', 'Quarantine', 'zQ']
        ].forEach(([z, zn, k]) => {
          if (d[k])
            locations.push({
              id: 'L' + (locations.length + 1) + 'x' + short,
              warehouseId: nw.id,
              zone: z,
              zoneName: zn,
              rack: 'R01',
              shelf: 'S01',
              bin: 'B01',
              code: short + '-' + z + '-01-01-01',
              capacity: z === 'Q' ? 300 : 1000,
              status: 'Active'
            });
        });
        logAudit('Inventory', 'Created', nw.code, '—', nw.name);
        toast('success', 'Warehouse created', nw.name + ' (' + nw.code + ') is ready for receipts.', {
          label: 'View warehouse',
          onClick: () => navigate('warehouse-view/' + nw.id)
        });
        navigate(how === 'new' ? 'warehouse-create' : 'warehouse-view/' + nw.id);
      };
      form.addEventListener('submit', e => {
        e.preventDefault();
        save();
      });
      const sn = $('[data-save=new]', page);
      if (sn) sn.onclick = () => save('new');
    }
  };
}
ROUTES['warehouse-create'] = (p, q) => {
  const src = q.from ? W_BY(q.from) : null;
  return whFormPage(
    src ? Object.assign({}, src, { name: 'Copy of ' + src.name, status: 'Active' }) : null,
    src ? 'dup' : 'create',
    src
  );
};
ROUTES['warehouse-edit'] = id => {
  const w = W_BY(id);
  return w ? whFormPage(w, 'edit') : ROUTES['not-found']();
};
ROUTES['warehouse-view'] = id => {
  const w = W_BY(id);
  if (!w) return ROUTES['not-found']();
  const rows = () => stock.filter(s => s.warehouseId === w.id && s.qty > 0);
  const q = sum(rows(), s => s.qty);
  return {
    title: w.name,
    nav: 'warehouses',
    crumbs: [['Inventory', 'inventory'], ['Warehouses', 'warehouses'], [w.name]],
    titleHTML: esc(w.name) + ' ' + badge(w.status),
    sub:
      '<span class="mono">' +
      esc(w.code) +
      '</span> · ' +
      esc(w.type) +
      ' · ' +
      esc(w.address) +
      ', ' +
      esc(w.city) +
      ', ' +
      esc(w.state),
    actions:
      btn('Edit', 'edit', '', 'data-go="warehouse-edit/' + w.id + '"') +
      btn('Delete', 'trash', 'danger-ghost', 'data-del') +
      btn('Transfer stock', 'transfer', 'primary', 'data-go="transfer-create?from=' + w.id + '"'),
    body:
      '<div class="stat-strip mb-16"><div class="stat"><small>Products</small><b>' +
      rows().length +
      '</b><em>with stock on hand</em></div><div class="stat"><small>Stock quantity</small><b>' +
      fmtN(q) +
      '</b><em>' +
      fmtN(sum(rows(), s => s.reserved)) +
      ' reserved</em></div><div class="stat"><small>Stock value</small><b>' +
      fmtM(whValue(w.id), 0) +
      '</b><em>standard cost</em></div><div class="stat"><small>Utilization</small><b>' +
      whUtil(w) +
      '%</b><em>of ' +
      fmtN(w.capacity) +
      ' units</em></div><div class="stat"><small>Locations</small><b>' +
      locsOf(w.id).length +
      '</b><em>' +
      [...new Set(locsOf(w.id).map(l => l.zone))].length +
      ' zones</em></div></div>' +
      '<section class="card" data-tabs>' +
      tabsHTML(
        [
          ['stock', 'Stock', rows().length],
          ['loc', 'Storage Locations', locsOf(w.id).length],
          ['mv', 'Movements'],
          ['det', 'Details']
        ],
        'stock'
      ) +
      '<div class="tab-panel active" data-panel="stock"><div id="wS"></div></div><div class="tab-panel" data-panel="loc"><div id="wL"></div></div><div class="tab-panel" data-panel="mv"><div id="wM"></div></div>' +
      '<div class="tab-panel" data-panel="det"><div class="card-body"><div class="grid g-2"><dl class="dl"><dt>Warehouse code</dt><dd class="mono">' +
      esc(w.code) +
      '</dd><dt>Type</dt><dd>' +
      esc(w.type) +
      '</dd><dt>Address</dt><dd>' +
      esc(w.address) +
      '<br>' +
      esc(w.city) +
      ', ' +
      esc(w.state) +
      '<br>' +
      esc(w.country) +
      '</dd><dt>Capacity</dt><dd>' +
      fmtN(w.capacity) +
      ' units</dd></dl><dl class="dl"><dt>Manager</dt><dd>' +
      esc(w.manager) +
      '</dd><dt>Contact</dt><dd>' +
      esc(w.contact) +
      '</dd><dt>Email</dt><dd>' +
      esc(w.email) +
      '</dd><dt>Status</dt><dd>' +
      badge(w.status) +
      '</dd></dl></div><h3 class="card-title mt-24 mb-16">Audit</h3>' +
      auditTimeline(auditFor(w.code)) +
      '</div></div></section>',
    mount(page) {
      $('[data-del]', page).onclick = () => deleteWarehouse(w, () => navigate('warehouses'));
      mountTable(page, '#wS', {
        title: w.code + ' stock',
        columns: [
          {
            key: 'p',
            label: 'Product',
            value: r => P_BY(r.productId).name + ' ' + P_BY(r.productId).sku,
            render: r => prodCell(P_BY(r.productId))
          }
        ].concat(stockRowColumns().slice(1)),
        data: rows,
        rowId: r => r.productId,
        filters: [
          {
            key: 's',
            label: 'Any status',
            options: ['Healthy', 'Low Stock', 'Critical', 'Overstock'],
            test: (r, v) => rowStatus(r) === v
          }
        ],
        onRowClick: r => navigate('product-view/' + r.productId)
      });
      const lt = mountTable(page, '#wL', {
        title: w.code + ' locations',
        columns: locColumns().filter(c => c.key !== 'wh'),
        data: () => locsOf(w.id),
        actions: l => locActions(l, () => lt.refresh()),
        toolbar: btn('Add location', 'plus', 'primary sm', 'data-addloc')
      });
      $('[data-addloc]', page).onclick = () => locationModal(null, () => lt.refresh(), w.id);
      mountTable(page, '#wM', {
        title: w.code + ' movements',
        columns: ledgerColumns().filter(c => c.key !== 'warehouse'),
        data: () =>
          ledger
            .filter(e => e.warehouseId === w.id)
            .slice()
            .reverse()
      });
      page.addEventListener('click', e => {
        const a = e.target.closest('[data-le]');
        if (a) {
          e.preventDefault();
          ledgerDrawer(ledger.find(x => x.id === a.dataset.le));
        }
      });
    }
  };
};

/* ---------- storage locations ---------- */
const locStock = l =>
  sum(
    stock.filter(s => s.locationId === l.id),
    s => s.qty
  );
function locColumns() {
  return [
    { key: 'code', label: 'Location', render: l => '<span class="mono strong">' + esc(l.code) + '</span>' },
    {
      key: 'wh',
      label: 'Warehouse',
      value: l => W_BY(l.warehouseId).code,
      render: l => '<span class="chip">' + esc(W_BY(l.warehouseId).code) + '</span>'
    },
    { key: 'zone', label: 'Zone', value: l => l.zone + ' · ' + l.zoneName },
    { key: 'rack', label: 'Rack' },
    { key: 'shelf', label: 'Shelf' },
    { key: 'bin', label: 'Bin' },
    { key: 'capacity', label: 'Capacity', align: 'right', render: l => fmtN(l.capacity) },
    { key: 'cur', label: 'Current Stock', align: 'right', value: locStock, render: l => fmtN(locStock(l)) },
    {
      key: 'util',
      label: 'Fill',
      value: l => locStock(l) / l.capacity,
      render: l => utilHTML(Math.round((locStock(l) / l.capacity) * 100)),
      export: false
    },
    { key: 'status', label: 'Status', render: l => badge(l.status) }
  ];
}
function locActions(l, refresh) {
  return [
    { label: 'Edit', icon: 'edit', onClick: () => locationModal(l, refresh) },
    {
      label: 'Duplicate',
      icon: 'copy',
      onClick: () =>
        locationModal(
          Object.assign({}, l, { id: null, bin: 'B' + String(+l.bin.slice(1) + 1).padStart(2, '0') }),
          refresh,
          null,
          true
        )
    },
    '-',
    {
      label: 'Delete',
      icon: 'trash',
      danger: true,
      onClick: () => {
        const q = locStock(l);
        if (q) {
          messageModal(
            'warning',
            'Location holds stock',
            '<p>' +
              esc(l.code) +
              ' holds ' +
              fmtN(q) +
              ' units. Move the stock to another bin before deleting it.</p>'
          );
          return;
        }
        confirmDialog({
          danger: true,
          title: 'Delete location?',
          message: 'Delete storage location ' + esc(l.code) + '? This action cannot be undone.',
          confirm: 'Delete location'
        }).then(ok => {
          if (!ok) return;
          locations.splice(locations.indexOf(l), 1);
          logAudit('Inventory', 'Deleted', l.code, 'Location', '—');
          toast('success', 'Location deleted', l.code + ' removed.');
          refresh();
        });
      }
    }
  ];
}
function locationModal(l, after, wid, dup) {
  const edit = l && !dup;
  const v = k => (l ? l[k] : '');
  const body = el(
    '<form novalidate><div class="form-grid">' +
      F({
        name: 'warehouseId',
        label: 'Warehouse',
        type: 'select',
        req: true,
        span: 6,
        value: v('warehouseId') || wid || 'W1',
        placeholder: false,
        options: whOptions(),
        disabled: edit
      }) +
      F({
        name: 'zone',
        label: 'Zone',
        type: 'select',
        req: true,
        span: 6,
        value: v('zone') || 'A',
        placeholder: false,
        options: [
          ['A', 'A · Bulk storage'],
          ['B', 'B · Pick face'],
          ['C', 'C · Controlled'],
          ['Q', 'Q · Quarantine']
        ]
      }) +
      F({
        name: 'rack',
        label: 'Rack',
        req: true,
        span: 4,
        value: v('rack') || 'R01',
        pattern: '^R[0-9]{2}$',
        patternMsg: 'Format R01'
      }) +
      F({
        name: 'shelf',
        label: 'Shelf',
        req: true,
        span: 4,
        value: v('shelf') || 'S01',
        pattern: '^S[0-9]{2}$',
        patternMsg: 'Format S01'
      }) +
      F({
        name: 'bin',
        label: 'Bin',
        req: true,
        span: 4,
        value: v('bin') || 'B01',
        pattern: '^B[0-9]{2}$',
        patternMsg: 'Format B01'
      }) +
      F({
        name: 'capacity',
        label: 'Capacity',
        type: 'number',
        req: true,
        min: 1,
        span: 6,
        suffix: 'units',
        value: v('capacity') || 1000
      }) +
      F({
        name: 'status',
        label: 'Status',
        type: 'select',
        span: 6,
        value: v('status') || 'Active',
        placeholder: false,
        options: ['Active', 'Blocked', 'Inactive']
      }) +
      '</div><div class="callout mt-16">Location code: <b class="mono" id="locCode"></b></div></form>'
  );
  const upd = () => {
    const d = formData(body);
    const w = W_BY(d.warehouseId || (l && l.warehouseId));
    $('#locCode', body).textContent =
      (w ? w.code.split('-')[1] : '') +
      '-' +
      d.zone +
      '-' +
      d.rack.slice(1) +
      '-' +
      d.shelf.slice(1) +
      '-' +
      d.bin.slice(1);
  };
  body.addEventListener('input', upd);
  body.addEventListener('change', upd);
  upd();
  openModal({
    type: edit ? 'edit' : 'create',
    title: edit ? 'Edit storage location' : 'Create storage location',
    subtitle: edit ? esc(l.code) : 'Warehouse › Zone › Rack › Shelf › Bin',
    body,
    actions: [
      { label: 'Cancel' },
      {
        label: edit ? 'Save changes' : 'Create location',
        variant: 'primary',
        onClick: () => {
          const code = $('#locCode', body).textContent;
          if (
            !validateForm(body, err => {
              if (locations.some(x => x.code === code && x !== l))
                err('bin', 'Location ' + code + ' already exists');
            })
          )
            return false;
          const d = formData(body);
          const o = edit ? l : { id: 'L' + Date.now().toString().slice(-6), warehouseId: d.warehouseId };
          Object.assign(o, {
            zone: d.zone,
            zoneName: { A: 'Bulk storage', B: 'Pick face', C: 'Controlled', Q: 'Quarantine' }[d.zone],
            rack: d.rack,
            shelf: d.shelf,
            bin: d.bin,
            capacity: d.capacity,
            status: d.status,
            code
          });
          if (!edit) locations.push(o);
          logAudit(
            'Inventory',
            edit ? 'Updated' : 'Created',
            code,
            edit ? l.code : '—',
            'Capacity: ' + d.capacity
          );
          toast('success', edit ? 'Location updated' : 'Location created', code + ' saved.');
          after && after();
        }
      }
    ]
  });
}
ROUTES.locations = () => ({
  title: 'Storage Locations',
  crumbs: [['Inventory', 'inventory'], ['Warehouses', 'warehouses'], ['Storage Locations']],
  sub: 'Warehouse › Zone › Rack › Shelf › Bin hierarchy with capacity and current fill.',
  actions: btn('Create Location', 'plus', 'primary', 'data-new'),
  body: '<section class="card" id="lT"></section>',
  mount(page) {
    const t = mountTable(page, '#lT', {
      title: 'Storage locations',
      selectable: true,
      columns: locColumns(),
      data: () => locations,
      filters: [
        {
          key: 'w',
          label: 'All warehouses',
          options: whOptions(true).map(o => [o[0], o[1].split(' (')[0]]),
          test: (l, v) => l.warehouseId === v
        },
        {
          key: 'z',
          label: 'All zones',
          options: [
            ['A', 'A · Bulk storage'],
            ['B', 'B · Pick face'],
            ['C', 'C · Controlled'],
            ['Q', 'Q · Quarantine']
          ],
          test: (l, v) => l.zone === v
        }
      ],
      actions: l => locActions(l, () => t.refresh()),
      bulkActions: [
        {
          label: 'Block',
          icon: 'ban',
          onClick: ids => {
            ids.forEach(id => {
              const l = L_BY(id);
              if (l) l.status = 'Blocked';
            });
            toast('success', 'Locations blocked', ids.length + ' locations blocked for putaway.');
            t.clearSelection();
          }
        },
        {
          label: 'Unblock',
          icon: 'checkCircle',
          onClick: ids => {
            ids.forEach(id => {
              const l = L_BY(id);
              if (l) l.status = 'Active';
            });
            toast('success', 'Locations active', ids.length + ' locations available.');
            t.clearSelection();
          }
        }
      ]
    });
    $('[data-new]', page).onclick = () => locationModal(null, () => t.refresh());
  }
});
TONE.Blocked = 'warning';

/* ---------- warehouse stock ---------- */
ROUTES['warehouse-stock'] = (p, q) => {
  const aw = activeWh();
  return {
    title: 'Warehouse Stock',
    crumbs: [['Inventory', 'inventory'], ['Warehouses', 'warehouses'], ['Warehouse Stock']],
    sub: 'On-hand quantity by product and site.',
    body:
      '<section class="card" data-tabs>' +
      tabsHTML(
        [
          ['list', 'By warehouse'],
          ['matrix', 'Matrix view']
        ],
        'list'
      ) +
      '<div class="tab-panel active" data-panel="list"><div id="wsT"></div></div><div class="tab-panel" data-panel="matrix"><div id="wsM"></div></div></section>',
    mount(page) {
      mountTable(page, '#wsT', {
        title: 'Warehouse stock',
        columns: [
          {
            key: 'p',
            label: 'Product',
            value: r => P_BY(r.productId).name + ' ' + P_BY(r.productId).sku,
            render: r => prodCell(P_BY(r.productId))
          }
        ].concat(stockRowColumns()),
        data: () => stock.filter(s => s.qty > 0),
        rowId: r => r.productId + r.warehouseId,
        filters: [
          {
            key: 'w',
            label: 'All warehouses',
            value: q.warehouse || '',
            options: aw.map(w => [w.id, w.name]),
            test: (r, v) => r.warehouseId === v
          },
          {
            key: 'c',
            label: 'All categories',
            options: categories.map(c => [c.id, c.name]),
            test: (r, v) => P_BY(r.productId).categoryId === v
          }
        ],
        onRowClick: r => navigate('product-view/' + r.productId),
        footer: rs => [
          '<b>' + rs.length + ' lines</b>',
          '',
          '',
          fmtN(sum(rs, r => r.qty)),
          fmtN(sum(rs, r => r.reserved)),
          fmtN(sum(rs, r => r.qty - r.reserved)),
          fmtM(
            sum(rs, r => r.qty * P_BY(r.productId).cost),
            0
          ),
          ''
        ]
      });
      const mcols = [
        { key: 'p', label: 'Product', value: x => x.name + ' ' + x.sku, render: x => prodCell(x) }
      ]
        .concat(
          aw.map(w => ({
            key: w.id,
            label: w.code,
            align: 'right',
            value: x => whQty(x.id, w.id),
            render: x => {
              const v = whQty(x.id, w.id);
              return v ? fmtN(v) : '<span class="subtle">—</span>';
            }
          }))
        )
        .concat([
          {
            key: 'tot',
            label: 'Total',
            align: 'right',
            value: x => productQty(x.id),
            render: x => '<b style="font-weight:600">' + fmtN(productQty(x.id)) + '</b>'
          },
          { key: 'st', label: 'Status', value: pStatus, render: x => badge(pStatus(x)) }
        ]);
      mountTable(page, '#wsM', {
        title: 'Stock matrix',
        columns: mcols,
        data: () => products.filter(x => x.status !== 'Draft'),
        pageSize: 25,
        onRowClick: x => navigate('product-view/' + x.id),
        footer: rs =>
          ['<b>Total</b>']
            .concat(aw.map(w => fmtN(sum(rs, x => whQty(x.id, w.id)))))
            .concat([fmtN(sum(rs, x => productQty(x.id))), ''])
      });
    }
  };
};
