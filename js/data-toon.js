/* Cartoon character collection (won in smart practice). name | show | emoji | colour | rarity */
(function () {
  const PP = (window.PP = window.PP || {});
  const T = `
Optimus Prime|Transformers|🚛|#C8102E|legend
Bumblebee|Transformers|🐝|#F5C400|epic
Megatron|Transformers|⚙️|#6B6F7A|epic
Grimlock|Transformers|🦖|#9CA3AF|epic
Starscream|Transformers|✈️|#8E96A3|rare
Jazz|Transformers|🏁|#CBD5E1|rare
Ironhide|Transformers|🛡️|#7C2D12|rare
Soundwave|Transformers|📻|#4B3F72|rare
Pikachu|Pokémon|⚡|#F7D02C|legend
Charizard|Pokémon|🔥|#F08030|legend
Mewtwo|Pokémon|🧬|#A890F0|epic
Lucario|Pokémon|🥋|#5F7DB7|epic
Gengar|Pokémon|👻|#705898|epic
Squirtle|Pokémon|💧|#6890F0|rare
Bulbasaur|Pokémon|🌿|#78C850|rare
Eevee|Pokémon|🦊|#C19A6B|rare
Snorlax|Pokémon|😴|#4682B4|rare
Charmander|Pokémon|🦎|#F08030|rare
Jigglypuff|Pokémon|🎤|#F8A8D0|common
Psyduck|Pokémon|🦆|#F8D030|common
Magikarp|Pokémon|🐟|#E04040|common
Chase|PAW Patrol|🚓|#2F5EA8|rare
Marshall|PAW Patrol|🚒|#D32F2F|rare
Skye|PAW Patrol|🚁|#F06292|common
Rubble|PAW Patrol|🚧|#F2B01E|common
Rocky|PAW Patrol|♻️|#43A047|common
Zuma|PAW Patrol|🚤|#FB8C00|common
Bluey|Bluey|🐕|#5B9BD5|epic
Bingo|Bluey|🧡|#E8833A|rare
Bandit|Bluey|🐶|#4A78B0|rare
Mario|Super Mario|🍄|#E52521|legend
Luigi|Super Mario|💚|#43B047|epic
Yoshi|Super Mario|🥚|#7ED957|epic
Bowser|Super Mario|🐢|#FFA000|rare
Princess Peach|Super Mario|👑|#F8A5C2|rare
Donkey Kong|Nintendo|🍌|#8D5524|rare
Toad|Super Mario|🍄|#E57373|common
Sonic|Sonic the Hedgehog|💨|#1E6FD9|legend
Tails|Sonic the Hedgehog|🦊|#F5A623|rare
Knuckles|Sonic the Hedgehog|🥊|#D32F2F|rare
SpongeBob|SpongeBob|🧽|#F9D923|epic
Patrick Star|SpongeBob|⭐|#F8A5B8|rare
Squidward|SpongeBob|🎷|#6BB5B0|common
Mr. Krabs|SpongeBob|🦀|#D9382B|common
Mickey Mouse|Disney|🐭|#333333|legend
Donald Duck|Disney|🦆|#4A90D9|rare
Goofy|Disney|🐕|#2E7D32|common
Elsa|Frozen|❄️|#7EC8E3|epic
Olaf|Frozen|⛄|#BFE3F0|rare
Moana|Moana|🌊|#2AA5A0|rare
Simba|The Lion King|🦁|#E1A33B|epic
Woody|Toy Story|🤠|#8D6E3F|rare
Buzz Lightyear|Toy Story|🚀|#7CB342|epic
Lightning McQueen|Cars|🏎️|#D32F2F|epic
Mater|Cars|🛻|#8D5A2B|common
Nemo|Finding Nemo|🐠|#FF8A3D|common
Dory|Finding Nemo|💙|#3F7FD0|common
Stitch|Lilo & Stitch|👽|#3B82C4|rare
Goku|Dragon Ball|🐉|#F47A20|legend
Naruto|Naruto|🍥|#F59E0B|epic
Spider-Man|Spider-Man|🕷️|#D32F2F|epic
Scooby-Doo|Scooby-Doo|🐕|#B8860B|rare
Bugs Bunny|Looney Tunes|🐰|#9CA3AF|rare
Shrek|Shrek|🧅|#7CB342|rare
Po|Kung Fu Panda|🐼|#555555|rare
Minion|Despicable Me|🍌|#F5C400|rare
Kirby|Kirby|🩷|#F9A8D4|rare
Tom|Tom and Jerry|🐱|#7A8CA3|common
Jerry|Tom and Jerry|🐭|#C68642|common
Peppa Pig|Peppa Pig|🐷|#F9A8D4|common
Garfield|Garfield|🍕|#F59E0B|common
Pac-Man|Pac-Man|🟡|#F5C400|common
`;
  PP.TOONS = T.trim().split('\n').map((l, i) => { const p = l.split('|'); return { id: 't' + i, name: p[0], show: p[1], emoji: p[2], color: p[3], tier: p[4] }; });
  PP.TOON_BY_ID = {}; PP.TOONS.forEach(t => { PP.TOON_BY_ID[t.id] = t; });
})();
