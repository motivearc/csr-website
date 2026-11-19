/* ==========================================================================
   Meridian Group — Corporate Responsibility
   Vanilla JS: mobile nav, header state, scroll reveal, metric count-up,
   contact form validation, placeholder downloads. No dependencies.
   ========================================================================== */
(function () {
  'use strict';

  var prefersReducedMotion = !!(window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // MediaQueryList.addEventListener is missing in Safari < 14; fall back to addListener.
  function onMediaChange(query, handler) {
    if (!window.matchMedia) return;
    var mql = window.matchMedia(query);
    if (mql.addEventListener) mql.addEventListener('change', handler);
    else if (mql.addListener) mql.addListener(handler);
  }

  /* ---------- Impact metrics ----------
     The values live in index.html (.metric-value [data-count]); this only animates them. */
  function formatNumber(n, decimals) {
    return n.toLocaleString('en-GB', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  // Reads each metric from the markup, gives screen readers the final value once,
  // and resets the visible number to 0 ready to count up.
  function prepareMetrics() {
    var items = [];
    document.querySelectorAll('.metric-value [data-count]').forEach(function (el) {
      var value = parseFloat(el.getAttribute('data-count'));
      if (isNaN(value)) return;
      var decimals = parseInt(el.getAttribute('data-decimals'), 10) || 0;
      var valueEl = el.closest('.metric-value');

      var srCopy = document.createElement('span');
      srCopy.className = 'visually-hidden';
      srCopy.textContent = valueEl.textContent.trim();
      valueEl.parentNode.insertBefore(srCopy, valueEl);
      valueEl.setAttribute('aria-hidden', 'true');

      el.textContent = formatNumber(0, decimals);
      items.push({ el: el, value: value, decimals: decimals });
    });
    return items;
  }

  function countUp(item) {
    var duration = 1600;
    var start = null;
    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var current = p === 1 ? item.value : item.value * easeOutCubic(p);
      item.el.textContent = formatNumber(current, item.decimals);
      if (p < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  /* ---------- Mobile navigation ---------- */
  function initNav() {
    var header = document.querySelector('.site-header');
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('primary-nav');
    if (!header || !toggle || !nav) return;

    function isOpen() { return nav.classList.contains('is-open'); }
    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    }

    toggle.addEventListener('click', function () {
      setOpen(!isOpen());
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (isOpen() && !e.target.closest('.site-header')) setOpen(false);
    });

    // Close when keyboard focus moves out of the header (e.g. tabbing past the last link).
    // A null relatedTarget (window blur, click on non-focusable content) is ignored;
    // outside clicks are handled above.
    header.addEventListener('focusout', function (e) {
      if (isOpen() && e.relatedTarget && !header.contains(e.relatedTarget)) setOpen(false);
    });

    onMediaChange('(min-width: 861px)', function (mq) {
      if (mq.matches) setOpen(false);
    });
  }

  /* ---------- Header border on scroll + active nav link ---------- */
  function initHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (!('IntersectionObserver' in window)) return;
    var links = document.querySelectorAll('.primary-nav a[href^="#"]');
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute('aria-current'); });
        var link = map[entry.target.id];
        if (link) link.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    Object.keys(map).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) spy.observe(section);
    });
  }

  /* ---------- Scroll reveal + metric trigger ---------- */
  function initReveal() {
    // Without IntersectionObserver, or with reduced motion, leave everything
    // (including the final metric values in the markup) exactly as authored.
    if (!('IntersectionObserver' in window) || prefersReducedMotion) return;

    var revealEls = document.querySelectorAll('.reveal');
    var metricsList = document.getElementById('metrics-list');
    var metricItems = metricsList ? prepareMetrics() : [];

    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    var metricsIo = null;
    if (metricsList && metricItems.length) {
      metricsIo = new IntersectionObserver(function (entries, obs) {
        if (!entries[0].isIntersecting) return;
        metricItems.forEach(function (item, i) {
          setTimeout(function () { countUp(item); }, i * 90);
        });
        obs.disconnect();
      }, { threshold: 0.3 });
    }

    // Only hide .reveal content once the observers that will show it are in place,
    // so an earlier script error can never leave the page invisible.
    document.documentElement.classList.add('js');
    revealEls.forEach(function (el) { io.observe(el); });
    if (metricsIo) metricsIo.observe(metricsList);
  }

  /* ---------- Contact form ---------- */
  function initForm() {
    var form = document.getElementById('contact-form');
    var success = document.getElementById('form-success');
    var successTitle = document.getElementById('success-title');
    var status = document.getElementById('form-status');
    if (!form || !success) return;

    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    var rules = {
      name: function (el) { return el.value.trim().length >= 2 ? '' : 'Please enter your full name.'; },
      email: function (el) {
        var v = el.value.trim();
        if (!v) return 'Please enter your email address.';
        return EMAIL_RE.test(v) ? '' : 'Please enter a valid email address, e.g. name@company.com.';
      },
      message: function (el) {
        var len = el.value.trim().length;
        if (!len) return 'Please tell us how we can help.';
        return len >= 20 ? '' : 'Please add a little more detail (' + (20 - len) + ' more characters).';
      },
      consent: function (el) { return el.checked ? '' : 'Please confirm you agree so we can respond.'; }
    };

    // One polite live region for form-level messages. Cleared first so a
    // repeated identical message is still announced.
    var announceTimer = null;
    function announce(msg) {
      if (!status) return;
      clearTimeout(announceTimer);
      status.textContent = '';
      if (msg) announceTimer = setTimeout(function () { status.textContent = msg; }, 50);
    }

    function hasInput(el) {
      return el.type === 'checkbox' ? el.checked : el.value !== '';
    }

    function validateField(name) {
      var el = form.elements[name];
      var msg = rules[name](el);
      var errEl = document.getElementById(name + '-error');
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (errEl) errEl.textContent = msg;
      return !msg;
    }

    // Validate on blur once something has been entered; re-validate live once a field has been flagged.
    Object.keys(rules).forEach(function (name) {
      var el = form.elements[name];
      el.addEventListener('blur', function () {
        if (hasInput(el) || el.hasAttribute('aria-invalid')) validateField(name);
      });
      el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', function () {
        if (el.getAttribute('aria-invalid') === 'true') validateField(name);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var invalid = [];
      Object.keys(rules).forEach(function (name) {
        if (!validateField(name)) invalid.push(form.elements[name]);
      });
      if (invalid.length) {
        announce(invalid.length === 1 ? '1 field needs attention.' : invalid.length + ' fields need attention.');
        invalid[0].focus();
        return;
      }

      // Simulate a network request (no backend).
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Sending…';
      announce('Sending your message…');

      setTimeout(function () {
        var first = form.elements.name.value.trim().split(/\s+/)[0];
        document.getElementById('success-name').textContent = first ? ', ' + first : '';
        announce('');
        form.hidden = true;
        success.hidden = false;
        if (successTitle) successTitle.focus();
        btn.disabled = false;
        btn.textContent = 'Send message';
      }, 900);
    });

    document.getElementById('form-reset').addEventListener('click', function () {
      form.reset();
      Object.keys(rules).forEach(function (name) {
        form.elements[name].removeAttribute('aria-invalid');
        var errEl = document.getElementById(name + '-error');
        if (errEl) errEl.textContent = '';
      });
      announce('');
      success.hidden = true;
      form.hidden = false;
      form.elements.name.focus();
    });

    // Any link with data-enquiry (CTA buttons, "Request a copy") pre-selects the enquiry type.
    // Delegated so links added later are covered too.
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest && e.target.closest('[data-enquiry]');
      if (trigger) form.elements.topic.value = trigger.getAttribute('data-enquiry');
    });
  }

  /* ---------- Placeholder downloads ----------
     Without JS these links go to #contact. With JS, focus stays on the link and
     one visible status line explains how to request the document. */
  function initDownloads() {
    var statusEl = document.getElementById('download-status');
    if (!statusEl) return;

    document.addEventListener('click', function (e) {
      var link = e.target.closest && e.target.closest('[data-placeholder-download]');
      if (!link) return;
      e.preventDefault();

      var item = link.closest('.report-item');
      var titleEl = item && item.querySelector('.report-title');
      var title = titleEl ? titleEl.textContent.trim() : 'This document';

      var request = document.createElement('a');
      request.href = '#contact';
      request.setAttribute('data-enquiry', 'reporting');
      request.textContent = 'Request a copy';

      statusEl.textContent = '';
      statusEl.appendChild(document.createTextNode('‘' + title + '’ isn’t published online yet. '));
      statusEl.appendChild(request);
    });
  }

  /* ---------- Boot ---------- */
  function init() {
    initNav();
    initHeader();
    initReveal();
    initForm();
    initDownloads();
    var year = document.getElementById('year');
    if (year) year.textContent = String(new Date().getFullYear());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
