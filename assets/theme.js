/* Applies the saved or system theme before first paint. External file so the CSP can forbid inline scripts. */
(function () {
  try {
    var t = localStorage.getItem('atlas-theme');
    if (!t && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) t = 'dark';
    if (t) document.documentElement.setAttribute('data-theme', t);
  } catch (e) {}
})();
