/* Figure Matrices (FM) and Figure Classification (FC). */
(function () {
  const PP = window.PP, ri = PP.ri, pick = PP.pick;
  const SHAPES = PP.SHAPES;

  /* ---------------- Figure Matrices ---------------- */
  const ATTRS = ['shape', 'fill', 'count', 'size'];
  const LABEL = { shape: 'shape', fill: 'color', count: 'number of shapes', size: 'size' };
  const RULEF = {
    col: (r, c) => c, row: (r, c) => r, latin: (r, c) => (r + c) % 3, latinb: (r, c) => (r + 2 * c) % 3
  };

  function values(r, attr, sorted) {
    let v;
    if (attr === 'shape') v = PP.shuffle(r, SHAPES).slice(0, 3);
    else if (attr === 'fill') v = [0, 1, 2];
    else if (attr === 'count') v = [1, 2, 3];
    else v = [0, 1, 2];
    return sorted ? v : PP.shuffle(r, v);
  }
  const constVal = (r, attr) => attr === 'shape' ? pick(r, SHAPES) : attr === 'fill' ? pick(r, [0, 1, 2]) : attr === 'count' ? pick(r, [1, 2]) : pick(r, [1, 2]);

  PP.gens.FM = function (lv, r) {
    let plan; // attr -> rule
    const attrs = PP.shuffle(r, ATTRS);
    if (lv === 'e') plan = { [attrs[0]]: pick(r, ['row', 'col']) };
    else if (lv === 'a') {
      if (r() < 0.5) plan = { [attrs[0]]: 'row', [attrs[1]]: 'col' };
      else plan = { [attrs[0]]: pick(r, ['latin', 'latinb']) };
    } else {
      const roll = r();
      if (roll < 0.4) plan = { [attrs[0]]: pick(r, ['latin', 'latinb']), [attrs[1]]: pick(r, ['row', 'col']) };
      else if (roll < 0.75) plan = { [attrs[0]]: pick(r, ['latin', 'latinb']), [attrs[1]]: 'row', [attrs[2]]: 'col' };
      else plan = { [attrs[0]]: 'latin', [attrs[1]]: 'latinb' };
    }
    const vals = {}, cons = {};
    ATTRS.forEach(a => { if (plan[a]) vals[a] = values(r, a, (a === 'count' || a === 'size') && r() < 0.6); else cons[a] = constVal(r, a); });
    const cell = (rr, cc) => {
      const o = {};
      ATTRS.forEach(a => { o[a] = plan[a] ? vals[a][RULEF[plan[a]](rr, cc)] : cons[a]; });
      return o;
    };
    const grid = [];
    for (let rr = 0; rr < 3; rr++) for (let cc = 0; cc < 3; cc++) grid.push(cell(rr, cc));
    const ans = grid[8];
    // distractors: change one attribute of the answer (varying attributes first)
    const cand = [];
    ATTRS.forEach(a => {
      const pool = a === 'shape' ? SHAPES : a === 'count' ? [1, 2, 3] : [0, 1, 2];
      pool.forEach(v => { if (v !== ans[a]) { const o = Object.assign({}, ans); o[a] = v; cand.push({ o, pri: plan[a] ? 0 : 1, rnd: r() }); } });
    });
    cand.sort((x, y) => (x.pri - y.pri) || (x.rnd - y.rnd));
    const wrong = [], seen = new Set([PP.figKey(ans)]);
    for (const c of cand) { const k = PP.figKey(c.o); if (!seen.has(k)) { seen.add(k); wrong.push(c.o); } if (wrong.length === 4) break; }
    if (wrong.length < 4) return null;
    // draw the 3x3 grid
    let g = '';
    for (let rr = 0; rr < 3; rr++) for (let cc = 0; cc < 3; cc++) {
      const x = cc * 106, y = rr * 106;
      if (rr === 2 && cc === 2) g += '<g transform="translate(' + x + ',' + y + ')"><rect x="2" y="2" width="96" height="96" rx="8" fill="#ffffff" stroke="#6B7AA1" stroke-width="2.5" stroke-dasharray="6 5"/><text x="50" y="65" text-anchor="middle" font-size="46" font-weight="800" fill="#6B7AA1" font-family="Fredoka,sans-serif">?</text></g>';
      else g += '<g transform="translate(' + x + ',' + y + ')"><rect x="2" y="2" width="96" height="96" rx="8" fill="#ffffff" stroke="#C9D8F0" stroke-width="2"/>' + PP.figG(grid[rr * 3 + cc]) + '</g>';
    }
    const stem = '<p class="q">Look at the grid. Which figure goes in the empty box?</p><svg class="matrix" viewBox="0 0 312 312" role="img" aria-label="3 by 3 grid of figures with the bottom right box empty">' + g + '</svg>';
    const rules = Object.keys(plan).map(a => {
      const t = plan[a], L = LABEL[a];
      if (t === 'col') return 'The ' + L + ' changes as you go across each row.';
      if (t === 'row') return 'The ' + L + ' changes as you go down each column.';
      return 'Each row and each column uses all three kinds of ' + L + ', with none repeated.';
    });
    const exp = rules.join(' ') + ' So the missing figure is ' + PP.figDesc(ans) + '.';
    const key = grid.map(PP.figKey).join('|');
    return PP.mk(r, { stem, correct: PP.figSVG(ans), wrong: wrong.map(PP.figSVG), exp, key, svgOpts: true });
  };

  /* ---------------- Figure Classification ---------------- */
  const VALN = {
    shape: v => v + 's', fill: v => PP.FILLN[v] + ' figures', count: v => (v === 1 ? 'one shape' : v + ' shapes'), size: v => PP.SIZEN[v] + ' figures', rot: v => 'arrows pointing ' + ({ 0: 'up', 90: 'right', 180: 'down', 270: 'left' }[v])
  };
  const DOM = {
    shape: SHAPES, fill: [0, 1, 2], count: [1, 2, 3], size: [0, 1, 2], rot: [0, 90, 180, 270]
  };
  function valuesFor(r, a, n) { return PP.shuffle(r, DOM[a]).slice(0, n); }

  PP.gens.FC = function (lv, r) {
    let attrs, common;      // attrs in play; common = attributes shared by the three
    if (lv === 'e') { attrs = ['shape', 'fill', 'count']; common = [pick(r, ['shape', 'fill'])]; }
    else if (lv === 'a') { attrs = ['shape', 'fill', 'count', 'size']; common = [pick(r, ['shape', 'fill', 'count', 'size'])]; }
    else {
      const k = r();
      if (k < 0.3) { attrs = ['fill', 'count', 'size', 'rot']; common = ['rot']; }
      else if (k < 0.6) { attrs = ['shape', 'fill', 'count', 'size']; common = pick(r, [['shape', 'fill'], ['shape', 'count'], ['fill', 'size'], ['count', 'size']]); }
      else { attrs = ['shape', 'fill', 'count', 'size']; common = pick(r, [['shape', 'size'], ['fill', 'count'], ['shape', 'fill']]); }
    }
    const base = a => (a === 'rot' ? 0 : a === 'shape' ? 'circle' : a === 'fill' ? 0 : a === 'count' ? 1 : 1);
    const full = (o) => {
      const f = { shape: 'circle', fill: 0, count: 1, size: 1, rot: 0 };
      if (attrs.includes('rot')) f.shape = 'arrow';
      return Object.assign(f, o);
    };
    const cv = {}; common.forEach(a => { cv[a] = pick(r, DOM[a]); });
    const others = attrs.filter(a => !common.includes(a));
    const ov = {}; others.forEach(a => { ov[a] = valuesFor(r, a, 3); });
    const three = [0, 1, 2].map(i => { const o = Object.assign({}, cv); others.forEach(a => { o[a] = ov[a][i]; }); return full(o); });
    const mkOpt = (comm) => { const o = Object.assign({}, comm); others.forEach(a => { o[a] = pick(r, DOM[a]); }); return full(o); };
    const correct = mkOpt(cv);
    const wrong = [], seen = new Set([PP.figKey(correct)]);
    let tries = 0;
    while (wrong.length < 4 && tries++ < 200) {
      const c2 = Object.assign({}, cv);
      const flip = common.length === 1 ? common : (r() < 0.7 ? [pick(r, common)] : common);
      flip.forEach(a => { const alt = DOM[a].filter(v => v !== cv[a]); c2[a] = pick(r, alt); });
      let o;
      if (r() < 0.6) { o = Object.assign({}, three[ri(r, 0, 2)]); flip.forEach(a => { o[a] = c2[a]; }); }
      else o = mkOpt(c2);
      const k = PP.figKey(o);
      if (!seen.has(k)) { seen.add(k); wrong.push(o); }
    }
    if (wrong.length < 4) return null;
    let g = '';
    three.forEach((f, i) => { g += '<g transform="translate(' + (i * 106) + ',0)"><rect x="2" y="2" width="96" height="96" rx="8" fill="#ffffff" stroke="#C9D8F0" stroke-width="2"/>' + PP.figG(f) + '</g>'; });
    const stem = '<p class="q">How are these three figures alike? Pick the figure that is most like them.</p><svg class="trio" viewBox="0 0 312 100" role="img" aria-label="three figures that are alike">' + g + '</svg>';
    const parts = common.map(a => VALN[a](cv[a]));
    const exp = (common.length > 1 ? 'The three figures share two features: ' + parts.join(' and ') + '.' : 'The three figures are all ' + parts[0] + '.') + ' The right answer keeps ' + (common.length > 1 ? 'both of those features' : 'that same feature') + '. The other figures break it.';
    const key = three.map(PP.figKey).sort().join('|') + '#' + common.join('+');
    return PP.mk(r, { stem, correct: PP.figSVG(correct), wrong: wrong.map(PP.figSVG), exp, key, svgOpts: true });
  };
})();
