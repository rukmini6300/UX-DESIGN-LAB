/* =========================================================================
   DESIGN LAB SIDEBAR
   Docked design lab panel (icon rail plus one topic at a time), density
   and the Settings route.

   The long list of options is split into 7 topics, each with an icon in a
   rail on the left. Every choice is an icon tile with a short label, so it
   can be recognised at a glance.

   Provides: LDG, LD_TXT, LD_ICON, LD_TABS, labDockize, setLabDock,
   initLabDock, applyDensity, #/settings
   ========================================================================= */
'use strict';

const LDG = p =>
  '<svg class="oi" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  p +
  '</svg>';
const LD_TXT = (t, px) => '<span class="oi-t" style="font-size:' + px + 'px">' + t + '</span>';
const LD_ICON = {
  mode: {
    light: icon('sun', 22),
    dark: icon('moon', 22),
    hc: icon('contrast', 22),
    system: icon('monitor', 22)
  },
  size: {
    xs: LD_TXT('Aa', 11),
    s: LD_TXT('Aa', 13),
    m: LD_TXT('Aa', 16),
    l: LD_TXT('Aa', 19),
    xl: LD_TXT('Aa', 22)
  },
  density: {
    comfortable: LDG('<path d="M5 6h14M5 12h14M5 18h14"/>'),
    compact: LDG('<path d="M5 5h14M5 9.7h14M5 14.3h14M5 19h14"/>'),
    dense: LDG('<path d="M5 4h14M5 8h14M5 12h14M5 16h14M5 20h14"/>')
  },
  color: {
    language: icon('palette', 22),
    brand: LDG('<path d="M12 3s6 6.2 6 10.5A6 6 0 0 1 6 13.5C6 9.2 12 3 12 3z"/>')
  },
  radius: {
    lang: icon('sliders', 22),
    sharp: LDG('<path d="M5 19V5h14"/>'),
    soft: LDG('<path d="M5 19v-8a6 6 0 0 1 6-6h8"/>'),
    round: LDG('<path d="M5 19v-3a11 11 0 0 1 11-11h3"/>')
  },
  elev: {
    lang: icon('sliders', 22),
    flat: LDG('<rect x="5" y="7" width="14" height="10" rx="2"/>'),
    raised: LDG('<rect x="5" y="5" width="14" height="10" rx="2"/><path d="M8 19h11"/>')
  },
  motion: {
    lang: icon('sliders', 22),
    reduced: LDG('<path d="M4 12c3-4 5 4 8 0s5 4 8 0"/>'),
    off: LDG('<path d="M4 12h16"/>')
  },
  icons: {
    lang: icon('sliders', 22),
    light: LDG('<path d="M5 8h14M5 12h14M5 16h14" stroke-width="1"/>'),
    regular: LDG('<path d="M5 8h14M5 12h14M5 16h14" stroke-width="1.8"/>'),
    bold: LDG('<path d="M5 8h14M5 12h14M5 16h14" stroke-width="2.6"/>')
  },
  forms: {
    stack: LDG(
      '<rect x="4" y="4" width="16" height="4" rx="1"/><rect x="4" y="10" width="16" height="4" rx="1"/><rect x="4" y="16" width="16" height="4" rx="1"/>'
    ),
    accordion: LDG('<path d="M4 6h12M4 12h12M4 18h12M18 5l2 2 2-2" transform="translate(-2 0)"/>'),
    tabs: LDG('<rect x="4" y="9" width="16" height="10" rx="1.5"/><path d="M4 9V6h6v3"/>'),
    side: LDG('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9.5 4v16"/>'),
    steps: LDG('<circle cx="6" cy="12" r="2"/><circle cx="18" cy="12" r="2"/><path d="M8 12h8"/>')
  },
  fit: {
    on: LDG('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
    off: LDG('<path d="M12 4v16M8 16l4 4 4-4M8 8l4-4 4 4"/>')
  },
  device: {
    auto: icon('monitor', 22),
    desktop: icon('monitor', 22),
    laptop: LDG('<rect x="5" y="5" width="14" height="10" rx="1.5"/><path d="M3 19h18"/>'),
    tablet: LDG('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M11 18h2"/>'),
    'tablet-l': LDG('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M18 11v2"/>'),
    phone: LDG('<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>'),
    'phone-s': LDG('<rect x="8" y="4" width="8" height="16" rx="2"/>'),
    'phone-l': LDG('<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M18 11v2"/>')
  },
  nav: {
    left: LDG('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>'),
    right: LDG('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/>'),
    top: LDG('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/>'),
    bottom: LDG('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 15h18"/>')
  },
  navbgmode: {
    theme: icon('contrast', 22),
    solid: LDG('<rect x="4" y="6" width="16" height="12" rx="2" fill="currentColor"/>'),
    gradient: LDG(
      '<defs><linearGradient id="ldg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="currentColor"/><stop offset="1" stop-color="currentColor" stop-opacity=".2"/></linearGradient></defs><rect x="4" y="6" width="16" height="12" rx="2" fill="url(#ldg)"/>'
    )
  },
  navsub: {
    tint: LDG('<rect x="4" y="9" width="16" height="6" rx="2" fill="currentColor" fill-opacity=".2"/>'),
    fill: LDG('<rect x="4" y="9" width="16" height="6" rx="2" fill="currentColor"/>'),
    bar: LDG('<path d="M5 8v8"/><path d="M9 12h10"/>'),
    underline: LDG('<path d="M5 12h14M5 17h14"/>'),
    indent: LDG('<path d="M4 8h10M8 16h12"/>')
  }
};
const LD_TABS = [
  ['theme', 'Theme', 'palette', ['Design language', 'Mode', 'Color']],
  ['size', 'Size', 'ruler', ['Size', 'Density']],
  ['font', 'Font', '<span class="oi-t" style="font-size:16px">Aa</span>', ['Typography']],
  [
    'shape',
    'Shape',
    '<svg class="oi" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="5" y="5" width="14" height="14" rx="5"/></svg>',
    ['Shape and depth']
  ],
  ['navbar', 'Navbar', 'panel', ['Navbar', 'Navigation position']],
  ['forms', 'Forms', 'layers', ['Form screens']],
  ['device', 'Device', 'phone', ['Device preview']]
];
function labDockize(dock) {
  const wrap = $('[data-lab-root]', dock);
  if (!wrap || wrap.dataset.ld) return;
  wrap.dataset.ld = '1';
  /* icon tiles */
  $$('.lab-opt[data-lab]', wrap).forEach(o => {
    const g = LD_ICON[o.dataset.lab],
      ic = g && g[o.dataset.v];
    const sm = $('small', o);
    if (sm) {
      o.title = (($('b', o) || {}).textContent || '') + ': ' + sm.textContent;
    }
    if (ic && !$('.fnt,.nvsw,.oi', o)) {
      o.insertAdjacentHTML('afterbegin', '<span class="ld-ico">' + ic + '</span>');
    }
  });
  /* topics */
  const secs = $$('.lab-sec', wrap),
    by = t => secs.find(s => ($('h4', s) || {}).textContent.trim() === t);
  const rail = el(
    '<nav class="ld-rail" role="tablist" aria-label="Design lab topics" aria-orientation="vertical"></nav>'
  );
  const pane = el('<div class="ld-pane"></div>');
  const cur = LD_TABS.some(t => t[0] === store('kagami-labtab')) ? store('kagami-labtab') : 'theme';
  LD_TABS.forEach(t => {
    const ic = /^</.test(t[2]) ? t[2] : icon(t[2], 22);
    rail.append(
      el(
        '<button type="button" class="ld-tab" role="tab" data-ldtab="' +
          t[0] +
          '" aria-selected="false" title="' +
          t[1] +
          '"><span class="ld-ti">' +
          ic +
          '</span><span class="ld-tl">' +
          t[1] +
          '</span></button>'
      )
    );
    const p = el(
      '<section class="ld-sheet" role="tabpanel" data-ldsheet="' +
        t[0] +
        '" hidden><h3 class="ld-ph">' +
        t[1] +
        '</h3></section>'
    );
    t[3].forEach(n => {
      const s = by(n);
      if (s) p.append(s);
    });
    if ($('.lab-sec', p).length === 1) {
      const h4 = $('.lab-sec h4', p);
      if (h4) h4.remove();
    }
    pane.append(p);
  });
  const top = $('.lab-top', wrap);
  const shell = el('<div class="ld-wrap"></div>');
  shell.append(rail, pane);
  wrap.append(shell);
  const show = id => {
    $$('.ld-tab', rail).forEach(b => b.setAttribute('aria-selected', String(b.dataset.ldtab === id)));
    $$('.ld-sheet', pane).forEach(s => {
      s.hidden = s.dataset.ldsheet !== id;
    });
    pane.scrollTop = 0;
    store('kagami-labtab', id);
  };
  rail.addEventListener('click', e => {
    const b = e.target.closest('.ld-tab');
    if (b) show(b.dataset.ldtab);
  });
  rail.addEventListener('keydown', e => {
    const bs = $$('.ld-tab', rail),
      i = bs.indexOf(document.activeElement),
      d = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
    if (d && i > -1) {
      const n = bs[(i + d + bs.length) % bs.length];
      n.focus();
      show(n.dataset.ldtab);
      e.preventDefault();
    }
  });
  show(cur);
}

function setLabDock(open) {
  const d = $('#labDock'),
    b = $('#labBtn');
  if (open && !d.dataset.ready) {
    d.dataset.ready = '1';
    d.innerHTML =
      '<div class="lab-dock-head"><span class="doc-ico">' +
      icon('sliders', 18) +
      '</span><div style="flex:1;min-width:0"><h3>Design lab</h3><small>Applied instantly, saved on this device</small></div><button class="btn btn-ghost btn-sm btn-icon" type="button" aria-label="Close design lab" data-lab-close>' +
      icon('x', 16) +
      '</button></div><div class="lab-dock-body">' +
      labPanelHTML(true) +
      '</div>';
    $('[data-lab-close]', d).onclick = () => setLabDock(false);
    labBind(d);
    labDockize(d);
  }
  d.hidden = !open;
  document.documentElement.toggleAttribute('data-labdock', open);
  document.documentElement.setAttribute('data-labdock', open ? 'open' : 'closed');
  b.setAttribute('aria-expanded', String(open));
  store('kagami-labdock', open ? '1' : '0');
  if (open) syncLab();
}
function initLabDock() {
  window.addEventListener('hashchange', () => {
    if (innerWidth <= 900 && !$('#labDock').hidden) setLabDock(false);
  });
  const b = $('#labBtn');
  b.innerHTML = icon('sliders', 19);
  b.dataset.tip = 'Design lab sidebar';
  b.onclick = () => setLabDock($('#labDock').hidden);
  document.addEventListener('keydown', e => {
    if (
      e.key === 'Escape' &&
      !$('#labDock').hidden &&
      !modalStack.length &&
      !/INPUT|SELECT|TEXTAREA/.test(e.target.tagName || '')
    )
      setLabDock(false);
  });
  if (store('kagami-labdock') === '1' && innerWidth > 900) setLabDock(true);
}
function applyDensity(d) {
  document.documentElement.setAttribute('data-density', d);
  store('kagami-density', d);
}
ROUTES.settings = () => ({
  title: 'Settings',
  nav: 'settings',
  crumbs: [['Settings', 'settings'], ['Appearance']],
  sub: 'Navbar variant, background and colors. Saved on this device and applied instantly.',
  body: '<section class="card">' + navPageHTML() + '</section>',
  mount(page) {
    labBind(page);
  }
});
