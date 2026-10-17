/* Verbal generators: Verbal Analogies (VA) and Verbal Classification (VC). Sentence Completion (SC) is in data-sc-*.js */
(function () {
  const PP = window.PP, ri = PP.ri, pick = PP.pick;
  const P = s => s.split(',').map(x => x.trim().split(':'));
  const An = w => (/^[aeiou]/i.test(w) ? 'An ' : 'A ') + w;
  const an = w => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;

  /* ---------- Verbal Analogies: families of word pairs (first:second) ---------- */
  const FAM = [
    // EASY
    { lv: 'e', id: 'opp', pairs: P('hot:cold,up:down,big:small,day:night,fast:slow,open:closed,happy:sad,wet:dry,hard:soft,full:empty,old:new,in:out,light:dark,loud:quiet,tall:short,front:back'), exp: (a, b, c, d) => a + ' and ' + b + ' are opposites. The opposite of ' + c + ' is ' + d + '.' },
    { lv: 'e', id: 'young', pairs: P('puppy:dog,kitten:cat,calf:cow,lamb:sheep,chick:hen,foal:horse,duckling:duck,piglet:pig,tadpole:frog,cub:bear'), exp: (a, b, c, d) => An(a) + ' is a baby ' + b + '. ' + An(c) + ' is a baby ' + d + '.' },
    { lv: 'e', id: 'use', pairs: P('pen:write,scissors:cut,spoon:eat,broom:sweep,brush:paint,key:unlock,knife:slice,oven:bake,soap:wash,needle:sew,eraser:erase,shovel:dig'), exp: (a, b, c, d) => An(a) + ' is used to ' + b + '. ' + An(c) + ' is used to ' + d + '.' },
    { lv: 'e', id: 'home', pairs: P('bird:nest,bee:hive,dog:kennel,bear:den,horse:stable,spider:web,pig:pen,cow:barn,rabbit:burrow,fish:pond'), exp: (a, b, c, d) => An(a) + ' lives in ' + an(b) + '. ' + An(c) + ' lives in ' + an(d) + '.' },
    { lv: 'e', id: 'part', pairs: P('finger:hand,toe:foot,petal:flower,wheel:car,page:book,leaf:tree,wing:bird,tooth:mouth,brick:wall,button:shirt,sail:boat,handle:door'), exp: (a, b, c, d) => An(a) + ' is a part of ' + an(b) + '. ' + An(c) + ' is a part of ' + an(d) + '.' },
    { lv: 'e', id: 'sound', pairs: P('dog:bark,cat:meow,cow:moo,duck:quack,lion:roar,bee:buzz,snake:hiss,pig:oink,owl:hoot,horse:neigh,mouse:squeak,sheep:baa'), exp: (a, b, c, d) => An(a) + ' makes the sound "' + b + '". ' + An(c) + ' makes the sound "' + d + '".' },
    { lv: 'e', id: 'toon', pairs: P('Mickey:mouse,Donald:duck,Garfield:cat,Nemo:fish,Simba:lion,Dumbo:elephant,Bambi:deer,Tweety:bird,Pluto:dog'), exp: (a, b, c, d) => a + ' is ' + an(b) + ' in the cartoons. ' + c + ' is ' + an(d) + ' in the cartoons.' },
    { lv: 'e', id: 'sportplace', pairs: P('hockey:rink,tennis:court,swimming:pool,boxing:ring,bowling:alley,skiing:slope'), exp: (a, b, c, d) => 'The place where you play ' + a + ' is the ' + b + '. The place for ' + c + ' is the ' + d + '.' },
    // AVERAGE
    { lv: 'a', id: 'cat', pairs: P('dog:animal,rose:flower,red:color,shirt:clothing,chair:furniture,carrot:vegetable,piano:instrument,oak:tree,circle:shape,Canada:country,July:month,hammer:tool,robin:bird,trout:fish,truck:vehicle,soccer:sport,apple:fruit,Tuesday:day'), exp: (a, b, c, d) => a + ' is a kind of ' + b + '. ' + c + ' is a kind of ' + d + '.' },
    { lv: 'a', id: 'worktool', pairs: P('painter:brush,baker:oven,doctor:stethoscope,carpenter:hammer,farmer:tractor,writer:pen,tailor:needle,barber:scissors,teacher:chalk,fisher:net,photographer:camera,firefighter:hose,gardener:shovel'), exp: (a, b, c, d) => 'The ' + a + ' works with the ' + b + '. The ' + c + ' works with the ' + d + '.' },
    { lv: 'a', id: 'workplace', pairs: P('teacher:school,doctor:hospital,farmer:farm,chef:kitchen,judge:court,pilot:cockpit,librarian:library,sailor:ship,actor:stage,mechanic:garage,baker:bakery,scientist:laboratory'), exp: (a, b, c, d) => 'The ' + a + ' works at the ' + b + '. The ' + c + ' works at the ' + d + '.' },
    { lv: 'a', id: 'syn', pairs: P('big:large,small:tiny,quick:fast,begin:start,shut:close,glad:happy,silent:quiet,rich:wealthy,scared:afraid,error:mistake,pretty:lovely,choose:pick,fix:repair,smile:grin'), exp: (a, b, c, d) => a + ' and ' + b + ' mean almost the same. ' + c + ' and ' + d + ' mean almost the same.' },
    { lv: 'a', id: 'source', pairs: P('milk:cow,wool:sheep,honey:bee,silk:silkworm,eggs:hen,bacon:pig,bread:flour,paper:wood,glass:sand,cheese:milk'), exp: (a, b, c, d) => a + ' comes from the ' + b + '. ' + c + ' comes from the ' + d + '.' },
    { lv: 'a', id: 'placeact', pairs: P('library:read,kitchen:cook,pool:swim,gym:exercise,theater:watch,restaurant:eat,bed:sleep,school:learn,bank:save,stadium:cheer'), exp: (a, b, c, d) => 'The ' + a + ' is where you ' + b + '. The ' + c + ' is where you ' + d + '.' },
    { lv: 'a', id: 'wear', pairs: P('shoe:foot,glove:hand,ring:finger,belt:waist,glasses:eyes,scarf:neck,hat:head,watch:wrist,earring:ear,mask:face'), exp: (a, b, c, d) => 'Put the ' + a + ' on your ' + b + '. Put the ' + c + ' on your ' + d + '.' },
    { lv: 'a', id: 'sportgear', pairs: P('hockey:stick,baseball:bat,tennis:racket,golf:club,archery:bow,fishing:rod,boxing:gloves,skiing:poles'), exp: (a, b, c, d) => 'The main gear for ' + a + ' is the ' + b + '. The main gear for ' + c + ' is the ' + d + '.' },
    // CHALLENGING
    { lv: 'c', id: 'degree', pairs: P('warm:hot,cool:cold,tired:exhausted,damp:soaked,small:tiny,pretty:beautiful,angry:furious,hungry:starving,tasty:delicious,smart:brilliant,scared:terrified,chilly:freezing'), exp: (a, b, c, d) => b + ' is a stronger word than ' + a + '. ' + d + ' is a stronger word than ' + c + '.' },
    { lv: 'c', id: 'opp2', pairs: P('ancient:modern,victory:defeat,expand:shrink,accept:reject,generous:selfish,brave:cowardly,ascend:descend,arrive:depart,scarce:plentiful,permit:forbid,include:exclude,rapid:gradual'), exp: (a, b, c, d) => a + ' and ' + b + ' are opposites. The opposite of ' + c + ' is ' + d + '.' },
    { lv: 'c', id: 'grow', pairs: P('acorn:oak,caterpillar:butterfly,egg:bird,seed:plant,bud:blossom,sapling:tree,larva:insect,tadpole:frog'), exp: (a, b, c, d) => An(a) + ' grows into ' + an(b) + '. ' + An(c) + ' grows into ' + an(d) + '.' },
    { lv: 'c', id: 'measure', pairs: P('ruler:length,scale:weight,clock:time,thermometer:temperature,compass:direction,calendar:date,speedometer:speed,measuring cup:volume'), exp: (a, b, c, d) => An(a) + ' measures ' + b + '. ' + An(c) + ' measures ' + d + '.' },
    { lv: 'c', id: 'collect', pairs: P('fish:school,wolf:pack,bee:swarm,cow:herd,bird:flock,lion:pride,ship:fleet,star:galaxy'), exp: (a, b, c, d) => 'The group word for ' + a + ' is "' + b + '". The group word for ' + c + ' is "' + d + '".' },
    { lv: 'c', id: 'wholepart2', pairs: P('chapter:book,verse:poem,scene:play,note:song,link:chain,room:house,drop:ocean,cell:body,branch:tree,step:staircase'), exp: (a, b, c, d) => An(a) + ' is one part of ' + an(b) + '. ' + An(c) + ' is one part of ' + an(d) + '.' }
  ];
  const otherWords = (lv, fam) => {
    const w = [];
    FAM.filter(f => f.lv === lv && f !== fam).forEach(f => f.pairs.forEach(p => { w.push(p[0]); w.push(p[1]); }));
    return w;
  };

  PP.gens.VA = function (lv, r) {
    const fams = FAM.filter(f => f.lv === lv);
    const fam = pick(r, fams);
    const idx = PP.shuffle(r, fam.pairs.map((_, i) => i));
    const A = fam.pairs[idx[0]], C = fam.pairs[idx[1]];
    if (A[1] === C[1]) return null;
    const sameB = fam.pairs.map(p => p[1]).filter(x => x !== C[1] && x !== A[1] && x !== C[0]);
    const sameA = fam.pairs.map(p => p[0]).filter(x => x !== C[0] && x !== A[0] && x !== A[1] && x !== C[1]);
    const oth = otherWords(lv, fam).filter(x => x !== C[1] && x !== C[0] && x !== A[0] && x !== A[1]);
    let wrong = [];
    if (lv === 'e') wrong = [A[1]].concat(PP.shuffle(r, sameB).slice(0, 1), PP.shuffle(r, oth).slice(0, 3), PP.shuffle(r, sameA).slice(0, 2));
    else if (lv === 'a') wrong = [A[1]].concat(PP.shuffle(r, sameB).slice(0, 2), PP.shuffle(r, oth).slice(0, 2), PP.shuffle(r, sameA).slice(0, 2));
    else wrong = [A[1]].concat(PP.shuffle(r, sameB).slice(0, 3), PP.shuffle(r, sameA).slice(0, 2), PP.shuffle(r, oth).slice(0, 2));
    const stem = '<p class="q">Find the link between the first two words. Pick the word that goes in place of the ?</p><p class="seq">' + A[0] + ' is to ' + A[1] + ' as ' + C[0] + ' is to ?</p>';
    return PP.mk(r, { stem, correct: C[1], wrong, exp: fam.exp(A[0], A[1], C[0], C[1]), key: A[0] + '|' + C[0] + '|' + fam.id, tag: fam.id });
  };

  /* ---------- Verbal Classification: categories of words ---------- */
  const W = s => s.split(',').map(x => x.trim());
  const CAT = [
    // EASY
    { lv: 'e', n: 'fruits', w: W('apple,banana,grape,orange,pear,cherry,peach,lemon,plum,mango') },
    { lv: 'e', n: 'vegetables', w: W('carrot,potato,onion,celery,broccoli,lettuce,spinach,cabbage,radish,beet') },
    { lv: 'e', n: 'farm animals', w: W('cow,pig,sheep,goat,horse,donkey,ox,llama') },
    { lv: 'e', n: 'birds', w: W('robin,sparrow,eagle,owl,crow,parrot,penguin,hawk,duck') },
    { lv: 'e', n: 'insects', w: W('ant,bee,beetle,ladybug,moth,wasp,cricket,butterfly') },
    { lv: 'e', n: 'colors', w: W('red,blue,green,yellow,purple,orange,pink,brown') },
    { lv: 'e', n: 'shapes', w: W('circle,square,triangle,rectangle,oval,diamond,hexagon') },
    { lv: 'e', n: 'clothes', w: W('shirt,pants,dress,socks,coat,hat,skirt,sweater,scarf') },
    { lv: 'e', n: 'furniture', w: W('chair,table,bed,sofa,desk,shelf,dresser,stool') },
    { lv: 'e', n: 'body parts', w: W('arm,leg,knee,elbow,ankle,wrist,shoulder,neck') },
    { lv: 'e', n: 'tools', w: W('hammer,saw,drill,wrench,pliers,screwdriver,chisel') },
    { lv: 'e', n: 'school supplies', w: W('pencil,eraser,ruler,crayon,marker,notebook,stapler,glue stick') },
    { lv: 'e', n: 'musical instruments', w: W('piano,drum,flute,violin,guitar,trumpet,harp,cello') },
    { lv: 'e', n: 'vehicles', w: W('car,bus,truck,train,boat,plane,helicopter,tractor') },
    { lv: 'e', n: 'things at a hockey game', w: W('stick,puck,net,rink,whistle,scoreboard,penalty box,coach') },
    { lv: 'e', n: 'cartoon characters', w: W('Mickey,Woody,Goofy,SpongeBob,Elsa,Dora,Simba,Nemo,Bluey') },
    // AVERAGE
    { lv: 'a', n: 'things you read', w: W('book,map,menu,sign,letter,newspaper,label,poster') },
    { lv: 'a', n: 'things with wheels', w: W('bike,wagon,skateboard,scooter,cart,stroller,wheelbarrow,roller skates') },
    { lv: 'a', n: 'things that give light', w: W('lamp,candle,flashlight,lantern,streetlight,headlight,spotlight,lightbulb') },
    { lv: 'a', n: 'cold things', w: W('ice,snow,freezer,glacier,frost,popsicle,iceberg,icicle') },
    { lv: 'a', n: 'sticky things', w: W('glue,honey,tape,syrup,gum,jam,tar,caramel') },
    { lv: 'a', n: 'loud things', w: W('siren,thunder,drum,alarm,horn,fireworks,jackhammer,trumpet') },
    { lv: 'a', n: 'things you wear on your feet', w: W('shoes,socks,boots,sandals,slippers,sneakers,skates,flip-flops') },
    { lv: 'a', n: 'soft things', w: W('pillow,cotton,fur,blanket,feather,cushion,velvet,wool') },
    { lv: 'a', n: 'sharp things', w: W('knife,needle,thorn,razor,pin,tack,blade,nail') },
    { lv: 'a', n: 'hot things', w: W('stove,oven,lava,kettle,toaster,fireplace,radiator,furnace') },
    { lv: 'a', n: 'things that fly', w: W('airplane,kite,helicopter,balloon,glider,rocket,parachute,drone') },
    { lv: 'a', n: 'places to live', w: W('house,apartment,cabin,tent,castle,cottage,mansion,igloo') },
    { lv: 'a', n: 'sports', w: W('soccer,hockey,tennis,golf,baseball,swimming,volleyball,basketball') },
    { lv: 'a', n: 'NHL teams', w: W('Maple Leafs,Oilers,Canadiens,Bruins,Canucks,Senators,Kings,Rangers,Wild') },
    // CHALLENGING
    { lv: 'c', n: 'ways to move', w: W('run,walk,hop,skip,jump,crawl,leap,march,gallop,hike') },
    { lv: 'c', n: 'feelings', w: W('joy,anger,fear,pride,sadness,worry,envy,surprise,hope') },
    { lv: 'c', n: 'kinds of weather', w: W('rain,snow,fog,hail,drizzle,storm,breeze,sleet,blizzard') },
    { lv: 'c', n: 'ways to speak', w: W('whisper,shout,mumble,yell,murmur,announce,whine,stammer') },
    { lv: 'c', n: 'planets', w: W('Mars,Venus,Earth,Jupiter,Saturn,Neptune,Mercury,Uranus') },
    { lv: 'c', n: 'units of length', w: W('inch,meter,foot,mile,centimeter,yard,kilometer,millimeter') },
    { lv: 'c', n: 'ways to cook', w: W('bake,boil,fry,roast,grill,steam,simmer,toast,poach') },
    { lv: 'c', n: 'parts of a plant', w: W('root,stem,leaf,petal,seed,bud,branch,bloom') },
    { lv: 'c', n: 'punctuation marks', w: W('comma,period,colon,hyphen,apostrophe,semicolon,dash,bracket') },
    { lv: 'c', n: 'metals', w: W('iron,copper,gold,silver,tin,steel,bronze,aluminum') },
    { lv: 'c', n: 'parts of a book', w: W('chapter,page,title,cover,index,spine,contents,glossary') },
    { lv: 'c', n: 'landforms', w: W('mountain,valley,island,desert,canyon,plateau,hill,volcano,cliff') },
    { lv: 'c', n: 'ways to look', w: W('glance,stare,peek,glare,gaze,watch,peer,squint') },
    { lv: 'c', n: 'hockey penalties', w: W('tripping,hooking,slashing,holding,boarding,roughing,interference,cross-checking') }
  ];

  PP.gens.VC = function (lv, r) {
    const cats = CAT.filter(c => c.lv === lv);
    const cat = pick(r, cats);
    const ws = PP.shuffle(r, cat.w);
    const three = ws.slice(0, 3), correct = ws[3];
    const others = [];
    cats.filter(c => c !== cat).forEach(c => c.w.forEach(x => { if (!cat.w.includes(x)) others.push({ x, n: c.n }); }));
    // one distractor per category so each wrong word comes from a different group
    const byCat = {};
    PP.shuffle(r, others).forEach(o => { if (!byCat[o.n]) byCat[o.n] = o.x; });
    const wrong = Object.values(byCat).slice(0, 5);
    const stem = '<p class="q">How are these three words alike? Pick the word that belongs with them.</p><p class="seq">' + three.join(', ') + '</p>';
    const cap = cat.n;
    return PP.mk(r, { stem, correct, wrong, exp: 'These words are all ' + cap + '. "' + correct + '" belongs in the group too.', key: three.slice().sort().join(','), tag: cat.n });
  };

  /* ---------- Sentence Completion: written sentences in data-sc-*.js ---------- */
  const MALE = ['Connor McDavid', 'Auston Matthews', 'Sidney Crosby', 'Nathan MacKinnon', 'Cale Makar', 'Connor Bedard', 'Wayne Gretzky', 'Mitch Marner', 'Leon Draisaitl', 'Mickey', 'SpongeBob', 'Mario', 'Simba', 'Woody'];
  const FEMALE = ['Marie-Philip Poulin', 'Sarah Nurse', 'Elsa', 'Moana', 'Bluey', 'Minnie', 'Dora', 'Anna'];
  const SCN = { e: 0, a: 0, c: 0 };
  PP.scLines = lv => (PP.SC[lv] || '').split('\n').map(x => x.trim()).filter(x => x && x.split('|').length >= 6);
  PP.gens.SC = function (lv, r, k, n) {
    const lines = PP.scLines(lv);
    if (n >= lines.length) return null;
    const p = lines[n].split('|');
    // put hockey stars and cartoon characters into sentences about a person
    const m = MALE[Math.floor(r() * MALE.length)], f = FEMALE[Math.floor(r() * FEMALE.length)];
    const useNames = r() < 0.8;
    if (useNames) {
      p[0] = p[0].replace(/^She /, f + ' ').replace(/^He /, m + ' ').replace(/\b(Mia|Lena|Anna)\b/, f).replace(/\b(Ben|Max)\b/, m);
    }
    const stem = '<p class="q">Which word best fits in the blank?</p><p class="seq sent">' + p[0].replace('___', '<span class="blank">&nbsp;?&nbsp;</span>') + '</p>';
    const full = p[0].replace('___', p[1]);
    return PP.mk(r, { stem, correct: p[1], wrong: p.slice(2, 6), exp: 'The sentence makes the most sense this way: "' + full + '"', key: lines[n].split('|')[0], tag: 'sentence' });
  };
})();
