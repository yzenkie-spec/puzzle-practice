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
    check('F1b smart session with 9 of 10 right: one all-time legend pick, and one cartoon from the 6-in-a-row', ev("()=>JSON.stringify([PP.D().fan.picks.map(k=>k.pool), Object.values(PP.D().toon.owned).reduce((a,b)=>a+b,0)])") == '[["all"],1]')
    check('F1c smart practice left level counters untouched', ev("()=>JSON.stringify(PP.D().sec)") == sec0 or all(v['e']['c']+v['a']['c']+v['c']['c']==0 for v in ev("()=>PP.D().sec").values()))
    # F5 back button: Home -> Fantasy -> Collection -> Player, then Back each step; a section page and a practice question go back to where they started
    ev("()=>PP.reset()"); pg.reload(); pg.wait_for_selector('h1')
    ev("()=>{const D=PP.D(); PP.NHL.cur.slice(0,3).forEach(p=>D.fan.owned[p.id]=1); PP.save(); PP.home();}")
    check('F5a no Back button on the home page', pg.query_selector('[data-a=navBack]') is None)
    pg.click('[data-a=fantasyHome]'); pg.click('[data-a=collection]')
    pg.click('[data-a=player]')
    check('F5b player page shows a Back button', pg.query_selector('[data-a=navBack]') is not None)
    pg.click('[data-a=navBack]'); check('F5c Back from player returns to the collection', 'Player collection' in pg.inner_text('h1'))
    pg.click('[data-a=navBack]'); check('F5d Back from collection returns to the fantasy page', 'fantasy' in pg.inner_text('h1').lower())
    pg.click('[data-a=navBack]'); check('F5e Back from fantasy returns home', pg.query_selector('[data-a=smart]') is not None)
    pg.click('[data-a=rules]'); pg.click('[data-a=navBack]'); check('F5f Back from rewards returns home', pg.query_selector('[data-a=smart]') is not None)
    pg.click('[data-a=sec]'); first_sec = pg.inner_text('h1'); pg.click('[data-a=practice]')
    pg.click('[data-a=navBack]') if pg.query_selector('[data-a=navBack]') else pg.click('.top button')
    check('F5g leaving a practice question goes back to the section page', first_sec in pg.inner_text('h1'), pg.inner_text('h1'))

    # F6 bench on the fantasy page: tap a bench player, tap a highlighted spot, the old player goes to the bench
    ev("()=>{PP.reset();const D=PP.D();const cs=PP.NHL.cur.filter(p=>p.pos==='C').slice(0,3);cs.forEach(p=>D.fan.owned[p.id]=1);PP.fan.place('cur','C1',cs[0].id);window._cs=cs.map(p=>p.id);PP.save();PP.home();}")
    pg.click('[data-a=fantasyHome]')
    check('F6a bench shows the two collected players outside the lineup', ev("()=>document.querySelectorAll('[data-a=benchPick]').length") == 2)
    pg.click('[data-a=benchPick][data-v="%s"]' % ev("()=>window._cs[1]"))
    check('F6b picking a bench player highlights matching spots', ev("()=>document.querySelectorAll('.slotbtn.tgt').length") >= 3)
    pg.click('[data-a=slotPick][data-v=C1]')
    ok6 = ev("()=>[PP.fan.team('cur').slots.C1===window._cs[1], PP.fan.bench('cur').some(p=>p.id===window._cs[0])]")
    check('F6c tapping a spot swaps: new player in, old player on the bench', ok6 == [True, True], ok6)
    pg.click('[data-a=benchPick][data-v="%s"]' % ev("()=>window._cs[0]")); pg.click('[data-a=slotPick][data-v=LW1]')
    check('F6d a wrong-position spot does not move him', ev("()=>PP.fan.bench('cur').some(p=>p.id===window._cs[0])"))
    pg.click('[data-a=benchCancel]')
    check('F6e cancel puts the pick away', ev("()=>document.querySelectorAll('.slotbtn.tgt').length") == 0)

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
    check('F2b perfect mock test gives a retro jersey, a cartoon and both sticks, and no draft pick', t['picks'] == picks0 and ev("()=>JSON.stringify([Object.keys(PP.D().jer.owned).map(k=>k.split('|')[1]), PP.D().tests[0].rw.toon, PP.D().tests[0].rw.stick, PP.D().tests[0].rw.special])") == '[["c"],true,true,true]', t)
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
    check('F3b partial mock finishes, no extra pick, focus practice created', t['tests'] == 2 and t['cur'] is None and t['focus'] and t['picks'] == picks0, t)
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
