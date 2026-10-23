/* =========================================================================
   DATA TABLE
   DataTable: search, filters, sorting, paging, selection, bulk and row
   actions, CSV export.

   Provides: cv, DataTable, exportCSV
   ========================================================================= */
'use strict';

function cv(c, r) {
  return c.sortValue ? c.sortValue(r) : c.value ? c.value(r) : r[c.key];
}
function DataTable(o) {
  const st = {
    q: o.q || '',
    sort: o.sort || null,
    dir: o.dir || 1,
    page: 1,
    size: o.pageSize || 10,
    sel: new Set(),
    colF: {},
    showColF: false,
    fv: {},
    loading: o.loading !== false
  };
  (o.filters || []).forEach(f => (st.fv[f.key] = f.value || ''));
  const cols = o.columns;
  const rid = o.rowId || (r => r.id);
  const root = el('<div class="dt"></div>');
  const tb = [];
  if (o.search !== false)
    tb.push(
      '<div class="dt-search">' +
        icon('search', 16) +
        '<input class="input" type="search" data-dt="q" value="' +
        esc(st.q) +
        '" placeholder="' +
        esc(o.searchPlaceholder || 'Search') +
        '" aria-label="Search table"></div>'
    );
  (o.filters || []).forEach(f =>
    tb.push(
      '<select class="select" data-dt-f="' +
        f.key +
        '" aria-label="' +
        esc(f.label) +
        '">' +
        optionsHTML(f.options, st.fv[f.key], f.label) +
        '</select>'
    )
  );
  tb.push('<div class="spacer"></div>');
  if (o.toolbar) tb.push(o.toolbar);
  if (o.columnFilter !== false)
    tb.push(
      '<button class="btn btn-sm" data-dt="colf" aria-pressed="false" data-tip="Filter by column">' +
        icon('filter', 16) +
        '<span class="desktop-only">Columns</span></button>'
    );
  if (o.exportable !== false)
    tb.push(
      '<button class="btn btn-sm" data-dt="export">' + icon('export', 16) + '<span>Export</span></button>'
    );
  root.innerHTML =
    (o.noToolbar ? '' : '<div class="dt-toolbar">' + tb.join('') + '</div>') +
    '<div class="dt-bulk" aria-live="polite"><b></b>' +
    (o.bulkActions || [])
      .map(
        (b, i) =>
          '<button class="btn btn-sm ' +
          (b.danger ? 'btn-danger-ghost' : '') +
          '" data-dt="bulk" data-i="' +
          i +
          '">' +
          (b.icon ? icon(b.icon, 15) : '') +
          esc(b.label) +
          '</button>'
      )
      .join('') +
    '<button class="btn btn-sm btn-ghost" data-dt="clear">Clear selection</button></div>' +
    '<div class="table-wrap' +
    (o.auto ? ' auto' : '') +
    '"><table class="tbl' +
    (o.compact ? ' compact' : '') +
    '"><thead></thead><tbody></tbody>' +
    (o.footer ? '<tfoot></tfoot>' : '') +
    '</table></div>' +
    (o.paginate === false ? '' : '<div class="dt-foot"></div>');
  const thead = $('thead', root),
    tbody = $('tbody', root),
    tfoot = $('tfoot', root),
    foot = $('.dt-foot', root),
    bulk = $('.dt-bulk', root);
  const ncols = cols.length + (o.selectable ? 1 : 0) + (o.actions ? 1 : 0);
  function rows() {
    let rs = o.data().slice();
    if (st.q) {
      const q = st.q.toLowerCase();
      rs = rs.filter(r =>
        (o.searchText
          ? o.searchText(r)
          : cols
              .map(c => {
                const v = cv(c, r);
                return v instanceof Date ? fmtD(v) : v;
              })
              .join(' ')
        )
          .toLowerCase()
          .includes(q)
      );
    }
    (o.filters || []).forEach(f => {
      const v = st.fv[f.key];
      if (v) rs = rs.filter(r => f.test(r, v));
    });
    Object.keys(st.colF).forEach(k => {
      const v = st.colF[k];
      if (!v) return;
      const c = cols.find(c => c.key === k);
      const lv = v.toLowerCase();
      rs = rs.filter(r => {
        let x = c.filterValue ? c.filterValue(r) : cv(c, r);
        if (x instanceof Date) x = fmtD(x);
        return String(x == null ? '' : x)
          .toLowerCase()
          .includes(lv);
      });
    });
    if (st.sort) {
      const c = cols.find(c => c.key === st.sort);
      if (c)
        rs.sort((a, b) => {
          const x = cv(c, a),
            y = cv(c, b);
          if (x instanceof Date || y instanceof Date) return ((x || 0) - (y || 0)) * st.dir;
          if (typeof x === 'number' && typeof y === 'number') return (x - y) * st.dir;
          return (
            String(x == null ? '' : x).localeCompare(String(y == null ? '' : y), undefined, {
              numeric: true
            }) * st.dir
          );
        });
    }
    return rs;
  }
  function renderHead() {
    let h =
      '<tr>' +
      (o.selectable
        ? '<th class="cb"><input type="checkbox" data-dt="all" aria-label="Select all rows on this page"></th>'
        : '');
    cols.forEach(c => {
      const s = c.sort !== false;
      const on = st.sort === c.key;
      h +=
        '<th class="' +
        (s ? 'sortable ' : '') +
        (on ? 'sorted ' : '') +
        (c.align === 'right' ? 'right' : '') +
        '" ' +
        (s
          ? 'data-sort="' +
            c.key +
            '" tabindex="0" aria-sort="' +
            (on ? (st.dir > 0 ? 'ascending' : 'descending') : 'none') +
            '"'
          : '') +
        (c.width ? ' style="width:' + c.width + '"' : '') +
        '><span class="th">' +
        esc(c.label) +
        (s
          ? '<span class="sort-ico">' +
            icon(on ? (st.dir > 0 ? 'sortUp' : 'sortDown') : 'sort', 14) +
            '</span>'
          : '') +
        '</span></th>';
    });
    if (o.actions) h += '<th class="act"><span class="sr">Actions</span></th>';
    h += '</tr>';
    if (st.showColF) {
      h +=
        '<tr class="filter-row">' +
        (o.selectable ? '<th></th>' : '') +
        cols
          .map(
            c =>
              '<th>' +
              (c.filter === false
                ? ''
                : '<input class="input" data-colf="' +
                  c.key +
                  '" value="' +
                  esc(st.colF[c.key] || '') +
                  '" placeholder="Filter" aria-label="Filter ' +
                  esc(c.label) +
                  '">') +
              '</th>'
          )
          .join('') +
        (o.actions ? '<th></th>' : '') +
        '</tr>';
    }
    thead.innerHTML = h;
  }
  function pagesHTML(p, n) {
    const a = [];
    const add = x => a.push(x);
    if (n <= 7) {
      for (let i = 1; i <= n; i++) add(i);
    } else {
      add(1);
      if (p > 3) add('…');
      for (let i = Math.max(2, p - 1); i <= Math.min(n - 1, p + 1); i++) add(i);
      if (p < n - 2) add('…');
      add(n);
    }
    return a
      .map(x =>
        x === '…'
          ? '<span class="subtle" style="padding:0 4px">…</span>'
          : '<button data-dt="page" data-p="' +
            x +
            '" class="' +
            (x === p ? 'on' : '') +
            '" aria-label="Page ' +
            x +
            '"' +
            (x === p ? ' aria-current="page"' : '') +
            '>' +
            x +
            '</button>'
      )
      .join('');
  }
  function renderBody() {
    if (st.loading) {
      tbody.innerHTML = Array.from(
        { length: Math.min(st.size, 6) },
        () =>
          '<tr>' +
          Array.from(
            { length: ncols },
            (_, i) =>
              '<td><div class="skel" style="width:' +
              (i === 0 && o.selectable ? 16 : 40 + ((i * 37) % 50)) +
              '%"></div></td>'
          ).join('') +
          '</tr>'
      ).join('');
      if (foot) foot.innerHTML = '<span>Loading records…</span>';
      return;
    }
    const rs = rows();
    const total = rs.length;
    const pages = Math.max(1, Math.ceil(total / st.size));
    st.page = clamp(st.page, 1, pages);
    const view = o.paginate === false ? rs : rs.slice((st.page - 1) * st.size, st.page * st.size);
    if (!total) {
      const filtered = st.q || Object.values(st.fv).some(Boolean) || Object.values(st.colF).some(Boolean);
      tbody.innerHTML =
        '<tr><td colspan="' +
        ncols +
        '" style="padding:0"><div class="empty"><div class="empty-ico">' +
        icon(filtered ? 'search' : o.emptyIcon || 'inbox', 22) +
        '</div><h4>' +
        esc(filtered ? 'No matching records' : o.emptyTitle || 'No records yet') +
        '</h4><p>' +
        esc(
          filtered
            ? 'Try a different search term or clear the filters to see all records.'
            : o.emptyText || 'Records you create will appear here.'
        ) +
        '</p>' +
        (filtered
          ? '<button class="btn btn-sm" data-dt="reset">' + icon('refresh', 15) + 'Clear filters</button>'
          : o.emptyAction
            ? '<button class="btn btn-sm btn-primary" data-dt="emptyact">' +
              icon('plus', 15) +
              esc(o.emptyAction.label) +
              '</button>'
            : '') +
        '</div></td></tr>';
    } else
      tbody.innerHTML = view
        .map(r => {
          const id = rid(r);
          const sel = st.sel.has(id);
          return (
            '<tr data-id="' +
            esc(id) +
            '" class="' +
            (sel ? 'selected ' : '') +
            (o.onRowClick ? 'clickable ' : '') +
            (o.rowClass ? o.rowClass(r) : '') +
            '">' +
            (o.selectable
              ? '<td class="cb"><input type="checkbox" data-dt="row" aria-label="Select row"' +
                (sel ? ' checked' : '') +
                '></td>'
              : '') +
            cols
              .map(
                c =>
                  '<td class="' +
                  (c.align === 'right' ? 'right num ' : '') +
                  (c.nowrap !== false ? 'nowrap ' : '') +
                  (c.cls || '') +
                  '">' +
                  (c.render ? c.render(r) : esc(cv(c, r))) +
                  '</td>'
              )
              .join('') +
            (o.actions
              ? '<td class="act"><button class="btn btn-ghost btn-sm btn-icon" data-dt="menu" aria-label="Actions" aria-haspopup="menu">' +
                icon('more', 16) +
                '</button></td>'
              : '') +
            '</tr>'
          );
        })
        .join('');
    if (tfoot && o.footer) {
      const f = o.footer(rs);
      tfoot.innerHTML = total
        ? '<tr>' +
          (o.selectable ? '<td></td>' : '') +
          f
            .map(
              (x, i) =>
                '<td class="' + (cols[i] && cols[i].align === 'right' ? 'right num' : '') + '">' + x + '</td>'
            )
            .join('') +
          (o.actions ? '<td></td>' : '') +
          '</tr>'
        : '';
    }
    if (foot) {
      const a = total ? (st.page - 1) * st.size + 1 : 0,
        b = Math.min(total, st.page * st.size);
      foot.innerHTML =
        '<span>Showing <b class="num" style="color:var(--text)">' +
        a +
        '–' +
        b +
        '</b> of <b class="num" style="color:var(--text)">' +
        fmtN(total) +
        '</b></span><div class="row wrap"><label class="row" style="gap:6px"><span class="desktop-only">Rows</span><select class="select" data-dt="size" aria-label="Rows per page">' +
        optionsHTML([10, 25, 50, 100], st.size) +
        '</select></label><div class="pager"><button data-dt="prev" aria-label="Previous page"' +
        (st.page <= 1 ? ' disabled' : '') +
        '>' +
        icon('chevLeft', 16) +
        '</button>' +
        pagesHTML(st.page, pages) +
        '<button data-dt="next" aria-label="Next page"' +
        (st.page >= pages ? ' disabled' : '') +
        '>' +
        icon('chevRight', 16) +
        '</button></div></div>';
    }
    syncSel(view);
  }
  function syncSel(view) {
    view = view || [];
    const ids = $$('tbody tr[data-id]', root).map(t => t.dataset.id);
    const all = $('[data-dt=all]', root);
    if (all) {
      const n = ids.filter(i => st.sel.has(i)).length;
      all.checked = ids.length > 0 && n === ids.length;
      all.indeterminate = n > 0 && n < ids.length;
    }
    if (bulk) {
      bulk.classList.toggle('show', st.sel.size > 0);
      $('b', bulk).textContent = st.sel.size + ' selected';
    }
  }
  let t;
  root.addEventListener('input', e => {
    const q = e.target.closest('[data-dt=q]');
    if (q) {
      clearTimeout(t);
      t = setTimeout(() => {
        st.q = q.value;
        st.page = 1;
        renderBody();
      }, 120);
      return;
    }
    const cf = e.target.closest('[data-colf]');
    if (cf) {
      clearTimeout(t);
      t = setTimeout(() => {
        st.colF[cf.dataset.colf] = cf.value;
        st.page = 1;
        renderBody();
      }, 150);
    }
  });
  root.addEventListener('change', e => {
    const f = e.target.closest('[data-dt-f]');
    if (f) {
      st.fv[f.dataset.dtF] = f.value;
      st.page = 1;
      renderBody();
      return;
    }
    const a = e.target.closest('[data-dt]');
    if (!a) return;
    const k = a.dataset.dt;
    if (k === 'size') {
      st.size = +a.value;
      st.page = 1;
      renderBody();
    }
    if (k === 'all') {
      $$('tbody tr[data-id]', root).forEach(tr => {
        a.checked ? st.sel.add(tr.dataset.id) : st.sel.delete(tr.dataset.id);
        tr.classList.toggle('selected', a.checked);
        const c = $('[data-dt=row]', tr);
        if (c) c.checked = a.checked;
      });
      syncSel();
    }
    if (k === 'row') {
      const tr = a.closest('tr');
      a.checked ? st.sel.add(tr.dataset.id) : st.sel.delete(tr.dataset.id);
      tr.classList.toggle('selected', a.checked);
      syncSel();
    }
  });
  function sortBy(k) {
    if (st.sort === k) {
      if (st.dir === 1) st.dir = -1;
      else {
        st.sort = null;
        st.dir = 1;
      }
    } else {
      st.sort = k;
      st.dir = 1;
    }
    renderHead();
    renderBody();
  }
  root.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.closest('[data-dt=q],[data-colf]')) {
      e.preventDefault();
      return;
    }
    const th = e.target.closest('th[data-sort]');
    if (th && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      sortBy(th.dataset.sort);
      const n = $('th[data-sort="' + th.dataset.sort + '"]', root);
      if (n) n.focus();
    }
  });
  root.addEventListener('click', e => {
    const th = e.target.closest('th[data-sort]');
    if (th && !e.target.closest('input')) {
      sortBy(th.dataset.sort);
      return;
    }
    const a = e.target.closest('[data-dt]');
    if (a) {
      const k = a.dataset.dt;
      if (k === 'page') {
        st.page = +a.dataset.p;
        renderBody();
        return;
      }
      if (k === 'prev') {
        st.page--;
        renderBody();
        return;
      }
      if (k === 'next') {
        st.page++;
        renderBody();
        return;
      }
      if (k === 'colf') {
        st.showColF = !st.showColF;
        a.setAttribute('aria-pressed', st.showColF);
        a.classList.toggle('btn-soft', st.showColF);
        if (!st.showColF) {
          st.colF = {};
        }
        renderHead();
        renderBody();
        if (st.showColF) {
          const i = $('[data-colf]', root);
          if (i) i.focus();
        }
        return;
      }
      if (k === 'export') {
        exportCSV(
          o.title || 'records',
          cols.filter(c => c.export !== false),
          rows()
        );
        return;
      }
      if (k === 'clear') {
        st.sel.clear();
        renderBody();
        return;
      }
      if (k === 'reset') {
        st.q = '';
        st.colF = {};
        Object.keys(st.fv).forEach(x => (st.fv[x] = ''));
        $$('[data-dt-f]', root).forEach(s => (s.value = ''));
        const q = $('[data-dt=q]', root);
        if (q) q.value = '';
        renderHead();
        renderBody();
        return;
      }
      if (k === 'emptyact') {
        o.emptyAction.onClick();
        return;
      }
      if (k === 'bulk') {
        const b = o.bulkActions[+a.dataset.i];
        b.onClick([...st.sel], api);
        return;
      }
      if (k === 'menu') {
        const id = a.closest('tr').dataset.id;
        const r = o.data().find(x => String(rid(x)) === id);
        if (r) openMenu(a, o.actions(r));
        return;
      }
      return;
    }
    const tr = e.target.closest('tbody tr.clickable');
    if (tr && o.onRowClick && !e.target.closest('a,button,input,select,label')) {
      const r = o.data().find(x => String(rid(x)) === tr.dataset.id);
      if (r) o.onRowClick(r);
    }
  });
  const api = {
    el: root,
    state: st,
    refresh() {
      renderBody();
    },
    clearSelection() {
      st.sel.clear();
      renderBody();
    },
    selected: () => [...st.sel],
    rows
  };
  renderHead();
  renderBody();
  if (st.loading)
    setTimeout(() => {
      st.loading = false;
      renderBody();
    }, 260);
  return api;
}
function exportCSV(name, cols, rs) {
  const cell = v => {
    if (v instanceof Date) v = fmtD(v);
    v = String(v == null ? '' : v);
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  };
  const csv = [cols.map(c => cell(c.label))]
    .concat(rs.map(r => cols.map(c => cell(c.exportValue ? c.exportValue(r) : cv(c, r)))))
    .map(a => a.join(','))
    .join('\n');
  const file = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + isoDate(NOW()) + '.csv';
  openModal({
    type: 'view',
    icon: 'export',
    title: 'Export ' + name,
    subtitle: fmtN(rs.length) + ' rows · ' + cols.length + ' columns · CSV',
    size: 'lg',
    body:
      '<p class="muted" style="margin-bottom:10px">Review the export below, then copy it or download it as <span class="mono">' +
      esc(file) +
      '</span>.</p><textarea class="code-box" readonly aria-label="CSV preview">' +
      esc(csv) +
      '</textarea>',
    actions: [
      { label: 'Close' },
      {
        label: 'Copy to clipboard',
        icon: 'copy',
        onClick: api => {
          const ta = $('textarea', api.el);
          ta.select();
          let ok = false;
          try {
            if (navigator.clipboard) {
              navigator.clipboard.writeText(csv);
              ok = true;
            } else ok = document.execCommand('copy');
          } catch (e) {}
          toast(
            ok ? 'success' : 'warning',
            ok ? 'Copied to clipboard' : 'Select the text and copy it',
            ok ? fmtN(rs.length) + ' rows copied as CSV.' : ''
          );
          return false;
        }
      },
      {
        label: 'Download CSV',
        icon: 'export',
        variant: 'primary',
        onClick: () => {
          try {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
            a.download = file;
            document.body.append(a);
            a.click();
            a.remove();
            toast('success', 'Export ready', file + ' downloaded.');
          } catch (e) {
            toast('warning', 'Download unavailable', 'Copy the CSV instead.');
          }
        }
      }
    ]
  });
}
