/* App state and rules: level tracker, mock tests, focus practice. Saved in this browser only. */
(function () {
  const PP = window.PP;
  const KEY = 'pp2';
  const NEED = 10;          // correct answers to pass a level
  const FOCUS_NEED = 5;     // correct answers to clear a focus section
  const PER_LEVEL = { e: 5, a: 5, c: 5 };   // mock subtest: 15 questions, easy -> challenging
  const MOCK_SECONDS = 600; // 10 minutes per subtest, as in the published CCAT test structure
  PP.NEED = NEED; PP.FOCUS_NEED = FOCUS_NEED; PP.MOCK_SECONDS = MOCK_SECONDS; PP.PER_LEVEL = PP.PER_LEVEL || PER_LEVEL;

  const fresh = () => ({ v: 2, sec: {}, tests: [], cur: null, focus: null, days: [], stars: 0, tid: 1 });
  let D = fresh();
  try { const r = JSON.parse(localStorage.getItem(KEY)); if (r && r.v === 2) D = r; } catch (e) {}
  PP.D = () => D;
  PP.save = () => { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} };
  PP.reset = () => { D = fresh(); PP.save(); };

  const blank = () => ({ e: { c: 0, w: 0, seen: [] }, a: { c: 0, w: 0, seen: [] }, c: { c: 0, w: 0, seen: [] } });
  PP.S = code => D.sec[code] || (D.sec[code] = blank());
  PP.passed = (code, lv) => PP.S(code)[lv].c >= NEED;
  PP.unlocked = (code, lv) => lv === 'e' || (lv === 'a' && PP.passed(code, 'e')) || (lv === 'c' && PP.passed(code, 'a'));
  PP.curLevel = code => PP.LEVELS.find(l => !PP.passed(code, l)) || 'c';
  PP.allDone = code => PP.LEVELS.every(l => PP.passed(code, l));

  const today = () => new Date().toLocaleDateString('en-CA');
  PP.streak = function () {
    let n = 0; const d = new Date();
    const has = x => D.days.includes(x.toLocaleDateString('en-CA'));
    if (!has(d)) d.setDate(d.getDate() - 1);
    while (has(d)) { n++; d.setDate(d.getDate() - 1); }
    return n;
  };
  PP.markDay = () => { const t = today(); if (!D.days.includes(t)) D.days.push(t); };

  /* choose a question not asked recently */
  PP.nextQ = function (code, lv) {
    const pool = PP.pool(code, lv), st = PP.S(code)[lv];
    let cand = pool.filter(q => !st.seen.includes(q.id));
    if (!cand.length) { st.seen = []; cand = pool; }
    const q = cand[Math.floor(Math.random() * cand.length)];
    st.seen.push(q.id);
    return q;
  };

  /* record a practice answer; returns {ok, levelPassed} */
  PP.answerPractice = function (q, pick) {
    const ok = pick === q.ans, st = PP.S(q.sec)[q.lv];
    const before = st.c >= NEED;
    if (ok) { st.c++; D.stars++; } else st.w++;
    PP.markDay(); PP.save();
    return { ok, levelPassed: !before && st.c >= NEED };
  };

  /* ---------- focus practice ---------- */
  PP.focusLeft = () => D.focus ? Object.keys(D.focus.needs).filter(c => D.focus.needs[c].got < FOCUS_NEED) : [];
  PP.nextFocusQ = function (code) {
    const n = D.focus.needs[code];
    const pool = PP.pool(code, n.lv);
    n.seen = n.seen || [];
    let cand = pool.filter(q => !n.seen.includes(q.id));
    if (!cand.length) { n.seen = []; cand = pool; }
    const q = cand[Math.floor(Math.random() * cand.length)];
    n.seen.push(q.id);
    return q;
  };
  PP.answerFocus = function (q, pick) {
    const ok = pick === q.ans, n = D.focus.needs[q.sec];
    if (ok) { n.got++; D.stars++; }
    PP.markDay(); PP.save();
    const cleared = ok && n.got >= FOCUS_NEED;
    const allCleared = cleared && PP.focusLeft().length === 0;
    if (allCleared) D.focus = null;
    PP.save();
    return { ok, cleared, allCleared };
  };

  /* ---------- mock test ---------- */
  PP.startMock = function () {
    const used = new Set();
    D.tests.forEach(t => t.subs.forEach(s => s.items.forEach(it => used.add(it.id))));
    const subs = PP.SECS.map(sec => {
      const ids = [];
      PP.LEVELS.forEach(lv => {
        const pool = PP.pool(sec.code, lv);
        let fresh = pool.filter(q => !used.has(q.id)), need = PP.PER_LEVEL[lv];
        let pick = PP.shuffle(Math.random, fresh).slice(0, need);
        if (pick.length < need) pick = pick.concat(PP.shuffle(Math.random, pool.filter(q => !pick.includes(q))).slice(0, need - pick.length));
        pick.forEach(q => ids.push(q.id));
      });
      return { code: sec.code, ids, picks: ids.map(() => null), left: MOCK_SECONDS, done: false };
    });
    D.cur = { id: D.tid++, date: new Date().toISOString(), si: 0, subs };
    PP.save();
  };

  PP.finishMock = function () {
    const c = D.cur;
    const test = { id: c.id, date: c.date, subs: [] };
    const bad = {};
    c.subs.forEach(s => {
      const items = s.ids.map((id, i) => ({ id, lv: id.split('-')[1], pick: s.picks[i], ok: s.picks[i] === PP.get(id).ans }));
      test.subs.push({ code: s.code, items, score: items.filter(x => x.ok).length });
      const wrong = items.filter(x => !x.ok);
      if (wrong.length) bad[s.code] = wrong.map(x => x.lv);
    });
    D.tests.unshift(test);
    D.cur = null;
    const needs = {};
    Object.keys(bad).forEach(code => {
      const cnt = { e: 0, a: 0, c: 0 };
      bad[code].forEach(l => cnt[l]++);
      const lv = PP.LEVELS.slice().sort((x, y) => (cnt[y] - cnt[x]) || (PP.LEVELS.indexOf(x) - PP.LEVELS.indexOf(y)))[0];
      needs[code] = { lv, got: 0, seen: [] };
    });
    D.focus = Object.keys(needs).length ? { testId: test.id, needs } : null;
    PP.markDay(); PP.save();
    return test;
  };

  PP.testTotal = t => t.subs.reduce((s, x) => s + x.score, 0);
  PP.testCount = t => t.subs.reduce((s, x) => s + x.items.length, 0);
})();
