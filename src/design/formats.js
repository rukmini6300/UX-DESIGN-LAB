/* =========================================================================
   EXPORT FORMATS
   Text exports (CSS, SCSS, Tailwind, W3C tokens, Markdown), selection
   import / reset and the download menu.

   Provides: dnText, dnCopy, dnImport, dnReset, dnMoreMenu, DN_FORMATS,
   dnDownloadItems, dnCopyItems
   ========================================================================= */
'use strict';

/* ---------- text export formats ---------- */
function dnText(kind) {
  const NL = '\n',
    s = dnSnapshot(),
    all = dnAllThemes(),
    light = all[0].tokens,
    keys = Object.keys(light),
    head = dnName() + ' v' + (dnMeta.version || '1.0.0');
  if (kind === 'css') {
    const blocks = all.map(
      (t, i) =>
        (i ? ':root[data-theme="' + t.key + '"]' : ':root,:root[data-theme="light"]') +
        '{' +
        NL +
        Object.keys(t.tokens)
          .filter(k => !i || !DN_NON_COLOR.test(k))
          .map(k => '  ' + k + ': ' + t.tokens[k] + ';')
          .join(NL) +
        NL +
        '}'
    );
    return {
      file: 'design-tokens.css',
      type: 'text/css',
      text:
        '/* ' +
        head +
        ' · design tokens (light, dark, high contrast) */' +
        NL +
        NL +
        blocks.join(NL + NL) +
        NL
    };
  }
  if (kind === 'scss') {
    const vars = o =>
        Object.keys(o)
          .map(k => '$' + k.slice(2) + ': ' + o[k] + ';')
          .join(NL),
      map = t =>
        '$tokens-' +
        t.key +
        ': (' +
        NL +
        Object.keys(t.tokens)
          .filter(k => !DN_NON_COLOR.test(k))
          .map(k => '  "' + k.slice(2) + '": ' + t.tokens[k])
          .join(',' + NL) +
        NL +
        ');';
    return {
      file: '_design-tokens.scss',
      type: 'text/x-scss',
      text:
        '// ' +
        head +
        ' · design tokens' +
        NL +
        '// Variables hold the light theme; maps hold every theme for runtime switching.' +
        NL +
        NL +
        vars(light) +
        NL +
        NL +
        all.map(map).join(NL + NL) +
        NL
    };
  }
  if (kind === 'tailwind') {
    const col = {},
      rad = {},
      sh = {};
    keys.forEach(k => {
      if (DN_NON_COLOR.test(k)) return;
      col[k.slice(2)] = 'var(' + k + ')';
    });
    [
      ['--r-sm', 'sm'],
      ['--r', 'DEFAULT'],
      ['--r-md', 'md'],
      ['--r-lg', 'lg']
    ].forEach(r => {
      if (light[r[0]]) rad[r[1]] = 'var(' + r[0] + ')';
    });
    [
      ['--shadow-sm', 'sm'],
      ['--shadow-md', 'md'],
      ['--shadow-lg', 'lg']
    ].forEach(r => {
      if (light[r[0]]) sh[r[1]] = 'var(' + r[0] + ')';
    });
    const cfg = {
      theme: {
        extend: {
          colors: col,
          borderRadius: rad,
          boxShadow: sh,
          fontFamily: { sans: ['var(--font)'], mono: ['var(--mono)'] }
        }
      }
    };
    return {
      file: 'tailwind.design-tokens.js',
      type: 'text/javascript',
      text:
        '/* ' +
        head +
        ' */' +
        NL +
        '/* Load design-tokens.css first: colors reference its CSS variables, so dark and high-contrast themes work without extra classes. */' +
        NL +
        'module.exports = ' +
        JSON.stringify(cfg, null, 2) +
        ';' +
        NL
    };
  }
  if (kind === 'dtcg') {
    const doc = {
      $description: head + ' · W3C design tokens (modes under $extensions.mode)',
      color: {},
      radius: {},
      shadow: {},
      font: {},
      motion: {}
    };
    keys.forEach(k => {
      const n = sgCamel(k);
      if (!DN_NON_COLOR.test(k)) {
        const mode = {};
        all.slice(1).forEach(t => {
          if (t.tokens[k]) mode[t.key] = t.tokens[k];
        });
        doc.color[n] = { $type: 'color', $value: light[k], $extensions: { mode } };
      } else if (/^--r(-|$)/.test(k)) doc.radius[n] = { $type: 'dimension', $value: light[k] };
      else if (/^--shadow/.test(k)) doc.shadow[n] = { $type: 'shadow', $value: light[k] };
      else if (/^--(font|mono)$/.test(k)) doc.font[n] = { $type: 'fontFamily', $value: light[k] };
      else if (k === '--lab-dur') doc.motion.duration = { $type: 'duration', $value: light[k] };
      else if (k === '--lab-ease') doc.motion.easing = { $type: 'cubicBezier', $value: light[k] };
      else doc.motion[n] = { $value: light[k] };
    });
    Object.keys(doc).forEach(g => {
      if (g[0] !== '$' && !Object.keys(doc[g]).length) delete doc[g];
    });
    return { file: 'design-tokens.json', type: 'application/json', text: JSON.stringify(doc, null, 2) + NL };
  }
  if (kind === 'md') {
    const L = [];
    L.push(
      '# ' + dnName(),
      '',
      'Version ' + (dnMeta.version || '1.0.0') + (dnMeta.desc ? ' · ' + dnMeta.desc : ''),
      '',
      '_Exported ' + s.exported.slice(0, 10) + ' from the Kagami design lab._',
      ''
    );
    L.push('## Settings', '', '| Setting | Value |', '| --- | --- |');
    Object.keys(s.settings)
      .filter(k => k !== 'brand')
      .forEach(k => L.push('| ' + k + ' | ' + s.settings[k] + ' |'));
    L.push('', '## Color', '');
    SG_GROUPS.forEach(([g, ks]) => {
      const K = ks.filter(k => light[k]);
      if (!K.length) return;
      L.push('### ' + g, '', '| Token | Light | Dark | High contrast |', '| --- | --- | --- | --- |');
      K.forEach(k =>
        L.push('| `' + k + '` | ' + all.map(t => '`' + (t.tokens[k] || '-') + '`').join(' | ') + ' |')
      );
      L.push('');
    });
    L.push('### Contrast', '', '| Pair | Light | Dark | High contrast |', '| --- | --- | --- | --- |');
    const cc = all.map(t => sgChecks(t.tokens));
    cc[0].forEach((c, i) =>
      L.push(
        '| ' +
          c.label +
          ' | ' +
          cc
            .map(a => (a[i] ? (a[i].ratio == null ? '-' : a[i].ratio.toFixed(2) + ' ' + a[i].grade) : '-'))
            .join(' | ') +
          ' |'
      )
    );
    L.push('', '## Typography', '', '| Style | Size | Weight |', '| --- | --- | --- |');
    SG_TYPE.forEach(t => L.push('| ' + t[0] + ' | ' + t[1] + 'px | ' + t[2] + ' |'));
    L.push(
      '',
      'Sans: `' + light['--font'] + '`  ',
      'Mono: `' + light['--mono'] + '`',
      '',
      '## Spacing',
      '',
      'Scale: ' + SG_SPACE.map(n => n + 'px').join(', ') + (light['--ctl-h'] ? '  ' : ''),
      light['--ctl-h']
        ? 'Control height `' + light['--ctl-h'] + '`, padding `' + (light['--ctl-px'] || '-') + '`'
        : '',
      '',
      '## Radius and elevation',
      ''
    );
    ['--r-sm', '--r', '--r-md', '--r-lg', '--shadow-sm', '--shadow-md', '--shadow-lg'].forEach(k => {
      if (light[k]) L.push('- `' + k + '`: `' + light[k] + '`');
    });
    L.push(
      '',
      '## Motion',
      '',
      '- Duration `' + (light['--lab-dur'] || '-') + '`',
      '- Easing `' + (light['--lab-ease'] || '-') + '`',
      '- Icon stroke `' + (light['--ic-sw'] || '-') + '`',
      '',
      '## Components',
      ''
    );
    if (!s.components.length) L.push('_No variants selected._');
    s.components.forEach(g => {
      L.push('### ' + g.group, '');
      g.items.forEach(i => {
        const c = COMP_BY[i.slug];
        L.push('#### ' + i.name, '', c.d, '');
        DN_SECS.forEach(([k, l]) => {
          const v = i.variants.filter(x => x.section === k);
          if (v.length) L.push('- **' + l + ':** ' + v.map(x => x.label).join(', '));
        });
        L.push('');
      });
    });
    return {
      file: 'styleguide.md',
      type: 'text/markdown',
      text: L.join(NL).replace(/\n{3,}/g, NL + NL) + NL
    };
  }
  return null;
}
async function dnCopy(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {}
  try {
    const t = document.createElement('textarea');
    t.value = text;
    t.style.cssText = 'position:fixed;opacity:0';
    document.body.append(t);
    t.select();
    const ok = document.execCommand('copy');
    t.remove();
    return ok;
  } catch (e) {
    return false;
  }
}
/* ---------- selection import and reset ---------- */
function dnImport() {
  const f = document.createElement('input');
  f.type = 'file';
  f.accept = 'application/json,.json';
  f.onchange = () => {
    const file = f.files && f.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        if (!d || !Array.isArray(d.components)) throw new Error('This is not a design system JSON export.');
        const next = {};
        let n = 0;
        DN_ALL.forEach(c => (next[c.s] = []));
        d.components.forEach(g =>
          (g.items || []).forEach(i => {
            if (!COMP_BY[i.slug]) return;
            const ok = new Set(dnVariants(i.slug).map(v => v[0]));
            next[i.slug] = (i.variants || []).map(v => v.id).filter(id => ok.has(id));
            n += next[i.slug].length;
          })
        );
        dnSel = next;
        dnSave();
        if (d.name) dnMeta.name = String(d.name);
        if (d.version) dnMeta.version = String(d.version);
        if (d.description != null) dnMeta.desc = String(d.description);
        dnMetaSave();
        toast(
          'success',
          'Selection imported',
          n + ' variants restored. Theme and lab settings are not changed.'
        );
        renderRoute();
      } catch (e) {
        toast('error', 'Import failed', String((e && e.message) || e));
      }
    };
    r.readAsText(file);
  };
  f.click();
}
function dnReset() {
  dnSel = {};
  dnSave();
  toast('info', 'Selection reset', 'Every component is back to its starter ' + DN_START + ' variants.');
  renderRoute();
}
function dnMoreMenu(btn) {
  openMenu(
    btn,
    [
      { label: 'Import selection (JSON)', icon: 'inbox', onClick: dnImport },
      { label: 'Export selection (JSON)', icon: 'book', onClick: () => dnExport('json') },
      { label: 'Reset to starter variants', icon: 'undo', onClick: dnReset }
    ],
    { align: 'right' }
  );
}
const DN_FORMATS = [
  ['app', 'Workflow app with styleguide (HTML)', 'flow'],
  ['workflow', 'Workflow mock-up from components (HTML)', 'grid'],
  ['guide', 'Styleguide (HTML)', 'book'],
  ['html', 'Design system (HTML)', 'file'],
  ['md', 'Styleguide (Markdown)', 'file'],
  ['json', 'Selection and tokens (JSON)', 'book'],
  ['css', 'Design tokens (CSS, all themes)', 'palette'],
  ['scss', 'Design tokens (SCSS)', 'palette'],
  ['tailwind', 'Tailwind config', 'palette'],
  ['dtcg', 'Design tokens (W3C JSON)', 'palette']
];
const dnDownloadItems = () =>
  DN_FORMATS.map(f => ({ label: f[1], icon: f[2], onClick: () => dnExport(f[0]) }));
const dnCopyItems = () =>
  DN_FORMATS.filter(f => dnText(f[0]) && f[0] !== 'json').map(f => ({
    label:
      'Copy ' +
      f[1].replace(/ \(.*\)/, '') +
      (f[0] === 'css' || f[0] === 'scss' || f[0] === 'dtcg' ? ' tokens' : ''),
    icon: 'copy',
    onClick: () => dnExport(f[0], null, true)
  }));
