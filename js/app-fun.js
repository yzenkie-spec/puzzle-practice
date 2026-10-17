/* Fun part of the app: mistakes notebook, rewards, mini-games, NHL fantasy teams. */
(function () {
  const PP = window.PP, U = PP.ui, A = U.A, set = U.set, D = () => PP.D();
  const LN = PP.LEVEL_NAME;
  let mv = { f: 'open', sec: 'all', open: null, page: 0 };   // mistakes view
  let fs = { pool: 'cur' };                                  // fantasy view
  let R = null;                                              // current reward: { from, info, bonus }
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const dark = hex => { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return (r * 299 + g * 587 + b * 114) / 1000 < 150; };

  /* ---------------- player cards ---------------- */
  function jersey(team) {
    const c = PP.TEAMS[team] || ['#555555', '#ffffff'];
    return '<svg class="jersey" viewBox="0 0 64 64" aria-hidden="true"><path d="M20 6 L8 14 L2 30 L14 34 L16 28 L16 58 L48 58 L48 28 L50 34 L62 30 L56 14 L44 6 Q32 16 20 6Z" fill="' + c[0] + '" stroke="#111" stroke-width="2" stroke-linejoin="round"/><rect x="16" y="38" width="32" height="6" fill="' + c[1] + '" opacity=".9"/><text x="32" y="31" text-anchor="middle" font-size="11" font-weight="800" fill="' + (dark(c[0]) ? '#ffffff' : '#111111') + '" font-family="Fredoka,sans-serif">' + team + '</text></svg>';
  }
  function card(p, mini) {
    const t = PP.tier(p.r);
    return '<div class="pc t-' + t + (mini ? ' mini' : '') + '">' + jersey(p.team) + '<b>' + p.name + '</b><span class="pos">' + p.pos + '</span><span class="rt">' + p.r + '</span>' + (mini ? '' : '<small>' + PP.TIER_NAME[t] + '</small>') + '</div>';
  }
  let ed = null;   // lineup spot being edited
  function lineup(pool) {
    const t = PP.fan.team(pool).slots;
    const cell = s => '<div class="slot"><button class="slotbtn' + (ed === s ? ' sel' : '') + '" data-a="slotPick" data-v="' + s + '" aria-label="' + PP.slotName(s) + '">' +
      (t[s] ? card(PP.NHL_BY_ID[t[s]], true) : '<div class="pc empty"><span>' + PP.SLOT_NAME[PP.SLOT_POS[s]] + '</span><small>tap to add</small></div>') + '</button></div>';
    let h = '<div class="lineup">';
    [1, 2, 3].forEach(n => { h += '<div class="lname">Line ' + n + '</div><div class="lrow">' + ['LW', 'C', 'RW'].map(x => cell(x + n)).join('') + '</div><div class="lrow">' + ['a', 'b'].map(x => cell('D' + n + x)).join('') + '</div>'; });
    return h + '<div class="lname">Goalie</div><div class="lrow">' + cell('G') + '</div></div>';
  }
  function picker(pool) {
    if (!ed) return '';
    const pos = PP.SLOT_POS[ed], cur = PP.fan.team(pool).slots[ed];
    const list = PP.NHL[pool].filter(p => p.pos === pos && PP.fan.owned(p.id)).sort((a, b) => b.r - a.r);
    const cards = list.map(p => { const at = PP.fan.placedAt(pool, p.id); return '<button class="pickc" data-a="slotSet" data-v="' + p.id + '">' + card(p, true) + '<small class="' + (cur === p.id ? 'good' : 'mute') + '">' + (cur === p.id ? 'In this spot' : at ? 'Now on ' + PP.slotName(at).toLowerCase() + ' (swap)' : 'On the bench') + '</small></button>'; }).join('');
    return '<div class="card main" id="picker"><div class="lvh"><b>Choose your ' + PP.slotName(ed).toLowerCase() + '</b><button class="ghost" data-a="slotClose">Close</button></div>' +
      (list.length ? '<div class="cgrid">' + cards + '</div>' : '<p class="sub">You have not collected a ' + PP.POS_NAME[pos].toLowerCase() + ' yet. Earn draft picks to collect more players!</p>') +
      (cur ? '<button class="ghost wide" data-a="slotClear">Take him out of this spot</button>' : '') + '</div>';
  }
  const poolTabs = act => '<div class="tabs">' + ['cur', 'all'].map(p => '<button class="tab' + (fs.pool === p ? ' on' : '') + '" data-a="' + act + '" data-v="' + p + '">' + PP.POOL_ICON[p] + ' ' + PP.POOL_NAME[p] + '</button>').join('') + '</div>';

  /* ---------------- fantasy team page ---------------- */
  function fantasy() {
    U.stop();
    const d = D(), pool = fs.pool, tm = PP.fan.team(pool), rt = PP.fan.rating(pool), pk = d.fan.picks.length;
    const other = pool === 'cur' ? 'all' : 'cur', ro = PP.fan.rating(other);
    const hist = d.fan.hist.slice(0, 6).map(h => { const p = PP.NHL_BY_ID[h.id], o = h.old ? PP.NHL_BY_ID[h.old] : null; return '<li>' + PP.POOL_ICON[h.pool] + ' <b>' + p.name + '</b> (' + p.r + ')' + (o ? ' replaced ' + o.name + ' (' + o.r + ')' : ' added to the collection') + '</li>'; }).join('');
    set('<div class="top"><button class="ghost" data-a="home">Home</button><span class="mute">🏆 Fantasy teams</span></div><h1>My fantasy teams</h1>' + poolTabs('fanPool') +
      '<div class="card"><label class="mute" for="tname">Team name</label><input id="tname" class="tname" maxlength="24" value="' + esc(tm.name) + '"><div class="lvh"><b>Team rating</b><span>' + (rt.n ? rt.avg : '–') + ' · ' + rt.n + ' of 16 spots filled</span></div>' + U.bar(rt.avg) + '<small class="mute">' + PP.POOL_ICON[other] + ' ' + esc(PP.fan.team(other).name) + ': ' + (ro.n ? ro.avg : '–') + ' (' + ro.n + ' of 16)</small></div>' +
      '<h2>Lineup</h2><p class="sub">Tap a spot to choose any player you have collected. Pick a player who is already in another spot and the two swap places.</p>' + lineup(pool) + picker(pool) +
      '<button class="ghost wide" data-a="collection" style="margin-top:10px">📇 Player collection (' + Object.keys(d.fan.owned).length + ' collected)</button>' + (pk ? '<button class="go" data-a="draft">Draft a player (' + pk + ' pick' + (pk > 1 ? 's' : '') + ' ready)</button>' : '<div class="card main"><b>No draft picks yet</b><p class="sub">Finish 10 practice questions to earn a pick. Get 8 or more right for a bonus pick. A mock test earns 3 or more.</p></div>') +
      (hist ? '<h2>Recent picks</h2><div class="card"><ul class="weak">' + hist + '</ul></div>' : '') +
      '<p class="sub mute">Player ratings are made up for this game. Teams are as of the 2025-26 season.</p>');
  }

  /* ---------------- collection: every player he has drafted ---------------- */
  let cv = { pool: 'cur', pos: 'all' };
  function collection() {
    U.stop();
    const d = D(), list = PP.NHL[cv.pool].slice().sort((a, b) => b.r - a.r);
    const have = list.filter(p => d.fan.owned[p.id]).length;
    const shown = list.filter(p => cv.pos === 'all' || p.pos === cv.pos);
    const tabs = '<div class="tabs">' + ['cur', 'all'].map(p => '<button class="tab' + (cv.pool === p ? ' on' : '') + '" data-a="colPool" data-v="' + p + '">' + PP.POOL_ICON[p] + ' ' + PP.POOL_NAME[p] + '</button>').join('') + '</div>';
    const chips = '<div class="chips2">' + ['all', 'C', 'LW', 'RW', 'D', 'G'].map(x => '<button class="chip' + (cv.pos === x ? ' on' : '') + '" data-a="colPos" data-v="' + x + '">' + (x === 'all' ? 'All' : x) + '</button>').join('') + '</div>';
    const cells = shown.map(p => {
      if (d.fan.owned[p.id]) return '<div class="cc">' + card(p, true) + (PP.fan.onTeam(cv.pool, p.id) ? '<small class="good">On my team</small>' : '<small class="mute">Collected</small>') + '</div>';
      return '<div class="cc"><div class="pc mini locked t-' + PP.tier(p.r) + '"><span class="q">❔</span><b>???</b><span class="pos">' + p.pos + '</span><small>' + PP.TIER_NAME[PP.tier(p.r)] + '</small></div><small class="mute">Not collected</small></div>';
    }).join('');
    set('<div class="top"><button class="ghost" data-a="fantasy">My team</button><span class="mute">📇 Collection</span></div><h1>Player collection</h1>' + tabs +
      '<div class="card"><div class="lvh"><b>Collected</b><span>' + have + ' of ' + list.length + '</span></div>' + U.bar(have / list.length * 100) + '<small class="mute">Draft players to fill the collection. Every player you draft stays here, even if you later swap him off your team.</small></div>' + chips + '<div class="cgrid">' + cells + '</div>');
  }

  /* ---------------- draft ---------------- */
  function draft() {
    U.stop();
    const d = D(), pool = fs.pool, pk = d.fan.picks.length;
    if (!pk) return fantasy();
    const offers = PP.fan.offer(pool);
    let body;
    if (!offers || !offers.length) {
      body = '<div class="card main"><b>Collection complete! 🏆</b><p class="sub">You have collected every player in this group. Try the other team.</p></div>';
    } else {
      body = '<p class="sub">Pick one player. The better the quality of your practice, the better the choices.</p><div class="offers">' + offers.map(p => {
        const sl = PP.fan.nextSlot(pool, p.pos);
        const info = sl ? 'Starts as ' + PP.slotName(sl).toLowerCase() : 'Lineup full here: goes to your collection';
        return '<div class="offer">' + card(p, false) + '<small class="mute">' + info + '</small><button class="go" data-a="draftPick" data-v="' + p.id + '">Draft</button></div>';
      }).join('') + '</div>';
    }
    set('<div class="top"><button class="ghost" data-a="fantasy">My team</button><span class="mute">' + pk + ' pick' + (pk > 1 ? 's' : '') + ' left</span></div><h1>🏒 Draft day!</h1>' + poolTabs('draftPool') + body);
  }
  function draftPick(id) {
    const pool = fs.pool, p = PP.NHL_BY_ID[id], tg = PP.fan.draft(pool, id);
    if (!tg) return draft();
    const left = D().fan.picks.length;
    U.confetti();
    set('<h1>Welcome to the team! 🎉</h1><p class="sub">' + p.name + ' joins ' + esc(PP.fan.team(pool).name) + (tg.slot ? ' as ' + PP.slotName(tg.slot).toLowerCase() : ' in your collection. The lineup spots for his position are full, so swap him in from your lineup') + '.</p><div class="reveal">' + card(p, false) + '</div><div class="menu">' +
      (left ? '<button class="go" data-a="draft">Draft again (' + left + ' left)</button>' : '') + '<button class="ghost wide" data-a="fantasy">See my lineup</button>' + (R ? '<button class="ghost wide" data-a="cont">' + (R.from === 'mock' ? 'Home' : 'Keep practicing') + '</button>' : '<button class="ghost wide" data-a="home">Home</button>') + '</div>');
  }

  /* ---------------- rewards after a session or test ---------------- */
  function sessionDone() {
    const info = PP.claimSession();
    R = { from: 'practice', info, bonus: false };
    rewards();
  }
  function rewardsFromMock() {
    const t = D().tests[0];
    R = { from: 'mock', info: { picks: t.rw || 0, n: PP.testCount(t), ok: PP.testTotal(t), mock: true }, bonus: false };
    rewards();
  }
  function rewards() {
    U.stop();
    const i = R.info, pk = D().fan.picks.length;
    U.confetti();
    set('<h1>' + (i.mock ? 'Test rewards! 🎁' : 'Session complete! 🎉') + '</h1><p class="sub">' + (i.mock ? 'You scored ' + i.ok + ' of ' + i.n + '.' : 'You got ' + i.ok + ' of ' + i.n + ' right.') + '</p>' +
      '<div class="card main"><b>🏒 You earned ' + i.picks + ' draft pick' + (i.picks > 1 ? 's' : '') + '!</b><p class="sub">' + pk + ' pick' + (pk > 1 ? 's' : '') + ' ready to use.' + (R.bonus ? ' Bonus pick added!' : ' Win a mini-game for one more bonus pick.') + '</p></div><div class="menu">' +
      '<button class="go" data-a="draft">🏆 Draft a player</button><button class="ghost wide" data-a="games">🎮 Play a mini-game' + (R.bonus ? '' : ' (bonus pick)') + '</button><button class="ghost wide" data-a="cont">' + (R.from === 'mock' ? 'Home' : 'Keep practicing') + '</button></div>');
  }
  function cont() {
    const P = U.getP();
    if (R && R.from === 'practice' && P && P.mode) { P.fromMiss = null; P.fixLv = null; return P.mode === 'practice' ? U.nextPractice() : U.nextFocus(); }
    U.home();
  }

  /* ---------------- mini-games ---------------- */
  function games() {
    U.stop();
    if (!R) R = { from: 'home', info: { picks: 0, n: 0, ok: 0 }, bonus: false };
    set('<div class="top"><button class="ghost" data-a="rewardsBack">Back</button></div><h1>🎮 Mini-games</h1><p class="sub">' + (R.bonus ? 'You already won a bonus pick this time. Play for fun!' : 'Win a game to earn a bonus draft pick.') + '</p><div class="menu"><button class="go" data-a="shootout">🥅 Penalty shootout<small>Score 3 of 5 goals</small></button><button class="go" data-a="memory">🧠 Memory match<small>Finish in 12 moves or fewer</small></button></div>');
  }
  function gameEnd(win, title, text) {
    if (win && R && !R.bonus) { R.bonus = true; PP.addPicks(1, 1); }
    if (win) U.confetti();
    const pk = D().fan.picks.length;
    set('<h1>' + title + '</h1><p class="sub">' + text + '</p>' + (win ? '<div class="card main"><b>🏒 Bonus draft pick!</b><p class="sub">' + pk + ' pick' + (pk > 1 ? 's' : '') + ' ready.</p></div>' : '') +
      '<div class="menu"><button class="go" data-a="draft">🏆 Draft a player</button><button class="ghost wide" data-a="games">Play another game</button><button class="ghost wide" data-a="cont">' + (R && R.from === 'mock' ? 'Home' : 'Keep practicing') + '</button></div>');
  }

  /* penalty shootout: tap SHOOT when the target is over an open spot */
  let SO = null;
  function shootout() {
    U.stop();
    SO = { i: 0, goals: 0, res: [], raf: 0, x: 50, busy: false };
    set('<div class="top"><span class="mute">🥅 Penalty shootout</span><span id="sc" class="clk">' + soScore() + '</span></div><div class="goalbox" id="gb"><div class="gk" id="gk">🧤</div><div class="aim" id="aim">🎯</div></div><div id="msg" class="shotmsg">Tap SHOOT when the target is over an open spot!</div><button class="go" data-a="shoot" id="shootbtn">SHOOT! 🏒</button>');
    soStart();
  }
  const soScore = () => { let s = ''; for (let k = 0; k < 5; k++) s += k < SO.res.length ? (SO.res[k] ? '🟢' : '🔴') : '⚪'; return s; };
  function soStart() {
    SO.busy = false;
    const sp = 0.0016 + SO.i * 0.0004, t0 = performance.now() + Math.random() * 3000;
    const gk = document.getElementById('gk'); if (gk) gk.style.left = '50%';
    const loop = now => {
      SO.x = 50 + 46 * Math.sin((now - t0) * sp);
      const a = document.getElementById('aim'); if (!a) return;
      a.style.left = SO.x + '%';
      SO.raf = requestAnimationFrame(loop);
    };
    SO.raf = requestAnimationFrame(loop);
  }
  function shoot() {
    if (!SO || SO.busy) return;
    SO.busy = true; cancelAnimationFrame(SO.raf);
    const x = SO.x, gx = 16 + Math.random() * 68, wide = x < 9 || x > 91, saved = !wide && Math.abs(gx - x) < 15;
    const gk = document.getElementById('gk'), msg = document.getElementById('msg');
    if (gk) gk.style.left = gx + '%';
    const goal = !wide && !saved;
    SO.res.push(goal); if (goal) SO.goals++;
    msg.textContent = goal ? 'GOAL! 🚨 He shoots, he scores!' : wide ? 'Wide of the net! 😬' : 'Saved by the goalie! 🧤';
    document.getElementById('sc').textContent = soScore();
    setTimeout(() => {
      if (!document.getElementById('gb')) return;
      SO.i++;
      if (SO.i >= 5) { const w = SO.goals >= 3; gameEnd(w, w ? 'You win! 🏆' : 'Good effort!', 'You scored ' + SO.goals + ' of 5 goals.' + (w ? '' : ' Score 3 to win a bonus pick. Try again!')); }
      else { msg.textContent = 'Next shot! Tap SHOOT at the right moment.'; soStart(); }
    }, 1300);
  }

  /* memory match */
  let MM = null;
  function memory() {
    U.stop();
    const E = ['🏒', '🥅', '🏆', '🧤', '⛸️', '🚨'];
    MM = { cards: PP.shuffle(Math.random, E.concat(E)), open: [], done: [], moves: 0, lock: false };
    set('<div class="top"><span class="mute">🧠 Memory match</span><span id="mv" class="clk">0 moves</span></div><p class="sub">Find all 6 pairs in 12 moves or fewer.</p><div class="mgrid" id="mgrid">' + memGrid() + '</div>');
  }
  function memGrid() {
    return MM.cards.map((c, i) => {
      const up = MM.open.includes(i) || MM.done.includes(i);
      return '<button class="mc' + (MM.done.includes(i) ? ' ok' : up ? ' up' : '') + '" data-a="memFlip" data-v="' + i + '" aria-label="' + (up ? c : 'hidden card') + '">' + (up ? c : '❔') + '</button>';
    }).join('');
  }
  function memFlip(v) {
    const i = +v;
    if (!MM || MM.lock || MM.open.includes(i) || MM.done.includes(i)) return;
    MM.open.push(i);
    const g = document.getElementById('mgrid'); g.innerHTML = memGrid();
    if (MM.open.length === 2) {
      MM.moves++; document.getElementById('mv').textContent = MM.moves + ' moves'; MM.lock = true;
      const [a, b] = MM.open, hit = MM.cards[a] === MM.cards[b];
      setTimeout(() => {
        if (!document.getElementById('mgrid')) return;
        if (hit) MM.done.push(a, b);
        MM.open = []; MM.lock = false;
        document.getElementById('mgrid').innerHTML = memGrid();
        if (MM.done.length === 12) setTimeout(() => { const w = MM.moves <= 12; gameEnd(w, w ? 'Perfect memory! 🏆' : 'All pairs found!', 'You finished in ' + MM.moves + ' moves.' + (w ? '' : ' Finish in 12 or fewer for a bonus pick.')); }, 500);
      }, hit ? 400 : 800);
    }
  }

  /* ---------------- mistakes notebook ---------------- */
  function mistakes() {
    U.stop(); U.setP(null);
    const c = PP.missCounts(), list = PP.missList(mv.f, mv.sec), PAGE = 8, pages = Math.max(1, Math.ceil(list.length / PAGE));
    if (mv.page >= pages) mv.page = pages - 1;
    const fchip = (k, label, n) => '<button class="tab' + (mv.f === k ? ' on' : '') + '" data-a="missFilter" data-v="' + k + '">' + label + ' (' + n + ')</button>';
    const schips = '<button class="chip' + (mv.sec === 'all' ? ' on' : '') + '" data-a="missSec" data-v="all">All</button>' + PP.SECS.map(s => '<button class="chip' + (mv.sec === s.code ? ' on' : '') + '" data-a="missSec" data-v="' + s.code + '" aria-label="' + s.name + '">' + s.icon + '</button>').join('');
    const rows = list.slice(mv.page * PAGE, mv.page * PAGE + PAGE).map(x => {
      const q = PP.get(x.id), open = mv.open === x.id;
      let h = '<button class="tile wide miss' + (x.m.u ? ' got' : '') + '" data-a="missOpen" data-v="' + x.id + '"><div class="lvh"><b>' + U.secIcon(q.sec) + ' ' + U.secName(q.sec) + '</b><span class="lc ' + (x.m.u ? 'done' : 'open') + '">' + (x.m.u ? '✅ Understood' : '❓ Not yet') + '</span></div><small class="mute">' + LN[q.lv] + ' · ' + U.tagLabel(q.sec, q.tag) + ' · missed ' + x.m.n + (x.m.n > 1 ? ' times' : ' time') + ' · ' + new Date(x.m.ts).toLocaleDateString() + (x.m.pick === null ? ' · skipped' : '') + '</small></button>';
      if (open) {
        h += '<div class="rvq">' + U.qHTML(q, x.m.pick, true) + '<div class="fb bad">' + (x.m.pick === null ? 'You skipped this one. ' : 'Your answer was ' + PP.LETTERS[x.m.pick] + '. ') + 'Right answer: ' + PP.LETTERS[q.ans] + '. ' + q.exp + '</div>' +
          '<div class="row"><button class="ghost" data-a="missSet" data-v="1">✅ I understand now</button><button class="ghost" data-a="missSet" data-v="0">❓ Still confused</button></div><button class="go" data-a="missTry" data-v="' + x.id + '">🔁 Try a similar question</button></div>';
      }
      return h;
    }).join('');
    set('<div class="top"><button class="ghost" data-a="home">Home</button><span class="mute">🧠 Mistakes</span></div><h1>Mistakes notebook</h1><p class="sub">Every question you missed is saved here. Tap one to see why, then say if you understand it now.</p>' +
      '<div class="tabs">' + fchip('open', '❓ Not yet', c.open) + fchip('done', '✅ Understood', c.done) + fchip('all', 'All', c.all) + '</div><div class="chips2">' + schips + '</div>' +
      (rows || '<div class="card"><p>' + (c.all ? 'Nothing in this list. Nice work!' : 'No mistakes saved yet. Questions you miss will show up here.') + '</p></div>') +
      (pages > 1 ? '<div class="row"><button class="ghost" data-a="missPage" data-v="-1"' + (mv.page === 0 ? ' disabled' : '') + '>Previous</button><span class="mute" style="align-self:center">Page ' + (mv.page + 1) + ' of ' + pages + '</span><button class="ghost" data-a="missPage" data-v="1"' + (mv.page >= pages - 1 ? ' disabled' : '') + '>Next</button></div>' : ''));
    if (mv.open) { const el = document.querySelector('.rvq'); if (el) el.previousElementSibling.scrollIntoView({ block: 'start' }); }
  }
  function missTry(id) {
    const q = PP.get(id);
    U.setP({ mode: 'practice', code: q.sec, smart: false, twin: q.tag, fixLv: q.lv, fromMiss: id });
    U.nextPractice();
  }
  function missUnderstood() {
    const P = U.getP(); if (P && P.fromMiss) { PP.setUnderstood(P.fromMiss, true); mv.open = null; U.confetti(); }
    mistakes();
  }

  Object.assign(A, {
    collection, colPool: v => { cv.pool = v; collection(); }, colPos: v => { cv.pos = v; collection(); },
    fantasy, fantasyHome: () => { R = null; ed = null; fantasy(); }, draft, draftPick, fanPool: v => { fs.pool = v; ed = null; fantasy(); },
    slotPick: v => { ed = ed === v ? null : v; fantasy(); const el = document.getElementById('picker'); if (el) el.scrollIntoView({ block: 'center' }); },
    slotSet: id => { if (ed) PP.fan.place(fs.pool, ed, id); ed = null; fantasy(); },
    slotClear: () => { if (ed) PP.fan.clear(fs.pool, ed); ed = null; fantasy(); }, slotClose: () => { ed = null; fantasy(); }, draftPool: v => { fs.pool = v; draft(); },
    sessionDone, rewards: v => rewardsFromMock(), cont, games, rewardsBack: () => (R ? rewards() : U.home()),
    shootout, shoot, memory, memFlip,
    mistakes, missFilter: v => { mv.f = v; mv.page = 0; mv.open = null; mistakes(); }, missSec: v => { mv.sec = v; mv.page = 0; mv.open = null; mistakes(); },
    missPage: v => { mv.page += +v; mv.open = null; mistakes(); }, missOpen: v => { mv.open = mv.open === v ? null : v; mistakes(); },
    missSet: v => { if (mv.open) { PP.setUnderstood(mv.open, v === '1'); if (v === '1') U.confetti(); mistakes(); } },
    missTry, missUnderstood
  });
  PP._mm = () => MM; PP._so = () => SO;
  document.getElementById('app').addEventListener('input', e => { if (e.target.id === 'tname') PP.fan.setName(fs.pool, e.target.value); });
})();
