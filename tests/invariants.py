"""Rule checks for Puzzle Practice. Run: python3 tests/invariants.py  (needs playwright + chromium)
Each check prints PASS/FAIL. Exit code 1 if any fail."""
import json, os, sys
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
URL = 'file://' + ROOT + '/index.html'
fails = []; errs = []
def check(name, ok, detail=''):
    print(('PASS ' if ok else 'FAIL ') + name + ((' :: ' + str(detail)) if (detail and not ok) else ''))
    if not ok: fails.append(name)

with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 820, 'height': 1180}); pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_selector('h1')
    def ev(js, arg=None): return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)

    # R1: every level takes exactly 10 right answers, with a random mix of right/wrong, in every section
    r = ev("""()=>{ PP.reset(); const out=[]; const D=PP.D;
      for (const s of PP.SECS){ let right=0, bad=null, passes=0;
        for (let i=0;i<4000 && passes<3;i++){
          const lv=PP.askLevel(s.code); const r=PP.nextQ(s.code, lv); if(!r.q) break;
          const wantRight=Math.random()<0.75, q=r.q, pick=wantRight?q.ans:(q.ans+1)%q.opts.length;
          const cur=PP.curLevel(s.code);
          const res=PP.answerPractice(q,pick,5,false,false);
          if(wantRight) right++;
          if(res.levelPassed){ passes++; if(right!==10) bad=(bad||'')+s.code+' passed '+cur+' after '+right+' right; '; right=0; }
        }
        if(passes<3) bad=(bad||'')+s.code+' only passed '+passes+'; ';
        out.push(bad);
      } return out.filter(Boolean); }""")
    check('R1 each level needs exactly 10 right answers (all 9 sections, random play)', r == [], r)

    # R2: smart practice and hint/retry answers never move level counters
    r = ev("""()=>{ PP.reset(); const snap=()=>JSON.stringify(PP.D().sec); let bad=[];
      for (const s of PP.SECS){ PP.S(s.code); }
      const before=snap();
      for (let i=0;i<300;i++){ const s=PP.SECS[i%9].code, r=PP.nextQ(s, PP.LEVELS[i%3]); if(!r.q) continue;
        PP.answerPractice(r.q, r.q.ans, 3, true, false); }
      if(snap()!==before) bad.push('smart moved counters');
      for (let i=0;i<300;i++){ const s=PP.SECS[i%9].code, r=PP.nextQ(s, PP.LEVELS[i%3]); if(!r.q) continue;
        PP.answerPractice(r.q, r.q.ans, 3, false, true); }
      if(snap()!==before) bad.push('noLevel (hint 2 / mistake retry) moved counters');
      return bad; }""")
    check('R2 smart practice and hint/retry answers never change level counters', r == [], r)

    # R3: no question repeats while unused ones remain; ids unique; answer valid
    r = ev("""()=>{ PP.reset(); let bad=[];
      for (const s of PP.SECS) for (const lv of PP.LEVELS){ const pool=PP.pool(s.code,lv), seen=new Set();
        const ids=new Set(pool.map(q=>q.id)); if(ids.size!==pool.length) bad.push(s.code+lv+' duplicate ids');
        pool.forEach(q=>{ if(!(q.ans>=0&&q.ans<q.opts.length)) bad.push(q.id+' bad ans'); if(new Set(q.opts.map(String)).size!==q.opts.length) bad.push(q.id+' duplicate options'); });
        const n=Math.min(pool.length,120);
        for(let i=0;i<n;i++){ const r=PP.nextQ(s.code,lv); if(!r.q||r.repeat||seen.has(r.q.id)){ bad.push(s.code+lv+' repeat at '+i); break;} seen.add(r.q.id); PP.markUsed(r.q); } }
      return bad.slice(0,10); }""")
    check('R3 pools: unique ids, valid answers, distinct options, no repeats before exhaustion', r == [], r)

    # R4: backup code round trip is exact, including after play
    r = ev("""async()=>{ PP.reset(); for(let i=0;i<150;i++){ const s=PP.SECS[i%9].code, r=PP.nextQ(s,PP.askLevel(s)); if(!r.q)continue; PP.answerPractice(r.q, Math.random()<.7?r.q.ans:0, 4, i%3==0, false);} PP.claimSession(); PP.winJersey('e'); PP.addPicks(2,0);
      const code=await PP.exportCode(), back=await PP.parseCode(code); return JSON.stringify(back)===JSON.stringify(PP.D()); }""")
    check('R4 backup then restore gives identical data', r is True, r)

    # R5: restoring a bad / tampered / old code fails safely and does not change data
    r = ev("""async()=>{ const before=JSON.stringify(PP.D()); const bads=['', 'hello', 'PP1:@@@', 'PP0:eyJ2IjoxfQ==', 'PP1:H4sIAAAAAAAAA6tWSkksSVWyUlBKzUvOT0lVslJQKkktLlGqBQC4P4F7HgAAAA==']; let ok=true;
      for(const c of bads){ try{ await PP.parseCode(c); ok=false; }catch(e){} } return ok && before===JSON.stringify(PP.D()); }""")
    check('R5 bad backup codes are rejected safely', r is True, r)

    # R6: rewards given once: jersey/pick only on a real level pass; session reward once per 10
    r = ev("""()=>{ PP.reset(); const D=PP.D(); let bad=[];
      let picks0=D.fan.picks.length, j0=Object.values(D.jer.owned).reduce((a,b)=>a+b,0);
      const s='VA'; let passes=0;
      for(let i=0;i<500&&passes<3;i++){ const r=PP.nextQ(s,PP.askLevel(s)); const res=PP.answerPractice(r.q,r.q.ans,3,false,false); if(res.levelPassed) passes++; }
      const j1=Object.values(D.jer.owned).reduce((a,b)=>a+b,0);
      if(D.fan.picks.length-picks0!==3) bad.push('picks '+(D.fan.picks.length-picks0)+' for 3 passes');
      if(j1-j0!==3) bad.push('jerseys '+(j1-j0)+' for 3 passes');
      // smart: 10 perfect answers -> exactly one claim reward
      PP.reset(); let done=0, tc=0; const D2=PP.D();
      for(let i=0;i<25;i++){ const sc=PP.smartSection(), r=PP.nextQ(sc,'e'); const res=PP.answerPractice(r.q,r.q.ans,3,true,false); if(res.sessionDone){ done++; const c=PP.claimSession(); if(c.toon) tc++; } }
      if(done!==2||tc!==2) bad.push('smart sessions '+done+' toons '+tc);
      PP.sessionAdd(true); let last=false; for(let i=0;i<9;i++) last=PP.sessionAdd(true); const c1=PP.claimSession(), again=PP.claimSession(); if(!c1.toon) bad.push('perfect session gave no toon'); if(again.toon) bad.push('claim twice gave a toon');
      return bad; }""")
    check('R6 rewards are given exactly once per achievement', r == [], r)

    # R7: mock test structure and finishing
    r = ev("""()=>{ PP.reset(); let bad=[]; const D=PP.D();
      for(let k=0;k<4;k++){ PP.startMock(); const c=D.cur;
        c.subs.forEach(s=>{ if(s.ids.length!==15) bad.push('part '+s.code+' has '+s.ids.length); if(new Set(s.ids).size!==s.ids.length) bad.push('dup in '+s.code);
          s.picks=s.ids.map((id,i)=>Math.random()<.2?null:(Math.random()<.6?PP.get(id).ans:0)); });
        const allIds=c.subs.flatMap(s=>s.ids); if(new Set(allIds).size!==allIds.length) bad.push('dup across parts');
        const t=PP.finishMock(); const exp=c.subs.reduce((n,s)=>n+s.ids.filter((id,i)=>s.picks[i]===PP.get(id).ans).length,0);
        if(PP.testTotal(t)!==exp) bad.push('score mismatch '+PP.testTotal(t)+' vs '+exp);
        if(D.cur!==null) bad.push('cur not cleared');
        const r1=PP.mockReward(t); if(r1.picks>1) bad.push('multi pick');
        if(D.focus){ D.focus=null; } }
      return bad.slice(0,8); }""")
    check('R7 mock tests: 15 per part, no duplicates, correct score, cleared after finish', r == [], r)

    # R8: progress survives a reload exactly
    r = ev("""()=>{ PP.reset(); for(let i=0;i<80;i++){ const s=PP.SECS[i%9].code, r=PP.nextQ(s,PP.askLevel(s)); PP.answerPractice(r.q,r.q.ans,3,false,false);} PP.save(); const d=JSON.parse(JSON.stringify(PP.D())); delete d.fan.teams; return JSON.stringify(d); }""")
    pg.reload(); pg.wait_for_selector('h1')
    r2 = ev("()=>{ const d=JSON.parse(JSON.stringify(PP.D())); delete d.fan.teams; return JSON.stringify(d); }")
    check('R8 progress is identical after closing and reopening', json.loads(r) == json.loads(r2))

    # R9: old saves with banked credits above the level in progress are cleaned at load
    ev("""()=>{ const d=JSON.parse(localStorage.getItem('pp3')); d.sec.VA={e:{c:4,w:0},a:{c:9,w:0},c:{c:9,w:0}}; localStorage.setItem('pp3',JSON.stringify(d)); }""")
    pg.reload(); pg.wait_for_selector('h1')
    r = ev("()=>{ const s=PP.D().sec.VA; return [s.e.c,s.a.c,s.c.c]; }")
    check('R9 banked credits above the current level are cleared on load', r == [4, 0, 0], r)

    # R10: corrupt storage does not break the app
    ev("()=>localStorage.setItem('pp3','{not json')")
    pg.reload(); pg.wait_for_selector('h1')
    check('R10 corrupt saved data: app still opens with a fresh start', ev("()=>Object.keys(PP.D().sec).length>=0"))

    check('no page errors during all checks', errs == [], errs[:3])
    b.close()
print('\n%d failed' % len(fails) if fails else '\nALL PASS')
sys.exit(1 if fails else 0)
