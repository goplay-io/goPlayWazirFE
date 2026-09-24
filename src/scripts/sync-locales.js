#!/usr/bin/env node

/**
 * sync-locales.js
 *
 * Scans your locales folder, finds keys missing from every non-English
 * file compared to en.json, translates them via Google Translate (free,
 * no API key), and writes the results back — in the correct key order.
 *
 * Usage:
 *   node sync-locales.js                        # looks for ./locales
 *   node sync-locales.js --dir src/i18n         # custom folder
 *   node sync-locales.js --dir locales --dry    # preview only, no writes
 *   node sync-locales.js --dir locales --lang hi,ta,ml  # specific langs only
 *   node sync-locales.js --batch 20 --delay 300 # tuning
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (flag, fallback = null) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};
const hasFlag = flag => args.includes(flag);

const LOCALES_DIR   = path.resolve(getArg('--dir', 'locales'));
const BATCH_SIZE    = parseInt(getArg('--batch', '15'));
const DELAY_MS      = parseInt(getArg('--delay', '500'));
const DRY_RUN       = hasFlag('--dry');
const ONLY_LANGS    = getArg('--lang')?.split(',').map(s => s.trim()) ?? null;
const SOURCE_FILE   = getArg('--source', 'en.json');

// ── Terminal colours (no deps) ────────────────────────────────────────────────
const c = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  blue:   '\x1b[34m',
  cyan:   '\x1b[36m',
  white:  '\x1b[37m',
  grey:   '\x1b[90m',
  bgRed:  '\x1b[41m',
};
const clr  = (color, str) => `${color}${str}${c.reset}`;
const bold  = str => clr(c.bold, str);
const dim   = str => clr(c.dim + c.grey, str);
const ok    = str => clr(c.green, str);
const warn  = str => clr(c.yellow, str);
const err   = str => clr(c.red, str);
const info  = str => clr(c.cyan, str);
const hi    = str => clr(c.bold + c.white, str);

// ── Logging ───────────────────────────────────────────────────────────────────
const ts = () => dim(`[${new Date().toLocaleTimeString()}]`);
const log  = msg => console.log(`${ts()} ${msg}`);
const logOk   = msg => log(ok('✓ ') + msg);
const logErr  = msg => log(err('✗ ') + msg);
const logInfo = msg => log(info('→ ') + msg);
const logWarn = msg => log(warn('⚠ ') + msg);

function printBanner() {
  console.log();
  console.log(clr(c.bold + c.red, '  ┌─────────────────────────────────┐'));
  console.log(clr(c.bold + c.red, '  │      Locale Sync Script         │'));
  console.log(clr(c.bold + c.red, '  └─────────────────────────────────┘'));
  console.log();
  logInfo(`Locales dir : ${bold(LOCALES_DIR)}`);
  logInfo(`Source file : ${bold(SOURCE_FILE)}`);
  logInfo(`Batch size  : ${bold(BATCH_SIZE)}  |  Delay: ${bold(DELAY_MS + 'ms')}`);
  if (DRY_RUN)    logWarn('DRY RUN — files will NOT be modified');
  if (ONLY_LANGS) logInfo(`Targeting only: ${bold(ONLY_LANGS.join(', '))}`);
  console.log();
}

// ── JSON helpers ──────────────────────────────────────────────────────────────
function flattenKeys(obj, prefix = '') {
  const out = {};
  for (const key of Object.keys(obj)) {
    const p = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'string')         out[p] = obj[key];
    else if (obj[key] && typeof obj[key] === 'object') Object.assign(out, flattenKeys(obj[key], p));
  }
  return out;
}

/**
 * Rebuild locale object in the same key order as en.json,
 * inserting freshly translated values and keeping existing ones.
 * Extra keys present only in the locale are preserved at the end.
 */
function mergeInEnOrder(enObj, localeObj, translated, prefix = '') {
  const result = {};

  for (const key of Object.keys(enObj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const enVal = enObj[key];

    if (typeof enVal === 'string') {
      if (key in localeObj && typeof localeObj[key] === 'string') {
        result[key] = localeObj[key];                    // keep existing
      } else if (path in translated) {
        result[key] = translated[path];                  // newly translated
      } else {
        result[key] = enVal;                             // fallback to en
      }
    } else if (enVal && typeof enVal === 'object') {
      result[key] = mergeInEnOrder(
        enVal,
        (localeObj[key] && typeof localeObj[key] === 'object') ? localeObj[key] : {},
        translated,
        path
      );
    }
  }

  // Keep locale-only keys (not in en.json)
  for (const key of Object.keys(localeObj)) {
    if (!(key in result)) result[key] = localeObj[key];
  }

  return result;
}

// ── Google Translate (free, no API key) ───────────────────────────────────────
async function googleTranslate(text, langCode) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(langCode)}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data?.[0]?.[0]?.[0]) throw new Error('Unexpected response shape');
  return data[0].map(seg => seg[0] || '').join('');
}

async function translateWithRetry(text, langCode, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await googleTranslate(text, langCode);
    } catch (e) {
      if (attempt === retries) throw e;
      await sleep(600);
    }
  }
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function renderBar(done, total, width = 30) {
  const pct  = total > 0 ? done / total : 0;
  const fill = Math.round(pct * width);
  const bar  = '█'.repeat(fill) + '░'.repeat(width - fill);
  return `${clr(c.red, bar)} ${clr(c.bold, String(Math.round(pct * 100)).padStart(3))}%`;
}

function printProgress(done, total, label = '') {
  process.stdout.write(`\r  ${renderBar(done, total)}  ${dim(label.padEnd(40))}`);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  printBanner();

  // Validate locales dir
  if (!fs.existsSync(LOCALES_DIR)) {
    logErr(`Locales directory not found: ${bold(LOCALES_DIR)}`);
    logInfo(`Create it or pass a different path: ${dim('node sync-locales.js --dir path/to/locales')}`);
    process.exit(1);
  }

  // Load all JSON files
  const allFiles = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith('.json'));
  if (!allFiles.length) { logErr('No JSON files found in locales directory.'); process.exit(1); }
  if (!allFiles.includes(SOURCE_FILE)) {
    logErr(`Source file "${SOURCE_FILE}" not found in ${LOCALES_DIR}`);
    process.exit(1);
  }

  const sourceData = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, SOURCE_FILE), 'utf8'));
  const sourceFlat = flattenKeys(sourceData);
  const sourceTotalKeys = Object.keys(sourceFlat).length;

  logOk(`Loaded ${bold(SOURCE_FILE)} — ${bold(sourceTotalKeys)} translatable keys`);
  console.log();

  // Build list of target files
  let targetFiles = allFiles.filter(f => f !== SOURCE_FILE);
  if (ONLY_LANGS) {
    targetFiles = targetFiles.filter(f => ONLY_LANGS.includes(f.replace('.json', '')));
    if (!targetFiles.length) { logErr('No matching files for the specified --lang values.'); process.exit(1); }
  }

  // ── Analysis ──────────────────────────────────────────────────────
  console.log(bold('  Analysis'));
  console.log(dim('  ' + '─'.repeat(60)));

  const tasks = []; // { file, lang, data, missing }

  for (const file of targetFiles) {
    const data     = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, file), 'utf8'));
    const flat     = flattenKeys(data);
    const missing  = Object.entries(sourceFlat)
      .filter(([k]) => !(k in flat))
      .map(([k, v]) => ({ path: k, value: v }));

    const lang    = file.replace('.json', '');
    const pct     = Math.round(((sourceTotalKeys - missing.length) / sourceTotalKeys) * 100);
    const barColor = pct === 100 ? c.green : pct > 70 ? c.yellow : c.red;
    const status  = missing.length === 0
      ? ok('  complete ')
      : err(`  ${String(missing.length).padStart(4)} missing`);

    const bar = (() => {
      const w = 20; const fill = Math.round((pct / 100) * w);
      return clr(barColor, '█'.repeat(fill)) + clr(c.grey, '░'.repeat(w - fill));
    })();

    console.log(`  ${file.padEnd(18)} ${bar} ${clr(c.bold, String(pct).padStart(3) + '%')}  ${status}`);

    if (missing.length > 0) tasks.push({ file, lang, data, missing });
  }

  console.log();

  const totalMissing = tasks.reduce((s, t) => s + t.missing.length, 0);

  if (totalMissing === 0) {
    logOk(bold('All locale files are up to date! Nothing to do.'));
    console.log();
    return;
  }

  logInfo(`${bold(totalMissing)} missing key(s) across ${bold(tasks.length)} file(s) — starting translation…`);
  console.log();

  if (DRY_RUN) {
    logWarn('DRY RUN: skipping translation and file writes.');
    console.log();

    for (const task of tasks) {
      console.log(`  ${bold(task.file)} — ${task.missing.length} keys:`);
      task.missing.slice(0, 10).forEach(m => console.log(`    ${dim(m.path)}`));
      if (task.missing.length > 10) console.log(`    ${dim(`… and ${task.missing.length - 10} more`)}`);
      console.log();
    }
    return;
  }

  // ── Translation ───────────────────────────────────────────────────
  const startTime = Date.now();
  let globalDone = 0;

  for (const task of tasks) {
    const { file, lang, data, missing } = task;
    const translated = {};
    let fileDone = 0;
    let fileFailed = 0;

    console.log(`  ${bold(clr(c.red, file))} — ${missing.length} keys`);

    let idx = 0;
    while (idx < missing.length) {
      const batch = missing.slice(idx, idx + BATCH_SIZE);

      await Promise.all(batch.map(async item => {
        try {
          translated[item.path] = await translateWithRetry(item.value, lang);
          fileDone++;
          globalDone++;
        } catch (e) {
          logErr(`  ${item.path} → ${e.message}`);
          fileFailed++;
          globalDone++;
        }
        printProgress(fileDone + fileFailed, missing.length, item.path);
      }));

      idx += BATCH_SIZE;
      if (idx < missing.length && DELAY_MS > 0) await sleep(DELAY_MS);
    }

    process.stdout.write('\n');

    // Merge and write
    const merged = mergeInEnOrder(sourceData, data, translated);
    const outPath = path.join(LOCALES_DIR, file);
    fs.writeFileSync(outPath, JSON.stringify(merged, null, 2) + '\n', 'utf8');

    const done   = clr(c.green, `${fileDone} translated`);
    const failed = fileFailed > 0 ? clr(c.red, `, ${fileFailed} failed`) : '';
    logOk(`  ${file} updated  ${dim(`(${done}${failed})`)}`);
    console.log();
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(dim('  ' + '─'.repeat(60)));
  logOk(bold(`Done in ${elapsed}s — ${globalDone} keys translated across ${tasks.length} file(s)`));
  console.log();
}

main().catch(e => {
  console.error(err('\nFatal error: ') + e.message);
  process.exit(1);
});
