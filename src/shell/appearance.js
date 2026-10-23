/* =========================================================================
   APPEARANCE
   Light / dark / system mode, brand color or gradient and the Appearance
   dialog.

   Provides: paintThemeBtn, applyThemeAttr, setTheme, BRAND_SOLIDS,
   BRAND_GRADS, NAV_MODES, sysDark, getBrand, setBrand, getMode, setMode,
   onColorFor, brandName, PANE_BASE, apNode, apGrad, openAppearance,
   syncAppearance, toggleTheme
   ========================================================================= */
'use strict';

function paintThemeBtn(t) {
  $('#themeBtn').innerHTML = icon(t === 'dark' ? 'sun' : 'moon', 19);
  $('#themeBtn').setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  $('#themeBtn').dataset.tip = t === 'dark' ? 'Light theme' : 'Dark theme';
  $('#tip').classList.remove('show');
}
function applyThemeAttr(t) {
  document.documentElement.setAttribute('data-theme', t);
  paintThemeBtn(t);
}
function setTheme(t) {
  applyThemeAttr(t);
  store('kagami-theme', t);
  store('kagami-mode', 'manual');
  syncAppearance();
}
/* =========================================================
   APPEARANCE: brand color, gradient, light/dark/system, navigation position
   ========================================================= */
const BRAND_SOLIDS = [
  ['Kagami Orange', '#F26522'],
  ['Teal', '#087F8C'],
  ['Blue', '#2563EB'],
  ['Indigo', '#4F46E5'],
  ['Violet', '#7C3AED'],
  ['Pink', '#DB2777'],
  ['Red', '#DC2626'],
  ['Green', '#16A34A'],
  ['Emerald', '#059669'],
  ['Amber', '#D97706'],
  ['Sky', '#0284C7'],
  ['Cyan', '#0891B2'],
  ['Slate', '#475569'],
  ['Graphite', '#27272A']
];
const BRAND_GRADS = [
  ['Sunset', '#F26522', '#E11D48', 135],
  ['Tangerine', '#F26522', '#F59E0B', 135],
  ['Ocean', '#087F8C', '#2563EB', 135],
  ['Aurora', '#059669', '#0891B2', 135],
  ['Royal', '#4F46E5', '#9333EA', 135],
  ['Berry', '#DB2777', '#7C3AED', 135],
  ['Fire', '#DC2626', '#F97316', 120],
  ['Forest', '#166534', '#65A30D', 135],
  ['Midnight', '#1E3A8A', '#7C3AED', 135],
  ['Peach', '#F43F5E', '#FB923C', 135]
];
const NAV_MODES = [
  ['left', 'Left'],
  ['right', 'Right'],
  ['top', 'Top'],
  ['bottom', 'Bottom']
];
const sysDark = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
function getBrand() {
  try {
    const c = JSON.parse(store('kagami-brand') || 'null');
    if (c && (c.color || c.a)) return c;
  } catch (e) {}
  return KagamiTheme.DEFAULT;
}
function setBrand(c) {
  KagamiTheme.apply(c);
  if (window.KagamiLab && KagamiLab.state.color !== 'brand') KagamiLab.set('color', 'brand');
  store('kagami-brand', JSON.stringify(c));
  syncAppearance();
}
function getMode() {
  return store('kagami-mode') || (store('kagami-theme') ? 'manual' : 'system');
}
function setMode(m) {
  if (m === 'system') {
    store('kagami-mode', 'system');
    applyThemeAttr(sysDark && sysDark.matches ? 'dark' : 'light');
    syncAppearance();
  } else setTheme(m);
}
if (sysDark && sysDark.addEventListener)
  sysDark.addEventListener('change', e => {
    if (getMode() === 'system') {
      applyThemeAttr(e.matches ? 'dark' : 'light');
      syncAppearance();
    }
  });
function onColorFor(c) {
  return KagamiTheme.contrast(KagamiTheme.hex(c), [255, 255, 255]) >= 2.6 ? '#FFFFFF' : '#111827';
}
function brandName(b) {
  if (b.type === 'gradient') {
    const g = BRAND_GRADS.find(
      g => g[1] === String(b.a).toUpperCase() && g[2] === String(b.b).toUpperCase() && g[3] === +b.angle
    );
    return [
      g ? g[0] : 'Custom gradient',
      'Gradient · ' + String(b.a).toUpperCase() + ' → ' + String(b.b).toUpperCase() + ' · ' + +b.angle + '°'
    ];
  }
  const s = BRAND_SOLIDS.find(s => s[1] === String(b.color).toUpperCase());
  return [s ? s[0] : 'Custom color', 'Solid · ' + String(b.color).toUpperCase()];
}
const PANE_BASE = {
  light:
    '--surface:#FFFFFF;--surface-secondary:#F2F4F7;--text:#172033;--text-muted:#667085;--border:#E4E7EC;',
  dark: '--surface:#171B21;--surface-secondary:#1E232B;--text:#F5F7FA;--text-muted:#98A2B3;--border:#2A3038;'
};
let apNode = null,
  apGrad = null;
function openAppearance() {
  closeMenu();
  const b = getBrand();
  apGrad =
    b.type === 'gradient' ? { a: b.a, b: b.b, angle: +b.angle } : { a: b.color, b: '#E11D48', angle: 135 };
  const mini = {
    left: '<i class="lh"></i><i class="ln" style="left:6%;top:24%;bottom:8%;width:18%"></i><i class="lc" style="left:30%;right:6%;top:24%;bottom:8%"></i>',
    right:
      '<i class="lh"></i><i class="ln" style="right:6%;top:24%;bottom:8%;width:18%"></i><i class="lc" style="left:6%;right:30%;top:24%;bottom:8%"></i>',
    top: '<i class="lh"></i><i class="ln" style="left:6%;right:6%;top:24%;height:11%"></i><i class="lc" style="left:6%;right:6%;top:42%;bottom:8%"></i>',
    bottom:
      '<i class="lh"></i><i class="lc" style="left:6%;right:6%;top:24%;bottom:26%"></i><i class="ln" style="left:6%;right:6%;bottom:8%;height:11%"></i>'
  };
  const pane = k =>
    '<div class="ap-pane" data-pane="' +
    k +
    '"><span class="pt">' +
    (k === 'light' ? 'Light' : 'Dark') +
    ' mode</span><span class="pnav">' +
    icon('grid', 15) +
    'Overview</span><div class="prow"><span class="pbtn">Create GRN</span><span class="pbadge">In transit</span></div><span class="plink">View stock ledger</span><span class="pbar"><i></i></span><span class="pc"></span></div>';
  apNode = el(
    '<div>' +
      '<div class="ap-current"><span class="ap-cur-sw"></span><div><b data-ap-name></b><small data-ap-desc></small></div></div>' +
      '<section class="ap-sec"><h4>Design lab options</h4><p class="ap-sub">Design language, size, density, fonts, radius, elevation, motion and accent roles live in Settings.</p><button type="button" class="btn btn-sm" data-open-lab>' +
      icon('sliders', 15) +
      'Open design lab options</button></section>' +
      '<section class="ap-sec"><h4>Mode</h4><p class="ap-sub">Every color below is tuned for both light and dark.</p><div class="ap-seg" role="group" aria-label="Color mode">' +
      [
        ['light', 'sun', 'Light'],
        ['dark', 'moon', 'Dark'],
        ['hc', 'contrast', 'Contrast'],
        ['system', 'monitor', 'System']
      ]
        .map(
          m =>
            '<button type="button" data-mode="' +
            m[0] +
            '" aria-pressed="false">' +
            icon(m[1], 15) +
            m[2] +
            '</button>'
        )
        .join('') +
      '</div></section>' +
      '<section class="ap-sec"><h4>Navigation position</h4><p class="ap-sub">Where the main menu sits. Top and bottom use dropdowns for each module.</p><div class="ap-layouts" role="group" aria-label="Navigation position">' +
      NAV_MODES.map(
        n =>
          '<button type="button" class="ap-lay" data-nav-set="' +
          n[0] +
          '" aria-pressed="false"><span class="lay-mini" aria-hidden="true">' +
          mini[n[0]] +
          '</span>' +
          n[1] +
          '</button>'
      ).join('') +
      '</div></section>' +
      '<section class="ap-sec"><h4>Theme color</h4><p class="ap-sub">One color drives buttons, links, navigation, tabs, charts and highlights across the whole ERP.</p><div class="ap-sw" role="group" aria-label="Theme colors">' +
      BRAND_SOLIDS.map(
        s =>
          '<button type="button" class="ap-swb" data-solid="' +
          s[1] +
          '" style="background:' +
          s[1] +
          ';color:' +
          onColorFor(s[1]) +
          '" aria-label="' +
          s[0] +
          '" data-tip="' +
          s[0] +
          '" aria-pressed="false">' +
          icon('check', 16) +
          '</button>'
      ).join('') +
      '</div>' +
      '<div class="ap-row"><label class="ap-field">Custom<span class="ap-color"><input type="color" data-ap-pick aria-label="Pick a custom theme color"></span></label><label class="ap-field">Hex or rgb()<input class="input ap-hex" data-ap-hex maxlength="20" spellcheck="false" autocomplete="off"></label></div></section>' +
      '<section class="ap-sec"><h4>Gradient</h4><p class="ap-sub">Two-color gradient for buttons, the logo, progress bars and accents. Text and links use the start color.</p><div class="ap-sw grad" role="group" aria-label="Gradient presets">' +
      BRAND_GRADS.map(
        (g, i) =>
          '<button type="button" class="ap-swb" data-grad="' +
          i +
          '" style="background:linear-gradient(' +
          g[3] +
          'deg,' +
          g[1] +
          ',' +
          g[2] +
          ');color:' +
          onColorFor(g[1]) +
          '" aria-label="' +
          g[0] +
          ' gradient" data-tip="' +
          g[0] +
          '" aria-pressed="false">' +
          icon('check', 16) +
          '</button>'
      ).join('') +
      '</div>' +
      '<p class="ap-sub" style="margin:16px 0 8px;font-weight:600;color:var(--text)">Build your own</p><div class="ap-gbar" data-ap-gbar></div>' +
      '<div class="ap-row"><label class="ap-field">Start<span class="ap-color"><input type="color" data-g="a" aria-label="Gradient start color"></span></label><label class="ap-field">End<span class="ap-color"><input type="color" data-g="b" aria-label="Gradient end color"></span></label><button type="button" class="btn btn-sm" data-g-swap style="height:36px">' +
      icon('transfer', 15) +
      'Swap</button><label class="ap-field" style="flex:1;min-width:150px">Angle <span data-ap-ang></span><input type="range" class="ap-range" min="0" max="360" step="5" data-g="angle" aria-label="Gradient angle"></label></div></section>' +
      '<section class="ap-sec"><h4>Preview</h4><p class="ap-sub">How your choice renders in each mode, with text contrast checked automatically.</p><div class="ap-prev">' +
      pane('light') +
      pane('dark') +
      '</div></section>' +
      '</div>'
  );
  const gradNow = () =>
    setBrand({
      type: 'gradient',
      a: apGrad.a.toUpperCase(),
      b: apGrad.b.toUpperCase(),
      angle: +apGrad.angle
    });
  apNode.addEventListener('click', e => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.hasAttribute('data-open-lab')) {
      if (apNode._api) apNode._api.close();
      navigate('settings?tab=appearance');
    } else if (t.dataset.mode) setMode(t.dataset.mode);
    else if (t.dataset.navSet) setNavMode(t.dataset.navSet);
    else if (t.dataset.solid) setBrand({ type: 'solid', color: t.dataset.solid });
    else if (t.dataset.grad) {
      const g = BRAND_GRADS[+t.dataset.grad];
      apGrad = { a: g[1], b: g[2], angle: g[3] };
      gradNow();
    } else if (t.hasAttribute('data-g-swap')) {
      apGrad = { a: apGrad.b, b: apGrad.a, angle: apGrad.angle };
      gradNow();
    }
  });
  apNode.addEventListener('input', e => {
    const t = e.target;
    if (t.hasAttribute('data-ap-pick')) setBrand({ type: 'solid', color: t.value.toUpperCase() });
    else if (t.hasAttribute('data-ap-hex')) {
      const c = KagamiTheme.hex(t.value);
      t.classList.toggle('invalid', !c && t.value.trim().length > 3);
      if (c && /^#?[0-9a-f]{6}$|^rgb/i.test(t.value.trim()))
        setBrand({ type: 'solid', color: KagamiTheme.toHex(c) });
    } else if (t.dataset.g) {
      apGrad[t.dataset.g] = t.dataset.g === 'angle' ? +t.value : t.value;
      gradNow();
    }
  });
  apNode._api = openDrawer({
    title: 'Appearance',
    icon: 'palette',
    subtitle: 'Saved on this device and applied instantly.',
    body: apNode,
    actions: [
      {
        label: 'Reset to default',
        icon: 'undo',
        onClick: () => {
          setBrand(KagamiTheme.DEFAULT);
          setMode('system');
          setNavMode('left');
          LABX.reset();
          applyDensity('comfortable');
          const d = getBrand();
          apGrad = { a: d.color, b: '#E11D48', angle: 135 };
          syncAppearance();
          toast('success', 'Appearance reset', 'Kagami Orange, left navigation and system mode restored.');
          return false;
        }
      },
      { label: 'Done', variant: 'primary' }
    ]
  });
  syncAppearance();
}
function syncAppearance() {
  if (typeof syncLab === 'function') syncLab();
  if (!apNode || !apNode.isConnected) return;
  const b = getBrand(),
    m = getMode() === 'system' ? 'system' : document.documentElement.getAttribute('data-theme'),
    nav = navMode(),
    grad = b.type === 'gradient';
  const press = (sel, fn) => $$(sel, apNode).forEach(x => x.setAttribute('aria-pressed', String(!!fn(x))));
  press('[data-mode]', x => x.dataset.mode === m);
  press('[data-nav-set]', x => x.dataset.navSet === nav);
  press('[data-solid]', x => !grad && x.dataset.solid === String(b.color).toUpperCase());
  press('[data-grad]', x => {
    const g = BRAND_GRADS[+x.dataset.grad];
    return (
      grad && g[1] === String(b.a).toUpperCase() && g[2] === String(b.b).toUpperCase() && g[3] === +b.angle
    );
  });
  const nm = brandName(b);
  $('[data-ap-name]', apNode).textContent = nm[0];
  $('[data-ap-desc]', apNode).textContent = nm[1];
  const solid = grad ? b.a : b.color,
    act = document.activeElement;
  const pick = $('[data-ap-pick]', apNode),
    hx = $('[data-ap-hex]', apNode);
  if (act !== pick) pick.value = String(solid).toLowerCase();
  if (act !== hx) {
    hx.value = String(solid).toUpperCase();
    hx.classList.remove('invalid');
  }
  $$('[data-g]', apNode).forEach(x => {
    if (x !== act)
      x.value = x.dataset.g === 'angle' ? apGrad.angle : String(apGrad[x.dataset.g]).toLowerCase();
  });
  $('[data-ap-ang]', apNode).textContent = apGrad.angle + '°';
  $('[data-ap-gbar]', apNode).style.background =
    'linear-gradient(' + apGrad.angle + 'deg,' + apGrad.a + ',' + apGrad.b + ')';
  const tk = KagamiTheme.tokens(b);
  ['light', 'dark'].forEach(k => {
    const t = tk[k],
      p = $('[data-pane="' + k + '"]', apNode);
    p.style.cssText =
      PANE_BASE[k] +
      Object.keys(t)
        .map(n => n + ':' + t[n])
        .join(';');
    const on = KagamiTheme.hex(t['--on-primary']),
      r = Math.min(
        KagamiTheme.contrast(on, KagamiTheme.hex(t['--grad-a'])),
        KagamiTheme.contrast(on, KagamiTheme.hex(t['--grad-b']))
      );
    $('.pc', p).textContent =
      'Button text ' + r.toFixed(1) + ':1 · ' + (r >= 4.5 ? 'AA' : r >= 3 ? 'AA large text' : 'Low contrast');
  });
}
document.addEventListener('click', e => {
  if (e.target.closest('[data-open-appearance]')) {
    e.preventDefault();
    openAppearance();
  }
});
function toggleTheme() {
  setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
}
