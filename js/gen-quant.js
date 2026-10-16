/* Quantitative generators: Number Series (NS), Number Analogies (NA), Number Puzzles (NP). */
(function () {
  const PP = window.PP, ri = PP.ri, pick = PP.pick;

  const numOpts = (r, ans, extra, lo) => {
    const c = (extra || []).concat([ans + 1, ans - 1, ans + 2, ans - 2, ans + 10, ans - 10, ans * 2, ans + 3]);
    const out = [];
    for (const v of PP.shuffle(r, extra && extra.length ? extra : []).concat(PP.shuffle(r, c.slice(extra ? extra.length : 0)))) {
      if (Number.isInteger(v) && v >= (lo === undefined ? 0 : lo) && v !== ans && !out.includes(v)) out.push(v);
    }
    return out.slice(0, 6);
  };

  /* ---------------- Number Series ---------------- */
  const seqStem = t => '<p class="q">What number comes next?</p><p class="seq">' + t.slice(0, 5).join(', ') + ', ?</p>';

  PP.gens.NS = function (lv, r) {
    let t = [], rule = '';
    const n = 6;
    const kinds = {
      e: ['add', 'sub', 'double', 'add'],
      a: ['addBig', 'grow1', 'alt', 'triple', 'halve', 'subBig'],
      c: ['grow2', 'muladd', 'inter', 'square', 'tri', 'altop', 'fib']
    }[lv];
    const kind = pick(r, kinds);
    if (kind === 'add') { const d = ri(r, 2, 10), s = ri(r, 1, 25); for (let i = 0; i < n; i++) t.push(s + d * i); rule = 'The numbers go up by ' + d + ' each time.'; }
    else if (kind === 'sub') { const d = ri(r, 2, 9), s = ri(r, 45, 99); for (let i = 0; i < n; i++) t.push(s - d * i); rule = 'The numbers go down by ' + d + ' each time.'; }
    else if (kind === 'double') { const s = ri(r, 1, 6); for (let i = 0; i < n; i++) t.push(s * Math.pow(2, i)); rule = 'Each number is double the one before.'; }
    else if (kind === 'addBig') { const d = ri(r, 11, 25), s = ri(r, 5, 60); for (let i = 0; i < n; i++) t.push(s + d * i); rule = 'The numbers go up by ' + d + ' each time.'; }
    else if (kind === 'subBig') { const d = ri(r, 6, 15), s = ri(r, 90, 170); for (let i = 0; i < n; i++) t.push(s - d * i); rule = 'The numbers go down by ' + d + ' each time.'; }
    else if (kind === 'grow1') { const g = ri(r, 1, 3), s = ri(r, 1, 20); t = [s]; for (let i = 0; i < n - 1; i++) t.push(t[i] + g + i); rule = 'The jumps get bigger by 1 each time: +' + g + ', +' + (g + 1) + ', +' + (g + 2) + ', and so on.'; }
    else if (kind === 'alt') { const a = ri(r, 1, 7), b = ri(r, 1, 7); if (a === b) return null; const s = ri(r, 1, 20); t = [s]; for (let i = 0; i < n - 1; i++) t.push(t[i] + (i % 2 ? b : a)); rule = 'The jumps take turns: +' + a + ', then +' + b + ', and repeat.'; }
    else if (kind === 'triple') { const s = ri(r, 1, 3); for (let i = 0; i < n; i++) t.push(s * Math.pow(3, i)); rule = 'Each number is 3 times the one before.'; }
    else if (kind === 'halve') { const m = ri(r, 1, 12); const s = m * 32; for (let i = 0; i < n; i++) t.push(s / Math.pow(2, i)); rule = 'Each number is half of the one before.'; }
    else if (kind === 'grow2') { const g = ri(r, 2, 4), s = ri(r, 1, 15); t = [s]; for (let i = 0; i < n - 1; i++) t.push(t[i] + g + 2 * i); rule = 'The jumps grow by 2 each time: +' + g + ', +' + (g + 2) + ', +' + (g + 4) + ', and so on.'; }
    else if (kind === 'muladd') {
      const v = ri(r, 0, 2);
      if (v === 0) { const s = ri(r, 1, 4); t = [s]; for (let i = 0; i < n - 1; i++) t.push(t[i] * 2 + 1); rule = 'Double the number, then add 1.'; }
      else if (v === 1) { const s = ri(r, 2, 5); t = [s]; for (let i = 0; i < n - 1; i++) t.push(t[i] * 2 - 1); rule = 'Double the number, then take away 1.'; }
      else { const s = ri(r, 1, 2); t = [s]; for (let i = 0; i < n - 1; i++) t.push(t[i] * 3 + 1); rule = 'Multiply by 3, then add 1.'; }
    }
    else if (kind === 'inter') {
      const a = ri(r, 2, 6), b = ri(r, 2, 6), s1 = ri(r, 1, 15), s2 = ri(r, 40, 70); const down = r() < 0.5;
      for (let i = 0; i < n; i++) t.push(i % 2 === 0 ? s1 + a * (i / 2) : s2 + (down ? -b : b) * ((i - 1) / 2));
      rule = 'Two patterns take turns. The 1st, 3rd and 5th numbers go up by ' + a + '. The 2nd, 4th and 6th numbers go ' + (down ? 'down' : 'up') + ' by ' + b + '.';
    }
    else if (kind === 'square') { const k = ri(r, 1, 5); for (let i = 0; i < n; i++) t.push((i + k) * (i + k)); rule = 'These are square numbers: ' + t.slice(0, 3).map((v, i) => (i + k) + '×' + (i + k)).join(', ') + ', and so on.'; }
    else if (kind === 'tri') { const k = ri(r, 1, 5); for (let i = 0; i < n; i++) { const m = i + k; t.push(m * (m + 1) / 2); } rule = 'The jumps grow by 1 each time: +' + (t[1] - t[0]) + ', +' + (t[2] - t[1]) + ', +' + (t[3] - t[2]) + ', and so on.'; }
    else if (kind === 'altop') { const s = ri(r, 3, 9), a = ri(r, 2, 5); t = [s]; for (let i = 0; i < n - 1; i++) t.push(i % 2 === 0 ? t[i] * 2 : t[i] - a); rule = 'The pattern is: double, then take away ' + a + ', and repeat.'; }
    else if (kind === 'fib') { const a = ri(r, 1, 5), b = ri(r, 1, 6); if (a === b && a === 1) return null; t = [a, b]; for (let i = 2; i < n; i++) t.push(t[i - 1] + t[i - 2]); rule = 'Add the two numbers before to get the next one.'; }
    if (t.some(v => !Number.isInteger(v) || v < 0)) return null;
    const ans = t[5];
    const extra = [t[4] + (t[4] - t[3]), t[4] + (t[3] - t[2]), t[4] + 1];
    const w = numOpts(r, ans, extra, 0);
    return PP.mk(r, { stem: seqStem(t), correct: ans, wrong: w, exp: rule + ' So the next number is ' + ans + '.', key: t.slice(0, 5).join(',') });
  };

  /* ---------------- Number Analogies ---------------- */
  const RULES = [];
  const addR = (id, lv, f, lo, hi, text, ok) => RULES.push({ id, lv, f, lo, hi, text, ok });
  for (let k = 2; k <= 12; k++) { addR('+' + k, 'e', n => n + k, 1, 30, 'Add ' + k + '.'); }
  for (let k = 2; k <= 9; k++) { addR('-' + k, 'e', n => n - k, k + 1, 40, 'Take away ' + k + '.'); }
  addR('x2', 'e', n => n * 2, 1, 20, 'Double the number.');
  addR('x3', 'e', n => n * 3, 1, 12, 'Multiply by 3.');
  addR('x5', 'e', n => n * 5, 1, 12, 'Multiply by 5.');
  addR('x10', 'e', n => n * 10, 1, 9, 'Multiply by 10.');
  for (let k = 13; k <= 30; k += 1) { if (k % 5 === 0 || k === 14 || k === 17 || k === 25) addR('+' + k, 'a', n => n + k, 1, 40, 'Add ' + k + '.'); }
  addR('x4', 'a', n => n * 4, 1, 15, 'Multiply by 4.');
  addR('x6', 'a', n => n * 6, 1, 12, 'Multiply by 6.');
  addR('half', 'a', n => n / 2, 2, 60, 'Take half of the number.', n => n % 2 === 0);
  addR('2n+1', 'a', n => 2 * n + 1, 1, 20, 'Double the number, then add 1.');
  addR('2n-1', 'a', n => 2 * n - 1, 2, 20, 'Double the number, then take away 1.');
  addR('2n+2', 'a', n => 2 * n + 2, 1, 20, 'Double the number, then add 2.');
  addR('100-n', 'a', n => 100 - n, 5, 95, 'Take the number away from 100.');
  addR('n+n+n+1', 'a', n => 3 * n + 1, 1, 12, 'Multiply by 3, then add 1.');
  addR('sq', 'c', n => n * n, 2, 9, 'Multiply the number by itself.');
  addR('sq+1', 'c', n => n * n + 1, 2, 9, 'Multiply the number by itself, then add 1.');
  addR('n(n+1)', 'c', n => n * (n + 1), 1, 9, 'Multiply the number by the next number up.');
  addR('3n+2', 'c', n => 3 * n + 2, 1, 15, 'Multiply by 3, then add 2.');
  addR('4n-3', 'c', n => 4 * n - 3, 1, 15, 'Multiply by 4, then take away 3.');
  addR('5n+2', 'c', n => 5 * n + 2, 1, 12, 'Multiply by 5, then add 2.');
  addR('2(n+2)', 'c', n => 2 * (n + 2), 1, 20, 'Add 2, then double.');
  addR('3(n-1)', 'c', n => 3 * (n - 1), 2, 15, 'Take away 1, then multiply by 3.');
  addR('half+1', 'c', n => n / 2 + 1, 2, 60, 'Take half of the number, then add 1.', n => n % 2 === 0);
  addR('n+n^2', 'c', n => n + n * n, 1, 9, 'Add the number to its square (the number times itself).');
  addR('n*n-n', 'c', n => n * n - n, 2, 9, 'Multiply the number by itself, then take away the number.');
  addR('10n-5', 'c', n => 10 * n - 5, 1, 9, 'Multiply by 10, then take away 5.');

  PP.gens.NA = function (lv, r) {
    const set = RULES.filter(x => x.lv === lv);
    const rule = pick(r, set);
    const dom = [];
    for (let n = rule.lo; n <= rule.hi; n++) if (!rule.ok || rule.ok(n)) dom.push(n);
    if (dom.length < 4) return null;
    const ins = PP.shuffle(r, dom).slice(0, 3);
    const [a, b, c] = ins;
    // reject if another rule fits both examples (ambiguous)
    for (const o of RULES) {
      if (o === rule) continue;
      const okA = (!o.ok || o.ok(a)) && (!o.ok || o.ok(b)) && (!o.ok || o.ok(c));
      if (okA && o.f(a) === rule.f(a) && o.f(b) === rule.f(b) && o.f(c) === rule.f(c)) return null;
    }
    const ans = rule.f(c);
    const stem = '<p class="q">Find the rule. What number goes in place of the ?</p><p class="seq">' + a + ' → ' + rule.f(a) + '<br>' + b + ' → ' + rule.f(b) + '<br>' + c + ' → ?</p>';
    const diff = rule.f(b) - b;
    const extra = [c + diff, c * (rule.f(b) / b | 0), rule.f(c) + 1, rule.f(c) - 1];
    const w = numOpts(r, ans, extra, 0);
    return PP.mk(r, { stem, correct: ans, wrong: w, exp: 'The rule is: ' + rule.text + ' ' + c + ' → ' + ans + '.', key: a + ',' + b + ',' + c + ',' + rule.id });
  };

  /* ---------------- Number Puzzles ---------------- */
  PP.gens.NP = function (lv, r) {
    const E = '☐';
    let stem, ans, exp, extra = [];
    const kinds = {
      e: ['a+x=b', 'x+a=b', 'b-x=a', 'x-a=b', 'a+b=x+c'],
      a: ['x*a=b', 'b/x=a', 'x/a=b', 'a*x+c=b', 'x+x=n', 'x+x+x=n', 'a*b=x*c', 'a-x=b'],
      c: ['two', 'two2', 'ax+b=c', '(x+a)*b=c', 'xx=n', 'ax-b=c', 'x+a=b*c', 'a-x=x', 'x/a+b=c', 'tri']
    }[lv];
    const k = pick(r, kinds);
    const P = (s) => '<p class="q">What number goes in the box?</p><p class="seq">' + s + '</p>';
    if (k === 'a+x=b') { const a = ri(r, 2, 20), x = ri(r, 2, 20); ans = x; stem = P(a + ' + ' + E + ' = ' + (a + x)); exp = (a + x) + ' − ' + a + ' = ' + x + '.'; extra = [a + x + a]; }
    else if (k === 'x+a=b') { const a = ri(r, 2, 25), x = ri(r, 2, 25); ans = x; stem = P(E + ' + ' + a + ' = ' + (a + x)); exp = (a + x) + ' − ' + a + ' = ' + x + '.'; extra = [a + x + a]; }
    else if (k === 'b-x=a') { const a = ri(r, 2, 20), x = ri(r, 2, 20); ans = x; stem = P((a + x) + ' − ' + E + ' = ' + a); exp = (a + x) + ' − ' + a + ' = ' + x + '.'; extra = [a + x + a]; }
    else if (k === 'x-a=b') { const a = ri(r, 2, 20), b = ri(r, 2, 25); ans = a + b; stem = P(E + ' − ' + a + ' = ' + b); exp = b + ' + ' + a + ' = ' + ans + '.'; extra = [b - a > 0 ? b - a : ans + 2]; }
    else if (k === 'a+b=x+c') { const c = ri(r, 2, 9), x = ri(r, 3, 15), s = c + x, a = ri(r, 2, s - 1), b = s - a; ans = x; stem = P(a + ' + ' + b + ' = ' + E + ' + ' + c); exp = a + ' + ' + b + ' = ' + s + '. ' + s + ' − ' + c + ' = ' + x + '.'; extra = [s]; }
    else if (k === 'x*a=b') { const a = ri(r, 2, 9), x = ri(r, 2, 12); ans = x; stem = P(E + ' × ' + a + ' = ' + (a * x)); exp = (a * x) + ' ÷ ' + a + ' = ' + x + '.'; extra = [a * x - a]; }
    else if (k === 'b/x=a') { const a = ri(r, 2, 9), x = ri(r, 2, 12); ans = x; stem = P((a * x) + ' ÷ ' + E + ' = ' + a); exp = (a * x) + ' ÷ ' + a + ' = ' + x + '.'; extra = [a]; }
    else if (k === 'x/a=b') { const a = ri(r, 2, 9), b = ri(r, 2, 9); ans = a * b; stem = P(E + ' ÷ ' + a + ' = ' + b); exp = b + ' × ' + a + ' = ' + ans + '.'; extra = [a + b]; }
    else if (k === 'a*x+c=b') { const a = ri(r, 2, 6), x = ri(r, 2, 9), c = ri(r, 1, 9); ans = x; stem = P(a + ' × ' + E + ' + ' + c + ' = ' + (a * x + c)); exp = (a * x + c) + ' − ' + c + ' = ' + (a * x) + '. ' + (a * x) + ' ÷ ' + a + ' = ' + x + '.'; extra = [a * x, a * x + c - a]; }
    else if (k === 'x+x=n') { const x = ri(r, 4, 25); ans = x; stem = P(E + ' + ' + E + ' = ' + (2 * x)); exp = 'Half of ' + (2 * x) + ' is ' + x + '.'; extra = [2 * x]; }
    else if (k === 'x+x+x=n') { const x = ri(r, 3, 20); ans = x; stem = P(E + ' + ' + E + ' + ' + E + ' = ' + (3 * x)); exp = (3 * x) + ' ÷ 3 = ' + x + '.'; extra = [2 * x]; }
    else if (k === 'a*b=x*c') { const c = pick(r, [2, 3, 4, 5, 6]), x = ri(r, 3, 12), p = c * x; const f = []; for (let i = 2; i <= 12; i++) if (p % i === 0 && i !== c && p / i <= 12) f.push(i); if (!f.length) return null; const a = pick(r, f), b = p / a; ans = x; stem = P(a + ' × ' + b + ' = ' + E + ' × ' + c); exp = a + ' × ' + b + ' = ' + p + '. ' + p + ' ÷ ' + c + ' = ' + x + '.'; extra = [p]; }
    else if (k === 'a-x=b') { const a = ri(r, 12, 40), b = ri(r, 2, a - 2); ans = a - b; stem = P(a + ' − ' + E + ' = ' + b); exp = a + ' − ' + b + ' = ' + ans + '.'; extra = [a + b]; }
    else if (k === 'two') { const q = ri(r, 2, 15), p = ri(r, 1, q - 1); const S = 2 * q + 0, D = 0; const tri = ri(r, 3, 12), dot = ri(r, 2, tri - 1); const sum = tri + dot, dif = tri - dot; const askTri = r() < 0.5; ans = askTri ? tri : dot; stem = '<p class="q">▲ and ● are numbers. What number is ' + (askTri ? '▲' : '●') + '?</p><p class="seq">▲ + ● = ' + sum + '<br>▲ − ● = ' + dif + '</p>'; exp = 'Try numbers that add to ' + sum + ' and differ by ' + dif + ': ▲ = ' + tri + ' and ● = ' + dot + '.'; extra = [askTri ? dot : tri, sum, dif]; if (dif <= 0) return null; }
    else if (k === 'two2') { const tri = ri(r, 3, 12), dot = ri(r, 2, 12); const T = 2 * tri + dot; stem = '<p class="q">What number is ▲?</p><p class="seq">▲ + ▲ + ● = ' + T + '<br>● = ' + dot + '</p>'; ans = tri; exp = T + ' − ' + dot + ' = ' + (2 * tri) + '. Half of ' + (2 * tri) + ' is ' + tri + '.'; extra = [2 * tri, dot, T - dot]; }
    else if (k === 'ax+b=c') { const a = ri(r, 2, 9), x = ri(r, 2, 12), b = ri(r, 2, 15); ans = x; stem = P(a + ' × ' + E + ' + ' + b + ' = ' + (a * x + b)); exp = (a * x + b) + ' − ' + b + ' = ' + (a * x) + '. ' + (a * x) + ' ÷ ' + a + ' = ' + x + '.'; extra = [a * x, a * x + b - a]; }
    else if (k === '(x+a)*b=c') { const a = ri(r, 1, 9), b = ri(r, 2, 6), x = ri(r, 2, 12); ans = x; stem = P('(' + E + ' + ' + a + ') × ' + b + ' = ' + ((x + a) * b)); exp = ((x + a) * b) + ' ÷ ' + b + ' = ' + (x + a) + '. ' + (x + a) + ' − ' + a + ' = ' + x + '.'; extra = [x + a, (x + a) * b - a]; }
    else if (k === 'xx=n') { const x = ri(r, 2, 12); ans = x; stem = P(E + ' × ' + E + ' = ' + (x * x)); exp = x + ' × ' + x + ' = ' + (x * x) + '.'; extra = [x * 2, x * x / 2 | 0]; }
    else if (k === 'ax-b=c') { const a = ri(r, 2, 9), x = ri(r, 3, 12), b = ri(r, 1, a * x - 1); ans = x; stem = P(a + ' × ' + E + ' − ' + b + ' = ' + (a * x - b)); exp = (a * x - b) + ' + ' + b + ' = ' + (a * x) + '. ' + (a * x) + ' ÷ ' + a + ' = ' + x + '.'; extra = [a * x, a * x - b - a]; }
    else if (k === 'x+a=b*c') { const b = ri(r, 3, 9), c = ri(r, 3, 9), a = ri(r, 2, 20), p = b * c; if (p <= a) return null; ans = p - a; stem = P(E + ' + ' + a + ' = ' + b + ' × ' + c); exp = b + ' × ' + c + ' = ' + p + '. ' + p + ' − ' + a + ' = ' + ans + '.'; extra = [p, p + a]; }
    else if (k === 'a-x=x') { const x = ri(r, 3, 30); ans = x; stem = P((2 * x) + ' − ' + E + ' = ' + E); exp = 'Both boxes hold the same number. Half of ' + (2 * x) + ' is ' + x + '.'; extra = [2 * x, 2 * x - 1]; }
    else if (k === 'x/a+b=c') { const a = ri(r, 2, 6), y = ri(r, 2, 9), b = ri(r, 1, 9); ans = a * y; stem = P(E + ' ÷ ' + a + ' + ' + b + ' = ' + (y + b)); exp = (y + b) + ' − ' + b + ' = ' + y + '. ' + y + ' × ' + a + ' = ' + ans + '.'; extra = [y, y + b]; }
    else if (k === 'tri') { const x = ri(r, 2, 10), y = ri(r, 2, 10); if (x === y) return null; const n = x + y; stem = '<p class="q">What number is ●?</p><p class="seq">▲ + ▲ = ' + (2 * x) + '<br>▲ + ● = ' + n + '</p>'; ans = y; exp = '▲ = ' + x + ', because ' + x + ' + ' + x + ' = ' + (2 * x) + '. Then ' + x + ' + ● = ' + n + ', so ● = ' + y + '.'; extra = [x, n, 2 * x]; }
    if (!Number.isInteger(ans) || ans < 0) return null;
    const w = numOpts(r, ans, extra, 0);
    return PP.mk(r, { stem, correct: ans, wrong: w, exp, key: stem });
  };
})();
