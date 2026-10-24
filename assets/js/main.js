(function () {
  'use strict';

  var header = document.querySelector('.site-header');
  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.getElementById('site-nav');

  // Footer year
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Header border once the page scrolls
  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile menu
  function setMenu(open) {
    header.setAttribute('data-open', String(open));
    menuBtn.setAttribute('aria-expanded', String(open));
  }
  menuBtn.addEventListener('click', function () {
    setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menuBtn.focus();
    }
  });

  // Mark the nav link for the section in view
  var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
  var targets = links
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && targets.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          if (a.getAttribute('href') === '#' + entry.target.id) {
            a.setAttribute('aria-current', 'true');
          } else {
            a.removeAttribute('aria-current');
          }
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    targets.forEach(function (t) { io.observe(t); });
  }

  // Google Analytics events (same event names as the previous version of the site)
  function track(name, params) {
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
  }
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-track]');
    if (!el) return;
    var params = {};
    if (el.dataset.category) params.event_category = el.dataset.category;
    if (el.dataset.label) params.event_label = el.dataset.label;
    if (el.dataset.cert) params.certificate_name = el.dataset.cert;
    track(el.dataset.track, params);
  });

  // Contact form: send in the page and report the result
  var form = document.getElementById('contact-form');
  if (form) {
    var status = form.querySelector('.form__status');
    var submit = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', function (e) {
      if (!window.fetch || !window.FormData) return; // fall back to a normal post
      e.preventDefault();

      submit.disabled = true;
      status.removeAttribute('data-state');
      status.textContent = 'Sending…';

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Request failed with status ' + res.status);
          form.reset();
          status.textContent = 'Message sent. I will reply by email.';
          track('message_submit', { event_category: 'form', event_label: 'Send Me Form' });
        })
        .catch(function () {
          status.setAttribute('data-state', 'error');
          status.textContent = 'Your message was not sent. Check your connection and try again, or email mohannellore17@gmail.com.';
        })
        .then(function () {
          submit.disabled = false;
        });
    });
  }
})();
