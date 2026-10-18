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
Rocket Raccoon|Marvel|🦝|#8B5E3C|rare
Iron Man|Marvel|🤖|#C8102E|epic
Captain America|Marvel|🛡️|#1D4ED8|epic
Hulk|Marvel|💪|#4CAF50|epic
Thor|Marvel|⚡|#9CA3AF|epic
Baby Groot|Marvel|🌱|#8B5E3C|rare
Miles Morales|Spider-Man|🕷️|#111827|epic
Batman|DC|🦇|#1F2937|epic
Superman|DC|🦸|#2563EB|epic
Wonder Woman|DC|⭐|#DC2626|rare
The Flash|DC|⚡|#DC2626|rare
Aquaman|DC|🔱|#0EA5E9|rare
Darth Vader|Star Wars|🖤|#111827|legend
Yoda|Star Wars|🟢|#84CC16|legend
Baby Yoda|Star Wars|🍼|#A3E635|epic
R2-D2|Star Wars|🔵|#3B82F6|rare
BB-8|Star Wars|⚪|#F59E0B|rare
Luke Skywalker|Star Wars|🗡️|#F3F4F6|rare
Harry Potter|Harry Potter|⚡|#7C2D12|epic
Hedwig|Harry Potter|🦉|#F3F4F6|rare
Hermione|Harry Potter|📚|#92400E|rare
Dobby|Harry Potter|🧦|#A8A29E|common
Sully|Monsters Inc|💙|#38BDF8|rare
Mike Wazowski|Monsters Inc|👁️|#84CC16|rare
Boo|Monsters Inc|🎀|#F9A8D4|common
Remy|Ratatouille|🐀|#9CA3AF|rare
WALL-E|WALL-E|🗑️|#CA8A04|epic
EVE|WALL-E|🤍|#F3F4F6|rare
Baymax|Big Hero 6|🫧|#F3F4F6|epic
Hiro|Big Hero 6|🤖|#EF4444|common
Rapunzel|Tangled|🌟|#FACC15|rare
Pascal|Tangled|🦎|#84CC16|common
Flynn Rider|Tangled|🗡️|#92400E|common
Anna|Frozen|❄️|#F97316|rare
Sven|Frozen|🦌|#A16207|common
Mirabel|Encanto|🦋|#F59E0B|rare
Bruno|Encanto|🐀|#16A34A|common
Maui|Moana|🪝|#B45309|rare
Pua|Moana|🐷|#F9A8D4|common
Nala|The Lion King|🦁|#D4A373|rare
Timon|The Lion King|🦡|#B08968|common
Pumbaa|The Lion King|🐗|#92400E|common
Mufasa|The Lion King|👑|#B45309|epic
Genie|Aladdin|🧞|#38BDF8|epic
Aladdin|Aladdin|🪔|#7C3AED|common
Abu|Aladdin|🐒|#A16207|common
Ariel|The Little Mermaid|🧜|#EF4444|rare
Flounder|The Little Mermaid|🐠|#FACC15|common
Sebastian|The Little Mermaid|🦀|#EF4444|common
Jessie|Toy Story|🤠|#F59E0B|rare
Rex|Toy Story|🦖|#22C55E|common
Slinky Dog|Toy Story|🐕|#A16207|common
Mr. Potato Head|Toy Story|🥔|#B45309|common
Finn|Adventure Time|🧢|#38BDF8|rare
Jake|Adventure Time|🐕|#FACC15|rare
Steven Universe|Steven Universe|⭐|#F472B6|rare
Gumball|Amazing World of Gumball|🐱|#38BDF8|common
Darwin|Amazing World of Gumball|🐟|#F97316|common
Ben 10|Ben 10|⌚|#22C55E|rare
Shaggy|Scooby-Doo|🍔|#84CC16|common
Daffy Duck|Looney Tunes|🦆|#111827|common
Tweety|Looney Tunes|🐤|#FACC15|common
Road Runner|Looney Tunes|💨|#3B82F6|common
Wile E. Coyote|Looney Tunes|🐺|#A16207|common
Porky Pig|Looney Tunes|🐖|#F9A8D4|common
Homer Simpson|The Simpsons|🍩|#FACC15|rare
Bart Simpson|The Simpsons|🛹|#FACC15|rare
Charlie Brown|Peanuts|⚾|#FACC15|common
Snoopy|Peanuts|🐶|#F3F4F6|rare
Winnie the Pooh|Winnie the Pooh|🍯|#F59E0B|rare
Tigger|Winnie the Pooh|🐯|#F97316|common
Piglet|Winnie the Pooh|🐽|#F9A8D4|common
Eeyore|Winnie the Pooh|🫏|#9CA3AF|common
Paddington|Paddington|🧸|#B91C1C|rare
Gru|Despicable Me|🕶️|#6B7280|rare
Agnes|Despicable Me|🦄|#F9A8D4|common
Toothless|How to Train Your Dragon|🐉|#111827|legend
Hiccup|How to Train Your Dragon|🛡️|#92400E|rare
Ash Ketchum|Pokémon|🧢|#EF4444|rare
Greninja|Pokémon|🐸|#3B82F6|epic
Dragonite|Pokémon|🐲|#F59E0B|epic
Mew|Pokémon|✨|#F9A8D4|epic
Meowth|Pokémon|😼|#FDE68A|common
Togepi|Pokémon|🥚|#FDE68A|common
Rayquaza|Pokémon|🐍|#16A34A|legend
Gyarados|Pokémon|🌊|#2563EB|epic
Wario|Super Mario|💰|#FACC15|common
Waluigi|Super Mario|💜|#7C3AED|common
Bowser Jr.|Super Mario|🐢|#16A34A|common
Link|Zelda|🗡️|#16A34A|epic
Zelda|Zelda|🔺|#C084FC|rare
Samus|Metroid|🚀|#F97316|epic
Fox McCloud|Star Fox|🦊|#B45309|rare
Pikmin|Pikmin|🌿|#EF4444|common
Shadow|Sonic the Hedgehog|🖤|#111827|epic
Amy Rose|Sonic the Hedgehog|🌹|#F472B6|common
Dr. Eggman|Sonic the Hedgehog|🥚|#DC2626|rare
Crash Bandicoot|Crash Bandicoot|📦|#F97316|rare
Sackboy|LittleBigPlanet|🧶|#B45309|common
Ryu|Street Fighter|🥋|#F3F4F6|rare
Steve|Minecraft|⛏️|#0EA5E9|epic
Creeper|Minecraft|💚|#22C55E|rare
Vegeta|Dragon Ball|👑|#2563EB|epic
Gohan|Dragon Ball|📖|#F97316|rare
Sasuke|Naruto|⚡|#1D4ED8|rare
Totoro|My Neighbor Totoro|🌳|#9CA3AF|legend
Kiki|Kiki's Delivery Service|🧹|#111827|rare
Tanjiro|Demon Slayer|🌸|#16A34A|rare
Luffy|One Piece|🏴‍☠️|#EF4444|rare
Doraemon|Doraemon|🔔|#38BDF8|rare
Hello Kitty|Hello Kitty|🎀|#F9A8D4|rare
Kuromi|Hello Kitty|💜|#7C3AED|common
Pusheen|Pusheen|🐈|#9CA3AF|common
Arthur|Arthur|📚|#FACC15|common
Clifford|Clifford|🐕‍🦺|#DC2626|common
Curious George|Curious George|🍌|#A16207|rare
Franklin|Franklin|🐢|#16A34A|common
Dora|Dora the Explorer|🎒|#EC4899|common
Boots|Dora the Explorer|🐒|#A16207|common
Everest|PAW Patrol|🏔️|#8B5CF6|common
Tracker|PAW Patrol|🌴|#16A34A|common
Liberty|PAW Patrol|🗽|#14B8A6|common
Muffin|Bluey|🧁|#F9A8D4|common
Chilli|Bluey|💙|#9CA3AF|common
Lucky|Bluey|🍀|#FACC15|common
George Pig|Peppa Pig|🦕|#F9A8D4|common
Daddy Pig|Peppa Pig|🐷|#F9A8D4|common
Pingu|Pingu|🐧|#111827|common
Shaun the Sheep|Shaun the Sheep|🐑|#F3F4F6|rare
Wallace|Wallace and Gromit|🧀|#FACC15|common
Gromit|Wallace and Gromit|🐕|#F3F4F6|rare
Popeye|Popeye|⚓|#2563EB|common
`;
  PP.TOONS = T.trim().split('\n').map((l, i) => { const p = l.split('|'); return { id: 't' + i, name: p[0], show: p[1], emoji: p[2], color: p[3], tier: p[4] }; });
  PP.TOON_BY_ID = {}; PP.TOONS.forEach(t => { PP.TOON_BY_ID[t.id] = t; });
})();
