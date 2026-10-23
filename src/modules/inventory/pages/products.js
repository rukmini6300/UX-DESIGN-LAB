/* =========================================================================
   PRODUCTS
   Product list, form, details, categories and units.

   Provides: productWarehouses, productColumns, deleteProduct,
   productActions, #/products, sectionHead, productSections,
   bindProductForm, productValidate, productFromForm, #/product-create,
   FIELD_LABELS, fmtField, auditFor, auditTimeline, ledgerColumns,
   stockRowColumns, #/product-edit, #/product-view, expStatus,
   ledgerDrawer, raisePO, categoryModal, #/categories, unitModal, #/units
   ========================================================================= */
'use strict';

function productWarehouses(p) {
  return stock.filter(s => s.productId === p.id && s.qty > 0).map(s => s.warehouseId);
}
function productColumns() {
  return [
    { key: 'sku', label: 'SKU', render: p => '<span class="mono">' + esc(p.sku) + '</span>' },
    {
      key: 'name',
      label: 'Product',
      render: p =>
        '<div class="cell-main">' +
        thumb(p) +
        '<div style="min-width:0"><b><a class="link" style="color:var(--text);font-weight:600" href="#/product-view/' +
        p.id +
        '">' +
        esc(p.name) +
        '</a></b><small>' +
        esc(p.brand) +
        ' · ' +
        esc(p.sub) +
        (p.status !== 'Active'
          ? ' · <span style="color:var(--warning-text)">' + esc(p.status) + '</span>'
          : '') +
        '</small></div></div>',
      value: p => p.name + ' ' + p.brand
    },
    { key: 'category', label: 'Category', value: p => CAT_BY(p.categoryId).name },
    {
      key: 'warehouse',
      label: 'Warehouse',
      value: p => W_BY(p.defaultWarehouseId).code,
      render: p => {
        const ws = productWarehouses(p);
        const d = W_BY(p.defaultWarehouseId);
        return (
          '<span class="chip">' +
          esc(d.code) +
          '</span>' +
          (ws.filter(w => w !== d.id).length
            ? ' <span class="muted" style="font-size:12px" title="' +
              esc(ws.map(w => W_BY(w).code).join(', ')) +
              '">+' +
              ws.filter(w => w !== d.id).length +
              '</span>'
            : '')
        );
      }
    },
    {
      key: 'avail',
      label: 'Available Qty',
      align: 'right',
      value: p => productQty(p.id) - productReserved(p.id),
      render: p =>
        '<b style="font-weight:600">' +
        fmtN(productQty(p.id) - productReserved(p.id)) +
        '</b> <span class="muted" style="font-size:12px">' +
        esc(p.uom) +
        '</span>'
    },
    {
      key: 'reserved',
      label: 'Reserved Qty',
      align: 'right',
      value: p => productReserved(p.id),
      render: p => fmtN(productReserved(p.id))
    },
    { key: 'reorder', label: 'Reorder Level', align: 'right', render: p => fmtN(p.reorder) },
    { key: 'cost', label: 'Unit Cost', align: 'right', render: p => fmtM(p.cost) },
    {
      key: 'value',
      label: 'Stock Value',
      align: 'right',
      value: p => pValue(p),
      render: p => fmtM(pValue(p))
    },
    { key: 'status', label: 'Status', value: pStatus, render: p => badge(pStatus(p)) }
  ];
}
function deleteProduct(p, after) {
  const tx = ledger.filter(e => e.productId === p.id).length,
    q = productQty(p.id);
  const openDocs = [].concat(
    stockTransfers.filter(
      t =>
        !['Completed', 'Rejected', 'Cancelled'].includes(t.status) && t.items.some(i => i.productId === p.id)
    ),
    grns.filter(g => g.status !== 'Completed' && g.items.some(i => i.productId === p.id))
  );
  if (tx || q > 0 || openDocs.length) {
    openModal({
      type: 'warning',
      title: 'This product can’t be deleted',
      size: 'sm',
      body:
        '<p>This product cannot be deleted because inventory transactions exist.</p><div class="callout"><b>' +
        esc(p.name) +
        '</b> (' +
        esc(p.sku) +
        ') has ' +
        fmtN(tx) +
        ' ledger ' +
        (tx === 1 ? 'entry' : 'entries') +
        ', ' +
        fmtN(q) +
        ' units on hand' +
        (openDocs.length ? ' and ' + openDocs.length + ' open documents' : '') +
        '. Set the product to Inactive to block new transactions.</div>',
      actions: [
        { label: 'Close' },
        {
          label: 'View Transactions',
          variant: 'primary',
          icon: 'history',
          onClick: () => navigate('ledger?product=' + p.id)
        }
      ]
    });
    return;
  }
  confirmDialog({
    danger: true,
    title: 'Delete product?',
    message: 'Are you sure you want to delete “' + esc(p.name) + '”?<br>This action cannot be undone.',
    note:
      '<span class="mono">' +
      esc(p.sku) +
      '</span> · ' +
      esc(CAT_BY(p.categoryId).name) +
      ' · no stock or transactions',
    confirm: 'Delete Product'
  }).then(ok => {
    if (!ok) return;
    products.splice(products.indexOf(p), 1);
    for (let i = stock.length - 1; i >= 0; i--) if (stock[i].productId === p.id) stock.splice(i, 1);
    logAudit('Inventory', 'Deleted', p.sku, p.name, '—');
    toast('success', 'Product deleted', '“' + p.name + '” was removed from the catalog.');
    after && after();
  });
}
function productActions(p, refresh) {
  return [
    { label: 'View', icon: 'eye', onClick: () => navigate('product-view/' + p.id) },
    { label: 'Edit', icon: 'edit', onClick: () => navigate('product-edit/' + p.id) },
    { label: 'Duplicate', icon: 'copy', onClick: () => navigate('product-create?from=' + p.id) },
    { label: 'Stock History', icon: 'history', onClick: () => navigate('ledger?product=' + p.id) },
    '-',
    { label: 'Delete', icon: 'trash', danger: true, onClick: () => deleteProduct(p, refresh) }
  ];
}
ROUTES.products = (param, q) => {
  const cnt = products.length;
  return {
    title: 'Products',
    crumbs: [['Inventory', 'inventory'], ['Products', 'products'], ['Product List']],
    sub: cnt + ' products in the catalog · ' + fmtM(stockValue(), 0) + ' on hand',
    actions:
      btn('Import', 'receive', '', 'data-import') +
      btn('Create Product', 'plus', 'primary', 'data-go="product-create"'),
    body: '<section class="card" id="prodTable"></section>',
    mount(page) {
      $('[data-import]', page).onclick = () =>
        openModal({
          type: 'info',
          icon: 'receive',
          title: 'Import products',
          subtitle: 'Bulk-load items from a spreadsheet',
          indent: false,
          body: '<p>Upload a CSV with columns <span class="mono">sku, name, category, uom, cost, price, reorder_level</span>. Rows with an existing SKU update that product.</p><div class="callout mt-16"><b>Template</b><br><span class="mono">sku,name,category,uom,cost,price,reorder_level<br>ELC-10099,USB-C Hub 7-port,Electronics,EA,24.50,39.00,40</span></div>',
          actions: [
            { label: 'Close' },
            {
              label: 'Copy template',
              variant: 'primary',
              icon: 'copy',
              onClick: () => {
                try {
                  navigator.clipboard.writeText('sku,name,category,uom,cost,price,reorder_level');
                } catch (e) {}
                toast('success', 'Template copied', 'Paste it into your spreadsheet to start.');
              }
            }
          ]
        });
      const since = d => p => daysBetween(p.updatedAt, NOW()) <= +d;
      const t = mountTable(page, '#prodTable', {
        title: 'Products',
        selectable: true,
        searchPlaceholder: 'Search SKU, name, brand',
        q: q.q || '',
        columns: productColumns(),
        data: () => products,
        filters: [
          {
            key: 'cat',
            label: 'All categories',
            options: categories.map(c => [c.id, c.name]),
            value: q.category || '',
            test: (p, v) => p.categoryId === v
          },
          {
            key: 'wh',
            label: 'All warehouses',
            options: whOptions(true).map(o => [o[0], o[1].split(' (')[0]]),
            test: (p, v) => p.defaultWarehouseId === v || productWarehouses(p).includes(v)
          },
          {
            key: 'st',
            label: 'Any status',
            options: ['Active', 'Draft', 'Inactive'],
            test: (p, v) => p.status === v
          },
          {
            key: 'stock',
            label: 'Any stock level',
            options: ['Healthy', 'Low Stock', 'Critical', 'Out of Stock', 'Overstock'],
            value: q.stock || '',
            test: (p, v) => pStatus(p) === v
          },
          {
            key: 'date',
            label: 'Updated any time',
            options: [
              ['7', 'Updated in 7 days'],
              ['30', 'Updated in 30 days'],
              ['90', 'Updated in 90 days']
            ],
            test: (p, v) => since(v)(p)
          }
        ],
        actions: p => productActions(p, () => t.refresh()),
        onRowClick: p => navigate('product-view/' + p.id),
        bulkActions: [
          {
            label: 'Mark active',
            icon: 'checkCircle',
            onClick: ids => {
              ids.forEach(id => {
                const p = P_BY(id);
                if (p && p.status !== 'Active') {
                  logAudit('Inventory', 'Updated', p.sku, 'Status: ' + p.status, 'Status: Active');
                  p.status = 'Active';
                  p.updatedAt = NOW();
                  p.updatedBy = CURRENT_USER.name;
                }
              });
              toast('success', 'Products updated', ids.length + ' products set to Active.');
              t.clearSelection();
            }
          },
          {
            label: 'Mark inactive',
            icon: 'ban',
            onClick: ids => {
              ids.forEach(id => {
                const p = P_BY(id);
                if (p && p.status !== 'Inactive') {
                  logAudit('Inventory', 'Updated', p.sku, 'Status: ' + p.status, 'Status: Inactive');
                  p.status = 'Inactive';
                  p.updatedAt = NOW();
                  p.updatedBy = CURRENT_USER.name;
                }
              });
              toast('success', 'Products updated', ids.length + ' products set to Inactive.');
              t.clearSelection();
            }
          },
          {
            label: 'Export selected',
            icon: 'export',
            onClick: ids =>
              exportCSV(
                'Selected products',
                productColumns(),
                products.filter(p => ids.includes(p.id))
              )
          },
          {
            label: 'Delete',
            icon: 'trash',
            danger: true,
            onClick: ids => {
              const sel = products.filter(p => ids.includes(p.id));
              const ok = sel.filter(p => !ledger.some(e => e.productId === p.id) && productQty(p.id) <= 0);
              const blocked = sel.length - ok.length;
              if (!ok.length) {
                openModal({
                  type: 'warning',
                  title: 'Selected products can’t be deleted',
                  size: 'sm',
                  body:
                    '<p>All ' +
                    sel.length +
                    ' selected products have inventory transactions or stock on hand. Set them to Inactive instead.</p>',
                  actions: [{ label: 'Close', variant: 'primary' }]
                });
                return;
              }
              confirmDialog({
                danger: true,
                title: 'Delete ' + ok.length + ' product' + (ok.length > 1 ? 's' : '') + '?',
                message:
                  ok.map(p => '“' + esc(p.name) + '”').join(', ') +
                  ' will be permanently deleted. This action cannot be undone.',
                note: blocked
                  ? blocked +
                    ' other selected product' +
                    (blocked > 1 ? 's have' : ' has') +
                    ' transactions and will be kept.'
                  : '',
                confirm: 'Delete Products'
              }).then(y => {
                if (!y) return;
                ok.forEach(p => {
                  products.splice(products.indexOf(p), 1);
                  logAudit('Inventory', 'Deleted', p.sku, p.name, '—');
                });
                toast(
                  'success',
                  'Products deleted',
                  ok.length + ' deleted' + (blocked ? ', ' + blocked + ' kept' : '') + '.'
                );
                t.clearSelection();
              });
            }
          }
        ],
        emptyTitle: 'No products yet',
        emptyText: 'Create your first product to start tracking stock.',
        emptyAction: { label: 'Create Product', onClick: () => navigate('product-create') }
      });
    }
  };
};

/* ---------- product form ---------- */
function sectionHead(n, t, d) {
  return (
    '<div class="form-section-head"><span class="fs-num">' +
    n +
    '</span><div><h3 class="form-section-title">' +
    esc(t) +
    '</h3><p class="form-section-desc">' +
    esc(d) +
    '</p></div></div>'
  );
}
function productSections(p, mode) {
  const v = k => (p ? p[k] : undefined);
  const cat = p ? CAT_BY(p.categoryId) : null;
  const wid = (p && p.defaultWarehouseId) || 'W1';
  const editing = mode === 'edit';
  const S = {
    basic:
      '<div class="form-grid">' +
      F({
        name: 'name',
        label: 'Product Name',
        req: true,
        span: 6,
        value: v('name'),
        ph: 'e.g. Premium Laptop 14-inch'
      }) +
      F({
        name: 'sku',
        label: 'SKU',
        req: true,
        span: 3,
        value: v('sku'),
        pattern: '^[A-Z0-9-]{4,20}$',
        patternMsg: 'Use 4–20 uppercase letters, digits or hyphens',
        hint: 'Unique stock-keeping unit'
      }) +
      F({
        name: 'barcode',
        label: 'Barcode',
        span: 3,
        value: v('barcode'),
        pattern: '^[0-9]{8,14}$',
        patternMsg: 'Barcode must be 8 to 14 digits',
        ph: 'EAN or UPC'
      }) +
      F({ name: 'code', label: 'Product Code', span: 3, value: v('code'), ph: 'PRD-0000' }) +
      F({
        name: 'categoryId',
        label: 'Category',
        type: 'select',
        req: true,
        span: 3,
        value: v('categoryId'),
        options: categories.filter(c => c.status === 'Active').map(c => [c.id, c.name])
      }) +
      F({
        name: 'sub',
        label: 'Subcategory',
        type: 'select',
        span: 3,
        value: v('sub'),
        options: cat ? cat.subs : [],
        placeholder: 'Select subcategory'
      }) +
      F({ name: 'brand', label: 'Brand', span: 3, value: v('brand'), ph: 'Manufacturer brand' }) +
      F({
        name: 'type',
        label: 'Product Type',
        type: 'select',
        req: true,
        span: 3,
        value: v('type') || 'Stockable',
        placeholder: false,
        options: ['Stockable', 'Consumable', 'Service', 'Kit']
      }) +
      F({
        name: 'desc',
        label: 'Description',
        type: 'textarea',
        span: 9,
        value: v('desc'),
        ph: 'Specifications, packaging and handling notes',
        rows: 2
      }) +
      '</div>',
    inventory:
      '<div class="form-grid">' +
      F({
        name: 'invType',
        label: 'Inventory Type',
        type: 'select',
        req: true,
        span: 4,
        value: v('invType') || 'Trading Goods',
        placeholder: false,
        options: ['Trading Goods', 'Finished Goods', 'Raw Material', 'Spare Parts', 'Consumables']
      }) +
      F({
        name: 'uom',
        label: 'Unit of Measure',
        type: 'select',
        req: true,
        span: 4,
        value: v('uom') || 'EA',
        placeholder: false,
        options: units.filter(u => u.status === 'Active').map(u => [u.code, u.name + ' (' + u.code + ')'])
      }) +
      F({
        name: 'opening',
        label: 'Opening Stock',
        type: 'number',
        span: 4,
        min: 0,
        value: editing ? productQty(p.id) : mode === 'dup' ? 0 : 0,
        readonly: editing,
        hint: editing
          ? 'Posted. Use a stock adjustment to change on-hand quantity.'
          : 'Posted to the default warehouse on save'
      }) +
      F({
        name: 'reorder',
        label: 'Reorder Level',
        type: 'number',
        req: true,
        span: 3,
        min: 0,
        value: v('reorder'),
        hint: 'Triggers a low stock alert'
      }) +
      F({ name: 'min', label: 'Minimum Stock', type: 'number', span: 3, min: 0, value: v('min') }) +
      F({ name: 'max', label: 'Maximum Stock', type: 'number', span: 3, min: 0, value: v('max') }) +
      F({ name: 'safety', label: 'Safety Stock', type: 'number', span: 3, min: 0, value: v('safety') }) +
      '</div>',
    pricing:
      '<div class="form-grid">' +
      F({
        name: 'cost',
        label: 'Purchase Price',
        type: 'number',
        req: true,
        span: 3,
        min: 0,
        step: '0.01',
        prefix: '$',
        value: v('cost')
      }) +
      F({
        name: 'price',
        label: 'Selling Price',
        type: 'number',
        req: true,
        span: 3,
        min: 0,
        step: '0.01',
        prefix: '$',
        value: v('price')
      }) +
      F({
        name: 'tax',
        label: 'Tax',
        type: 'select',
        span: 2,
        value: v('tax') || 'Standard 8.25%',
        placeholder: false,
        options: ['Standard 8.25%', 'Reduced 5%', 'Exempt 0%']
      }) +
      F({
        name: 'discount',
        label: 'Discount',
        type: 'number',
        span: 2,
        min: 0,
        max: 100,
        step: '0.5',
        suffix: '%',
        value: v('discount') || 0
      }) +
      F({
        name: 'currency',
        label: 'Currency',
        type: 'select',
        span: 2,
        value: v('currency') || 'USD',
        placeholder: false,
        options: [
          ['USD', 'USD — US dollar'],
          ['EUR', 'EUR — Euro'],
          ['GBP', 'GBP — Pound'],
          ['JPY', 'JPY — Yen']
        ]
      }) +
      '<div class="s-12" id="marginBox"></div></div>',
    warehouse:
      '<div class="form-grid">' +
      F({
        name: 'defaultWarehouseId',
        label: 'Default Warehouse',
        type: 'select',
        req: true,
        span: 4,
        value: wid,
        placeholder: false,
        options: whOptions()
      }) +
      F({
        name: 'defaultLocationId',
        label: 'Storage Location',
        type: 'select',
        span: 4,
        value: v('defaultLocationId'),
        options: locsOf(wid).map(l => [l.id, l.code + ' · ' + l.zoneName]),
        placeholder: 'Select location'
      }) +
      F({ name: 'bin', label: 'Bin', span: 2, value: v('bin'), ph: 'B01' }) +
      F({
        name: 'openingMirror',
        label: 'Opening Stock',
        type: 'number',
        span: 2,
        readonly: true,
        value: editing ? productQty(p.id) : 0,
        hint: 'From inventory section'
      }) +
      '</div>',
    settings:
      '<div class="form-grid">' +
      F({
        name: 'track',
        label: 'Track Inventory',
        type: 'toggle',
        span: 4,
        value: p ? p.track : true,
        hint: 'Maintain on-hand quantity and ledger'
      }) +
      F({
        name: 'batch',
        label: 'Batch Tracking',
        type: 'toggle',
        span: 4,
        value: v('batch'),
        hint: 'Record batch or lot on receipts'
      }) +
      F({
        name: 'serial',
        label: 'Serial Number Tracking',
        type: 'toggle',
        span: 4,
        value: v('serial'),
        hint: 'Capture a serial per unit'
      }) +
      F({
        name: 'expiry',
        label: 'Expiry Tracking',
        type: 'toggle',
        span: 4,
        value: v('expiry'),
        hint: 'Require expiry date on receipt'
      }) +
      F({
        name: 'active',
        label: 'Active',
        type: 'toggle',
        span: 4,
        value: p ? p.status !== 'Inactive' : true,
        hint: 'Inactive products cannot be transacted'
      }) +
      F({
        name: 'shelfLife',
        label: 'Shelf Life',
        type: 'number',
        span: 4,
        min: 0,
        suffix: 'days',
        value: v('shelfLife') || '',
        hint: 'Used to default expiry dates'
      }) +
      '</div>'
  };
  return S;
}
function bindProductForm(form, p) {
  const cat = $('[name=categoryId]', form),
    sub = $('[name=sub]', form),
    wh = $('[name=defaultWarehouseId]', form),
    loc = $('[name=defaultLocationId]', form),
    bin = $('[name=bin]', form);
  cat.addEventListener('change', () => {
    const c = CAT_BY(cat.value);
    sub.innerHTML = optionsHTML(c ? c.subs : [], '', 'Select subcategory');
    const sk = $('[name=sku]', form);
    if (c && !p && (!sk.value || /^[A-Z]{3}-\d+$/.test(sk.value))) {
      skuCounters[c.code] = skuCounters[c.code] || 10040;
      sk.value = c.code + '-' + (skuCounters[c.code] + 1);
    }
  });
  wh.addEventListener('change', () => {
    loc.innerHTML = optionsHTML(
      locsOf(wh.value).map(l => [l.id, l.code + ' · ' + l.zoneName]),
      '',
      'Select location'
    );
    bin.value = '';
  });
  loc.addEventListener('change', () => {
    const l = L_BY(loc.value);
    if (l) bin.value = l.bin;
  });
  const op = $('[name=opening]', form),
    mir = $('[name=openingMirror]', form);
  op.addEventListener('input', () => (mir.value = op.value || 0));
  const exp = $('[name=expiry]', form),
    sl = $('[data-field=shelfLife]', form);
  const syncSl = () => (sl.style.display = exp.checked ? '' : 'none');
  exp.addEventListener('change', syncSl);
  syncSl();
  const mb = $('#marginBox', form);
  const syncM = () => {
    const c = +$('[name=cost]', form).value,
      s = +$('[name=price]', form).value,
      d = +$('[name=discount]', form).value || 0;
    if (!c || !s) {
      mb.innerHTML = '<div class="hint">Enter purchase and selling prices to see the margin.</div>';
      return;
    }
    const net = s * (1 - d / 100);
    const m = ((net - c) / net) * 100;
    mb.innerHTML =
      '<div class="alert ' +
      (m < 0 ? 'alert-danger' : m < 15 ? 'alert-warning' : 'alert-info') +
      '">' +
      icon(m < 0 ? 'alert' : 'info', 16) +
      '<span>Net selling price <b>' +
      fmtM(net) +
      '</b> · Gross margin <b>' +
      m.toFixed(1) +
      '%</b> · Markup <b>' +
      (((net - c) / c) * 100).toFixed(1) +
      '%</b>' +
      (m < 0 ? ' — selling below cost' : '') +
      '</span></div>';
  };
  ['cost', 'price', 'discount'].forEach(n => $('[name=' + n + ']', form).addEventListener('input', syncM));
  syncM();
}
function productValidate(form, p) {
  return validateForm(form, err => {
    const d = formData(form);
    if (d.sku && products.some(x => x.sku === d.sku && x !== p))
      err('sku', 'SKU ' + d.sku + ' is already used by another product');
    if (d.barcode && products.some(x => x.barcode === d.barcode && x !== p))
      err('barcode', 'Barcode is already assigned to another product');
    if (d.max != null && d.min != null && d.max <= d.min)
      err('max', 'Maximum stock must be greater than minimum stock');
    if (d.min != null && d.reorder != null && d.reorder < d.min)
      err('reorder', 'Reorder level should be at least the minimum stock');
    if (d.safety != null && d.reorder != null && d.safety > d.reorder)
      err('safety', 'Safety stock cannot exceed the reorder level');
    if (d.max != null && d.opening && d.opening > d.max * 2)
      err('opening', 'Opening stock is more than twice the maximum stock');
  });
}
function productFromForm(d, p) {
  const o = p || {};
  Object.assign(o, {
    name: d.name,
    sku: d.sku,
    barcode: d.barcode,
    code: d.code,
    categoryId: d.categoryId,
    sub: d.sub,
    brand: d.brand,
    type: d.type,
    desc: d.desc,
    invType: d.invType,
    uom: d.uom,
    reorder: d.reorder || 0,
    min: d.min || 0,
    max: d.max || 0,
    safety: d.safety || 0,
    cost: d.cost,
    price: d.price,
    tax: d.tax,
    discount: d.discount || 0,
    currency: d.currency,
    defaultWarehouseId: d.defaultWarehouseId,
    defaultLocationId: d.defaultLocationId || null,
    bin: d.bin,
    track: d.track,
    batch: d.batch,
    serial: d.serial,
    expiry: d.expiry,
    shelfLife: d.shelfLife || 0
  });
  o.status = d.active ? (o.status === 'Inactive' || !o.status ? 'Active' : o.status) : 'Inactive';
  return o;
}
ROUTES['product-create'] = (param, q) => {
  const src = q.from ? P_BY(q.from) : null;
  const base = src
    ? Object.assign({}, src, {
        name: 'Copy of ' + src.name,
        sku: '',
        barcode: '',
        code: '',
        status: 'Active'
      })
    : null;
  const S = productSections(base, src ? 'dup' : 'create');
  const sec = (n, t, d, h) => '<div class="form-section">' + sectionHead(n, t, d) + h + '</div>';
  return {
    title: src ? 'Duplicate Product' : 'Create Product',
    crumbs: [
      ['Inventory', 'inventory'],
      ['Products', 'products'],
      [src ? 'Duplicate Product' : 'Create Product']
    ],
    sub: src
      ? 'Copying settings from <b>' +
        esc(src.name) +
        '</b> (' +
        esc(src.sku) +
        '). Stock and history are not copied.'
      : 'Add an item to the catalog. Fields marked <span class="req">*</span> are required.',
    actions: btn('Cancel', '', '', 'data-cancel'),
    body:
      '<form class="card" id="pform" novalidate>' +
      sec(1, 'Basic Information', 'Identifiers and classification', S.basic) +
      sec(2, 'Inventory Information', 'Units and stocking rules', S.inventory) +
      sec(3, 'Pricing', 'Cost, price and tax', S.pricing) +
      sec(4, 'Warehouse', 'Where the product is stored by default', S.warehouse) +
      sec(5, 'Product Settings', 'Tracking and lifecycle', S.settings) +
      '<div class="form-actions"><span class="muted spacer" style="align-self:center;font-size:13px">' +
      (src ? 'Duplicate of ' + esc(src.sku) : 'New product') +
      '</span>' +
      btn('Cancel', '', '', 'type="button" data-cancel') +
      btn('Save & New', '', '', 'type="button" data-save="new"') +
      btn('Save & Close', '', '', 'type="button" data-save="close"') +
      btn('Save', 'save', 'primary', 'type="submit"') +
      '</div></form>',
    mount(page) {
      const form = $('#pform', page);
      bindProductForm(form, null);
      let dirty = false;
      form.addEventListener('input', () => (dirty = true));
      const save = how => {
        if (!productValidate(form, null)) return;
        const d = formData(form);
        const p = productFromForm(d, {
          id: 'P' + String(Date.now()).slice(-6),
          createdBy: CURRENT_USER.name,
          createdAt: NOW(),
          updatedBy: CURRENT_USER.name,
          updatedAt: NOW(),
          priceHistory: [
            {
              date: NOW(),
              cost: d.cost,
              price: d.price,
              oldCost: null,
              oldPrice: null,
              user: CURRENT_USER.name,
              reason: 'Initial price'
            }
          ]
        });
        products.unshift(p);
        const c = CAT_BY(p.categoryId);
        const m = /-(\d+)$/.exec(p.sku);
        if (m && p.sku.startsWith(c.code)) skuCounters[c.code] = Math.max(skuCounters[c.code] || 0, +m[1]);
        logAudit(
          'Inventory',
          'Created',
          p.sku,
          '—',
          'Product created' + (src ? ' (duplicate of ' + src.sku + ')' : '')
        );
        if (d.opening > 0) {
          stockRow(p.id, p.defaultWarehouseId, true);
          const r = stockRow(p.id, p.defaultWarehouseId);
          if (p.defaultLocationId) r.locationId = p.defaultLocationId;
          postMovement({
            type: 'Opening Balance',
            pid: p.id,
            wid: p.defaultWarehouseId,
            inQty: d.opening,
            txNo: 'OB-' + p.sku,
            ref: 'Opening stock',
            bucket: 'opening',
            locationId: p.defaultLocationId
          });
          logAudit('Inventory', 'Updated', p.sku, 'Qty: 0', 'Qty: ' + d.opening);
        }
        dirty = false;
        toast(
          'success',
          'Product created',
          '“' +
            p.name +
            '” (' +
            p.sku +
            ') was added' +
            (d.opening > 0 ? ' with ' + fmtN(d.opening) + ' ' + p.uom + ' opening stock' : '') +
            '.',
          { label: 'View product', onClick: () => navigate('product-view/' + p.id) }
        );
        if (how === 'new') navigate('product-create');
        else if (how === 'close') navigate('products');
        else navigate('product-edit/' + p.id);
      };
      form.addEventListener('submit', e => {
        e.preventDefault();
        save('stay');
      });
      $$('[data-save]', page).forEach(b => (b.onclick = () => save(b.dataset.save)));
      $$('[data-cancel]', page).forEach(
        b =>
          (b.onclick = () => {
            if (!dirty) {
              navigate('products');
              return;
            }
            confirmDialog({
              type: 'warning',
              title: 'Discard this product?',
              message: 'You have unsaved changes. Leaving now discards them.',
              confirm: 'Discard changes',
              danger: true
            }).then(ok => ok && navigate('products'));
          })
      );
    }
  };
};
const FIELD_LABELS = {
  name: 'Name',
  sku: 'SKU',
  barcode: 'Barcode',
  code: 'Product code',
  categoryId: 'Category',
  sub: 'Subcategory',
  brand: 'Brand',
  type: 'Product type',
  desc: 'Description',
  invType: 'Inventory type',
  uom: 'Unit',
  reorder: 'Reorder level',
  min: 'Minimum stock',
  max: 'Maximum stock',
  safety: 'Safety stock',
  cost: 'Purchase price',
  price: 'Selling price',
  tax: 'Tax',
  discount: 'Discount',
  currency: 'Currency',
  defaultWarehouseId: 'Default warehouse',
  defaultLocationId: 'Storage location',
  bin: 'Bin',
  track: 'Track inventory',
  batch: 'Batch tracking',
  serial: 'Serial tracking',
  expiry: 'Expiry tracking',
  shelfLife: 'Shelf life',
  status: 'Status'
};
function fmtField(k, v) {
  if (k === 'categoryId') return (CAT_BY(v) || {}).name || '—';
  if (k === 'defaultWarehouseId') return (W_BY(v) || {}).code || '—';
  if (k === 'defaultLocationId') return (L_BY(v) || {}).code || '—';
  if (k === 'cost' || k === 'price') return fmtM(v);
  if (typeof v === 'boolean') return v ? 'On' : 'Off';
  return v === '' || v == null ? '—' : String(v);
}
function auditFor(record) {
  return audit.filter(a => a.record === record);
}
function auditTimeline(list) {
  if (!list.length) return '<p class="muted">No changes recorded yet.</p>';
  return (
    '<div class="timeline">' +
    list
      .map(
        a =>
          '<div class="tl-item"><span class="tl-dot ' +
          (a.action === 'Created' ? 't-success' : a.action === 'Deleted' ? 't-danger' : 't-primary') +
          '">' +
          icon(a.action === 'Created' ? 'plus' : a.action === 'Deleted' ? 'trash' : 'edit', 13) +
          '</span><div class="tl-body"><b>' +
          esc(a.action) +
          '</b> by ' +
          esc(a.user) +
          (a.oldV !== '—' || a.newV !== '—'
            ? '<div class="change">' +
              (a.oldV !== '—' ? '<del>' + esc(a.oldV) + '</del>' + icon('arrowRight', 12) : '') +
              '<ins>' +
              esc(a.newV) +
              '</ins></div>'
            : '') +
          '<small>' +
          fmtDT(a.date) +
          ' · ' +
          esc(a.module) +
          '</small></div></div>'
      )
      .join('') +
    '</div>'
  );
}
function ledgerColumns(opts) {
  opts = opts || {};
  const c = [
    {
      key: 'date',
      label: 'Date',
      render: e => '<span class="nowrap">' + fmtDT(e.date) + '</span>',
      exportValue: e => fmtDT(e.date)
    },
    {
      key: 'txNo',
      label: 'Transaction No',
      render: e => '<a class="link mono" data-le="' + e.id + '">' + esc(e.txNo) + '</a>'
    },
    { key: 'type', label: 'Transaction Type', render: e => '<span class="chip">' + esc(e.type) + '</span>' }
  ];
  if (!opts.noProduct)
    c.push({
      key: 'product',
      label: 'Product',
      value: e => {
        const p = P_BY(e.productId);
        return p ? p.name + ' ' + p.sku : 'Deleted product';
      },
      render: e => prodCell(P_BY(e.productId)),
      exportValue: e => (P_BY(e.productId) || {}).sku
    });
  c.push(
    {
      key: 'warehouse',
      label: 'Warehouse',
      value: e => W_BY(e.warehouseId).code,
      render: e => '<span class="chip">' + esc(W_BY(e.warehouseId).code) + '</span>'
    },
    { key: 'opening', label: 'Opening Qty', align: 'right', render: e => fmtN(e.opening) },
    {
      key: 'inQty',
      label: 'In Qty',
      align: 'right',
      render: e =>
        e.inQty ? '<span class="pos">+' + fmtN(e.inQty) + '</span>' : '<span class="subtle">—</span>'
    },
    {
      key: 'outQty',
      label: 'Out Qty',
      align: 'right',
      render: e =>
        e.outQty ? '<span class="neg">−' + fmtN(e.outQty) + '</span>' : '<span class="subtle">—</span>'
    },
    {
      key: 'balance',
      label: 'Balance Qty',
      align: 'right',
      render: e => '<b style="font-weight:600">' + fmtN(e.balance) + '</b>'
    },
    { key: 'unitCost', label: 'Unit Cost', align: 'right', render: e => fmtM(e.unitCost) },
    {
      key: 'value',
      label: 'Value',
      align: 'right',
      render: e => '<span class="' + (e.value >= 0 ? 'pos' : 'neg') + '">' + fmtM(e.value) + '</span>'
    },
    { key: 'ref', label: 'Reference', render: e => '<span class="muted">' + esc(e.ref) + '</span>' },
    { key: 'user', label: 'User', render: e => userCell(e.user) }
  );
  return c;
}
function stockRowColumns() {
  return [
    {
      key: 'wh',
      label: 'Warehouse',
      value: r => W_BY(r.warehouseId).name,
      render: r => whCell(W_BY(r.warehouseId))
    },
    {
      key: 'loc',
      label: 'Location',
      value: r => (L_BY(r.locationId) || {}).code,
      render: r => '<span class="mono">' + esc((L_BY(r.locationId) || {}).code || '—') + '</span>'
    },
    { key: 'qty', label: 'On Hand', align: 'right', render: r => fmtN(r.qty) },
    { key: 'reserved', label: 'Reserved', align: 'right', render: r => fmtN(r.reserved) },
    {
      key: 'avail',
      label: 'Available',
      align: 'right',
      value: r => r.qty - r.reserved,
      render: r => '<b style="font-weight:600">' + fmtN(r.qty - r.reserved) + '</b>'
    },
    {
      key: 'value',
      label: 'Value',
      align: 'right',
      value: r => r.qty * P_BY(r.productId).cost,
      render: r => fmtM(r.qty * P_BY(r.productId).cost)
    },
    { key: 'status', label: 'Status', value: rowStatus, render: r => badge(rowStatus(r)) }
  ];
}
ROUTES['product-edit'] = id => {
  const p = P_BY(id);
  if (!p) return ROUTES['not-found']();
  const S = productSections(p, 'edit');
  const rows = () => stock.filter(s => s.productId === p.id);
  const hist = auditFor(p.sku);
  return {
    title: 'Edit Product',
    nav: 'products',
    crumbs: [
      ['Inventory', 'inventory'],
      ['Products', 'products'],
      [p.name, 'product-view/' + p.id],
      ['Edit']
    ],
    titleHTML:
      'Edit Product <span class="badge ' +
      (p.status === 'Active' ? 'b-success' : '') +
      '">' +
      esc(p.status) +
      '</span>',
    sub:
      '<span class="mono">' +
      esc(p.sku) +
      '</span> · ' +
      esc(p.name) +
      ' · last updated ' +
      fmtDT(p.updatedAt) +
      ' by ' +
      esc(p.updatedBy),
    actions:
      btn('View', 'eye', '', 'data-go="product-view/' + p.id + '"') +
      btn('Duplicate', 'copy', '', 'data-go="product-create?from=' + p.id + '"') +
      btn('Delete', 'trash', 'danger-ghost', 'data-del'),
    body:
      '<div class="grid g-main"><form class="card" id="pform" novalidate data-tabs>' +
      tabsHTML(
        [
          ['general', 'General'],
          ['inventory', 'Inventory'],
          ['pricing', 'Pricing'],
          ['warehouses', 'Warehouses'],
          ['stock', 'Stock', rows().length],
          ['tx', 'Transactions', ledger.filter(e => e.productId === p.id).length],
          ['history', 'History', hist.length]
        ],
        'general'
      ) +
      '<div class="tab-panel active" data-panel="general"><div class="form-section">' +
      sectionHead(1, 'Basic Information', 'Identifiers and classification') +
      S.basic +
      '</div></div>' +
      '<div class="tab-panel" data-panel="inventory"><div class="form-section">' +
      sectionHead(2, 'Inventory Information', 'Units and stocking rules') +
      S.inventory +
      '</div><div class="form-section">' +
      sectionHead(3, 'Product Settings', 'Tracking and lifecycle') +
      S.settings +
      '</div></div>' +
      '<div class="tab-panel" data-panel="pricing"><div class="form-section">' +
      sectionHead(4, 'Pricing', 'Cost, price and tax') +
      S.pricing +
      '</div><div class="form-section"><h3 class="form-section-title mb-16">Price history</h3><div class="table-wrap auto" style="border:1px solid var(--border);border-radius:var(--r-md)"><table class="tbl compact"><thead><tr><th>Effective</th><th class="right">Purchase price</th><th class="right">Selling price</th><th>Changed by</th><th>Reason</th></tr></thead><tbody>' +
      (p.priceHistory || [])
        .slice()
        .reverse()
        .map(
          h =>
            '<tr><td>' +
            fmtD(h.date) +
            '</td><td class="right num">' +
            fmtM(h.cost) +
            (h.oldCost != null
              ? ' <span class="subtle" style="font-size:12px">from ' + fmtM(h.oldCost) + '</span>'
              : '') +
            '</td><td class="right num">' +
            fmtM(h.price) +
            '</td><td>' +
            esc(h.user) +
            '</td><td class="muted">' +
            esc(h.reason) +
            '</td></tr>'
        )
        .join('') +
      '</tbody></table></div></div></div>' +
      '<div class="tab-panel" data-panel="warehouses"><div class="form-section">' +
      sectionHead(5, 'Warehouse', 'Default storage for receipts') +
      S.warehouse +
      '</div></div>' +
      '<div class="tab-panel" data-panel="stock"><div id="pStock"></div></div>' +
      '<div class="tab-panel" data-panel="tx"><div id="pTx"></div></div>' +
      '<div class="tab-panel" data-panel="history"><div class="card-body">' +
      auditTimeline(hist) +
      '</div></div>' +
      '<div class="form-actions"><span class="spacer"></span>' +
      btn('Cancel', '', '', 'type="button" data-go="product-view/' + p.id + '"') +
      btn('Save & Close', '', '', 'type="button" data-save="close"') +
      btn('Save Changes', 'save', 'primary', 'type="submit"') +
      '</div></form>' +
      '<div class="stack"><section class="card"><div class="card-head"><h2 class="card-title">Record information</h2></div><div class="card-body"><dl class="dl"><dt>Product ID</dt><dd class="mono">' +
      esc(p.id) +
      '</dd><dt>Created by</dt><dd>' +
      esc(p.createdBy) +
      '</dd><dt>Created date</dt><dd>' +
      fmtDT(p.createdAt) +
      '</dd><dt>Updated by</dt><dd>' +
      esc(p.updatedBy) +
      '</dd><dt>Updated date</dt><dd>' +
      fmtDT(p.updatedAt) +
      '</dd><dt>On hand</dt><dd>' +
      fmtN(productQty(p.id)) +
      ' ' +
      esc(p.uom) +
      '</dd><dt>Stock status</dt><dd>' +
      badge(pStatus(p)) +
      '</dd></dl></div></section>' +
      card('Recent changes', auditTimeline(hist.slice(0, 5)), { sub: 'Latest edits to this record' }) +
      '</div></div>',
    mount(page) {
      const form = $('#pform', page);
      bindProductForm(form, p);
      mountTable(page, '#pStock', {
        title: p.sku + ' stock',
        search: false,
        columns: stockRowColumns(),
        data: rows,
        auto: true,
        exportable: false,
        columnFilter: false,
        noToolbar: true,
        paginate: false,
        emptyTitle: 'No stock on hand',
        emptyText: 'Receive goods or post an opening balance to create stock.'
      });
      mountTable(page, '#pTx', {
        title: p.sku + ' transactions',
        columns: ledgerColumns({ noProduct: true }),
        data: () =>
          ledger
            .filter(e => e.productId === p.id)
            .slice()
            .reverse(),
        pageSize: 10,
        emptyTitle: 'No transactions',
        emptyText: 'Movements appear here when stock is received, issued or adjusted.'
      });
      $('[data-del]', page).onclick = () => deleteProduct(p, () => navigate('products'));
      page.addEventListener('click', e => {
        const a = e.target.closest('[data-le]');
        if (a) {
          e.preventDefault();
          ledgerDrawer(ledger.find(x => x.id === a.dataset.le));
        }
      });
      const save = how => {
        if (!productValidate(form, p)) return;
        const d = formData(form);
        const before = Object.assign({}, p);
        productFromForm(d, p);
        const changes = Object.keys(FIELD_LABELS).filter(
          k => String(before[k] == null ? '' : before[k]) !== String(p[k] == null ? '' : p[k])
        );
        if (!changes.length) {
          toast('info', 'No changes to save', 'The product already has these values.');
          return;
        }
        changes.forEach(k =>
          logAudit(
            'Inventory',
            'Updated',
            p.sku,
            FIELD_LABELS[k] + ': ' + fmtField(k, before[k]),
            FIELD_LABELS[k] + ': ' + fmtField(k, p[k])
          )
        );
        if (before.cost !== p.cost || before.price !== p.price)
          (p.priceHistory = p.priceHistory || []).push({
            date: NOW(),
            cost: p.cost,
            price: p.price,
            oldCost: before.cost,
            oldPrice: before.price,
            user: CURRENT_USER.name,
            reason: 'Manual price update'
          });
        p.updatedAt = NOW();
        p.updatedBy = CURRENT_USER.name;
        toast(
          'success',
          'Changes saved',
          changes.length +
            ' field' +
            (changes.length > 1 ? 's' : '') +
            ' updated on ' +
            p.sku +
            ': ' +
            changes
              .slice(0, 3)
              .map(k => FIELD_LABELS[k].toLowerCase())
              .join(', ') +
            (changes.length > 3 ? '…' : '') +
            '.'
        );
        navigate(how === 'close' ? 'products' : 'product-edit/' + p.id);
      };
      form.addEventListener('submit', e => {
        e.preventDefault();
        save('stay');
      });
      $('[data-save=close]', page).onclick = () => save('close');
    }
  };
};

/* ---------- product details ---------- */
ROUTES['product-view'] = id => {
  const p = P_BY(id);
  if (!p) return ROUTES['not-found']();
  const qty = productQty(p.id),
    res = productReserved(p.id),
    oo = onOrder(p.id);
  const rows = () => stock.filter(s => s.productId === p.id);
  const tx = () =>
    ledger
      .filter(e => e.productId === p.id)
      .slice()
      .reverse();
  const purch = [];
  grns.forEach(g =>
    g.items.forEach(it => {
      if (it.productId === p.id) purch.push({ id: g.id + it.productId, g, it });
    })
  );
  const sales = [];
  salesOrders.forEach(s =>
    s.items.forEach(it => {
      if (it.productId === p.id) sales.push({ id: s.id, s, it });
    })
  );
  const ws = weeks(13);
  const trend = ws.map(d => Math.max(0, qtyAt(p.id, d)));
  const COLS = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)'];
  const st = pStatus(p);
  const cat = CAT_BY(p.categoryId);
  const pb = batches.filter(b => b.productId === p.id && b.qty > 0);
  return {
    title: p.name,
    nav: 'products',
    crumbs: [['Inventory', 'inventory'], ['Products', 'products'], [p.name]],
    titleHTML: esc(p.name) + ' ' + badge(p.status) + ' ' + badge(st),
    sub:
      '<span class="mono">' +
      esc(p.sku) +
      '</span> · ' +
      esc(cat.name) +
      ' / ' +
      esc(p.sub) +
      ' · ' +
      esc(p.brand),
    actions:
      btn('Edit', 'edit', '', 'data-go="product-edit/' + p.id + '"') +
      btn('Delete', 'trash', 'danger-ghost', 'data-del') +
      btn('More', 'more', '', 'data-more aria-haspopup="menu"'),
    body:
      '<div class="stat-strip mb-16"><div class="stat"><small>Available Stock</small><b>' +
      fmtN(qty - res) +
      '</b><em>' +
      fmtN(qty) +
      ' on hand · ' +
      esc(uomName(p.uom)) +
      '</em></div><div class="stat"><small>Reserved</small><b>' +
      fmtN(res) +
      '</b><em>Open sales orders</em></div><div class="stat"><small>On Order</small><b>' +
      fmtN(oo) +
      '</b><em>Open purchase orders</em></div><div class="stat"><small>Reorder Level</small><b>' +
      fmtN(p.reorder) +
      '</b><em>Min ' +
      fmtN(p.min) +
      ' · Max ' +
      fmtN(p.max) +
      '</em></div><div class="stat"><small>Inventory Value</small><b>' +
      fmtM(qty * p.cost, 0) +
      '</b><em>at ' +
      fmtM(p.cost) +
      ' standard cost</em></div></div>' +
      '<section class="card" data-tabs>' +
      tabsHTML(
        [
          ['ov', 'Overview'],
          ['stock', 'Stock', rows().length],
          ['wh', 'Warehouses'],
          ['tx', 'Transactions', tx().length],
          ['po', 'Purchase History', purch.length],
          ['so', 'Sales History', sales.length],
          ['price', 'Price History'],
          ['audit', 'Audit Log', auditFor(p.sku).length]
        ],
        'ov'
      ) +
      '<div class="tab-panel active" data-panel="ov"><div class="card-body"><div class="grid g-7-5"><div><h3 class="card-title mb-16">Product details</h3><dl class="dl cols-2"><dt>SKU</dt><dd class="mono">' +
      esc(p.sku) +
      '</dd><dt>Barcode</dt><dd class="mono">' +
      esc(p.barcode || '—') +
      '</dd><dt>Product code</dt><dd>' +
      esc(p.code || '—') +
      '</dd><dt>Product type</dt><dd>' +
      esc(p.type) +
      '</dd><dt>Category</dt><dd>' +
      esc(cat.name) +
      '</dd><dt>Subcategory</dt><dd>' +
      esc(p.sub || '—') +
      '</dd><dt>Inventory type</dt><dd>' +
      esc(p.invType) +
      '</dd><dt>Unit</dt><dd>' +
      esc(uomName(p.uom)) +
      ' (' +
      esc(p.uom) +
      ')</dd><dt>Purchase price</dt><dd>' +
      fmtM(p.cost) +
      '</dd><dt>Selling price</dt><dd>' +
      fmtM(p.price) +
      '</dd><dt>Tax</dt><dd>' +
      esc(p.tax) +
      '</dd><dt>Default warehouse</dt><dd>' +
      esc(W_BY(p.defaultWarehouseId).name) +
      '</dd><dt>Safety stock</dt><dd>' +
      fmtN(p.safety) +
      '</dd><dt>Tracking</dt><dd>' +
      ([p.batch ? 'Batch' : '', p.serial ? 'Serial' : '', p.expiry ? 'Expiry' : '']
        .filter(Boolean)
        .join(', ') || 'Quantity only') +
      '</dd></dl><p class="muted mt-16" style="max-width:70ch">' +
      esc(p.desc || '') +
      '</p></div>' +
      '<div><h3 class="card-title">On-hand trend</h3><p class="card-sub mb-16">Weekly closing quantity, last 13 weeks</p>' +
      lineChart({
        labels: ws.map(shortD),
        series: [
          { name: 'On hand', values: trend, color: 'var(--c1)' },
          { name: 'Reorder level', values: ws.map(() => p.reorder), color: 'var(--c3)', dash: true }
        ],
        h: 200,
        pl: 44
      }) +
      '</div></div></div></div>' +
      '<div class="tab-panel" data-panel="stock"><div id="vStock"></div>' +
      (pb.length
        ? '<div class="card-body" style="border-top:1px solid var(--border)"><h3 class="card-title mb-16">Batches on hand</h3><div class="table-wrap auto"><table class="tbl compact"><thead><tr><th>Batch</th><th>Warehouse</th><th>Received</th><th>Expiry</th><th class="right">Qty</th></tr></thead><tbody>' +
          pb
            .map(
              b =>
                '<tr><td class="mono">' +
                esc(b.batch) +
                '</td><td>' +
                esc(W_BY(b.warehouseId).code) +
                '</td><td>' +
                fmtD(b.received) +
                '</td><td>' +
                (b.expiry ? fmtD(b.expiry) + ' ' + badge(expStatus(b)) : '—') +
                '</td><td class="right num">' +
                fmtN(b.qty) +
                '</td></tr>'
            )
            .join('') +
          '</tbody></table></div></div>'
        : '') +
      '</div>' +
      '<div class="tab-panel" data-panel="wh"><div class="card-body">' +
      (rows().length
        ? '<div class="grid g-2">' +
          donut(
            rows().map((r, i) => ({ label: W_BY(r.warehouseId).name, value: r.qty, color: COLS[i % 6] })),
            { center: fmtN(qty), centerSub: esc(p.uom) + ' on hand' }
          ) +
          '<div class="hbars">' +
          rows()
            .map(r => {
              const n = rows().length;
              const share = p.max / n;
              return (
                '<div class="hbar-row"><span class="nm"><b style="font-weight:600">' +
                esc(W_BY(r.warehouseId).code) +
                '</b> <span class="muted">' +
                esc((L_BY(r.locationId) || {}).code) +
                '</span></span><span class="vl">' +
                fmtN(r.qty) +
                ' / ' +
                fmtN(Math.round(share)) +
                '</span><div class="bar ' +
                (r.qty < p.reorder / n ? 'w' : '') +
                '"><i style="width:' +
                clamp((r.qty / share) * 100, 0, 100) +
                '%"></i></div></div>'
              );
            })
            .join('') +
          '<p class="hint">Quantity against each site’s share of maximum stock</p></div></div>'
        : '<div class="empty"><div class="empty-ico">' +
          icon('warehouse', 22) +
          '</div><h4>Not stocked in any warehouse</h4><p>Receive goods to place this product in a warehouse.</p><button class="btn btn-primary" data-go="grn-create">Create GRN</button></div>') +
      '</div></div>' +
      '<div class="tab-panel" data-panel="tx"><div id="vTx"></div></div>' +
      '<div class="tab-panel" data-panel="po"><div id="vPo"></div></div>' +
      '<div class="tab-panel" data-panel="so"><div id="vSo"></div></div>' +
      '<div class="tab-panel" data-panel="price"><div class="table-wrap auto"><table class="tbl"><thead><tr><th>Effective date</th><th class="right">Purchase price</th><th class="right">Change</th><th class="right">Selling price</th><th class="right">Margin</th><th>Changed by</th><th>Reason</th></tr></thead><tbody>' +
      (p.priceHistory || [])
        .slice()
        .reverse()
        .map(h => {
          const ch = h.oldCost ? ((h.cost - h.oldCost) / h.oldCost) * 100 : 0;
          return (
            '<tr><td>' +
            fmtD(h.date) +
            '</td><td class="right num">' +
            fmtM(h.cost) +
            '</td><td class="right num ' +
            (ch > 0 ? 'neg' : ch < 0 ? 'pos' : 'muted') +
            '">' +
            (h.oldCost ? (ch > 0 ? '+' : '') + ch.toFixed(1) + '%' : '—') +
            '</td><td class="right num">' +
            fmtM(h.price) +
            '</td><td class="right num">' +
            (((h.price - h.cost) / h.price) * 100).toFixed(1) +
            '%</td><td>' +
            userCell(h.user) +
            '</td><td class="muted">' +
            esc(h.reason) +
            '</td></tr>'
          );
        })
        .join('') +
      '</tbody></table></div></div>' +
      '<div class="tab-panel" data-panel="audit"><div class="card-body">' +
      auditTimeline(auditFor(p.sku)) +
      '</div></div>' +
      '</section>' +
      '<section class="card mt-16"><div class="card-body"><dl class="dl cols-2"><dt>Created by</dt><dd>' +
      esc(p.createdBy) +
      '</dd><dt>Created date</dt><dd>' +
      fmtDT(p.createdAt) +
      '</dd><dt>Updated by</dt><dd>' +
      esc(p.updatedBy) +
      '</dd><dt>Updated date</dt><dd>' +
      fmtDT(p.updatedAt) +
      '</dd></dl></div></section>',
    mount(page) {
      $('[data-del]', page).onclick = () => deleteProduct(p, () => navigate('products'));
      $('[data-more]', page).onclick = e =>
        openMenu(e.currentTarget, [
          { label: 'Duplicate', icon: 'copy', onClick: () => navigate('product-create?from=' + p.id) },
          { label: 'Stock History', icon: 'history', onClick: () => navigate('ledger?product=' + p.id) },
          {
            label: 'Adjust stock',
            icon: 'sliders',
            onClick: () => navigate('adjustment-create?product=' + p.id)
          },
          {
            label: 'Transfer stock',
            icon: 'transfer',
            onClick: () => navigate('transfer-create?product=' + p.id)
          },
          { label: 'Raise purchase order', icon: 'cart', onClick: () => raisePO(p) },
          '-',
          {
            label: p.status === 'Inactive' ? 'Mark active' : 'Mark inactive',
            icon: p.status === 'Inactive' ? 'checkCircle' : 'ban',
            onClick: () => {
              const o = p.status;
              p.status = o === 'Inactive' ? 'Active' : 'Inactive';
              p.updatedAt = NOW();
              p.updatedBy = CURRENT_USER.name;
              logAudit('Inventory', 'Updated', p.sku, 'Status: ' + o, 'Status: ' + p.status);
              toast('success', 'Status updated', p.name + ' is now ' + p.status + '.');
              renderRoute();
            }
          }
        ]);
      mountTable(page, '#vStock', {
        title: p.sku + ' stock',
        noToolbar: true,
        paginate: false,
        auto: true,
        columns: stockRowColumns(),
        data: rows,
        emptyTitle: 'No stock on hand',
        emptyText: 'Receive goods to create stock for this product.'
      });
      mountTable(page, '#vTx', {
        title: p.sku + ' transactions',
        columns: ledgerColumns({ noProduct: true }),
        data: tx,
        emptyTitle: 'No transactions yet'
      });
      mountTable(page, '#vPo', {
        title: p.sku + ' purchase history',
        columns: [
          { key: 'date', label: 'Receipt date', value: x => x.g.date, render: x => fmtD(x.g.date) },
          {
            key: 'no',
            label: 'GRN',
            value: x => x.g.no,
            render: x => '<a class="link mono" href="#/grn-view/' + x.g.id + '">' + esc(x.g.no) + '</a>'
          },
          {
            key: 'po',
            label: 'Purchase order',
            value: x => x.g.poNo,
            render: x => '<span class="mono">' + esc(x.g.poNo) + '</span>'
          },
          { key: 'sup', label: 'Supplier', value: x => x.g.supplier },
          { key: 'wh', label: 'Warehouse', value: x => W_BY(x.g.warehouseId).code },
          {
            key: 'rec',
            label: 'Received',
            align: 'right',
            value: x => x.it.received,
            render: x => fmtN(x.it.received)
          },
          {
            key: 'acc',
            label: 'Accepted',
            align: 'right',
            value: x => x.it.accepted,
            render: x => fmtN(x.it.accepted)
          },
          {
            key: 'cost',
            label: 'Unit cost',
            align: 'right',
            value: x => x.it.cost,
            render: x => fmtM(x.it.cost)
          },
          { key: 'st', label: 'Status', value: x => x.g.status, render: x => badge(x.g.status) }
        ],
        data: () => purch.slice().sort((a, b) => b.g.date - a.g.date),
        emptyTitle: 'No purchases yet',
        emptyText: 'Goods receipts for this product will be listed here.'
      });
      mountTable(page, '#vSo', {
        title: p.sku + ' sales history',
        columns: [
          { key: 'date', label: 'Order date', value: x => x.s.date, render: x => fmtD(x.s.date) },
          {
            key: 'no',
            label: 'Sales order',
            value: x => x.s.no,
            render: x => '<span class="mono">' + esc(x.s.no) + '</span>'
          },
          { key: 'cust', label: 'Customer', value: x => x.s.customer },
          { key: 'wh', label: 'Warehouse', value: x => W_BY(x.s.warehouseId).code },
          {
            key: 'qty',
            label: 'Quantity',
            align: 'right',
            value: x => x.it.qty,
            render: x => fmtN(x.it.qty)
          },
          {
            key: 'price',
            label: 'Unit price',
            align: 'right',
            value: x => x.it.price,
            render: x => fmtM(x.it.price)
          },
          {
            key: 'amt',
            label: 'Amount',
            align: 'right',
            value: x => x.it.qty * x.it.price,
            render: x => fmtM(x.it.qty * x.it.price)
          },
          { key: 'st', label: 'Status', value: x => x.s.status, render: x => badge(x.s.status) }
        ],
        data: () => sales.slice().sort((a, b) => b.s.date - a.s.date),
        rowId: x => x.s.id + x.it.productId,
        emptyTitle: 'No sales yet',
        emptyText: 'Sales orders for this product will be listed here.'
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
function expStatus(b) {
  if (!b.expiry) return 'Good';
  const d = daysBetween(NOW(), b.expiry);
  return d < 0 ? 'Expired' : d <= SETTINGS.expiryWarn ? 'Expiring Soon' : d <= 90 ? 'Within 90 Days' : 'Good';
}
function ledgerDrawer(e) {
  if (!e) return;
  const p = P_BY(e.productId);
  const w = W_BY(e.warehouseId);
  const docRoute = {
    GRN: grns,
    'Goods Issue': goodsIssues,
    Transfer: stockTransfers,
    Adjustment: stockAdjustments
  }[e.type];
  let link = '';
  if (docRoute) {
    const d = docRoute.find(x => x.no === e.txNo);
    if (d)
      link =
        {
          GRN: 'grn-view/',
          'Goods Issue': 'issue-view/',
          Transfer: 'transfer-view/',
          Adjustment: 'adjustment-view/'
        }[e.type] + d.id;
  }
  openDrawer({
    title: e.txNo,
    icon: 'book',
    subtitle: esc(e.type) + ' · ' + fmtDT(e.date),
    body:
      '<dl class="dl"><dt>Product</dt><dd>' +
      (p
        ? '<a class="link" href="#/product-view/' +
          p.id +
          '">' +
          esc(p.name) +
          '</a><br><span class="mono muted">' +
          esc(p.sku) +
          '</span>'
        : 'Deleted product') +
      '</dd><dt>Warehouse</dt><dd>' +
      esc(w.name) +
      '</dd><dt>Transaction type</dt><dd>' +
      esc(e.type) +
      '</dd><dt>Opening qty</dt><dd class="num">' +
      fmtN(e.opening) +
      '</dd><dt>In qty</dt><dd class="num pos">' +
      (e.inQty ? '+' + fmtN(e.inQty) : '—') +
      '</dd><dt>Out qty</dt><dd class="num neg">' +
      (e.outQty ? '−' + fmtN(e.outQty) : '—') +
      '</dd><dt>Balance qty</dt><dd class="num"><b>' +
      fmtN(e.balance) +
      '</b></dd><dt>Unit cost</dt><dd class="num">' +
      fmtM(e.unitCost) +
      '</dd><dt>Value</dt><dd class="num ' +
      (e.value >= 0 ? 'pos' : 'neg') +
      '">' +
      fmtM(e.value) +
      '</dd><dt>Reference</dt><dd>' +
      esc(e.ref || '—') +
      '</dd><dt>Posted by</dt><dd>' +
      esc(e.user) +
      '</dd><dt>Entry ID</dt><dd class="mono">' +
      esc(e.id) +
      '</dd></dl><div class="alert alert-info mt-24">' +
      icon('lock', 16) +
      '<span>Ledger entries are immutable. Post a stock adjustment to correct a balance.</span></div>',
    actions: [{ label: 'Close' }].concat(
      link
        ? [{ label: 'Open document', variant: 'primary', icon: 'file', onClick: () => navigate(link) }]
        : []
    )
  });
}
function raisePO(p) {
  const sug = Math.max(p.reorder, p.max - productQty(p.id) - onOrder(p.id));
  const body = el(
    '<form novalidate><div class="form-grid">' +
      F({
        name: 'supplier',
        label: 'Supplier',
        type: 'select',
        req: true,
        span: 12,
        value: SUPPLIERS[p.categoryId],
        options: [...new Set(Object.values(SUPPLIERS))]
      }) +
      F({
        name: 'wid',
        label: 'Deliver to',
        type: 'select',
        req: true,
        span: 6,
        value: p.defaultWarehouseId,
        placeholder: false,
        options: whOptions()
      }) +
      F({
        name: 'expected',
        label: 'Expected date',
        type: 'date',
        req: true,
        span: 6,
        value: isoDate(addDays(NOW(), 7))
      }) +
      F({
        name: 'qty',
        label: 'Order quantity',
        type: 'number',
        req: true,
        min: 1,
        span: 6,
        value: sug,
        suffix: p.uom,
        hint: 'Suggested: max stock less on hand and on order'
      }) +
      F({
        name: 'cost',
        label: 'Unit cost',
        type: 'number',
        req: true,
        min: 0,
        step: '0.01',
        prefix: '$',
        span: 6,
        value: p.cost
      }) +
      '</div><div class="callout mt-16"><b>' +
      esc(p.name) +
      '</b> · on hand ' +
      fmtN(productQty(p.id)) +
      ' · on order ' +
      fmtN(onOrder(p.id)) +
      ' · reorder at ' +
      fmtN(p.reorder) +
      '</div></form>'
  );
  openModal({
    type: 'create',
    title: 'Raise purchase order',
    subtitle: esc(p.sku) + ' · ' + esc(p.name),
    body,
    actions: [
      { label: 'Cancel' },
      {
        label: 'Create purchase order',
        variant: 'primary',
        icon: 'cart',
        onClick: api => {
          const f = $('form', api.el);
          if (!validateForm(f)) return false;
          const d = formData(f);
          const po = {
            id: uid('PO'),
            no: nextNo('PO'),
            date: NOW(),
            supplier: d.supplier,
            warehouseId: d.wid,
            status: 'Open',
            expected: new Date(d.expected),
            items: [{ productId: p.id, qty: d.qty, received: 0, cost: d.cost }],
            createdBy: CURRENT_USER.name,
            terms: 'Net 30'
          };
          purchaseOrders.unshift(po);
          logAudit('Purchasing', 'Created', po.no, '—', 'Status: Open · ' + p.sku + ' × ' + d.qty);
          toast(
            'success',
            'Purchase order created',
            po.no + ' for ' + fmtN(d.qty) + ' ' + p.uom + ' of ' + p.name + '.',
            { label: 'Receive against it', onClick: () => navigate('grn-create?po=' + po.id) }
          );
        }
      }
    ]
  });
}

/* ---------- categories ---------- */
function categoryModal(c, after) {
  const edit = !!c;
  const body = el(
    '<form novalidate><div class="form-grid">' +
      F({ name: 'name', label: 'Category name', req: true, span: 8, value: c && c.name }) +
      F({
        name: 'code',
        label: 'SKU prefix',
        req: true,
        span: 4,
        value: c && c.code,
        pattern: '^[A-Z]{3}$',
        patternMsg: 'Use three uppercase letters'
      }) +
      F({
        name: 'subs',
        label: 'Subcategories',
        span: 12,
        value: c ? c.subs.join(', ') : '',
        hint: 'Separate with commas'
      }) +
      F({ name: 'desc', label: 'Description', type: 'textarea', span: 12, rows: 2, value: c && c.desc }) +
      F({
        name: 'active',
        label: 'Active',
        type: 'toggle',
        span: 12,
        value: c ? c.status === 'Active' : true,
        hint: 'Inactive categories are hidden on new products'
      }) +
      '</div></form>'
  );
  openModal({
    type: edit ? 'edit' : 'create',
    title: edit ? 'Edit category' : 'Create category',
    subtitle: edit ? esc(c.name) : 'Group products for reporting and SKU numbering',
    body,
    actions: [
      { label: 'Cancel' },
      {
        label: edit ? 'Save changes' : 'Create category',
        variant: 'primary',
        onClick: api => {
          const f = $('form', api.el);
          if (
            !validateForm(f, err => {
              const d = formData(f);
              if (categories.some(x => x !== c && x.code === d.code))
                err('code', 'Prefix ' + d.code + ' is already used');
              if (categories.some(x => x !== c && x.name.toLowerCase() === d.name.toLowerCase()))
                err('name', 'A category with this name exists');
            })
          )
            return false;
          const d = formData(f);
          const o = c || { id: 'C' + String(categories.length + 1).padStart(2, '0') };
          const old = c ? c.name : '—';
          Object.assign(o, {
            name: d.name,
            code: d.code,
            subs: d.subs
              .split(',')
              .map(s => s.trim())
              .filter(Boolean),
            desc: d.desc,
            status: d.active ? 'Active' : 'Inactive'
          });
          if (!c) categories.push(o);
          logAudit('Inventory', c ? 'Updated' : 'Created', 'Category ' + o.code, old, o.name);
          toast('success', c ? 'Category updated' : 'Category created', '“' + o.name + '” saved.');
          if (after) after();
          else if (currentRoute && currentRoute.name === 'categories') renderRoute();
        }
      }
    ]
  });
}
ROUTES.categories = () => ({
  title: 'Product Categories',
  nav: 'categories',
  crumbs: [['Inventory', 'inventory'], ['Products', 'products'], ['Product Categories']],
  sub: 'Categories drive SKU prefixes, reporting groups and default suppliers.',
  actions: btn('Create Category', 'plus', 'primary', 'data-new'),
  body: '<section class="card" id="catT"></section>',
  mount(page) {
    const t = mountTable(page, '#catT', {
      title: 'Categories',
      columns: [
        { key: 'code', label: 'Prefix', render: c => '<span class="mono">' + esc(c.code) + '</span>' },
        {
          key: 'name',
          label: 'Category',
          render: c =>
            '<div class="cell-main"><span class="thumb" style="color:' +
            (CAT_COLORS[c.id] || ['#475467'])[0] +
            ';background:' +
            (CAT_COLORS[c.id] || [0, 'var(--surface-secondary)'])[1] +
            '">' +
            icon('folder', 15) +
            '</span><div><b>' +
            esc(c.name) +
            '</b><small>' +
            esc(c.desc || '') +
            '</small></div></div>'
        },
        {
          key: 'subs',
          label: 'Subcategories',
          value: c => c.subs.join(', '),
          nowrap: false,
          render: c =>
            '<div class="row wrap" style="gap:4px">' +
            c.subs.map(s => '<span class="chip">' + esc(s) + '</span>').join('') +
            '</div>'
        },
        {
          key: 'products',
          label: 'Products',
          align: 'right',
          value: c => products.filter(p => p.categoryId === c.id).length,
          render: c =>
            '<a class="link" href="#/products?category=' +
            c.id +
            '">' +
            products.filter(p => p.categoryId === c.id).length +
            '</a>'
        },
        {
          key: 'value',
          label: 'Stock Value',
          align: 'right',
          value: c =>
            sum(
              products.filter(p => p.categoryId === c.id),
              pValue
            ),
          render: c =>
            fmtM(
              sum(
                products.filter(p => p.categoryId === c.id),
                pValue
              ),
              0
            )
        },
        { key: 'status', label: 'Status', render: c => badge(c.status) }
      ],
      data: () => categories,
      actions: c => [
        { label: 'View products', icon: 'eye', onClick: () => navigate('products?category=' + c.id) },
        { label: 'Edit', icon: 'edit', onClick: () => categoryModal(c, () => t.refresh()) },
        '-',
        {
          label: 'Delete',
          icon: 'trash',
          danger: true,
          onClick: () => {
            const n = products.filter(p => p.categoryId === c.id).length;
            if (n) {
              messageModal(
                'warning',
                'Category in use',
                '<p>“' +
                  esc(c.name) +
                  '” can’t be deleted because ' +
                  n +
                  ' products are assigned to it. Move them to another category first.</p>',
                [
                  { label: 'Close' },
                  {
                    label: 'View products',
                    variant: 'primary',
                    onClick: () => navigate('products?category=' + c.id)
                  }
                ]
              );
              return;
            }
            confirmDialog({
              danger: true,
              title: 'Delete category?',
              message: 'Delete “' + esc(c.name) + '”? This action cannot be undone.',
              confirm: 'Delete category'
            }).then(ok => {
              if (!ok) return;
              categories.splice(categories.indexOf(c), 1);
              logAudit('Inventory', 'Deleted', 'Category ' + c.code, c.name, '—');
              toast('success', 'Category deleted', c.name + ' was removed.');
              t.refresh();
            });
          }
        }
      ]
    });
    $('[data-new]', page).onclick = () => categoryModal(null, () => t.refresh());
  }
});

/* ---------- units ---------- */
function unitModal(u, after) {
  const edit = !!u;
  const body = el(
    '<form novalidate><div class="form-grid">' +
      F({
        name: 'code',
        label: 'Code',
        req: true,
        span: 4,
        value: u && u.code,
        pattern: '^[A-Z]{1,4}$',
        patternMsg: '1–4 uppercase letters',
        readonly: edit
      }) +
      F({ name: 'name', label: 'Name', req: true, span: 8, value: u && u.name }) +
      F({
        name: 'type',
        label: 'Measure type',
        type: 'select',
        req: true,
        span: 6,
        value: u ? u.type : 'Count',
        placeholder: false,
        options: ['Count', 'Weight', 'Volume', 'Length', 'Area']
      }) +
      F({
        name: 'precision',
        label: 'Decimal places',
        type: 'number',
        req: true,
        min: 0,
        max: 4,
        span: 6,
        value: u ? u.precision : 0
      }) +
      F({
        name: 'active',
        label: 'Active',
        type: 'toggle',
        span: 12,
        value: u ? u.status === 'Active' : true
      }) +
      '</div></form>'
  );
  openModal({
    type: edit ? 'edit' : 'create',
    title: edit ? 'Edit unit' : 'Create unit',
    subtitle: edit ? esc(u.code) + ' · ' + esc(u.name) : 'Units of measure for stock quantities',
    body,
    actions: [
      { label: 'Cancel' },
      {
        label: edit ? 'Save changes' : 'Create unit',
        variant: 'primary',
        onClick: api => {
          const f = $('form', api.el);
          if (
            !validateForm(f, err => {
              const d = formData(f);
              if (!edit && units.some(x => x.code === d.code))
                err('code', 'Code ' + d.code + ' already exists');
            })
          )
            return false;
          const d = formData(f);
          const o = u || { id: 'U' + (units.length + 1) };
          Object.assign(o, {
            code: d.code,
            name: d.name,
            type: d.type,
            precision: d.precision,
            status: d.active ? 'Active' : 'Inactive'
          });
          if (!u) units.push(o);
          logAudit('Inventory', u ? 'Updated' : 'Created', 'Unit ' + o.code, '—', o.name);
          toast('success', u ? 'Unit updated' : 'Unit created', o.code + ' · ' + o.name + ' saved.');
          after();
        }
      }
    ]
  });
}
ROUTES.units = () => ({
  title: 'Product Units',
  crumbs: [['Inventory', 'inventory'], ['Products', 'products'], ['Product Units']],
  sub: 'Units of measure available on products and transactions.',
  actions: btn('Create Unit', 'plus', 'primary', 'data-new'),
  body: '<section class="card" id="uT"></section>',
  mount(page) {
    const t = mountTable(page, '#uT', {
      title: 'Units',
      columns: [
        { key: 'code', label: 'Code', render: u => '<span class="mono strong">' + esc(u.code) + '</span>' },
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Measure type' },
        { key: 'precision', label: 'Decimal places', align: 'right' },
        {
          key: 'used',
          label: 'Products using',
          align: 'right',
          value: u => products.filter(p => p.uom === u.code).length
        },
        { key: 'status', label: 'Status', render: u => badge(u.status) }
      ],
      data: () => units,
      actions: u => [
        { label: 'Edit', icon: 'edit', onClick: () => unitModal(u, () => t.refresh()) },
        '-',
        {
          label: 'Delete',
          icon: 'trash',
          danger: true,
          onClick: () => {
            const n = products.filter(p => p.uom === u.code).length;
            if (n) {
              messageModal(
                'warning',
                'Unit in use',
                '<p>' +
                  esc(u.code) +
                  ' is used by ' +
                  n +
                  ' products and can’t be deleted. Set it to Inactive instead.</p>'
              );
              return;
            }
            confirmDialog({
              danger: true,
              title: 'Delete unit?',
              message: 'Delete ' + esc(u.code) + ' · ' + esc(u.name) + '? This action cannot be undone.',
              confirm: 'Delete unit'
            }).then(ok => {
              if (!ok) return;
              units.splice(units.indexOf(u), 1);
              logAudit('Inventory', 'Deleted', 'Unit ' + u.code, u.name, '—');
              toast('success', 'Unit deleted', u.code + ' removed.');
              t.refresh();
            });
          }
        }
      ]
    });
    $('[data-new]', page).onclick = () => unitModal(null, () => t.refresh());
  }
});
