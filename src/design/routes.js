/* =========================================================================
   DESIGN ROUTES
   Styleguide page, #/design routes and the header Design button.

   Provides: sgPage, sgTimer, #/design
   ========================================================================= */
'use strict';

function sgPage() {
  const tok = dnThemeTokens();
  if (KG_EXPORT)
    return {
      title: 'Styleguide',
      nav: 'design/styleguide',
      crumbs: [['Styleguide']],
      sub:
        'Foundations and component guidelines for ' +
        esc(dnName()) +
        ' v' +
        esc(dnMeta.version || '1.0.0') +
        (dnMeta.desc ? ' · ' + esc(dnMeta.desc) : '') +
        '.',
      body: '<div class="sg" style="' + sgVars() + '">' + sgFoundations(tok) + sgGuidelines() + '</div>',
      mount(page) {
        new MutationObserver((_, o) => {
          if (!document.body.contains(page)) {
            o.disconnect();
            return;
          }
          clearTimeout(sgTimer);
          sgTimer = setTimeout(() => {
            $('.sg', page).innerHTML = sgFoundations(dnThemeTokens()) + sgGuidelines();
          }, 80);
        }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      }
    };
  return {
    title: 'Styleguide',
    nav: '',
    crumbs: [['Design', 'design'], ['Styleguide']],
    sub: 'Foundations and component guidelines generated from your theme, design lab settings and selected variants.',
    actions:
      '<button type="button" class="btn btn-sm" data-dn-app>' +
      icon('flow', 16) +
      '<span>Download workflow</span></button><button type="button" class="btn btn-sm" data-sg-open>' +
      icon('export', 16) +
      '<span>Open in new tab</span></button><button type="button" class="btn btn-sm" data-sg-copy aria-haspopup="menu">' +
      icon('copy', 16) +
      '<span>Copy</span></button><button type="button" class="btn btn-primary btn-sm" data-dn-dl aria-haspopup="menu">' +
      icon('save', 16) +
      '<span>Download</span></button>',
    body:
      dnTabs('guide') +
      '<div class="sg" style="' +
      sgVars() +
      '"><section class="sg-sec"><h2>Details</h2><p>Used as the title and version in every export.</p><div class="sg-meta"><label>Name<input class="input" data-sg-f="name" value="' +
      esc(dnMeta.name) +
      '" maxlength="80"></label><label>Version<input class="input" data-sg-f="version" value="' +
      esc(dnMeta.version) +
      '" maxlength="20"></label><label class="w">Description<input class="input" data-sg-f="desc" value="' +
      esc(dnMeta.desc) +
      '" maxlength="200" placeholder="One line about what this system is for"></label></div></section>' +
      sgFoundations(tok) +
      sgGuidelines() +
      '</div>',
    mount(page) {
      dnBind(page);
      page.addEventListener('input', e => {
        const f = e.target.closest('[data-sg-f]');
        if (!f) return;
        dnMeta[f.dataset.sgF] = f.value;
        dnMetaSave();
      });
      const dl = $('[data-dn-dl]', page);
      if (dl) dl.onclick = () => openMenu(dl, dnDownloadItems(), { align: 'right' });
      const cp = $('[data-sg-copy]', page);
      if (cp) cp.onclick = () => openMenu(cp, dnCopyItems(), { align: 'right' });
      const op = $('[data-sg-open]', page);
      if (op) op.onclick = () => dnExport('openguide');
      const ap = $('[data-dn-app]', page);
      if (ap) ap.onclick = () => dnExport('app');
      new MutationObserver((_, o) => {
        if (!document.body.contains(page)) {
          o.disconnect();
          return;
        }
        const sg = $('.sg', page);
        if (!sg) return;
        clearTimeout(sgTimer);
        sgTimer = setTimeout(() => {
          const keep = $$('.sg-sec', sg)
            .slice(0, 1)
            .map(x => x.outerHTML)
            .join('');
          sg.innerHTML = keep + sgFoundations(dnThemeTokens()) + sgGuidelines();
        }, 80);
      }).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme', 'data-lang', 'data-size', 'data-density']
      });
    }
  };
}
let sgTimer = 0;
document.head.append(Object.assign(document.createElement('style'), { id: 'lab-sg', textContent: SG_CSS }));
ROUTES.design = p => (KG_EXPORT || p === 'styleguide' ? sgPage() : p === 'preview' ? dnPreview() : dnPage(p));
(function () {
  const b = $('#designBtn');
  if (!b) return;
  b.innerHTML = icon('palette', 16) + '<span class="desktop-only">Design</span>';
  b.dataset.tip = 'Build a design system';
  b.onclick = () => navigate('design');
})();
