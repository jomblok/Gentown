/* Genesis Town landing: the nav, reveals, the tagline's word by word light, the hero's live world, and the live
   numbers from the game server (/api/time and /api/market, proxied to gentown.my.id by vercel.json and dev.mjs).
   The page reads finished without any of it: base prices, the poster, Sarah's first answer. */
(function () {
  'use strict';
  var API = (window.GT_API || '') + '/api';
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SEASON = { semi: 'Spring', panas: 'Summer', gugur: 'Autumn', dingin: 'Winter' };
  var BASE = { fish: 8, wood: 6, ore: 12, wheat: 5, bread: 16, meal: 20, tool: 45 };
  var NAME = { fish: 'Fish', wood: 'Wood', ore: 'Ore', wheat: 'Wheat', bread: 'Bread', meal: 'Grilled fish', tool: 'Pickaxe' };
  function it(token, stock, ask, bid) { return { token: token, stock: stock, target: stock, ask: ask, bid: bid, mid: BASE[token] }; }
  // the shelves at base prices (economy/config.json) until the server answers
  var SHOPS = {
    sari: { shop: 'Sarah’s Fish Stall', line: 'Buys fish and wood. Sells fish and grilled fish.', items: [it('fish', 20, 9, 7), it('wood', 10, null, 5), it('meal', 8, 22, null)] },
    budi: { shop: 'Ben’s Workshop', line: 'Buys ore and wood. Sells pickaxes, and new or repaired tools.', items: [it('ore', 15, null, 10), it('wood', 10, null, 5), it('tool', 4, 50, null)] },
    wati: { shop: 'Wendy’s Bakery', line: 'Buys wheat. Sells wheat and bread.', items: [it('wheat', 30, 6, 4), it('bread', 12, 18, null)] },
    joko: { shop: 'Jack’s General Store', line: 'Buys wood, wheat and fish. Sells wood and bread.', items: [it('wood', 25, 7, 5), it('wheat', 15, null, 4), it('fish', 10, null, 7), it('bread', 6, 18, null)] }
  };
  var live = { time: null, at: 0, market: null, view: null, pinSeason: null, night: false };
  function $(q, r) { return (r || document).querySelector(q); }
  function $$(q, r) { return Array.prototype.slice.call((r || document).querySelectorAll(q)); }
  function get(p) { return fetch(API + p, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function hhmm(h) { h = ((h % 24) + 24) % 24; return pad(Math.floor(h)) + ':' + pad(Math.floor((h % 1) * 60)); }
  // a number counts from what it shows to its new value
  function tick(el, to) {
    var from = parseFloat(el.textContent); to = Number(to);
    if (still || isNaN(from) || from === to) { el.textContent = to; return; }
    var t0 = performance.now();
    (function step(now) { var k = Math.min(1, (now - t0) / 700), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); })(t0);
  }

  /* ---- nav: the current section is marked; the phone menu opens as a full panel */
  var toggle = $('.nav__toggle'), menu = $('#menu');
  function openMenu(on) {
    toggle.setAttribute('aria-expanded', String(on)); toggle.setAttribute('aria-label', on ? 'Close the menu' : 'Open the menu');
    menu.classList.toggle('is-open', on); menu.setAttribute('aria-hidden', String(!on)); document.body.style.overflow = on ? 'hidden' : '';
  }
  toggle.addEventListener('click', function () { openMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { openMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('is-open')) { openMenu(false); toggle.focus(); } });
  var navLinks = $$('.nav__links a');
  if ('IntersectionObserver' in window) {
    var secIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) { a.toggleAttribute('aria-current', a.getAttribute('href') === '#' + e.target.id); if (a.hasAttribute('aria-current')) a.setAttribute('aria-current', 'true'); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (a) { var s = $(a.getAttribute('href')); if (s) secIO.observe(s); });
  }

  /* ---- reveals: once, as a section's pieces enter */
  var rvs = $$('.rv');
  if ('IntersectionObserver' in window) {
    var rvIO = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); rvIO.unobserve(e.target); } }); }, { rootMargin: '0px 0px -10% 0px' });
    rvs.forEach(function (el) { rvIO.observe(el); });
  } else rvs.forEach(function (el) { el.classList.add('is-in'); });

  /* ---- tagline: each word lights as it crosses a line 60% down the screen, in reading order */
  var words = $('[data-words]');
  if (words) {
    var out = [];
    (function split(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) n.textContent.split(/(\s+)/).forEach(function (w) { out.push(/^\s+$/.test(w) || !w ? document.createTextNode(w) : mk(w, '')); });
        else out.push(mk(n.textContent, 'hl'));
      });
      function mk(t, c) { var s = document.createElement('span'); s.className = 'w ' + c; s.textContent = t; return s; }
    })(words);
    words.textContent = ''; out.forEach(function (n) { words.appendChild(n); });
    var ws = $$('.w', words);
    if (still || !('IntersectionObserver' in window)) ws.forEach(function (w) { w.classList.add('on'); });
    else {
      var wIO = new IntersectionObserver(function (es) {
        es.forEach(function (e) { e.target.classList.toggle('on', e.isIntersecting || e.boundingClientRect.top < 0); });
      }, { rootMargin: '0px 0px -40% 0px' });
      ws.forEach(function (w) { wIO.observe(w); });
    }
  }

  /* ---- the hero's world: the game's 2.5D Homeland, live; the poster stays without WebGL or under reduced motion */
  var stage = $('[data-stage]'), vid = stage && $('video', stage);
  if (vid && window.GTWorld && !still) {
    var view = GTWorld.mount(vid, { shot: GTWorld.shots.home, intro: true, drift: true });
    view.ready.then(function () {
      live.view = view;
      var hint = $('[data-hint]'), bar = $('[data-bar]'), pause = $('[data-pause]'), nightB = $('[data-time]');
      hint.hidden = false; bar.hidden = false;
      view.auto({ spin: 7, time: true, season: true, on: paintSeasons });
      function gone() { hint.classList.add('is-gone'); }
      setTimeout(gone, 8000);
      stage.setAttribute('data-turn', ''); stage.tabIndex = 0; stage.setAttribute('role', 'group');
      stage.setAttribute('aria-label', "A Homeland's floating islands, live. Drag, or press Q and E or the arrow keys, to turn the camera.");
      $$('[data-season]', bar).forEach(function (b) {
        b.addEventListener('click', function () { live.pinSeason = b.getAttribute('data-season'); view.auto({ spin: 7, time: !live.night, season: false, on: paintSeasons }); view.season(live.pinSeason); paintSeasons(); });
      });
      nightB.addEventListener('click', function () {
        live.night = !live.night; nightB.setAttribute('aria-pressed', String(live.night));
        view.auto({ spin: 7, time: !live.night, season: !live.pinSeason, on: paintSeasons });
        view.hour(live.night ? 21.5 : 10, true);
      });
      pause.addEventListener('click', function () {
        var on = pause.getAttribute('aria-pressed') !== 'true';
        pause.setAttribute('aria-pressed', String(on)); pause.setAttribute('aria-label', on ? 'Play the world' : 'Pause the world');
        $('use', pause).setAttribute('href', 'assets/icons/ph.svg#ph-' + (on ? 'play' : 'pause')); view.pause(on);
      });
      function paintSeasons() { var g = view.get ? view.get() : { season: live.pinSeason || 'semi' }; $$('[data-season]', bar).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-season') === g.season)); }); }
      var seen = true;
      new IntersectionObserver(function (es) { seen = es[0].intersectionRatio > 0.3; }, { threshold: [0, 0.3] }).observe(stage);
      document.addEventListener('keydown', function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
        if (e.target.closest && e.target.closest('input, textarea, select')) return;
        var k = (e.key || '').toLowerCase(), focus = document.activeElement === stage, dir = k === 'q' ? -1 : k === 'e' ? 1 : 0;
        if (!dir && focus) dir = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
        if (!dir || !(seen || focus)) return;
        if (focus) e.preventDefault();
        view.turn(dir); gone();
      });
      var drag = null;
      stage.addEventListener('pointerdown', function (e) {
        if (e.button > 0 || e.target.closest('.stage__bar')) return;
        drag = { x: e.clientX }; stage.classList.add('is-drag'); if (view.hold) view.hold();
        try { stage.setPointerCapture(e.pointerId); } catch (x) { /* old browsers */ }
      });
      stage.addEventListener('pointermove', function (e) {
        if (!drag) return; var d = (e.clientX - drag.x) * -0.25; drag.x = e.clientX; if (d) { view.nudge(d); gone(); if (view.hold) view.hold(); }
      });
      function end() { drag = null; stage.classList.remove('is-drag'); }
      stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
    }, function () { /* the poster stays */ });
  }

  /* ---- tabs with arrow keys */
  function tabs(list, pick) {
    var all = $$('[role="tab"]', list);
    all.forEach(function (b, i) {
      b.addEventListener('click', function () { pick(b); });
      b.addEventListener('keydown', function (e) {
        var d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]; if (d == null) return;
        e.preventDefault(); var n = all[(i + d + all.length) % all.length]; n.focus(); pick(n);
      });
    });
    return function select(b) { all.forEach(function (x) { var on = x === b; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; }); };
  }

  /* ---- the market: the chosen shop's shelf */
  var shop = 'sari', shelf = $('#shelf');
  function shops() {
    var out = {}; Object.keys(SHOPS).forEach(function (k) { out[k] = SHOPS[k]; });
    if (live.market) live.market.forEach(function (m) { if (out[m.id] && m.items) out[m.id] = { shop: m.shop || SHOPS[m.id].shop, line: SHOPS[m.id].line, cash: m.cash, open: m.open, items: m.items, live: true }; });
    return out;
  }
  function paintShelf(animate) {
    var m = shops()[shop]; if (!m) return;
    $('[data-shop-name]').textContent = m.shop; $('[data-shop-line]').textContent = m.line;
    $('[data-shop-cash]').textContent = m.live ? (m.open === false ? 'Closed today' : m.cash + ' coin in the till') : 'Base prices';
    $('[data-shelf]').innerHTML = m.items.filter(function (i) { return NAME[i.token]; }).map(function (i) {
      var w = i.target ? Math.min(1, i.stock / i.target) : 0;
      return '<tr><th scope="row"><span class="good"><img class="px" src="img/item-' + i.token + '.png" width="48" height="48" alt="">' + NAME[i.token] + '</span></th>' +
        '<td><span class="stock"><span class="bar"><i style="--w:' + w.toFixed(2) + '"></i></span><span class="num">' + i.stock + '/' + i.target + '</span></span></td>' +
        '<td class="num">' + (i.ask != null ? i.ask : '<span class="muted">&ndash;</span>') + '</td><td class="num">' + (i.bid != null ? i.bid : '<span class="muted">&ndash;</span>') + '</td></tr>';
    }).join('');
    if (animate && !still) { shelf.classList.remove('is-swap'); void shelf.offsetWidth; shelf.classList.add('is-swap'); }
  }
  var shopList = $('.tabs[aria-label="Shops"]'), selShop = tabs(shopList, function (b) {
    if (b.getAttribute('data-shop') === shop) return; selShop(b); shop = b.getAttribute('data-shop'); shelf.setAttribute('aria-labelledby', b.id); paintShelf(true);
  });
  paintShelf(false);

  /* ---- Sarah answers from her live shelf */
  function sarah() {
    var m = (live.market || []).filter(function (x) { return x.id === 'sari'; })[0], g = function (t) { return m && (m.items || []).filter(function (i) { return i.token === t; })[0]; };
    return { fish: g('fish') || { ask: 9, bid: 7, stock: 20, target: 20, mid: 8 }, wood: g('wood') || { bid: 5 } };
  }
  var ANSWER = {
    price: function (d) { var f = d.fish, low = f.stock < f.target * 0.8, high = f.stock > f.target * 1.2;
      return 'Fresh fish is ' + (f.ask != null ? f.ask : f.mid) + ' coin today. I have ' + f.stock + ' on ice and like to keep ' + f.target + ', so ' + (low ? 'it’s a touch dear. Bring me some and I’ll pay well.' : high ? 'it’s a good day to buy.' : 'it’s a fair day to buy.'); },
    why: function (d) { var f = d.fish;
      return f.stock < f.target ? 'Folks bought my ice box down to ' + f.stock + '. When it runs low the price climbs. Sell me a few and watch it drop.' : 'My ice box is full, ' + f.stock + ' fish. When I have plenty the price comes down.'; },
    wood: function (d) { return d.wood.bid != null ? 'Wood? I’ll pay ' + d.wood.bid + ' coin a piece. I need it to grill fish. Bring it to my stall by the square.' : 'Not today, my woodpile is full. Try Jack’s General Store.'; }
  };
  var Q = { price: 'What’s fish worth today?', why: 'Why did the price move?', wood: 'Will you buy my wood?' };
  var log = $('[data-chat]'), busy = false;
  function say(cls, text) { var li = document.createElement('li'); li.className = cls + ' new'; li.textContent = text; log.appendChild(li); while (log.children.length > 5) log.removeChild(log.firstChild); return li; }
  $$('[data-ask]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (busy) return; busy = true; var k = b.getAttribute('data-ask'), chips = $$('[data-ask]');
      chips.forEach(function (c) { c.disabled = true; }); say('me', Q[k]);
      var dots = document.createElement('li'); dots.className = 'them typing new'; dots.setAttribute('aria-label', 'Sarah is typing'); dots.innerHTML = '<i></i><i></i><i></i>';
      setTimeout(function () { log.appendChild(dots); }, still ? 0 : 250);
      setTimeout(function () { if (dots.parentNode) dots.parentNode.removeChild(dots); say('them', ANSWER[k](sarah())); chips.forEach(function (c) { c.disabled = false; }); busy = false; }, still ? 0 : 1200);
    });
  });

  /* ---- homeland: a part lights its pin, a pin its part */
  var parts = $('[data-parts]');
  function lightPart(n) {
    parts.classList.toggle('is-lit', !!n);
    $$('[data-part]').forEach(function (p) { p.classList.toggle('on', p.getAttribute('data-part') === n); });
    $$('[data-pin]').forEach(function (p) { p.classList.toggle('on', p.getAttribute('data-pin') === n); });
  }
  $$('[data-part]').forEach(function (p) {
    var n = p.getAttribute('data-part');
    p.addEventListener('pointerenter', function () { lightPart(n); }); p.addEventListener('pointerleave', function () { lightPart(null); });
    p.addEventListener('focus', function () { lightPart(n); }); p.addEventListener('blur', function () { lightPart(null); });
  });

  /* ---- friends: the trade window plays once when it comes into view */
  var trade = $('[data-trade]');
  if (trade && 'IntersectionObserver' in window) {
    var played = false;
    new IntersectionObserver(function (es) {
      if (played || !es[0].isIntersecting) return; played = true;
      var a = $('[data-ready="a"]'), b = $('[data-ready="b"]'), msg = $('[data-trade-msg]'), c = $('[data-count]');
      if (still) { a.classList.add('on'); b.classList.add('on'); msg.textContent = 'Goods swapped'; return; }
      setTimeout(function () { a.classList.add('on'); msg.textContent = 'Waiting for Mira'; }, 700);
      setTimeout(function () { b.classList.add('on'); msg.textContent = 'Swapping in'; c.hidden = false; count(3); }, 1700);
      function count(n) {
        c.textContent = n; c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
        if (n > 1) setTimeout(function () { count(n - 1); }, 1000);
        else setTimeout(function () { c.hidden = true; msg.textContent = 'Goods swapped'; }, 1000);
      }
    }, { threshold: 0.5 }).observe(trade);
  }

  /* ---- seasons */
  var sTabs = $('[data-season-tabs]'), selSeason = tabs(sTabs, function (b) {
    selSeason(b); var s = b.getAttribute('data-s'); $$('[data-season-pics] img').forEach(function (i) { i.classList.toggle('on', i.getAttribute('data-for') === s); });
  });

  /* ---- live: the clock and the settled day, the shelves and the middle prices */
  function hour() { return live.time ? (live.time.hour + (Date.now() - live.at) / 60000) % 24 : null; }
  function paintClock() {
    var t = live.time, h = hour(); if (!t) return;
    $('[data-now-text]').textContent = 'In town now: ' + SEASON[t.season] + ', day ' + (t.dayOfSeason || 1) + ', ' + hhmm(h);
    var mark = $('[data-day-now]'); mark.hidden = false; mark.style.setProperty('--h', (h / 24).toFixed(4));
    $('[data-day-now-text]').textContent = 'Now ' + hhmm(h) + ' in town';
    if (t.settledThrough != null) $('[data-settled]').textContent = 'Saved on NEAR through game day ' + t.settledThrough;
    if (live.view && !live.pinSeason && live.view.season && t.season && !live.seasonSet) { live.view.season(t.season); live.seasonSet = true; }
  }
  function clock() { get('/time').then(function (t) { live.time = t; live.at = Date.now(); paintClock(); }).catch(function () {}); }
  function prices() {
    get('/market').then(function (d) {
      live.market = d.merchants || [];
      var sum = {}, n = {};
      live.market.forEach(function (m) { (m.items || []).forEach(function (i) { if (i.mid == null) return; sum[i.token] = (sum[i.token] || 0) + i.mid; n[i.token] = (n[i.token] || 0) + 1; }); });
      $$('[data-mid]').forEach(function (el) { var k = el.getAttribute('data-mid'); if (n[k]) tick(el, Math.round(sum[k] / n[k])); });
      var s = sarah(), bid = $('[data-fish-bid]'); if (s.fish.bid != null) tick(bid, s.fish.bid);
      var first = $('[data-chat-first]'); if (first) first.textContent = ANSWER.price(s);
      $('[data-shelf-note]').textContent = 'Live from the game server at ' + new Date().toTimeString().slice(0, 5) + '. Stock against what the shop likes to keep.';
      paintShelf(false);
    }).catch(function () {});
  }
  clock(); prices();
  setInterval(paintClock, 5000); setInterval(clock, 120000); setInterval(prices, 30000);
})();
