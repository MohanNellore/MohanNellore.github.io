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

  /* ------------------------------------------------------------------
     Interactive layer. Everything below is an enhancement: without
     JavaScript the page is still complete, and the controls stay hidden.
     ------------------------------------------------------------------ */
  var root = document.documentElement;
  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function all(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  // Theme toggle (the saved or system theme was already applied before first paint)
  var themeBtn = document.querySelector('.theme-btn');
  function currentTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }
  function applyTheme(theme, save) {
    root.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0B1220' : '#F4F6FA');
    if (themeBtn) {
      themeBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    }
    if (save) {
      try { localStorage.setItem('theme', theme); } catch (err) { /* storage can be blocked */ }
    }
  }
  if (themeBtn) {
    themeBtn.hidden = false;
    applyTheme(currentTheme(), false);
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next, true);
      track('theme_toggle', { event_category: 'engagement', event_label: next });
    });
  }

  // Reading progress bar under the header
  var bar = document.querySelector('.progress');
  if (bar) {
    var ticking = false;
    var updateProgress = function () {
      ticking = false;
      var max = root.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = 'scaleX(' + p + ')';
    };
    var requestProgress = function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateProgress);
      }
    };
    updateProgress();
    window.addEventListener('scroll', requestProgress, { passive: true });
    window.addEventListener('resize', requestProgress);
  }

  // Sections fade in as they scroll into view
  var revealEls = all('.reveal');
  if ('IntersectionObserver' in window && revealEls.length && !reduceMotion) {
    root.classList.add('reveal-ready');
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealIO.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
    revealEls.forEach(function (el) { revealIO.observe(el); });
  }

  // The 30% and 25% results count up once, when they first scroll into view
  function countUp(el) {
    var end = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(end)) return;
    // Hold the final width so the text around the number does not shift while it counts.
    var width = el.getBoundingClientRect().width;
    el.style.display = 'inline-block';
    el.style.minWidth = width + 'px';
    var start = null;
    var duration = 900;
    function tick(now) {
      if (start === null) start = now;
      var k = Math.min(1, (now - start) / duration);
      el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))) + '%';
      if (k < 1) window.requestAnimationFrame(tick);
    }
    el.textContent = '0%';
    window.requestAnimationFrame(tick);
  }
  var counters = all('[data-count]');
  if ('IntersectionObserver' in window && counters.length && !reduceMotion) {
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countIO.unobserve(entry.target);
        countUp(entry.target);
      });
    }, { threshold: 1 });
    counters.forEach(function (el) { countIO.observe(el); });
  }

  // Project filter by tool
  var filter = document.querySelector('.filter');
  var projects = all('.project[data-tools]');
  if (filter && projects.length) {
    var chips = all('.chip', filter);
    var filterStatus = filter.querySelector('.filter__status');

    var usesTool = function (project, tool) {
      return (' ' + project.getAttribute('data-tools') + ' ').indexOf(' ' + tool + ' ') > -1;
    };

    chips.forEach(function (chip) {
      var tool = chip.getAttribute('data-filter');
      var count = tool === 'all' ? projects.length : projects.filter(function (p) { return usesTool(p, tool); }).length;
      var badge = document.createElement('span');
      badge.className = 'chip__n';
      badge.setAttribute('aria-hidden', 'true');
      badge.textContent = count;
      chip.appendChild(badge);
    });

    var setFilter = function (tool, label) {
      chips.forEach(function (chip) {
        chip.setAttribute('aria-pressed', String(chip.getAttribute('data-filter') === tool));
      });
      var visible = [];
      projects.forEach(function (p) {
        var show = tool === 'all' || usesTool(p, tool);
        p.hidden = !show;
        p.classList.remove('is-first', 'is-last');
        if (show) visible.push(p);
      });
      // The first and last visible project drop their outer rule and padding.
      if (visible.length) {
        visible[0].classList.add('is-first');
        visible[visible.length - 1].classList.add('is-last');
      }
      filterStatus.textContent = tool === 'all'
        ? ''
        : 'Showing ' + visible.length + ' of ' + projects.length + ' projects that use ' + label + '.';
    };

    filter.hidden = false;
    filter.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      var tool = chip.getAttribute('data-filter');
      var label = chip.firstChild.textContent;
      setFilter(tool, label);
      track('project_filter', { event_category: 'engagement', event_label: label });
    });
  }

  // Pipeline explorer and quality-gate demo
  var lab = document.querySelector('.project__lab');
  if (lab) {
    lab.hidden = false;

    // Tabs (arrow keys, Home and End move between them)
    var tabs = all('[role="tab"]', lab);
    var selectTab = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tab.focus();
    };
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { selectTab(tab, false); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') next = tabs[0];
        else if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) {
          e.preventDefault();
          selectTab(next, true);
        }
      });
    });

    // Pipeline steps
    var stepBtns = all('.step', lab);
    var diagramNodes = all('.project__thumb [data-step]');
    var detail = document.getElementById('step-detail');
    var prevBtn = lab.querySelector('[data-dir="-1"]');
    var nextBtn = lab.querySelector('[data-dir="1"]');

    var showStep = function (index, fromUser) {
      index = Math.max(0, Math.min(stepBtns.length - 1, index));
      stepBtns.forEach(function (btn, k) {
        if (k === index) btn.setAttribute('aria-current', 'step');
        else btn.removeAttribute('aria-current');
      });
      diagramNodes.forEach(function (node) {
        node.classList.toggle('is-on', Number(node.getAttribute('data-step')) === index);
      });
      var source = lab.querySelector('[data-step-text="' + index + '"]');
      detail.innerHTML = source ? source.innerHTML : '';
      prevBtn.disabled = index === 0;
      nextBtn.disabled = index === stepBtns.length - 1;
      lab.setAttribute('data-step', String(index));
      if (fromUser) {
        track('pipeline_step', {
          event_category: 'engagement',
          event_label: stepBtns[index].textContent.replace(/^\d+/, '')
        });
      }
    };
    var currentStep = function () { return Number(lab.getAttribute('data-step')) || 0; };

    stepBtns.forEach(function (btn, k) {
      btn.addEventListener('click', function () { showStep(k, true); });
    });
    prevBtn.addEventListener('click', function () { showStep(currentStep() - 1, true); });
    nextBtn.addEventListener('click', function () { showStep(currentStep() + 1, true); });

    // Clicking a box in the diagram jumps to that step (the buttons are the keyboard route)
    var owner = lab.closest('.project');
    var thumb = owner ? owner.querySelector('.project__thumb') : null;
    if (thumb) {
      thumb.addEventListener('click', function (e) {
        var node = e.target.closest ? e.target.closest('[data-step]') : null;
        if (!node) return;
        selectTab(tabs[0], false);
        showStep(Number(node.getAttribute('data-step')), true);
        lab.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    }
    showStep(0, false);

    // Quality-gate demo: made-up rows, three rules, a gate that blocks the load
    var SAMPLE = [
      { id: 1, date: '2025-01-05', city: 'Hyderabad', aqi: 112 },
      { id: 2, date: '2025-01-05', city: 'Delhi', aqi: 287 },
      { id: 3, date: '2025-01-06', city: 'Mumbai', aqi: 96 },
      { id: 4, date: '2025-01-06', city: 'Mumbai', aqi: 96 },
      { id: 5, date: '2025-01-07', city: 'Chennai', aqi: -45 },
      { id: 6, date: '2025-02-30', city: 'Delhi', aqi: 201 },
      { id: 7, date: '2025-01-08', city: 'Bengaluru', aqi: 78 },
      { id: 8, date: '2025-01-09', city: 'Hyderabad', aqi: 104 }
    ];

    var gateBody = document.getElementById('gate-rows');
    var gateChecks = all('#gate-checks .check');
    var verdict = document.getElementById('gate-verdict');
    var runBtn = document.getElementById('gate-run');
    var fixBtn = document.getElementById('gate-fix');
    var resetBtn = document.getElementById('gate-reset');
    var rows = SAMPLE.slice();
    var result = null;

    var isRealDate = function (text) {
      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
      if (!m) return false;
      var y = Number(m[1]);
      var mo = Number(m[2]);
      var d = Number(m[3]);
      var dt = new Date(Date.UTC(y, mo - 1, d));
      return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
    };

    var evaluate = function (list) {
      var seen = {};
      var flags = {};
      var counts = { duplicates: 0, negative: 0, dates: 0 };
      var failing = 0;
      list.forEach(function (r) {
        var f = [];
        var key = r.date + '|' + r.city + '|' + r.aqi;
        if (seen[key]) { f.push('duplicate row'); counts.duplicates++; } else { seen[key] = true; }
        if (r.aqi < 0) { f.push('negative AQI'); counts.negative++; }
        if (!isRealDate(r.date)) { f.push('invalid date'); counts.dates++; }
        if (f.length) failing++;
        flags[r.id] = f;
      });
      return { flags: flags, counts: counts, failing: failing };
    };

    var setVerdict = function (state, text) {
      verdict.setAttribute('data-state', state);
      verdict.textContent = text;
    };

    var renderGate = function () {
      gateBody.textContent = '';
      rows.forEach(function (r) {
        var tr = document.createElement('tr');
        var flags = result ? result.flags[r.id] : null;
        if (flags && flags.length) tr.className = 'is-bad';

        var th = document.createElement('th');
        th.scope = 'row';
        th.textContent = r.id;
        tr.appendChild(th);

        [r.date, r.city].forEach(function (value) {
          var td = document.createElement('td');
          td.textContent = value;
          tr.appendChild(td);
        });

        var aqi = document.createElement('td');
        aqi.className = 'num';
        aqi.textContent = r.aqi;
        tr.appendChild(aqi);

        var out = document.createElement('td');
        if (!flags) {
          out.textContent = 'Not checked';
        } else if (!flags.length) {
          out.textContent = 'OK';
        } else {
          flags.forEach(function (name, k) {
            var tag = document.createElement('span');
            tag.className = 'flag';
            tag.textContent = name;
            if (k) out.appendChild(document.createTextNode(' '));
            out.appendChild(tag);
          });
        }
        tr.appendChild(out);
        gateBody.appendChild(tr);
      });

      gateChecks.forEach(function (li) {
        var res = li.querySelector('.check__res');
        if (!result) {
          li.setAttribute('data-state', 'idle');
          res.textContent = 'Not run';
          return;
        }
        var n = result.counts[li.getAttribute('data-check')];
        li.setAttribute('data-state', n ? 'fail' : 'pass');
        res.textContent = n ? 'Fail (' + n + ')' : 'Pass';
      });

      fixBtn.disabled = !(result && result.failing);
    };

    runBtn.addEventListener('click', function () {
      result = evaluate(rows);
      renderGate();
      if (result.failing) {
        setVerdict('fail', 'Quality gate failed: ' + result.failing + (result.failing === 1 ? ' row breaks' : ' rows break') +
          ' the rules, so the load to BigQuery is blocked.');
      } else {
        setVerdict('pass', 'Quality gate passed: every row follows the rules, so the load to BigQuery can go ahead.');
      }
      track('quality_gate_run', { event_category: 'engagement', event_label: result.failing ? 'failed' : 'passed' });
    });

    fixBtn.addEventListener('click', function () {
      if (!result) return;
      var flags = result.flags;
      rows = rows.filter(function (r) { return !flags[r.id].length; });
      result = null;
      renderGate();
      setVerdict('idle', 'Failing rows removed. Run the quality check again before loading.');
      runBtn.focus();
    });

    resetBtn.addEventListener('click', function () {
      rows = SAMPLE.slice();
      result = null;
      renderGate();
      setVerdict('idle', 'Press Run quality check to test these rows.');
    });

    renderGate();
  }

  // Copy buttons next to the email address and phone number
  var liveRegion = document.createElement('span');
  liveRegion.className = 'sr-only';
  liveRegion.setAttribute('role', 'status');
  document.body.appendChild(liveRegion);

  function copyFallback(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return copyFallback(text); });
    }
    return Promise.resolve(copyFallback(text));
  }

  all('.contact__list a[href^="mailto:"], .contact__list a[href^="tel:"]').forEach(function (link) {
    var isMail = link.getAttribute('href').indexOf('mailto:') === 0;
    var noun = isMail ? 'email address' : 'phone number';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy';
    btn.textContent = 'Copy';
    btn.setAttribute('aria-label', 'Copy ' + noun);
    var timer = null;

    btn.addEventListener('click', function () {
      copyText(link.textContent.trim()).then(function (ok) {
        btn.textContent = ok ? 'Copied' : 'Copy failed';
        liveRegion.textContent = ok ? 'Copied ' + noun : 'Could not copy ' + noun;
        if (ok) {
          btn.setAttribute('data-done', 'true');
          track('contact_copy', { event_category: 'contact', event_label: isMail ? 'Email' : 'Phone' });
        }
        window.clearTimeout(timer);
        timer = window.setTimeout(function () {
          btn.textContent = 'Copy';
          btn.removeAttribute('data-done');
          liveRegion.textContent = '';
        }, 1800);
      });
    });

    link.parentNode.appendChild(btn);
  });
})();
