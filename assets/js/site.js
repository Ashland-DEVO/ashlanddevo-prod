(function () {
  var d = document, b = d.body;
  var burger = d.querySelector('.burger'), mnav = d.getElementById('mnav'), hdr = d.querySelector('.hdr');

  function onScroll() { if (hdr && hdr.classList.contains('over') && !b.classList.contains('lock')) hdr.classList.toggle('solid', window.scrollY > 40); }
  function setMenu(open) {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mnav.classList.toggle('open', open);
    b.classList.toggle('lock', open);
    if (open) hdr.classList.add('solid'); else { hdr.classList.remove('solid'); onScroll(); }
    // keep keyboard/screen-reader focus inside the open menu
    d.querySelectorAll('main, footer, .mbar, .announce').forEach(function (el) { if (open) el.setAttribute('inert', ''); else el.removeAttribute('inert'); });
    if (open) setTimeout(function () { var first = mnav.querySelector('a, summary'); if (first) first.focus(); }, 80); else burger.focus();
  }
  if (burger && mnav) {
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    mnav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Hero text: the headline, intro and main button change on every third photo (see #hero-copy in index.html).
  var hero = d.querySelector('.hero'), heroIn = hero && hero.querySelector('[data-hero-copy]'), copies = [], copyIdx = 0, paused = false;
  try { copies = JSON.parse(d.getElementById('hero-copy').textContent); } catch (e) { copies = []; }
  function copyParts(root) { return { h: root.querySelector('h1'), p: root.querySelector('p'), a: root.querySelector('.cta a') }; }
  function applyCopy(root, c) { var n = copyParts(root); n.h.innerHTML = c.h; n.p.textContent = c.p; n.a.textContent = c.a; n.a.setAttribute('href', c.href); }
  // Keep the hero from changing height as text changes: size it for the tallest version.
  function lockHeroHeight() {
    if (!heroIn || copies.length < 2) return;
    heroIn.style.minHeight = '';
    var clone = heroIn.cloneNode(true), max = 0;
    clone.removeAttribute('data-hero-copy'); clone.setAttribute('aria-hidden', 'true');
    clone.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;min-height:0;width:' + heroIn.offsetWidth + 'px';
    heroIn.parentNode.appendChild(clone);
    copies.forEach(function (c) { applyCopy(clone, c); max = Math.max(max, clone.offsetHeight); });
    heroIn.parentNode.removeChild(clone);
    heroIn.style.minHeight = max + 'px';
  }
  function swapCopy() {
    if (!heroIn || copies.length < 2) return;
    copyIdx = (copyIdx + 1) % copies.length;
    heroIn.classList.add('swap');
    setTimeout(function () { applyCopy(heroIn, copies[copyIdx]); heroIn.classList.remove('swap'); }, 350);
  }
  if (heroIn && copies.length > 1) {
    lockHeroHeight();
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(lockHeroHeight);
    var rz; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(lockHeroHeight, 200); });
  }

  // Pause / play for the hero slideshow (photos and text)
  var pauseIcon = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
  var playIcon = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';

  // Hero slideshow. The first slide is in the HTML; each later slide is fetched just before it is needed.
  // Slides hidden at the current screen size (class "mo" on desktop) are skipped.
  var slides = d.querySelectorAll('.slides li');
  function load(n) { var s = slides[n % slides.length]; if (s && s.dataset.bg) { s.style.backgroundImage = 'url(' + s.dataset.bg + ')'; s.removeAttribute('data-bg'); } }
  function nextVisible(from) { var k = from; do { k = (k + 1) % slides.length; } while (slides[k].offsetParent === null && k !== from); return k; }
  if (slides.length > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var i = 0, shown = 0;
    var begin = function () {
      load(nextVisible(0));
      if (hero) {
        var pb = d.createElement('button');
        pb.type = 'button'; pb.className = 'hero-pause'; pb.setAttribute('aria-label', 'Pause slideshow'); pb.setAttribute('aria-pressed', 'false'); pb.innerHTML = pauseIcon;
        pb.addEventListener('click', function () { paused = !paused; pb.setAttribute('aria-pressed', paused); pb.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow'); pb.innerHTML = paused ? playIcon : pauseIcon; });
        hero.appendChild(pb);
      }
      setInterval(function () {
        if (paused) return;
        var nx = nextVisible(i);
        load(nx);
        slides[i].classList.remove('on'); i = nx; slides[i].classList.add('on');
        load(nextVisible(i));
        shown++; if (shown % 3 === 0) swapCopy();   // new text on every third photo
      }, 6500);
    };
    if (d.readyState === 'complete') begin(); else window.addEventListener('load', begin);
  }

  // Event calendar (Google Calendar embed): list view on phones, month view on wide screens; the iframe loads when scrolled near
  d.querySelectorAll('[data-gcal]').forEach(function (g) {
    var frame = g.querySelector('iframe'), btns = g.querySelectorAll('[data-mode]'), mode = innerWidth < 720 ? 'agenda' : 'month';
    function show(m) { mode = m; frame.src = g.getAttribute('data-' + m); btns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-mode') === m); }); }
    btns.forEach(function (b) { b.addEventListener('click', function () { show(b.getAttribute('data-mode')); }); });
    if ('IntersectionObserver' in window) {
      var gio = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { show(mode); gio.disconnect(); } }, { rootMargin: '300px 0px' });
      gio.observe(g);
    } else show(mode);
  });

  // Reveal on scroll
  var rv = d.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });

  // Program filter chips
  var chips = d.querySelectorAll('.chips button');
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      chips.forEach(function (x) { x.setAttribute('aria-pressed', x === c); });
      var f = c.dataset.f;
      d.querySelectorAll('[data-g]').forEach(function (card) {
        card.classList.toggle('hide', f !== 'all' && card.dataset.g.split(' ').indexOf(f) < 0);
      });
    });
  });

  // "Find your program" finder
  var sel = d.getElementById('grade'), out = d.getElementById('finder-out');
  if (sel && out) {
    var map = {
      pre: ['Bear Cubs (Kindergarten)', '#bear-cubs', 'Start here: braking, starting and stopping, and a love of riding.'],
      k: ['Bear Cubs', '#bear-cubs', 'Kindergarteners build bike basics and confidence.'],
      g1: ['Coyotes', '#coyotes', 'Climbing, pumping and bike/body separation, with more trail days.'],
      g23: ['Cougars (Skills or Trails group)', '#cougars', 'Choose the group that matches your rider’s current skill level.'],
      g45: ['Jr. Vultures (Skills or Trails group)', '#jr-vultures', 'New to DEVO? Start with Skills. Advanced? Ask about Rattlesnakes.'],
      adv: ['Rattlesnakes', '#rattlesnakes', 'Needs a semester of DEVO, program space and a coach recommendation.'],
      ms: ['Ospreys, then XC, Gravity or Vultures', '#ospreys', 'Ospreys are the on-ramp for new 6th–8th grade riders.'],
      hs: ['Ospreys, Rogue Composite Vultures, XC or Gravity', '#vultures', 'New riders start with Ospreys; experienced riders can join the NICA team.'],
      adult: ['WOMBAT clinics or Private Lessons', '/wombat/', 'Women and young adult girls: beginner to intermediate clinics. Anyone: 1:1 or 2:1 lessons.']
    };
    sel.addEventListener('change', function () {
      var m = map[sel.value];
      out.innerHTML = m ? '<strong>' + m[0] + '</strong><br>' + m[2] + ' <a href="' + m[1] + '">See details →</a>' : 'Pick a grade and we’ll point you to the right group.';
    });
  }
  // Board feedback tab (only present in preview builds): opens the feedback form for the page being viewed.
  if (d.querySelector('meta[name="devo-feedback"]') && location.pathname.indexOf('/feedback') !== 0) {
    var fb = d.createElement('a');
    fb.className = 'fb-fab'; fb.setAttribute('aria-label', 'Send feedback about this page');
    fb.href = '/feedback/?from=' + encodeURIComponent(location.pathname + location.search);
    fb.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span>Feedback</span>';
    d.body.appendChild(fb);
  }
})();
