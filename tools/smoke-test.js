#!/usr/bin/env node
/* =========================================================================
   SMOKE TEST
   Opens the multi-file page (index.html) and the single-file build
   (dist/lab5.html) in headless Chrome and checks the main journeys:
   design system alone, inventory workflow on and off, every inventory page,
   Import HTML (convert, preview panel, download), and the Download
   workflow app in a clean browser profile.

   Setup:  npm install            (installs puppeteer-core)
   Run:    npm test               (builds, then tests)
   Chrome: set CHROME_PATH if Chrome or Edge is not in a standard place.
   ========================================================================= */
'use strict';

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const ROOT = path.join(__dirname, '..');
const DOWNLOADS = path.join(__dirname, 'downloads');
const fileUrl = p => 'file:///' + path.resolve(ROOT, p).split(path.sep).join('/');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const INVENTORY_ROUTES = ['dashboard', 'inventory', 'workflow', 'products', 'product-create', 'categories', 'units', 'warehouses',
  'locations', 'warehouse-stock', 'stock', 'ledger', 'stock-adjustment', 'adjustment-create', 'stock-transfer', 'transfer-create',
  'stock-count', 'grn', 'grn-create', 'goods-issue', 'issue-create', 'reorder', 'low-stock', 'expiry', 'reports/valuation',
  'reports/movement', 'reports/aging', 'reports/low', 'reports/warehouse', 'reports/product', 'reports/dead', 'reports/expiry',
  'audit', 'purchasing', 'sales', 'profile'];
const DESIGN_ROUTES = ['components', 'components/buttons', 'design', 'design/preview', 'design/styleguide', 'import', 'settings'];

function findChrome() {
  const candidates = [process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'];
  const found = candidates.find(p => p && fs.existsSync(p));
  if (!found) throw new Error('Chrome not found: set CHROME_PATH');
  return found;
}

let failures = 0;
const check = (ok, message) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + message);
  if (!ok) failures++;
};

/** Opens a page in its own browser profile and records script errors. */
async function openPage(browser, url, errors, label) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  page.on('pageerror', e => errors.push(label + ': ' + e.message));
  page.on('console', m => {
    if (m.type() === 'error' && !/fonts\.g|Failed to load resource/.test(m.text())) errors.push(label + ' console: ' + m.text());
  });
  await page.goto(url, { waitUntil: 'load' });
  await sleep(800);
  return { context, page };
}

/** Navigates by hash and returns the rendered page title and whether it is an error page. */
async function visit(page, route) {
  await page.evaluate(r => (location.hash = '#/' + r), route);
  await sleep(700);
  return page.evaluate(() => ({
    h1: (document.querySelector('.page-title') || {}).textContent,
    broken: /couldn’t be displayed|doesn’t exist/.test(document.querySelector('#page').textContent)
  }));
}

async function testDesignSystem(browser, file, errors) {
  console.log('\n== ' + file);
  const { page } = await openPage(browser, fileUrl(file), errors, file);
  let s = await page.evaluate(() => ({
    hash: location.hash,
    checked: document.querySelector('#invToggle').getAttribute('aria-checked'),
    nav: document.querySelector('#sidebar').textContent
  }));
  check(s.hash === '#/components' && s.checked === 'false', 'starts as the design system, inventory off');
  check(!/Goods Receipt/.test(s.nav) && /Components/.test(s.nav), 'menu holds design system entries only');
  for (const r of DESIGN_ROUTES) {
    const v = await visit(page, r);
    check(!v.broken && v.h1, 'design page ' + r + ' -> ' + v.h1);
  }
  await page.click('#invToggle');
  await sleep(2500);
  s = await page.evaluate(() => ({ hash: location.hash, nav: document.querySelector('#sidebar').textContent }));
  check(s.hash === '#/dashboard' && /Goods Receipt/.test(s.nav), 'toggle loads the inventory module and its menu');
  for (const r of INVENTORY_ROUTES) {
    const v = await visit(page, r);
    check(!v.broken && v.h1, 'inventory page ' + r + ' -> ' + v.h1);
  }
  await page.click('#invToggle');
  await sleep(600);
  s = await visit(page, 'products');
  check(s.h1 === 'Inventory workflow is off', 'inventory pages explain how to turn the workflow back on');
  return page;
}

/** Import HTML: loads the module, converts the sample, previews it in the side panel and downloads it. */
async function testHtmlImport(browser, file, errors) {
  console.log('\n== Import HTML in ' + file);
  fs.rmSync(DOWNLOADS, { recursive: true, force: true });
  fs.mkdirSync(DOWNLOADS, { recursive: true });
  const { page } = await openPage(browser, fileUrl(file), errors, file + ' import');
  const cdp = await page.createCDPSession();
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DOWNLOADS, browserContextId: page.browserContext().id });
  const v = await visit(page, 'import');
  await sleep(800);
  check(v.h1 === 'Import HTML' && (await page.$('[data-hi-sample]')), 'import page loads its module');
  await page.click('[data-hi-sample]');
  await sleep(1200);
  const s = await page.evaluate(() => {
    const frame = document.querySelector('#hiPanel .hi-frame');
    const body = frame.srcdoc.split('<body')[1] || '';
    return {
      open: !document.querySelector('#hiPanel').hidden,
      sandboxed: frame.getAttribute('sandbox') === '',
      clean: !/<script|onclick=|onload=/i.test(body), // original mode keeps frames and links; scripts never reach the preview
      mapped: /kg-btn kg-btn--primary/.test(body) && /kg-table/.test(body) && /kg-card/.test(body)
    };
  });
  check(s.open && s.sandboxed, 'sample converts and opens in the sandboxed side panel');
  check(s.clean && s.mapped, 'preview has no scripts and uses design-system classes');
  await page.click('[data-hi-download]');
  let saved = null;
  for (let i = 0; i < 20 && !saved; i++) {
    await sleep(300);
    saved = fs.readdirSync(DOWNLOADS).find(f => f.endsWith('.html'));
  }
  check(!!saved, 'converted page downloaded: ' + saved);
  await page.browserContext().close();
}

/** Clicks Download workflow on `page` and checks the saved app in a clean browser profile. */
async function testWorkflowDownload(browser, page, errors, label, appName) {
  console.log('\n== Download workflow from ' + label);
  fs.rmSync(DOWNLOADS, { recursive: true, force: true });
  fs.mkdirSync(DOWNLOADS, { recursive: true });
  await page.evaluate(
    n => localStorage.setItem('kagami-design-meta', JSON.stringify({ name: n, version: '9.9.9', desc: 'Smoke test' })),
    appName
  );
  await page.reload({ waitUntil: 'load' }); // the styleguide details are read at start-up
  await sleep(800);
  await visit(page, 'design/styleguide');
  const cdp = await page.createCDPSession();
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DOWNLOADS, browserContextId: page.browserContext().id });
  await page.click('[data-dn-app]');
  let file = null;
  for (let i = 0; i < 60 && !file; i++) {
    await sleep(500);
    file = fs.readdirSync(DOWNLOADS).find(f => f.endsWith('.html'));
  }
  check(!!file, 'workflow app downloaded: ' + file);
  if (!file) return;
  const { page: app } = await openPage(browser, fileUrl(path.join('tools', 'downloads', file)), errors, 'downloaded app');
  await sleep(800);
  const s = await app.evaluate(() => ({
    exported: document.documentElement.hasAttribute('data-export'),
    h1: document.querySelector('.page-title').textContent,
    title: document.title,
    nav: document.querySelector('#sidebar').textContent
  }));
  check(s.exported && s.h1 === 'Inventory Dashboard', 'downloaded app opens on the inventory dashboard');
  check(s.title.includes(appName) &&/Styleguide/.test(s.nav), 'downloaded app is named after the styleguide and lists it');
  const v = await visit(app, 'design/styleguide');
  check(v.h1 === 'Styleguide', 'downloaded app shows the styleguide');
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: findChrome(), headless: true });
  const errors = [];
  try {
    await testDesignSystem(browser, 'index.html', errors);
    await testHtmlImport(browser, 'index.html', errors);
    await testHtmlImport(browser, 'dist/lab5.html', errors);
    const built = await testDesignSystem(browser, 'dist/lab5.html', errors);
    await testWorkflowDownload(browser, built, errors, 'dist/lab5.html', 'Smoke Test Ops');
    // index.html cannot copy itself: it hands the download to dist/lab5.html in a new tab
    const { page: dev } = await openPage(browser, fileUrl('index.html'), errors, 'index.html');
    await testWorkflowDownload(browser, dev, errors, 'index.html', 'Dev Handoff Ops');
    check(errors.length === 0, 'no script errors' + (errors.length ? ':\n  ' + errors.join('\n  ') : ''));
  } finally {
    await browser.close();
  }
  console.log(failures ? '\n' + failures + ' FAILED' : '\nALL PASSED');
  process.exit(failures ? 1 : 0);
})().catch(e => {
  console.error(e);
  process.exit(2);
});
