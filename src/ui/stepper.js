/* =========================================================================
   STEPPER
   stepperHTML: document workflow steps with an error state.

   Provides: stepperHTML
   ========================================================================= */
'use strict';

function stepperHTML(steps, current, o) {
  o = o || {};
  return (
    '<div class="stepper" role="list">' +
    steps
      .map((s, i) => {
        const err = o.error === i;
        const cls = err ? 'error' : i < current ? 'done' : i === current ? 'current' : '';
        const meta = o.meta && o.meta[i];
        return (
          '<div class="step ' +
          cls +
          '" role="listitem" aria-current="' +
          (i === current ? 'step' : 'false') +
          '"><span class="step-dot">' +
          (err ? icon('x', 16) : i < current ? icon('check', 16) : i + 1) +
          '</span><span class="step-label">' +
          esc(s) +
          '</span>' +
          (meta ? '<span class="step-meta">' + meta + '</span>' : '') +
          '</div>'
        );
      })
      .join('') +
    '</div>'
  );
}
