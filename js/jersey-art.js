/* Jersey drawing. Draws a hockey sweater in the team's colours with a text wordmark.
   No team logos are drawn. Variants: e = Home, a = Away, c = Retro (special edition). */
(function () {
  let uid = 0;
  const hex = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const x = hex(a), y = hex(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); };
  const lum = h => { const c = hex(h); return (c[0] * 299 + c[1] * 587 + c[2] * 114) / 1000; };
  const num = team => { let h = 7; for (const ch of team) h = (h * 31 + ch.charCodeAt(0)) % 97; return h + 2; };
  const OUT = 'M46 6 L22 16 L4 62 L24 72 L30 56 L30 116 Q60 124 90 116 L90 56 L96 72 L116 62 L98 16 L74 6 Q60 20 46 6Z';

  PP.jerseySvg = function (team, v) {
    const c = PP.TEAMS[team] || ['#555555', '#ffffff'], id = 'j' + (++uid);
    const p = c[0], s = c[1];
    const white = '#F7F7F2', cream = '#F1E6C8', ink = '#14181F';
    let body, band, edge;
    if (v === 'a') { body = white; band = p; edge = (lum(s) > 200 || s === p) ? ink : s; }
    else if (v === 'c') { body = mix(p, '#000000', 0.08); band = cream; edge = s === p ? ink : s; }
    else { body = p; band = lum(s) > 235 ? white : s; edge = lum(p) > 150 ? ink : white; if (band === body) band = white; }
    if (lum(band) > 215 && v !== 'a' && edge === white) edge = lum(p) > 150 ? ink : mix(p, '#000000', 0.35);
    const pickText = bg => [band, white, ink, p].find(x => Math.abs(lum(x) - lum(bg)) >= 95) || (lum(bg) > 128 ? ink : white);
    const textFill = v === 'c' ? p : (v === 'a' ? p : pickText(body));
    const textLine = v === 'c' ? edge : (lum(textFill) > 140 ? ink : white);
    const yoke = v === 'a' ? p : v === 'c' ? cream : mix(body, '#000000', 0.22);
    const n = num(team), ttl = team;
    const arm = (t, w, col) => '<path d="M' + (24 - 20 * t) + ' ' + (13 + 50 * t) + ' L' + (60 - 20 * t) + ' ' + (28 + 50 * t) + '" stroke="' + col + '" stroke-width="' + w + '" fill="none"/>';
    const hem = (y, w, col) => '<path d="M28 ' + y + ' Q60 ' + (y + 7) + ' 92 ' + y + '" stroke="' + col + '" stroke-width="' + w + '" fill="none"/>';
    const both = f => f() + '<g transform="translate(120 0) scale(-1 1)">' + f() + '</g>';
    let stripes = '';
    if (v === 'c') {
      stripes += '<path d="M28 50 Q60 58 92 50 L92 78 Q60 86 28 78Z" fill="' + band + '"/><path d="M28 50 Q60 58 92 50" stroke="' + edge + '" stroke-width="2.2" fill="none"/><path d="M28 78 Q60 86 92 78" stroke="' + edge + '" stroke-width="2.2" fill="none"/>';
      [[0.52, 9], [0.8, 4]].forEach(a => { stripes += both(() => arm(a[0], a[1], band)); });
      stripes += hem(104, 8, band) + hem(116, 5, band);
    } else {
      [[0.48, 4.5], [0.66, 8], [0.84, 4.5]].forEach(a => { stripes += both(() => arm(a[0], a[1] + 2.4, edge) + arm(a[0], a[1], band)); });
      stripes += hem(100, 7, edge) + hem(100, 4.6, band) + hem(108, 11.4, edge) + hem(108, 9, band) + hem(116, 7, edge) + hem(116, 4.6, band);
    }
    const collarCol = v === 'c' ? cream : (v === 'a' ? p : band);
    const lace = v === 'c' ? cream : white;
    const collar = '<path d="M44 4 L60 34 L76 4 Q60 22 44 4Z" fill="' + (v === 'a' ? '#E6E6DE' : mix(body, '#000000', 0.35)) + '"/>' +
      '<path d="M44 5 Q60 24 76 5" stroke="' + collarCol + '" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      [14, 19, 24].map((y, i) => '<path d="M' + (56 + i * 0.8) + ' ' + y + ' L' + (64 - i * 0.8) + ' ' + (y + 3) + ' M' + (64 - i * 0.8) + ' ' + y + ' L' + (56 + i * 0.8) + ' ' + (y + 3) + '" stroke="' + lace + '" stroke-width="1.3" stroke-linecap="round"/>').join('') +
      '<path d="M60 30 L57.5 40 M60 30 L62.5 41" stroke="' + lace + '" stroke-width="1.5" stroke-linecap="round"/>';
    const yo = v === 'a' ? '0' : v === 'c' ? '0.3' : '0.55';
    const yk = '<path d="M46 6 L22 16 L17 28 Q36 36 48 24 Q54 18 46 6Z" fill="' + yoke + '" opacity="' + yo + '"/><path d="M74 6 L98 16 L103 28 Q84 36 72 24 Q66 18 74 6Z" fill="' + yoke + '" opacity="' + yo + '"/>';
    const ty = v === 'c' ? 72 : 70;
    const word = '<text x="60" y="' + ty + '" text-anchor="middle" font-size="' + (ttl.length > 2 ? 27 : 30) + '" font-weight="700" font-family="Teko,Impact,sans-serif" letter-spacing="1" fill="' + textFill + '" stroke="' + textLine + '" stroke-width="2.6" paint-order="stroke" stroke-linejoin="round">' + ttl + '</text>';
    const nf = (v === 'a' || v === 'c') ? p : textFill, ns = v === 'a' ? edge : textLine;
    const sleeveNum = [['17', '-22'], ['103', '22']].map(a => '<text x="0" y="0" transform="translate(' + a[0] + ' 40) rotate(' + a[1] + ')" text-anchor="middle" font-size="14" font-weight="700" font-family="Teko,Impact,sans-serif" fill="' + nf + '" stroke="' + ns + '" stroke-width="1.6" paint-order="stroke">' + n + '</text>').join('');
    const fx = '<rect x="0" y="0" width="120" height="130" fill="url(#' + id + 'g)"/><rect x="0" y="0" width="120" height="130" fill="url(#' + id + 'm)"/>' +
      '<path d="M40 62 Q44 90 38 116 M80 62 Q76 90 82 116 M60 40 L60 110" stroke="#000" stroke-opacity=".07" stroke-width="3" fill="none"/>';
    return '<svg class="jersey" viewBox="0 0 120 130" aria-hidden="true"><defs>' +
      '<linearGradient id="' + id + 'g" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>' +
      '<pattern id="' + id + 'm" width="3" height="3" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r=".7" fill="#000" opacity=".13"/></pattern>' +
      '<clipPath id="' + id + 'c"><path d="' + OUT + '"/></clipPath></defs>' +
      '<ellipse cx="60" cy="126" rx="38" ry="3" fill="#000" opacity=".12"/>' +
      '<path d="' + OUT + '" fill="' + body + '"/>' +
      '<g clip-path="url(#' + id + 'c)">' + yk + stripes + fx + '</g>' +
      '<path d="M30 56 L24 72 M90 56 L96 72" stroke="#000" stroke-opacity=".25" stroke-width="1.2"/>' +
      collar + word + sleeveNum +
      '<path d="' + OUT + '" fill="none" stroke="#111" stroke-width="2.4" stroke-linejoin="round"/></svg>';
  };
})();
