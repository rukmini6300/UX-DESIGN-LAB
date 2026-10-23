/* =========================================================================
   MENUS, TOOLTIPS AND TABS
   openMenu / closeMenu for dropdowns, the shared tooltip and delegated tab
   switching.

   Provides: menuEl, menuAnchor, closeMenu, openMenu, tabsHTML
   ========================================================================= */
'use strict';

let menuEl = null,
  menuAnchor = null;
function closeMenu() {
  if (menuEl) {
    menuEl.remove();
    menuEl = null;
  }
  if (menuAnchor) {
    menuAnchor.setAttribute('aria-expanded', 'false');
    menuAnchor = null;
  }
}
function openMenu(anchor, items, o) {
  o = o || {};
  if (menuAnchor === anchor) {
    closeMenu();
    return;
  }
  closeMenu();
  const m = el('<div class="menu ' + (o.cls || '') + '" role="menu"></div>');
  if (o.node) m.append(o.node);
  if (o.head) m.append(el(o.head));
  (items || []).forEach(it => {
    if (it === '-') {
      m.append(el('<div class="menu-sep" role="separator"></div>'));
      return;
    }
    const b = el(
      '<button class="menu-item' +
        (it.danger ? ' danger' : '') +
        '" role="menuitem"' +
        (it.disabled ? ' disabled' : '') +
        '>' +
        (it.icon ? icon(it.icon, 16) : '') +
        '<span>' +
        esc(it.label) +
        '</span>' +
        (it.kbd ? '<kbd class="kbd">' + it.kbd + '</kbd>' : '') +
        '</button>'
    );
    b.onclick = e => {
      e.stopPropagation();
      closeMenu();
      it.onClick && it.onClick();
    };
    m.append(b);
  });
  document.body.append(m);
  const r = anchor.getBoundingClientRect();
  const mw = m.offsetWidth,
    mh = m.offsetHeight;
  let left = o.align === 'left' ? r.left : r.right - mw;
  left = clamp(left, 8, innerWidth - mw - 8);
  let top = r.bottom + 6;
  if (top + mh > innerHeight - 8) top = Math.max(8, r.top - mh - 6);
  m.style.left = left + 'px';
  m.style.top = top + 'px';
  menuEl = m;
  menuAnchor = anchor;
  anchor.setAttribute('aria-expanded', 'true');
  const first = $('.menu-item', m);
  if (first && o.focus !== false) first.focus();
  m.addEventListener('keydown', e => {
    const its = $$('.menu-item:not(:disabled)', m);
    const i = its.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      (its[i + 1] || its[0]).focus();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      (its[i - 1] || its[its.length - 1]).focus();
    }
  });
  return m;
}
document.addEventListener('mousedown', e => {
  if (menuEl && !menuEl.contains(e.target) && !(menuAnchor && menuAnchor.contains(e.target))) closeMenu();
});
window.addEventListener('resize', closeMenu);

/* tooltip */
(function () {
  const tip = $('#tip');
  let cur = null;
  document.addEventListener('mouseover', e => {
    const t = e.target.closest('[data-tip]');
    if (!t) {
      if (cur) {
        tip.classList.remove('show');
        cur = null;
      }
      return;
    }
    if (t === cur) return;
    if (t.dataset.tipMode === 'collapsed' && !$('#app').classList.contains('collapsed')) {
      tip.classList.remove('show');
      cur = null;
      return;
    }
    cur = t;
    tip.textContent = t.dataset.tip;
    const r = t.getBoundingClientRect();
    if (t.dataset.tipMode === 'collapsed') {
      tip.style.left = r.right + 10 + 'px';
      tip.style.top = r.top + r.height / 2 - 13 + 'px';
    } else {
      tip.style.left =
        clamp(r.left + r.width / 2 - tip.offsetWidth / 2, 8, innerWidth - tip.offsetWidth - 8) + 'px';
      tip.style.top = r.bottom + 6 + 'px';
    }
    tip.classList.add('show');
  });
  document.addEventListener('scroll', () => tip.classList.remove('show'), true);
})();

/* tabs (delegated) */
document.addEventListener('click', e => {
  const t = e.target.closest('.tab[data-tab]');
  if (!t) return;
  const root = t.closest('[data-tabs]');
  if (!root) return;
  $$('.tab[data-tab]', root).forEach(x => {
    if (x.closest('[data-tabs]') === root) {
      x.classList.toggle('active', x === t);
      x.setAttribute('aria-selected', x === t);
    }
  });
  $$('.tab-panel', root).forEach(p => {
    if (p.closest('[data-tabs]') === root) p.classList.toggle('active', p.dataset.panel === t.dataset.tab);
  });
  root.dispatchEvent(new CustomEvent('tabchange', { detail: t.dataset.tab }));
});
function tabsHTML(list, active) {
  return (
    '<div class="tabs" role="tablist">' +
    list
      .map(t => {
        const [k, l, c] = Array.isArray(t) ? t : [t, t];
        return (
          '<button class="tab' +
          (k === active ? ' active' : '') +
          '" role="tab" aria-selected="' +
          (k === active) +
          '" data-tab="' +
          k +
          '">' +
          esc(l) +
          (c != null ? '<span class="count">' + c + '</span>' : '') +
          '</button>'
        );
      })
      .join('') +
    '</div>'
  );
}
