/* Back button: remembers the screens he opened and adds "← Back" at the top of each page.
   On a browsing page (Collection, Player, Rewards, Tracker...) Back goes to the page before.
   On a practice or reward page it goes back to the page he started it from. Mock tests keep their own buttons. */
(function () {
  const PP = window.PP, app = document.getElementById('app');
  const NAV = new Set(['home', 'sec', 'fantasyHome', 'fantasy', 'collection', 'player', 'jerseys', 'toons', 'sticks', 'rules', 'tracker', 'parent', 'review', 'reviewTest', 'mistakes', 'backup', 'games', 'draft', 'draftCur', 'draftAll']);
  const STAY = new Set(['slotPick', 'benchPick', 'benchCancel', 'slotSet', 'slotClear', 'slotClose', 'fanPool', 'colPool', 'colPos', 'toonShow', 'jerLv', 'gearSet', 'draftPool', 'missFilter', 'missSec', 'missPage', 'missOpen', 'missSet',
    'pick', 'hint', 'next', 'bkCopy', 'bkFile', 'bkRestore', 'startOver', 'reset', 'resetLevels', 'parentCopy', 'shoot', 'memFlip', 'rq', 'navBack']);
  let hist = [{ a: 'home' }], onNav = true;

  function goBack() {
    PP.ui.stop();
    if (onNav) hist.pop();
    if (!hist.length) hist = [{ a: 'home' }];
    const t = hist[hist.length - 1];
    onNav = true;
    const f = PP.ui.A[t.a];
    if (f) f(t.v, t.w); else PP.ui.A.home();
  }

  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-a]');
    if (!b || b.disabled || !app.contains(b)) return;
    const name = b.dataset.a;
    if (name === 'navBack') { e.stopPropagation(); goBack(); return; }
    if (!PP.ui.A[name] || STAY.has(name) || name.indexOf('mock') === 0) return;
    if (name === 'home') { hist = [{ a: 'home' }]; onNav = true; return; }
    if (NAV.has(name)) {
      const last = hist[hist.length - 1];
      if (!(last && last.a === name && last.v === b.dataset.v)) hist.push({ a: name, v: b.dataset.v, w: b.dataset.w });
      if (hist.length > 25) hist.shift();
      onNav = true;
    } else onNav = false;
  }, true);

  function decorate() {
    const top = app.querySelector('.top');
    if (!top || top.querySelector('[data-a=navBack]')) return;
    if (/data-a="mock|Mock test #|Take a break/.test(top.innerHTML)) return;
    const first = top.querySelector('button');
    if (first && first.textContent.trim() === 'Back') return;
    if (onNav && hist.length < 2) return;
    const btn = document.createElement('button');
    btn.className = 'ghost'; btn.setAttribute('data-a', 'navBack'); btn.textContent = '← Back';
    top.insertBefore(btn, top.firstChild);
  }
  new MutationObserver(decorate).observe(app, { childList: true });
  PP._nav = () => ({ hist: hist.slice(), onNav });
})();
