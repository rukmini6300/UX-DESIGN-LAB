/* =========================================================================
   LINE EDITOR
   Editable item lines used on transfer, adjustment, receipt and issue
   forms.

   Provides: LineEditor, lineProdSelect, docHeaderCard, reasonModal
   ========================================================================= */
'use strict';

function LineEditor(o) {
  const root = el(
    '<div><div class="table-wrap auto"><table class="tbl items-tbl"><thead><tr><th style="width:36px">#</th>' +
      o.cols
        .map(
          c =>
            '<th class="' +
            (c.align === 'right' ? 'right' : '') +
            '" style="' +
            (c.w ? 'width:' + c.w : '') +
            '">' +
            esc(c.label) +
            (c.req ? '<span class="req">*</span>' : '') +
            '</th>'
        )
        .join('') +
      '<th class="act"><span class="sr">Remove</span></th></tr></thead><tbody></tbody></table></div><div class="items-foot"><button type="button" class="btn btn-sm" data-add>' +
      icon('plus', 15) +
      'Add item</button><div class="row wrap" data-foot style="gap:16px;font-size:13px"></div></div></div>'
  );
  const tbody = $('tbody', root);
  const api = { el: root, lines: o.lines && o.lines.length ? o.lines : [o.newLine()] };
  function rowEl(line, i) {
    const tr = el(
      '<table><tbody><tr data-i="' +
        i +
        '"><td class="ro num">' +
        (i + 1) +
        '</td>' +
        o.rowHTML(line, i) +
        '<td class="act"><button type="button" class="btn btn-ghost btn-sm btn-icon" data-rm aria-label="Remove line">' +
        icon('trash', 15) +
        '</button></td></tr></tbody></table>'
    ).querySelector('tr');
    if (o.calc) $$('[data-calc]', tr).forEach(c => (c.innerHTML = o.calc(line, c.dataset.calc)));
    return tr;
  }
  api.render = () => {
    tbody.innerHTML = '';
    if (!api.lines.length) {
      tbody.innerHTML =
        '<tr><td colspan="' +
        (o.cols.length + 2) +
        '"><div class="empty" style="padding:24px"><h4>No items</h4><p>Add at least one item to this document.</p></div></td></tr>';
    }
    api.lines.forEach((l, i) => tbody.append(rowEl(l, i)));
    api.foot();
  };
  api.foot = () => {
    $('[data-foot]', root).innerHTML = o.footer ? o.footer(api.lines) : '';
  };
  api.refreshRow = i => {
    const old = $('tr[data-i="' + i + '"]', tbody);
    if (old) old.replaceWith(rowEl(api.lines[i], i));
    api.foot();
  };
  root.addEventListener('click', e => {
    if (e.target.closest('[data-add]')) {
      api.lines.push(o.newLine());
      api.render();
      const last = $('tbody tr:last-child select, tbody tr:last-child input', root);
      if (last) last.focus();
      return;
    }
    const rm = e.target.closest('[data-rm]');
    if (rm) {
      api.lines.splice(+rm.closest('tr').dataset.i, 1);
      api.render();
    }
  });
  const onEdit = (e, full) => {
    const inp = e.target.closest('[data-k]');
    if (!inp) return;
    const tr = inp.closest('tr');
    const i = +tr.dataset.i;
    const line = api.lines[i];
    const k = inp.dataset.k;
    line[k] = inp.type === 'number' ? (inp.value === '' ? null : Number(inp.value)) : inp.value;
    inp.classList.remove('invalid');
    if (o.onChange) o.onChange(line, k);
    if (full && o.rerenderOn && o.rerenderOn.includes(k)) {
      api.refreshRow(i);
      const n = $(
        'tr[data-i="' + i + '"] [data-k="' + ((o.focusAfter && o.focusAfter[k]) || k) + '"]',
        tbody
      );
      if (n) n.focus();
    } else {
      $$('[data-calc]', tr).forEach(c => (c.innerHTML = o.calc(line, c.dataset.calc)));
      api.foot();
    }
  };
  root.addEventListener('input', e => onEdit(e, false));
  root.addEventListener('change', e => onEdit(e, true));
  api.validate = () => {
    let ok = true;
    const seen = {};
    $$('.invalid', root).forEach(x => x.classList.remove('invalid'));
    if (!api.lines.length) {
      toast('error', 'Add at least one item', 'The document has no lines.');
      return false;
    }
    api.lines.forEach((l, i) => {
      const tr = $('tr[data-i="' + i + '"]', tbody);
      const errs = o.validateLine(l, i);
      if (l.productId) {
        if (seen[l.productId]) {
          errs.productId = 'Duplicate product';
        }
        seen[l.productId] = 1;
      }
      Object.keys(errs).forEach(k => {
        const f = $('[data-k="' + k + '"]', tr);
        if (f) {
          f.classList.add('invalid');
          f.title = errs[k];
        }
        ok = false;
      });
      if (Object.keys(errs).length && ok === false && !api._first) api._first = Object.values(errs)[0];
    });
    if (!ok) {
      toast('error', 'Fix the highlighted items', api._first || 'Some lines are incomplete.');
      api._first = null;
      const f = $('.invalid', root);
      if (f) f.focus();
    }
    return ok;
  };
  api.render();
  return api;
}
const lineProdSelect = (line, list) =>
  '<select class="select" data-k="productId" aria-label="Product" style="min-width:220px">' +
  optionsHTML(
    list.map(p => [p.id, p.name + ' — ' + p.sku]),
    line.productId,
    'Select product'
  ) +
  '</select>';
function docHeaderCard(no, status, flowHTML, actionsHTML) {
  return (
    '<section class="card mb-16"><div class="card-body"><div class="row between wrap" style="gap:16px;margin-bottom:20px"><div class="doc-head"><span class="doc-ico">' +
    icon('file', 22) +
    '</span><div><div class="row" style="gap:10px"><b class="mono" style="font-size:16px">' +
    esc(no) +
    '</b>' +
    badge(status) +
    '</div><div class="muted" style="font-size:13px">Workflow status</div></div></div><div class="row wrap">' +
    actionsHTML +
    '</div></div>' +
    flowHTML +
    '</div></section>'
  );
}
function reasonModal(title, label, cb) {
  const b = el(
    '<form novalidate><div class="form-grid">' +
      F({
        name: 'reason',
        label: label,
        type: 'textarea',
        req: true,
        span: 12,
        rows: 3,
        ph: 'Explain the decision for the requester'
      }) +
      '</div></form>'
  );
  openModal({
    type: 'warning',
    title,
    indent: false,
    body: b,
    actions: [
      { label: 'Cancel' },
      {
        label: 'Reject',
        variant: 'danger',
        onClick: () => {
          if (!validateForm(b)) return false;
          cb(formData(b).reason);
        }
      }
    ]
  });
}
