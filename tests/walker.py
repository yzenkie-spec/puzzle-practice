"""Random tapper: plays the real screens like a child (answers, double taps, quits halfway, reloads, mock tests,
drafts, albums) and checks the rules after every tap.  Run: python3 tests/walker.py [steps] [seed]"""
import os, sys, random
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')); URL = 'file://' + ROOT + '/index.html'
STEPS = int(sys.argv[1]) if len(sys.argv) > 1 else 600; SEED = int(sys.argv[2]) if len(sys.argv) > 2 else 1
rnd = random.Random(SEED); errs = []; bad = []
SKIP = {'reset', 'resetLevels', 'bkRestore', 'bkFile', 'bkCopy', 'parentCopy'}
SNAP = """()=>{ const D=PP.D(); let passes=0, credit=0, bad=[];
  for(const s of PP.SECS){ const x=D.sec[s.code]; if(!x) continue;
    if(x.e.c<10&&(x.a.c||x.c.c)) bad.push(s.code+' harder credit while easier open');
    if(x.a.c<10&&x.c.c) bad.push(s.code+' challenging credit while average open');
    if(x.e.c>10||x.a.c>10) bad.push(s.code+' counter over 10');
    ['e','a','c'].forEach(l=>{ if(x[l].c>=10) passes++; credit+=Math.min(x[l].c,10); }); }
  return { passes, credit, used:Object.values(D.used).reduce((a,b)=>a+b,0), picks:D.fan.picks.length,
    toons:Object.values(D.toon.owned).reduce((a,b)=>a+b,0), jer:Object.values(D.jer.owned).reduce((a,b)=>a+b,0),
    tests:D.tests.length, cur:!!D.cur, sess:D.sess.n, bad }; }"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_context(viewport={'width': 820, 'height': 1180}).new_page()
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('dialog', lambda d: d.dismiss())
    pg.goto(URL); pg.wait_for_selector('h1')
    pg.evaluate("()=>{ const D=PP.D(); PP.SECS.forEach(s=>{ PP.S(s.code).e.c=8; }); D.sess.n=6; D.sess.ok=6; PP.save(); }")
    pg.reload(); pg.wait_for_selector('h1'); prev = pg.evaluate(SNAP); log = []
    for step in range(STEPS):
        act = None
        try:
            opts = pg.query_selector_all('#opts .opt:not([disabled])')
            if opts and pg.query_selector('#opts .opt.sel, #opts .opt.good, #opts .opt.bad') is None and rnd.random() < .9:
                o = rnd.choice(opts); act = 'answer'
                if rnd.random() < .25: o.dblclick(timeout=1500)
                else: o.click(timeout=1500)
            else:
                r = rnd.random()
                if r < .015: act = 'reload'; pg.reload(); pg.wait_for_selector('h1,#app', timeout=4000)
                elif r < .03: act = 'home'; pg.evaluate("()=>PP.home()")
                else:
                    btns = [x for x in pg.query_selector_all('[data-a]') if x.is_visible() and x.get_attribute('data-a') not in SKIP and x.is_enabled()]
                    pri = [x for x in btns if x.get_attribute('data-a') in ('smart', 'practice', 'next', 'smartGo', 'levelUp', 'sessionDone', 'mockStart', 'mockGo', 'mockNext', 'draft', 'pick', 'focusStart', 'cont', 'sec')]
                    pool = pri if (pri and rnd.random() < .7) else btns
                    if not pool: pg.evaluate("()=>PP.home()"); continue
                    x = rnd.choice(pool); act = x.get_attribute('data-a'); act = 'answer' if act == 'pick' else act; x.click(timeout=1500)
            if act == 'mockFinishAll' and False: pass
        except Exception as e:
            log.append('step %d %s: %s' % (step, act, str(e)[:80])); continue
        s = pg.evaluate(SNAP); d = {k: s[k] - prev[k] for k in ('passes', 'credit', 'used', 'picks')}
        if s['bad']: bad.append((step, act, s['bad']))
        if act == 'answer':
            if d['used'] > 1: bad.append((step, act, 'one tap recorded %d answers' % d['used']))
            if d['credit'] > 1: bad.append((step, act, 'one answer gave %d level credits' % d['credit']))
            if d['passes'] > 1: bad.append((step, act, 'one answer passed %d levels' % d['passes']))
            if d['picks'] > 1: bad.append((step, act, 'one answer gave %d picks' % d['picks']))
        else:
            if d['passes'] or d['credit']: bad.append((step, act, 'level credit changed on a non-answer tap (%s)' % act))
        if d['picks'] > 0 and act not in ('answer', 'mockFinishAll', 'mockGo', 'mockDonePart', 'mockPart', 'mockNext', 'mockPrev', 'mockJump', 'mockResume'):
            bad.append((step, act, 'draft picks changed on %s' % act))
        if s['toons'] - prev['toons'] > 1: bad.append((step, act, 'two cartoons at once'))
        prev = s
    print('steps', STEPS, 'seed', SEED, '| passes', prev['passes'], 'picks', prev['picks'], 'toons', prev['toons'], 'jerseys', prev['jer'], 'mock tests', prev['tests'])
    print('click misses:', len(log), log[:3]); print('page errors:', errs[:3]); print('rule breaks:', bad[:6])
    b.close()
sys.exit(1 if (errs or bad) else 0)
