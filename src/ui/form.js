/* =========================================================================
   FORMS
   F() field builder, formData, field errors and validateForm.

   Provides: FID, optionsHTML, F, formData, fieldErr, validateForm
   ========================================================================= */
'use strict';

let FID = 0;
function optionsHTML(list, val, ph) {
  return (
    (ph != null ? '<option value="">' + esc(ph) + '</option>' : '') +
    list
      .map(o => {
        const [v, l] = Array.isArray(o) ? o : [o, o];
        return (
          '<option value="' +
          esc(v) +
          '"' +
          (String(v) === String(val == null ? '' : val) ? ' selected' : '') +
          '>' +
          esc(l) +
          '</option>'
        );
      })
      .join('')
  );
}
function F(o) {
  const id = 'f' + ++FID;
  const span = o.span || 4;
  const v = o.value == null ? '' : o.value;
  const common =
    ' id="' +
    id +
    '" name="' +
    o.name +
    '" data-label="' +
    esc(o.label) +
    '"' +
    (o.req ? ' data-req="1"' : '') +
    (o.disabled ? ' disabled' : '') +
    (o.readonly ? ' readonly' : '') +
    (o.pattern
      ? ' data-pattern="' +
        esc(o.pattern) +
        '" data-pattern-msg="' +
        esc(o.patternMsg || 'Invalid format') +
        '"'
      : '');
  let c;
  if (o.type === 'select')
    c =
      '<select class="select"' +
      common +
      '>' +
      optionsHTML(
        o.options || [],
        v,
        o.placeholder === false ? null : o.placeholder || 'Select ' + o.label.toLowerCase()
      ) +
      '</select>';
  else if (o.type === 'textarea')
    c =
      '<textarea class="textarea"' +
      common +
      ' placeholder="' +
      esc(o.ph || '') +
      '" rows="' +
      (o.rows || 3) +
      '">' +
      esc(v) +
      '</textarea>';
  else if (o.type === 'toggle')
    return (
      '<label class="switch field s-' +
      span +
      '" data-field="' +
      o.name +
      '"><input type="checkbox"' +
      common +
      (v ? ' checked' : '') +
      '><span class="sw"></span><span><b>' +
      esc(o.label) +
      '</b>' +
      (o.hint ? '<small>' + esc(o.hint) + '</small>' : '') +
      '</span></label>'
    );
  else {
    c =
      '<input class="input" type="' +
      (o.type || 'text') +
      '"' +
      common +
      ' value="' +
      esc(v) +
      '"' +
      (o.min != null ? ' min="' + o.min + '"' : '') +
      (o.max != null ? ' max="' + o.max + '"' : '') +
      (o.step != null ? ' step="' + o.step + '"' : '') +
      ' placeholder="' +
      esc(o.ph || '') +
      '"' +
      (o.type === 'number' ? ' inputmode="decimal"' : '') +
      '>';
    if (o.prefix || o.suffix)
      c =
        '<div class="input-group' +
        (o.prefix ? ' has-l' : '') +
        (o.suffix ? ' has-r' : '') +
        '">' +
        (o.prefix ? '<span class="addon">' + esc(o.prefix) + '</span>' : '') +
        c +
        (o.suffix ? '<span class="addon-r">' + esc(o.suffix) + '</span>' : '') +
        '</div>';
  }
  return (
    '<div class="field s-' +
    span +
    '" data-field="' +
    o.name +
    '"><label for="' +
    id +
    '">' +
    esc(o.label) +
    (o.req ? '<span class="req" aria-hidden="true">*</span>' : '') +
    '</label>' +
    c +
    (o.hint ? '<div class="hint">' + esc(o.hint) + '</div>' : '') +
    '<div class="err" role="alert">' +
    icon('alert', 13) +
    '<span></span></div></div>'
  );
}
function formData(form) {
  const d = {};
  $$('[name]', form).forEach(i => {
    if (i.type === 'checkbox') d[i.name] = i.checked;
    else if (i.type === 'number') d[i.name] = i.value === '' ? null : Number(i.value);
    else d[i.name] = i.value.trim();
  });
  return d;
}
function fieldErr(form, name, msg) {
  const f = $('[data-field="' + name + '"]', form);
  if (!f) return;
  f.classList.add('invalid');
  const s = $('.err span', f);
  if (s) s.textContent = msg;
}
function validateForm(form, extra) {
  $$('.field.invalid', form).forEach(f => f.classList.remove('invalid'));
  $$('[name]', form).forEach(i => {
    if (i.disabled || i.type === 'checkbox') return;
    const v = i.value.trim();
    const L = i.dataset.label || i.name;
    let m = '';
    if (i.dataset.req && !v) m = L + ' is required';
    else if (i.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
      m = 'Enter a valid email address';
    else if (i.type === 'number' && v !== '') {
      const n = Number(v);
      if (isNaN(n)) m = L + ' must be a number';
      else if (i.min !== '' && n < Number(i.min)) m = L + ' must be at least ' + i.min;
      else if (i.max !== '' && n > Number(i.max)) m = L + ' must be ' + i.max + ' or less';
    } else if (i.dataset.pattern && v && !new RegExp(i.dataset.pattern).test(v)) m = i.dataset.patternMsg;
    if (m) fieldErr(form, i.name, m);
  });
  if (extra) extra((n, m) => fieldErr(form, n, m));
  const bad = $$('.field.invalid', form);
  if (bad.length) {
    const inp = $('[name]', bad[0]);
    const panel = bad[0].closest('.tab-panel');
    if (panel && !panel.classList.contains('active')) {
      const root = panel.closest('[data-tabs]');
      const t = $('.tab[data-tab="' + panel.dataset.panel + '"]', root);
      if (t) t.click();
    }
    if (inp) {
      inp.focus({ preventScroll: true });
      bad[0].scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    toast(
      'error',
      'Check the highlighted fields',
      bad.length + ' field' + (bad.length > 1 ? 's need' : ' needs') + ' attention before saving.'
    );
    return false;
  }
  return true;
}
document.addEventListener('input', e => {
  const f = e.target.closest('.field.invalid');
  if (f) f.classList.remove('invalid');
  if (e.target.classList && e.target.classList.contains('invalid')) e.target.classList.remove('invalid');
});
document.addEventListener('change', e => {
  const f = e.target.closest('.field.invalid');
  if (f) f.classList.remove('invalid');
});
