/* =========================================================================
   DRAWER
   openDrawer: a side panel for record details.

   Provides: openDrawer
   ========================================================================= */
'use strict';

function openDrawer(o) {
  const root = el(
    '<div class="drawer-root"><aside class="drawer" role="dialog" aria-modal="true" aria-label="' +
      esc(o.title) +
      '"><div class="drawer-head">' +
      (o.icon ? '<span class="doc-ico" style="width:36px;height:36px">' + icon(o.icon, 18) + '</span>' : '') +
      '<div style="flex:1;min-width:0"><h3>' +
      esc(o.title) +
      '</h3>' +
      (o.subtitle ? '<div class="muted" style="font-size:13px">' + o.subtitle + '</div>' : '') +
      '</div><button class="btn btn-ghost btn-sm btn-icon" aria-label="Close panel">' +
      icon('x', 16) +
      '</button></div><div class="drawer-body"></div>' +
      (o.actions ? '<div class="drawer-foot"></div>' : '') +
      '</aside></div>'
  );
  const body = $('.drawer-body', root);
  if (typeof o.body === 'string') body.innerHTML = o.body;
  else body.append(o.body);
  const api = {
    el: root,
    close() {
      root.remove();
      const i = modalStack.indexOf(api);
      if (i > -1) modalStack.splice(i, 1);
    }
  };
  (o.actions || []).forEach(a => {
    const b = el(
      '<button class="btn ' +
        (a.variant ? 'btn-' + a.variant : '') +
        '">' +
        (a.icon ? icon(a.icon, 16) : '') +
        esc(a.label) +
        '</button>'
    );
    b.onclick = () => {
      if ((a.onClick && a.onClick(api)) !== false) api.close();
    };
    $('.drawer-foot', root).append(b);
  });
  $('.drawer-head .btn', root).onclick = api.close;
  root.addEventListener('mousedown', e => {
    if (e.target === root) api.close();
  });
  document.body.append(root);
  modalStack.push(api);
  setTimeout(() => $('.drawer-head .btn', root).focus(), 20);
  return api;
}
