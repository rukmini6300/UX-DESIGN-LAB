/* =========================================================================
   MODALS
   openModal, confirmDialog and messageModal with a stack, focus handling
   and Esc to close.

   Provides: modalStack, openModal, confirmDialog, messageModal
   ========================================================================= */
'use strict';

const modalStack = [];
function openModal(o) {
  const type = o.type || 'info';
  const ico = {
    confirm: 'help',
    create: 'plus',
    edit: 'edit',
    view: 'eye',
    warning: 'alert',
    success: 'checkCircle',
    error: 'xCircle',
    info: 'info',
    danger: 'trash'
  }[type];
  const msgType =
    ['confirm', 'warning', 'success', 'error', 'info', 'danger'].includes(type) && o.indent !== false;
  const mid = uid('m');
  const root = el(
    '<div class="modal-root" role="presentation"><div class="modal ' +
      (o.size || 'md') +
      (msgType ? ' has-ico' : '') +
      '" role="dialog" aria-modal="true" aria-labelledby="' +
      mid +
      '"><div class="modal-head"><span class="modal-ico mi-' +
      type +
      '">' +
      icon(o.icon || ico, 20) +
      '</span><div style="min-width:0;padding-top:' +
      (o.subtitle ? '0' : '9px') +
      '"><h2 class="modal-title" id="' +
      mid +
      '">' +
      esc(o.title) +
      '</h2>' +
      (o.subtitle ? '<div class="modal-subtitle">' + o.subtitle + '</div>' : '') +
      '</div><button class="btn btn-ghost btn-sm btn-icon modal-x" aria-label="Close dialog">' +
      icon('x', 16) +
      '</button></div><div class="modal-body"></div>' +
      (o.actions && o.actions.length ? '<div class="modal-foot"></div>' : '') +
      '</div></div>'
  );
  const body = $('.modal-body', root);
  if (typeof o.body === 'string') body.innerHTML = o.body;
  else if (o.body) body.append(o.body);
  let closed = false;
  const api = {
    el: root,
    body,
    close() {
      if (closed) return;
      closed = true;
      root.remove();
      const i = modalStack.indexOf(api);
      if (i > -1) modalStack.splice(i, 1);
      if (o.onClose) o.onClose();
      if (prevFocus && prevFocus.focus) prevFocus.focus();
    }
  };
  const prevFocus = document.activeElement;
  const foot = $('.modal-foot', root);
  (o.actions || []).forEach(a => {
    if (a.spacer) {
      foot.append(el('<div class="spacer"></div>'));
      return;
    }
    const b = el(
      '<button class="btn ' +
        (a.variant ? 'btn-' + a.variant : '') +
        '">' +
        (a.icon ? icon(a.icon, 16) : '') +
        '<span>' +
        esc(a.label) +
        '</span></button>'
    );
    b.onclick = () => {
      const r = a.onClick ? a.onClick(api) : undefined;
      if (r !== false) api.close();
    };
    foot.append(b);
  });
  $('.modal-x', root).onclick = () => api.close();
  root.addEventListener('mousedown', e => {
    if (e.target === root && o.dismissable !== false) api.close();
  });
  document.body.append(root);
  modalStack.push(api);
  if (o.onOpen) o.onOpen(api);
  setTimeout(() => {
    const f =
      $('input:not([type=hidden]):not([readonly]),select,textarea', body) ||
      $('.modal-foot .btn:last-child', root);
    if (f) f.focus();
  }, 30);
  return api;
}
function confirmDialog(o) {
  return new Promise(res => {
    let done = false;
    const fin = v => {
      if (!done) {
        done = true;
        res(v);
      }
    };
    openModal({
      type: o.type || (o.danger ? 'danger' : 'confirm'),
      title: o.title,
      size: 'sm',
      body: '<p>' + o.message + '</p>' + (o.note ? '<div class="callout">' + o.note + '</div>' : ''),
      onClose: () => fin(false),
      actions: [
        { label: o.cancel || 'Cancel', onClick: () => fin(false) },
        { label: o.confirm || 'Confirm', variant: o.danger ? 'danger' : 'primary', onClick: () => fin(true) }
      ]
    });
  });
}
function messageModal(type, title, html, actions) {
  return openModal({
    type,
    title,
    size: 'sm',
    body: html,
    actions: actions || [{ label: 'Close', variant: type === 'error' || type === 'warning' ? '' : 'primary' }]
  });
}
