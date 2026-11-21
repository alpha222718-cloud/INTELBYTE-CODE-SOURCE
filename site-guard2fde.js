/**
 * Lightweight anti-clone friction for IntelByte public UI.
 * Host guard blanks clones / file:// saves; blocks casual Save / View Source.
 * Copy buttons, inputs, and .copy-safe regions stay usable.
 */
(function () {
  'use strict';
  if (window.__INTEL_SITE_GUARD__) return;
  window.__INTEL_SITE_GUARD__ = 1;

  var ALLOWED = {
    'intelbyte.ws': 1,
    'www.intelbyte.ws': 1,
    'intelbyte.cc': 1,
    'www.intelbyte.cc': 1,
    'intelbyte.wtf': 1,
    'www.intelbyte.wtf': 1,
    localhost: 1,
    '127.0.0.1': 1
  };

  function hostOk() {
    var h = String(location.hostname || '').toLowerCase();
    if (!h) return false;
    if (ALLOWED[h]) return true;
    try {
      var meta = document.querySelector('meta[name="ib-hosts"]');
      if (meta && meta.content) {
        var parts = String(meta.content).split(/[\s,]+/);
        for (var i = 0; i < parts.length; i++) {
          if (parts[i] && parts[i].toLowerCase() === h) return true;
        }
      }
    } catch (e) {}
    return false;
  }

  if (!hostOk()) {
    try {
      document.documentElement.innerHTML = '';
    } catch (e) {}
    return;
  }

  var path = String(location.pathname || '').toLowerCase();
  var marketing =
    path === '/' ||
    /(?:^|\/)(index|info|how|removal|help|hunt|login)(?:\.html)?$/i.test(path);

  if (marketing) {
    document.documentElement.classList.add('intel-guard-marketing');
    var style = document.createElement('style');
    style.textContent =
      'html.intel-guard-marketing body{-webkit-user-select:none;user-select:none}' +
      'html.intel-guard-marketing input,html.intel-guard-marketing textarea,' +
      'html.intel-guard-marketing select,html.intel-guard-marketing [contenteditable="true"],' +
      'html.intel-guard-marketing .copy-safe,html.intel-guard-marketing [data-allow-select],' +
      'html.intel-guard-marketing .rec-v,html.intel-guard-marketing .chip-v,' +
      'html.intel-guard-marketing code,html.intel-guard-marketing pre{' +
      '-webkit-user-select:text;user-select:text}';
    document.head.appendChild(style);
  }

  function allowInteract(el) {
    if (!el || el.nodeType !== 1) {
      el = el && el.parentElement;
    }
    if (!el || !el.closest) return false;
    if (el.closest('input, textarea, select, [contenteditable="true"]')) return true;
    if (
      el.closest(
        '.copy-safe, [data-allow-select], [data-copy], .rec-copy, .mv-copy, .ai-hit-copy, button, a[href]'
      )
    ) {
      return true;
    }
    return false;
  }

  document.addEventListener(
    'contextmenu',
    function (e) {
      if (allowInteract(e.target)) return;
      e.preventDefault();
    },
    true
  );

  function inField(t) {
    return !!(t && t.closest && t.closest('input, textarea, select, [contenteditable="true"]'));
  }

  document.addEventListener(
    'keydown',
    function (e) {
      var key = String(e.key || '').toLowerCase();
      var code = String(e.code || '').toLowerCase();
      var mod = e.ctrlKey || e.metaKey;

      if (key === 'f12' || code === 'f12') {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (!mod) return;

      if (key === 's' || key === 'u' || key === 'p') {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (e.shiftKey && (key === 'i' || key === 'j' || key === 'c')) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (key === 'a' && marketing && !inField(e.target)) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true
  );

  document.addEventListener(
    'dragstart',
    function (e) {
      var t = e.target;
      if (t && (t.tagName === 'IMG' || (t.closest && t.closest('img')))) {
        e.preventDefault();
      }
    },
    true
  );
})();
