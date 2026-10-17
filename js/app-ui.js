/* App screens. */
(function () {
  const PP = window.PP, app = document.getElementById('app'), LN = PP.LEVEL_NAME, LI = PP.LEVEL_ICON;
  let P = null, tm = null, qi = 0, sure = false, rv = null, resetArm = false, finArm = false, lvArm = false;
  const D = () => PP.D();
  const pc = (a, b) => (b ? Math.round(a / b * 100) : 0);
  const set = h => { app.innerHTML = h; window.scrollTo(0, 0); };
  const stop = () => { if (tm) { clearInterval(tm); tm = null; } };
  const secName = c => PP.sec(c).name;
  const secIcon = c => PP.sec(c).icon;
  const lvName = l => LI[l] + ' ' + LN[l];
  const fmt = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  const mins = s => (s < 60 ? Math.round(s) + ' sec' : Math.round(s / 60) + ' min');
  const bar = p => '<div class="bar"><i style="width:' + Math.max(0, Math.min(100, p)) + '%"></i></div>';
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  const CHEER = ['He shoots, he scores! 🚨', 'Top shelf! 🥅', 'What a play! 🏒', 'Great pass! ⭐', 'You are on fire! 🔥', 'Nice one, champ! 🏆'];
  const TRY = ['Good try! Even the pros miss shots.', 'Not this time. Let us learn from it.', 'Close! Check the answer and try the next one.'];

  /* ----- friendly names for the question types the app tracks ----- */
  const TAGS = {
    NS: { add: 'Adding the same number', sub: 'Taking away the same number', double: 'Doubling', addBig: 'Adding bigger numbers', subBig: 'Taking away bigger numbers', grow1: 'Jumps that grow', alt: 'Two jumps that take turns', triple: 'Tripling', halve: 'Halving', grow2: 'Jumps that grow faster', muladd: 'Multiply, then add or take away', inter: 'Two patterns taking turns', square: 'Square numbers', tri: 'Triangle numbers', altop: 'Switching operations', fib: 'Adding the last two numbers' },
    NA: { add: 'Adding a number', subtract: 'Taking away a number' },
    NP: { two: 'Two-shape puzzles', two2: 'Two-shape puzzles', tri: 'Shape puzzles' },
    VA: { sound: 'Animal sounds', opp: 'Opposites', young: 'Baby animals', use: 'Tools and their jobs', home: 'Animal homes', part: 'Parts of things', toon: 'Cartoon characters', sportplace: 'Where sports are played', cat: 'Kinds of things', worktool: 'Jobs and their tools', workplace: 'Jobs and places', syn: 'Words that mean the same', source: 'Where things come from', placeact: 'What you do in a place', wear: 'What you wear where', sportgear: 'Sports gear', degree: 'Stronger words', opp2: 'Harder opposites', grow: 'Growing up', measure: 'Measuring tools', collect: 'Group words', wholepart2: 'Part and whole' },
    PF: { V1: 'One fold in half', D1: 'One diagonal fold', VH: 'Two folds in half', VV: 'Two folds side by side', DA: 'Two diagonal folds' },
    SC: { sentence: 'Fitting the right word' }
  };
  function tagLabel(code, tag) {
    if (TAGS[code] && TAGS[code][tag]) return TAGS[code][tag];
    if (code === 'FM') return 'Grid rules about ' + tag.split('+').join(' and ');
    if (code === 'FC') return 'Alike by ' + tag.split('+').join(' and ');
    if (code === 'NP') return 'Missing number: ' + tag.replace(/x/g, '☐');
    if (code === 'NA') return 'Rule: ' + tag;
    return tag;
  }

  function confetti() {
    const box = document.createElement('div'); box.className = 'confetti'; box.setAttribute('aria-hidden', 'true');
    const E = ['🏒', '⭐', '🥅', '🎉', '🏆', '✨'];
    for (let i = 0; i < 28; i++) {
      const s = document.createElement('span');
      s.textContent = E[i % E.length];
      s.style.left = Math.round(Math.random() * 96) + '%';
      s.style.animationDelay = (Math.random() * 0.8).toFixed(2) + 's';
      s.style.fontSize = 20 + Math.round(Math.random() * 18) + 'px';
      box.appendChild(s);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3600);
  }

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
    const d = D(), k = PP.streak(), td = PP.dayStats(PP.dkey());
    let h = '<div class="hero"><div class="puck" aria-hidden="true">🏒</div><div><h1>Puzzle Practice</h1><p class="sub">Warm up, play the puzzles, win the game!</p></div></div>' +
      '<div class="badges"><span>' + (k ? '🔥 ' + k + '-day streak' : '🔥 Start a streak today') + '</span><span>🥅 ' + d.stars + ' goals</span><span>⏱️ ' + mins(td.time) + ' today</span></div>' +
      bar(td.time / PP.DAILY_GOAL * 100) + '<small class="mute">Daily goal: 20 minutes of practice</small>';
    const mc = PP.missCounts(), pk = d.fan.picks.length;
    h += '<div class="row"><button class="ghost" data-a="fantasyHome">🏆 Fantasy teams' + (pk ? ' <span class="pill">' + pk + ' pick' + (pk > 1 ? 's' : '') + '</span>' : '') + '</button><button class="ghost" data-a="jerseys">👕 Jerseys <span class="pill">' + Object.keys(d.jer.owned).length + '</span></button></div><div class="row"><button class="ghost" data-a="toons">🎭 Cartoons <span class="pill">' + Object.keys(d.toon.owned).length + '</span></button><button class="ghost" data-a="mistakes">🧠 Mistakes' + (mc.open ? ' <span class="pill">' + mc.open + '</span>' : '') + '</button></div>';
    h += '<div class="card main"><b>⚡ Smart practice</b><p class="sub">The app picks the puzzle types you need most. Get 8 of every 10 right to win a cartoon character!</p><button class="go" data-a="smart">Start smart practice</button></div>';
    if (d.cur) {
      h += '<div class="card main"><b>📋 Mock test in progress</b><p class="sub">' + PP.mockAnswered(d.cur) + ' of ' + PP.mockTotal(d.cur) + ' questions answered. You can jump to any part.</p><button class="go" data-a="mockResume">Continue mock test</button></div>';
    } else if (d.focus) {
      const left = PP.focusLeft();
      h += '<div class="card main"><b>🎯 Focus practice comes next</b><p class="sub">You missed questions in ' + Object.keys(d.focus.needs).length + ' puzzle type' + (Object.keys(d.focus.needs).length > 1 ? 's' : '') + '. Finish this practice to unlock the next mock test (' + left.length + ' to go).</p><button class="go" data-a="focusStart">Start focus practice</button></div>';
    } else {
      h += '<div class="card main"><b>📋 Mock test #' + (d.tests.length + 1) + '</b><p class="sub">9 timed parts, 10 minutes each, easy questions first.' + (d.tests.length ? ' It includes new questions like the ones you missed last time.' : '') + '</p><button class="go" data-a="mockStart">Start a mock test</button></div>';
    }
    PP.BATTERIES.forEach((b, bi) => {
      h += '<h2>' + ['📚', '🔢', '🔷'][bi] + ' ' + b + '</h2><div class="tiles">' + PP.SECS.filter(s => s.bat === bi).map(s => {
        const chips = PP.LEVELS.map(l => {
          const st = PP.S(s.code)[l];
          const t = PP.passed(s.code, l) ? '✓' : PP.unlocked(s.code, l) ? st.c + '/' + PP.NEED : '🔒';
          return '<span class="lc ' + (PP.passed(s.code, l) ? 'done' : PP.unlocked(s.code, l) ? 'open' : 'lock') + '">' + LI[l] + ' ' + t + '</span>';
        }).join('');
        return '<button class="tile" data-a="sec" data-v="' + s.code + '"><b>' + s.icon + ' ' + s.name + '</b><span class="chips">' + chips + '</span></button>';
      }).join('') + '</div>';
    });
    h += '<div class="row"><button class="ghost" data-a="review">📝 Review</button><button class="ghost" data-a="tracker">📊 Tracker</button></div><div class="row"><button class="ghost" data-a="backup">💾 Save / restore progress</button></div>';
    set(h);
  }

  /* ---------------- Section page ---------------- */
  function secView(code) {
    stop(); P = null;
    const s = PP.sec(code), cur = PP.curLevel(code);
    let h = '<div class="top"><button class="ghost" data-a="home">Home</button></div><h1>' + s.icon + ' ' + s.name + '</h1><p class="sub">' + s.how + '</p>';
    PP.LEVELS.forEach(l => {
      const st = PP.S(code)[l], done = PP.passed(code, l), open = PP.unlocked(code, l);
      h += '<div class="card lv"><div class="lvh"><b>' + lvName(l) + '</b><span class="' + (done ? 'good' : open ? '' : 'mute') + '">' + (done ? '✓ Passed' : open ? 'In progress' : '🔒 Pass ' + LN[PP.LEVELS[PP.LEVELS.indexOf(l) - 1]] + ' first') + '</span></div>' +
        bar(open ? Math.min(100, st.c / PP.NEED * 100) : 0) +
        '<small class="mute">' + (open ? Math.min(st.c, PP.NEED) + ' of ' + PP.NEED + ' correct to pass' + (st.c + st.w ? ' · ' + st.c + ' right, ' + st.w + ' wrong (' + pc(st.c, st.c + st.w) + '%)' : '') : 'Locked') + '</small></div>';
    });
    h += '<button class="go" data-a="practice" data-v="' + code + '">' + (PP.allDone(code) ? 'Keep practicing: Challenging' : 'Practice: ' + lvName(cur)) + '</button>';
    set(h);
  }

  /* ---------------- Practice, smart practice and focus questions ---------------- */
  function practice(code) { P = { mode: 'practice', code, smart: false, twin: null }; nextPractice(); }
  function smart() { P = { mode: 'practice', code: null, smart: true, twin: null }; nextPractice(); }
  function nextPractice() {
    if (P.smart && !P.twin) P.code = PP.smartSection(P.code);
    P.lv = P.fixLv || (P.twin && P.twinLv) || PP.askLevel(P.code);
    const r = PP.nextQ(P.code, P.lv, { tag: P.twin });
    P.isTwin = !!P.twin; P.twin = null;
    P.q = r.q; P.repeat = r.repeat; P.done = false; P.t0 = Date.now(); qView();
  }
  function focusStart() {
    const left = PP.focusLeft();
    if (!left.length) return home();
    P = { mode: 'focus', code: left[0], twin: null };
    nextFocus();
  }
  function nextFocus() {
    const left = PP.focusLeft();
    if (!left.length) return focusDone();
    if (!P.twin || !left.includes(P.code)) { P.code = left[0]; P.twin = null; }
    const r = PP.nextFocusQ(P.code, P.twin);
    P.isTwin = !!P.twin; P.twin = null;
    P.q = r.q; P.repeat = r.repeat; P.done = false; P.t0 = Date.now(); qView();
  }
  function qView() {
    stop();
    const q = P.q, d = D();
    let top, prog, txt, back;
    if (P.mode === 'focus') {
      const n = d.focus.needs[q.sec];
      top = '🎯 Focus · ' + secName(q.sec) + ' · ' + lvName(q.lv); prog = n.got / PP.FOCUS_NEED * 100; txt = n.got + ' of ' + PP.FOCUS_NEED + ' correct in this puzzle type'; back = 'home';
    } else {
      const bl = PP.curLevel(q.sec), st = PP.S(q.sec)[bl];
      top = (P.smart ? '⚡ ' : '') + secIcon(q.sec) + ' ' + secName(q.sec) + ' · ' + lvName(q.lv); back = P.smart ? 'home' : 'sec';
      if (P.smart) { prog = Math.min(d.sess.n, PP.SESSION) / PP.SESSION * 100; txt = 'Smart session: question ' + Math.min(d.sess.n + 1, PP.SESSION) + ' of ' + PP.SESSION + ' (' + d.sess.ok + ' right so far)'; }
      else { prog = st.c / PP.NEED * 100; txt = Math.min(st.c, PP.NEED) + ' of ' + PP.NEED + ' correct to pass ' + LN[bl] + (PP.passed(q.sec, bl) ? ' (all levels passed)' : ''); }
    }
    const sess = (P.fromMiss || !P.smart ? '' : '<small class="mute">🏒 ' + Math.min(d.sess.n, PP.SESSION) + ' of ' + PP.SESSION + ' questions to a cartoon character (get 8 right)</small>');
    const harder = (P.mode === 'practice' && !P.isTwin && !P.fromMiss && PP.LEVELS.indexOf(q.lv) > PP.LEVELS.indexOf(PP.curLevel(q.sec))) ? '<div class="note">⬆️ Harder question! You got the last one right, so you moved up.</div>' : '';
    const note = sess + harder + (P.isTwin ? '<div class="note">🔁 Same kind of puzzle as the last one. You can do it!</div>' : '') + (P.repeat ? '<div class="note">♻️ You have done all the fresh questions at this level, so this one is a repeat.</div>' : '');
    set('<div class="top"><button class="ghost" data-a="' + back + '" data-v="' + q.sec + '">' + (back === 'home' ? 'Home' : 'Back') + '</button><span class="mute">' + top + '</span></div>' + bar(prog) + '<small class="mute">' + txt + '</small>' + note + qHTML(q, null, false) + '<div id="fb"></div>');
  }
  function pick(i) {
    i = +i;
    if (P && P.mode) {
      if (P.done) return;
      P.done = true;
      const q = P.q, ok = i === q.ans, secs = (Date.now() - P.t0) / 1000;
      let res, btn = 'Next question', act = 'next';
      if (P.mode === 'practice') {
        res = PP.answerPractice(q, i, secs, P.smart);
        if (res.levelPassed) { btn = 'Level passed!'; act = 'levelUp'; }
      } else {
        res = PP.answerFocus(q, i, secs);
        if (res.allCleared) { btn = 'All done!'; act = 'focusDone'; }
        else if (res.cleared) { btn = 'Next puzzle type'; }
      }
      if (!ok) { P.twin = q.tag || null; P.twinLv = q.lv; }
      if (res.levelPassed) { P.passedLv = res.passedLv; P.jersey = res.jersey; }
      let extra = '';
      if (P.fromMiss) {
        btn = ok ? 'I understand it now ✅' : 'Try another like it'; act = ok ? 'missUnderstood' : 'next';
        extra = '<button class="ghost wide" data-a="mistakes" style="margin-top:10px">Back to mistakes</button>';
      } else if (res.sessionDone && !res.levelPassed && !res.allCleared) { btn = 'Finish session 🎉'; act = 'sessionDone'; }
      document.getElementById('opts').outerHTML = optsHTML(q, i, true);
      document.getElementById('fb').innerHTML = '<div class="fb ' + (ok ? 'good' : 'bad') + '"><b>' + (ok ? rnd(CHEER) : rnd(TRY)) + '</b> ' + (ok ? '' : 'The right answer is ' + PP.LETTERS[q.ans] + '. ') + q.exp + '</div><button class="go" data-a="' + act + '">' + btn + '</button>' + extra;
      if (ok && (res.levelPassed || res.allCleared)) confetti();
      return;
    }
    mockPick(i);
  }
  function next() { if (P.mode === 'practice') nextPractice(); else nextFocus(); }
  function levelUp() {
    const code = P.code, lv = P.passedLv || P.lv, i = PP.LEVELS.indexOf(lv), nx = PP.LEVELS[i + 1];
    confetti();
    set('<h1>Level passed! 🎉</h1><p class="sub">' + secName(code) + ' · ' + lvName(lv) + ' is done. ' + (nx ? lvName(nx) + ' is now open.' : 'You have passed every level in this puzzle type.') + '</p>' +
      (P.jersey ? '<div class="card main"><b>👕 You won a jersey!</b><div class="reveal">' + PP.ui.jerseyCard(P.jersey, false) + '</div>' + (P.jersey.dup ? '<small class="mute">You already had this one, so you have a spare!</small>' : '<small class="mute">New for your collection! 🌟</small>') + '<button class="ghost wide" data-a="jerseys">👕 See my jerseys</button></div>' : '') +
      (P.smart ? '' : '<div class="card main"><b>🏒 You earned a draft pick!</b><p class="sub">' + D().fan.picks.length + ' pick' + (D().fan.picks.length > 1 ? 's' : '') + ' ready to use.</p><button class="go" data-a="draft">🏆 Draft a player</button></div>') + '<div class="menu">' +
      (P.smart ? '<button class="go" data-a="smartGo">Keep going</button>' : (nx ? '<button class="go" data-a="practice" data-v="' + code + '">Start ' + lvName(nx) + '</button>' : '')) +
      (P.smart && D().sess.n >= PP.SESSION ? '<button class="go" data-a="sessionDone">Finish session 🎉 and see your reward</button>' : '') +
      '<button class="ghost wide" data-a="' + (P.smart ? 'home' : 'sec') + '" data-v="' + code + '">' + (P.smart ? 'Home' : 'Back to ' + secName(code)) + '</button></div>');
  }
  function focusDone() {
    P = null; confetti();
    set('<h1>Focus practice done! 🎉</h1><p class="sub">Great work. The next mock test is unlocked.</p><div class="menu"><button class="go" data-a="mockStart">Start the next mock test</button><button class="ghost wide" data-a="home">Home</button></div>');
  }

  /* ---------------- Mock test ---------------- */
  const cur = () => D().cur;
  const sub = () => cur().subs[cur().si];
  function pause() {   // stop the part clock and remember the time left
    stop();
    const c = cur(); if (!c) return;
    const s = sub();
    if (s && s.end) { s.left = Math.max(0, Math.ceil((s.end - Date.now()) / 1000)); s.end = 0; }
    PP.save();
  }
  function mockStart() {
    set('<h1>Getting your test ready… 🏒</h1><p class="sub">Picking fresh questions just for you.</p>');
    setTimeout(() => { PP.startMock(); finArm = false; mockHub(true); }, 40);
  }
  function mockResume() { finArm = false; mockHub(false); }
  function mockHub(first) {
    pause();
    const c = cur(); if (!c) return home();
    const un = PP.mockTotal(c) - PP.mockAnswered(c);
    const intro = first ? '<div class="card"><b>How this mock test works</b><p>It has 9 parts in 3 groups: Verbal, Quantitative and Nonverbal. Each part has 15 questions and its own 10-minute clock. The questions start easy and get harder. Some are new questions like the ones you missed in your last test. You can open any part, go back to earlier parts, and change your answers before you finish the whole test.</p></div>' : '';
    const rows = c.subs.map((s, i) => {
      const ans = s.picks.filter(x => x !== null).length;
      const st = s.left <= 0 ? 'Time is up' : s.done ? 'Finished' : s.started ? 'In progress' : 'Not started';
      const cls = s.done || s.left <= 0 ? 'done' : s.started ? 'open' : 'lock';
      const lbl = !s.started ? 'Start' : (s.left > 0 ? 'Open' : 'Look back');
      return '<button class="tile wide part" data-a="mockPart" data-v="' + i + '"><div class="lvh"><b>' + (i + 1) + '. ' + secIcon(s.code) + ' ' + secName(s.code) + '</b><span class="lc ' + cls + '">' + st + '</span></div><small class="mute">' + ans + ' of ' + s.ids.length + ' answered · ' + (s.left <= 0 ? 'no time left' : fmt(s.left) + ' left') + ' · tap to ' + lbl.toLowerCase() + '</small></button>';
    }).join('');
    set('<div class="top"><button class="ghost" data-a="home">Take a break</button><span class="mute">Mock test #' + (D().tests.length + 1) + '</span></div><h1>Your parts</h1>' + intro +
      '<p class="sub">' + PP.mockAnswered(c) + ' of ' + PP.mockTotal(c) + ' questions answered. Open a part to work on it.</p>' + rows +
      '<button class="go" data-a="mockFinishAll">' + (finArm ? 'Tap again to finish (' + un + ' not answered)' : 'Finish the whole test') + '</button>');
  }
  function mockPart(i) {
    pause(); const c = cur(); c.si = +i; PP.save();
    const s = sub(), sec = PP.sec(s.code);
    if (!s.started) {
      set('<div class="top"><button class="ghost" data-a="mockHub">Parts</button></div><h1>Part ' + (c.si + 1) + ' of 9</h1><h2>' + sec.icon + ' ' + sec.name + '</h2><p class="sub">' + sec.how + '</p><p class="sub">' + s.ids.length + ' questions · ' + fmt(s.left) + ' minutes. The clock starts when you tap Start.</p><button class="go" data-a="mockGo">Start part ' + (c.si + 1) + '</button>');
    } else mockGo();
  }
  function mockGo() {
    const s = sub(); qi = 0; sure = false; s.started = true; stop();
    if (s.left > 0) {
      let last = Date.now(), n = 0; s.end = last + s.left * 1000;
      tm = setInterval(() => {
        const now = Date.now(); PP.addTime(Math.min(2, (now - last) / 1000)); last = now;
        s.left = Math.max(0, Math.ceil((s.end - now) / 1000));
        const c = document.getElementById('clk'); if (c) { c.textContent = fmt(s.left); c.classList.toggle('low', s.left <= 60); }
        if (++n % 5 === 0) PP.save();
        if (s.left <= 0) timeUp();
      }, 1000);
    }
    mockQ();
  }
  function timeUp() {
    const s = sub(); stop(); s.end = 0; s.left = 0; s.done = true; PP.save();
    set('<h1>Time is up for this part ⏰</h1><p class="sub">Your answers are saved. You can still look back at this part from the parts list.</p><div class="menu"><button class="go" data-a="mockHub">Back to the parts</button></div>');
  }
  function mockQ() {
    const s = sub(), c = cur(), q = PP.get(s.ids[qi]);
    const chips = s.ids.map((_, i) => '<button class="cn' + (s.picks[i] !== null ? ' got' : '') + (i === qi ? ' here' : '') + '" data-a="mockJump" data-v="' + i + '" aria-label="Question ' + (i + 1) + '">' + (i + 1) + '</button>').join('');
    const clk = s.left > 0 ? '<span id="clk" class="clk">' + fmt(s.left) + '</span>' : '<span class="clk low">Time is up</span>';
    set('<div class="top"><button class="ghost" data-a="mockHub">Parts</button><span class="mute">Part ' + (c.si + 1) + ' of 9 · ' + secIcon(s.code) + ' ' + secName(s.code) + '</span>' + clk + '</div><div class="cns" id="cns">' + chips + '</div><small class="mute">Question ' + (qi + 1) + ' of ' + s.ids.length + '</small>' +
      (s.fu && s.fu[qi] ? '<div class="note">🔁 Check-up: same kind of puzzle as one you missed last time.</div>' : '') + qHTML(q, s.picks[qi], false) +
      '<div class="row"><button class="ghost" data-a="mockPrev"' + (qi === 0 ? ' disabled' : '') + '>Back</button><button class="ghost" data-a="mockNext"' + (qi === s.ids.length - 1 ? ' disabled' : '') + '>Next</button></div><button class="go" data-a="mockDonePart">Done with this part</button>');
  }
  function mockPick(i) {
    const s = sub(); s.picks[qi] = i; PP.save();
    document.querySelectorAll('#opts .opt').forEach((b, j) => b.classList.toggle('sel', j === i));
    const ch = document.querySelectorAll('#cns .cn')[qi]; if (ch) ch.classList.add('got');
  }
  function mockGoTo(i) { qi = Math.max(0, Math.min(sub().ids.length - 1, i)); mockQ(); }
  function mockDonePart() { pause(); sub().done = true; PP.save(); finArm = false; mockHub(false); }
  function mockFinishAll() {
    const c = cur(), un = PP.mockTotal(c) - PP.mockAnswered(c);
    if (un && !finArm) { finArm = true; return mockHub(false); }
    pause(); finArm = false; mockDone();
  }
  function mockDone() {
    const t = PP.finishMock();
    const rows = t.subs.map(s => '<tr><td>' + secIcon(s.code) + ' ' + secName(s.code) + '</td><td>' + s.score + ' / ' + s.items.length + '</td></tr>').join('');
    const fu = t.subs.reduce((n, s) => n + s.items.filter(x => x.fu).length, 0), fuOk = t.subs.reduce((n, s) => n + s.items.filter(x => x.fu && x.ok).length, 0);
    if (PP.testTotal(t) >= PP.testCount(t) * 0.7) confetti();
    const rw = PP.mockReward(t);
    set('<h1>Test finished! 🎉</h1><p class="sub">Score: ' + PP.testTotal(t) + ' of ' + PP.testCount(t) + '</p><div class="card"><table class="tbl"><tbody>' + rows + '</tbody></table></div>' +
      (rw.picks ? '<div class="card main"><b>🏒 90% or more: you earned a draft pick!</b><p class="sub">Draft an NHL player for your fantasy teams.</p><button class="go" data-a="draft">🏆 Draft a player</button></div>' : '<div class="card"><b>🏒 Draft pick: score 90% or more</b><p class="sub">You scored ' + Math.round(PP.testTotal(t) / PP.testCount(t) * 100) + '%. Keep practicing and try again next test!</p></div>') +
      (fu ? '<div class="card"><b>🔁 Check-up questions</b><p class="sub">You got ' + fuOk + ' of ' + fu + ' right on the questions that matched your mistakes from last time.</p></div>' : '') +
      (D().focus ? '<div class="card main"><b>🎯 Next step: focus practice</b><p class="sub">You missed questions in ' + Object.keys(D().focus.needs).length + ' puzzle type(s). Finish focus practice to unlock the next mock test.</p></div><div class="menu"><button class="go" data-a="focusStart">Start focus practice</button>' : '<div class="card main"><b>Perfect score! 🏆</b><p class="sub">No focus practice needed.</p></div><div class="menu">') +
      '<button class="ghost wide" data-a="reviewTest" data-v="' + t.id + '">Review every question</button><button class="ghost wide" data-a="home">Home</button></div>');
  }

  /* ---------------- Review ---------------- */
  function review() {
    stop(); P = null; const tests = D().tests;
    let h = '<div class="top"><button class="ghost" data-a="home">Home</button></div><h1>📝 Review</h1><p class="sub">Every mock test, with each question marked right or wrong and its level.</p>';
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
      h += '<div class="card"><div class="lvh"><b>' + secIcon(s.code) + ' ' + secName(s.code) + '</b><span>' + s.score + ' / ' + s.items.length + '</span></div><small class="mute">' + PP.LEVELS.map(l => LN[l][0] + ': ' + byLv[l][0] + '/' + byLv[l][1]).join(' · ') + ' (E easy, A average, C challenging)</small><div class="cns">' +
        s.items.map((x, i) => '<button class="cn ' + (x.ok ? 'r' : 'w') + (rv.code === s.code && rv.idx === i ? ' here' : '') + '" data-a="rq" data-v="' + s.code + '" data-w="' + i + '" aria-label="Question ' + (i + 1) + (x.ok ? ' right' : ' wrong') + '">' + (i + 1) + '<small>' + LN[x.lv][0] + (x.ok ? '✓' : '✗') + '</small></button>').join('') + '</div>';
      if (rv.code === s.code && rv.idx !== undefined) {
        const it = s.items[rv.idx], q = PP.get(it.id);
        h += '<div class="rvq"><b>Question ' + (rv.idx + 1) + ' · ' + LN[it.lv] + ' · ' + (it.ok ? 'right' : it.pick === null ? 'not answered' : 'wrong') + (it.fu ? ' · 🔁 check-up' : '') + '</b>' + qHTML(q, it.pick, true) + '<div class="fb ' + (it.ok ? 'good' : 'bad') + '">' + (it.pick === null ? 'Not answered. ' : it.ok ? '' : 'Your answer was ' + PP.LETTERS[it.pick] + '. ') + 'Right answer: ' + PP.LETTERS[q.ans] + '. ' + q.exp + '</div></div>';
      }
      h += '</div>';
    });
    set(h);
    if (code) { const el = document.querySelector('.rvq'); if (el) el.scrollIntoView({ block: 'center' }); }
  }

  /* ---------------- Tracker ---------------- */
  function tracker() {
    stop(); P = null;
    const d = D(), tot = PP.totals(), td = PP.dayStats(PP.dkey()), mc = PP.missCounts();
    // last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) { const x = new Date(); x.setDate(x.getDate() - i); const k = PP.dkey(x); days.push({ k, lbl: x.toLocaleDateString(undefined, { weekday: 'short' }), st: PP.dayStats(k) }); }
    const maxM = Math.max(PP.DAILY_GOAL / 60, ...days.map(x => x.st.time / 60));
    const bars = days.map(x => '<div class="dcol"><span class="dval">' + (x.st.time ? Math.round(x.st.time / 60) : '') + '</span><div class="dbar"><i style="height:' + Math.round(x.st.time / 60 / maxM * 100) + '%"></i></div><span class="dlbl">' + x.lbl + '</span></div>').join('');
    const drows = days.slice().reverse().map(x => '<tr><td>' + x.lbl + '</td><td>' + (x.st.time ? mins(x.st.time) : '–') + '</td><td>' + x.st.n + '</td><td>' + (x.st.n ? pc(x.st.ok, x.st.n) + '%' : '–') + '</td></tr>').join('');
    // sections
    const srows = PP.SECS.map(s => {
      const st = PP.secStats(s.code), passed = PP.LEVELS.filter(l => PP.passed(s.code, l)).length;
      const cells = PP.LEVELS.map(l => { const x = PP.S(s.code)[l], done = PP.passed(s.code, l); return '<td class="' + (done ? 'good' : '') + '">' + (done ? '✓ ' : '') + Math.min(x.c, PP.NEED) + '/' + PP.NEED + '<small>' + (x.c + x.w ? pc(x.c, x.c + x.w) + '% right' : 'not started') + '</small></td>'; }).join('');
      return '<tr><td><b>' + s.icon + ' ' + s.name + '</b><small>' + passed + ' of 3 levels passed</small></td><td>' + st.n + '<small>' + (st.n ? pc(st.ok, st.n) + '% right' : '–') + '</small></td><td>' + (st.recent === null ? '–' : Math.round(st.recent * 100) + '%') + '</td>' + cells + '</tr>';
    }).join('');
    const passedAll = PP.SECS.reduce((n, s) => n + PP.LEVELS.filter(l => PP.passed(s.code, l)).length, 0);
    const trend = d.tests.slice(0, 8).reverse().map((t, i, a) => { const p = pc(PP.testTotal(t), PP.testCount(t)); return '<div class="dcol"><span class="dval">' + p + '%</span><div class="dbar"><i style="height:' + p + '%"></i></div><span class="dlbl">#' + (d.tests.length - a.length + i + 1) + '</span></div>'; }).join('');
    const weak = PP.weakSpots().map(w => '<li><b>' + secName(w.code) + '</b>: ' + tagLabel(w.code, w.tag) + '<small>' + Math.round(w.st.c / w.st.n * 100) + '% right over ' + w.st.n + ' questions</small></li>').join('');
    set('<div class="top"><button class="ghost" data-a="home">Home</button></div><h1>📊 Tracker</h1><p class="sub">Saved on this iPad only.</p>' +
      '<div class="stats"><div class="stat"><b>' + mins(td.time) + '</b><small>practice today</small></div><div class="stat"><b>' + td.n + '</b><small>questions today' + (td.n ? ' · ' + pc(td.ok, td.n) + '% right' : '') + '</small></div><div class="stat"><b>' + tot.n + '</b><small>questions in total' + (tot.n ? ' · ' + pc(tot.ok, tot.n) + '% right' : '') + '</small></div><div class="stat"><b>' + mins(tot.time) + '</b><small>practice time in total</small></div></div>' +
      '<h2>Practice time, last 7 days</h2><div class="card"><div class="dchart">' + bars + '</div><small class="mute">Minutes per day. The goal is 20.</small><div class="scroll"><table class="tbl"><thead><tr><th>Day</th><th>Time</th><th>Questions</th><th>Right</th></tr></thead><tbody>' + drows + '</tbody></table></div></div>' +
      '<h2>Progress</h2><div class="card"><div class="lvh"><b>Levels passed</b><span>' + passedAll + ' of 27</span></div>' + bar(passedAll / 27 * 100) + '<div class="lvh"><b>Fresh questions used</b><span>' + tot.used + ' of ' + tot.bank + '</span></div>' + bar(tot.used / tot.bank * 100) + '<small class="mute">Questions never repeat until a level runs out.</small>' +
      (d.tests.length ? '<div class="dchart" style="margin-top:14px">' + trend + '</div><small class="mute">Mock test scores (percent right)</small>' : '') + '</div>' +
      '<h2>🧠 Mistakes</h2><div class="card">' + (mc.all ? '<div class="lvh"><b>Understood</b><span>' + mc.done + ' of ' + mc.all + '</span></div>' + bar(mc.done / mc.all * 100) + '<small class="mute">' + mc.open + ' still not understood · ' + mc.all + ' missed in total</small><ul class="weak" style="margin-top:8px">' + PP.SECS.map(s => ({ s, n: PP.missList('open', s.code).length })).filter(x => x.n).map(x => '<li>' + x.s.icon + ' ' + x.s.name + ': <b>' + x.n + '</b> not understood yet</li>').join('') + '</ul>' : '<p>No mistakes saved yet.</p>') + '<button class="ghost wide" data-a="mistakes" style="margin-top:10px">Open the mistakes notebook</button></div>' +
      '<h2>By puzzle type</h2><div class="card scroll"><table class="tbl"><thead><tr><th>Puzzle type</th><th>Answered</th><th>Last 20</th><th>' + lvName('e') + '</th><th>' + lvName('a') + '</th><th>' + lvName('c') + '</th></tr></thead><tbody>' + srows + '</tbody></table></div>' +
      '<h2>Needs more practice</h2><div class="card">' + (weak ? '<ul class="weak">' + weak + '</ul><small class="mute">Smart practice and the next mock test give extra questions on these.</small>' : '<p>Nothing stands out yet. Keep practicing and this list will fill in.</p>') + '</div>' +
      '<button class="ghost" data-a="resetLevels">' + (lvArm ? 'Tap again: restart levels (collections stay)' : '🔄 Restart levels only (keep collections)') + '</button>' +
      '<button class="ghost" data-a="reset">' + (resetArm ? 'Tap again to erase everything' : 'Reset all progress') + '</button>');
  }
  function resetLevels() { if (!lvArm) { lvArm = true; return tracker(); } lvArm = false; PP.resetLevels(); home(); }
  function reset() { if (!resetArm) { resetArm = true; return tracker(); } resetArm = false; PP.reset(); home(); }

  /* ---------------- Events ---------------- */
  const A = {
    home, sec: secView, practice, smart, smartGo: () => { P.smart = true; nextPractice(); }, pick, next, levelUp, focusStart, focusDone,
    mockStart, mockResume, mockHub: () => mockHub(false), mockPart: v => mockPart(v), mockGo, mockFinishAll, mockDonePart,
    mockJump: v => mockGoTo(+v), mockPrev: () => mockGoTo(qi - 1), mockNext: () => mockGoTo(qi + 1),
    review, reviewTest: v => reviewTest(v), rq: (v, w) => reviewTest(rv.id, v, +w), tracker, reset, resetLevels
  };
  app.addEventListener('click', e => {
    const b = e.target.closest('[data-a]');
    if (!b || b.disabled) return;
    const f = A[b.dataset.a];
    if (f) f(b.dataset.v, b.dataset.w);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && D().cur) { PP.save(); } });
  PP.ui = { set, stop, bar, confetti, A: A, home, secName, secIcon, lvName, tagLabel, rnd, getP: () => P, setP: v => { P = v; }, nextPractice, nextFocus, optsHTML, qHTML, fmt };
  PP.home = home; PP._dbg = () => ({ P, qi, cur: D().cur });
  // build the question lists quietly in the background so tests start quickly
  PP.warm = function () {
    const jobs = []; PP.SECS.forEach(s => PP.LEVELS.forEach(l => jobs.push([s.code, l])));
    const run = () => { const j = jobs.shift(); if (!j) return; try { PP.pool(j[0], j[1]); } catch (e) {} setTimeout(run, 60); };
    setTimeout(run, 800);
  };
})();
