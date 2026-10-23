/* =========================================================================
   FORM LAYOUTS
   Layout versions for every create / edit screen, with fit-to-screen
   sections.

   Stacked, Accordion, Tabs, Side navigation (nested panel) and Steps, plus
   Fit to screen. Works on the rendered form by regrouping its sections, so
   line editors, validation and save handlers keep working and typed values
   survive a layout change.

   Provides: FORM_ROUTES, flGroups, flRestore, flMarkErrors, flFirstBad,
   flReveal, flRender, flFormOf, flBar, formLayoutInit
   ========================================================================= */
'use strict';

const FORM_ROUTES = /^(product|warehouse|transfer|adjustment|grn|issue)-(create|edit)$/;
function flGroups(form) {
  const groups = [];
  let cur = null;
  Array.from(form.children).forEach(ch => {
    if (ch.classList.contains('form-actions')) return;
    const hd = ch.classList.contains('form-section') ? ch.querySelector(':scope > .form-section-head') : null;
    if (hd) {
      cur = {
        n: ($('.fs-num', hd) || {}).textContent || String(groups.length + 1),
        t: ($('.form-section-title', hd) || {}).textContent || 'Section',
        d: ($('.form-section-desc', hd) || {}).textContent || '',
        nodes: [ch]
      };
      groups.push(cur);
    } else if (cur) cur.nodes.push(ch);
  });
  return groups;
}
function flRestore(form) {
  const f = form._fl;
  if (f.root) {
    f.groups.forEach(g => g.nodes.forEach(n => f.anchor.before(n)));
    f.root.remove();
    f.root = null;
  }
  if (f.stepBtns) {
    f.stepBtns.remove();
    f.stepBtns = null;
  }
  f.navs = [];
  f.show = null;
}
function flMarkErrors(form) {
  const f = form._fl;
  if (!f || !f.navs.length) return;
  f.groups.forEach((g, i) => {
    const bad = g.nodes.some(n => n.querySelector('.invalid'));
    if (f.navs[i]) f.navs[i].classList.toggle('has-err', bad);
  });
}
function flFirstBad(form) {
  return form._fl.groups.findIndex(g => g.nodes.some(n => n.querySelector('.invalid')));
}
function flReveal(form) {
  const f = form._fl,
    i = flFirstBad(form);
  if (i < 0) return;
  if (f.show) f.show(i, true);
  const bad = f.groups[i].nodes.map(n => n.querySelector('.invalid')).find(Boolean);
  if (bad) {
    try {
      bad.scrollIntoView({ block: 'center', behavior: 'smooth' });
      if (bad.focus) bad.focus({ preventScroll: true });
    } catch (e) {}
  }
}
function flRender(page, form) {
  const f = form._fl,
    mode = LABX.state.forms,
    fit = LABX.state.fit === 'on';
  flRestore(form);
  page.classList.toggle('fl-fit', fit);
  if (mode === 'stack' && !fit) return;
  const G = f.groups,
    num = g => '<span class="fl-n">' + esc(g.n) + '</span>';
  const root = el('<div class="fl-root fl-' + mode + '"></div>');
  const panel = g => {
    const p = el('<div class="fl-panel" role="tabpanel"></div>');
    g.nodes.forEach(n => p.append(n));
    return p;
  };
  f.idx = Math.min(f.idx || 0, G.length - 1);
  if (mode === 'stack') {
    G.forEach(g => g.nodes.forEach(n => root.append(n)));
  } else if (mode === 'accordion') {
    root.append(
      el(
        '<div class="fl-tools"><button type="button" class="btn btn-ghost btn-xs" data-fl-all="1">Expand all</button><button type="button" class="btn btn-ghost btn-xs" data-fl-all="0">Collapse all</button></div>'
      )
    );
    G.forEach((g, i) => {
      const it = el(
        '<section class="fl-item' +
          (i === f.idx ? ' open' : '') +
          '"><button type="button" class="fl-hd" aria-expanded="' +
          (i === f.idx) +
          '">' +
          num(g) +
          '<span class="fl-t">' +
          esc(g.t) +
          '<small>' +
          esc(g.d) +
          '</small></span><span class="fl-chev">' +
          icon('chevDown', 16) +
          '</span></button><div class="fl-bd"></div></section>'
      );
      g.nodes.forEach(n => $('.fl-bd', it).append(n));
      f.navs.push($('.fl-hd', it));
      root.append(it);
    });
    root.addEventListener('click', e => {
      const all = e.target.closest('[data-fl-all]');
      if (all) {
        $$('.fl-item', root).forEach(it => {
          it.classList.toggle('open', all.dataset.flAll === '1');
          $('.fl-hd', it).setAttribute('aria-expanded', all.dataset.flAll === '1' ? 'true' : 'false');
        });
        return;
      }
      const h = e.target.closest('.fl-hd');
      if (h) {
        const it = h.parentElement,
          o = !it.classList.contains('open');
        it.classList.toggle('open', o);
        h.setAttribute('aria-expanded', String(o));
      }
    });
    f.show = i => {
      const it = $$('.fl-item', root)[i];
      if (it) {
        it.classList.add('open');
        $('.fl-hd', it).setAttribute('aria-expanded', 'true');
      }
    };
  } else {
    const panels = el('<div class="fl-panels"></div>'),
      ps = G.map(panel);
    ps.forEach(p => panels.append(p));
    let nav;
    if (mode === 'tabs') {
      nav = el(
        '<div class="fl-tabbar" role="tablist">' +
          G.map(
            (g, i) =>
              '<button type="button" class="fl-tab" role="tab" data-i="' +
              i +
              '">' +
              num(g) +
              esc(g.t) +
              '</button>'
          ).join('') +
          '</div>'
      );
    } else if (mode === 'side') {
      nav = el(
        '<div class="fl-snavs" role="tablist">' +
          G.map(
            (g, i) =>
              '<button type="button" class="fl-snav" role="tab" data-i="' +
              i +
              '">' +
              num(g) +
              '<span><b>' +
              esc(g.t) +
              '</b><small>' +
              esc(g.d) +
              '</small></span></button>'
          ).join('') +
          '</div>'
      );
    } else {
      nav = el(
        '<div class="fl-stepper" role="tablist">' +
          G.map(
            (g, i) =>
              (i ? '<span class="fl-line"></span>' : '') +
              '<button type="button" class="fl-step" role="tab" data-i="' +
              i +
              '">' +
              num(g) +
              '<span>' +
              esc(g.t) +
              '</span></button>'
          ).join('') +
          '</div>'
      );
    }
    root.append(nav, panels);
    f.navs = $$('[data-i]', nav);
    const back = el(
        '<button type="button" class="btn" data-fl-back>' +
          icon('chevLeft', 16) +
          '<span>Back</span></button>'
      ),
      next = el(
        '<button type="button" class="btn btn-soft" data-fl-next><span>Next</span>' +
          icon('chevRight', 16) +
          '</button>'
      );
    f.show = i => {
      f.idx = i;
      ps.forEach((p, k) => {
        p.hidden = k !== i;
      });
      f.navs.forEach((b, k) => {
        b.setAttribute('aria-selected', String(k === i));
        if (mode === 'side') b.setAttribute('aria-current', String(k === i));
        if (mode === 'steps') {
          b.classList.toggle('done', k < i);
          if (k === i) b.setAttribute('aria-current', 'step');
          else b.removeAttribute('aria-current');
        }
      });
      back.disabled = i === 0;
      next.hidden = i === G.length - 1;
      flMarkErrors(form);
    };
    nav.addEventListener('click', e => {
      const b = e.target.closest('[data-i]');
      if (b) f.show(+b.dataset.i);
    });
    nav.addEventListener('keydown', e => {
      if (mode === 'side') return;
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) {
        const i = Math.max(0, Math.min(G.length - 1, f.idx + d));
        f.show(i);
        f.navs[i].focus();
        e.preventDefault();
      }
    });
    if (mode === 'steps') {
      const wrap = el('<span class="fl-stepbtns"></span>');
      wrap.append(back, next);
      const sp = $('.spacer', f.actions);
      if (sp) sp.after(wrap);
      else f.actions.prepend(wrap);
      back.onclick = () => f.show(f.idx - 1);
      next.onclick = () => f.show(f.idx + 1);
      f.stepBtns = wrap;
    }
    f.show(f.idx);
  }
  f.anchor.after(root);
  f.root = root;
  flMarkErrors(form);
}
function flFormOf(page) {
  return Array.from($$('form.card', page)).find(x => x._fl);
}
function flBar(page) {
  const f = flFormOf(page),
    sel = $('[data-fl-layout]', page),
    fit = $('[data-fl-fit]', page);
  if (!f) return;
  if (sel) sel.value = LABX.state.forms;
  if (fit) fit.setAttribute('aria-pressed', String(LABX.state.fit === 'on'));
}
function formLayoutInit(page) {
  const form = $('form.card', page);
  if (!form) return;
  const groups = flGroups(form);
  if (groups.length < 2) return;
  const anchor = document.createComment('fl');
  groups[0].nodes[0].before(anchor);
  form._fl = { groups, anchor, actions: $('.form-actions', form), navs: [], idx: 0, root: null };
  let acts = $('.page-actions', page);
  if (!acts) {
    acts = el('<div class="page-actions"></div>');
    $('.page-head', page).append(acts);
  }
  const bar = el(
    '<div class="fl-bar"><label class="sr" for="flSel">Form layout</label><select class="select select-sm" id="flSel" data-fl-layout>' +
      LABX.FORMS.map(o => '<option value="' + o[0] + '">' + esc(o[1]) + ' layout</option>').join('') +
      '</select><button type="button" class="btn btn-sm" data-fl-fit aria-pressed="false">' +
      icon('layers', 15) +
      '<span>Fit screen</span></button></div>'
  );
  acts.prepend(bar);
  $('[data-fl-layout]', bar).onchange = e => LABX.set('forms', e.target.value);
  $('[data-fl-fit]', bar).onclick = () => LABX.set('fit', LABX.state.fit === 'on' ? 'off' : 'on');
  form.addEventListener(
    'click',
    e => {
      if (e.target.closest('.form-actions .btn:not([data-fl-back]):not([data-fl-next])'))
        setTimeout(() => flReveal(form), 40);
    },
    true
  );
  form.addEventListener('submit', () => setTimeout(() => flReveal(form), 40), true);
  let t = 0;
  new MutationObserver(() => {
    clearTimeout(t);
    t = setTimeout(() => flMarkErrors(form), 0);
  }).observe(form, { subtree: true, attributes: true, attributeFilter: ['class'] });
  flRender(page, form);
  flBar(page);
}
LABX.subscribe(() => {
  const page = $('#page'),
    f = flFormOf(page);
  if (f) {
    flRender(page, f);
    flBar(page);
  }
});
