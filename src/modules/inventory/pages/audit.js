/* =========================================================================
   AUDIT LOG
   Every create, update and delete with before and after values.

   Provides: #/audit
   ========================================================================= */
'use strict';

ROUTES.audit = (p, q) => ({
  title: 'Audit Log',
  crumbs: [['Inventory', 'inventory'], ['Audit Log']],
  sub: 'Every create, update and delete across inventory, with before and after values. Entries are retained for 7 years.',
  body: '<section class="card" id="auT"></section>',
  mount(page) {
    mountTable(page, '#auT', {
      title: 'Audit log',
      pageSize: 25,
      q: q.q || '',
      columns: [
        {
          key: 'date',
          label: 'Date & Time',
          render: a => '<span class="nowrap">' + fmtDT(a.date) + '</span>',
          exportValue: a => fmtDT(a.date)
        },
        { key: 'user', label: 'User', render: a => userCell(a.user) },
        { key: 'module', label: 'Module' },
        { key: 'action', label: 'Action', render: a => badge(a.action) },
        { key: 'record', label: 'Record', render: a => '<span class="mono">' + esc(a.record) + '</span>' },
        {
          key: 'oldV',
          label: 'Old Value',
          nowrap: false,
          render: a =>
            a.oldV === '—'
              ? '<span class="subtle">—</span>'
              : '<span class="change"><del>' + esc(a.oldV) + '</del></span>'
        },
        {
          key: 'newV',
          label: 'New Value',
          nowrap: false,
          render: a =>
            a.newV === '—'
              ? '<span class="subtle">—</span>'
              : '<span class="change"><ins>' + esc(a.newV) + '</ins></span>'
        },
        { key: 'ip', label: 'IP Address', render: a => '<span class="mono muted">' + esc(a.ip) + '</span>' }
      ],
      data: () => audit,
      rowId: a => a.id,
      filters: [
        {
          key: 'm',
          label: 'All modules',
          options: [...new Set(audit.map(a => a.module))].sort(),
          test: (a, v) => a.module === v
        },
        {
          key: 'a',
          label: 'All actions',
          options: ['Created', 'Updated', 'Deleted', 'Login', 'Logout'],
          test: (a, v) => a.action === v
        },
        {
          key: 'u',
          label: 'All users',
          value: q.user || '',
          options: [...new Set(audit.map(a => a.user))].sort(),
          test: (a, v) => a.user === v
        },
        {
          key: 'd',
          label: 'Any time',
          options: [
            ['1', 'Today'],
            ['7', 'Last 7 days'],
            ['30', 'Last 30 days']
          ],
          test: (a, v) => daysBetween(a.date, NOW()) < +v
        }
      ],
      emptyTitle: 'No audit entries',
      emptyText: 'Changes to inventory records are recorded here.'
    });
  }
});
TONE.Logout = 'neutral';
