/* =========================================================================
   HTML IMPORT · UI STYLES
   Styles for the Import page and the preview side panel. Injected once
   when the module loads, so the module ships as one folder.

   Provides: HI_UI_CSS
   ========================================================================= */
'use strict';

const HI_UI_CSS = `
/* page layout: two columns, one while the preview panel takes the right side */
.hi-layout { display: grid; gap: 16px; grid-template-columns: minmax(0, 1fr) 340px; align-items: start; }
@media (max-width: 1100px) { .hi-layout { grid-template-columns: minmax(0, 1fr); } }

/* drop zone */
.hi-drop { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 32px 20px;
  text-align: center; border: 2px dashed var(--border-strong); border-radius: var(--r-lg); background: var(--surface-secondary);
  cursor: pointer; transition: border-color .15s, background .15s; }
.hi-drop:hover, .hi-drop.over { border-color: var(--primary); background: var(--primary-soft); }
.hi-drop:focus-within { box-shadow: var(--focus); }
.hi-drop-ico { width: 48px; height: 48px; display: grid; place-items: center; border-radius: 50%; background: var(--surface);
  color: var(--primary-text); margin-bottom: 4px; }
.hi-drop b { font-weight: 600; }
.hi-drop small { color: var(--text-muted); font-size: 12.5px; max-width: 420px; }
.hi-file { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid var(--border);
  border-radius: var(--r-md); background: var(--surface); }
.hi-file b { display: block; font-weight: 600; word-break: break-all; }
.hi-file small { color: var(--text-muted); }

/* result */
.hi-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; background: var(--border);
  border: 1px solid var(--border); border-radius: var(--r-md); overflow: hidden; }
.hi-stats div { background: var(--surface); padding: 10px 12px; }
.hi-stats small { display: block; font-size: 12px; color: var(--text-muted); }
.hi-stats b { font-size: 18px; font-weight: 650; font-variant-numeric: tabular-nums; }
.hi-h { font-size: 12px; font-weight: 650; letter-spacing: .04em; text-transform: uppercase; color: var(--text-muted); margin: 18px 0 8px; }
.hi-clean { display: flex; flex-wrap: wrap; gap: 6px; }
.hi-sg { display: flex; align-items: center; gap: 10px; }
.hi-sw { display: flex; gap: 4px; }
.hi-sw i { width: 22px; height: 22px; border-radius: 6px; border: 1px solid var(--border); }
.hi-dl { display: grid; grid-template-columns: auto 1fr; gap: 6px 12px; font-size: 13px; margin-top: 12px; }
.hi-dl dt { color: var(--text-muted); }
.hi-opts { display: grid; gap: 8px; }
.hi-modes { display: grid; gap: 8px; }
.hi-mode { display: flex; gap: 10px; align-items: flex-start; padding: 10px 12px; border: 1px solid var(--border);
  border-radius: var(--r-md); cursor: pointer; }
.hi-mode:hover { border-color: var(--border-strong); }
.hi-mode:has(input:checked) { border-color: var(--primary); background: var(--primary-soft); }
.hi-mode input { margin-top: 3px; accent-color: var(--primary); }
.hi-mode b { display: block; font-weight: 600; }
.hi-mode small { display: block; font-size: 12.5px; color: var(--text-muted); }
@media (max-width: 760px) { .hi-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

/* preview showcase: fills the screen from the left up to the Design lab settings panel on the right */
.hi-panel { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 54; display: flex; flex-direction: column;
  background: var(--surface); border-right: 1px solid var(--border); }
.hi-panel[hidden] { display: none !important; }
html[data-labdock='open'] .hi-panel { right: 420px; }
/* toasts sit bottom left, clear of the Download button and the settings panel */
html[data-hipanel='open'] .toasts { left: 16px; right: auto; bottom: 72px; }
@media (max-width: 1100px) { html[data-labdock='open'] .hi-panel { right: 0; } }
.hi-head { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-bottom: 1px solid var(--border); min-height: var(--hh); }
.hi-head h3 { font-size: 15px; font-weight: 650; }
.hi-head small { display: block; font-size: 12px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hi-bar { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; padding: 10px 14px; border-bottom: 1px solid var(--border);
  background: var(--surface-secondary); }
.hi-bar-l, .hi-bar-r { display: flex; flex-wrap: wrap; gap: 8px; }
.hi-bar-r .btn[aria-pressed='true'] { background: var(--primary-soft); border-color: var(--primary); color: var(--primary-text); }
.hi-seg { display: inline-flex; padding: 2px; gap: 2px; border: 1px solid var(--border); border-radius: var(--r-md); background: var(--surface); }
.hi-seg button { height: 28px; padding: 0 10px; border-radius: calc(var(--r-md) - 2px); background: transparent; color: var(--text-muted);
  font: inherit; font-size: 12.5px; font-weight: 500; cursor: pointer; }
.hi-seg button[aria-pressed='true'] { background: var(--primary-soft); color: var(--primary-text); }
.hi-seg button:focus-visible { outline: none; box-shadow: var(--focus); }
.hi-stage { flex: 1; min-height: 0; overflow: auto; background: var(--surface-sunken); padding: 12px; }
.hi-frame { display: block; width: 100%; height: 100%; min-height: 480px; margin: 0 auto; border: 1px solid var(--border);
  border-radius: var(--r-md); background: #fff; box-shadow: var(--shadow-sm); transition: width .2s; }
.hi-foot { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-top: 1px solid var(--border); }
.hi-foot .spacer { flex: 1; }
.hi-foot small { color: var(--text-muted); font-size: 12px; }
`;

document.head.append(Object.assign(document.createElement('style'), { id: 'hi-ui', textContent: HI_UI_CSS }));
