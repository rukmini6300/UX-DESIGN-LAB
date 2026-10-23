/* =========================================================================
   UTILITIES
   Small, dependency-free helpers: DOM, storage, formatting, dates and
   seeded sample-data randomness.

   Provides: $, $$, el, esc, loadScript, runInlineScript, store, fmtN,
   fmtM, fmtK, pl, initials, sum, clamp, uid, MON, NOW, TODAY, toD, fmtD,
   fmtDT, isoDate, daysBetween, addDays, rng, R, ri, pick
   ========================================================================= */
'use strict';

/* ---------- DOM ---------- */

/** First element matching a CSS selector, inside `root` (default: the document). */
const $ = (selector, root) => (root || document).querySelector(selector);

/** Every element matching a CSS selector, as a real array. */
const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));

/** Builds one element from an HTML string: el('<div class="x">Hi</div>'). */
function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

/** Escapes text for safe use inside HTML markup and attributes. */
const esc = value =>
  String(value == null ? '' : value).replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );

/** Loads a classic script file and resolves when it has run. */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => {
      s.remove();
      reject(new Error('Could not load ' + src));
    };
    document.body.append(s);
  });
}

/** Runs JavaScript source text as a classic script (used for code shipped inline in the single-file build). */
function runInlineScript(code) {
  const s = document.createElement('script');
  s.textContent = code;
  document.body.append(s);
}

/* ---------- Storage ---------- */

/**
 * Reads or writes one localStorage key. store(k) reads; store(k, v) writes.
 * Never throws: storage can be blocked (private mode, sandboxed previews), and then reads return null.
 */
function store(key, value) {
  try {
    if (value === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, value);
  } catch (e) {
    return null;
  }
}

/* ---------- Numbers and text ---------- */

/** 12,345 (optionally with `d` decimals). */
const fmtN = (n, d) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });

/** Money: $1,234.50 (2 decimals unless `d` is given); negatives use a true minus sign. */
const fmtM = (n, d) =>
  (n < 0 ? '−' : '') +
  '$' +
  Math.abs(Number(n || 0)).toLocaleString('en-US', {
    minimumFractionDigits: d == null ? 2 : d,
    maximumFractionDigits: d == null ? 2 : d
  });

/** Compact money: $1.25M, $12.5K, $950. */
const fmtK = n => {
  n = Number(n || 0);
  const a = Math.abs(n);
  if (a >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (a >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
  return '$' + n.toFixed(0);
};

/** "3 items" / "1 item": count followed by a word, pluralised with an "s". */
const pl = (n, word) => n + ' ' + word + (n === 1 ? '' : 's');

/** Up to two initials from a name: "Alex Morgan" -> "AM". */
const initials = name =>
  String(name)
    .split(' ')
    .map(s => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

/** Sum of an array, optionally of `pick(item)` for each item. */
const sum = (list, pick) => list.reduce((s, x) => s + (pick ? pick(x) : x), 0);

/** Keeps `v` between `min` and `max`. */
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/** Short random id with an optional prefix: uid('PO') -> "PO-k3j9x0a". */
const uid = prefix => (prefix || 'id') + '-' + Math.random().toString(36).slice(2, 9);

/* ---------- Dates ---------- */

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Current time. Every "now" in the app goes through here. */
const NOW = () => new Date();

/** Anchor date of the sample data (seeded history ends here). */
const TODAY = new Date(2026, 9, 19, 10, 45);

/** Accepts a Date or anything `new Date()` accepts. */
const toD = d => (d instanceof Date ? d : new Date(d));

/** 05 Oct 2026 (an em dash when empty). */
const fmtD = d => {
  if (!d) return '—';
  d = toD(d);
  return String(d.getDate()).padStart(2, '0') + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear();
};

/** 05 Oct 2026 14:30. */
const fmtDT = d => {
  if (!d) return '—';
  d = toD(d);
  return (
    fmtD(d) + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
  );
};

/** 2026-10-05, the value format of <input type="date">. */
const isoDate = d => {
  d = toD(d);
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
};

/** Whole days from `a` to `b` (negative when b is earlier). */
const daysBetween = (a, b) => Math.round((toD(b) - toD(a)) / 864e5);

/** A new date `n` days after `d` (n may be negative). */
const addDays = (d, n) => {
  const x = new Date(toD(d));
  x.setDate(x.getDate() + n);
  return x;
};

/* ---------- Sample data randomness ---------- */

/** Seeded random number generator (mulberry32): the same seed gives the same sample data on every load. */
function rng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Shared generator for sample data. */
const R = rng(20261019);

/** Random integer from `a` to `b`, inclusive. */
const ri = (a, b) => Math.floor(R() * (b - a + 1)) + a;

/** Random item of an array. */
const pick = list => list[Math.floor(R() * list.length)];
