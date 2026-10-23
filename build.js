#!/usr/bin/env node
/* =========================================================================
   BUILD
   Bundles index.html and everything under src/ into dist/lab5.html: one file
   that opens by double-click and can copy itself for the Download workflow.
   No dependencies: run "node build.js".
   ========================================================================= */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist', 'lab5.html');

const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

/** Makes code safe inside an inline <script>: no early </script>, and no <!-- that changes how browsers parse the rest. */
const scriptSafe = code => code.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');

/** The inventory module's file list, read from its manifest. */
function inventoryFiles() {
  const code = read('src/modules/inventory/manifest.js');
  return new Function(code + '\nreturn INVENTORY_FILES;')();
}

/**
 * Feature modules: every src/modules/NAME/manifest.js that calls defineFeatureModule(NAME, files).
 * The manifest runs here with stand-ins for the shell, only to collect the file lists.
 */
function featureModules() {
  const found = [];
  for (const dir of fs.readdirSync(path.join(ROOT, 'src', 'modules'))) {
    const manifest = 'src/modules/' + dir + '/manifest.js';
    if (!fs.existsSync(path.join(ROOT, manifest))) continue;
    const code = read(manifest);
    if (!/defineFeatureModule\(/.test(code)) continue;
    const define = (name, files) => found.push({ name, files });
    new Function('defineFeatureModule', 'lazyRoute', 'ROUTES', 'NAV', 'ROUTE_INDEX', 'KG_EXPORT', code)(
      define, () => () => ({}), {}, [], [], true
    );
  }
  return found;
}

let html = read('index.html');

// 1. Stylesheets become <style> blocks.
html = html.replace(/<link rel="stylesheet" href="(src\/[^"]+)">/g, (_, file) => '<style>\n' + read(file) + '</style>');

// 2. Boot scripts stay separate inline scripts in <head>: they must run before first paint.
html = html.replace(
  /<script src="(src\/boot\/[^"]+)"><\/script>/g,
  (_, file) => '<script>\n' + scriptSafe(read(file)) + '</script>'
);

// 3. App scripts become data blocks (component lab, modules) plus one inline script.
const block = html.match(/<!-- app:start[\s\S]*?<!-- app:end -->/);
if (!block) throw new Error('index.html: the app:start / app:end markers are missing');
const appFiles = [...block[0].matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
const modFiles = inventoryFiles();
const features = featureModules();

const bundle = [
  // The component lab page, as a string the app turns into a blob URL (see design/components.js).
  '<script>window.KG_COMPONENT_LAB_HTML=' +
    JSON.stringify(read('src/design/component-lab.html')).replace(/</g, '\\u003c') +
    ';</script>',
  // The inventory module, inert until the Inventory workflow toggle runs it (see shell/module-loader.js).
  '<script type="text/plain" id="kg-inventory-module">\n' + scriptSafe(modFiles.map(read).join('\n')) + '</script>',
  // Feature modules, inert until first use (see shell/feature-modules.js).
  ...features.map(
    m => '<script type="text/plain" id="kg-module-' + m.name + '">\n' + scriptSafe(m.files.map(read).join('\n')) + '</script>'
  ),
  // The app: one script, so at start-up it sees the whole page and can copy it (see core/app-context.js).
  '<script>\n' + scriptSafe(appFiles.map(read).join('\n')) + '</script>'
].join('\n');

html = html.replace(block[0], () => bundle);
html = html.replace(/\r?\n<!-- Multi-file build for development[^>]*-->/, '');

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);
console.log(
  'Built ' + path.relative(ROOT, OUT) + ': ' + (Buffer.byteLength(html) / 1048576).toFixed(2) + ' MB, ' +
    appFiles.length + ' app files, ' + modFiles.length + ' inventory files' +
    features.map(m => ', ' + m.files.length + ' ' + m.name + ' files').join('')
);
