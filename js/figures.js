/* Figure drawing: shapes with fill, count, size, direction. Used by Figure Matrices and Figure Classification. */
(function () {
  const PP = window.PP;
  const INK = '#1F2A44', GRAY = '#A9B4CE';
  PP.INK = INK;
  const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'star', 'hexagon'];
  PP.SHAPES = SHAPES;
  PP.FILLN = ['white', 'gray', 'black'];
  PP.SIZEN = ['small', 'medium', 'large'];

  const pts = a => a.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  function shapeMarkup(shape, r, fill, rot) {
    const f = fill === 0 ? '#ffffff' : fill === 1 ? GRAY : INK;
    const st = 'fill="' + f + '" stroke="' + INK + '" stroke-width="2.6" stroke-linejoin="round"';
    let m = '';
    if (shape === 'circle') m = '<circle r="' + r + '" ' + st + '/>';
    else if (shape === 'square') m = '<rect x="' + (-r * 0.85) + '" y="' + (-r * 0.85) + '" width="' + (r * 1.7) + '" height="' + (r * 1.7) + '" ' + st + '/>';
    else if (shape === 'triangle') m = '<polygon points="' + pts([[0, -r], [r * 0.98, r * 0.8], [-r * 0.98, r * 0.8]]) + '" ' + st + '/>';
    else if (shape === 'diamond') m = '<polygon points="' + pts([[0, -r * 1.05], [r * 0.8, 0], [0, r * 1.05], [-r * 0.8, 0]]) + '" ' + st + '/>';
    else if (shape === 'star') { const p = []; for (let i = 0; i < 10; i++) { const a = (-90 + i * 36) * Math.PI / 180, rr = i % 2 ? r * 0.45 : r * 1.1; p.push([Math.cos(a) * rr, Math.sin(a) * rr]); } m = '<polygon points="' + pts(p) + '" ' + st + '/>'; }
    else if (shape === 'hexagon') { const p = []; for (let i = 0; i < 6; i++) { const a = (i * 60) * Math.PI / 180; p.push([Math.cos(a) * r, Math.sin(a) * r]); } m = '<polygon points="' + pts(p) + '" ' + st + '/>'; }
    else if (shape === 'arrow') m = '<polygon points="' + pts([[0, -r * 1.05], [r * 0.85, 0], [r * 0.3, 0], [r * 0.3, r * 1.0], [-r * 0.3, r * 1.0], [-r * 0.3, 0], [-r * 0.85, 0]]) + '" ' + st + '/>';
    if (rot) m = '<g transform="rotate(' + rot + ')">' + m + '</g>';
    return m;
  }

  /* a = {shape, fill 0-2, count 1-3, size 0-2, rot degrees} */
  PP.figG = function (a) {
    const n = a.count || 1, s = a.size === undefined ? 1 : a.size, rot = a.rot || 0;
    let rs, pos;
    if (n === 1) { rs = [15, 22, 30][s]; pos = [[0, 0]]; }
    else if (n === 2) { rs = [9, 13, 16][s]; pos = [[-20, 0], [20, 0]]; }
    else { rs = [7, 10, 12.5][s]; pos = [[0, -20], [-21, 14], [21, 14]]; }
    return '<g transform="translate(50,50)">' + pos.map(p => '<g transform="translate(' + p[0] + ',' + p[1] + ')">' + shapeMarkup(a.shape, rs, a.fill, rot) + '</g>').join('') + '</g>';
  };
  PP.figSVG = a => '<svg class="fig" viewBox="0 0 100 100" role="img" aria-label="answer figure">' + PP.figG(a) + '</svg>';
  PP.figKey = a => [a.shape, a.fill, a.count, a.size, a.rot || 0].join('/');

  const word = ['', 'one', 'two', 'three'];
  PP.figDesc = function (a) {
    const sh = a.shape === 'arrow' ? 'arrow' : a.shape;
    const dir = { 0: 'up', 90: 'right', 180: 'down', 270: 'left' }[a.rot || 0];
    return (a.count > 1 ? word[a.count] + ' ' : 'one ') + PP.SIZEN[a.size] + ' ' + PP.FILLN[a.fill] + ' ' + sh + (a.count > 1 ? 's' : '') + (a.shape === 'arrow' ? ' pointing ' + dir : '');
  };
})();

/* ======================================================================
   Geometry kit for the 2x2 Figure Matrices and the Figure Classification
   rules (sides, curves, equal parts, shaded fractions, shape inside).
   Every shape is drawn in unit coordinates (about -1..1) and scaled.
   ====================================================================== */
(function () {
  const PP = window.PP;
  const INK = '#1F2A44', GRAY = '#A9B4CE';
  const FILLC = ['#ffffff', GRAY, INK];
  const reg = (n, r, start) => { const p = []; for (let i = 0; i < n; i++) { const a = (start + i * 360 / n) * Math.PI / 180; p.push([Math.cos(a) * r, Math.sin(a) * r]); } return p; };
  const star = () => { const p = []; for (let i = 0; i < 10; i++) { const a = (-90 + i * 36) * Math.PI / 180, rr = i % 2 ? 0.45 : 1.05; p.push([Math.cos(a) * rr, Math.sin(a) * rr]); } return p; };

  /* polygons: points; curved shapes: SVG path data */
  const G = {
    tri: { p: reg(3, 1.08, -90), sides: 3 }, rtri: { p: [[-0.8, -0.9], [-0.8, 0.9], [0.85, 0.9]], sides: 3 },
    tall: { p: [[0, -1.05], [0.55, 0.95], [-0.55, 0.95]], sides: 3 }, scal: { p: [[-0.95, 0.75], [0.95, 0.75], [0.3, -0.95]], sides: 3 },
    sq: { p: [[-0.82, -0.82], [0.82, -0.82], [0.82, 0.82], [-0.82, 0.82]], sides: 4 }, rect: { p: [[-1, -0.58], [1, -0.58], [1, 0.58], [-1, 0.58]], sides: 4 },
    rhomb: { p: [[0, -1.05], [0.72, 0], [0, 1.05], [-0.72, 0]], sides: 4 }, para: { p: [[-0.55, -0.6], [1, -0.6], [0.55, 0.6], [-1, 0.6]], sides: 4 },
    trap: { p: [[-0.5, -0.6], [0.5, -0.6], [1, 0.6], [-1, 0.6]], sides: 4 }, kite: { p: [[0, -1.05], [0.62, -0.35], [0, 1.05], [-0.62, -0.35]], sides: 4 },
    pent: { p: reg(5, 1.02, -90), sides: 5 }, house: { p: [[0, -1], [0.82, -0.28], [0.82, 0.9], [-0.82, 0.9], [-0.82, -0.28]], sides: 5 },
    tag: { p: [[-0.95, -0.65], [0.3, -0.65], [0.95, 0], [0.3, 0.65], [-0.95, 0.65]], sides: 5 }, pent2: { p: [[-0.9, -0.75], [0.45, -0.95], [0.95, 0.2], [0.15, 0.95], [-0.85, 0.55]], sides: 5 },
    hex: { p: reg(6, 1, 0), sides: 6 }, longhex: { p: [[-1, 0], [-0.55, -0.6], [0.55, -0.6], [1, 0], [0.55, 0.6], [-0.55, 0.6]], sides: 6 },
    hex2: { p: [[-0.9, -0.35], [-0.3, -0.95], [0.6, -0.7], [0.95, 0.1], [0.4, 0.9], [-0.6, 0.7]], sides: 6 }, lsix: { p: [[-0.7, -0.95], [-0.1, -0.95], [-0.1, 0.35], [0.8, 0.35], [0.8, 0.95], [-0.7, 0.95]], sides: 6 },
    star: { p: star(), sides: 10 },
    circle: { d: 'M-1,0 A1,1 0 1 1 1,0 A1,1 0 1 1 -1,0 Z', sides: 0 }, oval: { d: 'M-1,0 A1,0.62 0 1 1 1,0 A1,0.62 0 1 1 -1,0 Z', sides: 0 },
    semi: { d: 'M-1,0.42 A1,1 0 0 1 1,0.42 Z', sides: 0 }, quarter: { d: 'M-0.75,0.8 L-0.75,-0.85 A1.65,1.65 0 0 1 0.9,0.8 Z', sides: 0 },
    arch: { d: 'M-0.7,1 L-0.7,0 A0.7,0.7 0 0 1 0.7,0 L0.7,1 Z', sides: 0 },
    // lopsided figures: every turn and every flip looks different
    L: { p: [[-0.55, -1], [0, -1], [0, 0.42], [0.75, 0.42], [0.75, 1], [-0.55, 1]], sides: 6, glyph: true },
    flag: { p: [[-0.6, 1], [-0.6, -1], [0.85, -0.55], [-0.3, -0.08], [-0.3, 1]], sides: 5, glyph: true },
    wedge: { p: [[-0.7, -1], [-0.7, 1], [0.8, 1]], sides: 3, glyph: true }
  };
  PP.GEO = G;
  const P = a => a.map(q => (+q[0].toFixed(3)) + ',' + (+q[1].toFixed(3))).join(' ');
  const ST = 'stroke="' + INK + '" stroke-width="2.4" stroke-linejoin="round" vector-effect="non-scaling-stroke"';
  const outline = (s, fill) => G[s].d ? '<path d="' + G[s].d + '" fill="' + fill + '" ' + ST + '/>' : '<polygon points="' + P(G[s].p) + '" fill="' + fill + '" ' + ST + '/>';

  /* equal parts: list of regions, each a polygon or a path */
  const arcPt = (rx, ry, deg) => [rx * Math.cos(deg * Math.PI / 180), ry * Math.sin(deg * Math.PI / 180)];
  function sectors(rx, ry, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const a0 = -90 + i * 360 / n, a1 = a0 + 360 / n, p0 = arcPt(rx, ry, a0), p1 = arcPt(rx, ry, a1);
      out.push({ d: 'M0,0 L' + P([p0]) + ' A' + rx + ',' + ry + ' 0 ' + (360 / n > 180 ? 1 : 0) + ' 1 ' + P([p1]) + ' Z' });
    }
    return out;
  }
  const strips = (x0, y0, x1, y1, n) => { const out = [], w = (x1 - x0) / n; for (let i = 0; i < n; i++) out.push({ p: [[x0 + i * w, y0], [x0 + (i + 1) * w, y0], [x0 + (i + 1) * w, y1], [x0 + i * w, y1]] }); return out; };
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  PP.PARTS = {
    circle: { 2: 1, 3: 1, 4: 1 }, oval: { 2: 1, 4: 1 }, sq: { 2: 1, 3: 1, 4: 1 }, rect: { 2: 1, 3: 1, 4: 1 }, tri: { 2: 1, 3: 1, 4: 1 }, hex: { 2: 1, 3: 1, 6: 1 }
  };
  function regions(s, n) {
    if (s === 'circle') return sectors(1, 1, n);
    if (s === 'oval') return sectors(1, 0.62, n === 2 ? 2 : 4).map((x, i, a) => n === 2 ? x : x);
    if (s === 'sq') return n === 4 ? [[-0.82, -0.82, 0, 0], [0, -0.82, 0.82, 0], [0, 0, 0.82, 0.82], [-0.82, 0, 0, 0.82]].map(b => strips(b[0], b[1], b[2], b[3], 1)[0]) : strips(-0.82, -0.82, 0.82, 0.82, n);
    if (s === 'rect') return strips(-1, -0.58, 1, 0.58, n);
    if (s === 'tri') {
      const v = G.tri.p, c = [0, 0];
      if (n === 2) { const m = mid(v[1], v[2]); return [{ p: [v[0], m, v[2]] }, { p: [v[0], v[1], m] }]; }
      if (n === 3) return [{ p: [c, v[0], v[1]] }, { p: [c, v[1], v[2]] }, { p: [c, v[2], v[0]] }];
      const m01 = mid(v[0], v[1]), m12 = mid(v[1], v[2]), m20 = mid(v[2], v[0]);
      return [{ p: [v[0], m01, m20] }, { p: [m01, v[1], m12] }, { p: [m20, m12, v[2]] }, { p: [m01, m12, m20] }];
    }
    if (s === 'hex') {
      const v = G.hex.p, c = [0, 0];
      if (n === 2) return [{ p: [v[3], v[4], v[5], v[0]] }, { p: [v[0], v[1], v[2], v[3]] }];
      if (n === 3) return [{ p: [c, v[0], v[1], v[2]] }, { p: [c, v[2], v[3], v[4]] }, { p: [c, v[4], v[5], v[0]] }];
      return [0, 1, 2, 3, 4, 5].map(i => ({ p: [c, v[i], v[(i + 1) % 6]] }));
    }
    return null;
  }
  const regionMarkup = (g, fill) => g.d ? '<path d="' + g.d + '" fill="' + fill + '" ' + ST + '/>' : '<polygon points="' + P(g.p) + '" fill="' + fill + '" ' + ST + '/>';

  /* A classification figure:
     { s: shape, z: size 0-2, rot: degrees, fill: 0-2, n: equal parts (1 = whole), sh: shaded part indices, shc: 1|2 shade,
       inner: shape or null, ifill: 0-2 } */
  const ZR = [17, 26, 36];
  PP.geoG = function (f) {
    const R = ZR[f.z === undefined ? 1 : f.z];
    let m = '';
    if (f.n && f.n > 1) {
      const rg = regions(f.s, f.n);
      rg.forEach((g, i) => { m += regionMarkup(g, (f.sh || []).includes(i) ? FILLC[f.shc || 2] : '#ffffff'); });
      m += outline(f.s, 'none');
    } else m += outline(f.s, FILLC[f.fill || 0]);
    if (f.inner) m += '<g transform="scale(0.42)">' + outline(f.inner, FILLC[f.ifill || 0]) + '</g>';
    return '<g transform="translate(50,50) scale(' + R + ') rotate(' + (f.rot || 0) + ')">' + m + '</g>';
  };
  PP.geoSVG = f => '<svg class="fig" viewBox="0 0 100 100" role="img" aria-label="answer figure">' + PP.geoG(f) + '</svg>';
  PP.geoKey = f => [f.s, f.z, f.rot || 0, f.n > 1 ? 'p' + f.n + ':' + (f.sh || []).slice().sort().join('.') + ':' + (f.shc || 2) : 'f' + (f.fill || 0), f.inner ? f.inner + ':' + (f.ifill || 0) : '-'].join('/');

  /* A matrix figure: { s, fill 0-2, z size 0-2, c count 1-3, o: [a,b,c,d] turn/flip matrix } */
  const MZ = [16, 24, 34];
  PP.mxG = function (f) {
    const c = f.c || 1, o = f.o || [1, 0, 0, 1];
    let R, pos;
    if (c === 1) { R = MZ[f.z === undefined ? 1 : f.z]; pos = [[0, 0]]; }
    else if (c === 2) { R = 15; pos = [[-22, 0], [22, 0]]; }
    else { R = 12; pos = [[0, -20], [-22, 16], [22, 16]]; }
    const one = outline(f.s, FILLC[f.fill || 0]);
    return '<g transform="translate(50,50)">' + pos.map(p => '<g transform="translate(' + p[0] + ',' + p[1] + ') scale(' + R + ') matrix(' + o.join(',') + ',0,0)">' + one + '</g>').join('') + '</g>';
  };
  PP.mxSVG = f => '<svg class="fig" viewBox="0 0 100 100" role="img" aria-label="answer figure">' + PP.mxG(f) + '</svg>';
  PP.mxKey = f => [f.s, f.fill || 0, f.c || 1, f.z === undefined ? 1 : f.z, (f.o || [1, 0, 0, 1]).join(',')].join('/');
})();
