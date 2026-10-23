/* =========================================================================
   EMBED MODE
   Marks the page when it is shown inside the device preview frame
   (?embed=1, ?touch=1).
   ========================================================================= */

(function () {
  var q = location.search,
    D = document.documentElement;
  if (/[?&]embed=1/.test(q)) {
    D.setAttribute('data-embed', '1');
    if (/[?&]touch=1/.test(q)) D.setAttribute('data-touch', '1');
  }
})();
