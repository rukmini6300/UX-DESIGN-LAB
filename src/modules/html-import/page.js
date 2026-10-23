/* =========================================================================
   HTML IMPORT · PAGE
   #/import, step 4 of the Design builder. Import a page three ways
   (choose or drop a file, paste HTML, try the sample), set the import
   options, read what was mapped and removed, then open the preview
   showcase and download it. Replaces the loading route that manifest.js
   registered.

   Provides: HI_MAX_BYTES, hiConvert, hiSetOption, hiModeHTML, hiReadFile, hiLoad,
   hiPasteDialog, hiResultHTML, hiStyleguideHTML, #/import
   ========================================================================= */
'use strict';

/** Largest file accepted. */
const HI_MAX_BYTES = 5 * 1024 * 1024;

/** Converts HI.source with the current options. */
function hiConvert() {
  HI.result = HI.source ? convertHtml(HI.source, HI.options) : null;
}

/** Changes an import option from the page or the preview's Options menu: re-converts and redraws both. */
function hiSetOption(name, on) {
  HI.options[name] = on;
  if (HI.source) hiConvert();
  // The output mode changes which options apply, so the page is drawn again; toggles update in place.
  if (name === 'mode') {
    if (currentRoute && currentRoute.name === 'import') renderRoute();
  } else {
    const toggle = $('#page [name="' + name + '"]');
    if (toggle) toggle.checked = on;
    const result = $('#hiResult .card-body');
    if (result && HI.result) result.innerHTML = hiResultHTML();
  }
  refreshImportPanel();
}

/** Output mode choice for the Options card. */
function hiModeHTML() {
  return (
    '<div class="hi-modes" role="radiogroup" aria-label="Download as">' +
    HI_MODES.map(([value, label, hint]) =>
      '<label class="hi-mode"><input type="radio" name="hiMode" value="' + value + '"' + (HI.options.mode === value ? ' checked' : '') +
        '><span><b>' + esc(label) + '</b><small>' + esc(hint) + '</small></span></label>'
    ).join('') +
    '</div>'
  );
}

/** Paste HTML: a dialog with a text box; Convert takes the text like a file. */
function hiPasteDialog() {
  const body = el(
    '<div><label class="lbl" for="hiPaste">HTML</label>' +
      '<textarea class="textarea" id="hiPaste" rows="14" spellcheck="false" style="font-family:var(--mono);font-size:12.5px" ' +
      'placeholder="&lt;!DOCTYPE html&gt;&#10;&lt;html&gt;…&lt;/html&gt;"></textarea>' +
      '<p class="muted mt-8" style="font-size:12.5px">A whole page or just a fragment. Scripts are removed during conversion.</p></div>'
  );
  openModal({
    type: 'edit',
    icon: 'file',
    title: 'Paste HTML',
    size: 'lg',
    body,
    actions: [
      { label: 'Cancel' },
      {
        label: 'Convert',
        variant: 'primary',
        onClick: () => {
          const text = $('#hiPaste', body).value;
          if (!/<[a-z!]/i.test(text)) {
            toast('error', 'No HTML found', 'Paste markup such as <div>…</div> or a whole page.');
            return false;
          }
          setTimeout(() => hiLoad('pasted-page.html', text), 0); // after the dialog has closed
        }
      }
    ]
  });
}

/** Reads a File, checks it, converts it and redraws. */
function hiReadFile(file) {
  if (!file) return;
  if (file.size > HI_MAX_BYTES) {
    toast('error', 'File too large', file.name + ' is ' + (file.size / 1048576).toFixed(1) + ' MB. The limit is 5 MB.');
    return;
  }
  if (!/\.(html?|xhtml)$/i.test(file.name) && !/html/.test(file.type)) {
    toast('error', 'Not an HTML file', 'Choose a .html or .htm file.');
    return;
  }
  file.text().then(
    text => {
      if (!/<[a-z!]/i.test(text)) {
        toast('error', 'No HTML found', file.name + ' does not contain any HTML markup.');
        return;
      }
      hiLoad(file.name, text, file.size);
    },
    () => toast('error', 'Could not read the file', 'Try choosing it again.')
  );
}

/** Takes a page into the module, converts it and opens the preview. */
function hiLoad(name, text, size) {
  Object.assign(HI, { fileName: name, source: text, fileSize: size || new Blob([text]).size, view: 'converted' });
  hiConvert();
  renderRoute();
  openImportPanel();
  toast('success', 'Converted', name + ' now uses your ' + dnName() + ' styleguide.');
}

/** The result card: file, counts, cleanup and warnings. */
function hiResultHTML() {
  const r = HI.result.report, keepFile = r.mode === 'original';
  const stat = (label, n) => '<div><small>' + label + '</small><b>' + fmtN(n) + '</b></div>';
  const chips = (list, word, tone) => list.filter(([k]) => r[k]).map(([k, w]) => badge(pl(r[k], w) + ' ' + word, tone(k))).join('');
  const risky = k => (k === 'scripts' || k === 'handlers' || k === 'unsafeUrls' ? 'danger' : 'neutral');
  const runnable = [['scripts', 'script'], ['handlers', 'event handler'], ['embeds', 'embedded frame'], ['unsafeUrls', 'javascript: link']];
  const styling = [['stylesheets', 'stylesheet'], ['inlineStyles', 'inline style'], ['legacy', 'legacy markup item']];
  const changes = keepFile
    ? chips([['stylesheets', 'stylesheet']], 'replaced by the styleguide', () => 'info') +
      chips(styling.slice(1), 'removed', () => 'neutral') +
      chips(runnable, 'kept as in your file', () => 'neutral')
    : chips(runnable.concat(styling), 'removed', risky);
  return (
    '<div class="hi-file"><span class="doc-ico">' + icon('file', 18) + '</span><div style="flex:1;min-width:0"><b>' + esc(HI.fileName) +
    '</b><small>' + (HI.fileSize / 1024).toFixed(1) + ' KB' + (HI.result.title ? ' · ' + esc(HI.result.title) : '') +
    '</small></div>' + btn('Remove', 'x', 'ghost sm', 'type="button" data-hi-clear') + '</div>' +
    '<p class="hi-h">Mapped to the design system</p><div class="hi-stats">' +
    stat('Buttons', r.buttons) + stat('Form fields', r.fields) + stat('Checkboxes and radios', r.choices) + stat('Tables', r.tables) +
    stat('Cards', r.cards) + stat('Badges', r.badges) + stat('Alerts', r.alerts) + stat('Links', r.links) + '</div>' +
    '<p class="hi-h">' + (keepFile ? 'Your file' : 'Cleaned up') + '</p><div class="hi-clean">' +
    (changes || '<span class="muted">Nothing needed changing.</span>') +
    '</div>' +
    (keepFile
      ? '<p class="muted mt-8" style="font-size:12.5px">Download keeps your whole file (head, structure, ids, classes, scripts) and replaces its look with the styleguide.</p>'
      : '') +
    (HI.result.warnings.length
      ? '<div class="alert alert-warning mt-16">' + icon('alert', 16) + '<span>' + HI.result.warnings.map(esc).join('<br>') + '</span></div>'
      : '')
  );
}

/** The styleguide the page is converted to. */
function hiStyleguideHTML() {
  const tok = dnThemeTokens();
  const lang = LABX.LANGS.find(l => l[0] === LABX.state.lang);
  const sw = ['--primary', '--surface', '--text', '--success', '--danger'].filter(k => tok[k]);
  return (
    '<div class="hi-sg"><div class="hi-sw">' + sw.map(k => '<i title="' + k + '" style="background:' + esc(tok[k]) + '"></i>').join('') +
    '</div><b>' + esc(dnName()) + '</b><span class="badge">v' + esc(dnMeta.version || '1.0.0') + '</span></div>' +
    '<dl class="hi-dl"><dt>Design language</dt><dd>' + esc(lang ? lang[1] : LABX.state.lang) + '</dd>' +
    '<dt>App theme</dt><dd>' + esc((HI_THEMES.find(t => t[0] === themeKeyOfApp()) || [])[1] || '') + '</dd>' +
    '<dt>Font</dt><dd>' + esc((tok['--font'] || '').split(',')[0].replace(/["']/g, '')) + '</dd>' +
    '<dt>Corner radius</dt><dd>' + esc(tok['--r-md'] || '') + '</dd></dl>' +
    '<p class="muted mt-8" style="font-size:12.5px">Change the theme, brand or design lab and the preview follows. ' +
    '<a class="link" href="#/design/styleguide">Open styleguide</a></p>'
  );
}

ROUTES.import = () => ({
  title: 'Import HTML',
  nav: 'import',
  crumbs: [['Design', 'design'], ['Import HTML']],
  sub:
    'Convert an HTML page to your design system, then preview it with the Design lab settings beside it and download it. ' +
    'Scripts and the page’s own styles are removed; buttons, fields, tables, cards, badges and alerts take your styleguide.',
  actions: HI.result
    ? btn('Preview with settings', 'eye', '', 'type="button" data-hi-preview') +
      btn('Download', 'save', 'primary', 'type="button" data-hi-save')
    : '',
  body:
    dnTabs('import') +
    '<div class="hi-layout"><div class="stack">' +
    card(
      HI.result ? 'Converted page' : 'Import an HTML page',
      HI.result
        ? hiResultHTML()
        : '<label class="hi-drop" data-hi-drop><input type="file" accept=".html,.htm,.xhtml,text/html" data-hi-input hidden>' +
            '<span class="hi-drop-ico">' + icon('inbox', 24) + '</span><b>Drop an HTML file here, or click to choose</b>' +
            '<small>.html or .htm, up to 5 MB. Scripts never run: they are removed, and the preview is sandboxed.</small></label>' +
            '<div class="row mt-16" style="gap:8px;flex-wrap:wrap">' +
            btn('Paste HTML', 'edit', '', 'type="button" data-hi-paste') +
            btn('Try a sample page', 'file', '', 'type="button" data-hi-sample') +
            '</div>',
      {
        id: 'hiResult',
        sub: HI.result ? 'Open the preview to compare it with the original' : 'The page is converted in your browser; nothing is uploaded'
      }
    ) +
    '</div><div class="stack">' +
    card(
      'Options',
      '<p class="hi-h" style="margin-top:0">Download as</p>' +
        hiModeHTML() +
        '<p class="hi-h">Styles</p><div class="hi-opts">' +
        F({ name: 'keepInlineStyles', label: 'Keep inline styles', type: 'toggle', span: 12, value: HI.options.keepInlineStyles,
            hint: 'For layout the design system does not cover. Inline colors and fonts then override the styleguide.' }) +
        (HI.options.mode === 'clean'
          ? F({ name: 'keepClasses', label: 'Keep original class names', type: 'toggle', span: 12, value: HI.options.keepClasses,
              hint: 'Useful if you will add the page’s own CSS back later.' })
          : '') +
        '</div>'
    ) +
    card('Styleguide', hiStyleguideHTML(), { sub: 'The page is converted to' }) +
    '</div></div>',
  mount(page) {
    const input = $('[data-hi-input]', page);
    if (input) input.addEventListener('change', () => hiReadFile(input.files[0]));
    const drop = $('[data-hi-drop]', page);
    if (drop) {
      drop.addEventListener('dragover', e => {
        e.preventDefault();
        drop.classList.add('over');
      });
      drop.addEventListener('dragleave', () => drop.classList.remove('over'));
      drop.addEventListener('drop', e => {
        e.preventDefault();
        drop.classList.remove('over');
        hiReadFile(e.dataTransfer.files[0]);
      });
    }
    page.addEventListener('click', e => {
      if (e.target.closest('[data-hi-sample]')) hiLoad(HI_SAMPLE_NAME, HI_SAMPLE);
      else if (e.target.closest('[data-hi-paste]')) hiPasteDialog();
      else if (e.target.closest('[data-hi-preview]')) openImportPanel();
      else if (e.target.closest('[data-hi-save]')) hiDownload();
      else if (e.target.closest('[data-hi-clear]')) {
        Object.assign(HI, { fileName: '', fileSize: 0, source: '', result: null });
        closeImportPanel();
        renderRoute();
      }
    });
    // Options re-convert at once and refresh an open preview.
    page.addEventListener('change', e => {
      const t = e.target.closest('[name="keepInlineStyles"],[name="keepClasses"]');
      if (t) hiSetOption(t.name, t.checked);
      const m = e.target.closest('[name="hiMode"]');
      if (m) hiSetOption('mode', m.value);
    });
  }
});
