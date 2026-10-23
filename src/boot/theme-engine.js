/* =========================================================================
   THEME ENGINE
   Builds light and dark brand tokens from one color or a two-stop gradient
   and applies the saved theme before first paint. Exposes
   window.KagamiTheme.

   Provides: D, get, hex, toHex, mix, lum, contrast, reach, rgba, W, K, DS,
   tokens, css, apply, mode, t, nav, cfg
   ========================================================================= */

/* ============ THEME ENGINE (runs before first paint) ============
   Builds light + dark token sets from one brand color or a two-stop gradient. */
(function () {
  var D = document.documentElement;
  function get(k) {
    try {
      return localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  }
  function hex(c) {
    c = String(c || '').trim();
    var m = c.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (m)
      return [+m[1], +m[2], +m[3]].map(function (v) {
        return Math.min(255, v);
      });
    c = c.replace('#', '');
    if (c.length === 3)
      c = c
        .split('')
        .map(function (x) {
          return x + x;
        })
        .join('');
    if (!/^[0-9a-f]{6}$/i.test(c)) return null;
    return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
  }
  function toHex(r) {
    return (
      '#' +
      r
        .map(function (v) {
          v = Math.round(Math.max(0, Math.min(255, v)));
          return (v < 16 ? '0' : '') + v.toString(16);
        })
        .join('')
        .toUpperCase()
    );
  }
  function mix(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }
  function lum(r) {
    var c = r.map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contrast(a, b) {
    var x = lum(a),
      y = lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  function reach(c, bg, min, to) {
    var out = c;
    for (var i = 1; i <= 30 && contrast(out, bg) < min; i++) out = mix(c, to, i / 30);
    return out;
  }
  function rgba(r, a) {
    return 'rgba(' + r.map(Math.round).join(',') + ',' + a + ')';
  }
  var W = [255, 255, 255],
    K = [0, 0, 0],
    DS = [23, 27, 33];
  function tokens(cfg) {
    cfg = cfg || {};
    var g = cfg.type === 'gradient';
    var a = hex(g ? cfg.a : cfg.color) || [242, 101, 34],
      b = g ? hex(cfg.b) || a : a,
      ang = (g && !isNaN(+cfg.angle) ? +cfg.angle : 135) + 'deg';
    function mode(dark) {
      var ga = dark ? reach(a, DS, 3, W) : a,
        gb = dark ? reach(b, DS, 3, W) : b,
        p = ga,
        soft = mix(p, W, 0.9);
      var text = dark ? reach(mix(p, W, 0.3), DS, 5.5, W) : reach(p, soft, 4.8, K);
      var onW = Math.min(contrast(ga, W), contrast(gb, W)) >= 2.6,
        ht = dark ? W : K,
        hv = dark ? 0.14 : 0.12;
      return {
        '--primary': toHex(p),
        '--primary-hover': toHex(mix(p, ht, hv)),
        '--primary-soft': dark ? rgba(p, 0.16) : toHex(soft),
        '--primary-text': toHex(text),
        '--on-primary': onW ? '#FFFFFF' : '#111827',
        '--focus': '0 0 0 3px ' + rgba(p, dark ? 0.4 : 0.28),
        '--c1': toHex(p),
        '--grad-a': toHex(ga),
        '--grad-b': toHex(gb),
        '--grad-angle': ang,
        '--primary-grad': 'linear-gradient(' + ang + ',' + toHex(ga) + ',' + toHex(gb) + ')',
        '--primary-hover-grad':
          'linear-gradient(' + ang + ',' + toHex(mix(ga, ht, hv)) + ',' + toHex(mix(gb, ht, hv)) + ')'
      };
    }
    return { light: mode(false), dark: mode(true) };
  }
  function css(o) {
    var s = '';
    for (var k in o) s += k + ':' + o[k] + ';';
    return s;
  }
  function apply(cfg) {
    var t = tokens(cfg),
      el = document.getElementById('kagami-brand');
    if (!el) {
      el = document.createElement('style');
      el.id = 'kagami-brand';
      document.head.appendChild(el);
    }
    el.textContent = 'html:root{' + css(t.light) + '}html:root[data-theme="dark"]{' + css(t.dark) + '}';
    D.setAttribute('data-brand', cfg && cfg.type === 'gradient' ? 'gradient' : 'solid');
    return t;
  }
  var mode = get('kagami-mode'),
    t = get('kagami-theme');
  if (mode === 'system' || !t)
    t = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  D.setAttribute('data-theme', t);
  var nav = get('kagami-nav');
  D.setAttribute('data-nav', /^(left|right|top|bottom)$/.test(nav || '') ? nav : 'left');
  var cfg = null;
  try {
    cfg = JSON.parse(get('kagami-brand') || 'null');
  } catch (e) {}
  window.KagamiTheme = {
    tokens: tokens,
    apply: apply,
    hex: hex,
    toHex: toHex,
    contrast: contrast,
    DEFAULT: { type: 'solid', color: '#F26522' }
  };
  apply(cfg && (cfg.color || cfg.a) ? cfg : window.KagamiTheme.DEFAULT);
})();
