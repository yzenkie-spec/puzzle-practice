/* Paper Folding (PF): a square is folded, a hole is punched, pick the unfolded paper. */
(function () {
  const PP = window.PP, ri = PP.ri, pick = PP.pick;
  const PAPER = '#E9EEFB', INK = '#1F2A44', FOLD = '#C2410C';

  const SYM = [
    (x, y) => [x, y], (x, y) => [1 - y, x], (x, y) => [1 - x, 1 - y], (x, y) => [y, 1 - x],
    (x, y) => [1 - x, y], (x, y) => [x, 1 - y], (x, y) => [y, x], (x, y) => [1 - y, 1 - x]
  ];
  const V = [[0.5, 0], [0.5, 1]], VR = [[0.5, 0], [1, 0], [1, 1], [0.5, 1]];
  const CFG = {
    V1: [{ a: [0.5, 0], b: [0.5, 1], region: VR }],
    D1: [{ a: [0, 0], b: [1, 1], region: [[0, 0], [1, 0], [1, 1]] }],
    VH: [{ a: [0.5, 0], b: [0.5, 1], region: VR }, { a: [0.5, 0.5], b: [1, 0.5], region: [[0.5, 0.5], [1, 0.5], [1, 1], [0.5, 1]] }],
    VV: [{ a: [0.5, 0], b: [0.5, 1], region: VR }, { a: [0.75, 0], b: [0.75, 1], region: [[0.75, 0], [1, 0], [1, 1], [0.75, 1]] }],
    DA: [{ a: [0, 0], b: [1, 1], region: [[0, 0], [1, 0], [1, 1]] }, { a: [1, 0], b: [0.5, 0.5], region: [[1, 0], [1, 1], [0.5, 0.5]] }]
  };
  const LEVELCFG = { e: [['V1', 1]], a: [['D1', 1], ['V1', 2], ['VH', 1]], c: [['VV', 1], ['DA', 1], ['D1', 2], ['VH', 1]] };

  const reflect = (p, a, b) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], vx = p[0] - a[0], vy = p[1] - a[1];
    const t = (vx * dx + vy * dy) / (dx * dx + dy * dy);
    return [a[0] + 2 * t * dx - vx, a[1] + 2 * t * dy - vy];
  };
  const segDist = (p, a, b) => {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy); t = Math.max(0, Math.min(1, t));
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
  };
  const inPoly = (p, poly) => {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i], b = poly[j];
      if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
    }
    return c;
  };
  const centroid = poly => [poly.reduce((s, p) => s + p[0], 0) / poly.length, poly.reduce((s, p) => s + p[1], 0) / poly.length];
  const holeKey = H => H.map(p => Math.round(p[0] * 40) + ',' + Math.round(p[1] * 40)).sort().join(';');
  const minSep = H => { let m = 9; for (let i = 0; i < H.length; i++) for (let j = i + 1; j < H.length; j++) m = Math.min(m, Math.hypot(H[i][0] - H[j][0], H[i][1] - H[j][1])); return m; };

  function unfold(holes, folds, from) {
    let H = holes.slice();
    for (let i = folds.length - 1; i >= (from || 0); i--) H = H.concat(H.map(p => reflect(p, folds[i].a, folds[i].b)));
    return H;
  }

  const U = 88, O = 6;
  const X = (x, ox) => (ox + O + U * x).toFixed(1), Y = y => (O + U * y).toFixed(1);
  const polyPts = (poly, ox) => poly.map(p => X(p[0], ox) + ',' + Y(p[1])).join(' ');
  function holeMarks(H, ox) { return H.map(p => '<circle cx="' + X(p[0], ox) + '" cy="' + Y(p[1]) + '" r="4.6" fill="#fff" stroke="' + INK + '" stroke-width="2"/>').join(''); }

  function panel(poly, ox, fold, holes, ghost) {
    let s = '';
    if (ghost) s += '<polygon points="' + polyPts([[0, 0], [1, 0], [1, 1], [0, 1]], ox) + '" fill="none" stroke="#B9C3DC" stroke-width="1.5" stroke-dasharray="3 4"/>';
    s += '<polygon points="' + polyPts(poly, ox) + '" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="2.5" stroke-linejoin="round"/>';
    if (fold) {
      s += '<line x1="' + X(fold.a[0], ox) + '" y1="' + Y(fold.a[1]) + '" x2="' + X(fold.b[0], ox) + '" y2="' + Y(fold.b[1]) + '" stroke="' + FOLD + '" stroke-width="2.6" stroke-dasharray="6 5"/>';
      const kc = centroid(fold.region), m = reflect(kc, fold.a, fold.b);
      const ax = +X(m[0], ox), ay = +Y(m[1]), bx = +X(kc[0], ox), by = +Y(kc[1]);
      const ang = Math.atan2(by - ay, bx - ax), hl = 9;
      s += '<line x1="' + ax + '" y1="' + ay + '" x2="' + bx + '" y2="' + by + '" stroke="' + FOLD + '" stroke-width="3"/>' +
        '<polygon points="' + bx + ',' + by + ' ' + (bx - hl * Math.cos(ang - 0.45)).toFixed(1) + ',' + (by - hl * Math.sin(ang - 0.45)).toFixed(1) + ' ' + (bx - hl * Math.cos(ang + 0.45)).toFixed(1) + ',' + (by - hl * Math.sin(ang + 0.45)).toFixed(1) + '" fill="' + FOLD + '"/>';
    }
    if (holes) s += holeMarks(holes, ox);
    return s;
  }

  function optSVG(H) {
    return '<svg class="fig" viewBox="0 0 100 100" role="img" aria-label="unfolded paper with holes"><polygon points="' + polyPts([[0, 0], [1, 0], [1, 1], [0, 1]], 0) + '" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="2.5"/>' + holeMarks(H, 0) + '</svg>';
  }

  PP._pf = { reflect, inPoly };
  PP.gens.PF = function (lv, r) {
    const [name, nHoles] = pick(r, LEVELCFG[lv]);
    const T = SYM[ri(r, 0, 7)];
    const foldsC = CFG[name];
    const folds = foldsC.map(f => ({ a: T(...f.a), b: T(...f.b), region: f.region.map(p => T(...p)) }));
    const finalC = foldsC[foldsC.length - 1].region;
    const finalR = folds[folds.length - 1].region;
    // choose hole positions inside the final folded region (canonical orientation, then transformed)
    const holes = [];
    let tries = 0;
    while (holes.length < nHoles && tries++ < 300) {
      const xs = finalC.map(p => p[0]), ys = finalC.map(p => p[1]);
      const px = Math.round((Math.min(...xs) + r() * (Math.max(...xs) - Math.min(...xs))) * 16) / 16;
      const py = Math.round((Math.min(...ys) + r() * (Math.max(...ys) - Math.min(...ys))) * 16) / 16;
      const p = [px, py];
      if (!inPoly(p, finalC)) continue;
      let ok = true;
      for (let i = 0; i < finalC.length; i++) if (segDist(p, finalC[i], finalC[(i + 1) % finalC.length]) < 0.09) ok = false;
      for (const h of holes) if (Math.hypot(h[0] - p[0], h[1] - p[1]) < 0.2) ok = false;
      if (ok) holes.push(T(...p));
    }
    if (holes.length < nHoles) return null;
    const correctH = unfold(holes, folds);
    if (minSep(correctH) < 0.13) return null;
    if (correctH.some(p => p[0] < 0.06 || p[0] > 0.94 || p[1] < 0.06 || p[1] > 0.94)) return null;
    const ck = holeKey(correctH);
    // wrong answers
    const cand = [];
    const flipX = H => H.map(p => [1 - p[0], p[1]]), flipY = H => H.map(p => [p[0], 1 - p[1]]);
    cand.push(unfold(holes, folds, folds.length - 1));                 // only the last fold undone
    if (folds.length > 1) cand.push(unfold(holes, folds.slice(0, 1).concat([]), 0).concat(holes.length ? [] : []));
    cand.push(holes.slice());                                           // no unfolding at all
    const wrongAxis = (ax) => { let H = holes.slice(); for (let i = folds.length - 1; i >= 0; i--) H = H.concat(H.map(p => ax(p))); return H; };
    cand.push(wrongAxis(p => [1 - p[0], p[1]]));
    cand.push(wrongAxis(p => [p[0], 1 - p[1]]));
    cand.push(wrongAxis(p => [p[1], p[0]]));
    cand.push(wrongAxis(p => [1 - p[1], 1 - p[0]]));
    cand.push(flipX(correctH)); cand.push(flipY(correctH));
    cand.push(correctH.map(p => [1 - p[1], p[0]]));
    const dropOne = correctH.slice(); dropOne.splice(ri(r, 0, dropOne.length - 1), 1); cand.push(dropOne);
    const moved = correctH.slice(); { const i = ri(r, 0, moved.length - 1); moved[i] = [moved[i][1], moved[i][0]]; } cand.push(moved);
    const extra = correctH.concat([[0.25 + r() * 0.5, 0.25 + r() * 0.5]]); cand.push(extra);
    const seen = new Set([ck]), wrong = [];
    for (const H of PP.shuffle(r, cand)) {
      if (!H.length || minSep(H) < 0.1) continue;
      const k = holeKey(H);
      if (!seen.has(k)) { seen.add(k); wrong.push(optSVG(H)); }
      if (wrong.length === 4) break;
    }
    if (wrong.length < 4) return null;
    // stem: one panel per step
    const n = folds.length + 1, W = 100 + 26, total = n * 100 + (n - 1) * 26;
    let g = '';
    for (let i = 0; i < n; i++) {
      const ox = i * W;
      const poly = i === 0 ? [[0, 0], [1, 0], [1, 1], [0, 1]] : folds[i - 1].region;
      g += panel(poly, ox, i < folds.length ? folds[i] : null, i === folds.length ? holes : null, i > 0);
      if (i < n - 1) g += '<text x="' + (ox + 100 + 13) + '" y="58" text-anchor="middle" font-size="22" font-weight="800" fill="#6B7AA1">→</text>';
    }
    const stem = '<p class="q">The paper is folded along the dashed lines, and a hole is punched. How does the paper look when it is unfolded?</p><svg class="pfsteps" viewBox="0 0 ' + total + ' 100" role="img" aria-label="paper folding steps">' + g + '</svg>';
    const exp = 'Each hole is copied on the other side of every fold line, like a mirror. ' + (folds.length > 1 ? 'Unfold one fold at a time, starting with the last fold, and copy the holes across each fold line.' : 'Unfold the paper and copy the hole across the fold line.') + ' That gives ' + correctH.length + ' holes in total.';
    return PP.mk(r, { stem, correct: optSVG(correctH), wrong, exp, key: name + '|' + ck + '|' + holeKey(holes), tag: name, svgOpts: true, dbg: { holes, folds, correctH } });
  };
})();
