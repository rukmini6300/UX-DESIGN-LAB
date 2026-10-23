# Workflow Lab 5

Kagami ERP design system with an on-demand **inventory workflow module**, split into small,
documented source files. Lab 5 adds **Import HTML**: convert any HTML page (file, pasted or sample) to
your styleguide, preview it on the left with the Design lab settings on the right so every change shows
at once, and download it: your original file as it is, restyled, or a clean page. It is a separate module, loaded the first time you open it.

**New here?** Read [`docs/GUIDE.md`](docs/GUIDE.md): software required, how to run, build and test,
how to use the app, and how it is implemented.

## Open it

| File | Use it for |
|---|---|
| `dist/lab5.html` | **The app.** One self-contained file: double-click to open. The *Download workflow* option works here. |
| `index.html` | Development. Loads every file from `src/` separately, so changes show on reload without a build. |

After changing anything in `src/`, run `node build.js` to refresh `dist/lab5.html`.

## Folder map

```
index.html                  page shell: markup, stylesheets and scripts in load order
build.js                    bundles index.html + src/ into dist/lab5.html (no dependencies)
dist/lab5.html              built single-file app
tools/smoke-test.js         headless Chrome check of both builds (npm test)

src/
  boot/                     runs in <head> before first paint
    embed-mode.js           device-preview frame flags
    theme-engine.js         brand color / gradient -> light and dark tokens (window.KagamiTheme)
    design-lab-engine.js    design languages, size, density, motion, navbar (window.KagamiLab)
  styles/                   one stylesheet per concern (tokens, reset, shell, components, ...)
  core/                     no UI: app-context, icons, utils, session
  ui/                       reusable components: badge, toast, modal, drawer, menu, form,
                            data-table, charts, stepper
  shell/                    the application frame: navigation, module-loader, appearance,
                            header, router, feature-modules (on-demand modules), init (always last)
  design/                   design system features: settings panel, form layouts, device
                            preview, lab dock, components, builder, export, styleguide,
                            formats, routes; data/ holds generated catalogues
    component-lab.html      the UX Design Lab page that renders every component variant
  modules/inventory/        the inventory workflow, loaded only when its toggle is on
    manifest.js             file load order
    index.js -> register.js data/, lib/, menu.js, pages/
  modules/html-import/      Import HTML, loaded the first time its page opens
    manifest.js             file list, menu item and #/import route (the only file loaded up front)
    sample.js               sample page for "Try a sample page"
    converter.js            keeps your file (or just its content) and maps it to design-system classes (kg-*)
    stylesheet.js           token CSS for every theme + styles for the kg-* classes
    document.js             puts the styleguide into your file, or wraps content in a new page
    ui-styles.js            styles for the Import page and the side panel
    side-panel.js           sandboxed preview on the left, beside the Design lab settings
    page.js                 the #/import page
    register.js             registerFeatureModule('html-import', api)
```

## How it fits together

- **Classic scripts, shared scope.** Files are plain `<script>`s (not ES modules), so the app also runs
  from `file://`. Each file's top-level `const` / `function` names are visible to the files after it,
  which is why the **load order in `index.html` matters**: a file may use anything defined above it.
  Every file starts with a header listing what it **provides**.
- **Shell and modules.** The shell never imports inventory code. The module calls
  `registerInventory({ nav, pages, routes, notifications, quickCreate, search, sidebarFoot, logAudit })`
  from `modules/inventory/register.js`, and `shell/module-loader.js` merges that into the menu,
  search, notifications and router while the toggle is on.
- **Feature modules.** Other features are folders under `src/modules/` with a `manifest.js` that calls
  `defineFeatureModule(name, files)` and registers a `lazyRoute()`. The first visit loads the files
  (`shell/feature-modules.js`); the module's last file calls `registerFeatureModule(name, api)`.
  `build.js` finds these manifests and inlines each module as an inert block.
- **Routes.** `ROUTES['name'] = (param, query) => ({ title, crumbs, sub, actions, body, mount(page) })`.
  `#/products` calls `ROUTES.products()`. `body` is HTML; `mount` wires events after it is inserted.
- **Reusable UI.** Build pages from `card()`, `btn()`, `badge()`, `F()` (form fields), `mountTable()` /
  `DataTable()`, `openModal()`, `openDrawer()`, `openMenu()`, `toast()` and the chart helpers.
- **Single-file build.** `build.js` inlines styles and boot scripts, stores the component lab page and
  the inventory module as inert data blocks, and joins the app into one script. That lets the page
  copy itself (`core/app-context.js`, `KG_SRC`), which is what *Download workflow* packages.

## Common tasks

**Add an inventory page**
1. Create `src/modules/inventory/pages/my-page.js` with a header comment and `ROUTES['my-page'] = ...`.
2. Add it to `src/modules/inventory/manifest.js` before `register.js`.
3. Add a menu entry in `src/modules/inventory/menu.js` (`INV_NAV`) and, if it should be searchable,
   in `INV_PAGES`.
4. `node build.js`.

**Add a shared UI helper** — put it in the matching `src/ui/` file (or a new file listed in
`index.html` before `src/shell/`), document it with a one-line comment, rebuild.

**Change colors, spacing or type** — edit `src/styles/tokens.css`; design-language palettes live in
`src/boot/design-lab-engine.js`.

## Test

```
npm install        # once: puppeteer-core
npm test           # builds, then runs tools/smoke-test.js against index.html and dist/lab5.html
```

The test needs Chrome or Edge; set `CHROME_PATH` if it is installed somewhere unusual.

## Notes

- `src/design/data/*.js` and `src/design/component-lab.html` are generated catalogues; they are kept
  unformatted on purpose.
- *Download workflow* packages the single-file build. In `index.html` it opens `dist/lab5.html` in a
  new tab, sends it your settings, and that tab saves the file; run `node build.js` first so the
  build includes your latest changes. Allow pop-ups for the page if the browser asks.
- Data is sample data held in memory; it resets on reload.
