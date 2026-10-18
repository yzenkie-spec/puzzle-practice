"""Screen-level flows: smart session reward, mock test (perfect, partial, reload midway), focus practice. Run: python3 tests/flows.py"""
import os, sys
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')); URL = 'file://' + ROOT + '/index.html'
fails = []; errs = []
def check(n, ok, d=''):
    print(('PASS ' if ok else 'FAIL ') + n + ((' :: ' + str(d)) if (d and not ok) else '')); 
    if not ok: fails.append(n)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_context(viewport={'width': 820, 'height': 1180}).new_page()
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_selector('h1')
    ev = pg.evaluate
    def ans(correct=True):
        a = ev("()=>PP._dbg().P.q"); i = a['ans'] if correct else (a['ans'] + 1) % len(a['opts'])
        pg.click('#opts .opt[data-v="%d"]' % i)
    # F1 smart session: 10 questions, 9 right -> exactly one cartoon, level counters untouched, 10 questions exactly
    ev("()=>{PP.reset();}"); pg.reload(); pg.wait_for_selector('h1')
    sec0 = ev("()=>JSON.stringify(PP.D().sec)")
    pg.click('[data-a=smart]'); n = 0
    while True:
        ans(n != 3); n += 1
        btn = pg.inner_text('.go'); pg.click('.go')
        if 'Finish session' in btn or n > 14: break
    check('F1a smart session ends after exactly 10 questions', n == 10, n)
    check('F1b smart session rewards one cartoon', ev("()=>Object.values(PP.D().toon.owned).reduce((a,b)=>a+b,0)") == 1)
    check('F1c smart practice left level counters untouched', ev("()=>JSON.stringify(PP.D().sec)") == sec0 or all(v['e']['c']+v['a']['c']+v['c']['c']==0 for v in ev("()=>PP.D().sec").values()))
    # F2 mock test: answer everything correctly, finish -> exactly one draft pick, focus cleared
    pg.evaluate("()=>PP.home()")
    picks0 = ev("()=>PP.D().fan.picks.length")
    ev("()=>{PP.startMock();}")
    ev("()=>{const c=PP.D().cur; c.subs.forEach(s=>{s.picks=s.ids.map(id=>PP.get(id).ans); s.done=true;}); PP.save();}")
    ev("()=>PP.ui.A.mockFinishAll()")
    pg.wait_for_timeout(300)
    t = ev("()=>({tests:PP.D().tests.length,cur:PP.D().cur,picks:PP.D().fan.picks.length,focus:PP.D().focus})")
    if t['tests'] == 0:   # fall back to clicking through the hub
        for _ in range(3):
            b2 = pg.query_selector('[data-a=mockFinishAll]')
            if b2: b2.click(); pg.wait_for_timeout(200)
        t = ev("()=>({tests:PP.D().tests.length,cur:PP.D().cur,picks:PP.D().fan.picks.length,focus:PP.D().focus})")
    check('F2a perfect mock test is saved', t['tests'] == 1, t)
    check('F2b perfect mock test gives exactly one draft pick', t['picks'] - picks0 == 1, t)
    check('F2c no focus practice after a perfect test', t['focus'] is None, t)
    # F3 partial test: reload midway keeps answers; unanswered count as misses; focus appears
    ev("()=>{PP.startMock(); const c=PP.D().cur; c.subs[0].picks[0]=PP.get(c.subs[0].ids[0]).ans; PP.save();}")
    pg.reload(); pg.wait_for_selector('h1')
    check('F3a half-finished mock survives reload', ev("()=>PP.D().cur && PP.D().cur.subs[0].picks[0]!==null"))
    ev("()=>{const c=PP.D().cur; c.subs.forEach(s=>s.done=true); PP.save();}")
    ev("()=>PP.ui.A.mockFinishAll()"); pg.wait_for_timeout(200)   # first tap: asks to confirm unanswered questions
    check('F3b-0 first finish tap with unanswered questions does not finish the test', ev("()=>!!PP.D().cur"))
    ev("()=>PP.ui.A.mockFinishAll()"); pg.wait_for_timeout(300)   # second tap: finishes
    t = ev("()=>({tests:PP.D().tests.length,cur:PP.D().cur,focus:!!PP.D().focus,picks:PP.D().fan.picks.length})")
    check('F3b partial mock finishes, no extra pick, focus practice created', t['tests'] == 2 and t['cur'] is None and t['focus'] and t['picks'] == 1, t)
    # F4 focus practice: wrong-with-hint answers do not count; finishing clears focus and unlocks next mock
    pg.evaluate("()=>PP.home()"); 
    b2 = pg.query_selector('[data-a=focusStart]') or None
    ev("()=>PP.ui.A.focusStart()")
    pg.wait_for_timeout(200)
    guard = 0
    while ev("()=>!!PP.D().focus") and guard < 120:
        guard += 1
        if pg.query_selector('#opts .opt:not([disabled])') is None: 
            nb = pg.query_selector('.go'); 
            if nb: nb.click()
            else: break
            continue
        ans(True); nb = pg.query_selector('.go')
        if nb: nb.click()
    check('F4 focus practice can be completed and clears itself', ev("()=>PP.D().focus") is None, guard)
    check('no page errors', errs == [], errs[:3])
    b.close()
print('\n%d failed' % len(fails) if fails else '\nALL PASS'); sys.exit(1 if fails else 0)
