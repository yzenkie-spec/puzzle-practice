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
  function jersey(team) { return PP.jerseySvg(team, 'e'); }
  function jerseyCard(j, mini) {
    const c = PP.TEAMS[j.team], v = j.lv;
    const body = v === 'a' ? '#ffffff' : c[0], trim = v === 'a' ? c[0] : c[1], txt = v === 'a' ? c[0] : (dark(c[0]) ? '#ffffff' : '#111111');
    const svg = PP.jerseySvg(j.team, v);
    return '<div class="pc jc t-' + (v === 'c' ? 'epic' : v === 'a' ? 'rare' : 'common') + (mini ? ' mini' : '') + '">' + svg + '<b>' + PP.JTEAMS[j.team] + '</b><span class="pos">' + PP.JVAR[v] + '</span>' + (j.n > 1 ? '<span class="rt">×' + j.n + '</span>' : '') + '</div>';
  }
  U.jerseyCard = jerseyCard;
  const jv = { lv: 'e' };
  function jerseys() {
    U.stop();
    const o = D().jer.owned, codes = Object.keys(PP.JTEAMS), all = codes.length * 3;
    const have = Object.keys(o).length;
    const chips = '<div class="chips">' + ['e', 'a', 'c'].map(l => '<button class="chip' + (jv.lv === l ? ' on' : '') + '" data-a="jerLv" data-v="' + l + '">' + PP.JVAR[l] + ' (' + codes.filter(c => o[c + '|' + l]).length + '/' + codes.length + ')</button>').join('') + '</div>';
    const cells = codes.map(c => { const k = c + '|' + jv.lv; return o[k] ? '<div class="cc">' + jerseyCard({ team: c, lv: jv.lv, n: o[k] }, true) + '</div>' : '<div class="cc"><div class="pc locked mini"><b>???</b><span class="pos">' + PP.JTEAMS[c] + '</span></div></div>'; }).join('');
    set('<div class="top"><button class="ghost" data-a="home">Home</button><span class="mute">👕 Jerseys</span></div><h1>Jersey collection</h1><div class="card"><div class="lvh"><b>Collected</b><span>' + have + ' of ' + all + '</span></div>' + U.bar(have / all * 100) + '<small class="mute">Score 90% or more on a mock test to win a jersey: 90% = Home, 95% = Away, 100% = Retro.</small></div>' + chips + '<div class="cgrid">' + cells + '</div>');
  }
  /* ---------------- save / restore progress ---------------- */
  let bk = { code: '', msg: '', ok: true };
  async function backup() {
    U.stop();
    try { bk.code = await PP.exportCode(); } catch (e) { bk.code = ''; }
    backupView();
  }
  function backupView() {
    const ta = 'style="width:100%;box-sizing:border-box;height:110px;font:12px monospace;border-radius:12px;border:2px solid #cbd5e8;padding:8px"';
    set('<div class="top"><button class="ghost" data-a="home">Home</button><span class="mute">💾 Backup</span></div><h1>Save my progress</h1>' +
      '<div class="card"><b>1. Save</b><p class="sub">Keep this code or file somewhere safe (notes, email to yourself). It holds every level, collection, lineup and mistake.</p>' +
      '<textarea id="bkcode" readonly ' + ta + '>' + bk.code + '</textarea>' +
      '<div class="row"><button class="go" data-a="bkCopy">📋 Copy code</button><button class="ghost" data-a="bkFile">⬇️ Save as file</button></div></div>' +
      '<div class="card"><b>2. Restore</b><p class="sub">On a new iPad or after losing progress: paste the code (or pick the file), then tap Restore. This replaces what is on this device.</p>' +
      '<textarea id="bkin" placeholder="Paste your code here" ' + ta + '></textarea>' +
      '<div class="row"><button class="go" data-a="bkRestore">♻️ Restore</button><label class="ghost" style="text-align:center;padding:12px;border-radius:14px;cursor:pointer">📂 Pick a file<input id="bkpick" type="file" accept=".txt,text/plain" style="display:none"></label></div>' +
      (bk.msg ? '<div class="fb ' + (bk.ok ? 'good' : 'bad') + '">' + bk.msg + '</div>' : '') + '</div>');
    bk.msg = '';
  }
  async function bkRestore() {
    const ta = document.getElementById('bkin'), v = ta ? ta.value : '';
    try {
      const r = await PP.parseCode(v);
      PP.restoreData(r);
      document.getElementById('app').innerHTML = '<h1>Progress restored! 🎉</h1><p class="sub">Loading your saved progress…</p>';
      setTimeout(() => location.reload(), 600);
    } catch (e) { bk.ok = false; bk.msg = 'That code did not work. Make sure you copied all of it, starting with PP.'; backupView(); }
  }
  async function bkCopy() {
    const ta = document.getElementById('bkcode'); ta.select(); ta.setSelectionRange(0, 999999999);
    let ok = false; try { await navigator.clipboard.writeText(ta.value); ok = true; } catch (e) { try { ok = document.execCommand('copy'); } catch (e2) {} }
    bk.ok = ok; bk.msg = ok ? 'Copied! Paste it somewhere safe.' : 'Could not copy automatically. The code is selected: touch and hold it, then tap Copy.'; backupView();
    if (!ok) { const t2 = document.getElementById('bkcode'); t2.select(); }
  }
  function bkFile() {
    const a = document.createElement('a'), d = new Date();
    a.href = URL.createObjectURL(new Blob([bk.code], { type: 'text/plain' }));
    a.download = 'puzzle-practice-backup-' + d.toISOString().slice(0, 10) + '.txt';
    document.body.appendChild(a); a.click(); a.remove();
    bk.ok = true; bk.msg = 'File saved (check your Files / Downloads).'; backupView();
  }
  document.getElementById('app').addEventListener('change', e => {
    if (e.target.id !== 'bkpick' || !e.target.files[0]) return;
    const rd = new FileReader();
    rd.onload = () => { const ta = document.getElementById('bkin'); if (ta) ta.value = String(rd.result || ''); };
    rd.readAsText(e.target.files[0]);
  });
  function card(p, mini) {
    const t = PP.tier(p.r), g = PP.fan.gearOf(p.id), jk = g.j ? g.j.split('|') : null, st = g.s ? PP.STICK_BY_ID[g.s] : null;
    const jsvg = PP.jerseySvg(jk ? jk[0] : p.team, jk ? jk[1] : 'e', p.id);
    return '<div class="pc t-' + t + (mini ? ' mini' : '') + '">' + jsvg + (st ? '<span class="gearstk">' + PP.stickSvg(st) + '</span>' : '') + (PP.fan.teamMatch(p.id) ? '<span class="match" title="Wearing his own team jersey">✨</span>' : '') + '<b>' + p.name + '</b><span class="pos">' + p.pos + '</span><span class="rt">' + p.r + '</span>' + (mini ? '' : '<small>' + PP.TIER_NAME[t] + '</small>') + '</div>';
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
    const d = D(), pool = fs.pool, tm = PP.fan.team(pool), rt = PP.fan.rating(pool), pk = PP.fan.pickCount(pool);
    const other = pool === 'cur' ? 'all' : 'cur', ro = PP.fan.rating(other);
    const hist = d.fan.hist.slice(0, 6).map(h => { const p = PP.NHL_BY_ID[h.id], o = h.old ? PP.NHL_BY_ID[h.old] : null; return '<li>' + PP.POOL_ICON[h.pool] + ' <b>' + p.name + '</b> (' + p.r + ')' + (o ? ' replaced ' + o.name + ' (' + o.r + ')' : ' added to the collection') + '</li>'; }).join('');
    set('<div class="top"><button class="ghost" data-a="home">Home</button><span class="mute">🏆 Fantasy teams</span></div><h1>My fantasy teams</h1>' + poolTabs('fanPool') +
      '<div class="card"><label class="mute" for="tname">Team name</label><input id="tname" class="tname" maxlength="24" value="' + esc(tm.name) + '"><div class="lvh"><b>Team rating</b><span>' + (rt.n ? rt.avg : '–') + ' · ' + rt.n + ' of 16 spots filled</span></div>' + U.bar(rt.avg) + '<small class="mute">' + PP.POOL_ICON[other] + ' ' + esc(PP.fan.team(other).name) + ': ' + (ro.n ? ro.avg : '–') + ' (' + ro.n + ' of 16)</small></div>' +
      '<h2>Lineup</h2><p class="sub">Tap a spot to choose any player you have collected. Pick a player who is already in another spot and the two swap places.</p>' + lineup(pool) + picker(pool) +
      '<button class="ghost wide" data-a="collection" style="margin-top:10px">📇 Player collection (' + Object.keys(d.fan.owned).length + ' collected)</button>' + (pk ? '<button class="go" data-a="draft">Draft a player (' + pk + ' pick' + (pk > 1 ? 's' : '') + ' ready)</button>' : '<div class="card main"><b>No draft picks yet</b><p class="sub">Pass a level in regular practice to earn a current-player pick. Get 9 of 10 right in a smart session to earn an all-time legend pick.</p></div>') +
      (hist ? '<h2>Recent picks</h2><div class="card"><ul class="weak">' + hist + '</ul></div>' : '') +
      '<p class="sub mute">Player ratings are made up for this game. Teams are as of the 2025-26 season.</p>');
  }

  /* ---------------- collection: every player he has drafted ---------------- */
  const gs = { id: null };
  let cv = { pool: 'cur', pos: 'all' };
  function collection() {
    U.stop();
    const d = D(), list = PP.NHL[cv.pool].slice().sort((a, b) => b.r - a.r);
    const have = list.filter(p => d.fan.owned[p.id]).length;
    const shown = list.filter(p => cv.pos === 'all' || p.pos === cv.pos);
    const tabs = '<div class="tabs">' + ['cur', 'all'].map(p => '<button class="tab' + (cv.pool === p ? ' on' : '') + '" data-a="colPool" data-v="' + p + '">' + PP.POOL_ICON[p] + ' ' + PP.POOL_NAME[p] + '</button>').join('') + '</div>';
    const chips = '<div class="chips2">' + ['all', 'C', 'LW', 'RW', 'D', 'G'].map(x => '<button class="chip' + (cv.pos === x ? ' on' : '') + '" data-a="colPos" data-v="' + x + '">' + (x === 'all' ? 'All' : x) + '</button>').join('') + '</div>';
    const cells = shown.map(p => {
      if (d.fan.owned[p.id]) return '<div class="cc"><button class="pickc" data-a="player" data-v="' + p.id + '">' + card(p, true) + '</button>' + (PP.fan.onTeam(cv.pool, p.id) ? '<small class="good">On my team</small>' : '<small class="mute">Tap to dress him</small>') + '</div>';
      return '<div class="cc"><div class="pc mini locked t-' + PP.tier(p.r) + '"><span class="q">❔</span><b>???</b><span class="pos">' + p.pos + '</span><small>' + PP.TIER_NAME[PP.tier(p.r)] + '</small></div><small class="mute">Not collected</small></div>';
    }).join('');
    set('<div class="top"><button class="ghost" data-a="fantasy">My team</button><span class="mute">📇 Collection</span></div><h1>Player collection</h1>' + tabs +
      '<div class="card"><div class="lvh"><b>Collected</b><span>' + have + ' of ' + list.length + '</span></div>' + U.bar(have / list.length * 100) + '<small class="mute">Draft players to fill the collection. Every player you draft stays here, even if you later swap him off your team.</small></div>' + chips + '<div class="cgrid">' + cells + '</div>');
  }

  /* ---------------- dress a player: pick his jersey and stick ---------------- */
  function player(id) {
    U.stop();
    const p = PP.NHL_BY_ID[id]; if (!p || !D().fan.owned[id]) return collection();
    const g = PP.fan.gearOf(id), o = D().jer.owned, so = D().stick.owned;
    const jers = Object.keys(o).filter(k => PP.fan.gearFree('j', k, id) > 0 || g.j === k).sort((a, b) => ((b.split('|')[0] === p.team) - (a.split('|')[0] === p.team)) || a.localeCompare(b));
    const sts = PP.STICKS.filter(t => so[t.id] && (PP.fan.gearFree('s', t.id, id) > 0 || g.s === t.id)).sort((a, b) => ['legend', 'epic', 'rare', 'common'].indexOf(a.tier) - ['legend', 'epic', 'rare', 'common'].indexOf(b.tier));
    const jc = jers.map(k => { const q = k.split('|'); return '<button class="pickc' + (g.j === k ? ' sel' : '') + '" data-a="gearSet" data-v="j|' + k + '">' + jerseyCard({ team: q[0], lv: q[1] }, true) + '<small class="' + (q[0] === p.team ? 'good' : 'mute') + '">' + (g.j === k ? 'Wearing' : q[0] === p.team ? 'His team ✨' : 'Wear') + '</small></button>'; }).join('');
    const sc = sts.map(t => '<button class="pickc' + (g.s === t.id ? ' sel' : '') + '" data-a="gearSet" data-v="s|' + t.id + '">' + stickCard(t, 0, true) + '<small class="' + (g.s === t.id ? 'good' : 'mute') + '">' + (g.s === t.id ? 'Carrying' : 'Use') + '</small></button>').join('');
    set('<div class="top"><button class="ghost" data-a="collection">Collection</button><span class="mute">🎽 Dress up</span></div><h1>' + p.name + '</h1><div class="reveal">' + card(p, false) + '</div>' +
      (PP.fan.teamMatch(id) ? '<p class="sub good">✨ He is wearing his own team\'s jersey!</p>' : '<p class="sub">Tip: a jersey from his own team (' + PP.JTEAMS[p.team] + ') gives him a ✨.</p>') +
      '<h2>Jersey</h2>' + (g.j ? '<button class="ghost wide" data-a="gearSet" data-v="j|">Take his jersey off</button>' : '') + (jers.length ? '<div class="cgrid">' + jc + '</div>' : '<p class="sub">You have no spare jerseys. Score 90% or more on a mock test to win one!</p>') +
      '<h2>Stick</h2>' + (g.s ? '<button class="ghost wide" data-a="gearSet" data-v="s|">Take his stick away</button>' : '') + (sts.length ? '<div class="cgrid">' + sc + '</div>' : '<p class="sub">You have no spare sticks. Get 8 right in a row to win one!</p>'));
  }
  function gearSet(v) {
    const i = v.indexOf('|'), kind = v.slice(0, i), key = v.slice(i + 1), id = gs.id;
    PP.fan.setGear(id, kind, key || null); player(id);
  }

  /* ---------------- draft ---------------- */
  function draft() {
    U.stop();
    const d = D();
    if (!PP.fan.pickCount(fs.pool) && PP.fan.pickCount(fs.pool === 'cur' ? 'all' : 'cur')) fs.pool = fs.pool === 'cur' ? 'all' : 'cur';   // go to the team that has a pick waiting
    const pool = fs.pool, pk = PP.fan.pickCount(pool);
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
    const left = PP.fan.pickCount(pool);
    U.confetti();
    set('<h1>Welcome to the team! 🎉</h1><p class="sub">' + p.name + ' joins ' + esc(PP.fan.team(pool).name) + (tg.slot ? ' as ' + PP.slotName(tg.slot).toLowerCase() : ' in your collection. The lineup spots for his position are full, so swap him in from your lineup') + '.</p><div class="reveal">' + card(p, false) + '</div><div class="menu">' +
      (left ? '<button class="go" data-a="draft">Draft again (' + left + ' left)</button>' : '') + '<button class="ghost wide" data-a="fantasy">See my lineup</button>' + (R ? '<button class="ghost wide" data-a="cont">' + (R.from === 'mock' ? 'Home' : 'Keep practicing') + '</button>' : '<button class="ghost wide" data-a="home">Home</button>') + '</div>');
  }

  /* ---------------- rewards after a session or test ---------------- */
  function toonCard(t, n, mini) {
    return '<div class="pc tc t-' + t.tier + (mini ? ' mini' : '') + '"><div class="temoji" style="background:' + t.color + '">' + t.emoji + '</div><b>' + t.name + '</b><span class="pos">' + t.show + '</span>' + (n > 1 ? '<span class="rt">×' + n + '</span>' : '') + (mini ? '' : '<small>' + PP.TIER_NAME[t.tier] + '</small>') + '</div>';
  }
  function sessionDone() {
    U.stop();
    const r = PP.claimSession();
    R = { from: 'practice' };
    if (r.pick) {
      U.confetti();
      set('<h1>Smart session complete! 🎉</h1><p class="sub">You got ' + r.ok + ' of ' + r.n + ' right. That is 90% or more, so you won an all-time legend pick!</p><div class="menu"><button class="go" data-a="draftAll">🏆 Draft an all-time legend</button><button class="ghost wide" data-a="cont">Keep practicing</button></div>');
    } else {
      set('<h1>Smart session complete!</h1><p class="sub">You got ' + r.ok + ' of ' + r.n + ' right. Get 9 of 10 right to win an all-time legend pick. Try the next 10!</p><div class="menu"><button class="go" data-a="cont">Keep practicing</button><button class="ghost wide" data-a="games">🎮 Play a mini-game</button></div>');
    }
  }
  /* ---------------- how to win rewards ---------------- */
  function rules() {
    U.stop();
    const st = D().streak, S = PP.STREAK;
    const row = (icon, what, how) => '<div class="card"><div class="lvh"><b>' + icon + ' ' + what + '</b></div><p class="sub">' + how + '</p></div>';
    set('<div class="top"><button class="ghost" data-a="home">Home</button><span class="mute">🏅 Rewards</span></div><h1>How to win rewards</h1>' +
      '<div class="card main"><b>🔥 Right in a row now: ' + st.n + '</b><small class="mute">Best so far: ' + st.best + '</small></div>' +
      '<h2>Streaks (any practice or mock test)</h2>' +
      row('🎭', 'Cartoon character', 'Get ' + S.toon + ' answers right in a row.') +
      row('🏒', 'Hockey stick', 'Get ' + S.stick + ' right in a row.') +
      row('🌟', 'Special-edition stick', 'Get ' + S.special + ' right in a row. Then the count starts again from 0.') +
      '<p class="sub mute">A wrong answer starts the count again. An answer after using a hint does not add to the count. In a mock test, your longest run of right answers is checked when you finish, and skipped questions break the run.</p>' +
      '<h2>Levels and tests</h2>' +
      row('🔥', 'Current NHL player', 'Pass a level in regular practice: get at least 8 of your last 10 answers right at that level, with no hints. Then you can draft a current player.') +
      row('👑', 'All-time legend', 'Finish a smart practice session of 10 questions with 9 or more right. Then you can draft an all-time legend.') +
      row('👕', 'Jersey', 'Score 90% or more on a mock test. 90% gives a Home jersey, 95% an Away jersey and 100% a Retro (special edition) jersey.') +
      '<h2>Make your players look great</h2>' +
      '<p class="sub">Open Fantasy teams, then Player collection, and tap a player to give him a jersey and a stick you have won. A jersey from his own team gives him a ✨.</p>' +
      '<div class="menu"><button class="go" data-a="home">Back to practice</button></div>');
  }
  /* ---------------- hockey sticks ---------------- */
  const stickSvg = t => PP.stickSvg(t);
  function stickCard(t, n, mini) {
    return '<div class="pc tc t-' + t.tier + (mini ? ' mini' : '') + '">' + stickSvg(t) + '<b>' + t.name + '</b><span class="pos">' + PP.TIER_NAME[t.tier] + '</span>' + (n > 1 ? '<span class="rt">×' + n + '</span>' : '') + (mini ? '' : '<small>' + t.desc + '</small>') + '</div>';
  }
  U.stickCard = stickCard;
  U.toonCard = toonCard;
  function sticks() {
    U.stop();
    const o = D().stick.owned, have = PP.STICKS.filter(t => o[t.id]).length;
    const cells = PP.STICKS.map(t => o[t.id] ? '<div class="cc">' + stickCard(t, o[t.id], true) + '</div>' : '<div class="cc"><div class="pc locked tc mini"><div class="temoji" style="background:#9aa3b2">❓</div><b>???</b><span class="pos">' + PP.TIER_NAME[t.tier] + '</span></div></div>').join('');
    set('<div class="top"><button class="ghost" data-a="home">Home</button><span class="mute">🏒 Sticks</span></div><h1>Hockey stick collection</h1>' +
      '<div class="card"><div class="lvh"><b>Collected</b><span>' + have + ' of ' + PP.STICKS.length + '</span></div>' + U.bar(have / PP.STICKS.length * 100) + '<small class="mute">Get ' + PP.STREAK.stick + ' right in a row to win a stick. Get ' + PP.STREAK.special + ' in a row for a special edition!</small></div><div class="cgrid">' + cells + '</div>');
  }
  const tv = { show: 'all' };
  function toons() {
    U.stop();
    const o = D().toon.owned, cnt = {}; PP.TOONS.forEach(t => { cnt[t.show] = (cnt[t.show] || 0) + 1; });
    const big = s => cnt[s] >= 4, shows = ['all'].concat(Object.keys(cnt).filter(big), ['other']);
    const list = PP.TOONS.filter(t => tv.show === 'all' || (tv.show === 'other' ? !big(t.show) : t.show === tv.show)), have = PP.TOONS.filter(t => o[t.id]).length;
    const chips = '<div class="chips">' + shows.map(s => '<button class="chip' + (tv.show === s ? ' on' : '') + '" data-a="toonShow" data-v="' + s + '">' + (s === 'all' ? 'All' : s === 'other' ? 'Other shows' : s) + '</button>').join('') + '</div>';
    const cells = list.map(t => o[t.id] ? '<div class="cc">' + toonCard(t, o[t.id], true) + '</div>' : '<div class="cc"><div class="pc locked tc mini"><div class="temoji" style="background:#9aa3b2">❓</div><b>???</b><span class="pos">' + t.show + '</span></div></div>').join('');
    set('<div class="top"><button class="ghost" data-a="home">Home</button><span class="mute">🎭 Cartoons</span></div><h1>Cartoon collection</h1>' +
      '<div class="card"><div class="lvh"><b>Collected</b><span>' + have + ' of ' + PP.TOONS.length + '</span></div>' + U.bar(have / PP.TOONS.length * 100) + '<small class="mute">Get 5 right in a row, in any practice or test, to win a character.</small></div>' + chips + '<div class="cgrid">' + cells + '</div>');
  }
  function rewardsFromMock() { U.home(); }
  function rewards() { U.home(); }
  function cont() {
    const P = U.getP();
    if (R && R.from === 'practice' && P && P.mode) { P.fromMiss = null; P.fixLv = null; return P.mode === 'practice' ? U.nextPractice() : U.nextFocus(); }
    U.home();
  }

  /* ---------------- mini-games ---------------- */
  function games() {
    U.stop();
    if (!R) R = { from: 'home', info: { picks: 0, n: 0, ok: 0 }, bonus: false };
    set('<div class="top"><button class="ghost" data-a="rewardsBack">Back</button></div><h1>🎮 Mini-games</h1><p class="sub">' + 'Just for fun. Have a go!' + '</p><div class="menu"><button class="go" data-a="shootout">🥅 Penalty shootout<small>Score 3 of 5 goals</small></button><button class="go" data-a="memory">🧠 Memory match<small>Finish in 12 moves or fewer</small></button></div>');
  }
  function gameEnd(win, title, text) {
        if (win) U.confetti();
    const pk = D().fan.picks.length;
    set('<h1>' + title + '</h1><p class="sub">' + text + '</p>' + '' +
      '<div class="menu"><button class="go" data-a="games">Play another game</button><button class="ghost wide" data-a="cont">' + (R && R.from === 'practice' ? 'Keep practicing' : 'Home') + '</button></div>');
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
      if (SO.i >= 5) { const w = SO.goals >= 3; gameEnd(w, w ? 'You win! 🏆' : 'Good effort!', 'You scored ' + SO.goals + ' of 5 goals.' + (w ? '' : ' Try again!')); }
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
        if (MM.done.length === 12) setTimeout(() => { const w = MM.moves <= 12; gameEnd(w, w ? 'Perfect memory! 🏆' : 'All pairs found!', 'You finished in ' + MM.moves + ' moves.' + (w ? '' : '')); }, 500);
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
    player: v => { gs.id = v; player(v); }, gearSet, collection, colPool: v => { cv.pool = v; collection(); }, colPos: v => { cv.pos = v; collection(); },
    fantasy, fantasyHome: () => { R = null; ed = null; fantasy(); }, draft, draftPick, fanPool: v => { fs.pool = v; ed = null; fantasy(); },
    slotPick: v => { ed = ed === v ? null : v; fantasy(); const el = document.getElementById('picker'); if (el) el.scrollIntoView({ block: 'center' }); },
    slotSet: id => { if (ed) PP.fan.place(fs.pool, ed, id); ed = null; fantasy(); },
    slotClear: () => { if (ed) PP.fan.clear(fs.pool, ed); ed = null; fantasy(); }, slotClose: () => { ed = null; fantasy(); }, draftPool: v => { fs.pool = v; draft(); },
    backup, bkCopy, bkFile, bkRestore, sessionDone, jerseys, jerLv: v => { jv.lv = v; jerseys(); }, toons, sticks, rules, draftCur: () => { fs.pool = 'cur'; draft(); }, draftAll: () => { fs.pool = 'all'; draft(); }, toonShow: v => { tv.show = v; toons(); }, rewards: v => rewardsFromMock(), cont, games, rewardsBack: () => (R ? rewards() : U.home()),
    shootout, shoot, memory, memFlip,
    mistakes, missFilter: v => { mv.f = v; mv.page = 0; mv.open = null; mistakes(); }, missSec: v => { mv.sec = v; mv.page = 0; mv.open = null; mistakes(); },
    missPage: v => { mv.page += +v; mv.open = null; mistakes(); }, missOpen: v => { mv.open = mv.open === v ? null : v; mistakes(); },
    missSet: v => { if (mv.open) { PP.setUnderstood(mv.open, v === '1'); if (v === '1') U.confetti(); mistakes(); } },
    missTry, missUnderstood
  });
  PP._mm = () => MM; PP._so = () => SO;
  document.getElementById('app').addEventListener('input', e => { if (e.target.id === 'tname') PP.fan.setName(fs.pool, e.target.value); });
})();
