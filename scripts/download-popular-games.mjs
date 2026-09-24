import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../src/assets/populargames');

const GAMES = [
  { file: 'marblerace.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/marblerace.webp' },
  { file: 'dw.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/dw.webp' },
  { file: 'fs.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/fs.webp' },
  { file: '6pp.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/6pp.webp' },
  { file: 'cricket2020.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/cricket2020.webp' },
  { file: 'itp.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/itp.webp' },
  { file: '10_10_cricket.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/10_10_cricket.webp' },
  { file: 'high_low.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/high_low.webp' },
  { file: 'bbb.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/bbb.webp', gameId: '151083', name: 'Bollywood Casino' },
  { file: 'ak47tp.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/ak47tp.webp' },
  { file: 'lucky15.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/lucky15.webp' },
  { file: 'lucky5.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/lucky5.webp' },
  { file: 'lk1.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/lk1.webp' },
  { file: 'ab50.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/ab50.webp' },
  { file: 'unique-teenpatti.webp', url: 'https://99hub.live/assets/img/newlaunch/unique-teenpatti.webp' },
  { file: 'marblerace-dreamdelhi.webp', url: 'https://cdn.dreamdelhi.com/inplm/marblerace.webp' },
  { file: 'mtp.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/mtp.webp' },
  { file: 'iw.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/iw.webp' },
  { file: 'so.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/so.webp' },
  { file: 'cc.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/cc.webp' },
  { file: '2020tp2.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/2020tp2.webp' },
  { file: 'andarbahar.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/andarbahar.webp', gameId: '150007', name: 'Andar Bahar' },
  { file: 'dragontiger.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/dragontiger.webp', gameId: '150001', name: 'Dragon Tiger' },
  { file: 'dragontigerlion.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/dragontigerlion.webp', gameId: '150013', name: 'Dragon Tiger Lion' },
  { file: 'dragontigeroneday.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/dragontigeroneday.webp', gameId: '150036', name: 'Dragon Tiger One Day' },
  { file: 'dt2.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/dt2.webp', gameId: '150067', name: 'Dragon Tiger 2' },
  { file: 'baccarat-tezcdn.webp', url: 'https://tezcdn.io/casino/mac88-500*299/blue/baccarat.webp', gameId: '150002', name: 'Baccarat' },
  { file: '29baccarat.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/29baccarat.webp', gameId: '150026', name: '29 Cards Baccarat' },
  { file: 'sicbo.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/sicbo.webp', gameId: '150003', name: 'Sic Bo' },
  { file: 'roulette.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/roulette.webp', gameId: '150004', name: 'Roulette' },
  { file: '20-20poker.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/20-20poker.webp', gameId: '150005', name: '20-20 Poker' },
  { file: 'poker.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/poker.webp', gameId: '150032', name: 'Poker' },
  { file: 'lucky7.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/lucky7.webp', gameId: '150006', name: 'Lucky 7' },
  { file: 'onedayteenpatti.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/onedayteenpatti.webp', gameId: '150009', name: 'Teenpatti One Day' },
  { file: 'teenpattitest.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/teenpattitest.webp', gameId: '150023', name: 'Teenpatti Test' },
  { file: '2cardsteenpatti.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/2cardsteenpatti.webp', gameId: '150028', name: '2 Cards Teenpatti' },
  { file: 'muflisteenpattioneday.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/muflisteenpattioneday.webp', gameId: '150030', name: 'Muflis Teenpatti' },
  { file: '2020teenpatti.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/2020teenpatti.webp' },
  { file: '2cardonedayteenpatti.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/2cardonedayteenpatti.webp' },
  { file: 'openteenpatti.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/openteenpatti.webp' },
  { file: '32cards.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/32cards.webp', gameId: '150010', name: '32 Cards' },
  { file: 'amarakbaranthony.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/amarakbaranthony.webp', gameId: '150014', name: 'Amar Akbar Anthony' },
  { file: '3cardjudgement.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/3cardjudgement.webp' },
  { file: 'queenrace.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/queenrace.webp' },
  { file: 'race20.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/race20.webp' },
  { file: 'casinowar.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/casinowar.webp' },
  { file: 'worlimatka.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/worlimatka.webp' },
  { file: 'trio.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/trio.webp' },
  { file: 'bollywoodcasino.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/bollywoodcasino.webp', gameId: '151083', name: 'Bollywood Casino' },
  { file: '10kadum.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/10kadum.webp' },
  { file: 'one-card-one-day.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/one-card-one-day.webp' },
  { file: 'race17.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/race17.webp' },
  { file: 'note-umber.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/note-umber.webp' },
  { file: 'JTP1D.webp', url: 'https://cdn.dreamdelhi.com/mac88/JTP1D.webp' },
  { file: 'turbo_roulette.webp', url: 'https://cdn.dreamdelhi.com/mac88/turbo_roulette.webp' },
  { file: 'lottery.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/lottery.webp' },
];

fs.mkdirSync(outDir, { recursive: true });

const manifest = [];

for (const game of GAMES) {
  const dest = path.join(outDir, game.file);
  try {
    const res = await fetch(game.url, { redirect: 'follow' });
    if (!res.ok) {
      console.error(`FAIL ${game.file}: HTTP ${res.status}`);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    console.log(`OK ${game.file} (${buf.length} bytes)`);
    manifest.push({
      id: game.file.replace(/\.[^.]+$/, ''),
      file: game.file,
      name: game.name || game.file.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      gameId: game.gameId || null,
    });
  } catch (err) {
    console.error(`FAIL ${game.file}:`, err.message);
  }
}

fs.writeFileSync(
  path.join(outDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2),
  'utf8'
);

console.log(`\nDownloaded ${manifest.length}/${GAMES.length} images`);
