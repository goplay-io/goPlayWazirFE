import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const liveDir = path.join(__dirname, '../src/assets/live');
const cardsDir = path.join(liveDir, 'cards');
const casinoDir = path.join(liveDir, 'casino');

const CARD_URLS = [
  'https://speedcdn.io/frontend_config/fairplay/images/17627627386635388.webp',
  'https://speedcdn.io/frontend_config/fairplay/images/17627627488552291.webp',
  'https://speedcdn.io/frontend_config/fairplay/images/17627627542110548.webp',
  'https://speedcdn.io/frontend_config/fairplay/images/17627627607591683.webp',
  'https://speedcdn.io/frontend_config/fairplay/images/17627627687141835.webp',
  'https://speedcdn.io/frontend_config/fairplay/images/17627627753719811.webp',
  'https://speedcdn.io/frontend_config/fairplay/images/17627627823197904.webp',
  'https://speedcdn.io/frontend_config/fairplay/images/17627627896399105.webp',
  'https://speedcdn.io/frontend_config/fairplay/images/17627627965140226.webp',
  'https://speedcdn.io/frontend_config/fairplay/images/17627628028278639.webp',
  'https://speedcdn.io/frontend_config/fairplay/images/17627628139424267.webp',
  'https://speedcdn.io/frontend_config/fairplay/images/17627628221040631.webp',
  'https://speedcdn.io/frontend_config/fairplay/images/17627628325753436.webp',
  'https://speedcdn.io/frontend_config/fairplay/images/17627628395703375.webp',
  'https://speedcdn.io/frontend_config/fairplay/images/17816909562292091.png',
  'https://speedcdn.io/frontend_config/fairplay/images/17627628548191596.webp',
  'https://speedcdn.io/frontend_config/fairplay/images/17627628625150691.webp',
  'https://speedcdn.io/frontend_config/fairplay/images/17627628721665893.webp',
];

const CASINO_SOURCES = [
  { file: 'andarbahar.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/andarbahar.webp' },
  { file: 'automaticroulette.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/roulette.webp' },
  { file: 'blackjack.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/baccarat.webp' },
  { file: 'dragontiger.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/dragontiger.webp' },
  { file: 'lightningblackjack.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/baccarat.webp' },
  { file: 'nocommissionbaccarat.webp', url: 'https://tezcdn.io/casino/mac88-500*299/blue/baccarat.webp' },
  { file: 'speedroulette.webp', url: 'https://cdn.dreamdelhi.com/mac88/turbo_roulette.webp' },
  { file: 'teenpatti.webp', url: 'https://speedcdn.io/assets/dashboard_casino_games/onedayteenpatti.webp' },
];

async function download(url, dest) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return buf.length;
}

fs.mkdirSync(cardsDir, { recursive: true });
fs.mkdirSync(casinoDir, { recursive: true });

let cardOk = 0;
for (const url of CARD_URLS) {
  const file = path.basename(url);
  const dest = path.join(cardsDir, file);
  try {
    const size = await download(url, dest);
    console.log(`OK cards/${file} (${size} bytes)`);
    cardOk += 1;
  } catch (err) {
    console.error(`FAIL cards/${file}:`, err.message);
  }
}

let casinoOk = 0;
for (const item of CASINO_SOURCES) {
  const dest = path.join(casinoDir, item.file);
  try {
    const size = await download(item.url, dest);
    console.log(`OK casino/${item.file} (${size} bytes)`);
    casinoOk += 1;
  } catch (err) {
    console.error(`FAIL casino/${item.file}:`, err.message);
  }
}

console.log(`\nDownloaded ${cardOk}/${CARD_URLS.length} card images, ${casinoOk}/${CASINO_SOURCES.length} casino images`);
