/* Figure Matrices (FM) and Figure Classification (FC), built to match the grade 3 CCAT format:
   - FM: a 2x2 grid. The top pair shows a change (turn, flip, shading, size, number).
         The child does the same change to the bottom-left figure.
   - FC: three figures share a geometric rule (number of sides, curved sides, equal parts,
         fraction shaded, same shape inside). Colour, size and turning vary so they are never the clue. */
(function () {
  const PP = window.PP, ri = PP.ri, pick = PP.pick, G = PP.GEO;
  const FILLN = ['white', 'gray', 'black'];

  /* ---------------- Figure Matrices ---------------- */
  const I = [1, 0, 0, 1];
  const TURN = {
    rot90: [0, 1, -1, 0], rot270: [0, -1, 1, 0], rot180: [-1, 0, 0, -1], flipH: [-1, 0, 0, 1], flipV: [1, 0, 0, -1]
  };
  // matrix(a,b,c,d) maps x' = a x + c y, y' = b x + d y ; mul(T, O) = do O first, then T
  const mul = (T, O) => [T[0] * O[0] + T[2] * O[1], T[1] * O[0] + T[3] * O[1], T[0] * O[2] + T[2] * O[3], T[1] * O[2] + T[3] * O[3]];
  const D4 = [I, TURN.rot90, TURN.rot180, TURN.rot270, TURN.flipH, TURN.flipV, [0, 1, 1, 0], [0, -1, -1, 0]];
  const TURNTXT = {
    rot90: 'turns a quarter turn to the right (clockwise)', rot270: 'turns a quarter turn to the left (counter-clockwise)',
    rot180: 'turns upside down (a half turn)', flipH: 'flips over from left to right, like a mirror', flipV: 'flips over from top to bottom'
  };
  const GLYPHS = ['L', 'flag', 'wedge'];
  const PLAIN = ['circle', 'sq', 'tri', 'hex', 'star', 'rhomb', 'pent'];

  const PLANS = {
    e: [['shade'], ['size'], ['count'], ['rot180'], ['flipH']],
    a: [['rot90'], ['rot270'], ['flipH'], ['flipV'], ['rot180'], ['shade', 'size'], ['shade', 'count']],
    c: [['rot90', 'shade'], ['rot270', 'shade'], ['flipH', 'size'], ['flipV', 'shade'], ['rot90', 'count'], ['rot270', 'size'], ['flipH', 'count'], ['rot180', 'shade']]
  };

  PP.gens.FM = function (lv, r) {
    const plan = pick(r, PLANS[lv]);
    const turn = plan.find(p => TURN[p]);
    const hasSize = plan.includes('size'), hasCount = plan.includes('count'), hasShade = plan.includes('shade');
    const pool = turn ? GLYPHS : PLAIN;
    const [sa, sb] = PP.shuffle(r, pool);
    const start = turn ? pick(r, D4) : I;
    // top-left figure A and bottom-left figure B start the same way (same turn, size, number, and shading when shading changes)
    const A = { s: sa, fill: ri(r, 0, 2), z: hasCount ? 1 : ri(r, 0, 2), c: hasSize ? 1 : ri(r, 1, hasCount ? 2 : 1), o: start };
    if (hasCount) A.z = 1;
    const B = { s: sb, fill: hasShade ? A.fill : ri(r, 0, 2), z: A.z, c: A.c, o: start };
    // the change
    const to = {};
    if (hasShade) to.fill = pick(r, [0, 1, 2].filter(v => v !== A.fill));
    if (hasSize) to.z = pick(r, [0, 1, 2].filter(v => v !== A.z));
    if (hasCount) to.c = pick(r, [1, 2, 3].filter(v => v !== A.c));
    const apply = f => { const o = Object.assign({}, f, to); if (turn) o.o = mul(TURN[turn], f.o); return o; };
    const A2 = apply(A), ans = apply(B);
    // wrong answers: classic traps first
    const cand = [];
    if (turn) Object.keys(TURN).filter(t => t !== turn).forEach(t => cand.push(Object.assign({}, ans, { o: mul(TURN[t], B.o) })));
    cand.push(Object.assign({}, B));                                       // nothing changed
    if (hasShade) [0, 1, 2].forEach(v => cand.push(Object.assign({}, ans, { fill: v })));
    if (hasSize) [0, 1, 2].forEach(v => cand.push(Object.assign({}, ans, { z: v })));
    if (hasCount) [1, 2, 3].forEach(v => cand.push(Object.assign({}, ans, { c: v, z: 1 })));
    if (turn && plan.length > 1) cand.push(Object.assign({}, B, { o: ans.o }));  // turned, but forgot the other change
    if (plan.length > 1 && turn) cand.push(Object.assign({}, ans, { o: B.o })); // other change, but forgot to turn
    cand.push(Object.assign({}, A2));                                      // copied the top-right figure
    cand.push(Object.assign({}, ans, { s: sa }));                          // right change, wrong shape
    cand.push(Object.assign({}, A));                                       // copied the top-left figure
    if (!hasSize && ans.c === 1) [0, 1, 2].forEach(v => cand.push(Object.assign({}, ans, { z: v })));   // a change that did not happen
    if (!hasCount) cand.push(Object.assign({}, ans, { c: ans.c === 1 ? 2 : 1, z: 1 }));
    if (!hasShade) [0, 1, 2].forEach(v => cand.push(Object.assign({}, ans, { fill: v })));
    const seen = new Set([PP.mxKey(ans)]), wrong = [];
    // keep the strongest traps, but shuffle within the list so positions vary
    const strong = cand.slice(0, turn ? 4 : 3), rest = PP.shuffle(r, cand.slice(turn ? 4 : 3));
    for (const c of PP.shuffle(r, strong).concat(rest)) {
      const k = PP.mxKey(c);
      if (!seen.has(k)) { seen.add(k); wrong.push(c); }
      if (wrong.length === 4) break;
    }
    if (wrong.length < 4) return null;
    const cell = (x, y, f) => '<g transform="translate(' + x + ',' + y + ')"><rect x="2" y="2" width="96" height="96" rx="8" fill="#ffffff" stroke="#C9D8F0" stroke-width="2"/>' + PP.mxG(f) + '</g>';
    const g = cell(0, 0, A) + cell(112, 0, A2) + cell(0, 112, B) +
      '<g transform="translate(112,112)"><rect x="2" y="2" width="96" height="96" rx="8" fill="#ffffff" stroke="#6B7AA1" stroke-width="2.5" stroke-dasharray="6 5"/><text x="50" y="65" text-anchor="middle" font-size="46" font-weight="800" fill="#6B7AA1" font-family="Nunito,sans-serif">?</text></g>' +
      '<text x="106" y="58" text-anchor="middle" font-size="18" font-weight="800" fill="#6B7AA1">→</text><text x="106" y="170" text-anchor="middle" font-size="18" font-weight="800" fill="#6B7AA1">→</text>';
    const stem = '<p class="q">The top two boxes show a change. Make the same change to the bottom figure. Which figure goes in the empty box?</p><svg class="matrix" viewBox="0 0 212 212" role="img" aria-label="2 by 2 grid of figures with the bottom right box empty">' + g + '</svg>';
    const say = [];
    if (turn) say.push(TURNTXT[turn]);
    if (hasShade) say.push('changes from ' + FILLN[A.fill] + ' to ' + FILLN[to.fill]);
    if (hasSize) say.push('gets ' + (to.z > A.z ? 'bigger' : 'smaller'));
    if (hasCount) say.push('goes from ' + A.c + ' to ' + to.c + (to.c > 1 ? ' figures' : ' figure'));
    const exp = 'In the top row, the figure ' + say.join(' and ') + '. Do the same to the bottom figure.';
    const key = [A, A2, B].map(PP.mxKey).join('|');
    const tag = plan.map(p => p === 'rot270' ? 'rot90' : p === 'flipV' ? 'flipH' : p).map(p => p === 'flipH' ? 'flip' : p).join('+');
    return PP.mk(r, { stem, correct: PP.mxSVG(ans), wrong: wrong.map(PP.mxSVG), exp, key, tag, svgOpts: true });
  };

  /* ---------------- Figure Classification ---------------- */
  const BY_SIDES = { 3: ['tri', 'rtri', 'tall', 'scal'], 4: ['sq', 'rect', 'rhomb', 'para', 'trap', 'kite'], 5: ['pent', 'house', 'tag', 'pent2'], 6: ['hex', 'longhex', 'hex2', 'lsix'] };
  const CURVED = ['circle', 'oval', 'semi', 'quarter', 'arch'];
  const ALLPOLY = [].concat(BY_SIDES[3], BY_SIDES[4], BY_SIDES[5], BY_SIDES[6]);
  const PARTABLE = Object.keys(PP.PARTS);
  const INNER = ['circle', 'sq', 'tri', 'hex', 'rhomb', 'pent', 'star'];
  const ROT = r => pick(r, [0, 0, 15, 30, 45, 90, 180, 200, 270, 330]);

  /* what a figure "has" — used to make sure exactly one answer shares everything the three figures share */
  function feats(f) {
    const sides = G[f.s].sides;
    const o = { shape: f.s, sides: sides === 0 ? 'curved' : sides, curved: sides === 0, size: f.z, inner: f.inner ? (f.inner === f.s ? 'same' : 'diff') : 'none', innerShape: f.inner || '-' };
    if (f.n > 1) { o.parts = f.n; o.shaded = (f.sh || []).length; o.frac = +((f.sh || []).length / f.n).toFixed(3); o.fill = 'parts'; }
    else { o.parts = 1; o.shaded = f.fill ? 1 : 0; o.frac = f.fill ? 1 : 0; o.fill = f.fill || 0; }
    return o;
  }
  const RULES = {
    e: ['sides3', 'sides4', 'curved', 'half'],
    a: ['sides5', 'sides6', 'parts', 'insame', 'quarter'],
    c: ['halfany', 'sides5', 'sides6', 'insame', 'third']
  };
  const RULE_TXT = {
    sides3: 'all have 3 straight sides', sides4: 'all have 4 straight sides', sides5: 'all have 5 straight sides', sides6: 'all have 6 straight sides',
    curved: 'all have a curved side', half: 'all are cut into 2 equal parts with 1 part shaded (half shaded)', parts: 'are all cut into the same number of equal parts',
    insame: 'all have a smaller copy of the same shape inside', quarter: 'all are cut into 4 equal parts with 1 part shaded (one quarter shaded)',
    halfany: 'all have exactly half of their parts shaded, even though they are cut into different numbers of parts', third: 'all are cut into 3 equal parts with 1 part shaded (one third shaded)'
  };
  const shadeSet = (r, n, k) => PP.shuffle(r, [...Array(n).keys()]).slice(0, k);
  const partFig = (r, s, n, k, extra) => Object.assign({ s, z: ri(r, 1, 2), rot: s === 'circle' ? 0 : pick(r, [0, 0, 90, 180]), n, sh: shadeSet(r, n, k), shc: pick(r, [1, 2]) }, extra || {});
  const shapesWith = n => PARTABLE.filter(s => PP.PARTS[s][n]);

  PP.gens.FC = function (lv, r) {
    const rule = pick(r, RULES[lv]);
    const noise = lv === 'c';        // challenging: extra details that do not matter
    let three = [], correct = null, wrong = [];
    const fz = () => ri(r, 0, 2), ff = () => ri(r, 0, 2);
    const addInner = f => { if (noise && r() < 0.35 && !f.n) { f.inner = pick(r, INNER.filter(x => x !== f.s)); f.ifill = (f.fill + 1 + ri(r, 0, 1)) % 3; } return f; };
    if (rule.startsWith('sides') || rule === 'curved') {
      const pool = rule === 'curved' ? CURVED : BY_SIDES[+rule.slice(5)];
      const other = rule === 'curved' ? ALLPOLY : ALLPOLY.filter(s => !pool.includes(s)).concat(CURVED);
      const ss = PP.shuffle(r, pool).slice(0, 4);
      if (ss.length < 4) return null;
      const fills = PP.shuffle(r, [0, 1, 2]), sizes = PP.shuffle(r, [0, 1, 2]);
      three = ss.slice(0, 3).map((s, i) => addInner({ s, z: sizes[i], rot: ROT(r), fill: fills[i] }));
      correct = { s: ss[3], z: fz(), rot: ROT(r), fill: ff() };
      // near misses: one side more or fewer first, then curved or other shapes; colours and sizes borrowed from the three
      const n = rule === 'curved' ? 0 : +rule.slice(5);
      const near = n ? [].concat(BY_SIDES[n - 1] || [], BY_SIDES[n + 1] || []) : ['sq', 'tri', 'hex', 'rect', 'rhomb', 'pent'];
      PP.shuffle(r, near).concat(PP.shuffle(r, other)).forEach(s => { if (wrong.length < 6 && !wrong.some(w => w.s === s)) wrong.push({ s, z: pick(r, sizes), rot: ROT(r), fill: pick(r, fills) }); });
    } else if (rule === 'insame') {
      const ss = PP.shuffle(r, INNER).slice(0, 4), fills = PP.shuffle(r, [0, 1, 2]), sizes = PP.shuffle(r, [1, 2, 1]);
      const mkIn = (s, inner, i) => ({ s, z: sizes[i % 3], rot: s === 'circle' ? 0 : ROT(r), fill: fills[i % 3], inner, ifill: (fills[i % 3] + 1 + ri(r, 0, 1)) % 3 });
      three = ss.slice(0, 3).map((s, i) => mkIn(s, s, i));
      correct = mkIn(ss[3], ss[3], ri(r, 0, 2));
      PP.shuffle(r, INNER).forEach((s, i) => { const inn = pick(r, INNER.filter(x => x !== s)); wrong.push(mkIn(s, inn, i)); });
      wrong.push(Object.assign(mkIn(ss[3], null, 1), { inner: null }));
    } else {
      // parts and fractions
      const spec = { half: [2, 1], quarter: [4, 1], third: [3, 1], parts: [pick(r, [2, 3, 4]), 0] }[rule];
      if (rule === 'halfany') {
        const opts = [[2, 1], [4, 2], [6, 3]];
        const pickFig = () => { const [n, k] = pick(r, opts); return partFig(r, pick(r, shapesWith(n)), n, k); };
        for (let t = 0; t < 30 && three.length < 3; t++) { const f = pickFig(); if (!three.some(x => x.n === f.n && x.s === f.s)) three.push(f); }
        if (new Set(three.map(f => f.n)).size < 2) return null;     // the number of parts must differ, so only the fraction is the rule
        correct = pickFig();
        [[4, 1], [4, 3], [3, 1], [3, 2], [6, 2], [2, 0], [2, 2], [6, 4]].forEach(([n, k]) => wrong.push(partFig(r, pick(r, shapesWith(n)), n, k)));
      } else {
        const [n, k] = spec;
        const ss = PP.shuffle(r, shapesWith(n));
        if (ss.length < 3) return null;
        three = ss.slice(0, 3).map(s => partFig(r, s, n, k));
        correct = partFig(r, pick(r, ss), n, k);
        const alt = rule === 'parts' ? [2, 3, 4, 6].filter(m => m !== n).map(m => [m, 0]) : [[n, 0], [n, Math.min(n, k + 1)], [n === 4 ? 3 : 4, k], [n === 2 ? 3 : 2, k], [n, n]];
        alt.forEach(([m, kk]) => { const sh = PP.shuffle(r, shapesWith(m)); sh.slice(0, 2).forEach(x => wrong.push(partFig(r, x, m, kk))); });
      }
    }
    // check: the right answer must share EVERYTHING the three share, and every wrong answer must miss something
    const F = three.map(feats), common = {};
    Object.keys(F[0]).forEach(k => { if (F.every(x => x[k] === F[0][k])) common[k] = F[0][k]; });
    const fits = f => { const x = feats(f); return Object.keys(common).every(k => x[k] === common[k]); };
    if (!fits(correct)) return null;
    const seen = new Set(three.concat([correct]).map(PP.geoKey)), ok = [];
    for (const w of PP.shuffle(r, wrong.slice(0, 3)).concat(PP.shuffle(r, wrong.slice(3)))) {
      const k = PP.geoKey(w);
      if (fits(w) || seen.has(k)) continue;
      seen.add(k); ok.push(w);
      if (ok.length === 4) break;
    }
    if (ok.length < 4) return null;
    let g = '';
    three.forEach((f, i) => { g += '<g transform="translate(' + (i * 106) + ',0)"><rect x="2" y="2" width="96" height="96" rx="8" fill="#ffffff" stroke="#C9D8F0" stroke-width="2"/>' + PP.geoG(f) + '</g>'; });
    const stem = '<p class="q">How are these three figures alike? Pick the figure that is most like them.</p><svg class="trio" viewBox="0 0 312 100" role="img" aria-label="three figures that are alike">' + g + '</svg>';
    const exp = 'The three figures ' + RULE_TXT[rule] + '. Colour, size and which way they are turned do not matter. The right answer follows the same rule, and the others break it.';
    const key = three.map(PP.geoKey).sort().join('|') + '#' + rule;
    const tag = rule.startsWith('sides') ? 'sides' : rule;
    return PP.mk(r, { stem, correct: PP.geoSVG(correct), wrong: ok.map(PP.geoSVG), exp, key, tag, svgOpts: true });
  };
})();
