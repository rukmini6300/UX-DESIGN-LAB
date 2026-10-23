/* =========================================================================
   NAVIGATION
   Menu model (NAV), sidebar and top/bottom bar rendering, collapse and
   navigation position.

   Provides: NAV, openGroups, groupHas, navFirst, navFlat, renderSidebar,
   setMobileNav, setCollapsed, navMode, isHNav, applyNavCollapse,
   setNavMode, findNavGroup, renderHNav
   ========================================================================= */
'use strict';

const NAV = [
  {
    label: 'Components',
    icon: 'palette',
    id: 'g-comp',
    children: [
      ['All components', 'components'],
      {
        label: 'Actions',
        id: 'g-comp-actions',
        children: [
          ['Buttons', 'components/buttons'],
          ['Command Bar', 'components/command-bar']
        ]
      },
      {
        label: 'Forms',
        id: 'g-comp-forms',
        children: [
          ['Inputs', 'components/inputs'],
          ['Forms', 'components/forms'],
          ['Dropdown', 'components/dropdowns'],
          ['Date Picker', 'components/date-picker'],
          ['Time Picker', 'components/time-picker'],
          ['File Upload', 'components/upload'],
          ['Search', 'components/search'],
          ['Filters', 'components/filters'],
          ['Wizard', 'components/wizard'],
          ['Rich Text Editor', 'components/rich-text-editor'],
          ['Checkbox', 'components/checkbox'],
          ['Radio', 'components/radio'],
          ['Switch', 'components/switch'],
          ['Slider', 'components/slider'],
          ['Color Picker', 'components/color-picker']
        ]
      },
      {
        label: 'Navigation',
        id: 'g-comp-navigation',
        children: [
          ['Stepper', 'components/steppers'],
          ['Tabs', 'components/tabs'],
          ['Pagination', 'components/pagination'],
          ['Breadcrumb', 'components/breadcrumbs'],
          ['Menu', 'components/menus'],
          ['Tree View', 'components/tree-view'],
          ['Nav Bar', 'components/nav-bar'],
          ['Sidebar', 'components/sidebar']
        ]
      },
      {
        label: 'Data Display',
        id: 'g-comp-data-display',
        children: [
          ['Accordion', 'components/accordions'],
          ['Cards', 'components/cards'],
          ['Tables', 'components/tables'],
          ['Data Grid', 'components/data-grid'],
          ['Badge', 'components/badges'],
          ['Chips', 'components/chips'],
          ['Calendar', 'components/calendar'],
          ['Timeline', 'components/timeline'],
          ['Kanban', 'components/kanban'],
          ['Avatar', 'components/avatars'],
          ['Charts', 'components/charts'],
          ['List', 'components/list'],
          ['Statistic', 'components/statistic']
        ]
      },
      {
        label: 'Feedback',
        id: 'g-comp-feedback',
        children: [
          ['Alerts', 'components/alerts'],
          ['Progress', 'components/progress'],
          ['Empty State', 'components/empty-states'],
          ['Notifications', 'components/notifications'],
          ['Banner', 'components/banner'],
          ['Spinner', 'components/spinner'],
          ['Skeleton', 'components/skeleton']
        ]
      },
      {
        label: 'Overlays',
        id: 'g-comp-overlays',
        children: [
          ['Modal', 'components/modals'],
          ['Drawer', 'components/drawers'],
          ['Popover', 'components/popovers'],
          ['Tooltip', 'components/tooltips'],
          ['Command Palette', 'components/command-palette']
        ]
      },
      {
        label: 'Layout',
        id: 'g-comp-layout',
        children: [
          ['Divider', 'components/divider'],
          ['Toolbar', 'components/toolbar'],
          ['Page Header', 'components/page-header'],
          ['Split Pane', 'components/split-pane']
        ]
      }
    ]
  },
  { label: 'Design builder', icon: 'sliders', route: 'design' },
  { label: 'Settings', icon: 'settings', route: 'settings' }
];
const openGroups = new Set();
let invSectionOpen = true;
let activeNav = '';
function groupHas(g, r) {
  return (
    g.children && g.children.some(c => (Array.isArray(c) ? c[1] === r : c.route === r || groupHas(c, r)))
  );
}
function navFirst(g) {
  const c = g.children[0];
  return Array.isArray(c) ? c[1] : navFirst(c);
}
function navFlat(g) {
  let o = [];
  g.children.forEach(c => {
    if (Array.isArray(c))
      o.push({ label: c[0], icon: activeNav === c[1] ? 'check' : null, onClick: () => navigate(c[1]) });
    else {
      o.push('-');
      o.push({ label: c.label.toUpperCase(), disabled: true });
      o = o.concat(navFlat(c));
    }
  });
  return o;
}
function renderSidebar() {
  if (isHNav()) {
    renderHNav();
    return;
  }
  const sb = $('#sidebar');
  const leaf = (it, lvl) => {
    const on = activeNav === it.route;
    return (
      '<a class="nav-item' +
      (on ? ' active' : '') +
      '" href="#/' +
      it.route +
      '"' +
      (on ? ' aria-current="page"' : '') +
      ' data-tip="' +
      esc(it.label) +
      '" data-tip-mode="collapsed">' +
      (it.icon ? icon(it.icon, 18) : '') +
      '<span class="nav-label">' +
      esc(it.label) +
      '</span></a>'
    );
  };
  const group = g => {
    const has = groupHas(g, activeNav);
    if (has) openGroups.add(g.id);
    const open = openGroups.has(g.id);
    return (
      '<div class="nav-group' +
      (open ? ' open' : '') +
      (has ? ' has-active' : '') +
      '" data-group="' +
      g.id +
      '"><button class="nav-item" data-toggle-group="' +
      g.id +
      '" data-first="' +
      navFirst(g) +
      '" aria-expanded="' +
      open +
      '" data-tip="' +
      esc(g.label) +
      '" data-tip-mode="collapsed">' +
      (g.icon ? icon(g.icon, 18) : '') +
      '<span class="nav-label">' +
      esc(g.label) +
      '</span><span class="nav-caret">' +
      icon('chevRight', 14) +
      '</span></button><div class="nav-children nav-sub">' +
      g.children
        .map(c => {
          if (!Array.isArray(c)) return group(c);
          const on = activeNav === c[1];
          return (
            '<a class="nav-item' +
            (on ? ' active' : '') +
            '" href="#/' +
            c[1] +
            '"' +
            (on ? ' aria-current="page"' : '') +
            '><span class="nav-label">' +
            esc(c[0]) +
            '</span></a>'
          );
        })
        .join('') +
      '</div></div>'
    );
  };
  let h = '';
  navList().forEach(it => {
    if (it.sep) {
      h += '<div class="nav-sep"></div>';
      return;
    }
    if (it.section) {
      const inSec = groupHas(it, activeNav) || it.children.some(c => c.route === activeNav);
      h +=
        '<div class="nav-section' +
        (inSec ? ' in-section' : '') +
        (invSectionOpen ? '' : ' collapsed-sec') +
        '"><button class="nav-item nav-section-head" data-toggle-section aria-expanded="' +
        invSectionOpen +
        '">' +
        icon(it.icon, 18) +
        '<span class="nav-label">' +
        esc(it.label) +
        '</span><span class="nav-caret">' +
        icon('chevRight', 14) +
        '</span></button><div class="nav-children">' +
        it.children.map(c => (c.children ? group(c) : leaf(c))).join('') +
        '</div></div>';
      return;
    }
    h += it.children ? group(it) : leaf(it);
  });
  h += invOn()
    ? invMod.sidebarFoot()
    : '<div class="sb-foot"><div class="sb-card"><b>Inventory workflow</b>Add products, warehouses, stock movements, receipts, issues and reports to this design system.<button class="btn btn-sm btn-primary mt-8" type="button" data-inv-on>Turn on</button></div></div>';
  sb.innerHTML = h;
}
$('#sidebar').addEventListener('click', e => {
  const hm = e.target.closest('[data-hmenu]');
  if (hm) {
    const g = findNavGroup(navList(), hm.dataset.hmenu);
    if (g) openMenu(hm, navFlat(g), { align: 'left', cls: g.id === 'g-comp' ? 'menu-tall' : '' });
    return;
  }
  const g = e.target.closest('[data-toggle-group]');
  if (g) {
    const id = g.dataset.toggleGroup;
    if ($('#app').classList.contains('collapsed') && innerWidth > 767) {
      navigate(g.dataset.first);
      return;
    }
    openGroups.has(id) ? openGroups.delete(id) : openGroups.add(id);
    const box = g.parentNode;
    box.classList.toggle('open');
    g.setAttribute('aria-expanded', box.classList.contains('open'));
    return;
  }
  const s = e.target.closest('[data-toggle-section]');
  if (s) {
    invSectionOpen = !invSectionOpen;
    s.parentNode.classList.toggle('collapsed-sec', !invSectionOpen);
    s.setAttribute('aria-expanded', invSectionOpen);
    return;
  }
  if (e.target.closest('a.nav-item') && innerWidth < 768) setMobileNav(false);
});
function setMobileNav(open) {
  $('#app').classList.toggle('mobile-open', open);
  $('#mobileMenuBtn').innerHTML = icon(open ? 'x' : 'menu', 20);
  $('#mobileMenuBtn').setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
}
function setCollapsed(c) {
  const app = $('#app');
  app.classList.toggle('collapsed', c);
  $('#collapseBtn').innerHTML = icon(c !== (navMode() === 'right') ? 'chevsRight' : 'chevsLeft', 18);
  $('#collapseBtn').setAttribute('aria-label', c ? 'Expand sidebar' : 'Collapse sidebar');
  $('#collapseBtn').dataset.tip = c ? 'Expand sidebar' : 'Collapse sidebar';
  store('kagami-sidebar', c ? 'collapsed' : 'expanded');
}
function navMode() {
  const m = document.documentElement.getAttribute('data-nav');
  return NAV_MODES.some(n => n[0] === m) ? m : 'left';
}
function isHNav() {
  const m = navMode();
  return m === 'top' || m === 'bottom';
}
function applyNavCollapse() {
  const pref = store('kagami-sidebar');
  const c = innerWidth >= 768 && !isHNav() && (pref ? pref === 'collapsed' : innerWidth < 1200);
  $('#app').classList.toggle('collapsed', c);
  $('#collapseBtn').innerHTML = icon(c !== (navMode() === 'right') ? 'chevsRight' : 'chevsLeft', 18);
}
function setNavMode(m) {
  document.documentElement.setAttribute('data-nav', m);
  store('kagami-nav', m);
  closeMenu();
  setMobileNav(false);
  applyNavCollapse();
  renderSidebar();
  syncAppearance();
}
function findNavGroup(list, id) {
  for (const it of list) {
    if (it.id === id) return it;
    if (it.children && !Array.isArray(it.children[0])) {
      const f = findNavGroup(it.children, id);
      if (f) return f;
    }
  }
  return null;
}
function renderHNav() {
  const leaf = it => {
    const on = activeNav === it.route;
    return (
      '<a class="hn-item' +
      (on ? ' active' : '') +
      '" href="#/' +
      it.route +
      '"' +
      (on ? ' aria-current="page"' : '') +
      '>' +
      icon(it.icon, 17) +
      '<span>' +
      esc(it.label) +
      '</span></a>'
    );
  };
  const group = g =>
    '<button class="hn-item' +
    (groupHas(g, activeNav) ? ' active' : '') +
    '" data-hmenu="' +
    g.id +
    '" aria-haspopup="menu" aria-expanded="false">' +
    icon(g.icon, 17) +
    '<span>' +
    esc(g.label) +
    '</span><span class="hn-caret">' +
    icon('chevDown', 13) +
    '</span></button>';
  let h = '';
  navList().forEach(it => {
    if (it.sep) {
      h += '<span class="hn-sep" aria-hidden="true"></span>';
      return;
    }
    if (it.section) {
      h +=
        '<span class="hn-sep" aria-hidden="true"></span><span class="hn-tag">' +
        esc(it.label) +
        '</span>' +
        it.children.map(c => (c.children ? group(c) : leaf(c))).join('');
      return;
    }
    h += it.children ? group(it) : leaf(it);
  });
  const sb = $('#sidebar');
  sb.innerHTML = h;
  const a = $('.hn-item.active', sb);
  if (a) sb.scrollLeft = Math.max(0, a.offsetLeft - sb.clientWidth / 2 + a.offsetWidth / 2);
}
