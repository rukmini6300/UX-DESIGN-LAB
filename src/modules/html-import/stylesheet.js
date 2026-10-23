/* =========================================================================
   HTML IMPORT · STYLESHEET
   The CSS a converted page is shown and downloaded with.

   hiTokenCss() resolves the current styleguide's tokens for light, dark
   and high contrast (design/styleguide.js, dnThemeTokens), so the page
   uses your brand color, design language, fonts, radius, shadows and
   control sizes. hiDocCss() styles the kg-* classes the converter adds;
   every value in it is a token, and the heading scale comes from the
   styleguide's type scale (SG_TYPE).

   Provides: hiTokenCss, hiDocCss
   ========================================================================= */
'use strict';

/** Custom properties for every theme: :root[data-theme="light" | "dark" | "hc"] { --primary: … }. */
function hiTokenCss() {
  return DN_THEMES.map(([key]) => {
    const tokens = dnThemeTokens(key);
    const body = Object.keys(tokens).map(k => '  ' + k + ': ' + tokens[k] + ';').join('\n');
    return ':root[data-theme="' + key + '"] {\n' + body + '\n}';
  }).join('\n');
}

/** Heading sizes from the styleguide's type scale. */
function hiHeadingCss() {
  const scale = name => SG_TYPE.find(t => t[0] === name) || ['', 14, 600];
  const map = [['h1', 'Display'], ['h2', 'Title 1'], ['h3', 'Title 2'], ['h4', 'Title 3'], ['h5', 'Body large'], ['h6', 'Body']];
  return map.map(([tag, name]) => {
    const [, size, weight] = scale(name);
    return '.kg-doc ' + tag + ' { font-size: ' + size + 'px; font-weight: ' + Math.max(weight, 600) + '; }';
  }).join('\n');
}

/** Styles for the converted markup. */
function hiDocCss() {
  return `
*, *::before, *::after { box-sizing: border-box; }
html { background: var(--bg); color: var(--text); font-family: var(--font); font-size: var(--ui-fs, 14px); }
body.kg-doc { margin: 0; line-height: 1.55; -webkit-font-smoothing: antialiased; }
.kg-page { max-width: 1160px; margin: 0 auto; padding: 32px 24px 64px; }

/* text */
.kg-doc h1, .kg-doc h2, .kg-doc h3, .kg-doc h4, .kg-doc h5, .kg-doc h6 { margin: 0 0 12px; line-height: 1.25; color: var(--text); }
${hiHeadingCss()}
.kg-doc p { margin: 0 0 12px; }
.kg-doc small { color: var(--text-muted); }
.kg-doc ul, .kg-doc ol { margin: 0 0 12px; padding-left: 22px; }
.kg-doc hr { border: 0; border-top: 1px solid var(--border); margin: 24px 0; }
.kg-doc blockquote { margin: 0 0 16px; padding: 8px 16px; border-left: 3px solid var(--primary); color: var(--text-muted); }
.kg-doc code { font-family: var(--mono); font-size: .92em; background: var(--surface-secondary); padding: 1px 5px; border-radius: var(--r-sm); }
.kg-doc pre { font-family: var(--mono); background: var(--surface-secondary); padding: 12px 14px; border-radius: var(--r-md); overflow: auto; }
.kg-doc img { max-width: 100%; height: auto; border-radius: var(--r); }
.kg-link { color: var(--primary-text); text-underline-offset: 2px; }

/* page structure */
.kg-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
  margin: 0 0 24px; padding: 12px 24px; background: var(--surface); border-bottom: 1px solid var(--border); }
/* a page header / footer runs edge to edge */
.kg-page > .kg-header:first-child { margin: -32px -24px 24px; }
.kg-page > .kg-footer:last-child { margin: 32px -24px -64px; }
.kg-nav ul { list-style: none; display: flex; flex-wrap: wrap; gap: 2px; margin: 0; padding: 0; }
.kg-nav a { display: block; padding: 6px 10px; border-radius: var(--r); color: var(--text); text-decoration: none; font-weight: 500; }
.kg-nav a:hover { background: var(--surface-hover); }
.kg-footer { margin: 32px 0 0; padding: 20px 24px; color: var(--text-muted); border-top: 1px solid var(--border); font-size: 13px; }
.kg-container { max-width: 100%; }
.kg-row { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start; }
.kg-col { flex: 1 1 280px; min-width: 0; }
.kg-section { margin: 0 0 24px; }

/* cards */
.kg-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-lg); box-shadow: var(--shadow-sm);
  padding: 20px; margin: 0 0 16px; min-width: 0; }
.kg-card--nested { box-shadow: none; background: var(--surface-secondary); padding: 14px; }
fieldset.kg-card legend { font-weight: 600; padding: 0 6px; }

/* buttons */
.kg-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: var(--ctl-h, 36px);
  padding: 0 var(--ctl-px, 14px); margin: 0 6px 6px 0; border: 1px solid var(--border-strong); border-radius: var(--r-md);
  background: var(--surface); color: var(--text); font: inherit; font-weight: 500; text-decoration: none; cursor: pointer;
  transition: background var(--lab-dur, .15s) var(--lab-ease, ease), border-color var(--lab-dur, .15s) var(--lab-ease, ease); }
.kg-btn:hover { background: var(--surface-hover); }
.kg-btn--primary { background: var(--primary); border-color: var(--primary); color: var(--on-primary); }
.kg-btn--primary:hover { background: var(--primary-hover); border-color: var(--primary-hover); }
.kg-btn--danger { background: var(--danger-soft); border-color: transparent; color: var(--danger-text); }
.kg-btn--ghost { background: transparent; border-color: transparent; color: var(--primary-text); }
.kg-btn:focus-visible, .kg-input:focus, .kg-select:focus, .kg-textarea:focus {
  outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); }

/* forms */
.kg-form { margin: 0; }
.kg-field { margin: 0 0 14px; }
.kg-label { display: block; margin: 0 0 6px; font-size: 13px; font-weight: 500; color: var(--text); }
.kg-input, .kg-select, .kg-textarea { display: block; width: 100%; height: var(--ctl-h, 36px); padding: 0 10px;
  border: 1px solid var(--border-strong); border-radius: var(--r); background: var(--surface); color: var(--text); font: inherit; }
.kg-textarea { height: auto; min-height: 88px; padding: 8px 10px; resize: vertical; }
.kg-input::placeholder, .kg-textarea::placeholder { color: var(--text-subtle); }
.kg-choice { display: inline-flex; align-items: center; gap: 8px; margin: 0 16px 12px 0; }
.kg-check, .kg-range { accent-color: var(--primary); }
.kg-check { width: 16px; height: 16px; margin: 0; }

/* tables */
.kg-table-wrap { overflow: auto; margin: 0 0 16px; border: 1px solid var(--border); border-radius: var(--r-md); background: var(--surface); }
.kg-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
.kg-table th { text-align: left; font-size: 12px; font-weight: 600; color: var(--text-muted); background: var(--surface-secondary); white-space: nowrap; }
.kg-table th, .kg-table td { padding: 10px 12px; border-bottom: 1px solid var(--border); vertical-align: middle; }
.kg-table tr:last-child td { border-bottom: 0; }
/* original mode keeps the file's structure, so tables are framed in place instead of wrapped */
.kg-table--bare { border-collapse: separate; border-spacing: 0; margin: 0 0 16px; border: 1px solid var(--border);
  border-radius: var(--r-md); background: var(--surface); overflow: hidden; }
.kg-table tbody tr:hover td { background: var(--surface-hover); }

/* badges and alerts */
.kg-badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 500;
  line-height: 1.5; background: var(--neutral-soft); color: var(--neutral-text); text-decoration: none; }
.kg-badge--success { background: var(--success-soft); color: var(--success-text); }
.kg-badge--warning { background: var(--warning-soft); color: var(--warning-text); }
.kg-badge--danger { background: var(--danger-soft); color: var(--danger-text); }
.kg-badge--info { background: var(--primary-soft); color: var(--primary-text); }
.kg-alert { padding: 12px 14px; margin: 0 0 16px; border-radius: var(--r-md); border: 1px solid transparent; }
.kg-alert--success { background: var(--success-soft); color: var(--success-text); }
.kg-alert--warning { background: var(--warning-soft); color: var(--warning-text); }
.kg-alert--danger { background: var(--danger-soft); color: var(--danger-text); }
.kg-alert--info { background: var(--primary-soft); color: var(--primary-text); }

/* original mode: widgets the file drew with its own stylesheet */
body.kg-original { line-height: 1.5; -webkit-font-smoothing: antialiased; }
.kg-sidebar { background: var(--surface); border-right: 1px solid var(--border); }
.kg-brandmark { background: var(--primary); color: var(--on-primary); border-radius: var(--r-md); font-weight: 700; }
.kg-avatar { background: var(--primary-soft); color: var(--primary-text); border-radius: 50%; font-weight: 600; }
.kg-iconbox { background: var(--primary-soft); color: var(--primary-text); border-radius: var(--r); }
.kg-nav a.kg-active { background: var(--primary-soft); color: var(--primary-text); font-weight: 600; }
.kg-tabs { border-bottom: 1px solid var(--border); }
.kg-tab { color: var(--text-muted); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; }
.kg-tab.kg-active { color: var(--primary-text); border-bottom-color: var(--primary); font-weight: 600; }
.kg-step { color: var(--text-muted); }
.kg-step.kg-active { color: var(--primary-text); font-weight: 600; }
.kg-step-dot { border: 1px solid var(--border-strong); background: var(--surface); color: var(--text-muted); border-radius: 50%; font-weight: 600; }
.kg-step.kg-done .kg-step-dot { background: var(--success); border-color: var(--success); color: var(--on-primary); }
.kg-step.kg-active .kg-step-dot { background: var(--primary); border-color: var(--primary); color: var(--on-primary); }
.kg-step-line { background: var(--border-strong); }
.kg-step-line.kg-done { background: var(--success); }
.kg-dot { background: var(--primary); border-radius: 50%; }
.kg-progress { background: var(--surface-secondary); border-radius: 999px; overflow: hidden; }
.kg-progress-fill { background: var(--primary); border-radius: 999px; display: block; height: 100%; }
.kg-trend-up { color: var(--success-text); font-weight: 600; }
.kg-trend-down { color: var(--danger-text); font-weight: 600; }
.kg-original .kg-table td { white-space: nowrap; }

@media (max-width: 640px) {
  .kg-page { padding: 20px 16px 48px; }
  .kg-page > .kg-header:first-child { margin: -20px -16px 20px; padding: 12px 16px; }
  .kg-page > .kg-footer:last-child { margin: 24px -16px -48px; padding: 16px; }
}
`;
}
