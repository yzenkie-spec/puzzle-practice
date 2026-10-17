/* App state and rules: level tracker, adaptive question picker, mock tests, focus practice, time log.
   Everything is saved in this browser only. */
(function () {
  const PP = window.PP;
  const KEY = 'pp3', OLD = 'pp2';
  const NEED = 10;          // correct answers to pass a level
  const FOCUS_NEED = 5;     // correct answers to clear a focus section
  const PER_LEVEL = { e: 5, a: 5, c: 5 };   // mock part: 15 questions, easy -> challenging
  const MOCK_SECONDS = 600; // 10 minutes per part, as in the published CCAT structure
  const DAILY_GOAL = 20 * 60;
  PP.NEED = NEED; PP.FOCUS_NEED = FOCUS_NEED; PP.MOCK_SECONDS = MOCK_SECONDS; PP.PER_LEVEL = PER_LEVEL; PP.DAILY_GOAL = DAILY_GOAL;

  const freshTeam = name => ({ name, slots: {} });
  const fresh = () => ({ v: 3, sec: {}, used: {}, tag: {}, log: [], time: {}, tests: [], cur: null, focus: null, days: [], stars: 0, tid: 1,
    miss: {}, ask: {}, sess: { n: 0, ok: 0 }, toon: { owned: {}, hist: [] }, jer: { owned: {} }, fan: { picks: [], owned: {}, offer: {}, teams: { cur: freshTeam('My Current Stars'), all: freshTeam('My All-Time Legends') }, hist: [] } });
  let D = fresh();
  try {
    const r = JSON.parse(localStorage.getItem(KEY));
    if (r && r.v === 3) D = Object.assign(fresh(), r);
    else {
      const o = JSON.parse(localStorage.getItem(OLD));
      if (o && o.v === 2) {   // keep level progress from the first version; old mock tests used a different question bank
        D.stars = o.stars || 0; D.days = o.days || []; D.tid = (o.tid || 1);
        Object.keys(o.sec || {}).forEach(c => { D.sec[c] = {}; PP.LEVELS.forEach(l => { const x = (o.sec[c] || {})[l] || {}; D.sec[c][l] = { c: x.c || 0, w: x.w || 0 }; }); });
      }
    }
  } catch (e) {}
  if (D.cur) D.cur.subs.forEach(s => { s.end = 0; });
  if (!D.ask) D.ask = {};
  if (!D.jer) D.jer = { owned: {} };
  if (!D.toon) D.toon = { owned: {}, hist: [] };
  ['cur', 'all'].forEach(p => {   // team spots: 3 lines + goalie (older saves had 6 spots)
    const t = D.fan.teams[p], old = t.slots, ns = {};
    PP.SLOTS.forEach(k => { ns[k] = null; });
    const map = { LW: 'LW1', C: 'C1', RW: 'RW1', D1: 'D1a', D2: 'D1b', G: 'G' };
    Object.keys(old).forEach(k => { if (old[k]) ns[map[k] || k] = old[k]; });
    t.slots = ns;
    Object.keys(ns).forEach(k => { if (ns[k]) D.fan.owned[ns[k]] = 1; });   // anyone in a lineup is collected
  });
  if (!D.fan.owned) {   // everyone drafted so far belongs in the collection
    D.fan.owned = {};
    ['cur', 'all'].forEach(p => Object.keys(D.fan.teams[p].slots).forEach(k => { if (D.fan.teams[p].slots[k]) D.fan.owned[D.fan.teams[p].slots[k]] = 1; }));
    (D.fan.hist || []).forEach(h => { D.fan.owned[h.id] = 1; if (h.old) D.fan.owned[h.old] = 1; });
  }
  PP.D = () => D;
  PP.save = () => { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} };
  PP.reset = () => { D = fresh(); PP.save(); };

  const blank = () => ({ e: { c: 0, w: 0 }, a: { c: 0, w: 0 }, c: { c: 0, w: 0 } });
  PP.S = code => D.sec[code] || (D.sec[code] = blank());
  PP.passed = (code, lv) => PP.S(code)[lv].c >= NEED;
  PP.unlocked = (code, lv) => lv === 'e' || (lv === 'a' && PP.passed(code, 'e')) || (lv === 'c' && PP.passed(code, 'a'));
  PP.curLevel = code => PP.LEVELS.find(l => !PP.passed(code, l)) || 'c';
  PP.allDone = code => PP.LEVELS.every(l => PP.passed(code, l));

  /* ---------- dates and time ---------- */
  const dkey = d => (d || new Date()).toLocaleDateString('en-CA');
  PP.dkey = dkey;
  PP.streak = function () {
    let n = 0; const d = new Date();
    const has = x => D.days.includes(dkey(x));
    if (!has(d)) d.setDate(d.getDate() - 1);
    while (has(d)) { n++; d.setDate(d.getDate() - 1); }
    return n;
  };
  PP.markDay = () => { const t = dkey(); if (!D.days.includes(t)) D.days.push(t); };
  PP.addTime = sec => { const t = dkey(); D.time[t] = (D.time[t] || 0) + sec; };
  PP.timeOn = key => D.time[key] || 0;

  /* ---------- what the app has learned ---------- */
  const tkey = (code, tag) => code + '|' + (tag || '-');
  PP.tagStat = (code, tag) => D.tag[tkey(code, tag)];

  /* record one answered question (practice, focus or mock) */
  PP.record = function (q, ok, secs, mode, pick) {
    D.used[q.id] = (D.used[q.id] || 0) + 1;
    const k = tkey(q.sec, q.tag), t = D.tag[k] || (D.tag[k] = { n: 0, c: 0, s: 0.35 });
    t.n++; if (ok) t.c++;
    t.s = t.s * 0.7 + (ok ? 0 : 1) * 0.3;          // recent mistakes count most
    D.log.push([Date.now(), q.sec, q.lv, ok ? 1 : 0, Math.round(secs || 0), mode]);
    if (D.log.length > 6000) D.log.splice(0, D.log.length - 6000);
    if (ok) D.stars++;
    else PP.addMiss(q, pick);
    PP.markDay();
  };
  /* mistakes notebook */
  PP.addMiss = function (q, pick) {
    const m = D.miss[q.id] || (D.miss[q.id] = { n: 0, u: 0 });
    m.n++; m.ts = Date.now(); m.u = 0; m.pick = (pick === undefined ? null : pick);
  };
  PP.setUnderstood = (id, v) => { if (D.miss[id]) { D.miss[id].u = v ? 1 : 0; PP.save(); } };
  PP.missList = function (filter, sec) {
    return Object.keys(D.miss).map(id => ({ id, m: D.miss[id] }))
      .filter(x => (sec === 'all' || x.id.split('-')[0] === sec) && (filter === 'all' || (filter === 'open' ? !x.m.u : !!x.m.u)))
      .sort((a, b) => b.m.ts - a.m.ts);
  };
  PP.missCounts = function () {
    const ids = Object.keys(D.miss), open = ids.filter(i => !D.miss[i].u).length;
    return { all: ids.length, open, done: ids.length - open };
  };
  PP.markUsed = q => { D.used[q.id] = D.used[q.id] || 1; };

  /* recent accuracy for a section (last n answers), or null when there is no data */
  PP.recentAcc = (code, n) => {
    const a = D.log.filter(x => x[1] === code).slice(-(n || 12));
    return a.length >= 3 ? a.filter(x => x[3]).length / a.length : null;
  };

  /* choose a question: never one already used (unless the whole level is used up).
     opts.tag: ask a twin (same type) of a question that was missed.
     opts.tags: question types to favour.  opts.exclude: Set of ids to skip. */
  PP.pickQ = function (code, lv, opts) {
    opts = opts || {};
    const pool = PP.pool(code, lv), ex = opts.exclude;
    const ok = q => !ex || !ex.has(q.id);
    let cand = pool.filter(q => !D.used[q.id] && ok(q)), repeat = false;
    if (!cand.length) {
      repeat = true;
      const rest = pool.filter(ok);
      const min = Math.min.apply(null, rest.map(q => D.used[q.id] || 0));
      cand = rest.filter(q => (D.used[q.id] || 0) === min);
    }
    if (!cand.length) return { q: null, repeat: true };
    if (opts.tag) { const c2 = cand.filter(q => q.tag === opts.tag); if (c2.length) cand = c2; }
    const groups = {};
    cand.forEach(q => { (groups[q.tag] = groups[q.tag] || []).push(q); });
    const tags = Object.keys(groups);
    const w = tags.map(t => {
      const st = PP.tagStat(code, t), s = st ? st.s : 0.35;
      return 0.15 + s * 2 + (opts.tags && opts.tags.includes(t) ? 1.5 : 0);
    });
    let x = Math.random() * w.reduce((a, b) => a + b, 0), i = 0;
    while (i < tags.length - 1 && (x -= w[i]) > 0) i++;
    const g = groups[tags[i]];
    return { q: g[Math.floor(Math.random() * g.length)], repeat };
  };

  /* choose the section for smart practice: weaker and less-practiced sections come up more often */
  PP.smartSection = function (avoid) {
    const w = PP.SECS.map(s => {
      const acc = PP.recentAcc(s.code, 10);
      let v = 1 + (acc === null ? 1.2 : (1 - acc) * 3);
      if (PP.allDone(s.code)) v *= 0.4;
      if (s.code === avoid) v *= 0.15;
      return v;
    });
    let x = Math.random() * w.reduce((a, b) => a + b, 0), i = 0;
    while (i < w.length - 1 && (x -= w[i]) > 0) i++;
    return PP.SECS[i].code;
  };

  /* ---------- practice ---------- */
  PP.nextQ = (code, lv, opts) => PP.pickQ(code, lv, opts);
  /* staircase: a right answer moves the next question of this puzzle type one level harder,
     a wrong answer moves it one level easier (never below the level still being passed) */
  PP.askLevel = function (code) {
    const base = PP.LEVELS.indexOf(PP.curLevel(code)), a = D.ask[code];
    return PP.LEVELS[Math.max(base, a === undefined ? base : a)];
  };
  PP.answerPractice = function (q, pick, secs, smart) {
    const ok = pick === q.ans, qi = PP.LEVELS.indexOf(q.lv);
    const before = PP.LEVELS.filter(l => PP.passed(q.sec, l));
    // a right answer counts for its own level and for every easier level too
    if (ok) PP.LEVELS.forEach((l, i) => { if (i <= qi) PP.S(q.sec)[l].c++; }); else PP.S(q.sec)[q.lv].w++;
    D.ask[q.sec] = Math.max(0, Math.min(2, qi + (ok ? 1 : -1)));
    const newly = PP.LEVELS.filter(l => PP.passed(q.sec, l) && !before.includes(l));
    PP.record(q, ok, secs, 'p', pick);
    PP.addTime(Math.min(secs || 0, 120));
    const sessionDone = smart ? PP.sessionAdd(ok) : false;   // only smart practice counts toward a cartoon character
    let jersey = null;   // every level passed (regular or smart) = 1 team jersey; easy = home, average = away, challenging = retro
    if (newly.length) jersey = PP.winJersey(newly[newly.length - 1]);
    const pickWon = !smart && newly.length > 0;               // regular practice: each level passed = 1 draft pick
    if (pickWon) PP.addPicks(1, 0);
    PP.save();
    return { ok, levelPassed: newly.length > 0, passedLv: newly[newly.length - 1], sessionDone, pickWon, jersey };
  };

  /* ---------- focus practice ---------- */
  PP.focusLeft = () => D.focus ? Object.keys(D.focus.needs).filter(c => D.focus.needs[c].got < FOCUS_NEED) : [];
  PP.nextFocusQ = function (code, twin) {
    const n = D.focus.needs[code];
    return PP.pickQ(code, n.lv, { tag: twin, tags: n.tags });
  };
  PP.answerFocus = function (q, pick, secs) {
    const ok = pick === q.ans, n = D.focus.needs[q.sec];
    if (ok) n.got++;
    PP.record(q, ok, secs, 'f', pick);
    PP.addTime(Math.min(secs || 0, 120));
    const sessionDone = false;
    const cleared = ok && n.got >= FOCUS_NEED;
    const allCleared = cleared && PP.focusLeft().length === 0;
    if (allCleared) D.focus = null;
    PP.save();
    return { ok, cleared, allCleared, sessionDone };
  };

  /* ---------- mock test ---------- */
  const shuf = a => PP.shuffle(Math.random, a);
  PP.startMock = function () {
    const last = D.tests[0];
    const subs = PP.SECS.map(sec => {
      const ids = [], fu = [], taken = new Set();
      const lastSub = last && last.subs.find(s => s.code === sec.code);
      PP.LEVELS.forEach(lv => {
        const need = PER_LEVEL[lv], block = [];
        // check-up questions: new questions of the same type as the ones missed in the last mock test
        (lastSub ? lastSub.items.filter(x => !x.ok && x.lv === lv) : []).slice(0, need).forEach(x => {
          const r = PP.pickQ(sec.code, lv, { tag: x.tag, exclude: taken });
          if (r.q && !r.repeat) { taken.add(r.q.id); block.push({ id: r.q.id, fu: 1 }); }
        });
        while (block.length < need) {
          const r = PP.pickQ(sec.code, lv, { exclude: taken });
          if (!r.q) break;
          taken.add(r.q.id); block.push({ id: r.q.id, fu: 0 });
        }
        shuf(block).forEach(b => { ids.push(b.id); fu.push(b.fu); });
      });
      return { code: sec.code, ids, fu, picks: ids.map(() => null), left: MOCK_SECONDS, done: false, started: false };
    });
    D.cur = { id: D.tid++, date: new Date().toISOString(), si: 0, subs };
    PP.save();
  };
  PP.mockAnswered = c => c.subs.reduce((n, s) => n + s.picks.filter(x => x !== null).length, 0);
  PP.mockTotal = c => c.subs.reduce((n, s) => n + s.ids.length, 0);

  PP.finishMock = function () {
    const c = D.cur;
    const test = { id: c.id, date: c.date, subs: [] };
    const bad = {};
    c.subs.forEach(s => {
      const items = s.ids.map((id, i) => {
        const q = PP.get(id), pick = s.picks[i], ok = pick === q.ans;
        if (pick === null) { PP.markUsed(q); PP.addMiss(q, null); } else PP.record(q, ok, 0, 'm', pick);
        return { id, lv: q.lv, tag: q.tag, pick, ok, fu: s.fu ? s.fu[i] : 0 };
      });
      test.subs.push({ code: s.code, items, score: items.filter(x => x.ok).length });
      const wrong = items.filter(x => !x.ok);
      if (wrong.length) bad[s.code] = wrong;
    });
    D.tests.unshift(test);
    D.cur = null;
    const needs = {};
    Object.keys(bad).forEach(code => {
      const cnt = { e: 0, a: 0, c: 0 };
      bad[code].forEach(x => cnt[x.lv]++);
      const lv = PP.LEVELS.slice().sort((x, y) => (cnt[y] - cnt[x]) || (PP.LEVELS.indexOf(x) - PP.LEVELS.indexOf(y)))[0];
      needs[code] = { lv, got: 0, tags: bad[code].filter(x => x.lv === lv).map(x => x.tag) };
    });
    D.focus = Object.keys(needs).length ? { testId: test.id, needs } : null;
    PP.markDay(); PP.save();
    return test;
  };

  PP.testTotal = t => t.subs.reduce((s, x) => s + x.score, 0);
  PP.testCount = t => t.subs.reduce((s, x) => s + x.items.length, 0);

  /* ---------- sessions, rewards and the fantasy draft ---------- */
  const SESSION = 10;
  PP.SESSION = SESSION;
  PP.sessionAdd = ok => { D.sess.n++; if (ok) D.sess.ok++; return D.sess.n >= SESSION; };
  PP.addPicks = function (count, q) { for (let i = 0; i < count; i++) D.fan.picks.push(q || 0); PP.save(); };
  PP.winJersey = function (lv) {
    const codes = Object.keys(PP.JTEAMS), fresh = codes.filter(c => !D.jer.owned[c + '|' + lv]);
    const list = fresh.length ? fresh : codes, team = list[Math.floor(Math.random() * list.length)], key = team + '|' + lv;
    const dup = !!D.jer.owned[key];
    D.jer.owned[key] = (D.jer.owned[key] || 0) + 1;
    return { team, lv, key, dup };
  };
  /* smart practice: every 10 questions, 80% or more right = 1 cartoon character */
  const TBASE = { common: 1, rare: 0.6, epic: 0.3, legend: 0.12 };
  PP.claimSession = function () {
    const n = D.sess.n, ok = D.sess.ok, acc = n ? ok / n : 0;
    D.sess = { n: 0, ok: 0 };
    let toon = null, dup = false;
    if (acc >= 0.8) {
      const boost = acc >= 1 ? 3 : acc >= 0.9 ? 1.8 : 1;
      const w = t => TBASE[t.tier] * (t.tier === 'common' ? 1 : boost) * (D.toon.owned[t.id] ? 0.25 : 1);
      const list = PP.TOONS, tot = list.reduce((s, t) => s + w(t), 0);
      let r = Math.random() * tot;
      toon = list[list.length - 1];
      for (const t of list) { r -= w(t); if (r <= 0) { toon = t; break; } }
      dup = !!D.toon.owned[toon.id];
      D.toon.owned[toon.id] = (D.toon.owned[toon.id] || 0) + 1;
      D.toon.hist.unshift({ id: toon.id, t: Date.now() }); D.toon.hist = D.toon.hist.slice(0, 20);
    }
    PP.save();
    return { n, ok, acc, toon, dup };
  };
  /* mock test: 90% or more = 1 draft pick */
  PP.mockReward = function (test) {
    const pct = PP.testTotal(test) / PP.testCount(test);
    const picks = pct >= 0.9 ? 1 : 0;
    test.rw = picks; if (picks) PP.addPicks(picks, 2);
    return { picks, q: 2 };
  };
  const BASE = { common: 1, rare: 0.6, epic: 0.3, legend: 0.12 };
  const BOOST = [{ common: 1, rare: 1, epic: 1, legend: 1 }, { common: 1, rare: 1.5, epic: 2, legend: 3 }, { common: 1, rare: 2.5, epic: 4, legend: 7 }];
  const slotsFor = pos => PP.SLOTS.filter(s => PP.SLOT_POS[s] === pos);
  const team = pool => D.fan.teams[pool];
  PP.fan = {
    team,
    owned: id => !!D.fan.owned[id],
    placedAt: (pool, id) => PP.SLOTS.find(s => team(pool).slots[s] === id) || null,
    onTeam: (pool, id) => !!PP.fan.placedAt(pool, id),
    eligible: (pool, p) => !D.fan.owned[p.id],     // any player not collected yet can be drafted
    nextSlot: (pool, pos) => slotsFor(pos).find(s => !team(pool).slots[s]) || null,
    offer(pool) {   // three players to choose from, saved so a reload gives the same choices
      if (!D.fan.picks.length) return null;
      const saved = D.fan.offer[pool];
      if (saved && saved.length && saved.every(id => PP.fan.eligible(pool, PP.NHL_BY_ID[id]))) return saved.map(id => PP.NHL_BY_ID[id]);
      const q = D.fan.picks[0];
      const need = {};   // positions that still have empty lineup spots
      PP.SLOTS.forEach(s => { if (!team(pool).slots[s]) need[PP.SLOT_POS[s]] = 1; });
      let cand = PP.NHL[pool].filter(p => PP.fan.eligible(pool, p));
      const out = [];
      while (out.length < 3 && cand.length) {
        const w = cand.map(p => { const tr = PP.tier(p.r); return BASE[tr] * BOOST[q][tr] * (need[p.pos] ? 1.6 : 1); });
        let x = Math.random() * w.reduce((a, b) => a + b, 0), i = 0;
        while (i < cand.length - 1 && (x -= w[i]) > 0) i++;
        out.push(cand[i]); cand = cand.filter((_, j) => j !== i);
      }
      D.fan.offer[pool] = out.map(p => p.id); PP.save();
      return out;
    },
    /* draft = add to the collection, and put him in the first empty spot for his position */
    draft(pool, id) {
      const p = PP.NHL_BY_ID[id];
      if (!D.fan.picks.length || !PP.fan.eligible(pool, p)) return null;
      D.fan.owned[p.id] = 1;
      const slot = PP.fan.nextSlot(pool, p.pos);
      if (slot) team(pool).slots[slot] = p.id;
      D.fan.picks.shift(); D.fan.offer = {};
      D.fan.hist.unshift({ pool, id: p.id, old: null, ts: Date.now() });
      D.fan.hist = D.fan.hist.slice(0, 40);
      PP.save();
      return { slot };
    },
    /* put a collected player in a spot; if he is already in another spot the two players swap */
    place(pool, slot, id) {
      const p = PP.NHL_BY_ID[id];
      if (!p || !D.fan.owned[id] || p.pool !== pool || PP.SLOT_POS[slot] !== p.pos) return false;
      const sl = team(pool).slots, here = sl[slot], from = PP.fan.placedAt(pool, id);
      if (from) sl[from] = here || null;
      sl[slot] = id; PP.save();
      return true;
    },
    clear(pool, slot) { team(pool).slots[slot] = null; PP.save(); },
    rating(pool) {
      const ids = PP.SLOTS.map(s => team(pool).slots[s]).filter(Boolean);
      return { n: ids.length, avg: ids.length ? Math.round(ids.reduce((a, id) => a + PP.NHL_BY_ID[id].r, 0) / ids.length) : 0 };
    },
    complete: pool => PP.NHL[pool].every(p => D.fan.owned[p.id]),
    setName(pool, name) { team(pool).name = String(name).slice(0, 24); PP.save(); }
  };

  /* ---------- numbers for the tracker ---------- */
  PP.totals = function () {
    const a = D.log, ok = a.filter(x => x[3]).length;
    const time = Object.keys(D.time).reduce((s, k) => s + D.time[k], 0);
    const bank = PP.SECS.reduce((s, x) => s + PP.LEVELS.reduce((t, l) => t + PP.poolSize(x.code, l), 0), 0);
    return { n: a.length, ok, time, bank, used: Object.keys(D.used).length };
  };
  PP.dayStats = function (key) {
    const a = D.log.filter(x => dkey(new Date(x[0])) === key), ok = a.filter(x => x[3]).length;
    return { n: a.length, ok, time: D.time[key] || 0 };
  };
  PP.secStats = function (code) {
    const a = D.log.filter(x => x[1] === code), ok = a.filter(x => x[3]).length, r = a.slice(-20);
    return { n: a.length, ok, recent: r.length ? r.filter(x => x[3]).length / r.length : null };
  };
  PP.weakSpots = function () {
    return Object.keys(D.tag).map(k => ({ k, code: k.split('|')[0], tag: k.slice(k.indexOf('|') + 1), st: D.tag[k] }))
      .filter(x => x.st.n >= 3 && x.st.s >= 0.3)
      .sort((x, y) => y.st.s - x.st.s).slice(0, 5);
  };
})();
