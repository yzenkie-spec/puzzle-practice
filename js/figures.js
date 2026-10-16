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
