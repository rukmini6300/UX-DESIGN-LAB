/* =========================================================================
   HEADER
   Notifications, global search, account menu, help, sign out and keyboard
   shortcuts.

   Provides: renderNotifBadge, relTime, initHeader, showHelp, logout
   ========================================================================= */
'use strict';

function renderNotifBadge() {
  const n = notifList().filter(x => x.unread).length;
  $('#notifBtn').innerHTML = icon('bell', 19) + (n ? '<span class="dot-count">' + n + '</span>' : '');
}
function relTime(d) {
  const m = Math.round((NOW() - toD(d)) / 6e4);
  if (m < 1) return 'Just now';
  if (m < 60) return m + ' min ago';
  const h = Math.round(m / 60);
  if (h < 24) return h + ' h ago';
  const dd = Math.round(h / 24);
  return dd === 1 ? 'Yesterday' : dd < 30 ? dd + ' days ago' : fmtD(d);
}
function initHeader() {
  $('#mobileMenuBtn').innerHTML = icon('menu', 20);
  $('#hdrSearchIco').innerHTML = icon('search', 16);
  $('#mobileSearchBtn').innerHTML = icon('search', 19);
  $('#quickCreateBtn').innerHTML = icon('plus', 16) + '<span>Create</span>' + icon('chevDown', 14);
  $('#helpBtn').innerHTML = icon('help', 19);
  $('#helpBtn').dataset.tip = 'Help and shortcuts';
  $('#userCaret').innerHTML = icon('chevDown', 14);
  $('#notifBtn').dataset.tip = 'Notifications';
  renderNotifBadge();
  paintThemeBtn(document.documentElement.getAttribute('data-theme') || 'light');
  $('#appearanceBtn').innerHTML = icon('settings', 19);
  $('#appearanceBtn').dataset.tip = 'Appearance';
  $('#appearanceBtn').onclick = openAppearance;
  $('#mobileMenuBtn').onclick = () => setMobileNav(!$('#app').classList.contains('mobile-open'));
  $('#overlay').onclick = () => setMobileNav(false);
  $('#collapseBtn').onclick = () => setCollapsed(!$('#app').classList.contains('collapsed'));
  $('#themeBtn').onclick = toggleTheme;
  $('#helpBtn').onclick = showHelp;
  $('#quickCreateBtn').onclick = e => {
    if (invOn()) openMenu(e.currentTarget, invMod.quickCreate());
  };
  $('#userBtn').onclick = e =>
    openMenu(
      e.currentTarget,
      [
        ...(invOn() ? [{ label: 'My Profile', icon: 'user', onClick: () => navigate('profile') }] : []),
        ...(KG_EXPORT
          ? []
          : [{ label: 'Appearance settings', icon: 'sliders', onClick: () => navigate('settings') }]),
        ...(invOn()
          ? [{ label: 'Activity Log', icon: 'activity', onClick: () => navigate('audit?user=Alex%20Morgan') }]
          : []),
        '-',
        ...(KG_EXPORT ? [] : [{ label: 'Appearance', icon: 'palette', onClick: openAppearance }]),
        {
          label:
            document.documentElement.getAttribute('data-theme') === 'dark' ? 'Light theme' : 'Dark theme',
          icon: document.documentElement.getAttribute('data-theme') === 'dark' ? 'sun' : 'moon',
          onClick: toggleTheme
        },
        { label: 'Logout', icon: 'logout', danger: true, onClick: logout }
      ],
      {
        head:
          '<div class="menu-head"><span class="avatar">AM</span><div><b>Alex Morgan</b><small>' +
          esc(CURRENT_USER.email) +
          '</small></div></div><div class="menu-sep"></div>'
      }
    );
  $('#notifBtn').onclick = e => {
    const node = el(
      '<div><div class="notif-head"><b>Notifications</b><button class="btn btn-ghost btn-xs" data-markall>Mark all as read</button></div><div class="notif-list">' +
        (notifList().length
          ? ''
          : '<p class="muted" style="padding:16px">No notifications. Turn on the inventory workflow to see stock alerts.</p>') +
        notifList()
          .map(
            n =>
              '<button class="notif-item' +
              (n.unread ? ' unread' : '') +
              '" data-n="' +
              n.id +
              '"><span class="tl-dot t-' +
              n.type +
              '">' +
              icon(n.icon, 16) +
              '</span><span><p>' +
              esc(n.text) +
              '</p><small>' +
              relTime(n.time) +
              '</small></span></button>'
          )
          .join('') +
        '</div>' +
        (invOn()
          ? '<div class="notif-foot"><a class="link" href="#/audit">View activity log</a></div>'
          : '') +
        '</div>'
    );
    node.addEventListener('click', ev => {
      if (ev.target.closest('[data-markall]')) {
        notifList().forEach(n => (n.unread = false));
        renderNotifBadge();
        $$('.notif-item', node).forEach(x => x.classList.remove('unread'));
        return;
      }
      const it = ev.target.closest('[data-n]');
      if (it) {
        const n = notifList().find(x => x.id == it.dataset.n);
        n.unread = false;
        renderNotifBadge();
        closeMenu();
        navigate(n.route);
      }
      if (ev.target.closest('a')) closeMenu();
    });
    openMenu(e.currentTarget, [], { node, cls: 'notif', focus: false });
  };
  // global search
  const inp = $('#globalSearch'),
    pop = $('#searchPop');
  let act = -1;
  const run = () => {
    const q = inp.value.trim().toLowerCase();
    act = -1;
    if (!q) {
      pop.classList.remove('open');
      return;
    }
    const res = [];
    const add = (group, items) => {
      if (items.length) res.push([group, items.slice(0, 5)]);
    };
    if (invOn()) invMod.search(q).forEach(([g, items]) => add(g, items));
    if (!KG_EXPORT)
      add(
        'Components',
        COMP_GROUPS.reduce((a, g) => a.concat(g.items), [])
          .filter(c => (c.n + ' ' + c.group).toLowerCase().includes(q))
          .map(c => ({
            icon: 'palette',
            label: c.n,
            sub: 'Component · ' + c.group,
            route: 'components/' + c.s
          }))
      );
    const pages = [];
    pageIndex().forEach(r => {
      if (r[0].toLowerCase().includes(q))
        pages.push({ icon: 'arrowRight', label: r[0], sub: 'Go to page', route: r[1] });
    });
    add('Pages', pages);
    pop.innerHTML = res.length
      ? res
          .map(
            ([g, items]) =>
              '<div class="sr-group">' +
              g +
              '</div>' +
              items
                .map(
                  i =>
                    '<button class="sr-item" role="option" data-route="' +
                    esc(i.route) +
                    '">' +
                    icon(i.icon, 16) +
                    '<span>' +
                    esc(i.label) +
                    '</span><small>' +
                    esc(i.sub) +
                    '</small></button>'
                )
                .join('')
          )
          .join('')
      : '<div class="sr-empty">No results for “' +
        esc(inp.value) +
        '”. Try a SKU, product name or document number.</div>';
    pop.classList.add('open');
  };
  inp.addEventListener('input', run);
  inp.addEventListener('focus', run);
  inp.addEventListener('keydown', e => {
    const its = $$('.sr-item', pop);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!its.length) return;
      act = e.key === 'ArrowDown' ? (act + 1) % its.length : (act - 1 + its.length) % its.length;
      its.forEach((x, i) => x.classList.toggle('active', i === act));
      its[act].scrollIntoView({ block: 'nearest' });
    }
    if (e.key === 'Enter') {
      const t = its[act] || its[0];
      if (t) {
        navigate(t.dataset.route);
        inp.value = '';
        pop.classList.remove('open');
        inp.blur();
      }
    }
    if (e.key === 'Escape') {
      inp.value = '';
      pop.classList.remove('open');
      inp.blur();
    }
  });
  pop.addEventListener('mousedown', e => {
    const t = e.target.closest('.sr-item');
    if (t) {
      e.preventDefault();
      navigate(t.dataset.route);
      inp.value = '';
      pop.classList.remove('open');
      inp.blur();
    }
  });
  inp.addEventListener('blur', () =>
    setTimeout(() => {
      pop.classList.remove('open');
      $('#hdrSearch').classList.remove('mobile-open');
    }, 120)
  );
  $('#mobileSearchBtn').onclick = () => {
    $('#hdrSearch').classList.add('mobile-open');
    inp.focus();
  };
}
function showHelp() {
  openModal({
    type: 'info',
    icon: 'keyboard',
    title: 'Help and keyboard shortcuts',
    subtitle: 'Move around Kagami ERP faster',
    indent: false,
    size: 'md',
    body: '<div class="kb-list"><span>Search components, pages and inventory records</span><span><kbd class="kbd">/</kbd></span><span>Collapse or expand the sidebar</span><span><kbd class="kbd">[</kbd></span><span>Switch light and dark theme</span><span><kbd class="kbd">Shift</kbd><kbd class="kbd">T</kbd></span><span>Open this help panel</span><span><kbd class="kbd">Shift</kbd><kbd class="kbd">?</kbd></span><span>Close dialogs, panels and menus</span><span><kbd class="kbd">Esc</kbd></span><span>Sort a focused table column</span><span><kbd class="kbd">Enter</kbd></span></div><div class="callout mt-16">Need a hand with a stock discrepancy? Contact the inventory control team at <b>inventory.control@kagami-erp.com</b> or extension 4410.</div>',
    actions: [{ label: 'Close', variant: 'primary' }]
  });
}
function logout() {
  confirmDialog({
    title: 'Sign out of Kagami ERP?',
    message: 'Unsaved changes on open forms will be lost.',
    confirm: 'Sign out'
  }).then(ok => {
    if (!ok) return;
    auditLog('Security', 'Logout', 'Alex Morgan', '—', 'Signed out');
    const s = el(
      '<div class="signout"><div class="card"><div class="empty-ico">' +
        icon('lock', 22) +
        '</div><h2 style="font-size:18px;font-weight:650">You’re signed out</h2><p class="muted">Your session for Kagami ERP has ended.</p><button class="btn btn-primary mt-8">Sign in again</button></div></div>'
    );
    $('button', s).onclick = () => {
      s.remove();
      auditLog('Security', 'Login', 'Alex Morgan', '—', 'Signed in');
      toast('success', 'Welcome back, Alex', 'You’re signed in to Kagami ERP.');
    };
    document.body.append(s);
    $('button', s).focus();
  });
}

/* keyboard */
document.addEventListener('keydown', e => {
  const typing =
    /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
  if (e.key === 'Escape') {
    if (menuEl) {
      closeMenu();
      return;
    }
    if (modalStack.length) {
      modalStack[modalStack.length - 1].close();
      return;
    }
    if ($('#app').classList.contains('mobile-open')) setMobileNav(false);
  }
  if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === '/') {
    e.preventDefault();
    if (innerWidth < 768) $('#hdrSearch').classList.add('mobile-open');
    $('#globalSearch').focus();
  } else if (e.key === '[') {
    setCollapsed(!$('#app').classList.contains('collapsed'));
  } else if (e.key === 'T') {
    toggleTheme();
  } else if (e.key === '?') {
    showHelp();
  }
});
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]');
  if (g) {
    e.preventDefault();
    navigate(g.dataset.go);
  }
});
