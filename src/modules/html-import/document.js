/* =========================================================================
   HTML IMPORT · DOCUMENT
   Builds the page that is previewed and downloaded, with the styleguide's
   tokens for every theme, the design-system styles and the same web fonts
   as the app.

   Original mode: your whole file (head, structure, classes, scripts) with
   the styleguide added at the end of <head>, where its stylesheets were.
   Clean mode: a new page around the converted content, with no scripts.
   For the preview and "Open in new tab", scripts and event handlers are
   always left out.

   Provides: hiFontsLink, hiStyleBlock, hiBuildDocument, hiStripScripts,
   hiFileName
   ========================================================================= */
'use strict';

/** The styleguide as one <style> block (plus the fonts link). */
function hiStyleBlock() {
  const name = dnName(), version = dnMeta.version || '1.0.0';
  return (
    hiFontsLink() +
    '\n<style id="kg-styleguide">\n' +
    '/* Styleguide: ' + name.replace(/\*\//g, '') + ' v' + version + ' (Kagami design system). Change data-theme on <html> to light, dark or hc. */\n' +
    hiTokenCss() + '\n' + hiDocCss() +
    '</style>\n'
  );
}

/** Removes scripts and inline handlers from a document: used for the preview, never for the download. */
function hiStripScripts(doc) {
  doc.querySelectorAll('script,noscript').forEach(n => n.remove());
  doc.querySelectorAll('*').forEach(n => {
    for (const a of Array.from(n.attributes)) if (/^on/i.test(a.name)) n.removeAttribute(a.name);
  });
}

/** The app's Google Fonts stylesheet link, so the page loads the styleguide's fonts. */
function hiFontsLink() {
  const link = document.querySelector('link[href*="fonts.googleapis.com/css"]');
  return link ? '<link rel="stylesheet" href="' + esc(link.getAttribute('href')) + '">' : '';
}

/**
 * Builds the converted page.
 * @param {{title:string, html:string}} result  from convertHtml
 * @param {'light'|'dark'|'hc'} theme           theme the page opens in (all three are included)
 * @param {{preview?:boolean}} [o]              preview: leave scripts and event handlers out
 * @returns {string} a complete HTML document
 */
function hiBuildDocument(result, theme, o) {
  const preview = !!(o && o.preview);
  const name = dnName(), version = dnMeta.version || '1.0.0';
  if (result.mode === 'original') {
    const doc = new DOMParser().parseFromString(result.full, 'text/html');
    if (preview) hiStripScripts(doc);
    doc.documentElement.setAttribute('data-theme', theme);
    // the file keeps its own page layout: no centred .kg-page column around it
    doc.body.classList.add('kg-doc', 'kg-original');
    let gen = doc.head.querySelector('meta[name="generator"]');
    if (!gen) {
      gen = doc.createElement('meta');
      gen.setAttribute('name', 'generator');
      doc.head.prepend(gen);
    }
    gen.setAttribute('content', name + ' v' + version + ' styleguide · Kagami design system');
    // last in <head>, so the styleguide wins over anything the file still sets there
    const lay = result.layout || { base: '', top: '' };
    // the file's spacing first (the styleguide overrides it where it styles an element), its sizing and placement last
    if (lay.base) doc.head.insertAdjacentHTML('beforeend', '<style id="kg-layout-spacing">\n' + lay.base + '</style>\n');
    doc.head.insertAdjacentHTML('beforeend', hiStyleBlock());
    if (lay.top) doc.head.insertAdjacentHTML('beforeend', '<style id="kg-layout">\n/* layout kept from your file: display, position, grid/flex, sizes */\n' + lay.top + '</style>\n');
    const doctype = result.full.match(/^<!DOCTYPE[^>]*>/i);
    return (doctype ? doctype[0] : '<!DOCTYPE html>') + '\n' + doc.documentElement.outerHTML + '\n';
  }
  return [
    '<!DOCTYPE html>',
    '<html lang="en" data-theme="' + esc(theme) + '">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="generator" content="' + esc(name + ' v' + version) + ' styleguide · Kagami design system">',
    '<title>' + esc(result.title || 'Imported page') + '</title>',
    hiStyleBlock(),
    '</head>',
    '<body class="kg-doc">',
    '<div class="kg-page">',
    result.html,
    '</div>',
    '</body>',
    '</html>',
    ''
  ].join('\n');
}

/** Download name: <original name>[-clean]-<styleguide name>-<theme>.html */
function hiFileName(fileName, theme, mode) {
  const slug = s => String(s).toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return (slug(fileName) || 'imported-page') + (mode === 'clean' ? '-clean' : '') + '-' + (slug(dnName()) || 'design-system') + '-' + theme + '.html';
}
