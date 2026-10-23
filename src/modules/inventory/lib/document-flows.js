/* =========================================================================
   DOCUMENT FLOWS
   Step lists and timelines for transfers, adjustments, receipts and
   issues.

   Provides: FLOWS, flowFor, histMeta, timelineHTML
   ========================================================================= */
'use strict';

const FLOWS = {
  transfer: {
    steps: ['Draft', 'Submitted', 'Approved', 'In Transit', 'Received', 'Completed'],
    idx: s =>
      ({
        Draft: 0,
        Submitted: 1,
        Approved: 2,
        'In Transit': 3,
        Received: 4,
        Completed: 6,
        Rejected: 1,
        Cancelled: 0
      })[s],
    err: s => (s === 'Rejected' ? 2 : s === 'Cancelled' ? 0 : null)
  },
  adjustment: {
    steps: ['Draft', 'Submitted', 'Approval', 'Posted'],
    idx: s => ({ Draft: 0, Submitted: 2, Approved: 3, Posted: 4, Rejected: 2, Cancelled: 0 })[s],
    err: s => (s === 'Rejected' ? 2 : s === 'Cancelled' ? 0 : null)
  },
  grn: {
    steps: ['Purchase Order', 'Goods Receipt', 'Quality Check', 'Accepted', 'Putaway', 'Available Stock'],
    idx: s => ({ Draft: 1, 'Pending QC': 2, Accepted: 4, Completed: 6, Rejected: 2, Cancelled: 1 })[s],
    err: s => (s === 'Rejected' ? 2 : s === 'Cancelled' ? 1 : null)
  },
  issue: {
    steps: ['Request', 'Approval', 'Pick', 'Issue', 'Stock Deduction'],
    idx: s => ({ Requested: 1, Approved: 2, Picked: 3, Issued: 5, Rejected: 1, Cancelled: 1 })[s],
    err: s => (s === 'Rejected' || s === 'Cancelled' ? 1 : null)
  }
};
function flowFor(kind, status, meta) {
  const f = FLOWS[kind];
  return stepperHTML(f.steps, f.idx(status), { error: f.err(status), meta });
}
function histMeta(doc, kind) {
  const map = {
    transfer: { Draft: 0, Submitted: 1, Approved: 2, 'In Transit': 3, Received: 4, Completed: 5 },
    adjustment: { Draft: 0, Submitted: 1, Approved: 2, Posted: 3 },
    grn: { Draft: 1, 'Pending QC': 2, Accepted: 3, Completed: 5 },
    issue: { Requested: 0, Approved: 1, Picked: 2, Issued: 4 }
  }[kind];
  const m = [];
  (doc.history || []).forEach(h => {
    if (map[h.status] != null) m[map[h.status]] = fmtD(h.date);
  });
  if (kind === 'grn' && doc.status === 'Completed') m[4] = m[5];
  if (kind === 'issue' && doc.status === 'Issued') m[3] = m[4];
  return m;
}
function timelineHTML(history) {
  if (!history || !history.length) return '<p class="muted">No activity recorded.</p>';
  return (
    '<div class="timeline">' +
    history
      .slice()
      .reverse()
      .map(h => {
        const t = TONE[h.status];
        const cls =
          t === 'success'
            ? 't-success'
            : t === 'danger'
              ? 't-danger'
              : t === 'warning'
                ? 't-warning'
                : 't-primary';
        return (
          '<div class="tl-item"><span class="tl-dot ' +
          cls +
          '">' +
          icon(t === 'danger' ? 'x' : t === 'success' ? 'check' : 'clock', 13) +
          '</span><div class="tl-body"><b>' +
          esc(h.status) +
          '</b> by ' +
          esc(h.user) +
          (h.note ? '<div class="muted">' + esc(h.note) + '</div>' : '') +
          '<small>' +
          fmtDT(h.date) +
          '</small></div></div>'
        );
      })
      .join('') +
    '</div>'
  );
}
