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
  var toggle = $('.bar__toggle'), menu = $('#menu');
  function openMenu(on) {
    toggle.setAttribute('aria-expanded', String(on)); toggle.setAttribute('aria-label', on ? 'Close the menu' : 'Open the menu');
    menu.classList.toggle('is-open', on); menu.setAttribute('aria-hidden', String(!on)); document.body.style.overflow = on ? 'hidden' : '';
  }
  toggle.addEventListener('click', function () { openMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { openMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('is-open')) { openMenu(false); toggle.focus(); } });
  var navLinks = $$('.bar__links a');
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
    // a fast scroll can jump past a part without it ever crossing the line: anything above the fold's foot shows
    var rvTick = 0;
    window.addEventListener('scroll', function () {
      if (rvTick) return; rvTick = requestAnimationFrame(function () {
        rvTick = 0; var h = innerHeight;
        rvs.forEach(function (el) { if (!el.classList.contains('is-in') && el.getBoundingClientRect().top < h) { el.classList.add('is-in'); rvIO.unobserve(el); } });
      });
    }, { passive: true });
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
  var stage = $('[data-stage]'), vid = stage && $('canvas[data-gt-world]', stage);
  if (vid && window.GTWorld && !still) {
    var H0 = GTWorld.shots.home; // the islands sit lower, leaving the sky above them for the title
    var view = GTWorld.mount(vid, { shot: Object.assign({}, H0, window.GT_HERO_SHOT || { dist: 100, ty: 14, narrow: { dist: 118, ty: 16 }, phone: { dist: 112, pitch: 40, yaw: 34, ty: 34 } }), intro: true, drift: true });
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
        setTimeout(paintSeasons, 900);
      });
      pause.addEventListener('click', function () {
        var on = pause.getAttribute('aria-pressed') !== 'true';
        pause.setAttribute('aria-pressed', String(on)); pause.setAttribute('aria-label', on ? 'Play the world' : 'Pause the world');
        $('use', pause).setAttribute('href', 'assets/icons/ph.svg#ph-' + (on ? 'play' : 'pause')); view.pause(on);
      });
      function paintSeasons() { var g = view.get ? view.get() : { season: live.pinSeason || 'semi' }; stage.classList.toggle('is-night', !!g.night); $$('[data-season]', bar).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-season') === g.season)); }); }
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
        '<td><span class="stock"><span class="meter"><i style="--w:' + w.toFixed(2) + '"></i></span><span class="num">' + i.stock + '/' + i.target + '</span></span></td>' +
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
  function say(cls, text) { var li = document.createElement('li'); li.className = cls + ' new'; if (cls === 'them' && !still) { li.setAttribute('aria-label', text); li.innerHTML = text.split(' ').map(function (w, k) { return '<span class="w8" aria-hidden="true" style="--k:' + k + '">' + w.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span>'; }).join(' '); } else li.textContent = text; log.appendChild(li); while (log.children.length > 5) log.removeChild(log.firstChild); return li; }
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

  /* ---- prices: the seven goods (the cheapest price to buy, or the best a shop pays when nobody sells it) and what a
     recipe adds at the shops' middle prices */
  var WHO = {
    fish: 'Sarah sells. Sarah and Jack buy.', wood: 'Jack sells. Sarah, Ben and Jack buy.', ore: 'Nobody sells it. Ben buys.',
    wheat: 'Wendy sells. Wendy and Jack buy.', bread: 'Wendy and Jack sell. No shop buys it.', meal: 'Sarah sells. No shop buys it.',
    tool: 'Ben sells. No shop buys it.'
  };
  var COPY = {
    up: function (p) { return p + '% over usual'; }, down: function (p) { return p + '% under usual'; }, base: 'Usual price', sell: 'What shops pay',
    live: function (t) { return 'Live from the game at ' + t + '. Every shopkeeper sets their own price from what is on their shelf.'; },
    fee: 'Workbench fee: 3 coin, paid to the town.', nofee: function (e) { return 'No coin fee. Costs ' + e + ' energy.'; },
    good: function (g) { return 'Crafting adds ' + g + ' coin over selling the parts, at what the shops charge today.'; },
    bad: function () { return 'Today the parts are worth more than the result, so sell them as they are.'; }
  };
  var RECIPE = { meal: { in: { fish: 1, wood: 1 }, fee: 0, energy: 8 }, bread: { in: { wheat: 2 }, fee: 0, energy: 5 }, tool: { in: { ore: 2, wood: 1 }, fee: 3 } };
  var recipe = 'meal', board = $('[data-board]');
  function mids() {
    var sum = {}, n = {};
    (live.market || []).forEach(function (m) { (m.items || []).forEach(function (i) { if (i.mid == null) return; sum[i.token] = (sum[i.token] || 0) + i.mid; n[i.token] = (n[i.token] || 0) + 1; }); });
    var out = {}; Object.keys(BASE).forEach(function (k) { out[k] = n[k] ? Math.round(sum[k] / n[k]) : BASE[k]; }); return out;
  }
  function paintBoard() {
    var best = {};
    (live.market || []).forEach(function (m) { if (m.open === false) return; (m.items || []).forEach(function (i) {
      var b = best[i.token] || (best[i.token] = { ask: null, bid: null });
      if (i.ask != null && (b.ask == null || i.ask < b.ask)) b.ask = i.ask;
      if (i.bid != null && (b.bid == null || i.bid > b.bid)) b.bid = i.bid;
    }); });
    var r = RECIPE[recipe];
    board.innerHTML = Object.keys(BASE).map(function (k) {
      var b = best[k], p = BASE[k], chg = COPY.base, cls = '';
      if (b) {
        if (b.ask != null) { p = b.ask; var pct = Math.round((p - BASE[k]) / BASE[k] * 100); chg = pct > 0 ? COPY.up(pct) : pct < 0 ? COPY.down(-pct) : COPY.base; cls = pct > 0 ? 'up' : pct < 0 ? 'down' : ''; }
        else if (b.bid != null) { p = b.bid; chg = COPY.sell; }
      }
      var lit = (k === recipe || r.in[k] ? ' class="lit"' : '') + ' style="--n:' + Object.keys(BASE).indexOf(k) + '"';
      return '<li' + lit + '><img class="px" src="img/item-' + k + '.png" width="48" height="48" alt=""><span class="nm">' + NAME[k] + '</span><p>' + WHO[k] + '</p>' +
        '<span class="board__v"><b>' + p + '<small>coin</small></b><span class="chg ' + cls + '">' + chg + '</span></span></li>';
    }).join('');
  }
  function paintCalc(animate) {
    var r = RECIPE[recipe], p = mids(), cost = 0, lines = $('[data-calc-lines]');
    var html = Object.keys(r.in).map(function (k) { cost += p[k] * r.in[k];
      return '<li><img class="px" src="img/item-' + k + '.png" width="48" height="48" alt=""><span>' + r.in[k] + ' × ' + NAME[k] + '</span><b>' + p[k] * r.in[k] + '</b></li>'; }).join('');
    if (r.fee) html += '<li><span class="gap" aria-hidden="true"></span><span>Workbench fee</span><b>' + r.fee + '</b></li>';
    html += '<li class="out"><img class="px" src="img/item-' + recipe + '.png" width="48" height="48" alt=""><span>' + NAME[recipe] + '</span><b>' + p[recipe] + '</b></li>';
    lines.innerHTML = html;
    if (animate && !still) { lines.classList.remove('swap'); void lines.offsetWidth; lines.classList.add('swap'); }
    var gain = p[recipe] - cost - r.fee, g = $('[data-calc-gain]');
    g.textContent = (gain >= 0 ? '+' : '−') + Math.abs(gain); g.classList.toggle('neg', gain < 0);
    $('[data-calc-note]').textContent = (gain > 0 ? COPY.good(gain) : COPY.bad()) + ' ' + (r.fee ? COPY.fee : COPY.nofee(r.energy));
    paintBoard();
  }
  var segs = $('.segs'), selRecipe = tabs(segs, function (b) {
    if (b.getAttribute('data-recipe') === recipe) return; selRecipe(b); recipe = b.getAttribute('data-recipe');
    segs.style.setProperty('--i', $$('[role="tab"]', segs).indexOf(b)); paintCalc(true);
  });
  paintCalc(false);

  /* ---- town: the building viewer */
  var BLD = {
    square: ['The square', 'A fountain in the middle, the four shopkeepers’ stalls along one side and players’ stalls along the other, with benches to sit on and the stage where a band plays every night.'],
    board: ['Leaderboard', 'A board on the square’s east edge lists the best traders of the day and of all time. Walk up to it or click it to read.'],
    mall: ['Genesis Mall', '28 outfits, hats and capes in seven slots, from 20 to 400 coin, and everyone sees what you wear. Work gloves, boots and a hard hat also make your workers faster.'],
    news: ['News Hall', 'The town’s notice board and its news. It is where to read what changed in town today.'],
    casino: ['Genesis Casino', 'A pass lets you in for 30 minutes to the Luck Table, slots, dice and cards. Chips are bought with coin, and what you win is chips and titles that never turn back into coin.'],
    mine: ['Public Mine', 'A mine beside a public forest and rock field, so new players can gather from the first day, before their own islands open up.']
  };
  var vTabs = $('.viewer__tabs'), vText = $('[data-bld-text]');
  if (vTabs) { var selBld = tabs(vTabs, function (b) {
    var k = b.getAttribute('data-bld'); selBld(b);
    $$('[data-bld-pic]').forEach(function (i) { i.classList.toggle('on', i.getAttribute('data-bld-pic') === k); });
    vText.innerHTML = '<h3></h3><p>' + BLD[k][1] + '</p>'; window.scramble($('h3', vText), BLD[k][0]);
    if (!still) { vText.classList.remove('swap'); void vText.offsetWidth; vText.classList.add('swap'); }
  }); }

  /* ---- homeland: what the next island asks for (economy/config.json homeland.chunks) */
  var ISLES = [
    { th: 1, cost: { wood: 10 }, secs: 30 }, { th: 2, cost: { wood: 25, coin: 20 }, secs: 90 }, { th: 2, cost: { wood: 40, ore: 10, coin: 40 }, secs: 180 },
    { th: 3, cost: { wood: 60, ore: 20, coin: 80 }, secs: 300 }, { th: 3, cost: { wood: 80, ore: 30, coin: 120 }, secs: 450 },
    { th: 4, cost: { wood: 110, ore: 45, coin: 200 }, secs: 600 }, { th: 4, cost: { wood: 150, ore: 60, coin: 300 }, secs: 900 }, { th: 5, cost: { wood: 200, ore: 80, coin: 450 }, secs: 1200 }
  ];
  var range = $('[data-isle-range]');
  function paintIsle() {
    var n = +range.value, d = ISLES[n - 1];
    $('[data-isle-open]').textContent = n; $('[data-isle-th]').textContent = d.th;
    $('[data-isle-cost]').textContent = Object.keys(d.cost).map(function (k) { return d.cost[k] + ' ' + k; }).join(', ');
    $('[data-isle-time]').textContent = d.secs < 60 ? d.secs + ' seconds' : (d.secs / 60) + ' minutes';
  }
  if (range) { range.addEventListener('input', paintIsle); paintIsle(); }

  /* ---- theme: light or dark, remembered on this device */
  var root = document.documentElement;
  function paintTheme() {
    var light = root.getAttribute('data-theme') === 'light';
    $$('[data-theme-toggle]').forEach(function (b) { b.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode'); });
    $$('[data-theme-label]').forEach(function (l) { l.textContent = light ? 'Dark mode' : 'Light mode'; });
  }
  $$('[data-theme-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', t); try { localStorage.setItem('gt.theme', t); } catch (e) { /* private mode */ }
      paintTheme(); if (window.paintLab) window.paintLab();
    });
  });
  paintTheme();

  /* ---- motion: every section's heading and lead rise in turn; the hero world settles as the page scrolls */
  $$('.section .head, .section .faq__h').forEach(function (h) {
    var kids = h.classList.contains('faq__h') ? [h] : $$(':scope > *', h);
    kids.forEach(function (k, i) { if (!k.classList.contains('rv') && !k.querySelector('.rv')) { k.classList.add('rv'); k.style.setProperty('--d', i); if (rvIO) rvIO.observe(k); else k.classList.add('is-in'); rvs.push(k); } });
  });
  var stg = $('[data-stage] .stage__world');
  if (stg && !still) {
    var zt = 0;
    function zoom() { zt = 0; var r = stg.parentNode.getBoundingClientRect(), p = Math.min(1, Math.max(0, 1 - r.top / innerHeight)); stg.style.setProperty('--zoom', (1.1 - 0.1 * p).toFixed(4)); }
    window.addEventListener('scroll', function () { if (!zt) zt = requestAnimationFrame(zoom); }, { passive: true }); zoom();
  }

  /* ---- the price lab: the game's own rule (economy/pricing.ts) for Sarah's fish: base 8, target 20, a fair keeper */
  var LAB = { base: 8, target: 20, spread: 0.2, el: 0.5, fsMin: 0.5, fsMax: 2.5, w: 0.4, damp: 5, fdMin: 0.7, fdMax: 1.4, minM: 0.25, maxM: 4 };
  function clampN(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function labPrice(stock, net) {
    var fs = clampN(Math.pow(LAB.target / Math.max(stock, 1), LAB.el), LAB.fsMin, LAB.fsMax);
    var sold = Math.max(net, 0), bought = Math.max(-net, 0);
    var fd = clampN(1 + LAB.w * (sold - bought) / (sold + bought + LAB.damp), LAB.fdMin, LAB.fdMax);
    var mid = clampN(LAB.base * fs * fd, LAB.minM * LAB.base, LAB.maxM * LAB.base);
    var ask = Math.max(1, Math.ceil(mid * (1 + LAB.spread / 2)));
    var bid = Math.min(ask - 1 > 0 ? ask - 1 : 1, Math.max(1, Math.floor(mid * (1 - LAB.spread / 2))));
    return { fs: fs, fd: fd, mid: mid, ask: ask, bid: bid };
  }
  var labSvg = $('[data-lab-svg]'), labS = $('[data-lab-stock]'), labD = $('[data-lab-dem]');
  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  window.paintLab = function () {
    if (!labSvg) return;
    var stock = +labS.value, net = +labD.value, X0 = 48, X1 = 540, Y0 = 290, Y1 = 20, PMAX = 36;
    function x(s) { return X0 + (X1 - X0) * s / 60; } function y(v) { return Y0 - (Y0 - Y1) * Math.min(v, PMAX) / PMAX; }
    labSvg.textContent = '';
    [0, 9, 18, 27, 36].forEach(function (v) { el('line', { x1: X0, x2: X1, y1: y(v), y2: y(v), class: 'grid' }, labSvg); el('text', { x: X0 - 10, y: y(v) + 5, 'text-anchor': 'end' }, labSvg).textContent = v; });
    [0, 20, 40, 60].forEach(function (s) { el('text', { x: x(s), y: Y0 + 26, 'text-anchor': 'middle' }, labSvg).textContent = s; });
    el('text', { x: X1, y: Y0 + 46, 'text-anchor': 'end' }, labSvg).textContent = 'Fish on ice';
    el('line', { x1: X0, x2: X1, y1: Y0, y2: Y0, class: 'axis' }, labSvg);
    el('line', { x1: x(LAB.target), x2: x(LAB.target), y1: Y1, y2: Y0, class: 'target' }, labSvg);
    el('text', { x: x(LAB.target) + 8, y: Y1 + 14 }, labSvg).textContent = 'Sarah’s target';
    var a = '', b = '', band = '';
    for (var s = 0; s <= 60; s++) { var p = labPrice(s, net); a += (s ? 'L' : 'M') + x(s).toFixed(1) + ' ' + y(p.ask).toFixed(1); b += (s ? 'L' : 'M') + x(s).toFixed(1) + ' ' + y(p.bid).toFixed(1); }
    for (var s2 = 60; s2 >= 0; s2--) band += 'L' + x(s2).toFixed(1) + ' ' + y(labPrice(s2, net).bid).toFixed(1);
    el('path', { d: a + band + 'Z', class: 'band' }, labSvg);
    el('path', { d: b, class: 'bid' }, labSvg); el('path', { d: a, class: 'ask', pathLength: 1 }, labSvg);
    var now = labPrice(stock, net);
    el('circle', { cx: x(stock), cy: y(now.bid), r: 7, class: 'pt2' }, labSvg);
    el('circle', { cx: x(stock), cy: y(now.ask), r: 9, class: 'pt' }, labSvg);
    $('[data-lab-stock-v]').textContent = stock;
    $('[data-lab-dem-v]').textContent = net > 2 ? 'bought her fish' : net < -2 ? 'sold her fish' : 'bought and sold evenly';
    $('[data-lab-sentence]').textContent = 'A fish costs you ' + now.ask + ' coin. Sarah pays ' + now.bid + ' for yours.';
    $$('[data-lab-preset]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lab-preset') === stock + ',' + net)); });
    tick($('[data-lab-ask]'), now.ask); tick($('[data-lab-bid]'), now.bid);
    var pct = Math.round((now.mid - LAB.base) / LAB.base * 100), pe = $('[data-lab-pct]');
    pe.textContent = pct > 0 ? pct + '% over' : pct < 0 ? -pct + '% under' : 'Usual'; pe.className = pct > 0 ? 'up' : pct < 0 ? 'down' : '';
    var se = Math.abs(Math.log(now.fs)), de = Math.abs(Math.log(now.fd)), why;
    if (se < 0.03 && de < 0.03) why = 'My fish stock is just right (' + stock + ', target 20).';
    else if (se >= de) why = now.fs < 1 ? 'My fish stock is ' + stock + ', target 20.' : 'My fish stock is down to ' + stock + ', target 20.';
    else why = now.fd > 1 ? 'Lots of people have been buying fish lately.' : 'Lots of people have been selling fish to me lately.';
    $('[data-lab-reason]').textContent = 'Her shop window: “' + why + ' ' + (pct > 0 ? 'Price up.' : pct < 0 ? 'Price down.' : 'Price steady.') + '”';
  };
  if (labS) {
    labS.addEventListener('input', window.paintLab); labD.addEventListener('input', window.paintLab);
    $$('[data-lab-preset]').forEach(function (b) { b.addEventListener('click', function () { var v = b.getAttribute('data-lab-preset').split(','); labS.value = v[0]; labD.value = v[1]; window.paintLab(); }); });
    window.paintLab();
  }

  /* ---- the coin flow: nodes and flows from the game's economy (README, docs/economy.md §3a); two layouts, wide and tall */
  var FN = {
    treasury: { n: 'Town treasury', sub: 'fees land here', w: [30, 30, 190, 68], t: [16, 20, 150, 60],
      text: 'Holds the town’s coin. Crafting fees from players and shopkeepers land here, and it hands coin to the townsfolk while it holds more than 2,000.' },
    faucet: { n: 'Coin faucet', sub: 'capped per day', w: [30, 342, 190, 68], t: [194, 20, 150, 60],
      text: 'The only place new coin is made. The contract mints a capped amount each day, and only when the treasury cannot cover the townsfolk.' },
    folk: { n: 'Townsfolk', sub: 'one shared wallet', w: [280, 186, 180, 68], t: [105, 150, 150, 60],
      text: 'Haruto, Yui, Sota, Hina and Ren wear orange name tags and walk the village for everyone. They buy at the stalls, and when a good runs short or gets dear they fish, chop, farm and mine it themselves, then stock the shelves to bring the price down.' },
    shops: { n: 'Shopkeepers', sub: 'Sarah, Ben, Wendy, Jack', w: [520, 186, 190, 68], t: [105, 290, 150, 60],
      text: 'They buy your raw goods and sell you food, goods and tools, pricing each from their own shelf. They also buy cheap listings on the player market.' },
    players: { n: 'Players', sub: 'you and your friends', w: [770, 186, 170, 68], t: [105, 430, 150, 60],
      text: 'You earn coin by selling raw goods to the shops and to other players, and spend it on food, tools, repairs and fees.' },
    market: { n: 'Player market', sub: 'held in the contract', w: [770, 342, 170, 68], t: [16, 590, 150, 60],
      text: 'Players sell to each other at their own price, named on the Stalls or anonymous on the Black Market. Goods wait in the contract until someone buys.' },
    burn: { n: 'Burned', sub: 'gone for good', w: [520, 342, 190, 68], t: [194, 590, 150, 60],
      text: 'Five percent of every player market sale is burned, so coin leaves the game as it is used and prices keep their meaning.' }
  };
  var FE = [
    { a: 'treasury', b: 'folk', l: 'handouts above 2,000', w: 'M220 64 C 280 64 300 120 345 186', t: 'M91 80 V115 H165 V150', lw: [282, 104], lt: [96, 106] },
    { a: 'faucet', b: 'folk', l: 'new coin', k: 'new', w: 'M220 376 C 280 376 300 320 345 254', t: 'M269 80 V115 H195 V150', lw: [270, 352], lt: [204, 106] },
    { a: 'folk', b: 'shops', l: 'buy finished goods', w: 'M460 220 L 520 220', t: 'M180 210 V290', lw: [490, 172], lt: [190, 255], aw: 'middle' },
    { a: 'shops', b: 'players', l: 'pay for raw goods', at: 'end', w: 'M710 206 L 770 206', t: 'M165 350 V430', lw: [700, 172], lt: [157, 395] },
    { a: 'players', b: 'shops', l: 'buy food and tools', w: 'M770 236 L 710 236', t: 'M195 430 V350', lw: [700, 276], lt: [203, 395] },
    { a: 'players', b: 'treasury', l: 'crafting fees', w: 'M855 186 C 855 40 420 30 220 40', t: 'M105 460 H40 V80', lw: [560, 46], lt: [48, 270] },
    { a: 'shops', b: 'treasury', l: '', w: 'M615 186 C 615 100 380 70 220 74', t: 'M105 320 H40', lw: [0, 0], lt: [0, 0] },
    { a: 'players', b: 'market', l: 'sell to each other', w: 'M855 254 L 855 342', t: 'M150 490 V540 H91 V590', lw: [843, 304], lt: [160, 556], aw: 'end' },
    { a: 'market', b: 'burn', l: '5% of each sale', at: 'middle', k: 'sink', w: 'M770 376 L 710 376', t: 'M166 620 H194', lw: [740, 444], lt: [180, 676], aw: 'middle' }
  ];
  var fSvg = $('[data-flow-svg]'), fPick = 'players', fLayout = '', coins = [];
  function drawFlow() {
    if (!fSvg) return;
    var tall = fSvg.parentNode.clientWidth < 640, L = tall ? 't' : 'w';
    if (L === fLayout) return; fLayout = L;
    fSvg.setAttribute('viewBox', tall ? '0 0 360 700' : '0 0 960 460'); fSvg.classList.toggle('tall', tall);
    fSvg.textContent = ''; coins = [];
    var gE = el('g', {}, fSvg), gL = el('g', {}, fSvg), gC = el('g', {}, fSvg), gN = el('g', {}, fSvg);
    FE.forEach(function (e, i) {
      e.path = el('path', { d: e[L], class: 'edge' + (e.k ? ' ' + e.k : '') }, gE);
      e.beam = el('path', { d: e[L], class: 'beam' + (e.k === 'sink' ? ' sink' : ''), pathLength: 100 }, gE);
      if (e.l) { var lp = e['l' + L]; e.label = el('text', { x: lp[0], y: lp[1], class: 'elabel', 'text-anchor': L === 'w' ? (e.aw || 'start') : (e.at || 'start') }, gL); e.label.textContent = e.l; } else e.label = null;
      e.len = e.path.getTotalLength();
      for (var c = 0; c < 2; c++) coins.push({ e: e, o: (c * 0.5 + i * 0.13) % 1, dot: el('circle', { r: 5, class: 'coin' + (e.k === 'sink' ? ' burn' : '') }, gC) });
    });
    Object.keys(FN).forEach(function (k) {
      var n = FN[k], r = n[L], g = el('g', { class: 'node', tabindex: 0, role: 'button', 'aria-label': n.n + ': ' + n.text, 'data-node': k }, gN);
      el('rect', { x: r[0], y: r[1], width: r[2], height: r[3], rx: 16 }, g);
      el('text', { x: r[0] + 16, y: r[1] + 28 }, g).textContent = n.n;
      el('text', { x: r[0] + 16, y: r[1] + 50, class: 'sub' }, g).textContent = n.sub;
      g.addEventListener('click', function () { pickFlow(k); });
      g.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pickFlow(k); } });
      n.g = g;
    });
    pickFlow(fPick, true);
  }
  function pickFlow(k, quiet) {
    fPick = k; var n = FN[k];
    Object.keys(FN).forEach(function (j) { if (FN[j].g) FN[j].g.classList.toggle('on', j === k); });
    fSvg.classList.add('is-pick');
    FE.forEach(function (e) { var on = e.a === k || e.b === k; e.path.classList.toggle('on', on); e.beam.classList.toggle('on', on); if (e.label) e.label.classList.toggle('on', on); e.on = on; });
    coins.forEach(function (c) { c.dot.classList.toggle('on', c.e.on); });
    $('[data-flow-name]').textContent = n.n; $('[data-flow-text]').textContent = n.text;
    $('[data-flow-list]').innerHTML = FE.filter(function (e) { return e.on && e.l; }).map(function (e) {
      var out = e.a === k; return '<li class="' + (e.k === 'sink' ? 'sink' : '') + '"><b>' + (out ? 'Out' : 'In') + '</b><span>' + e.l.charAt(0).toUpperCase() + e.l.slice(1) + (out ? ', to ' + FN[e.b].n.toLowerCase() : ', from ' + FN[e.a].n.toLowerCase()) + '</span></li>';
    }).join('');
    var pnl = $('.flow__panel'); if (!quiet && !still) { pnl.classList.remove('swap'); void pnl.offsetWidth; pnl.classList.add('swap'); }
  }
  if (fSvg) {
    drawFlow(); window.addEventListener('resize', function () { drawFlow(); });
    var fSeen = false;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { fSeen = es[0].isIntersecting; }, { rootMargin: '100px' }).observe(fSvg);
    var last = performance.now();
    (function run(t) {
      var dt = Math.min(64, t - last); last = t;
      if (fSeen && !still) coins.forEach(function (c) { c.o = (c.o + dt / 4200) % 1; var pt = c.e.path.getPointAtLength(c.o * c.e.len); c.dot.setAttribute('cx', pt.x); c.dot.setAttribute('cy', pt.y); });
      requestAnimationFrame(run);
    })(last);
    if (still) coins.forEach(function (c) { var pt = c.e.path.getPointAtLength(c.o * c.e.len); c.dot.setAttribute('cx', pt.x); c.dot.setAttribute('cy', pt.y); });
  }

  /* ---- the daily save: the track fills with the game day since the last 06:00; the step for the hour lights */
  function paintPipe() {
    var h = hour(), fill = $('[data-pipe-fill]'); if (h == null || !fill) return;
    var since = ((h - 6) % 24 + 24) % 24, left = 24 - since;
    fill.style.setProperty('--p', (since / 24).toFixed(4));
    var m = Math.floor(left), s = Math.round((left - m) * 60);
    var txt = 'Next save in ' + m + ' min ' + (s < 10 ? '0' : '') + s + ' s, at 06:00 game time.';
    if (live.time && live.time.settledThrough != null) txt += ' Saved through game day ' + live.time.settledThrough + '.';
    $('[data-pipe-live]').textContent = txt;
    if (pipeHeld) return; // a step under the pointer or the focus keeps its light until it is let go
    var step = since < 0.5 ? 3 : 0; // just after dawn the day is being written; the rest of the day is play
    $$('.pipe__steps li').forEach(function (li) { li.classList.toggle('on', +li.getAttribute('data-step') === step); });
  }
  var pipeHeld = null;
  $$('.pipe__steps li').forEach(function (li) {
    function on() { pipeHeld = li; $$('.pipe__steps li').forEach(function (o) { o.classList.toggle('on', o === li); }); }
    function off() { if (pipeHeld === li) { pipeHeld = null; paintPipe(); } }
    li.addEventListener('pointerenter', on); li.addEventListener('focus', on);
    li.addEventListener('pointerleave', function () { if (document.activeElement !== li) off(); }); li.addEventListener('blur', off);
  });
  setInterval(paintPipe, 1000);

  /* ===== motion layer (styles in site.css, each effect after a 21st.dev component) ===== */
  var hoverable = matchMedia('(hover: hover) and (pointer: fine)').matches;
  function onceSeen(target, fn, margin) {
    if (!target) return;
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); fn(); } }, { rootMargin: margin || '0px 0px -15% 0px' });
    io.observe(target);
  }
  // 1 scroll progress
  var prog = $('[data-progress]'), pt = 0;
  if (prog) window.addEventListener('scroll', function () { if (pt) return; pt = requestAnimationFrame(function () { pt = 0; var h = document.documentElement.scrollHeight - innerHeight; prog.style.setProperty('--p', h > 0 ? (scrollY / h).toFixed(4) : 0); }); }, { passive: true });
  // 2 the live price ticker: two copies of the row so it can loop
  window.paintTicker = function () {
    var tr = $('[data-ticker-track]'); if (!tr) return;
    var best = {};
    (live.market || []).forEach(function (m) { if (m.open === false) return; (m.items || []).forEach(function (i) {
      var b = best[i.token] || (best[i.token] = { ask: null, bid: null });
      if (i.ask != null && (b.ask == null || i.ask < b.ask)) b.ask = i.ask;
      if (i.bid != null && (b.bid == null || i.bid > b.bid)) b.bid = i.bid;
    }); });
    var row = Object.keys(BASE).map(function (k) {
      var b = best && best[k], p = BASE[k], chg = 'usual price', cls = '';
      if (b && b.ask != null) { p = b.ask; var pc = Math.round((p - BASE[k]) / BASE[k] * 100); chg = pc > 0 ? pc + '% over usual' : pc < 0 ? -pc + '% under usual' : 'usual price'; cls = pc > 0 ? 'up' : pc < 0 ? 'down' : ''; }
      else if (b && b.bid != null) { p = b.bid; chg = 'what shops pay'; }
      return '<span class="ticker__item"><img class="px" src="img/item-' + k + '.png" width="48" height="48" alt="">' + NAME[k] + ' <b>' + p + '</b> coin <span class="chg ' + cls + '">' + chg + '</span></span>';
    }).join('');
    tr.innerHTML = row + '<span aria-hidden="true" style="display:contents">' + row + '</span>';
  };
  window.paintTicker();
  // 4 the board lists its rows in order
  var boardEl = $('[data-board]'); onceSeen(boardEl, function () { boardEl.classList.add('is-in'); });
  // 5 the lab's curve draws in the first time it is seen
  var labFig = $('.lab__fig'); onceSeen(labFig, function () { setTimeout(function () { labFig.classList.add('drawn'); }, 120); });
  // 6 the flow's beams run only while the diagram is on screen
  var flowSvg = $('[data-flow-svg]');
  if (flowSvg && 'IntersectionObserver' in window) new IntersectionObserver(function (es) { flowSvg.classList.toggle('is-seen', es[0].isIntersecting); }).observe(flowSvg);
  // 7 each chat command types itself out, row after row
  $$('.cmds__list dt code').forEach(function (c, row) {
    var t = c.textContent; c.setAttribute('aria-label', t); c.innerHTML = t.split('').map(function (ch, i) { return '<span class="ch" aria-hidden="true" style="--c:' + i + ';--row:' + row + '">' + (ch === ' ' ? '&nbsp;' : ch) + '</span>'; }).join('');
  });
  var cmds = $('.cmds'); onceSeen(cmds, function () { cmds.classList.add('is-in'); });
  // 10 a pixel trail on the live world, for a mouse only
  var stageEl = $('[data-stage]'), lastCell = '';
  if (stageEl && hoverable && !still) stageEl.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse' || stageEl.classList.contains('is-drag')) return;
    var r = stageEl.getBoundingClientRect(), x = Math.floor((e.clientX - r.left) / 16) * 16, y = Math.floor((e.clientY - r.top) / 16) * 16, key = x + ',' + y;
    if (key === lastCell) return; lastCell = key;
    var d = document.createElement('i'); d.className = 'trail'; d.style.left = x + 'px'; d.style.top = y + 'px'; stageEl.appendChild(d);
    setTimeout(function () { d.remove(); }, 720);
  });
  // 11 tilt toward the pointer
  if (hoverable && !still) $$('[data-tilt], .extras .pic, .step__pic').forEach(function (t) {
    t.addEventListener('pointermove', function (e) { var r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      t.style.transform = 'perspective(900px) rotateX(' + (-y * 6).toFixed(2) + 'deg) rotateY(' + (x * 8).toFixed(2) + 'deg)'; });
    t.addEventListener('pointerleave', function () { t.style.transform = ''; });
  });
  // 12 parallax: pictures drift against the scroll
  var par = $$('.extras .pic img, .step__pic img'), pp = 0;
  if (par.length && !still) {
    var parallax = function () { pp = 0; par.forEach(function (im) { var r = im.parentNode.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; var c = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; im.style.setProperty('--py', (c * -24).toFixed(1) + 'px'); }); };
    window.addEventListener('scroll', function () { if (!pp) pp = requestAnimationFrame(parallax); }, { passive: true }); parallax();
  }
  // 13 magnetic primary buttons
  if (hoverable && !still) $$('.btn--primary').forEach(function (b) {
    b.addEventListener('pointermove', function (e) { var r = b.getBoundingClientRect(); b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .18).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * .3).toFixed(1) + 'px)'; });
    b.addEventListener('pointerleave', function () { b.style.transform = ''; });
  });
  // 14 scramble: a building's name and the nav links settle out of shuffled letters
  var POOL = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  window.scramble = function (el, text) {
    if (still) { el.textContent = text; return; }
    var n = 0, f = 0; el.setAttribute('aria-label', text);
    (function step() {
      el.textContent = text.split('').map(function (c, i) { return i < n || c === ' ' ? c : POOL[(Math.random() * POOL.length) | 0]; }).join('');
      if (n < text.length) { if (++f % 2 === 0) n++; requestAnimationFrame(step); } else el.removeAttribute('aria-label');
    })();
  };
  if (hoverable) $$('.bar__links a').forEach(function (a) { var t = a.textContent; a.addEventListener('pointerenter', function () { window.scramble(a, t); }); });
  // 15 number ticker: every live figure counts to its value the first time it is seen
  $$('[data-isle-th], [data-lab-ask], [data-lab-bid]').forEach(function (d) { onceSeen(d, function () { var v = parseFloat(d.textContent); if (!isNaN(v)) { d.textContent = '0'; tick(d, v); } }); });

  /* ---- live: the clock and the settled day, the shelves and the middle prices */
  function hour() { return live.time ? (live.time.hour + (Date.now() - live.at) / 60000) % 24 : null; }
  function paintClock() {
    var t = live.time, h = hour(); if (!t) return;
    $('[data-now-text]').textContent = 'In town now: ' + SEASON[t.season] + ', day ' + (t.dayOfSeason || 1) + ', ' + hhmm(h) + '.';
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
      paintShelf(false); paintCalc(false); window.paintTicker();
      $('[data-live-note]').textContent = COPY.live(new Date().toTimeString().slice(0, 5));
    }).catch(function () {});
  }
  clock(); prices();
  setInterval(paintClock, 5000); setInterval(clock, 120000); setInterval(prices, 30000);
})();
