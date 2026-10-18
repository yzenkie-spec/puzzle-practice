/* Hockey stick collection. These are made-up sticks "inspired by" famous moments; they are not real products. */
(function () {
  const T = `
Pond Hockey Special|A plain wooden stick from the backyard rink.|common|#C8A068|#8B5E34
Rookie Ash|Everyone's first real stick.|common|#D9B27C|#6B4A2A
Street Hockey Blue|Bright blue for the driveway games.|common|#4F9DDE|#1E4E8C
Garage Red|Found in the garage, still works!|common|#E4572E|#7A1F10
Training Camp|Taped up and ready for drills.|common|#9AA3B2|#3C4656
Winter Classic|Frosty white tape on the blade.|common|#E8EEF5|#5B7FA6
Maple Leaf Green|Green and gold, a Canadian favourite.|common|#3E9B5F|#1D5A35
Twig Light|Super light and super fast.|rare|#F1D9A8|#B07A33
Silver Sniper|Made for hard, accurate shots.|rare|#C7CDD6|#59606E
Playmaker Pro|Great for passing across the ice.|rare|#7B5BD6|#3A2780
Rink Rocket|Shoots like a rocket.|rare|#FF8A3D|#A33F00
Ice Blue Carbon|A modern carbon stick.|rare|#58C4E8|#176A8C
Overtime Hero|Used to score in overtime.|rare|#E9C04A|#8A6A10
Northern Lights|Green and purple glow.|rare|#4BD6A8|#5A3FB0
Golden Blade|A shiny gold blade for a big win.|epic|#F6C945|#B8860B
Championship Black|Black and gold, made for finals.|epic|#2B2F38|#D4A017
Hall of Fame Maple|A classic wood stick in a glass case.|epic|#B5793B|#5C3A12
Cup Run Carbon|Built for a long playoff run.|epic|#6B7280|#E4C300
Comet Blade|Leaves a bright trail on the ice.|epic|#9B6BFF|#2D1B77
Shootout Wizard|A magic stick for breakaways.|epic|#FF5BA7|#7A1B4D
The Cup Winner (inspired by a great captain)|A wooden stick like the one a famous captain raised after winning the Stanley Cup.|legend|#E7C873|#7A4B12
The Golden Goal (inspired by Olympic gold)|Imagine the stick from the biggest goal in a gold-medal game.|legend|#FFD84A|#C77800
Diamond Ice|Sparkling like diamonds on the ice.|legend|#BDEBFF|#3B7FB5
Legend of the Rink|The most special stick of all.|legend|#FF6B35|#F7C948
`;
  PP.STICKS = T.trim().split('\n').map((l, i) => { const p = l.split('|'); return { id: 's' + i, name: p[0], desc: p[1], tier: p[2], c1: p[3], c2: p[4] }; });
  PP.STICK_BY_ID = {}; PP.STICKS.forEach(t => { PP.STICK_BY_ID[t.id] = t; });
})();
