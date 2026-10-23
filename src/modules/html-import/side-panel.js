/* =========================================================================
   HTML IMPORT · PREVIEW PANEL (SHOWCASE)
   The converted page fills the left of the screen; the Design lab
   settings stay open on the right, so every change to theme, design
   language, brand, density, size, fonts, radius or motion shows on the
   imported page at once. Download saves it with the settings applied.

   Toolbar: converted / original, light / dark / high contrast (preview
   only), desktop / tablet / mobile, import options, design settings.
   Footer: what the page is styled with, open in a new tab, download.
   Esc or the close button returns to the Import page.

   The frame has an empty sandbox: nothing in the page can run, submit
   forms or open windows, even in the original view.

   Provides: HI, HI_WIDTHS, HI_THEMES, hiTheme, themeKeyOfApp,
   hiCurrentDocument, hiOriginalDocument, segment, hiPanel, hiDrawnKey,
   hiStyleKey, hiSettingsOpen, hiSyncSettingsButton, hiOptionsMenu,
   openImportPanel, closeImportPanel, refreshImportPanel, hiDownload,
   hiOpenInTab
   ========================================================================= */
'use strict';

/** Module state, shared with page.js. Kept in memory: an import lasts for the session. */
const HI = {
  fileName: '', // name of the imported file
  fileSize: 0,
  source: '', // original HTML
  options: Object.assign({}, HI_DEFAULT_OPTIONS),
  result: null, // convertHtml() output
  view: 'converted', // 'converted' | 'original'
  theme: null, // 'light' | 'dark' | 'hc' for the preview only; null follows the app theme
  width: 'desktop',
  openedSettings: false // the preview opened the Design lab panel, so it closes it again
};

const HI_WIDTHS = [['desktop', 'Desktop', null], ['tablet', 'Tablet', 768], ['mobile', 'Mobile', 390]];
const HI_THEMES = [['light', 'Light'], ['dark', 'Dark'], ['hc', 'High contrast']];

/** The app's theme. */
function themeKeyOfApp() {
  const t = document.documentElement.getAttribute('data-theme');
  return t === 'dark' || t === 'hc' ? t : 'light';
}

/** Theme the converted page is shown and downloaded in. */
const hiTheme = () => HI.theme || themeKeyOfApp();

/**
 * The converted page as a full document.
 * @param {{preview?:boolean}} [o] preview: without scripts (the preview frame and "Open in new tab")
 */
const hiCurrentDocument = o => hiBuildDocument(HI.result, hiTheme(), o);

/** The file for the Original view: its own styles kept; scripts, frames and inline handlers removed (they could not run in the sandbox anyway). */
function hiOriginalDocument() {
  const doc = new DOMParser().parseFromString(HI.source, 'text/html');
  doc.querySelectorAll('script,noscript,iframe,frame,object,embed').forEach(n => n.remove());
  doc.querySelectorAll('*').forEach(n => {
    for (const a of Array.from(n.attributes)) if (/^on/i.test(a.name)) n.removeAttribute(a.name);
  });
  return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
}

/** A segmented control: one pressed button per group. */
const segment = (key, list, current) =>
  '<div class="hi-seg" role="group">' +
  list.map(([v, label]) => '<button type="button" data-hi-' + key + '="' + v + '" aria-pressed="' + (v === current) + '">' + esc(label) + '</button>').join('') +
  '</div>';

/** True while the Design lab settings panel is open. */
const hiSettingsOpen = () => !$('#labDock').hidden;

/** What the converted page depends on: the theme it shows and the resolved tokens. */
let hiDrawnKey = '';
const hiStyleKey = () => hiTheme() + JSON.stringify(dnThemeTokens());

/** Creates the panel once and wires its controls. */
function hiPanel() {
  let panel = $('#hiPanel');
  if (panel) return panel;
  panel = el(
    '<section class="hi-panel" id="hiPanel" aria-label="Import preview" hidden>' +
      '<div class="hi-head"><span class="doc-ico">' + icon('eye', 18) + '</span>' +
      '<div style="flex:1;min-width:0"><h3>Preview</h3><small data-hi-name></small></div>' +
      '<button class="btn btn-ghost btn-sm btn-icon" type="button" data-hi-close aria-label="Close preview">' + icon('x', 16) + '</button></div>' +
      '<div class="hi-bar"><div class="hi-bar-l" data-hi-bar></div><div class="hi-bar-r">' +
      btn('Options', 'filter', 'sm', 'type="button" data-hi-options aria-haspopup="menu"') +
      btn('Design settings', 'sliders', 'sm', 'type="button" data-hi-settings aria-pressed="false"') +
      '</div></div>' +
      '<div class="hi-stage"><iframe class="hi-frame" sandbox="" title="Imported page preview"></iframe></div>' +
      '<div class="hi-foot"><small data-hi-note></small><span class="spacer"></span>' +
      btn('Open in new tab', 'export', 'sm', 'type="button" data-hi-tab') +
      btn('Download', 'save', 'primary sm', 'type="button" data-hi-download') +
      '</div></section>'
  );
  document.body.append(panel);

  panel.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.hiClose !== undefined) return closeImportPanel();
    if (b.dataset.hiTab !== undefined) return hiOpenInTab();
    if (b.dataset.hiDownload !== undefined) return hiDownload();
    if (b.dataset.hiOptions !== undefined) return openMenu(b, hiOptionsMenu(), { align: 'right' });
    if (b.dataset.hiSettings !== undefined) {
      setLabDock(!hiSettingsOpen());
      HI.openedSettings = false; // the user decides from now on
      return hiSyncSettingsButton();
    }
    if (b.dataset.hiView) HI.view = b.dataset.hiView;
    else if (b.dataset.hiTheme) HI.theme = b.dataset.hiTheme;
    else if (b.dataset.hiWidth) HI.width = b.dataset.hiWidth;
    else return;
    refreshImportPanel();
  });

  // Esc closes the preview unless a dialog or menu is open.
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !panel.hidden && !modalStack.length && !menuEl) closeImportPanel();
  });
  // The preview belongs to the Import page.
  window.addEventListener('hashchange', () => {
    if (!panel.hidden && (!currentRoute || currentRoute.name !== 'import')) closeImportPanel();
  });
  // Follow theme, brand and design lab changes. Building the page switches data-theme briefly
  // (dnThemeTokens), so redraw only when the resolved styleguide really changed.
  let timer = 0;
  const watch = new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (panel.hidden) return;
      hiSyncSettingsButton();
      if (hiStyleKey() !== hiDrawnKey) refreshImportPanel();
    }, 120);
  });
  watch.observe(document.documentElement, { attributes: true });
  watch.observe(document.head, { childList: true, subtree: true, characterData: true });
  return panel;
}

function hiSyncSettingsButton() {
  const b = $('[data-hi-settings]');
  if (b) b.setAttribute('aria-pressed', String(hiSettingsOpen()));
}

/** Import options, also on the Import page: output mode, then the toggles that apply to it. */
function hiOptionsMenu() {
  const item = (name, label) => ({
    label,
    icon: HI.options[name] ? 'check' : null,
    onClick: () => hiSetOption(name, !HI.options[name])
  });
  const modes = HI_MODES.map(([value, label]) => ({
    label,
    icon: HI.options.mode === value ? 'check' : null,
    onClick: () => hiSetOption('mode', value)
  }));
  return [{ label: 'DOWNLOAD AS', disabled: true }, ...modes, '-', item('keepInlineStyles', 'Keep inline styles')].concat(
    HI.options.mode === 'clean' ? [item('keepClasses', 'Keep original class names')] : []
  );
}

/** Shows the preview with the current import, and the Design lab settings beside it on wide screens. */
function openImportPanel() {
  if (!HI.result) return;
  const panel = hiPanel();
  panel.hidden = false;
  document.documentElement.setAttribute('data-hipanel', 'open');
  if (innerWidth > 1100 && !hiSettingsOpen()) {
    setLabDock(true);
    HI.openedSettings = true;
  }
  hiSyncSettingsButton();
  refreshImportPanel();
  $('[data-hi-close]', panel).focus();
}

/** Returns to the Import page; closes the settings panel if the preview opened it. */
function closeImportPanel() {
  const panel = $('#hiPanel');
  if (!panel || panel.hidden) return;
  panel.hidden = true;
  document.documentElement.removeAttribute('data-hipanel');
  if (HI.openedSettings && hiSettingsOpen()) setLabDock(false);
  HI.openedSettings = false;
  const opener = $('[data-hi-preview]');
  if (opener) opener.focus();
}

/** Redraws the toolbar, the note and the frame from HI. */
function refreshImportPanel() {
  const panel = $('#hiPanel');
  if (!panel || !HI.result) return;
  const converted = HI.view === 'converted';
  $('[data-hi-name]', panel).textContent = HI.fileName + (HI.result.title ? ' · ' + HI.result.title : '');
  $('[data-hi-bar]', panel).innerHTML =
    segment('view', [['converted', 'Converted'], ['original', 'Original']], HI.view) +
    (converted ? segment('theme', HI_THEMES, hiTheme()) : '') +
    segment('width', HI_WIDTHS, HI.width);
  const lang = LABX.LANGS.find(l => l[0] === LABX.state.lang);
  $('[data-hi-note]', panel).textContent = converted
    ? 'Live: ' + dnName() + ' v' + (dnMeta.version || '1.0.0') + ' · ' + (lang ? lang[1] : LABX.state.lang) + ' · ' +
      HI_THEMES.find(t => t[0] === hiTheme())[1] + ' · ' + HI_MODES.find(m => m[0] === HI.result.mode)[1]
    : 'Original file, scripts blocked';
  const frame = $('.hi-frame', panel);
  const w = HI_WIDTHS.find(x => x[0] === HI.width)[2];
  frame.style.width = w ? w + 'px' : '100%';
  frame.srcdoc = converted ? hiCurrentDocument({ preview: true }) : hiOriginalDocument();
  hiDrawnKey = hiStyleKey();
  $('[data-hi-tab]', panel).disabled = !converted;
  $('[data-hi-download]', panel).disabled = !converted;
}

/**
 * Saves the page as previewed: current styleguide, design lab settings and theme. In original mode it is
 * your whole file, scripts included, with the new styles in place of its own.
 */
function hiDownload() {
  if (!HI.result) return;
  const name = hiFileName(HI.fileName, hiTheme(), HI.result.mode);
  dnDownload(name, 'text/html', hiCurrentDocument());
  toast(
    'success',
    'Download ready',
    'Saved ' + name + (HI.result.mode === 'original' ? ': your file, restyled with ' : ' in your ') + dnName() + ' styleguide.'
  );
}

/** Opens the page in a new tab, without scripts (the tab shares this app's origin). */
function hiOpenInTab() {
  if (!HI.result) return;
  const url = URL.createObjectURL(new Blob([hiCurrentDocument({ preview: true })], { type: 'text/html' }));
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
