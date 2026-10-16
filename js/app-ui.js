/* App screens. */
(function () {
  const PP = window.PP, app = document.getElementById('app'), LN = PP.LEVEL_NAME;
  let P = null, tm = null, qi = 0, sure = false, rv = null, resetArm = false;
  const D = () => PP.D();
  const pc = (a, b) => (b ? Math.round(a / b * 100) : 0);
  const set = h => { app.innerHTML = h; window.scrollTo(0, 0); };
  const stop = () => { if (tm) { clearInterval(tm); tm = null; } };
  const secName = c => PP.sec(c).name;
  const lvl = id => id.split('-')[1];
  const fmt = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  const bar = p => '<div class="bar"><i style="width:' + Math.max(0, Math.min(100, p)) + '%"></i></div>';

  function optsHTML(q, sel, marks) {
    const opts = q.opts.map((o, i) => {
      let cls = 'opt';
      if (marks) { if (i === q.ans) cls += ' ok'; else if (i === sel) cls += ' no'; }
      else if (i === sel) cls += ' sel';
      return '<button class="' + cls + '"' + (marks ? ' disabled' : '') + ' data-a="pick" data-v="' + i + '" aria-label="Answer ' + PP.LETTERS[i] + '"><span class="ltr">' + PP.LETTERS[i] + '</span>' + o + '</button>';
    }).join('');
    return '<div class="opts' + (q.svgOpts ? ' sv' : '') + '" id="opts">' + opts + '</div>';
  }
  const qHTML = (q, sel, marks) => '<div class="card">' + q.stem + '</div>' + optsHTML(q, sel, marks);

  /* ---------------- Home ---------------- */
  function home() {
    stop(); P = null; if (D().cur) PP.save();
    const d = D(), k = PP.streak();
    let h = '<h1>Puzzle Practice</h1><p class="sub">Practice each puzzle type, then try a mock test.</p>' +
      '<div class="badges"><span>' + (k ? '🔥 ' + k + '-day streak' : '🔥 Start a streak today') + '</span><span>⭐ ' + d.stars + ' stars</span></div>';
    if (d.cur) {
      h += '<div class="card main"><b>Mock test in progress</b><p class="sub">Part ' + (d.cur.si + 1) + ' of 9: ' + secName(d.cur.subs[d.cur.si].code) + '</p><button class="go" data-a="mockResume">Continue mock test</button></div>';
    } else if (d.focus) {
      const left = PP.focusLeft();
      h += '<div class="card main"><b>Focus practice comes next</b><p class="sub">You missed questions in ' + Object.keys(d.focus.needs).length + ' puzzle type' + (Object.keys(d.focus.needs).length > 1 ? 's' : '') + '. Finish this practice to unlock the next mock test (' + left.length + ' left).</p><button class="go" data-a="focusStart">Start focus practice</button></div>';
    } else {
      h += '<div class="card main"><b>Mock test</b><p class="sub">9 timed parts, 10 minutes each, easier questions first. You can stop between parts and come back.</p><button class="go" data-a="mockStart">Start a mock test</button></div>';
    }
    PP.BATTERIES.forEach((b, bi) => {
      h += '<h2>' + b + '</h2><div class="tiles">' + PP.SECS.filter(s => s.bat === bi).map(s => {
        const chips = PP.LEVELS.map(l => {
          const st = PP.S(s.code)[l];
          const t = PP.passed(s.code, l) ? '✓' : PP.unlocked(s.code, l) ? st.c + '/' + PP.NEED : '🔒';
          return '<span class="lc ' + (PP.passed(s.code, l) ? 'done' : PP.unlocked(s.code, l) ? 'open' : 'lock') + '">' + LN[l][0] + ' ' + t + '</span>';
        }).join('');
        return '<button class="tile" data-a="sec" data-v="' + s.code + '"><b>' + s.name + '</b><span class="chips">' + chips + '</span></button>';
      }).join('') + '</div>';
    });
    h += '<div class="row"><button class="ghost" data-a="review">Review</button><button class="ghost" data-a="tracker">Tracker</button></div>';
    set(h);
  }

  /* ---------------- Section page ---------------- */
  function secView(code) {
    stop(); P = null;
    const s = PP.sec(code), cur = PP.curLevel(code);
    let h = '<div class="top"><button class="ghost" data-a="home">Home</button></div><h1>' + s.name + '</h1><p class="sub">' + s.how + '</p>';
    PP.LEVELS.forEach(l => {
      const st = PP.S(code)[l], done = PP.passed(code, l), open = PP.unlocked(code, l);
      h += '<div class="card lv"><div class="lvh"><b>' + LN[l] + '</b><span class="' + (done ? 'good' : open ? '' : 'mute') + '">' + (done ? '✓ Passed' : open ? 'In progress' : '🔒 Pass ' + LN[PP.LEVELS[PP.LEVELS.indexOf(l) - 1]] + ' first') + '</span></div>' +
        bar(open ? Math.min(100, st.c / PP.NEED * 100) : 0) +
        '<small class="mute">' + (open ? Math.min(st.c, PP.NEED) + ' of ' + PP.NEED + ' correct to pass' + (st.c + st.w ? ' · ' + st.c + ' right, ' + st.w + ' wrong (' + pc(st.c, st.c + st.w) + '%)' : '') : 'Locked') + '</small></div>';
    });
    h += '<button class="go" data-a="practice" data-v="' + code + '">' + (PP.allDone(code) ? 'Keep practicing: Challenging' : 'Practice: ' + LN[cur] + ' level') + '</button>';
    set(h);
  }

  /* ---------------- Practice and focus questions ---------------- */
  function practice(code) {
    P = { mode: 'practice', code, lv: PP.curLevel(code) };
    P.q = PP.nextQ(code, P.lv); P.done = false; qView();
  }
  function focusStart() {
    const left = PP.focusLeft();
    if (!left.length) return home();
    P = { mode: 'focus', code: left[0] };
    P.q = PP.nextFocusQ(P.code); P.done = false; qView();
  }
  function qView() {
    stop();
    const q = P.q, d = D();
    let top, prog, txt, back;
    if (P.mode === 'focus') {
      const n = d.focus.needs[q.sec];
      top = 'Focus practice · ' + secName(q.sec) + ' · ' + LN[q.lv]; prog = n.got / PP.FOCUS_NEED * 100; txt = n.got + ' of ' + PP.FOCUS_NEED + ' correct in this puzzle type'; back = 'home';
    } else {
      const st = PP.S(q.sec)[q.lv];
      top = secName(q.sec) + ' · ' + LN[q.lv]; prog = st.c / PP.NEED * 100; txt = Math.min(st.c, PP.NEED) + ' of ' + PP.NEED + ' correct to pass this level'; back = 'sec';
    }
    set('<div class="top"><button class="ghost" data-a="' + back + '" data-v="' + q.sec + '">' + (back === 'home' ? 'Home' : 'Back') + '</button><span class="mute">' + top + '</span></div>' + bar(prog) + '<small class="mute">' + txt + '</small>' + qHTML(q, null, false) + '<div id="fb"></div>');
  }
  function pick(i) {
    i = +i;
    if (P && P.mode) {
      if (P.done) return;
      P.done = true;
      const q = P.q, ok = i === q.ans;
      let res, btn = 'Next question', act = 'next';
      if (P.mode === 'practice') {
        res = PP.answerPractice(q, i);
        if (res.levelPassed) { btn = 'Level passed!'; act = 'levelUp'; }
      } else {
        res = PP.answerFocus(q, i);
        if (res.allCleared) { btn = 'All done!'; act = 'focusDone'; }
        else if (res.cleared) { btn = 'Next puzzle type'; }
      }
      document.getElementById('opts').outerHTML = optsHTML(q, i, true);
      document.getElementById('fb').innerHTML = '<div class="fb ' + (ok ? 'good' : 'bad') + '"><b>' + (ok ? 'Nice!' : 'Not quite.') + '</b> ' + (ok ? '' : 'The right answer is ' + PP.LETTERS[q.ans] + '. ') + q.exp + '</div><button class="go" data-a="' + act + '">' + btn + '</button>';
      return;
    }
    mockPick(i);
  }
  function next() {
    if (P.mode === 'practice') { P.q = PP.nextQ(P.code, P.lv); P.done = false; qView(); }
    else { const left = PP.focusLeft(); if (!left.length) return focusDone(); P.code = left[0]; P.q = PP.nextFocusQ(P.code); P.done = false; qView(); }
  }
  function levelUp() {
    const code = P.code, lv = P.lv, i = PP.LEVELS.indexOf(lv), nx = PP.LEVELS[i + 1];
    set('<h1>Level passed! 🎉</h1><p class="sub">' + secName(code) + ' · ' + LN[lv] + ' is done. ' + (nx ? LN[nx] + ' level is now open.' : 'You have passed every level in this puzzle type.') + '</p><div class="menu">' + (nx ? '<button class="go" data-a="practice" data-v="' + code + '">Start ' + LN[nx] + ' level</button>' : '') + '<button class="ghost wide" data-a="sec" data-v="' + code + '">Back to ' + secName(code) + '</button></div>');
  }
  function focusDone() {
    P = null;
    set('<h1>Focus practice done! 🎉</h1><p class="sub">The next mock test is unlocked.</p><div class="menu"><button class="go" data-a="mockStart">Start the next mock test</button><button class="ghost wide" data-a="home">Home</button></div>');
  }

  /* ---------------- Mock test ---------------- */
  const cs = () => D().cur.subs[D().cur.si];
  function mockStart() { PP.startMock(); P = null; mockIntro(true); }
  function mockResume() { P = null; mockIntro(false); }
  function mockIntro(first) {
    stop();
    const c = D().cur, s = cs(), sec = PP.sec(s.code), n = c.si;
    const intro = first && n === 0 ? '<div class="card"><b>How this mock test works</b><p>It has 9 parts in 3 groups: Verbal, Quantitative and Nonverbal. Each part has 15 questions and a 10-minute timer. The questions start easy and get harder. You can go back to earlier questions in a part. You can stop between parts and come back later.</p></div>' : '';
    set('<div class="top"><button class="ghost" data-a="home">Stop for now</button></div>' + intro + '<h1>Part ' + (n + 1) + ' of 9</h1><h2>' + sec.name + '</h2><p class="sub">' + sec.how + '</p><p class="sub">15 questions · ' + fmt(s.left) + ' ' + (s.left < PP.MOCK_SECONDS ? 'left' : 'minutes') + '</p><button class="go" data-a="mockGo">Start part ' + (n + 1) + '</button>');
  }
  function mockGo() {
    const s = cs(); qi = 0; sure = false;
    s.end = Date.now() + s.left * 1000; stop();
    tm = setInterval(() => {
      s.left = Math.max(0, Math.ceil((s.end - Date.now()) / 1000));
      const c = document.getElementById('clk'); if (c) { c.textContent = fmt(s.left); c.classList.toggle('low', s.left <= 60); }
      if (s.left % 5 === 0) PP.save();
      if (s.left <= 0) finishSub(true);
    }, 1000);
    mockQ();
  }
  function mockQ() {
    const s = cs(), c = D().cur, q = PP.get(s.ids[qi]);
    const chips = s.ids.map((_, i) => '<button class="cn' + (s.picks[i] !== null ? ' got' : '') + (i === qi ? ' here' : '') + '" data-a="mockJump" data-v="' + i + '" aria-label="Question ' + (i + 1) + '">' + (i + 1) + '</button>').join('');
    const un = s.picks.filter(x => x === null).length;
    set('<div class="top"><span class="mute">Part ' + (c.si + 1) + ' of 9 · ' + secName(s.code) + '</span><span id="clk" class="clk">' + fmt(s.left) + '</span></div><div class="cns" id="cns">' + chips + '</div><small class="mute">Question ' + (qi + 1) + ' of ' + s.ids.length + '</small>' + qHTML(q, s.picks[qi], false) +
      '<div class="row"><button class="ghost" data-a="mockPrev"' + (qi === 0 ? ' disabled' : '') + '>Back</button><button class="ghost" data-a="mockNext"' + (qi === s.ids.length - 1 ? ' disabled' : '') + '>Next</button></div><button class="go" data-a="mockFinish" id="fin">' + (sure ? 'Tap again to finish (' + un + ' not answered)' : 'Finish this part') + '</button>');
  }
  function mockPick(i) {
    const s = cs(); s.picks[qi] = i; PP.save(); sure = false;
    document.querySelectorAll('#opts .opt').forEach((b, j) => b.classList.toggle('sel', j === i));
    const ch = document.querySelectorAll('#cns .cn')[qi]; if (ch) ch.classList.add('got');
    const f = document.getElementById('fin'); if (f) f.textContent = 'Finish this part';
  }
  function mockGoTo(i) { qi = Math.max(0, Math.min(cs().ids.length - 1, i)); sure = false; mockQ(); }
  function mockFinish() {
    const s = cs(), un = s.picks.filter(x => x === null).length;
    if (un && !sure) { sure = true; const f = document.getElementById('fin'); if (f) f.textContent = 'Tap again to finish (' + un + ' not answered)'; return; }
    finishSub(false);
  }
  function finishSub(auto) {
    stop();
    const c = D().cur, s = cs(); s.done = true; s.left = Math.max(0, s.left); PP.save();
    if (c.si < c.subs.length - 1) {
      c.si++; PP.save();
      const nx = PP.sec(cs().code), done = c.si;
      set('<h1>' + (auto ? "Time's up for this part" : 'Part ' + done + ' finished') + '</h1><p class="sub">' + done + ' of 9 parts done. Next: ' + nx.name + '.</p><div class="menu"><button class="go" data-a="mockIntro">Go to part ' + (done + 1) + '</button><button class="ghost wide" data-a="home">Take a break (continue later)</button></div>');
    } else mockDone();
  }
  function mockDone() {
    const t = PP.finishMock();
    let rows = t.subs.map(s => '<tr><td>' + secName(s.code) + '</td><td>' + s.score + ' / ' + s.items.length + '</td></tr>').join('');
    set('<h1>Test finished! 🎉</h1><p class="sub">Score: ' + PP.testTotal(t) + ' of ' + PP.testCount(t) + '</p><div class="card"><table class="tbl"><tbody>' + rows + '</tbody></table></div>' +
      (D().focus ? '<div class="card main"><b>Next step: focus practice</b><p class="sub">You missed questions in ' + Object.keys(D().focus.needs).length + ' puzzle type(s). Finish focus practice to unlock the next mock test.</p></div><div class="menu"><button class="go" data-a="focusStart">Start focus practice</button>' : '<div class="card main"><b>Perfect score!</b><p class="sub">No focus practice needed.</p></div><div class="menu">') +
      '<button class="ghost wide" data-a="reviewTest" data-v="' + t.id + '">Review every question</button><button class="ghost wide" data-a="home">Home</button></div>');
  }

  /* ---------------- Review ---------------- */
  function review() {
    stop(); P = null; const tests = D().tests;
    let h = '<div class="top"><button class="ghost" data-a="home">Home</button></div><h1>Review</h1><p class="sub">Every mock test, with each question marked right or wrong and its level.</p>';
    if (!tests.length) h += '<div class="card"><p>No mock tests yet. Finish one and it will show up here.</p></div>';
    tests.forEach((t, i) => { h += '<button class="tile wide" data-a="reviewTest" data-v="' + t.id + '"><b>Mock test ' + (tests.length - i) + '</b><span class="mute">' + new Date(t.date).toLocaleDateString() + ' · ' + PP.testTotal(t) + ' of ' + PP.testCount(t) + ' correct</span></button>'; });
    set(h);
  }
  function reviewTest(id, code, idx) {
    stop(); const t = D().tests.find(x => x.id === +id); if (!t) return review();
    rv = { id: t.id, code, idx };
    let h = '<div class="top"><button class="ghost" data-a="review">All tests</button></div><h1>Mock test review</h1><p class="sub">' + new Date(t.date).toLocaleDateString() + ' · ' + PP.testTotal(t) + ' of ' + PP.testCount(t) + ' correct. Tap a number to see that question.</p>';
    t.subs.forEach(s => {
      const byLv = { e: [0, 0], a: [0, 0], c: [0, 0] };
      s.items.forEach(x => { byLv[x.lv][1]++; if (x.ok) byLv[x.lv][0]++; });
      h += '<div class="card"><div class="lvh"><b>' + secName(s.code) + '</b><span>' + s.score + ' / ' + s.items.length + '</span></div><small class="mute">' + PP.LEVELS.map(l => LN[l][0] + ': ' + byLv[l][0] + '/' + byLv[l][1]).join(' · ') + ' (E easy, A average, C challenging)</small><div class="cns">' +
        s.items.map((x, i) => '<button class="cn ' + (x.ok ? 'r' : 'w') + (rv.code === s.code && rv.idx === i ? ' here' : '') + '" data-a="rq" data-v="' + s.code + '" data-w="' + i + '" aria-label="Question ' + (i + 1) + (x.ok ? ' right' : ' wrong') + '">' + (i + 1) + '<small>' + LN[x.lv][0] + (x.ok ? '✓' : '✗') + '</small></button>').join('') + '</div>';
      if (rv.code === s.code && rv.idx !== undefined) {
        const it = s.items[rv.idx], q = PP.get(it.id);
        h += '<div class="rvq"><b>Question ' + (rv.idx + 1) + ' · ' + LN[it.lv] + ' · ' + (it.ok ? 'right' : it.pick === null ? 'not answered' : 'wrong') + '</b>' + qHTML(q, it.pick, true) + '<div class="fb ' + (it.ok ? 'good' : 'bad') + '">' + (it.pick === null ? 'Not answered. ' : it.ok ? '' : 'Your answer was ' + PP.LETTERS[it.pick] + '. ') + 'Right answer: ' + PP.LETTERS[q.ans] + '. ' + q.exp + '</div></div>';
      }
      h += '</div>';
    });
    set(h);
    if (code) { const el = document.querySelector('.rvq'); if (el) el.scrollIntoView({ block: 'center' }); }
  }

  /* ---------------- Tracker ---------------- */
  function tracker() {
    stop(); P = null;
    let rows = PP.SECS.map(s => {
      const cells = PP.LEVELS.map(l => {
        const st = PP.S(s.code)[l], done = PP.passed(s.code, l);
        return '<td class="' + (done ? 'good' : '') + '">' + (done ? '✓ ' : '') + Math.min(st.c, PP.NEED) + '/' + PP.NEED + '<small>' + (st.c + st.w ? pc(st.c, st.c + st.w) + '% right' : 'not started') + '</small></td>';
      }).join('');
      const last = D().tests[0], ls = last && last.subs.find(x => x.code === s.code);
      return '<tr><td><b>' + s.name + '</b></td>' + cells + '<td>' + (ls ? ls.score + '/' + ls.items.length : '–') + '</td></tr>';
    }).join('');
    const hist = D().tests.slice(0, 6).map((t, i, a) => '<tr><td>Mock test ' + (D().tests.length - i) + '</td><td>' + new Date(t.date).toLocaleDateString() + '</td><td>' + PP.testTotal(t) + ' / ' + PP.testCount(t) + '</td></tr>').join('');
    set('<div class="top"><button class="ghost" data-a="home">Home</button></div><h1>Tracker</h1><p class="sub">Correct answers toward passing each level (10 needed), with accuracy. Saved on this iPad only.</p><div class="card scroll"><table class="tbl"><thead><tr><th>Puzzle type</th><th>Easy</th><th>Average</th><th>Challenging</th><th>Last mock</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      (hist ? '<h2>Mock tests</h2><div class="card"><table class="tbl"><tbody>' + hist + '</tbody></table></div>' : '') +
      '<p class="sub">Days practiced: ' + D().days.length + ' · Stars: ' + D().stars + '</p><button class="ghost" data-a="reset">' + (resetArm ? 'Tap again to erase everything' : 'Reset all progress') + '</button>');
  }
  function reset() { if (!resetArm) { resetArm = true; return tracker(); } resetArm = false; PP.reset(); home(); }

  /* ---------------- Events ---------------- */
  const A = {
    home, sec: secView, practice, pick, next, levelUp, focusStart, focusDone, mockStart, mockResume, mockIntro: () => mockIntro(false), mockGo,
    mockJump: v => mockGoTo(+v), mockPrev: () => mockGoTo(qi - 1), mockNext: () => mockGoTo(qi + 1), mockFinish,
    review, reviewTest: v => reviewTest(v), rq: (v, w) => reviewTest(rv.id, v, +w), tracker, reset
  };
  app.addEventListener('click', e => {
    const b = e.target.closest('[data-a]');
    if (!b || b.disabled) return;
    const f = A[b.dataset.a];
    if (f) f(b.dataset.v, b.dataset.w);
  });
  PP.home = home;
})();
