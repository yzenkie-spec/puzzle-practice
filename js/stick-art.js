/* Hockey stick drawing: wood grain (common), carbon weave (rare), foil (epic), gold with glow and a small cup (legend). */
(function () {
  let uid = 0;
  const hex = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const x = hex(a), y = hex(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); };
  const OUT = 'M83 8 L77 4 L29 84 L27 101 L7 101 Q4 101 4 104 L4 108 Q4 113 9 113 L35 113 Q42 113 41 104 L36 88Z';
  const P = t => [80 - 48 * t, 6 + 80 * t];
  const band = (t, w, col) => { const p = P(t); return '<path d="M' + (p[0] - 7) + ' ' + (p[1] - 4.2) + ' L' + (p[0] + 7) + ' ' + (p[1] + 4.2) + '" stroke="' + col + '" stroke-width="' + w + '"/>'; };
  const spark = (x, y, r, col) => '<path d="M' + x + ' ' + (y - r) + ' Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + ' Q' + x + ' ' + y + ' ' + x + ' ' + (y + r) + ' Q' + x + ' ' + y + ' ' + (x - r) + ' ' + y + ' Q' + x + ' ' + y + ' ' + x + ' ' + (y - r) + 'Z" fill="' + col + '" stroke="#111" stroke-width=".6"/>';

  PP.stickSvg = function (t) {
    const id = 's' + (++uid), tier = t.tier, c1 = t.c1, c2 = t.c2;
    const hi = mix(c1, '#ffffff', 0.45), lo = mix(c1, '#000000', 0.25);
    const tape = tier === 'epic' ? '#1B1F27' : '#F5F5EF';
    let fill = '<stop offset="0" stop-color="' + hi + '"/><stop offset=".5" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + lo + '"/>';
    if (tier === 'epic' || tier === 'legend') fill = '<stop offset="0" stop-color="' + hi + '"/><stop offset=".25" stop-color="' + c1 + '"/><stop offset=".45" stop-color="' + mix(c1, '#ffffff', 0.6) + '"/><stop offset=".7" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + lo + '"/>';
    let tex = '';
    if (tier === 'common') {
      for (let i = -3; i <= 3; i++) tex += '<path d="M' + (80 + i * 1.1) + ' ' + (6 - i * 0.7) + ' L' + (32 + i * 1.1) + ' ' + (86 - i * 0.7) + '" stroke="' + mix(c1, '#000000', 0.35) + '" stroke-opacity=".35" stroke-width=".5"/>';
      tex += '<path d="M12 106 L38 106 M10 109 L36 109" stroke="' + mix(c1, '#000000', 0.35) + '" stroke-opacity=".3" stroke-width=".5"/>';
    } else {
      tex = '<rect x="0" y="0" width="100" height="120" fill="url(#' + id + 'w)"/>';
    }
    const bladeTape = [12, 17, 22, 27, 32].map(x => '<path d="M' + x + ' 99 L' + (x + 4) + ' 115" stroke="' + tape + '" stroke-width="2.8" opacity=".92"/>').join('');
    const grip = '<path d="M80 6 L76.6 11.7" stroke="#14181F" stroke-width="8"/><path d="M79 7.6 L76.2 12.3 M81 5 L77.5 10.6" stroke="' + (tier === 'epic' ? c2 : '#F5F5EF') + '" stroke-width="1"/>';
    const bands = band(0.3, 5, c2) + band(0.3, 1.2, '#fff') + band(0.4, 2, c2) + band(0.7, 3, c2);
    let extras = '';
    if (tier === 'epic') extras = spark(90, 26, 7, '#FFD54A') + spark(18, 74, 4, '#fff');
    if (tier === 'legend') {
      extras = spark(91, 28, 8, '#FFD54A') + spark(16, 70, 5, '#fff') + spark(52, 16, 4, '#FFE9A0') +
        '<g transform="translate(48 50) rotate(-31)"><rect x="-6" y="-3" width="12" height="7" rx="1.2" fill="#F7E7A8" stroke="#111" stroke-width=".8"/><path d="M-3 3.2 h6 M-2.2 3.2 q.2-2.5 0-4 h4.4 q-.2 1.5 0 4 M-3.2-.8 q-2 0-2 1.6 q0 1.4 2.2 1.4 M3.2-.8 q2 0 2 1.6 q0 1.4-2.2 1.4" fill="none" stroke="#7A4B12" stroke-width=".8"/></g>';
    }
    const glow = tier === 'legend' || tier === 'epic' ? '<circle cx="50" cy="62" r="52" fill="url(#' + id + 'r)"/>' : '';
    return '<svg class="stickimg" viewBox="0 0 100 120" aria-hidden="true"><defs>' +
      '<linearGradient id="' + id + 'g" gradientUnits="userSpaceOnUse" x1="80" y1="6" x2="32" y2="86">' + fill + '</linearGradient>' +
      '<radialGradient id="' + id + 'r"><stop offset="0" stop-color="' + hi + '" stop-opacity="' + (tier === 'legend' ? '.75' : '.45') + '"/><stop offset="1" stop-color="' + hi + '" stop-opacity="0"/></radialGradient>' +
      '<pattern id="' + id + 'w" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="4" fill="none"/><rect width="2" height="2" fill="#000" opacity=".22"/><rect x="2" y="2" width="2" height="2" fill="#000" opacity=".22"/></pattern>' +
      '<clipPath id="' + id + 'c"><path d="' + OUT + '"/></clipPath></defs>' + glow +
      '<path d="' + OUT + '" transform="translate(2.5 3)" fill="#000" opacity=".15"/>' +
      '<path d="' + OUT + '" fill="url(#' + id + 'g)"/>' +
      '<g clip-path="url(#' + id + 'c)">' + tex + '<path d="M78 7 L30 87" stroke="#fff" stroke-opacity=".28" stroke-width="1.6"/>' + bands + grip + bladeTape +
      '<path d="M4 108 Q4 113 9 113 L35 113 Q42 113 41 104" fill="none" stroke="' + lo + '" stroke-width="2" opacity=".5"/></g>' +
      '<path d="' + OUT + '" fill="none" stroke="#111" stroke-width="2.2" stroke-linejoin="round"/>' + extras + '</svg>';
  };
})();
