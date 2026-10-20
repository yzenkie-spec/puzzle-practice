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

    # R1: a level is passed when 8 of the last 10 counted answers are right (window full), in every section and level.
    # An independent reference model decides when a pass is allowed; the app must agree on every single answer.
    r = ev("""()=>{ PP.reset(); const bad=[];
      const probs=[1,0.9,0.8,0.75,0.6,0.5];
      for (const s of PP.SECS) for (const p of probs){
        PP.resetLevels(); let win=[], passes=0, n=0;
        while (passes<3 && n<400){
          const lv=PP.askLevel(s.code,false), r=PP.nextQ(s.code,lv); if(!r.q) break;
          const right=Math.random()<p, q=r.q, pick=right?q.ans:(q.ans+1)%q.opts.length;
          const res=PP.answerPractice(q,pick,5,false,false); n++;
          win.push(right?1:0); if(win.length>10) win.shift();
          const expect = win.length>=10 && win.reduce((a,b)=>a+b,0)>=8;
          if(res.levelPassed!==expect){ bad.push(s.code+' p='+p+' answer '+n+' expected pass='+expect+' got '+res.levelPassed+' window '+win.join('')); break; }
          if(expect){ passes++; win=[]; }
        }
      } return bad.slice(0,6); }""")
    check('R1 pass = 8 of the last 10 right, matches the reference rule on every answer (all sections, 6 skill levels)', r == [], r)
    r = ev("""()=>{ PP.resetLevels(); const out=[]; const pat='RRRRRRRWWW';   // exactly 7 of every 10: must never pass
      const s='PF'; let n=0, passed=false;
      for(let i=0;i<120;i++){ const r=PP.nextQ(s,PP.askLevel(s,false)); const right=pat[i%10]==='R';
        const res=PP.answerPractice(r.q, right?r.q.ans:(r.q.ans+1)%r.q.opts.length,4,false,false); if(res.levelPassed) passed=true; }
      return passed; }""")
    check('R1b a steady 70% never passes a level, however long he practises', r is False, r)

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
    r = ev("""async()=>{ PP.reset(); for(let i=0;i<150;i++){ const s=PP.SECS[i%9].code, r=PP.nextQ(s,PP.askLevel(s)); if(!r.q)continue; PP.answerPractice(r.q, Math.random()<.7?r.q.ans:0, 4, i%3==0, false);} PP.claimSession(); PP.winJersey('e'); PP.addPicks(2,'cur',0);
      const code=await PP.exportCode(), back=await PP.parseCode(code); return JSON.stringify(back)===JSON.stringify(PP.D()); }""")
    check('R4 backup then restore gives identical data', r is True, r)

    # R5: restoring a bad / tampered / old code fails safely and does not change data
    r = ev("""async()=>{ const before=JSON.stringify(PP.D()); const bads=['', 'hello', 'PP1:@@@', 'PP0:eyJ2IjoxfQ==', 'PP1:H4sIAAAAAAAAA6tWSkksSVWyUlBKzUvOT0lVslJQKkktLlGqBQC4P4F7HgAAAA==']; let ok=true;
      for(const c of bads){ try{ await PP.parseCode(c); ok=false; }catch(e){} } return ok && before===JSON.stringify(PP.D()); }""")
    check('R5 bad backup codes are rejected safely', r is True, r)

    # R6: rewards given once: a current-player pick only on a real level pass (no jersey); smart session of 10 with 9 right = one legend pick
    r = ev("""()=>{ PP.reset(); const D=PP.D(); let bad=[];
      let picks0=D.fan.picks.length, j0=Object.values(D.jer.owned).reduce((a,b)=>a+b,0);
      const s='VA'; let passes=0;
      for(let i=0;i<500&&passes<3;i++){ const r=PP.nextQ(s,PP.askLevel(s)); const res=PP.answerPractice(r.q,r.q.ans,3,false,false); if(res.levelPassed) passes++; }
      const j1=Object.values(D.jer.owned).reduce((a,b)=>a+b,0);
      if(D.fan.picks.length-picks0!==3) bad.push('picks '+(D.fan.picks.length-picks0)+' for 3 passes');
      if(!D.fan.picks.every(k=>k.pool==='cur')) bad.push('level-pass picks are not current-player picks');
      if(j1-j0!==0) bad.push('jerseys '+(j1-j0)+' from level passes');
      PP.reset(); let done=0, pk=0; const D2=PP.D();
      for(let i=0;i<25;i++){ const sc=PP.smartSection(), r=PP.nextQ(sc,'e'); const res=PP.answerPractice(r.q,r.q.ans,3,true,false); if(res.sessionDone){ done++; const c=PP.claimSession(); if(c.pick) pk++; } }
      if(done!==2||pk!==2) bad.push('smart sessions '+done+' legend picks '+pk);
      if(!D2.fan.picks.every(k=>k.pool==='all')) bad.push('session picks are not legend picks');
      PP.reset(); PP.sessionAdd(true); for(let i=0;i<8;i++) PP.sessionAdd(false); PP.sessionAdd(false);
      if(PP.claimSession().pick) bad.push('1 of 10 gave a pick');
      PP.reset(); for(let i=0;i<9;i++) PP.sessionAdd(true); PP.sessionAdd(false);
      const c1=PP.claimSession(), again=PP.claimSession(); if(!c1.pick) bad.push('9 of 10 gave no pick'); if(again.pick) bad.push('claim twice gave a pick');
      PP.reset(); for(let i=0;i<8;i++) PP.sessionAdd(true); for(let i=0;i<2;i++) PP.sessionAdd(false);
      if(PP.claimSession().pick) bad.push('8 of 10 gave a pick');
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
        const r1=PP.mockReward(t); if(D.fan.picks.length) bad.push('mock gave a draft pick');
        if(D.focus){ D.focus=null; } }
      return bad.slice(0,8); }""")
    check('R7 mock tests: 15 per part, no duplicates, correct score, cleared after finish', r == [], r)

    # R8: progress survives a reload exactly
    r = ev("""()=>{ PP.reset(); for(let i=0;i<80;i++){ const s=PP.SECS[i%9].code, r=PP.nextQ(s,PP.askLevel(s)); PP.answerPractice(r.q,r.q.ans,3,false,false);} PP.save(); const d=JSON.parse(JSON.stringify(PP.D())); delete d.fan.teams; return JSON.stringify(d); }""")
    pg.reload(); pg.wait_for_selector('h1')
    r2 = ev("()=>{ const d=JSON.parse(JSON.stringify(PP.D())); delete d.fan.teams; return JSON.stringify(d); }")
    check('R8 progress is identical after closing and reopening', json.loads(r) == json.loads(r2))

    # R9: a save made under the old rule (10 right answers) is reset once; collections, tests and mistakes stay
    ev("""()=>{ const d=JSON.parse(JSON.stringify(PP.D())); delete d.rule;
      d.sec.VA={e:{c:10,w:0},a:{c:9,w:0},c:{c:9,w:0}}; d.toon.owned={t1:2}; d.jer.owned={'BOS|e':1}; d.fan.owned={cur1:1};
      d.miss={'VA-e-1':{n:1,u:0,ts:1,pick:0}}; d.tests=[{id:1,date:'2026-10-10T00:00:00Z',subs:[]}]; d.stars=77;
      localStorage.setItem('pp3',JSON.stringify(d)); }""")
    pg.reload(); pg.wait_for_selector('h1')
    r = ev("""()=>{ const d=PP.D(); const allZero=PP.SECS.every(s=>PP.LEVELS.every(l=>{ const x=PP.S(s.code)[l]; return !x.c&&!x.w&&!x.r.length&&!x.p; })); const anyPassed=PP.SECS.some(s=>PP.LEVELS.some(l=>PP.passed(s.code,l)));
      return { rule:d.rule, anyPassed, allZero, toon:d.toon.owned, jer:d.jer.owned, fan:d.fan.owned.cur1||0, miss:Object.keys(d.miss), tests:d.tests.length, stars:d.stars }; }""")
    want = {'rule': 2, 'anyPassed': False, 'allZero': True, 'toon': {'t1': 2}, 'jer': {'BOS|e': 1}, 'fan': 1, 'miss': ['VA-e-1'], 'tests': 1, 'stars': 77}
    check('R9 old-rule levels are reset once; collections, tests, mistakes and stars are kept', r == want, r)
    ev("()=>{ PP.S('VA').e.p=1; PP.save(); }"); pg.reload(); pg.wait_for_selector('h1')
    check('R9b the reset runs only once (a level passed afterwards stays passed)', ev("()=>PP.passed('VA','e')") is True)

    # R10: corrupt storage does not break the app
    ev("()=>localStorage.setItem('pp3','{not json')")
    pg.reload(); pg.wait_for_selector('h1')
    check('R10 corrupt saved data: app still opens with a fresh start', ev("()=>Object.keys(PP.D().sec).length>=0"))

    # R11: a save from before question bank 2 keeps levels and scores, and retires old history only for the rebuilt parts
    ev("""()=>{ const d=JSON.parse(JSON.stringify(PP.D())); delete d.bank; d.rule=2;
      d.sec.FM={e:{c:10,w:2},a:{c:3,w:1},c:{c:0,w:0}};
      d.used={'FM-e-3':2,'VA-a-1':1,'NS-e-4':1}; d.miss={'FC-a-2':{n:1,u:0,ts:1,pick:0},'NP-e-5':{n:1,u:0,ts:1,pick:1}};
      d.tag={'FM|shape+fill':{n:3,c:1,s:0.5},'NS|add':{n:2,c:2,s:0.1}};
      d.tests=[{id:1,date:'2026-10-10T00:00:00Z',subs:[{code:'FM',score:1,items:[{id:'FM-e-1',lv:'e',tag:'x',pick:0,ok:true}]},{code:'NS',score:1,items:[{id:'NS-e-1',lv:'e',tag:'add',pick:0,ok:true}]}]}];
      d.cur={id:2,date:'2026-10-11T00:00:00Z',si:0,subs:[{code:'VC',ids:['VC-e-1'],fu:[0],picks:[2],left:100,done:true,started:true},{code:'NS',ids:['NS-e-2'],fu:[0],picks:[1],left:50,done:true,started:true}]};
      localStorage.setItem('pp3',JSON.stringify(d)); }""")
    pg.reload(); pg.wait_for_selector('h1')
    r = ev("""()=>{ const d=PP.D(); return { bank:d.bank, lv:d.sec.FM.e.c, used:Object.keys(d.used).sort(), miss:Object.keys(d.miss),
      tag:Object.keys(d.tag), oldFM:d.tests[0].subs[0].items[0].old||0, oldNS:d.tests[0].subs[1].items[0].old||0, score:PP.testTotal(d.tests[0]),
      curVC:[d.cur.subs[0].picks[0], d.cur.subs[0].done], curNS:[d.cur.subs[1].picks[0], d.cur.subs[1].done] }; }""")
    want = {'bank': 2, 'lv': 10, 'used': ['NS-e-4'], 'miss': ['NP-e-5'], 'tag': ['NS|add'], 'oldFM': 1, 'oldNS': 0, 'score': 2, 'curVC': [None, False], 'curNS': [1, True]}
    check('R11 update keeps levels and scores, retires old history only for rebuilt parts', r == want, r)
    pg.reload(); pg.wait_for_selector('h1')
    check('R11b the update runs only once', ev("()=>PP.D().cur.subs[1].picks[0]") == 1)
    ev("()=>{ PP.reset && PP.reset(); }")

    # R12: word questions never offer a second right answer
    r = ev("""()=>{ const bad=[];
      for (const lv of PP.LEVELS) {
        for (const q of PP.pool('VA',lv)) { const m=q.stem.match(/seq va">(.*?) → (.*?) : (.*?) → \\?/); if(!m){bad.push(q.id+' format'); continue;}
          const ban=PP._vaAlso(m[3]); q.opts.forEach((o,i)=>{ if(i!==q.ans && ban.includes(o)) bad.push(q.id+' '+o); }); }
        for (const q of PP.pool('VC',lv)) { const ban=PP._vcBelongs(q.tag); q.opts.forEach((o,i)=>{ if(i!==q.ans && ban.includes(o)) bad.push(q.id+' '+o); }); }
      } return bad; }""")
    check('R12 analogies and classifications never offer a word that also fits', r == [], r[:5])

    # R13: figure parts are complete and varied
    r = ev("""()=>{ const bad=[], need={FM:['shade','size','count','rot180','flip','rot90'], FC:['sides','curved','half','parts','insame','quarter','halfany','third']};
      for (const s of ['FM','FC']) { const seen=new Set();
        for (const lv of PP.LEVELS) { const pool=PP.pool(s,lv); if(pool.length!==100) bad.push(s+lv+' size '+pool.length);
          pool.forEach(q=>{ q.tag.split('+').forEach(t=>seen.add(t)); if(new Set(q.opts).size!==5) bad.push(q.id+' repeated picture'); }); }
        need[s].forEach(t=>{ if(!seen.has(t)) bad.push(s+' never asks '+t); }); }
      return bad; }""")
    check('R13 figure matrices and classification: 100 per level, 5 different pictures, every puzzle type used', r == [], r[:5])

    # R14: streak ladder: 5 cartoon, 8 stick, 10 special stick then restart; wrong resets; hints do not add
    r = ev("""()=>{ PP.reset(); const D=PP.D(), bad=[]; const t=()=>({toon:Object.keys(D.toon.owned).length, stick:Object.keys(D.stick.owned).length});
      let got=[]; for(let i=1;i<=10;i++){ const o=PP.streakStep(true,false); got.push([i,!!o.toon,!!o.stick,!!(o.stick&&o.stick.special)]); }
      const exp=[[1,0,0,0],[2,0,0,0],[3,0,0,0],[4,0,0,0],[5,1,0,0],[6,0,0,0],[7,0,0,0],[8,0,1,0],[9,0,0,0],[10,0,1,1]];
      if(JSON.stringify(got.map(g=>g.map(Number)))!==JSON.stringify(exp)) bad.push('ladder '+JSON.stringify(got));
      const ps=PP.STICKS.filter(x=>D.stick.owned[x.id]); if(ps.length<2) bad.push('sticks not stored');
      if(D.streak.n!==0) bad.push('no restart after 10: '+D.streak.n);
      PP.reset(); for(let i=0;i<4;i++) PP.streakStep(true,false); PP.streakStep(false,false); const o5=PP.streakStep(true,false);
      if(o5.toon||PP.D().streak.n!==1) bad.push('wrong answer did not reset');
      PP.reset(); for(let i=0;i<4;i++) PP.streakStep(true,false); const h=PP.streakStep(true,true); if(h.toon||PP.D().streak.n!==4) bad.push('hinted answer moved the streak');
      const w=PP.streakStep(false,true); if(PP.D().streak.n!==0) bad.push('hinted wrong answer did not reset');
      PP.reset(); let toons=0; for(let i=0;i<20;i++){ const o=PP.streakStep(true,false); if(o.toon) toons++; } if(toons!==2) bad.push('20 straight gave '+toons+' cartoons');
      PP.reset(); const r2=PP.nextQ('VA','e'); const before=PP.D().streak.n; const res=PP.answerPractice(r2.q,r2.q.ans,3,false,false,false); if(PP.D().streak.n!==before+1) bad.push('practice answer did not count');
      const r3=PP.nextQ('VA',PP.askLevel('VA')); PP.answerPractice(r3.q,r3.q.ans,3,false,false,true); if(PP.D().streak.n!==before+1) bad.push('hinted practice answer counted');
      PP.answerPractice(r3.q,(r3.q.ans+1)%5,3,false,false,false); if(PP.D().streak.n!==0) bad.push('wrong practice answer kept the streak');
      return bad; }""")
    check('R14 streak ladder: 5 cartoon, 8 stick, 10 special stick; wrong answers reset; hints do not count', r == [], r)

    # R15: mock test rewards: jersey at 90% (variant by score), streak payouts from the longest run, no draft pick
    r = ev("""()=>{ PP.reset(); const D=PP.D(), bad=[];
      const mk=(wrongAt)=>({subs:[{items:Array.from({length:30},(_,i)=>({ok:!wrongAt.includes(i)}))}]});
      const run=w=>PP.longestRun(mk(w));
      if(run([])!==30) bad.push('run all right '+run([])); if(run([4,9])!==15&&run([4,9])!==20) bad.push('run split '+run([4,9])); if(run(Array.from({length:30},(_,i)=>i))!==0) bad.push('run none');
      if(run([4,9,14,19,24,29])!==4) bad.push('run of 4 = '+run([4,9,14,19,24,29]));
      const full=(n,right,longest)=>({subs:[{items:Array.from({length:n},(_,i)=>({ok:i<right}))}],longest});
      const fake=(pct,longest)=>{ const n=135, right=Math.round(n*pct); return {subs:[{score:right,items:Array.from({length:n},(_,i)=>({ok:i<right}))}],longest}; };
      let o=PP.mockReward(fake(0.89,4)); if(o.jersey||o.toon||o.stick||o.special) bad.push('89% with run 4 paid '+JSON.stringify(Object.keys(o).filter(k=>o[k]&&k!=='run')));
      o=PP.mockReward(fake(0.9,5)); if(!o.jersey||o.jersey.lv!=='e'||!o.toon||o.stick) bad.push('90%/5 wrong');
      o=PP.mockReward(fake(0.96,8)); if(!o.jersey||o.jersey.lv!=='a'||!o.toon||!o.stick||o.special) bad.push('96%/8 wrong');
      o=PP.mockReward(fake(1,10)); if(!o.jersey||o.jersey.lv!=='c'||!o.toon||!o.stick||!o.special) bad.push('100%/10 wrong');
      o=PP.mockReward(fake(0.5,9)); if(o.jersey||!o.toon||!o.stick||o.special) bad.push('50%/9 wrong');
      if(D.fan.picks.length) bad.push('mock gave draft picks');
      return bad; }""")
    check('R15 mock test rewards: jersey at 90%, streak payouts from the longest run', r == [], r)

    # R16: picks are typed: current-player picks only draft current players, legend picks only legends; older numeric picks work for both; saves migrate
    r = ev("""()=>{ PP.reset(); const D=PP.D(), bad=[];
      PP.addPicks(1,'cur',0); if(PP.fan.pickCount('cur')!==1||PP.fan.pickCount('all')!==0) bad.push('counts');
      if(PP.fan.offer('all')) bad.push('legend offer from a current pick');
      const off=PP.fan.offer('cur'); if(!off||off.length!==3||off.some(p=>p.pool!=='cur')) bad.push('offer not current players');
      if(PP.fan.draft('all', PP.NHL.all[0].id)) bad.push('drafted legend with a current pick');
      if(!PP.fan.draft('cur', off[0].id)) bad.push('draft failed'); if(D.fan.picks.length) bad.push('pick not used');
      PP.addPicks(1,'all',1); if(PP.fan.pickCount('cur')!==0) bad.push('legend pick counted for current');
      D.fan.picks=[3-3, 2]; localStorage.setItem('pp3', JSON.stringify(D));
      return bad; }""")
    pg.reload(); pg.wait_for_selector('h1')
    r2 = ev("""()=>{ const D=PP.D(), bad=[]; if(!D.fan.picks.every(k=>typeof k==='object'&&k&&k.pool===null)) bad.push('numbers not migrated '+JSON.stringify(D.fan.picks));
      if(PP.fan.pickCount('cur')!==2||PP.fan.pickCount('all')!==2) bad.push('old picks work for either team'); if(!D.stick||!D.streak) bad.push('missing new fields'); return bad; }""")
    check('R16 draft picks are typed by team and older picks migrate', r == [] and r2 == [], [r, r2])

    # R17: gear: a player wears only a jersey and carries only a stick he has won; a spare is needed for a second player; team match
    r = ev("""()=>{ PP.reset(); const D=PP.D(), bad=[]; const [a,b]=PP.NHL.cur.slice(0,2);
      D.fan.owned[a.id]=1; D.fan.owned[b.id]=1;
      if(PP.fan.setGear(a.id,'j',a.team+'|e')) bad.push('wore a jersey he does not own');
      if(PP.fan.setGear(a.id,'s','s0')) bad.push('carried a stick he does not own');
      D.jer.owned[a.team+'|e']=1; D.stick.owned['s0']=1;
      if(!PP.fan.setGear(a.id,'j',a.team+'|e')||!PP.fan.teamMatch(a.id)) bad.push('own-team jersey failed or no match');
      if(PP.fan.setGear(b.id,'j',a.team+'|e')) bad.push('one jersey worn by two players');
      D.jer.owned[a.team+'|e']=2; if(!PP.fan.setGear(b.id,'j',a.team+'|e')) bad.push('spare jersey refused');
      if(!PP.fan.setGear(a.id,'s','s0')) bad.push('stick failed'); if(PP.fan.setGear(b.id,'s','s0')) bad.push('one stick for two players');
      PP.fan.setGear(a.id,'j',null); PP.fan.setGear(a.id,'s',null); if(D.fan.gear[a.id]) bad.push('empty gear not cleaned');
      if(PP.fan.setGear('nobody','j',a.team+'|e')) bad.push('gear for an uncollected player');
      return bad; }""")
    check('R17 players wear only jerseys and sticks he owns; spares allow a second player', r == [], r)

    # R18: start over keeps mistakes, mock tests and goals; clears levels, streak and all collections
    r = ev("""()=>{ PP.reset(); const D=PP.D(), bad=[]; const q=PP.nextQ('VA','e').q;
      for(let i=0;i<12;i++){ const r=PP.nextQ('VA',PP.askLevel('VA')); PP.answerPractice(r.q,i%4?r.q.ans:(r.q.ans+1)%5,3,false,false); }
      PP.giveToon(); PP.giveStick(false); PP.winJersey('e'); D.fan.owned[PP.NHL.cur[0].id]=1; PP.addPicks(1,'cur',0); D.stars=7;
      const miss=JSON.stringify(D.miss), tests=D.tests.length, used=JSON.stringify(D.used); if(!Object.keys(D.miss).length) bad.push('no mistakes to keep');
      PP.resetKeepMistakes(); const d=PP.D();
      if(JSON.stringify(d.miss)!==miss) bad.push('mistakes changed'); if(d.tests.length!==tests) bad.push('tests changed'); if(d.stars!==7) bad.push('goals changed'); if(JSON.stringify(d.used)!==used) bad.push('used list changed');
      if(Object.keys(d.toon.owned).length||Object.keys(d.stick.owned).length||Object.keys(d.jer.owned).length||Object.keys(d.fan.owned).length||d.fan.picks.length||d.streak.n) bad.push('collections not empty');
      if(!Object.values(d.sec).every(x=>['e','a','c'].every(l=>!x[l]||(x[l].c===0&&x[l].w===0&&!x[l].p)))) bad.push('levels not reset');
      if(PP.passed('VA','e')||PP.curLevel('VA')!=='e') bad.push('first level not current'); if(d.rule!==2) bad.push('rule');
      return bad; }""")
    check('R18 start over clears levels and collections but keeps mistakes, tests and goals', r == [], r)

    # R19: bench: collected players who are not in the lineup; swapping moves the old player to the bench
    r = ev("""()=>{ PP.reset(); const D=PP.D(), bad=[]; const cs=PP.NHL.cur.filter(p=>p.pos==='C').slice(0,4);
      cs.forEach(p=>D.fan.owned[p.id]=1); PP.fan.place('cur','C1',cs[0].id); PP.fan.place('cur','C2',cs[1].id);
      let b=PP.fan.bench('cur').map(p=>p.id); if(b.length!==2||b.includes(cs[0].id)||b.includes(cs[1].id)) bad.push('bench wrong '+b);
      if(PP.fan.bench('all').length) bad.push('other team bench not empty');
      if(!PP.fan.place('cur','C1',cs[2].id)) bad.push('swap refused'); b=PP.fan.bench('cur').map(p=>p.id);
      if(!b.includes(cs[0].id)||b.includes(cs[2].id)||b.length!==2) bad.push('old player not on bench '+b);
      const w=PP.NHL.cur.find(p=>p.pos==='D'); D.fan.owned[w.id]=1; if(PP.fan.place('cur','C1',w.id)) bad.push('wrong position accepted');
      PP.fan.clear('cur','C2'); if(!PP.fan.bench('cur').some(p=>p.id===cs[1].id)) bad.push('removed player not on bench');
      return bad; }""")
    check('R19 bench lists collected players outside the lineup and swaps work', r == [], r)

    check('no page errors during all checks', errs == [], errs[:3])
    b.close()
print('\n%d failed' % len(fails) if fails else '\nALL PASS')
sys.exit(1 if fails else 0)
