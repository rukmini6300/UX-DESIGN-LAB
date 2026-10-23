/* =========================================================================
   PREVIEW AND EXPORT
   Step 2: preview, snapshot, HTML exports, the workflow mock-up and the
   Download workflow app.

   Provides: DN_TOKENS, dnSnapshot, dnDownload, dnCollect, dnBuildDoc,
   WF_DEFAULT, WF_SCREENS, WF_ICONS, dnBuildWorkflow, DN_LOCAL, DN_SOFT,
   dnPreset, dnBuildApp, DN_BUILT, dnHandOffWorkflow, dnServeHandOff,
   dnExport, dnPreview
   ========================================================================= */
'use strict';

/* ---------- step 2: preview and download ---------- */
const DN_TOKENS = [
  '--primary',
  '--primary-hover',
  '--primary-soft',
  '--primary-text',
  '--on-primary',
  '--bg',
  '--surface',
  '--surface-secondary',
  '--surface-hover',
  '--surface-sunken',
  '--text',
  '--text-muted',
  '--text-subtle',
  '--border',
  '--border-strong',
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
  '--neutral-text',
  '--shadow-sm',
  '--shadow-md',
  '--shadow-lg',
  '--r-sm',
  '--r',
  '--r-md',
  '--r-lg',
  '--font',
  '--mono',
  '--ic-sw',
  '--lab-dur',
  '--lab-ease',
  '--ctl-h',
  '--ui-fs',
  '--ctl-px'
];
function dnSnapshot() {
  const cs = getComputedStyle(document.documentElement),
    tokens = {};
  DN_TOKENS.forEach(k => {
    const v = cs.getPropertyValue(k).trim();
    if (v) tokens[k] = v;
  });
  const S = LABX.state,
    lang = LABX.LANGS.find(l => l[0] === S.lang);
  return {
    name: dnName(),
    version: dnMeta.version || '1.0.0',
    description: dnMeta.desc || '',
    exported: new Date().toISOString(),
    settings: {
      language: S.lang,
      languageName: lang ? lang[1] : S.lang,
      mode: labCur('mode'),
      theme: LABX.themeKey(),
      size: S.size,
      density: labCur('density'),
      color: S.color,
      accent: S.accent,
      font: S.font,
      mono: S.mono,
      radius: S.radius,
      elevation: S.elev,
      motion: S.motion,
      iconStroke: S.icons,
      brand: getBrand()
    },
    tokens,
    components: COMP_GROUPS.map(g => ({
      group: g.g,
      items: g.items
        .filter(i => dnGet(i.s).length)
        .map(i => ({
          name: i.n,
          slug: i.s,
          variants: dnGet(i.s).map(id => {
            const v = dnVariants(i.s).find(x => x[0] === id);
            return { id, section: v[1], label: v[2] };
          })
        }))
    })).filter(g => g.items.length)
  };
}
function dnDownload(name, type, text) {
  const a = document.createElement('a'),
    u = URL.createObjectURL(new Blob([text], { type }));
  a.href = u;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 1500);
}
/* every selected component is rendered once in a hidden frame and its variant markup is collected */
function dnCollect(slugs) {
  return new Promise(resolve => {
    const out = {},
      queue = slugs.slice(),
      host = document.createElement('div');
    host.style.cssText =
      'position:fixed;left:-99999px;top:0;width:1280px;height:900px;overflow:hidden;visibility:hidden';
    document.body.append(host);
    let active = 0;
    const finish = () => {
      if (!queue.length && !active) {
        window.removeEventListener('message', on);
        host.remove();
        resolve(out);
      }
    };
    const frames = new Map();
    function on(e) {
      const m = e.data;
      if (!m || m.type !== 'kagami-lab-figs') return;
      if (m.sprite && !out.__sprite) out.__sprite = m.sprite;
      for (const [slug, f] of frames) {
        if (f.contentWindow === e.source && !out[slug]) {
          out[slug] = m.items;
          frames.delete(slug);
          f.remove();
          active--;
          next();
        }
      }
    }
    window.addEventListener('message', on);
    function next() {
      while (active < 4 && queue.length) {
        const slug = queue.shift(),
          f = document.createElement('iframe');
        active++;
        frames.set(slug, f);
        f.style.cssText = 'width:1280px;height:900px;border:0';
        f.addEventListener('load', () => {
          setTimeout(() => {
            try {
              f.contentWindow.postMessage({ type: 'kagami-lab-figs' }, '*');
            } catch (x) {}
          }, 400);
        });
        setTimeout(() => {
          if (frames.has(slug)) {
            out[slug] = out[slug] || [];
            frames.delete(slug);
            f.remove();
            active--;
            next();
          }
        }, 15000);
        f.src = dnURL(slug, false);
        host.append(f);
      }
      finish();
    }
    next();
  });
}
async function dnBuildDoc(guide) {
  const snap = dnSnapshot(),
    slugs = DN_ALL.filter(c => dnGet(c.s).length).map(c => c.s),
    data = await dnCollect(slugs),
    kag = LABX.state.lang === 'kagami';
  const css =
    (window.KG_LAB_CSS || '') +
    compCss(kag) +
    (guide
      ? SG_CSS +
        dnAllThemes()
          .map(t => 'html[data-theme="' + t.key + '"] .sg{' + sgVars(t.tokens) + '}')
          .join('')
      : '') +
    'html:root body{margin:0}.kgd{max-width:1240px;margin:0 auto;padding:32px 24px 64px}.kgd h1{font-size:28px;margin:0 0 4px}.kgd .kgd-sub{margin:0 0 24px;opacity:.7}.kgd h2.kgd-g{font-size:13px;text-transform:uppercase;letter-spacing:.06em;opacity:.6;margin:32px 0 12px}.kgd section.kgd-c{margin:0 0 28px}.kgd section.kgd-c>h3{font-size:18px;margin:0 0 12px;display:flex;gap:10px;align-items:baseline}.kgd section.kgd-c>h3 small{font-weight:400;opacity:.6;font-size:13px}.kgd .vx__rec{display:none}';
  const body = snap.components
    .map(
      g =>
        '<h2 class="kgd-g">' +
        esc(g.group) +
        '</h2>' +
        g.items
          .map(
            i =>
              '<section class="kgd-c"><h3>' +
              esc(i.name) +
              '<small>' +
              i.variants.length +
              ' variants</small></h3><div class="vgrid">' +
              (data[i.slug] || []).map(x => x.html).join('') +
              '</div></section>'
          )
          .join('')
    )
    .join('');
  return (
    '<!doctype html>\n<html lang="en" data-theme="' +
    LABX.themeKey() +
    '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' +
    esc(dnName()) +
    ' · ' +
    esc(snap.settings.languageName) +
    '</title>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Public+Sans:wght@400;500;600;700&family=Open+Sans:wght@400;600;700&family=Inter:wght@300;400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap">\n<style>' +
    css +
    '</style></head>\n<body>' +
    (data.__sprite || '') +
    '<main class="kgd"><h1>' +
    esc(dnName()) +
    '</h1><p class="kgd-sub">' +
    esc(snap.settings.languageName) +
    ' · ' +
    esc(snap.settings.theme) +
    ' · size ' +
    esc(snap.settings.size) +
    ' · ' +
    esc(snap.settings.density) +
    ' · ' +
    snap.components.reduce((a, g) => a + g.items.length, 0) +
    ' components, ' +
    dnTotal() +
    ' variants</p>' +
    (guide
      ? '<div class="sg">' +
        sgFoundations(dnThemeTokens()) +
        sgGuidelines() +
        '</div><h2 class="kgd-g">Components</h2>'
      : '') +
    body +
    '</main></body></html>\n'
  );
}
/* ---------- Inventory workflow app export: nav bar + left sidebar + one screen per inventory module, built from the selected components ---------- */
const WF_DEFAULT = ['cards', 'tables'];
const WF_SCREENS = {
  inventory: ['statistic', 'charts', 'alerts', 'progress'],
  workflow: ['steppers', 'timeline', 'kanban'],
  products: ['search', 'filters', 'tables', 'pagination', 'badges'],
  'product-create': ['forms', 'inputs', 'dropdowns', 'upload', 'wizard'],
  categories: ['tree-view', 'list', 'chips'],
  units: ['tables', 'inputs'],
  warehouses: ['cards', 'avatars', 'badges'],
  locations: ['tree-view', 'data-grid'],
  'warehouse-stock': ['tabs', 'statistic', 'tables'],
  stock: ['tabs', 'statistic', 'tables', 'progress'],
  ledger: ['filters', 'data-grid', 'pagination'],
  'stock-adjustment': ['forms', 'modals', 'alerts'],
  'stock-transfer': ['steppers', 'tables', 'drawers'],
  'stock-count': ['wizard', 'progress', 'tables'],
  grn: ['tables', 'steppers', 'badges'],
  'grn-create': ['forms', 'upload', 'date-picker', 'steppers'],
  'goods-issue': ['tables', 'tabs', 'badges'],
  'issue-create': ['forms', 'dropdowns', 'drawers'],
  reorder: ['tables', 'slider', 'switch'],
  'low-stock': ['banner', 'alerts', 'tables', 'progress'],
  expiry: ['calendar', 'notifications', 'tables'],
  'reports/valuation': ['charts', 'tables', 'date-picker'],
  'reports/movement': ['charts', 'filters', 'tables'],
  'reports/aging': ['charts', 'tables'],
  'reports/warehouse': ['charts', 'statistic', 'tables'],
  audit: ['timeline', 'tables', 'filters']
};
const WF_ICONS = {
  Overview: 'grid',
  'Inventory Workflow': 'steps',
  Products: 'tag',
  Warehouses: 'home',
  'Stock Management': 'layers',
  'Goods Receipt': 'download',
  'Goods Issue': 'upload',
  'Inventory Planning': 'clock',
  Reports: 'chart',
  'Audit Log': 'lock'
};
async function dnBuildWorkflow() {
  const snap = dnSnapshot(),
    slugs = DN_ALL.filter(c => dnGet(c.s).length).map(c => c.s),
    data = await dnCollect(slugs),
    kag = LABX.state.lang === 'kagami';
  const sec = (await loadInventory()).nav.find(n => n.id === 'sec-inv').children;
  const first = Object.values(data).find(a => Array.isArray(a) && a[0]),
    sm = first && first[0].html.match(/class="lab-stage ([^"]*)"/),
    sc = (sm ? sm[1] : 'sys-f').replace(/\bvx__stage\b/g, '').trim();
  const ico = n => '<svg class="ds-ic" aria-hidden="true"><use href="#i-' + n + '"/></svg>';
  const screens = [];
  sec.forEach(it => {
    if (it.route) screens.push({ route: it.route, label: it.label, group: null });
    else if (it.children)
      it.children.forEach(c => screens.push({ route: c[1], label: c[0], group: it.label }));
  });
  const body = screens
    .map(s => {
      const want = WF_SCREENS[s.route] || WF_DEFAULT,
        have = want.filter(x => data[x] && data[x].length),
        hid = 'h-' + s.route.replace(/\W/g, '-');
      const blocks = have
        .map((x, i) => {
          const its = data[x].slice(0, i === 0 ? 2 : 1);
          return (
            '<section class="wf-b"><h3>' +
            esc(COMP_BY[x].n) +
            '</h3><div class="vgrid">' +
            its.map(v => v.html).join('') +
            '</div></section>'
          );
        })
        .join('');
      return (
        '<section class="wf-screen" data-route="' +
        esc(s.route) +
        '" aria-labelledby="' +
        hid +
        '"><nav class="wf-crumbs" aria-label="Breadcrumb">Inventory' +
        (s.group ? ' / ' + esc(s.group) : '') +
        ' / <b>' +
        esc(s.label) +
        '</b></nav><h1 id="' +
        hid +
        '">' +
        esc(s.label) +
        '</h1><p class="wf-sub">Built from your selected components: ' +
        (have.length
          ? have.map(x => esc(COMP_BY[x].n)).join(', ')
          : 'none of this screen’s components are selected') +
        '.</p>' +
        (blocks ||
          '<p class="wf-empty">Select ' +
            want.map(x => esc(COMP_BY[x].n)).join(', ') +
            ' in the Design builder to fill this screen.</p>') +
        '</section>'
      );
    })
    .join('');
  const item = s =>
    '<button type="button" class="ds-side__item" data-route="' +
    esc(s.route) +
    '">' +
    (s.ic ? ico(s.ic) : '') +
    '<span>' +
    esc(s.label) +
    '</span></button>';
  const side = sec
    .map(it => {
      if (it.route) return item({ route: it.route, label: it.label, ic: WF_ICONS[it.label] || 'file' });
      const id = 'g-' + it.id;
      return (
        '<button type="button" class="ds-side__item" aria-expanded="false" aria-controls="' +
        id +
        '" data-group>' +
        ico(WF_ICONS[it.label] || 'file') +
        '<span>' +
        esc(it.label) +
        '</span><svg class="ds-ic ds-side__chev" aria-hidden="true"><use href="#i-chev-right"/></svg></button><div class="ds-side__sub" id="' +
        id +
        '" hidden>' +
        it.children.map(c => item({ route: c[1], label: c[0] })).join('') +
        '</div>'
      );
    })
    .join('');
  const css =
    (window.KG_LAB_CSS || '') +
    compCss(kag) +
    'html:root body{margin:0}.wf-app{min-height:100vh;display:flex;flex-direction:column;background:var(--canvas,var(--bg));color:var(--fg);font-family:var(--font)}.wf-top{position:sticky;top:0;z-index:20}.wf-body{flex:1;display:flex;align-items:flex-start;min-width:0}.wf-side{position:sticky;top:var(--hd-h,48px);height:calc(100vh - var(--hd-h,48px));overflow:auto;width:264px;max-width:264px;flex:none;border-radius:0;box-sizing:border-box}.wf-app.is-collapsed .wf-side{width:64px;align-items:center}.wf-app.is-collapsed .wf-side .ds-side__item{width:40px;padding:0;justify-content:center}.wf-app.is-collapsed .wf-side .ds-side__item>span,.wf-app.is-collapsed .wf-side .ds-side__chev,.wf-app.is-collapsed .wf-side .ds-side__sub,.wf-app.is-collapsed .wf-side .ds-side__head{display:none}.wf-main{flex:1;min-width:0;padding:24px 32px 64px;max-width:1440px}.wf-screen{display:none}.wf-screen.on{display:block}.wf-crumbs{font-size:13px;color:var(--fg3);margin-bottom:6px}.wf-crumbs b{color:var(--fg2);font-weight:600}.wf-screen h1{font-size:26px;margin:0 0 4px}.wf-sub{margin:0 0 24px;color:var(--fg2);font-size:14px}.wf-b{margin:0 0 28px}.wf-b>h3{font-size:16px;margin:0 0 10px}.wf-empty{padding:24px;border:1px dashed var(--bd);border-radius:var(--r);color:var(--fg3)}.wf-burger{display:none}.wf-top .ds-hnav a[aria-disabled]{opacity:.5;pointer-events:none}.wf-app .vx__rec{display:none}@media(max-width:860px){.wf-burger{display:inline-flex}.wf-side{position:fixed;left:0;top:var(--hd-h,48px);z-index:15;transform:translateX(-100%);transition:transform .2s;box-shadow:0 8px 32px rgba(0,0,0,.25)}.wf-app.is-open .wf-side{transform:none}.wf-app.is-collapsed .wf-side{width:264px;align-items:stretch}.wf-main{padding:16px}.wf-top .ds-header__end .ds-control{display:none}}';
  const js =
    '(function(){var app=document.querySelector(".wf-app"),S=[].slice.call(document.querySelectorAll(".wf-screen")),B=[].slice.call(document.querySelectorAll("button[data-route]"));function show(){var r=decodeURIComponent((location.hash||"").replace(/^#\\/?/,""))||"inventory";var cur=S.filter(function(s){return s.dataset.route===r})[0]||S[0];S.forEach(function(s){s.classList.toggle("on",s===cur)});B.forEach(function(b){var on=b.dataset.route===cur.dataset.route;if(on){b.setAttribute("aria-current","page");var p=b.closest(".ds-side__sub");if(p){p.hidden=false;var g=document.querySelector("[aria-controls=\\""+p.id+"\\"]");if(g)g.setAttribute("aria-expanded","true")}}else b.removeAttribute("aria-current")});document.title=cur.querySelector("h1").textContent+" · "+document.body.dataset.app;window.scrollTo(0,0);app.classList.remove("is-open")}B.forEach(function(b){b.addEventListener("click",function(){location.hash="#/"+b.dataset.route})});[].slice.call(document.querySelectorAll("[data-group]")).forEach(function(g){g.addEventListener("click",function(){var v=g.getAttribute("aria-expanded")!=="true";g.setAttribute("aria-expanded",v);document.getElementById(g.getAttribute("aria-controls")).hidden=!v})});document.querySelector("[data-wf-menu]").addEventListener("click",function(){if(matchMedia("(max-width:860px)").matches)app.classList.toggle("is-open");else app.classList.toggle("is-collapsed")});window.addEventListener("hashchange",show);show()})();';
  const name = dnName();
  return (
    '<!doctype html>\n<html lang="en" data-theme="' +
    LABX.themeKey() +
    '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' +
    esc(name) +
    ' · Inventory workflow</title>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Public+Sans:wght@400;500;600;700&family=Open+Sans:wght@400;600;700&family=Inter:wght@300;400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap">\n<style>' +
    css +
    '</style></head>\n<body data-app="' +
    esc(name) +
    '">' +
    (data.__sprite || '') +
    '<div class="' +
    sc +
    ' wf-app"><header class="ds-header wf-top"><button type="button" class="ds-btn ds-ibtn ds-btn--subtle wf-burger" aria-label="Toggle menu" data-wf-menu>' +
    ico('menu') +
    '</button><span class="ds-logo"><i aria-hidden="true"></i>' +
    esc(name) +
    '</span><nav class="ds-hnav" aria-label="Primary"><a href="#/inventory" aria-current="page">Inventory</a><a href="#" aria-disabled="true">Purchasing</a><a href="#" aria-disabled="true">Sales</a></nav><div class="ds-header__end"><div class="ds-control ds-control--search ds-s" style="width:200px">' +
    ico('search') +
    '<input type="search" aria-label="Search" placeholder="Search"></div><button type="button" class="ds-btn ds-ibtn ds-btn--subtle" aria-label="Notifications">' +
    ico('bell') +
    '</button><span class="ds-av ds-s" data-c="1" role="img" aria-label="Maya Ruiz">MR</span></div></header><div class="wf-body"><nav class="ds-side wf-side" aria-label="Inventory"><span class="ds-side__head">Inventory</span>' +
    side +
    '</nav><main class="wf-main">' +
    body +
    '</main></div></div><script>' +
    js +
    '</script></body></html>\n'
  );
}
/* ---------- Workflow download: the working inventory app in your theme and design lab settings, with your styleguide as a page ---------- */
const DN_LOCAL = /^kagami-(labdock|labtab|sidebar|inventory)$/,
  DN_SOFT = ['kagami-theme', 'kagami-mode'];
/* every saved design setting (brand, design lab, density, navbar, selected variants, styleguide details); theme and mode stay switchable */
function dnPreset() {
  const P = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (/^kagami-/.test(k) && !DN_LOCAL.test(k)) P[k] = localStorage.getItem(k);
    }
  } catch (e) {}
  P['kagami-inventory'] = 'on';
  return P;
}
/**
 * Builds the workflow app: this single-file page with the user's settings baked in.
 * @param {{preset?:Object, name?:string}} [from] settings sent by the multi-file page (see dnHandOffWorkflow)
 */
async function dnBuildApp(from) {
  if (!KG_SRC)
    throw new Error(
      'Download workflow works from the single-file build. Run "node build.js" and use dist/lab5.html'
    );
  if (KG_SRC.indexOf('id="kg-inventory-module"') < 0)
    throw new Error('This page has no built-in inventory module');
  const preset = (from && from.preset) || dnPreset();
  const name = (from && from.name) || dnName();
  const js = s => s.replace(/<\/script/gi, '<\\/script').replace(/<\!--/g, '<\\!--');
  const boot =
    '(function(){var P=' +
    JSON.stringify(preset) +
    ',S=' +
    JSON.stringify(DN_SOFT) +
    ',g=Storage.prototype.getItem;' +
    'Storage.prototype.getItem=function(k){var own=false;try{own=this===window.localStorage}catch(e){}if(own&&Object.prototype.hasOwnProperty.call(P,k)){var v=S.indexOf(k)<0?null:g.call(this,k);return v==null?P[k]:v}return g.call(this,k)};' +
    'window.KG_EXPORT={name:' +
    JSON.stringify(name) +
    '};document.documentElement.setAttribute("data-export","")})();';
  const put = (s, at, add) => {
    const i = s.indexOf(at);
    if (i < 0) throw new Error('Page source is missing ' + at);
    return s.slice(0, i) + add + s.slice(i + at.length);
  };
  let out = KG_SRC.replace(/<html[^>]*>/, '<html lang="en" data-theme="light">').replace(
    /<style id="kagami-(brand|lab)">[\s\S]*?<\/style>/g,
    ''
  );
  out = put(out, '<meta charset="utf-8">', '<meta charset="utf-8">\n<script>' + js(boot) + '</script>');
  out = out.replace(
    /<title>[^<]*<\/title>/,
    () => '<title>' + esc(name) + ' · Inventory workflow</title>'
  );
  return out;
}

/* ---------- Multi-file page: hand the workflow download to the single-file build ----------
   index.html is spread over many files and cannot copy itself. It opens dist/lab5.html in a new tab
   and sends it this page's settings; that tab builds and saves the file (dnServeHandOff). */
const DN_BUILT = 'dist/lab5.html';

/** Multi-file side. Must run inside the click handler (before any await) so the new tab is not blocked. */
function dnHandOffWorkflow(file) {
  const tab = window.open(DN_BUILT + '?download=workflow#/design/styleguide', '_blank');
  if (!tab) {
    toast('error', 'Pop-up blocked', 'Allow pop-ups for this page, then try Download workflow again.');
    return;
  }
  toast('info', 'Building workflow', 'Packing it in a new tab from ' + DN_BUILT + '…');
  let answered = false;
  const onMessage = e => {
    if (e.source !== tab || !e.data || e.data.type !== 'kagami-wf-ready') return;
    answered = true;
    window.removeEventListener('message', onMessage);
    tab.postMessage({ type: 'kagami-wf-settings', preset: dnPreset(), name: dnName(), file }, '*');
  };
  window.addEventListener('message', onMessage);
  setTimeout(() => {
    if (answered) return;
    window.removeEventListener('message', onMessage);
    toast('error', 'Workflow download unavailable', 'Could not open ' + DN_BUILT + '. Run "node build.js" first.');
  }, 10000);
}

/** Single-file side: when opened by the multi-file page, wait for its settings, then build and save. */
function dnServeHandOff() {
  if (!KG_SRC || !window.opener || new URLSearchParams(location.search).get('download') !== 'workflow') return;
  const onMessage = async e => {
    if (e.source !== window.opener || !e.data || e.data.type !== 'kagami-wf-settings') return;
    window.removeEventListener('message', onMessage);
    try {
      dnDownload(e.data.file, 'text/html', await dnBuildApp(e.data));
      toast('success', 'Download ready', 'Saved ' + e.data.file + '. You can close this tab.');
    } catch (err) {
      toast('error', 'Export failed', String((err && err.message) || err));
    }
  };
  window.addEventListener('message', onMessage);
  window.opener.postMessage({ type: 'kagami-wf-ready' }, '*');
}
async function dnExport(kind, btn, copy) {
  const s = dnSnapshot(),
    stamp =
      (s.settings.languageName || 'design').toLowerCase().replace(/[^a-z0-9]+/g, '-') +
      '-' +
      s.settings.theme,
    base =
      dnName()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'design-system';
  if (kind === 'app') {
    if (!KG_SRC) {
      dnHandOffWorkflow(base + '-workflow-' + stamp + '.html');
      return;
    }
    toast('info', 'Building workflow', 'Packing the inventory app with your theme and styleguide…');
    let h;
    try {
      h = await dnBuildApp();
    } catch (e) {
      toast('error', 'Export failed', String((e && e.message) || e));
      return;
    }
    dnDownload(base + '-workflow-' + stamp + '.html', 'text/html', h);
    toast(
      'success',
      'Download ready',
      'Saved the inventory workflow app with your theme, design lab settings and styleguide.'
    );
    return;
  }
  if (kind === 'workflow') {
    if (!dnTotal()) {
      toast('warning', 'Nothing selected', 'Pick at least one variant first.');
      return;
    }
    toast('info', 'Building inventory workflow', 'Rendering ' + dnTotal() + ' variants…');
    let h;
    try {
      h = await dnBuildWorkflow();
    } catch (e) {
      toast('error', 'Export failed', String((e && e.message) || e));
      return;
    }
    dnDownload(base + '-inventory-workflow-' + stamp + '.html', 'text/html', h);
    toast(
      'success',
      'Download ready',
      'Saved the inventory workflow app as HTML with your theme and selected components.'
    );
    return;
  }
  if (['html', 'guide', 'open', 'openguide', 'json'].includes(kind) && !dnTotal()) {
    toast('warning', 'Nothing selected', 'Pick at least one variant first.');
    return;
  }
  const T = dnText(kind);
  if (T) {
    if (copy) {
      const ok = await dnCopy(T.text);
      toast(
        ok ? 'success' : 'error',
        ok ? 'Copied' : 'Copy failed',
        ok ? T.file + ' is on your clipboard.' : 'Your browser blocked clipboard access.'
      );
      return;
    }
    dnDownload(base + '-' + T.file, T.type, T.text);
    toast('success', 'Download ready', 'Saved ' + T.file + '.');
    return;
  }
  if (kind === 'json') {
    dnDownload(base + '-' + stamp + '.json', 'application/json', JSON.stringify(s, null, 2));
    toast('success', 'Download ready', 'Saved selection and tokens as JSON.');
    return;
  }
  const guide = kind === 'guide' || kind === 'openguide',
    open = kind === 'open' || kind === 'openguide';
  toast(
    'info',
    'Building ' + (guide ? 'styleguide' : 'design system'),
    'Rendering ' + dnTotal() + ' variants…'
  );
  let html;
  try {
    html = await dnBuildDoc(guide);
  } catch (e) {
    toast('error', 'Export failed', String((e && e.message) || e));
    return;
  }
  if (open) {
    const u = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    window.open(u, '_blank');
    setTimeout(() => URL.revokeObjectURL(u), 60000);
    return;
  }
  dnDownload(base + (guide ? '-styleguide-' : '-') + stamp + '.html', 'text/html', html);
  toast(
    'success',
    'Download ready',
    'Saved ' + (guide ? 'styleguide' : 'design system') + ' as HTML with your current design lab settings.'
  );
}
function dnPreview() {
  const comps = DN_ALL.filter(c => dnGet(c.s).length);
  const sections = COMP_GROUPS.map(g => {
    const its = g.items.filter(i => dnGet(i.s).length);
    return its.length
      ? '<h2 class="ds-gh dn-gh2">' +
          esc(g.g) +
          '</h2>' +
          its
            .map(
              i =>
                '<section class="dn-comp"><header><h3>' +
                esc(i.n) +
                '</h3><span class="badge b-info">' +
                dnGet(i.s).length +
                ' variants</span><a class="link" href="#/design/' +
                i.s +
                '">Edit</a></header><div class="cmp-stage dn-stage"><div class="cmp-load">' +
                icon('refresh', 16) +
                '<span>Loading ' +
                esc(i.n) +
                '…</span></div><iframe class="dn-frame" data-src="' +
                i.s +
                '" title="' +
                esc(i.n) +
                ' selected variants"></iframe></div></section>'
            )
            .join('')
      : '';
  }).join('');
  return {
    title: 'Your design system',
    nav: '',
    crumbs: [['Design', 'design'], ['Preview']],
    sub: 'The final design system with your selected variants, in the current theme and design lab settings. Change them from the header, then download.',
    actions:
      '<button type="button" class="btn btn-sm" data-dn-open>' +
      icon('export', 16) +
      '<span>Open in new tab</span></button><button type="button" class="btn btn-primary btn-sm" data-dn-dl aria-haspopup="menu">' +
      icon('save', 16) +
      '<span>Download</span></button>',
    body:
      dnTabs('preview') +
      (comps.length
        ? sections
        : '<section class="card"><div class="card-body"><div class="empty"><h4>No variants selected</h4><p>Go back to Build and pick at least one variant.</p><a class="btn btn-primary" href="#/design">Open builder</a></div></div></section>'),
    mount(page) {
      dnBind(page);
      const dl = $('[data-dn-dl]', page);
      if (dl) dl.onclick = () => openMenu(dl, dnDownloadItems(), { align: 'right' });
      const op = $('[data-dn-open]', page);
      if (op) op.onclick = () => dnExport('open');
    }
  };
}
