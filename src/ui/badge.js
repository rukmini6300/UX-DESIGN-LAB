/* =========================================================================
   STATUS BADGE
   Maps document and stock statuses to badge tones; badge(status) returns
   the markup.

   Provides: TONE, badge
   ========================================================================= */
'use strict';

const TONE = {
  Active: 'success',
  Inactive: 'neutral',
  Draft: 'neutral',
  Submitted: 'info',
  'Pending QC': 'warning',
  Accepted: 'info',
  Completed: 'success',
  Posted: 'success',
  Approved: 'info',
  'In Transit': 'purple',
  Received: 'success',
  Rejected: 'danger',
  Cancelled: 'neutral',
  Requested: 'warning',
  Picked: 'purple',
  Issued: 'success',
  Open: 'info',
  'Partially Received': 'warning',
  Shipped: 'success',
  Healthy: 'success',
  'Low Stock': 'warning',
  Critical: 'orange',
  'Out of Stock': 'solid-danger',
  Overstock: 'purple',
  'In Progress': 'info',
  Expired: 'solid-danger',
  'Expiring Soon': 'orange',
  'Within 90 Days': 'warning',
  Good: 'success',
  Urgent: 'danger',
  High: 'orange',
  Normal: 'neutral',
  Low: 'neutral',
  Created: 'success',
  Updated: 'info',
  Deleted: 'danger',
  Login: 'neutral'
};
function badge(s, tone) {
  const t = tone || TONE[s] || 'neutral';
  return '<span class="badge ' + (t === 'neutral' ? '' : 'b-' + t) + '">' + esc(s) + '</span>';
}
