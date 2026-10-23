/* =========================================================================
   CHARTS
   Pure SVG line, bar, donut and horizontal bar charts.

   Provides: CHARTS, niceStep, scaleY, lineChart, barChart, legendHTML,
   donut, hbars
   ========================================================================= */
'use strict';

const CHARTS = {};
function niceStep(v) {
  const p = Math.pow(10, Math.floor(Math.log10(v || 1)));
  const f = v / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
}
function scaleY(vals, zero) {
  let mx = Math.max(...vals, 0),
    mn = zero === false ? Math.min(...vals) : 0;
  if (mx === mn) mx = mn + 1;
  const step = niceStep((mx - mn) / 4);
  mn = zero === false ? Math.floor(mn / step) * step : 0;
  mx = Math.ceil(mx / step) * step;
  const ticks = [];
  for (let v = mn; v <= mx + 1e-9; v += step) ticks.push(v);
  return { mn, mx, ticks };
}
function lineChart(o) {
  const id = uid('ch');
  const W = 640,
    H = o.h || 220,
    pl = o.pl || 52,
    pr = 10,
    pt = 10,
    pb = 26;
  const all = o.series.flatMap(s => s.values);
  const { mn, mx, ticks } = scaleY(all, o.zero);
  const n = o.labels.length;
  const x = i => pl + (W - pl - pr) * (n === 1 ? 0.5 : i / (n - 1)),
    y = v => pt + (H - pt - pb) * (1 - (v - mn) / (mx - mn));
  const fy = o.fmtAxis || (v => fmtN(v));
  let s =
    '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.title || 'Line chart') + '">';
  ticks.forEach(t => {
    s +=
      '<line class="gridline" x1="' +
      pl +
      '" x2="' +
      (W - pr) +
      '" y1="' +
      y(t) +
      '" y2="' +
      y(t) +
      '"/><text x="' +
      (pl - 8) +
      '" y="' +
      (y(t) + 4) +
      '" text-anchor="end">' +
      esc(fy(t)) +
      '</text>';
  });
  const every = Math.ceil(n / 8);
  o.labels.forEach((l, i) => {
    if (i % every === 0 || i === n - 1)
      s += '<text x="' + x(i) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(l) + '</text>';
  });
  o.series.forEach((se, si) => {
    const pts = se.values.map((v, i) => x(i).toFixed(1) + ',' + y(v).toFixed(1));
    if (o.area !== false && si === 0)
      s +=
        '<path d="M' +
        pts.join(' L') +
        ' L' +
        x(n - 1) +
        ',' +
        y(mn) +
        ' L' +
        x(0) +
        ',' +
        y(mn) +
        'Z" style="fill:' +
        se.color +
        ';opacity:.1"/>';
    s +=
      '<polyline points="' +
      pts.join(' ') +
      '" fill="none" style="stroke:' +
      se.color +
      '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"' +
      (se.dash ? ' stroke-dasharray="4 4"' : '') +
      '/>';
  });
  for (let i = 0; i < n; i++) {
    s +=
      '<g class="hover-dot" data-hd="' +
      i +
      '"><line x1="' +
      x(i) +
      '" x2="' +
      x(i) +
      '" y1="' +
      pt +
      '" y2="' +
      (H - pb) +
      '" style="stroke:var(--border-strong)" stroke-dasharray="3 3"/>' +
      o.series
        .map(
          se =>
            '<circle cx="' +
            x(i) +
            '" cy="' +
            y(se.values[i]) +
            '" r="4" style="fill:var(--surface);stroke:' +
            se.color +
            '" stroke-width="2"/>'
        )
        .join('') +
      '</g>';
    const w = (W - pl - pr) / Math.max(1, n - 1);
    s +=
      '<rect x="' +
      (x(i) - w / 2) +
      '" y="' +
      pt +
      '" width="' +
      w +
      '" height="' +
      (H - pt - pb) +
      '" fill="transparent" data-ci="' +
      id +
      '" data-i="' +
      i +
      '"/>';
  }
  s += '</svg>';
  CHARTS[id] = { labels: o.labels, series: o.series, fmt: o.fmt || (v => fmtN(v)) };
  return (
    legendHTML(o.series) + '<div class="chart" id="' + id + '">' + s + '<div class="chart-tip"></div></div>'
  );
}
function barChart(o) {
  const id = uid('ch');
  const W = 640,
    H = o.h || 220,
    pl = o.pl || 48,
    pr = 10,
    pt = 10,
    pb = 26;
  const n = o.labels.length,
    m = o.series.length;
  const all = o.stacked
    ? o.labels.map((_, i) => sum(o.series, s => s.values[i]))
    : o.series.flatMap(s => s.values);
  const { mn, mx, ticks } = scaleY(all);
  const fy = o.fmtAxis || (v => fmtN(v));
  const y = v => pt + (H - pt - pb) * (1 - (v - mn) / (mx - mn));
  const band = (W - pl - pr) / n;
  const gw = band * 0.64;
  const bw = o.stacked ? gw : gw / m;
  let s =
    '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.title || 'Bar chart') + '">';
  ticks.forEach(t => {
    s +=
      '<line class="gridline" x1="' +
      pl +
      '" x2="' +
      (W - pr) +
      '" y1="' +
      y(t) +
      '" y2="' +
      y(t) +
      '"/><text x="' +
      (pl - 8) +
      '" y="' +
      (y(t) + 4) +
      '" text-anchor="end">' +
      esc(fy(t)) +
      '</text>';
  });
  o.labels.forEach((l, i) => {
    const x0 = pl + band * i + (band - gw) / 2;
    let acc = 0;
    o.series.forEach((se, si) => {
      const v = se.values[i];
      const col = (o.colors && o.colors[i]) || se.color;
      let bx, by, bh;
      if (o.stacked) {
        by = y(acc + v);
        bh = y(acc) - y(acc + v);
        bx = x0;
        acc += v;
      } else {
        bx = x0 + bw * si;
        by = y(v);
        bh = y(0) - y(v);
      }
      s +=
        '<rect x="' +
        bx.toFixed(1) +
        '" y="' +
        by.toFixed(1) +
        '" width="' +
        Math.max(1, bw - (o.stacked ? 0 : 2)).toFixed(1) +
        '" height="' +
        Math.max(0, bh).toFixed(1) +
        '" rx="2" style="fill:' +
        col +
        '"/>';
    });
    s +=
      '<text x="' +
      (pl + band * i + band / 2) +
      '" y="' +
      (H - 6) +
      '" text-anchor="middle">' +
      esc(l) +
      '</text>';
    s +=
      '<rect x="' +
      (pl + band * i) +
      '" y="' +
      pt +
      '" width="' +
      band +
      '" height="' +
      (H - pt - pb) +
      '" fill="transparent" data-ci="' +
      id +
      '" data-i="' +
      i +
      '"/>';
  });
  s += '</svg>';
  CHARTS[id] = { labels: o.labels, series: o.series, fmt: o.fmt || (v => fmtN(v)) };
  return (
    (o.legend === false ? '' : legendHTML(o.series)) +
    '<div class="chart" id="' +
    id +
    '">' +
    s +
    '<div class="chart-tip"></div></div>'
  );
}
function legendHTML(series) {
  return series.length > 1
    ? '<div class="chart-legend">' +
        series
          .map(s => '<span><i style="background:' + s.color + '"></i>' + esc(s.name) + '</span>')
          .join('') +
        '</div>'
    : '';
}
function donut(items, o) {
  o = o || {};
  const total = sum(items, i => i.value) || 1;
  const R0 = 70,
    C = 2 * Math.PI * R0;
  let off = 0;
  let s =
    '<svg viewBox="0 0 180 180" role="img" aria-label="' +
    esc(o.title || 'Distribution') +
    '"><circle cx="90" cy="90" r="' +
    R0 +
    '" fill="none" style="stroke:var(--surface-secondary)" stroke-width="22"/>';
  items.forEach(it => {
    const len = (C * it.value) / total;
    s +=
      '<circle cx="90" cy="90" r="' +
      R0 +
      '" fill="none" style="stroke:' +
      it.color +
      '" stroke-width="22" stroke-dasharray="' +
      Math.max(0, len - 1.5).toFixed(2) +
      ' ' +
      (C - len + 1.5).toFixed(2) +
      '" stroke-dashoffset="' +
      (-off).toFixed(2) +
      '" transform="rotate(-90 90 90)"><title>' +
      esc(it.label) +
      ': ' +
      esc((o.fmt || fmtN)(it.value)) +
      '</title></circle>';
    off += len;
  });
  s +=
    '<text x="90" y="86" text-anchor="middle" style="font-size:20px;font-weight:650;fill:var(--text)">' +
    esc(o.center || '') +
    '</text><text x="90" y="106" text-anchor="middle" style="font-size:11px">' +
    esc(o.centerSub || '') +
    '</text></svg>';
  return (
    '<div class="donut-wrap"><div class="chart">' +
    s +
    '</div><div class="donut-legend">' +
    items
      .map(
        it =>
          '<div><i style="background:' +
          it.color +
          '"></i><span title="' +
          esc(it.label) +
          '">' +
          esc(it.label) +
          '</span><b>' +
          esc((o.fmt || fmtN)(it.value)) +
          '</b><em>' +
          ((it.value / total) * 100).toFixed(0) +
          '%</em></div>'
      )
      .join('') +
    '</div></div>'
  );
}
function hbars(items, o) {
  o = o || {};
  const mx = Math.max(...items.map(i => i.max || i.value), 1);
  return (
    '<div class="hbars">' +
    items
      .map(
        it =>
          '<div class="hbar-row"><span class="nm">' +
          (it.html || esc(it.label)) +
          '</span><span class="vl">' +
          esc((o.fmt || fmtN)(it.value)) +
          '</span><div class="bar ' +
          (it.cls || '') +
          '"><i style="width:' +
          clamp((it.value / (it.max || mx)) * 100, 0, 100).toFixed(1) +
          '%"></i></div></div>'
      )
      .join('') +
    '</div>'
  );
}
document.addEventListener('mousemove', e => {
  const r = e.target.closest && e.target.closest('[data-ci]');
  $$('.chart .hover-dot[style]').forEach(g => {
    if (!r || g.closest('.chart').id !== r.dataset.ci || g.dataset.hd !== r.dataset.i)
      g.removeAttribute('style');
  });
  $$('.chart-tip.show').forEach(t => {
    if (!r || t.parentNode.id !== r.dataset.ci) t.classList.remove('show');
  });
  if (!r) return;
  const c = CHARTS[r.dataset.ci];
  if (!c) return;
  const box = document.getElementById(r.dataset.ci);
  const i = +r.dataset.i;
  const tip = $('.chart-tip', box);
  tip.innerHTML =
    '<b>' +
    esc(c.labels[i]) +
    '</b>' +
    c.series
      .map(
        s =>
          '<div class="row" style="gap:6px"><i style="width:8px;height:8px;border-radius:2px;background:' +
          s.color +
          ';display:inline-block"></i>' +
          esc(s.name) +
          ': <b style="display:inline;margin:0">' +
          esc(c.fmt(s.values[i])) +
          '</b></div>'
      )
      .join('');
  const g = $('.hover-dot[data-hd="' + i + '"]', box);
  if (g) g.style.opacity = 1;
  const br = box.getBoundingClientRect();
  let lx = e.clientX - br.left + 14;
  if (lx + tip.offsetWidth > br.width) lx = e.clientX - br.left - tip.offsetWidth - 14;
  tip.style.left = lx + 'px';
  tip.style.top = Math.max(0, e.clientY - br.top - tip.offsetHeight - 8) + 'px';
  tip.classList.add('show');
});
