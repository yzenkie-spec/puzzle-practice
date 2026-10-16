/* Core helpers: seeded random numbers, section list, question pools. */
(function () {
  const PP = (window.PP = window.PP || {});

  PP.hash = function (s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  PP.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  PP.ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  PP.pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  PP.shuffle = function (r, arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };

  PP.BATTERIES = ['Verbal', 'Quantitative', 'Nonverbal'];
  PP.SECS = [
    { code: 'VA', name: 'Verbal Analogies', bat: 0, how: 'Find how the first two words go together. Use the same link for the third word.' },
    { code: 'SC', name: 'Sentence Completion', bat: 0, how: 'Pick the word that best fits in the blank.' },
    { code: 'VC', name: 'Verbal Classification', bat: 0, how: 'Find how the three words are alike. Pick the word that belongs with them.' },
    { code: 'NA', name: 'Number Analogies', bat: 1, how: 'Find the rule in the number pairs. Use it on the last number.' },
    { code: 'NP', name: 'Number Puzzles', bat: 1, how: 'Find the missing number that makes the math true.' },
    { code: 'NS', name: 'Number Series', bat: 1, how: 'Find the pattern. Pick the number that comes next.' },
    { code: 'FM', name: 'Figure Matrices', bat: 2, how: 'Find the rule in the grid. Pick the figure that fits the empty box.' },
    { code: 'PF', name: 'Paper Folding', bat: 2, how: 'The paper is folded and a hole is punched. Pick how it looks when unfolded.' },
    { code: 'FC', name: 'Figure Classification', bat: 2, how: 'Find how the three figures are alike. Pick the figure that is most like them.' }
  ];
  PP.sec = code => PP.SECS.find(s => s.code === code);
  PP.LEVELS = ['e', 'a', 'c'];
  PP.LEVEL_NAME = { e: 'Easy', a: 'Average', c: 'Challenging' };
  PP.POOL = { e: 67, a: 67, c: 66 };      // 200 questions per section
  PP.LETTERS = ['A', 'B', 'C', 'D', 'E'];

  PP.gens = {};   // code -> function(level, rng, k) returning a draft question or null

  /* Build a finished question from a draft: correct answer + wrong answers (html strings). */
  PP.mk = function (r, d) {
    const seen = new Set([String(d.correct)]);
    const wrong = [];
    for (const w of d.wrong) { if (!seen.has(String(w))) { seen.add(String(w)); wrong.push(w); } }
    if (wrong.length < 4) return null;
    const all = PP.shuffle(r, [{ h: d.correct, ok: true }].concat(wrong.slice(0, 4).map(h => ({ h, ok: false }))));
    return { stem: d.stem, opts: all.map(o => o.h), ans: all.findIndex(o => o.ok), exp: d.exp, key: d.key || d.stem, svgOpts: !!d.svgOpts, dbg: d.dbg };
  };

  const cache = {};
  PP.pool = function (code, lv) {
    const ck = code + lv;
    if (cache[ck]) return cache[ck];
    const need = PP.POOL[lv], out = [], keys = new Set();
    const gen = PP.gens[code];
    for (let k = 0; k < 40000 && out.length < need; k++) {
      const r = PP.rng(PP.hash(code + '|' + lv + '|' + k));
      let q = null;
      try { q = gen(lv, r, k, out.length); } catch (e) { q = null; }
      if (!q || keys.has(q.key)) continue;
      keys.add(q.key);
      q.id = code + '-' + lv + '-' + out.length;
      q.sec = code; q.lv = lv;
      out.push(q);
    }
    cache[ck] = out;
    return out;
  };
  PP.get = function (id) {
    const p = id.split('-');
    return PP.pool(p[0], p[1])[+p[2]];
  };
})();
