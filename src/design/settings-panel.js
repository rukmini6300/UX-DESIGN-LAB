/* =========================================================================
   DESIGN LAB OPTIONS
   Settings > Appearance: design language, mode, size, density, accents,
   fonts, radius, elevation, motion, icons and navbar controls.

   Provides: LABX, LAB_MODES, labCur, labOpt, labSimple, labLangCard,
   labPreviewHTML, NV_SHOW, NV_LABEL, nvRow, nvPresetCard, nvPreview,
   navSection, nvSync, nvHandle, labPanelHTML, navPageHTML, syncNavPage,
   syncLab, syncLabRoot, labBind
   ========================================================================= */
'use strict';

/* =========================================================
   DESIGN LAB OPTIONS (Settings > Appearance)
   Every option from the Enterprise UX Lab: language, mode, size, density, color roles,
   typography, shape, depth, motion, icons. Applied instantly and saved on this device.
   ========================================================= */
const LABX = window.KagamiLab;
const LAB_MODES = [
  ['light', 'Light', 'sun'],
  ['dark', 'Dark', 'moon'],
  ['hc', 'High contrast', 'contrast'],
  ['system', 'System', 'monitor']
];
function labCur(k) {
  if (k === 'device') return devState.id;
  if (k === 'mode')
    return getMode() === 'system' ? 'system' : document.documentElement.getAttribute('data-theme');
  if (k === 'density') return document.documentElement.getAttribute('data-density') || 'comfortable';
  if (k === 'nav') return navMode();
  return LABX.state[k];
}
function labOpt(k, v, body, extra) {
  return (
    '<button type="button" class="lab-opt" data-lab="' +
    k +
    '" data-v="' +
    v +
    '" aria-pressed="false"' +
    (extra || '') +
    '>' +
    body +
    '</button>'
  );
}
function labSimple(k, list, cols) {
  return (
    '<div class="lab-grid c' +
    (cols || list.length) +
    '" role="group">' +
    list
      .map(o =>
        labOpt(k, o[0], '<b>' + esc(o[1]) + '</b>' + (o[2] ? '<small>' + esc(o[2]) + '</small>' : ''))
      )
      .join('') +
    '</div>'
  );
}
function labLangCard(l) {
  return (
    '<button type="button" class="lab-lang" data-lab="lang" data-v="' +
    l[0] +
    '" data-lang-card="' +
    l[0] +
    '" aria-pressed="false"><span class="ll-top"><b>' +
    esc(l[1]) +
    '</b><small data-fontname></small></span><span class="ll-demo"><i class="ll-btn">Save</i><i class="ll-in">Search</i><i class="ll-bd">Active</i></span><span class="ll-desc">' +
    esc(l[2]) +
    '</span></button>'
  );
}
function labPreviewHTML() {
  return (
    '<div class="lab-prev" data-lab-prev>' +
    '<div><h5>Buttons</h5><div class="lp-row" style="margin-top:8px"><button class="btn btn-primary" type="button">' +
    icon('plus', 16) +
    '<span>Create GRN</span></button><button class="btn" type="button">Default</button><button class="btn btn-soft" type="button">Soft</button><button class="btn btn-ghost" type="button">Ghost</button><button class="btn btn-danger" type="button">Delete</button><button class="btn btn-success" type="button">Approve</button><button class="btn btn-sm" type="button">Small</button><button class="btn btn-xs" type="button">Extra small</button><button class="btn btn-icon" type="button" aria-label="Settings">' +
    icon('settings', 16) +
    '</button><button class="btn" type="button" disabled>Disabled</button></div></div>' +
    '<div><h5>Fields</h5><div class="lp-row" style="margin-top:8px"><input class="input" type="text" value="SKU-10042" aria-label="Sample input"><select class="select" aria-label="Sample select"><option>Main warehouse</option><option>Chicago DC</option></select><input class="input input-sm" type="text" placeholder="Small input" aria-label="Small input"></div></div>' +
    '<div><h5>Status and chips</h5><div class="lp-row" style="margin-top:8px">' +
    badge('In stock', 'success') +
    badge('Low stock', 'warning') +
    badge('Out of stock', 'danger') +
    badge('In transit', 'info') +
    badge('Draft') +
    badge('QC hold', 'purple') +
    '<span class="chip">Raw materials</span><span class="chip">Cold storage</span></div></div>' +
    '<div><h5>Alerts</h5><div class="lp-row" style="margin-top:8px;align-items:stretch"><div class="alert alert-info" style="flex:1;min-width:220px">' +
    icon('info', 16) +
    '<span><b>Info.</b> 3 transfers are in transit.</span></div><div class="alert alert-warning" style="flex:1;min-width:220px">' +
    icon('alert', 16) +
    '<span><b>Warning.</b> 12 items below reorder level.</span></div><div class="alert alert-danger" style="flex:1;min-width:220px">' +
    icon('alert', 16) +
    '<span><b>Error.</b> Adjustment needs approval.</span></div></div></div>' +
    '<div><h5>Table</h5><div class="tbl-box" style="margin-top:8px"><table class="tbl"><thead><tr><th>SKU</th><th>Product</th><th class="right">On hand</th><th>Status</th></tr></thead><tbody>' +
    [
      ['SKU-10042', 'Hydraulic hose 3/4"', '1,240', 'In stock', 'success'],
      ['SKU-10077', 'Bearing 6204-2RS', '86', 'Low stock', 'warning'],
      ['SKU-10113', 'Gasket kit, Type B', '0', 'Out of stock', 'danger']
    ]
      .map(
        r =>
          '<tr><td class="mono">' +
          r[0] +
          '</td><td>' +
          esc(r[1]) +
          '</td><td class="right num">' +
          r[2] +
          '</td><td>' +
          badge(r[3], r[4]) +
          '</td></tr>'
      )
      .join('') +
    '</tbody></table></div></div>' +
    '</div>'
  );
}
/* ---- Settings: independent navbar controls ---- */
const NV_SHOW = {
  bg: '#FFFFFF',
  bg2: '#1B7F9E',
  text: '#667085',
  hover: '#F0F3F7',
  hoverText: '#172033',
  active: '#FEF0E8',
  activeText: '#B8430E',
  border: '#E4E7EC',
  subBg: '#FFFFFF',
  subText: '#667085',
  subHover: '#F0F3F7',
  subHoverText: '#172033',
  subActive: '#FFFFFF',
  subActiveText: '#B8430E',
  subLine: '#E4E7EC',
  icon: '#98A2B3',
  iconHover: '#667085',
  iconActive: '#B8430E'
};
const NV_LABEL = {
  bg: 'Color',
  bg2: 'Second color',
  text: 'Text',
  hover: 'Hover background',
  hoverText: 'Hover text',
  active: 'Active background',
  activeText: 'Active text',
  border: 'Border and dividers',
  subBg: 'Nested panel background',
  subText: 'Nested text',
  subHover: 'Nested hover background',
  subHoverText: 'Nested hover text',
  subActive: 'Nested active background',
  subActiveText: 'Nested active text',
  subLine: 'Nested guide line',
  icon: 'Icon',
  iconHover: 'Icon on hover',
  iconActive: 'Icon when active'
};
function nvRow(f) {
  return (
    '<div class="nv-row"><span>' +
    NV_LABEL[f] +
    '</span><span class="nv-auto" data-nv-auto="' +
    f +
    '"></span><input type="color" data-nv="' +
    f +
    '" aria-label="' +
    NV_LABEL[f] +
    '"><button type="button" class="btn btn-xs btn-ghost" data-nv-clear="' +
    f +
    '" aria-label="Reset ' +
    NV_LABEL[f] +
    ' to automatic" data-tip="Automatic">' +
    icon('undo', 13) +
    '</button></div>'
  );
}
function nvPresetCard(p) {
  const c = Object.assign({}, p[3]),
    has = !!c.bg,
    fg = has && KagamiTheme.contrast(KagamiTheme.hex(c.bg), [255, 255, 255]) < 4 ? '#111827' : '#FFFFFF';
  const bg = has
    ? c.bgmode === 'gradient'
      ? 'linear-gradient(' + c.angle + 'deg,' + c.bg + ',' + c.bg2 + ')'
      : c.bg
    : 'var(--surface)';
  const tx = c.text || (has ? fg : 'var(--text-muted)'),
    ac = c.active || (has ? 'rgba(255,255,255,.22)' : 'var(--primary-soft)'),
    at = c.activeText || (has ? fg : 'var(--primary-text)');
  return (
    '<button type="button" class="nv-pre" data-nv-preset="' +
    p[0] +
    '" aria-pressed="false"><i style="background:' +
    bg +
    ';color:' +
    tx +
    ';box-shadow:inset 0 0 0 1px rgba(0,0,0,.1)">Item <b style="background:' +
    ac +
    ';color:' +
    at +
    '">Active</b></i><b class="t">' +
    esc(p[1]) +
    '</b><small>' +
    esc(p[2]) +
    '</small></button>'
  );
}
function nvPreview() {
  const it = (l, ic, cls) =>
    '<div class="nav-item' +
    (cls ? ' ' + cls : '') +
    '">' +
    icon(ic, 18) +
    '<span class="nav-label">' +
    l +
    '</span></div>';
  return (
    '<div class="nvprev" aria-hidden="true">' +
    it('Dashboard', 'home') +
    it('Hovered item', 'box', 'is-hover') +
    it('Active item', 'grid', 'active') +
    '<div class="nav-group has-active open">' +
    it('Products', 'tag') +
    '<div class="nav-sub">' +
    it('Product List', 'list', 'active') +
    it('Nested hover', 'plus', 'is-hover') +
    it('Nested item', 'box') +
    '</div></div></div>'
  );
}
function navSection() {
  const L = LABX,
    N = L.NAV;
  return (
    '<section class="lab-sec"><h4>Navbar</h4><p>Colors, background, font and size of the sidebar, independent of the brand color and the design language. Pick a variant, then change anything. Leave a color on automatic and it is derived from the background.</p>' +
    '<p class="lab-sub" style="margin-top:0">Variants</p><div class="nv-presets" role="group" aria-label="Navbar variants">' +
    N.PRESETS.map(nvPresetCard).join('') +
    '</div>' +
    '<p class="lab-sub">Background</p><div class="lab-grid c3" role="group" aria-label="Background type" style="margin-bottom:8px">' +
    labOpt('navbgmode', 'solid', '<b>Solid</b><small>One color</small>') +
    labOpt('navbgmode', 'gradient', '<b>Gradient</b><small>Two colors and an angle</small>') +
    labOpt('navbgmode', 'theme', '<b>Theme</b><small>Follow light and dark</small>') +
    '</div>' +
    '<div class="nv-groups"><div class="nv-g" data-nv-bgbox>' +
    nvRow('bg') +
    '<div data-nv-bg2>' +
    nvRow('bg2') +
    '<div class="nv-row"><span>Angle</span><div class="nv-range" style="flex:1.4"><input type="range" min="0" max="360" step="5" data-nv-angle aria-label="Gradient angle"><output data-nv-angleout></output></div></div></div></div></div>' +
    '<div class="nv-groups" style="margin-top:14px"><div class="nv-g"><h5>Items</h5>' +
    ['text', 'hover', 'hoverText', 'active', 'activeText', 'border', 'icon', 'iconHover', 'iconActive']
      .map(nvRow)
      .join('') +
    '</div>' +
    '<div class="nv-g"><h5>Nested items</h5>' +
    ['subText', 'subHover', 'subHoverText', 'subActive', 'subActiveText', 'subLine', 'subBg']
      .map(nvRow)
      .join('') +
    '</div></div>' +
    '<p class="lab-sub">Nested hover variant</p><div class="lab-grid c5" role="group" aria-label="Nested hover variant">' +
    N.SUBS.map(s => labOpt('navsub', s[0], '<b>' + esc(s[1]) + '</b><small>' + esc(s[2]) + '</small>')).join(
      ''
    ) +
    '</div>' +
    '<p class="lab-sub">Font</p><div class="lab-grid c5" role="group" aria-label="Navbar font">' +
    L.FONTS.map(f =>
      labOpt(
        'navfont',
        f[0],
        '<span class="fnt" style="font-family:' +
          esc(f[2] || 'inherit') +
          '">Aa</span><b>' +
          (f[2] ? esc(f[1]) : 'Same as app') +
          '</b>'
      )
    ).join('') +
    '</div>' +
    '<p class="lab-sub">Font size</p><div class="nv-range" style="max-width:420px"><input type="range" min="11" max="18" step="0.5" data-nv-size aria-label="Navbar font size"><output data-nv-sizeout></output><button type="button" class="btn btn-xs" data-nv-sizeauto>Auto</button></div>' +
    '<p class="lab-sub">Live preview</p>' +
    nvPreview() +
    '</section>'
  );
}
function nvSync(root) {
  const L = LABX,
    c = L.state.navcfg,
    act = document.activeElement;
  $$('[data-nv]', root).forEach(i => {
    const f = i.dataset.nv;
    if (i !== act) i.value = (c[f] || NV_SHOW[f]).toLowerCase();
  });
  $$('[data-nv-auto]', root).forEach(s => {
    s.textContent = c[s.dataset.nvAuto] ? '' : 'Auto';
  });
  $$('[data-nv-clear]', root).forEach(b => {
    b.hidden = !c[b.dataset.nvClear];
  });
  $$('[data-nv-preset]', root).forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.nvPreset === c.preset))
  );
  const mode = c.bg ? c.bgmode : 'theme';
  $$('[data-lab="navbgmode"]', root).forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.v === mode))
  );
  $$('[data-lab="navsub"]', root).forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.v === c.subVariant))
  );
  $$('[data-lab="navfont"]', root).forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.v === c.font))
  );
  const box = $('[data-nv-bgbox]', root);
  if (box) box.hidden = mode === 'theme';
  const b2 = $('[data-nv-bg2]', root);
  if (b2) b2.hidden = mode !== 'gradient';
  const bgAuto = $('[data-nv-auto="bg"]', root);
  if (bgAuto) bgAuto.textContent = '';
  const ang = $('[data-nv-angle]', root);
  if (ang && ang !== act) ang.value = c.angle;
  const ao = $('[data-nv-angleout]', root);
  if (ao) ao.textContent = c.angle + '°';
  const sz = $('[data-nv-size]', root);
  if (sz && sz !== act) sz.value = c.size || 13.5;
  const so = $('[data-nv-sizeout]', root);
  if (so) so.textContent = c.size ? c.size + 'px' : 'Auto';
}
function nvHandle(e, root) {
  const L = LABX,
    c = L.state.navcfg,
    t = e.target;
  if (e.type === 'input') {
    if (t.dataset && t.dataset.nv) {
      const f = t.dataset.nv,
        p = {};
      p[f] = t.value.toUpperCase();
      if (f === 'bg' || f === 'bg2') {
        p.bgmode = f === 'bg2' ? 'gradient' : c.bgmode;
        if (f === 'bg2' && !c.bg) p.bg = NV_SHOW.bg;
      }
      L.NAV.set(p);
      return true;
    }
    if (t.hasAttribute && t.hasAttribute('data-nv-angle')) {
      L.NAV.set({ angle: +t.value });
      return true;
    }
    if (t.hasAttribute && t.hasAttribute('data-nv-size')) {
      L.NAV.set({ size: +t.value });
      return true;
    }
    return false;
  }
  const b = t.closest('button');
  if (!b) return false;
  if (b.dataset.nvPreset) {
    L.NAV.preset(b.dataset.nvPreset);
    return true;
  }
  if (b.dataset.nvClear) {
    const p = {};
    p[b.dataset.nvClear] = '';
    L.NAV.set(p);
    return true;
  }
  if (b.hasAttribute('data-nv-sizeauto')) {
    L.NAV.set({ size: 0 });
    return true;
  }
  if (b.dataset.lab === 'navbgmode') {
    const v = b.dataset.v;
    if (v === 'theme') L.NAV.set({ bg: '', bg2: '', bgmode: 'solid' });
    else
      L.NAV.set({ bgmode: v, bg: c.bg || NV_SHOW.bg, bg2: v === 'gradient' ? c.bg2 || NV_SHOW.bg2 : c.bg2 });
    return true;
  }
  if (b.dataset.lab === 'navsub') {
    L.NAV.set({ subVariant: b.dataset.v });
    return true;
  }
  if (b.dataset.lab === 'navfont') {
    L.NAV.set({ font: b.dataset.v });
    return true;
  }
  return false;
}

function labPanelHTML(dock) {
  const L = LABX,
    sizeBtn = s => labOpt('size', s[0], '<b>' + s[1] + '</b><small data-sizeinfo="' + s[0] + '"></small>');
  return (
    '<div class="lab-wrap' +
    (dock ? ' in-dock' : '') +
    '" data-lab-root>' +
    '<div class="lab-top"><div class="lab-sum" data-lab-sum></div><div class="lab-acts">' +
    btn('Copy settings', 'copy', 'sm', 'type="button" data-lab-copy') +
    btn('Reset design options', 'undo', 'sm', 'type="button" data-lab-reset') +
    '</div></div>' +
    '<section class="lab-sec"><h4>Design language</h4><p>The five design languages from the UX lab. Each one sets palette, type, corner radius, control height, shadows, icon stroke and motion for the whole inventory module. Kagami is the original look.</p><div class="lab-grid c3" role="group" aria-label="Design language">' +
    L.LANGS.map(labLangCard).join('') +
    '</div></section>' +
    '<section class="lab-sec"><h4>Mode</h4><p>Light, dark and high contrast are defined for every language. System follows your device.</p><div class="lab-grid c4" role="group" aria-label="Color mode">' +
    LAB_MODES.map(m => labOpt('mode', m[0], '<b>' + m[1] + '</b>')).join('') +
    '</div></section>' +
    '<section class="lab-sec"><h4>Size</h4><p>Scales control height, text size and padding, XS to XL. The values shown belong to the selected language.</p><div class="lab-grid c5" role="group" aria-label="Size">' +
    L.SIZES.map(sizeBtn).join('') +
    '</div></section>' +
    '<section class="lab-sec"><h4>Density</h4><p>Controls row height and spacing in tables, cards and forms.</p><div class="lab-grid c3" role="group" aria-label="Density">' +
    L.DENS.map(d => labOpt('density', d[0], '<b>' + d[1] + '</b><small>' + d[2] + '</small>')).join('') +
    '</div></section>' +
    '<section class="lab-sec"><h4>Color</h4><p>Use the palette of the chosen language, or keep your own brand color and gradient. With a language palette you can also pick which semantic role drives buttons, links and highlights.</p>' +
    '<div class="lab-grid c3" role="group" aria-label="Color source" style="margin-bottom:4px">' +
    labOpt(
      'color',
      'language',
      '<b>Design language palette</b><small>Primary and semantic colors from the lab.</small>'
    ) +
    labOpt('color', 'brand', '<b>My brand color</b><small>Solid color or gradient from Appearance.</small>') +
    '</div>' +
    '<p class="lab-sub">Accent role</p><div class="lab-swatches" role="group" aria-label="Accent role">' +
    L.ACCENTS.map(
      a =>
        '<button type="button" class="lab-sw" data-lab="accent" data-v="' +
        a[0] +
        '" aria-pressed="false"><i data-role="' +
        a[0] +
        '"></i>' +
        a[1] +
        '</button>'
    ).join('') +
    '</div>' +
    '<p class="lab-note" data-lab-colornote></p>' +
    '<div style="margin-top:12px">' +
    btn('Brand color and gradient', 'palette', 'sm', 'type="button" data-open-appearance') +
    '</div></section>' +
    '<section class="lab-sec"><h4>Typography</h4><p>Every font family used in the lab. Language default uses the font that language ships with.</p><div class="lab-grid c5" role="group" aria-label="Font family">' +
    L.FONTS.map(f => {
      const fam = f[2] || LABX.langFont(LABX.state.lang);
      return labOpt(
        'font',
        f[0],
        '<span class="fnt" data-fontsample="' +
          f[0] +
          '" style="font-family:' +
          esc(fam) +
          '">Aa</span><b>' +
          esc(f[1]) +
          '</b><small>' +
          (f[2] ? 'Stock, SKU, GRN' : 'Follows the language') +
          '</small>'
      );
    }).join('') +
    '</div>' +
    '<p class="lab-sub">Numbers and codes</p><div class="lab-grid c3" role="group" aria-label="Monospace font">' +
    L.MONOS.map(f =>
      labOpt(
        'mono',
        f[0],
        '<b>' +
          esc(f[1]) +
          '</b><small class="mono" style="' +
          (f[2] ? 'font-family:' + esc(f[2]) : '') +
          '">SKU-10042 · GRN-2600118</small>'
      )
    ).join('') +
    '</div>' +
    '<p class="lab-note">Web fonts load from Google Fonts when online and fall back to the system font when offline.</p></section>' +
    '<section class="lab-sec"><h4>Shape and depth</h4><p>Corner radius, elevation, motion and icon stroke weight.</p>' +
    '<p class="lab-sub" style="margin-top:0">Corner radius</p>' +
    labSimple('radius', L.RADII, 4) +
    '<p class="lab-sub">Elevation</p>' +
    labSimple('elev', L.ELEVS, 3) +
    '<p class="lab-sub">Motion</p>' +
    labSimple('motion', L.MOTIONS, 3) +
    '<p class="lab-sub">Icon stroke</p>' +
    labSimple('icons', L.ICONS, 4) +
    '</section>' +
    navSection() +
    '<section class="lab-sec" data-dev-sec><h4>Device preview</h4><p>Preview the app on a phone or tablet right here. The same dropdown is in the header.</p><div class="lab-grid c4" role="group" aria-label="Device">' +
    DEVICES.map(d =>
      labOpt(
        'device',
        d[0],
        '<b>' + d[1] + '</b><small>' + (d[3] ? d[3] + ' × ' + d[4] + ' · ' : '') + d[6] + '</small>'
      )
    ).join('') +
    '</div></section>' +
    '<section class="lab-sec"><h4>Form screens</h4><p>How create and edit screens are laid out: stacked, accordion, tabs, a nested side panel or steps. Fit to screen removes page scrolling. You can also switch layout from the header of any create screen.</p>' +
    labSimple('forms', L.FORMS, 3) +
    '<p class="lab-sub">Fit</p>' +
    labSimple('fit', L.FITS, 2) +
    '</section>' +
    '<section class="lab-sec"><h4>Navigation position</h4><p>Where the main menu sits. Top and bottom use dropdowns for each module.</p><div class="lab-nav" role="group" aria-label="Navigation position">' +
    NAV_MODES.map(n => labOpt('nav', n[0], '<b>' + n[1] + '</b>')).join('') +
    '</div></section>' +
    (dock
      ? ''
      : '<section class="lab-sec"><h4>Live preview</h4><p>Real components from the module, rendered with your current options.</p>' +
        labPreviewHTML() +
        '</section>') +
    '</div>'
  );
}
/* ---- Settings page: simple navbar-only controls ---- */
function navPageHTML() {
  const N = LABX.NAV,
    rows = l => l.map(nvRow).join('');
  return (
    '<div class="lab-wrap" data-lab-root data-lab-simple>' +
    '<div class="lab-top"><div class="lab-sum" data-lab-sum></div><div class="lab-acts">' +
    btn('Reset navbar', 'undo', 'sm', 'type="button" data-lab-reset') +
    '</div></div>' +
    '<div class="nvs-layout"><div class="nvs-main">' +
    '<section class="lab-sec"><h4>1. Variant</h4><p>Start from a ready-made look. You can change anything afterwards.</p><div class="nv-presets" role="group" aria-label="Navbar variants">' +
    N.PRESETS.map(nvPresetCard).join('') +
    '</div></section>' +
    '<section class="lab-sec"><h4>2. Background</h4><div class="lab-grid c3" role="group" aria-label="Background type" style="margin-bottom:8px">' +
    labOpt('navbgmode', 'theme', '<b>Theme</b><small>Light or dark</small>') +
    labOpt('navbgmode', 'solid', '<b>Solid</b><small>One color</small>') +
    labOpt('navbgmode', 'gradient', '<b>Gradient</b><small>Two colors</small>') +
    '</div>' +
    '<div class="nv-g" data-nv-bgbox>' +
    nvRow('bg') +
    '<div data-nv-bg2>' +
    nvRow('bg2') +
    '<div class="nv-row"><span>Angle</span><div class="nv-range" style="flex:1.4"><input type="range" min="0" max="360" step="5" data-nv-angle aria-label="Gradient angle"><output data-nv-angleout></output></div></div></div></div></section>' +
    '<section class="lab-sec"><h4>3. Text colors</h4><p>Leave a color on Auto and it is chosen for contrast with the background.</p><div class="nv-g">' +
    rows(['text', 'hover', 'hoverText', 'active', 'activeText']) +
    '</div></section>' +
    '<section class="lab-sec"><h4>4. Icon colors</h4><p>Icons follow the text color until you pick one.</p><div class="nv-g">' +
    rows(['icon', 'iconHover', 'iconActive']) +
    '</div></section>' +
    '<section class="lab-sec"><details class="nv-adv"><summary>Advanced: position, nested items, font and dividers</summary><div class="nv-adv-body">' +
    '<p class="lab-sub" style="margin-top:0">Position</p><div class="lab-nav" role="group" aria-label="Navbar position">' +
    NAV_MODES.map(n => labOpt('nav', n[0], '<b>' + n[1] + '</b>')).join('') +
    '</div>' +
    '<div class="nv-g" style="margin-top:14px"><h5>Nested items</h5>' +
    rows(['subText', 'subHover', 'subHoverText', 'subActive', 'subActiveText', 'subLine', 'subBg']) +
    '</div>' +
    '<div class="nv-g" style="margin-top:14px"><h5>Dividers</h5>' +
    rows(['border']) +
    '</div>' +
    '<p class="lab-sub">Nested hover style</p><div class="lab-grid c5" role="group" aria-label="Nested hover style">' +
    N.SUBS.map(s => labOpt('navsub', s[0], '<b>' + esc(s[1]) + '</b><small>' + esc(s[2]) + '</small>')).join(
      ''
    ) +
    '</div>' +
    '<p class="lab-sub">Font</p><div class="lab-grid c5" role="group" aria-label="Navbar font">' +
    LABX.FONTS.map(f =>
      labOpt(
        'navfont',
        f[0],
        '<span class="fnt" style="font-family:' +
          esc(f[2] || 'inherit') +
          '">Aa</span><b>' +
          (f[2] ? esc(f[1]) : 'Same as app') +
          '</b>'
      )
    ).join('') +
    '</div>' +
    '<p class="lab-sub">Font size</p><div class="nv-range" style="max-width:420px"><input type="range" min="11" max="18" step="0.5" data-nv-size aria-label="Navbar font size"><output data-nv-sizeout></output><button type="button" class="btn btn-xs" data-nv-sizeauto>Auto</button></div>' +
    '</div></details></section>' +
    '</div><aside class="nvs-side"><h4>Live preview</h4>' +
    nvPreview() +
    '<p class="nvs-note">Hover, active and nested items are shown at the same time.</p></aside></div>' +
    '</div>'
  );
}
function syncNavPage(root) {
  const L = LABX,
    c = L.state.navcfg;
  $$('[data-lab="nav"]', root).forEach(b =>
    b.setAttribute('aria-pressed', String(navMode() === b.dataset.v))
  );
  nvSync(root);
  const pre = L.NAV.PRESETS.find(p => p[0] === c.preset),
    fnt = (L.FONTS.find(f => f[0] === c.font) || [0, 'Same as app'])[1];
  const s = $('[data-lab-sum]', root);
  if (s)
    s.innerHTML =
      '<b>Navbar</b> · ' +
      esc(pre ? pre[1] : 'Custom') +
      ' · ' +
      esc(navMode()) +
      ' · ' +
      esc(c.font === 'lang' ? 'Same font as app' : fnt) +
      ' · ' +
      (c.size ? c.size + 'px' : 'auto size');
}

function syncLab() {
  $$('[data-lab-root]').forEach(syncLabRoot);
}
function syncLabRoot(root) {
  if (root.hasAttribute('data-lab-simple')) {
    syncNavPage(root);
    return;
  }
  const L = LABX,
    S = L.state,
    th = L.themeKey(),
    kag = S.lang === 'kagami',
    srcLang = L.effColor() === 'language';
  $$('[data-lab]', root).forEach(b =>
    b.setAttribute('aria-pressed', String(String(labCur(b.dataset.lab)) === b.dataset.v))
  );
  $$('[data-lang-card]', root).forEach(c => {
    const t = L.cardTokens(c.dataset.langCard, th);
    c.style.cssText =
      'background:' +
      t.bg +
      ';color:' +
      t.fg +
      ';font-family:' +
      t.font +
      ';--p:' +
      t.pri +
      ';--on:' +
      t.on +
      ';--sub:' +
      t.sub +
      ';--fl:' +
      t.fill +
      ';--bd:' +
      t.bd +
      ';--fg2:' +
      t.fg2 +
      ';--rr:' +
      t.r +
      ';border-radius:calc(' +
      t.r +
      ' + 4px);';
    const f = L.langFont(c.dataset.langCard).split(',')[0].replace(/["']/g, '');
    $('[data-fontname]', c).textContent =
      f === 'ui-sans-serif' ? 'System UI' : f === '-apple-system' ? 'SF Pro' : f;
  });
  nvSync(root);
  $$('[data-sizeinfo]', root).forEach(s => {
    const i = L.sizeInfo(S.lang, s.dataset.sizeinfo);
    s.textContent = i.h + 'px · ' + i.fs + 'px text';
  });
  $$('[data-role]', root).forEach(i => {
    i.style.background = L.roleColor(kag ? 'a' : S.lang, th, i.dataset.role);
  });
  $$('[data-lab="accent"]', root).forEach(b => {
    b.disabled = !srcLang;
  });
  $$('[data-lab="color"]', root).forEach(b => {
    b.disabled = kag;
  });
  $('[data-lab-colornote]', root).textContent = kag
    ? 'Kagami always uses your brand color. Pick another design language to use its palette and accent roles.'
    : srcLang
      ? 'Using the ' +
        L.LANGS.find(l => l[0] === S.lang)[1] +
        ' palette. Accent role: ' +
        L.ACCENTS.find(a => a[0] === S.accent)[1] +
        '.'
      : 'Using your brand color. Switch to the design language palette to choose an accent role.';
  const nm = (list, k) => (list.find(x => x[0] === k) || [k, k])[1],
    fam = S.font === 'lang' ? L.langFont(S.lang).split(',')[0].replace(/["']/g, '') : nm(L.FONTS, S.font);
  const si = L.sizeInfo(S.lang, S.size);
  $('[data-lab-sum]', root).innerHTML =
    '<b>' +
    esc(nm(L.LANGS, S.lang)) +
    '</b> · ' +
    esc(nm(LAB_MODES, labCur('mode'))) +
    ' · ' +
    esc(nm(L.SIZES, S.size)) +
    ' (' +
    si.h +
    'px) · ' +
    esc(nm(L.DENS, labCur('density'))) +
    ' · ' +
    esc(fam === 'ui-sans-serif' ? 'System UI' : fam === '-apple-system' ? 'SF Pro' : fam) +
    ' · radius ' +
    esc(nm(L.RADII, S.radius).toLowerCase()) +
    ' · ' +
    esc(nm(L.ELEVS, S.elev).toLowerCase()) +
    ' depth';
}
function labBind(page) {
  const root = $('[data-lab-root]', page);
  if (!root) return;
  root.addEventListener('click', e => {
    if (nvHandle(e, root)) {
      syncLab();
      return;
    }
    const c = e.target.closest('[data-lab-copy]');
    if (c) {
      const j = JSON.stringify(
        {
          lab: LABX.state,
          mode: labCur('mode'),
          density: labCur('density'),
          nav: labCur('nav'),
          brand: getBrand()
        },
        null,
        2
      );
      (navigator.clipboard ? navigator.clipboard.writeText(j) : Promise.reject()).then(
        () => toast('success', 'Settings copied', 'Appearance options are on your clipboard as JSON.'),
        () => toast('info', 'Copy not available', 'Your browser blocked clipboard access.')
      );
      return;
    }
    if (e.target.closest('[data-lab-reset]') && root.hasAttribute('data-lab-simple')) {
      LABX.NAV.set(Object.assign({}, LABX.NAV.DEF, { preset: 'default' }));
      setNavMode('left');
      syncLab();
      toast('success', 'Navbar reset', 'Default colors, icons, font and left position restored.');
      return;
    }
    if (e.target.closest('[data-lab-reset]')) {
      LABX.reset();
      applyDensity('comfortable');
      syncLab();
      toast(
        'success',
        'Design options reset',
        'Kagami language, medium size and comfortable density restored.'
      );
      return;
    }
    const b = e.target.closest('[data-lab]');
    if (!b || b.disabled) return;
    const k = b.dataset.lab,
      v = b.dataset.v;
    if (k === 'mode') setMode(v);
    else if (k === 'device') setDevice(v);
    else if (k === 'density') applyDensity(v);
    else if (k === 'nav') setNavMode(v);
    else LABX.set(k, v);
    syncLab();
  });
  root.addEventListener('input', e => {
    if (nvHandle(e, root)) syncLab();
  });
  syncLab();
}
LABX.subscribe(() => syncLab());
