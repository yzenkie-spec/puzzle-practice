/* NHL fantasy player data. Ratings are made up for the game (not official stats).
   Teams are the ones each player is best known for; current teams are as of the 2025-26 season. */
(function () {
  const PP = (window.PP = window.PP || {});

  // team code -> [main colour, second colour]
  PP.TEAMS = {
    TOR: ['#00205B', '#FFFFFF'], MTL: ['#AF1E2D', '#192168'], BOS: ['#FFB81C', '#111111'], EDM: ['#FF4C00', '#041E42'],
    COL: ['#6F263D', '#236192'], TBL: ['#002868', '#FFFFFF'], CHI: ['#CF0A2C', '#111111'], NJD: ['#CE1126', '#111111'],
    FLA: ['#C8102E', '#041E42'], PIT: ['#FCB514', '#111111'], CAR: ['#CC0000', '#111111'], VGK: ['#B4975A', '#333F42'],
    VAN: ['#00843D', '#00205B'], OTT: ['#C8102E', '#111111'], SJS: ['#006D75', '#111111'], NYR: ['#0038A8', '#CE1126'],
    NYI: ['#00539B', '#F47D30'], DAL: ['#006847', '#111111'], WPG: ['#041E42', '#7B303E'], MIN: ['#154734', '#A6192E'],
    NSH: ['#FFB81C', '#041E42'], WSH: ['#C8102E', '#041E42'], BUF: ['#003087', '#FFB81C'], DET: ['#CE1126', '#FFFFFF'],
    CBJ: ['#002654', '#CE1126'], STL: ['#002F87', '#FCB514'], CGY: ['#C8102E', '#F1BE48'], LAK: ['#A2AAAD', '#111111'],
    ANA: ['#F47A38', '#B09862'], QUE: ['#4F8FD2', '#FFFFFF'], PHI: ['#F74902', '#111111'],
    SEA: ['#001628', '#99D9D9'], UTA: ['#71AFE5', '#111111']
  };
  // the 32 teams whose jerseys can be won
  PP.JTEAMS = {
    ANA: 'Anaheim', BOS: 'Boston', BUF: 'Buffalo', CGY: 'Calgary', CAR: 'Carolina', CHI: 'Chicago', COL: 'Colorado', CBJ: 'Columbus',
    DAL: 'Dallas', DET: 'Detroit', EDM: 'Edmonton', FLA: 'Florida', LAK: 'Los Angeles', MIN: 'Minnesota', MTL: 'Montréal', NSH: 'Nashville',
    NJD: 'New Jersey', NYI: 'NY Islanders', NYR: 'NY Rangers', OTT: 'Ottawa', PHI: 'Philadelphia', PIT: 'Pittsburgh', SJS: 'San Jose', SEA: 'Seattle',
    STL: 'St. Louis', TBL: 'Tampa Bay', TOR: 'Toronto', UTA: 'Utah', VAN: 'Vancouver', VGK: 'Vegas', WSH: 'Washington', WPG: 'Winnipeg'
  };
  PP.JVAR = { e: 'Home', a: 'Away', c: 'Retro' };

  // name | team | position | rating
  const CUR = `
Connor McDavid|EDM|C|99
Nathan MacKinnon|COL|C|98
Auston Matthews|TOR|C|96
Leon Draisaitl|EDM|C|95
Sidney Crosby|PIT|C|94
Aleksander Barkov|FLA|C|92
Jack Eichel|VGK|C|92
Jack Hughes|NJD|C|91
Connor Bedard|CHI|C|90
Evgeni Malkin|PIT|C|88
Macklin Celebrini|SJS|C|89
Sebastian Aho|CAR|C|88
Brayden Point|TBL|C|88
Nick Suzuki|MTL|C|88
Tim Stutzle|OTT|C|88
Mark Scheifele|WPG|C|87
Elias Pettersson|VAN|C|86
Mathew Barzal|NYI|C|85
Alex Ovechkin|WSH|LW|91
Artemi Panarin|NYR|LW|92
Kirill Kaprizov|MIN|LW|92
Matthew Tkachuk|FLA|LW|90
Kyle Connor|WPG|LW|90
Brady Tkachuk|OTT|LW|88
Jason Robertson|DAL|LW|88
Zach Hyman|EDM|LW|85
Gabriel Landeskog|COL|LW|85
Juraj Slafkovsky|MTL|LW|82
Nikita Kucherov|TBL|RW|96
David Pastrnak|BOS|RW|94
Mikko Rantanen|DAL|RW|93
Mitch Marner|VGK|RW|91
William Nylander|TOR|RW|90
Patrick Kane|DET|RW|86
Cole Caufield|MTL|RW|86
Jesper Bratt|NJD|RW|86
Cale Makar|COL|D|97
Quinn Hughes|MIN|D|94
Victor Hedman|TBL|D|90
Roman Josi|NSH|D|90
Adam Fox|NYR|D|90
Miro Heiskanen|DAL|D|90
Zach Werenski|CBJ|D|90
Rasmus Dahlin|BUF|D|90
Evan Bouchard|EDM|D|88
Lane Hutson|MTL|D|88
Moritz Seider|DET|D|86
Jake Sanderson|OTT|D|86
Connor Hellebuyck|WPG|G|95
Andrei Vasilevskiy|TBL|G|93
Igor Shesterkin|NYR|G|92
Jake Oettinger|DAL|G|90
Ilya Sorokin|NYI|G|89
Sergei Bobrovsky|FLA|G|88
Dustin Wolf|CGY|G|88
Logan Thompson|WSH|G|88
Thatcher Demko|VAN|G|87
Jeremy Swayman|BOS|G|86
Adin Hill|VGK|G|85
Jordan Binnington|STL|G|84
Joseph Woll|TOR|G|84
Sam Montembeault|MTL|G|82
`;
  const ALL = `
Wayne Gretzky|EDM|C|99
Mario Lemieux|PIT|C|98
Jean Beliveau|MTL|C|94
Mark Messier|EDM|C|94
Phil Esposito|BOS|C|93
Steve Yzerman|DET|C|93
Joe Sakic|COL|C|92
Marcel Dionne|LAK|C|92
Bryan Trottier|NYI|C|91
Stan Mikita|CHI|C|91
Peter Forsberg|COL|C|91
Sergei Fedorov|DET|C|90
Mats Sundin|TOR|C|89
Doug Gilmour|TOR|C|88
Dave Keon|TOR|C|88
Gilbert Perreault|BUF|C|88
Henrik Sedin|VAN|C|85
Bobby Hull|CHI|LW|94
Luc Robitaille|LAK|LW|90
Brendan Shanahan|DET|LW|88
Frank Mahovlich|TOR|LW|88
Paul Kariya|ANA|LW|88
Michel Goulet|QUE|LW|87
Ted Lindsay|DET|LW|87
Daniel Sedin|VAN|LW|85
Gordie Howe|DET|RW|97
Maurice Richard|MTL|RW|94
Jaromir Jagr|PIT|RW|94
Guy Lafleur|MTL|RW|93
Brett Hull|STL|RW|93
Mike Bossy|NYI|RW|92
Teemu Selanne|ANA|RW|92
Pavel Bure|VAN|RW|91
Jari Kurri|EDM|RW|90
Cam Neely|BOS|RW|88
Mike Gartner|WSH|RW|87
Bobby Orr|BOS|D|99
Nicklas Lidstrom|DET|D|96
Ray Bourque|BOS|D|95
Paul Coffey|EDM|D|93
Denis Potvin|NYI|D|92
Larry Robinson|MTL|D|91
Doug Harvey|MTL|D|91
Chris Chelios|CHI|D|90
Scott Stevens|NJD|D|90
Scott Niedermayer|NJD|D|90
Chris Pronger|STL|D|90
Al MacInnis|CGY|D|90
Brian Leetch|NYR|D|89
Zdeno Chara|BOS|D|88
Duncan Keith|CHI|D|88
Borje Salming|TOR|D|85
Patrick Roy|MTL|G|96
Martin Brodeur|NJD|G|96
Dominik Hasek|BUF|G|96
Terry Sawchuk|DET|G|93
Ken Dryden|MTL|G|93
Jacques Plante|MTL|G|92
Henrik Lundqvist|NYR|G|91
Carey Price|MTL|G|91
Glenn Hall|CHI|G|90
Roberto Luongo|VAN|G|90
Tony Esposito|CHI|G|89
Ed Belfour|CHI|G|88
Grant Fuhr|EDM|G|88
Marc-Andre Fleury|PIT|G|88
Billy Smith|NYI|G|87
Tuukka Rask|BOS|G|87
Pekka Rinne|NSH|G|87
Johnny Bower|TOR|G|85
`;
  const parse = (txt, pool) => txt.trim().split('\n').map((l, i) => {
    const p = l.split('|');
    return { id: pool + i, pool, name: p[0], team: p[1], pos: p[2], r: +p[3] };
  });
  PP.NHL = { cur: parse(CUR, 'cur'), all: parse(ALL, 'all') };
  PP.NHL_BY_ID = {};
  PP.NHL.cur.concat(PP.NHL.all).forEach(p => { PP.NHL_BY_ID[p.id] = p; });
  PP.POOL_NAME = { cur: 'Current Stars', all: 'All-Time Legends' };
  PP.POOL_ICON = { cur: '🔥', all: '👑' };
  // 3 forward lines (left wing, center, right wing), a defense pair for each line, and a goalie
  PP.SLOTS = ['LW1', 'C1', 'RW1', 'D1a', 'D1b', 'LW2', 'C2', 'RW2', 'D2a', 'D2b', 'LW3', 'C3', 'RW3', 'D3a', 'D3b', 'G'];
  PP.SLOT_POS = {}; PP.SLOTS.forEach(s => { PP.SLOT_POS[s] = s === 'G' ? 'G' : s.startsWith('D') ? 'D' : s.replace(/\d/g, ''); });
  PP.SLOT_LINE = s => (s === 'G' ? 0 : +s.match(/\d/)[0]);
  PP.SLOT_NAME = { LW: 'Left wing', C: 'Center', RW: 'Right wing', D: 'Defense', G: 'Goalie' };
  PP.slotName = s => PP.SLOT_NAME[PP.SLOT_POS[s]] + (s === 'G' ? '' : ', line ' + PP.SLOT_LINE(s));
  PP.POS_NAME = { C: 'Center', LW: 'Left wing', RW: 'Right wing', D: 'Defense', G: 'Goalie' };
  PP.tier = r => (r >= 97 ? 'legend' : r >= 93 ? 'epic' : r >= 88 ? 'rare' : 'common');
  PP.TIER_NAME = { legend: 'Legendary', epic: 'Epic', rare: 'Rare', common: 'Common' };
})();
