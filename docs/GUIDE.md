# Workflow Lab 5 — Setup, Running and Implementation Guide

This guide covers what you need installed, how to run the application, and how it is built.
For the folder map and day-to-day coding recipes, see [`../README.md`](../README.md).

---

## 1. What the application is

A browser application with three parts:

- **Design system** — component library (54 components, every variant), design lab
  (5 design languages, light / dark / high contrast, size, density, color, fonts, motion),
  design builder, styleguide and exports.
- **Inventory workflow module** — a working inventory ERP (dashboard, products, warehouses,
  stock, goods receipt, goods issue, transfers, adjustments, counts, planning, reports, audit,
  purchasing and sales). It is off by default and loads when you switch on the
  **Inventory workflow** toggle in the header.
- **Import HTML module** — converts any HTML page you provide (file, pasted HTML or a sample) to
  your styleguide and shows it in a **preview on the left of the screen, with the Design lab settings
  on the right**: change the theme, design language, brand, density or fonts and the page updates at
  once. Download saves it with those settings. It loads the first time you open **Import HTML**.

It runs entirely in the browser. There is **no server, database or login**: data is generated sample
data held in memory, and settings are saved in the browser's `localStorage`.

---

## 2. Software required

### To use the application

| Software | Version | Notes |
|---|---|---|
| Web browser | Current **Google Chrome** or **Microsoft Edge** | Tested in Chrome. Edge uses the same engine. Firefox and Safari are not tested. |
| Internet connection | Optional | Only used to load fonts from Google Fonts. Offline, the app falls back to system fonts. |

Nothing else: no installation, no web server.

### To change the code and rebuild

| Software | Version | Used for |
|---|---|---|
| **Node.js** | 18 or newer (tested with 22.13) | `node build.js` — bundles `src/` into `dist/lab5.html`. The build has no dependencies. |
| A code editor | Any (for example VS Code) | Editing files in `src/`. |
| **Git** | Any recent version | Optional: getting and updating the code. |

### To run the automated tests

| Software | Version | Used for |
|---|---|---|
| Node.js + npm | Node 18 or newer (npm comes with Node) | Running `npm install` and `npm test`. |
| `puppeteer-core` | 23.11.1 (installed by `npm install`) | Drives the browser during tests. |
| Chrome or Edge | Installed locally | The tests open the app in a headless browser. Set `CHROME_PATH` if it is not in a standard location. |

Download links: Node.js — <https://nodejs.org> (choose the LTS version) · Git — <https://git-scm.com> ·
Chrome — <https://www.google.com/chrome>.

Check your versions:

```
node --version      # v18.0.0 or higher
npm --version
git --version
```

---

## 3. Get the code

```
git clone https://github.com/Ganibiji/UX_DESIGN_NEXT.git
cd UX_DESIGN_NEXT/WORKFLOW_LAB/LAB5
```

Or copy the `WORKFLOW_LAB/LAB5` folder from the project. Keep the folder structure as it is:
`index.html` loads files from `src/` by relative path.

---

## 4. How to run

### Option A — open the built app (no software needed)

1. Open the folder `WORKFLOW_LAB/LAB5/dist`.
2. Double-click **`lab5.html`** (or drag it into Chrome / Edge).

The app opens on the **Components** page. That is all you need to use every feature.

### Option B — open the development page

1. Double-click **`WORKFLOW_LAB/LAB5/index.html`**.

It looks and works the same, but loads each source file from `src/` separately, so a change you make
in `src/` shows up when you reload the page (no build needed).

### Option C — rebuild after changing code

From the `LAB5` folder:

```
node build.js
```

Output:

```
Built dist\lab5.html: 2.25 MB, 34 app files, 24 inventory files, 8 html-import files
```

Run it after every change to `src/`, so `dist/lab5.html` (and *Download workflow*) include your changes.

### Option D — run the automated tests

From the `LAB5` folder, once:

```
npm install
```

Then, whenever you want to check everything:

```
npm test
```

This rebuilds and then opens both `index.html` and `dist/lab5.html` in headless Chrome. It checks
the design pages, turns the inventory workflow on and off, opens every inventory page, converts the
sample page in Import HTML and downloads it, and downloads a workflow app from both pages and opens
it in a clean browser profile. It ends with
`ALL PASSED`, or lists each `FAIL`.

If Chrome is not found:

```
# Windows (PowerShell)
$env:CHROME_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"; npm test
# macOS / Linux
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm test
```

---

## 5. Using the application

| Task | How |
|---|---|
| Browse components | Left menu → **Components**, pick a group and a component. |
| Change the look | Header icons: **Appearance** (brand color, light / dark, menu position), **Design lab** sidebar (language, size, density, fonts, radius, motion), **Device preview** (phone / tablet / desktop frame). |
| Turn on the inventory app | Click the **Inventory workflow** switch in the header. The inventory menu sections appear and the dashboard opens. Click again to turn it off. |
| Build your design system | Header → **Design**. Step 1 *Build*: tick component variants. Step 2 *Preview and download*. Step 3 *Styleguide*: enter name, version and description. |
| Download formats | On Preview or Styleguide → **Download**: workflow app, workflow mock-up, styleguide, design system, Markdown, JSON, CSS, SCSS, Tailwind, W3C tokens. |
| Download the workflow app | Styleguide page → **Download workflow** (or Download → *Workflow app with styleguide*). Saves one HTML file: the working inventory app in your theme, with your styleguide as a page, and no design tools. Open it by double-click; it needs no other file. |
| Import an HTML page | Left menu → **Import HTML**, or Design → tab **4 · Import HTML**. Three ways: drop a `.html` / `.htm` file (up to 5 MB) or click to choose one; **Paste HTML** (a whole page or a fragment); or **Try a sample page**. The page is converted in your browser (nothing is uploaded) and the preview opens. |
| Showcase it with your settings | The preview fills the left of the screen and the **Design lab** opens on the right. Change theme, design language, brand, size, density, fonts, shape or navbar there and the page updates at once; the footer shows what it is styled with. **Design settings** hides or shows the settings panel. |
| Preview toolbar | **Converted / Original**, **Light / Dark / High contrast** (preview only), **Desktop / Tablet / Mobile**, **Options**. **Open in new tab** or **Download** at the bottom; `Esc` or ✕ returns to the Import page (and closes the settings panel if the preview opened it). |
| Import options | **Download as**: **Original file, restyled** (default) or **Clean page** (see below). **Keep inline styles** (for layout the design system does not cover) and, for a clean page, **Keep original class names**. On the Import page or in the preview's **Options** menu; changing one re-converts at once. |
| Download the updated page | **Download** (preview footer or Import page) saves the page with the current styleguide, design lab settings and theme. **Original file, restyled** gives back *your file as it is* (doctype, head, title, meta, structure, ids, class names, scripts, event handlers, frames) with its stylesheets replaced by the styleguide and its components mapped, saved as `<file>-<styleguide>-<theme>.html`. **Clean page** gives the content only, without scripts, as `<file>-clean-<styleguide>-<theme>.html`. |
| Keyboard | `/` search · `[` collapse menu · `Shift`+`T` light / dark · `Shift`+`?` help · `Esc` close |

**From `index.html`,** *Download workflow* opens `dist/lab5.html` in a new tab, which builds and saves
the file. Allow pop-ups if the browser asks, and run `node build.js` first if you changed code.

---

## 6. Implementation

### 6.1 Technology

| Concern | Choice | Why |
|---|---|---|
| Language | Plain JavaScript (ES2020), HTML, CSS | Runs in any modern browser with no build step for development. |
| Frameworks and libraries | None at runtime | Everything (router, tables, charts, modals) is in `src/`. |
| Scripts | Classic `<script>` files sharing one global scope | ES modules are blocked when a page is opened from disk (`file://`); classic scripts are not. |
| Charts and icons | Inline SVG | No image files, no chart library. |
| Persistence | `localStorage` (settings) and memory (data) | No server needed. |
| Build | `build.js` (Node, zero dependencies) | Produces one self-contained HTML file. |
| Tests | `puppeteer-core` + local Chrome | End-to-end checks of both builds. |

### 6.2 Layers and load order

`index.html` loads files in this order; each file may use anything defined by the files before it.

```
src/boot/      in <head>, before first paint
  embed-mode.js         device-preview frame flags (?embed=1, ?touch=1)
  theme-engine.js       brand color / gradient -> light and dark tokens   window.KagamiTheme
  design-lab-engine.js  design language, size, density, motion, navbar    window.KagamiLab
src/styles/*.css        tokens, reset, shell, components, responsive, ...
src/core/      app-context (build flags), icons, utils, session
src/ui/        badge, toast, modal, drawer, menu, form, data-table, charts, stepper
src/shell/     navigation, module-loader, appearance, header, router, feature-modules
src/modules/html-import/manifest.js     menu item + lazy #/import route (the module's only up-front file)
src/design/    data/, settings-panel, form-layouts, device-preview, lab-dock,
               components, builder, export, styleguide, formats, routes
src/shell/init.js       starts the app (always last)

src/modules/inventory/  loaded only when the toggle is on, in manifest.js order:
  index -> data/ -> lib/ -> menu -> pages/ -> register
src/modules/html-import/  loaded the first time #/import opens:
  sample -> converter -> stylesheet -> document -> ui-styles -> side-panel -> page -> register
```

Every file starts with a header: what it does and the functions, constants and routes it **provides**.

### 6.3 Pages and routing

URLs use the hash: `#/products`, `#/grn-view/G-123`, `#/reports/aging?warehouse=W1`.
`shell/router.js` splits that into a name, a parameter and a query, and calls the page function:

```js
ROUTES['products'] = (param, query) => ({
  title: 'Products',                       // page heading and browser tab
  crumbs: [['Inventory', 'inventory'], ['Products']],
  sub: 'Short description under the title',
  actions: btn('Create', 'plus', 'primary', 'data-go="product-create"'),
  body: '<section class="card" id="list"></section>',   // HTML
  mount(page) { mountTable(page, '#list', { /* DataTable options */ }); }  // wire events
});
```

Reusable building blocks: `card()`, `btn()`, `badge()`, `F()` (form field), `validateForm()`,
`mountTable()` / `DataTable()`, `openModal()`, `confirmDialog()`, `openDrawer()`, `openMenu()`,
`toast()`, `lineChart()`, `barChart()`, `donut()`, `hbars()`, `stepperHTML()`.

### 6.4 The module contract

The shell never refers to inventory code by name. The module's last file calls:

```js
registerInventory({
  nav,            // menu sections added before the design system's own entries
  pages,          // [label, route] pairs for global search
  routes,         // route names the module added (hidden while the toggle is off)
  notifications,  // header bell items
  quickCreate,    // () => items for the header Create menu
  search,         // q => [[group, results]] for global search
  sidebarFoot,    // () => HTML for the bottom of the menu
  logAudit        // audit logger (sign-in / sign-out events)
});
```

`shell/module-loader.js` loads the module (`loadInventory`), merges these into the menu, search,
notifications and router while the toggle is on (`invOn`), and shows a "turned off" page for module
routes while it is off.

Other features use the general **feature module** mechanism in `shell/feature-modules.js`:

```js
// src/modules/NAME/manifest.js — loaded up front
defineFeatureModule('NAME', ['src/modules/NAME/a.js', 'src/modules/NAME/register.js']);
ROUTES.page = lazyRoute('page', 'NAME', 'Page title');   // loads the module on first visit
NAV.push({ label: 'Page title', icon: 'file', route: 'page' });

// src/modules/NAME/register.js — the module's last file
registerFeatureModule('NAME', { /* api for other code */ });
```

`loadFeatureModule('NAME')` resolves with the api; `build.js` finds every manifest that calls
`defineFeatureModule` and bundles the module as an inert `kg-module-NAME` block.

### 6.5 The single-file build

`build.js`:

1. Replaces each `<link rel="stylesheet" href="src/...">` with a `<style>` block.
2. Inlines the three boot scripts in `<head>` (they must run before first paint).
3. Replaces everything between `<!-- app:start -->` and `<!-- app:end -->` with:
   - `window.KG_COMPONENT_LAB_HTML` — the component lab page as a string (turned into a blob URL
     for the component frames);
   - `<script type="text/plain" id="kg-inventory-module">` — the inventory files, inert until the
     toggle runs them;
   - `<script type="text/plain" id="kg-module-html-import">` (one per feature module) — inert until
     the module's page is first opened;
   - one `<script>` with every app file joined in load order.
4. Escapes `</script` and `<!--` inside inlined code so the browser parses each block correctly.

### 6.6 How *Download workflow* works

1. At start-up, `core/app-context.js` saves the single-file page's markup as `KG_SRC` (before
   anything renders, without scripts that browser extensions add).
2. `design/export.js` (`dnBuildApp`) copies `KG_SRC` and adds a small first script that:
   - fixes the reads of your saved settings (brand, design lab, density, navbar, selected variants,
     styleguide details) to the values you had when downloading — light / dark stays switchable;
   - turns the inventory workflow on;
   - sets `window.KG_EXPORT`, which hides the design tools and shows the styleguide as a read-only page.
3. The file is saved as `<styleguide-name>-workflow-<language>-<theme>.html`.

The multi-file page (`index.html`) has no single source to copy, so it opens `dist/lab5.html` with
`?download=workflow`, sends your settings with `postMessage`, and that tab builds and saves the file
(`dnHandOffWorkflow` / `dnServeHandOff`).

### 6.7 How *Import HTML* works

```
your .html file ──► converter.js ──► stylesheet.js + document.js ──► side panel (sandboxed frame)
                    clean + map        styleguide tokens + kg-* CSS      └► Download / Open in new tab
```

1. **Read.** `page.js` reads the file in the browser (`File.text()`): `.html`, `.htm` or `.xhtml`,
   up to 5 MB; or takes pasted HTML (`hiPasteDialog`) or the sample (`sample.js`). Nothing is
   uploaded anywhere.
2. **Clean** (`converter.js`, `convertHtml`), using the browser's `DOMParser` (no code runs while
   parsing). It depends on the output mode (`HI_MODES`):

   | | Original file, restyled (`original`, default) | Clean page (`clean`) |
   |---|---|---|
   | `<style>`, stylesheet `<link>`s | replaced by the styleguide | removed |
   | `<script>`, `on…` handlers, `javascript:` links, frames, `<meta>`, `<base>` | **kept** | removed |
   | class names | **kept**, `kg-*` added next to them | removed (unless kept) |
   | ids, structure, `<head>`, title, doctype | **kept** | content only, in a new page |
   | inline `style` | removed unless kept | removed unless kept |
   | legacy presentational attributes (`bgcolor`, `align`, `border`, …) | removed | removed, and `<font>` / `<center>` unwrapped |
3. **Map** to design-system classes, from tags, ARIA roles and the old class names (Bootstrap-style
   names are recognised):

   | Source | Becomes |
   |---|---|
   | `<button>`, submit / button / reset inputs, links named `btn` / `button` or `role="button"` | `kg-btn`, plus `--primary` (submit, "primary"), `--danger` ("danger", "delete"), `--ghost` ("link") |
   | text-like `<input>`, `<select>`, `<textarea>`, range | `kg-input`, `kg-select`, `kg-textarea`, `kg-range`; the wrapper with its label: `kg-field` |
   | checkboxes and radios | `kg-check`; their `<label>`: `kg-choice` |
   | `<table>` | `kg-table` in a scrolling `kg-table-wrap` |
   | `<article>`, `<aside>`, `<fieldset>`, boxes named card / panel / box / tile / widget / well | `kg-card` (`kg-card--nested` inside another card) |
   | elements named alert / notice / message / callout / banner, `role="alert"` / `"status"` | `kg-alert--info / success / warning / danger` |
   | short labels named badge / tag / chip / pill / label / status | `kg-badge--success / warning / danger / info` |
   | `<header>`, `<nav>`, `<footer>`, `<main>`, `<section>` | `kg-header`, `kg-nav`, `kg-footer`, `kg-main`, `kg-section` |
   | boxes named container / row / col | `kg-container`, `kg-row` (wrapping flex), `kg-col` |
   | other links | `kg-link` |

   Tones come from the old class names and the text (for example "Approved" → success,
   "Pending" → warning, "Rejected" → danger).
4. **Style** (`stylesheet.js`). `hiTokenCss()` resolves your styleguide's tokens for light, dark and
   high contrast with `dnThemeTokens()`; `hiDocCss()` styles the `kg-*` classes using only those tokens,
   with the heading sizes from the styleguide's type scale.
5. **Page** (`document.js`, `hiBuildDocument()`). Original mode: your whole file, with the
   styleguide (`<style id="kg-styleguide">`, tokens + styles + the app's web fonts) added at the end of
   `<head>` where its stylesheets were, `kg-doc kg-page` added to `<body>` and tables framed in place
   (`kg-table--bare`) instead of wrapped. Clean mode: a new page around the content, with no scripts.
   `data-theme` on `<html>` picks the theme. The preview and *Open in new tab* always get a copy
   without scripts or event handlers (`hiStripScripts`); only the download keeps them.
6. **Preview** (`side-panel.js`). The preview fills the screen from the left up to the Design lab
   panel (`design/lab-dock.js`), which it opens on screens wider than 1,100 px and closes again
   when it closes. The page is shown in an `<iframe sandbox="">`: nothing in it can run, submit
   forms or open windows, even in the *Original* view. A `MutationObserver` watches the theme, brand
   and design lab, and the preview redraws only when the resolved tokens actually change.
7. **Report.** The Import page lists what was mapped (buttons, fields, tables, cards, badges, alerts,
   links) and what was removed, and warns about images with relative paths, which cannot load
   outside the original site.

The module's api, for other code: `loadFeatureModule('html-import')` resolves with
`{ convert, buildDocument, importText, openPreview, closePreview }`.

### 6.8 Saved settings (`localStorage`)

| Key | Holds |
|---|---|
| `kagami-theme`, `kagami-mode` | Light / dark / high contrast, and manual or system mode |
| `kagami-brand` | Brand color or gradient |
| `kagami-lab` | Design lab options (language, size, accents, fonts, radius, elevation, motion, icons, navbar style) |
| `kagami-nav` | Menu position: left, right, top, bottom |
| `kagami-density` | Density: comfortable, compact or dense |
| `kagami-sidebar` | Menu expanded or collapsed |
| `kagami-labdock`, `kagami-labtab` | Design lab sidebar open, and its current topic |
| `kagami-comp-arch` | Components pages: the "architecture" display option |
| `kagami-design` | Variants selected in the design builder |
| `kagami-design-meta` | Styleguide name, version and description |
| `kagami-inventory` | Inventory workflow toggle on / off |

To reset everything: open the browser's developer tools → Application → Local Storage → delete the
`kagami-*` keys, then reload. Inventory data and the imported page reset on every reload.

### 6.9 Adding to the application

- **Inventory page:** new file in `src/modules/inventory/pages/`, add it to `manifest.js` before
  `register.js`, add a menu entry in `menu.js`, run `node build.js`.
- **New feature module:** a folder under `src/modules/` with a `manifest.js` (see 6.4), list the
  manifest in `index.html` after `src/shell/feature-modules.js`, run `node build.js`.
- **Import HTML mapping:** add or change a rule in `src/modules/html-import/converter.js` (step 4,
  "Map") and its style in `stylesheet.js` (`hiDocCss`).
- **Shared UI helper:** add it to the matching file in `src/ui/` (or a new file listed in
  `index.html` before `src/shell/`), with a one-line comment.
- **Colors, spacing, type:** `src/styles/tokens.css`; design-language palettes are in
  `src/boot/design-lab-engine.js`.
- After any change: `node build.js`, then `npm test`.

---

## 7. Troubleshooting

| Problem | Fix |
|---|---|
| Page is blank or unstyled | Keep the `LAB5` folder structure intact; `index.html` needs `src/`. Or open `dist/lab5.html`, which needs nothing else. |
| Fonts look plain | No internet connection; the app falls back to system fonts. |
| *Download workflow* does nothing from `index.html` | Allow pop-ups for the page; make sure `dist/lab5.html` exists (`node build.js`). |
| Downloaded app lacks my latest code changes | Run `node build.js` before downloading. |
| *Inventory workflow unavailable* message | In `index.html`, the `src/modules/inventory` folder is missing or moved. |
| `node` is not recognised | Install Node.js 18+ and open a new terminal. |
| `npm test`: *Chrome not found* | Set `CHROME_PATH` (see section 4, option D). |
| Imported page: images missing | Their paths are relative to the original site. Use full web addresses (`https://…`) or embed them (`data:`). The Import page warns about these. |
| Imported page: layout looks different | Its own CSS is replaced by the design system. Turn on **Keep inline styles** for layout set inline; pages laid out only by their CSS classes may need a little markup tidy-up. |
| *Import HTML could not load* | In `index.html`, the `src/modules/html-import` folder is missing or moved. |
| *File too large* / *Not an HTML file* | Import takes `.html`, `.htm` or `.xhtml` files up to 5 MB. |
| Settings look wrong | Reset the `kagami-*` keys (section 6.8). |

---

## 8. Other versions in `WORKFLOW_LAB`

| Folder | What it is |
|---|---|
| `WORKFLOW_LAB_ORIGINAL.html` | The original single-file lab. |
| `LAB1/` | Single file: design system and inventory together. |
| `LAB2/` | Design system and inventory split into two files, with the toggle. |
| `LAB3/` | LAB2 plus *Download workflow*. |
| `LAB4/` | Modular, documented source with a build and tests. |
| `LAB5/` | This version: LAB4 plus the Import HTML module and on-demand feature modules. |

LAB1 to LAB3 need only a browser: open the `.html` file. (LAB2 and LAB3 need their `.js` file in
the same folder.)
