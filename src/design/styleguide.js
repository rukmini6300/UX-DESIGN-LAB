/* =========================================================================
   STYLEGUIDE
   Step 3: styleguide details, resolved tokens per theme, contrast checks,
   foundations and component guidelines.

   Provides: DN_META_KEY, DN_META0, dnMeta, dnMetaSave, dnName, DN_THEMES,
   DN_NON_COLOR, SG_GROUPS, SG_PAIRS, SG_TYPE, SG_SPACE, sgCamel, sgHex,
   sgRatio, dnThemeTokens, dnAllThemes, sgChecks, SG_MAP, sgVars, SG_CSS,
   sgFoundations, sgGuidelines, sgIntro
   ========================================================================= */
'use strict';

/* ---------- step 3: styleguide (foundations + guidelines) and more export formats ---------- */
const DN_META_KEY = 'kagami-design-meta',
  DN_META0 = { name: 'Design system', version: '1.0.0', desc: '' };
let dnMeta = (() => {
  try {
    return Object.assign({}, DN_META0, JSON.parse(store(DN_META_KEY) || '{}'));
  } catch (e) {
    return Object.assign({}, DN_META0);
  }
})();
const dnMetaSave = () => store(DN_META_KEY, JSON.stringify(dnMeta));
const dnName = () => (dnMeta.name || '').trim() || DN_META0.name;
const DN_THEMES = [
  ['light', 'Light'],
  ['dark', 'Dark'],
  ['hc', 'High contrast']
];
const DN_NON_COLOR = /^--(shadow|r$|r-|font|mono|ic-sw|lab-|ctl-|ui-fs)/;
const SG_GROUPS = [
  ['Brand', ['--primary', '--primary-hover', '--primary-soft', '--primary-text', '--on-primary']],
  ['Surfaces', ['--bg', '--surface', '--surface-secondary', '--surface-hover', '--surface-sunken']],
  ['Text and borders', ['--text', '--text-muted', '--text-subtle', '--border', '--border-strong']],
  [
    'Status',
    [
      '--success',
      '--success-soft',
      '--success-text',
      '--warning-soft',
      '--warning-text',
      '--danger',
      '--danger-soft',
      '--danger-text',
      '--purple',
      '--purple-soft',
      '--purple-text',
      '--neutral-soft',
      '--neutral-text'
    ]
  ]
];
const SG_PAIRS = [
  ['Text on surface', '--text', '--surface'],
  ['Muted text on surface', '--text-muted', '--surface'],
  ['Subtle text on surface', '--text-subtle', '--surface'],
  ['Text on page', '--text', '--bg'],
  ['On-primary on primary', '--on-primary', '--primary'],
  ['Primary text on soft', '--primary-text', '--primary-soft'],
  ['Success text on soft', '--success-text', '--success-soft'],
  ['Warning text on soft', '--warning-text', '--warning-soft'],
  ['Danger text on soft', '--danger-text', '--danger-soft']
];
const SG_TYPE = [
  ['Display', 30, 700],
  ['Title 1', 24, 650],
  ['Title 2', 20, 650],
  ['Title 3', 18, 600],
  ['Body large', 16, 400],
  ['Body', 14, 400],
  ['Small', 13, 400],
  ['Caption', 12, 500]
];
const SG_SPACE = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64];
const sgCamel = k => k.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
function sgHex(c) {
  const m = String(c).match(/^rgba?\(([^)]+)\)$/);
  let p;
  if (m)
    p = m[1]
      .split(/[,\s/]+/)
      .filter(Boolean)
      .map(Number);
  else {
    try {
      const x =
        sgHex.cv ||
        (sgHex.cv = document.createElement('canvas').getContext('2d', { willReadFrequently: true }));
      x.clearRect(0, 0, 1, 1);
      x.fillStyle = '#000';
      x.fillStyle = c;
      x.fillRect(0, 0, 1, 1);
      const d = x.getImageData(0, 0, 1, 1).data;
      p = [d[0], d[1], d[2], d[3] / 255];
    } catch (e) {
      return null;
    }
  }
  if (p.length < 3 || p.some(isNaN)) return null;
  const h = n => Math.round(n).toString(16).padStart(2, '0').toUpperCase();
  return '#' + h(p[0]) + h(p[1]) + h(p[2]) + (p.length > 3 && p[3] < 1 ? h(p[3] * 255) : '');
}
function sgRatio(a, b) {
  const ok = /^#[0-9a-f]{6}/i;
  if (!ok.test(a) || !ok.test(b)) return null;
  const L = h => {
    const n = [1, 3, 5]
      .map(i => parseInt(h.slice(i, i + 2), 16) / 255)
      .map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * n[0] + 0.7152 * n[1] + 0.0722 * n[2];
  };
  const x = L(a),
    y = L(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
/* every token resolved for one theme (colors become hex); the theme attribute is switched and restored synchronously */
function dnThemeTokens(th) {
  const D = document.documentElement,
    prev = D.getAttribute('data-theme'),
    pr = document.createElement('i'),
    out = {};
  if (th) D.setAttribute('data-theme', th);
  pr.style.display = 'none';
  D.append(pr);
  const cs = getComputedStyle(D);
  DN_TOKENS.forEach(k => {
    const raw = cs.getPropertyValue(k).trim();
    if (!raw) return;
    if (DN_NON_COLOR.test(k)) {
      out[k] = raw;
      return;
    }
    pr.style.color = '';
    pr.style.color = 'var(' + k + ')';
    out[k] = sgHex(getComputedStyle(pr).color) || raw;
  });
  pr.remove();
  if (th) D.setAttribute('data-theme', prev);
  return out;
}
const dnAllThemes = () => DN_THEMES.map(([t, l]) => ({ key: t, label: l, tokens: dnThemeTokens(t) }));
function sgChecks(tok) {
  return SG_PAIRS.filter(p => tok[p[1]] && tok[p[2]]).map(p => {
    const r = sgRatio(tok[p[1]], tok[p[2]]);
    return {
      label: p[0],
      fg: tok[p[1]],
      bg: tok[p[2]],
      ratio: r,
      grade: r == null ? 'n/a' : r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA large' : 'Fail'
    };
  });
}
/* CSS custom properties the styleguide markup reads; in the app they alias the ERP tokens, in an export they carry resolved values */
const SG_MAP = {
  '--sg-bg': '--bg',
  '--sg-surface': '--surface',
  '--sg-sunken': '--surface-sunken',
  '--sg-text': '--text',
  '--sg-muted': '--text-muted',
  '--sg-border': '--border',
  '--sg-primary': '--primary',
  '--sg-primary-soft': '--primary-soft',
  '--sg-r': '--r',
  '--sg-r-md': '--r-md',
  '--sg-font': '--font',
  '--sg-mono': '--mono'
};
const sgVars = tok =>
  Object.keys(SG_MAP)
    .map(k => (tok ? (tok[SG_MAP[k]] ? k + ':' + tok[SG_MAP[k]] + ';' : '') : k + ':var(' + SG_MAP[k] + ');'))
    .join('');
const SG_CSS =
  '.sg{font-family:var(--sg-font);color:var(--sg-text)}.sg *{box-sizing:border-box}.sg-sec{background:var(--sg-surface);border:1px solid var(--sg-border);border-radius:var(--sg-r-md);padding:20px;margin:0 0 20px}.sg-sec>h2{font-size:18px;font-weight:650;margin:0 0 4px}.sg-sec>p{margin:0 0 16px;color:var(--sg-muted);font-size:13px}.sg-sec h3{font-size:12px;font-weight:650;letter-spacing:.05em;text-transform:uppercase;color:var(--sg-muted);margin:20px 0 10px}.sg-sw{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}.sg-swatch{border:1px solid var(--sg-border);border-radius:var(--sg-r);overflow:hidden;background:var(--sg-surface)}.sg-swatch i{display:block;height:56px;border-bottom:1px solid var(--sg-border)}.sg-swatch div{padding:8px 10px;font-size:12px;line-height:1.4}.sg-swatch b{display:block;font-weight:600;color:var(--sg-text)}.sg-swatch code,.sg code{font-family:var(--sg-mono);font-size:11px;color:var(--sg-muted)}.sg-tbl{width:100%;border-collapse:collapse;font-size:13px}.sg-tbl th,.sg-tbl td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--sg-border);vertical-align:middle}.sg-tbl th{font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:var(--sg-muted);font-weight:650}.sg-chip{display:inline-flex;align-items:center;justify-content:center;min-width:44px;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:650;background:var(--sg-sunken);color:var(--sg-text)}.sg-chip.ok{background:#12B76A22;color:#067647}.sg-chip.bad{background:#F0443822;color:#B42318}.sg-demo{display:inline-flex;align-items:center;justify-content:center;min-width:60px;height:34px;padding:0 10px;border-radius:6px;background:var(--sg-primary-soft);border:1px solid var(--sg-primary);font-size:12px}.sg-type{display:flex;align-items:baseline;gap:16px;padding:8px 0;border-bottom:1px solid var(--sg-border)}.sg-type>code{width:130px;flex:none}.sg-type>span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sg-bars{display:flex;flex-direction:column;gap:8px}.sg-bar{display:flex;align-items:center;gap:12px;font-size:12px}.sg-bar code{width:64px;flex:none}.sg-bar i{display:block;height:14px;background:var(--sg-primary);border-radius:3px;opacity:.85}.sg-boxes{display:flex;flex-wrap:wrap;gap:16px}.sg-box{width:112px;text-align:center;font-size:12px}.sg-box i{display:block;height:64px;background:var(--sg-sunken);border:1px solid var(--sg-border);margin-bottom:6px}.sg-motion{display:flex;align-items:center;gap:16px;flex-wrap:wrap}.sg-track{position:relative;width:240px;height:36px;background:var(--sg-sunken);border-radius:var(--sg-r);border:1px solid var(--sg-border)}.sg-track i{position:absolute;left:4px;top:4px;width:26px;height:26px;border-radius:50%;background:var(--sg-primary);transition:transform var(--sg-dur,200ms) var(--sg-ease,ease)}.sg-track:hover i{transform:translateX(206px)}.sg-guide{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}.sg-g{border:1px solid var(--sg-border);border-radius:var(--sg-r);padding:12px 14px;background:var(--sg-surface)}.sg-g b{display:block;font-size:14px;margin-bottom:2px}.sg-g p{margin:0 0 8px;font-size:12px;color:var(--sg-muted)}.sg-tags{display:flex;flex-wrap:wrap;gap:4px}.sg-tags span{font-size:11px;padding:1px 8px;border-radius:999px;background:var(--sg-sunken);border:1px solid var(--sg-border)}.sg-meta{display:grid;grid-template-columns:2fr 1fr;gap:12px}.sg-meta label{display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--sg-muted)}.sg-meta label.w{grid-column:1/-1}@media (max-width:700px){.sg-meta{grid-template-columns:1fr}}';
function sgFoundations(tok) {
  const T = k => tok[k] || '';
  const colors = SG_GROUPS.map(([g, ks]) => {
    const L = ks.filter(k => T(k));
    return L.length
      ? '<h3>' +
          esc(g) +
          '</h3><div class="sg-sw">' +
          L.map(
            k =>
              '<div class="sg-swatch"><i style="background:' +
              esc(T(k)) +
              '"></i><div><b>' +
              esc(k.slice(2)) +
              '</b><code>' +
              esc(T(k)) +
              '</code></div></div>'
          ).join('') +
          '</div>'
      : '';
  }).join('');
  const checks = sgChecks(tok),
    chk =
      '<h3>Contrast (WCAG)</h3><table class="sg-tbl"><thead><tr><th>Pair</th><th>Sample</th><th>Ratio</th><th>Grade</th></tr></thead><tbody>' +
      checks
        .map(
          c =>
            '<tr><td>' +
            esc(c.label) +
            '</td><td><span class="sg-demo" style="background:' +
            esc(c.bg) +
            ';color:' +
            esc(c.fg) +
            ';border-color:' +
            esc(c.fg) +
            '">Aa 123</span></td><td>' +
            (c.ratio == null ? '—' : c.ratio.toFixed(2) + ':1') +
            '</td><td><span class="sg-chip ' +
            (c.grade === 'Fail' ? 'bad' : c.grade === 'n/a' ? '' : 'ok') +
            '">' +
            c.grade +
            '</span></td></tr>'
        )
        .join('') +
      '</tbody></table>';
  const type =
    '<div>' +
    SG_TYPE.map(
      t =>
        '<div class="sg-type"><code>' +
        t[0] +
        ' · ' +
        t[1] +
        '/' +
        t[2] +
        '</code><span style="font-size:' +
        t[1] +
        'px;font-weight:' +
        t[2] +
        '">The quick brown fox jumps over the lazy dog</span></div>'
    ).join('') +
    '</div><h3>Families</h3><table class="sg-tbl"><tbody><tr><td>Sans</td><td><code>' +
    esc(T('--font')) +
    '</code></td><td style="font-family:var(--sg-font)">Inventory 0123456789</td></tr><tr><td>Mono</td><td><code>' +
    esc(T('--mono')) +
    '</code></td><td style="font-family:var(--sg-mono)">SKU-00421 · 1,284.50</td></tr></tbody></table>';
  const space =
    '<div class="sg-bars">' +
    SG_SPACE.map(
      n => '<div class="sg-bar"><code>' + n + 'px</code><i style="width:' + n * 4 + 'px"></i></div>'
    ).join('') +
    '</div>' +
    (T('--ctl-h')
      ? '<h3>Controls</h3><table class="sg-tbl"><tbody><tr><td>Control height</td><td><code>' +
        esc(T('--ctl-h')) +
        '</code></td></tr>' +
        (T('--ctl-px')
          ? '<tr><td>Control padding</td><td><code>' + esc(T('--ctl-px')) + '</code></td></tr>'
          : '') +
        (T('--ui-fs')
          ? '<tr><td>UI font size</td><td><code>' + esc(T('--ui-fs')) + '</code></td></tr>'
          : '') +
        '</tbody></table>'
      : '');
  const rad =
    '<div class="sg-boxes">' +
    [
      ['--r-sm', 'Small'],
      ['--r', 'Default'],
      ['--r-md', 'Medium'],
      ['--r-lg', 'Large']
    ]
      .filter(r => T(r[0]))
      .map(
        r =>
          '<div class="sg-box"><i style="border-radius:' +
          esc(T(r[0])) +
          '"></i><b>' +
          r[1] +
          '</b><br><code>' +
          esc(T(r[0])) +
          '</code></div>'
      )
      .join('') +
    '</div>';
  const sh =
    '<div class="sg-boxes">' +
    [
      ['--shadow-sm', 'Small'],
      ['--shadow-md', 'Medium'],
      ['--shadow-lg', 'Large']
    ]
      .filter(r => T(r[0]))
      .map(
        r =>
          '<div class="sg-box"><i style="background:var(--sg-surface);box-shadow:' +
          esc(T(r[0])) +
          '"></i><b>' +
          r[1] +
          '</b></div>'
      )
      .join('') +
    '</div>';
  const mo =
    '<div class="sg-motion" style="--sg-dur:' +
    esc(T('--lab-dur') || '200ms') +
    ';--sg-ease:' +
    esc(T('--lab-ease') || 'ease') +
    '"><div class="sg-track" title="Hover to play"><i></i></div><div><code>duration ' +
    esc(T('--lab-dur') || '200ms') +
    '</code><br><code>easing ' +
    esc(T('--lab-ease') || 'ease') +
    '</code><br><code>icon stroke ' +
    esc(T('--ic-sw') || '1.75') +
    '</code></div></div>';
  const sec = (id, h, p, b) =>
    '<section class="sg-sec" id="sg-' + id + '"><h2>' + h + '</h2><p>' + p + '</p>' + b + '</section>';
  return (
    sec('color', 'Color', 'Semantic tokens resolved for the active theme.', colors + chk) +
    sec('type', 'Typography', 'Type scale and font families.', type) +
    sec(
      'space',
      'Spacing and sizing',
      'Four-point spacing scale and control metrics for the active density.',
      space
    ) +
    sec('radius', 'Corner radius', 'Shape language.', rad) +
    sec('elev', 'Elevation', 'Shadows used for cards, menus and dialogs.', sh) +
    sec('motion', 'Motion', 'Timing and easing applied to transitions.', mo)
  );
}
function sgGuidelines() {
  const sel = COMP_GROUPS.map(g => ({ g: g.g, items: g.items.filter(i => dnGet(i.s).length) })).filter(
    g => g.items.length
  );
  if (!sel.length)
    return '<section class="sg-sec"><h2>Component guidelines</h2><p>No variants selected. Pick variants in Build to document components here.</p></section>';
  return (
    '<section class="sg-sec" id="sg-comp"><h2>Component guidelines</h2><p>When to use each component and which variants are part of this system.</p>' +
    sel
      .map(
        g =>
          '<h3>' +
          esc(g.g) +
          '</h3><div class="sg-guide">' +
          g.items
            .map(i => {
              const by = {};
              dnGet(i.s).forEach(id => {
                const v = dnVariants(i.s).find(x => x[0] === id);
                if (v) (by[v[1]] = by[v[1]] || []).push(v[2]);
              });
              return (
                '<div class="sg-g"><b>' +
                esc(i.n) +
                '</b><p>' +
                esc(i.d) +
                '</p><div class="sg-tags">' +
                DN_SECS.filter(s => by[s[0]])
                  .map(
                    s =>
                      '<span title="' +
                      esc(by[s[0]].join(', ')) +
                      '">' +
                      esc(s[1]) +
                      ' · ' +
                      by[s[0]].length +
                      '</span>'
                  )
                  .join('') +
                '</div></div>'
              );
            })
            .join('') +
          '</div>'
      )
      .join('') +
    '</section>'
  );
}
const sgIntro = () =>
  '<h1>' +
  esc(dnName()) +
  '</h1><p class="kgd-sub">v' +
  esc(dnMeta.version || '1.0.0') +
  (dnMeta.desc ? ' · ' + esc(dnMeta.desc) : '') +
  '</p>';
