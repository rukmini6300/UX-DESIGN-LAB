/* =========================================================================
   TOASTS
   toast(type, title, message, action) shows a dismissible notification.

   Provides: toast
   ========================================================================= */
'use strict';

function toast(type, title, msg, action) {
  const ic = { success: 'checkCircle', error: 'xCircle', warning: 'alert', info: 'info' }[type] || 'info';
  const t = el(
    '<div class="toast ' +
      type +
      '" role="status"><span class="t-ico">' +
      icon(ic, 20) +
      '</span><div style="flex:1;min-width:0"><b>' +
      esc(title) +
      '</b>' +
      (msg ? '<p>' + esc(msg) + '</p>' : '') +
      (action ? '<a class="link" href="#">' + esc(action.label) + '</a>' : '') +
      '</div><button class="btn btn-ghost btn-xs btn-icon" aria-label="Dismiss">' +
      icon('x', 14) +
      '</button></div>'
  );
  const kill = () => {
    t.classList.add('out');
    setTimeout(() => t.remove(), 200);
  };
  t.querySelector('button').onclick = kill;
  if (action)
    t.querySelector('.link').onclick = e => {
      e.preventDefault();
      kill();
      action.onClick();
    };
  $('#toasts').append(t);
  setTimeout(kill, type === 'error' ? 7000 : 4500);
}
