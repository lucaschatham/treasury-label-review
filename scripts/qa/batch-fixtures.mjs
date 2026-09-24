// Upload every fixture of a manifest in one batch through the built application, then compare each
// row's browser appearance verdict with the Node run of the same fixtures (browser/Node parity and
// batch accounting). Usage:
//   PLAYWRIGHT_MODULE=$(npm root -g)/playwright/index.mjs node scripts/qa/batch-fixtures.mjs \
//     http://127.0.0.1:4173 <fixture dir> <node result json> evidence/<output>.json
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import { readFile, writeFile } from 'node:fs/promises';
const [url, fixtureDir, nodeResultPath, output, limitArg = '0'] = process.argv.slice(2);
const limit = Number(limitArg) || 0;
const manifest = JSON.parse(await readFile(`${fixtureDir}/manifest.json`, 'utf8'));
if (limit) manifest.rows = manifest.rows.slice(0, limit);
// When every fixture carries its own brand, upload a CSV so each label maps to its own application row.
const distinct = manifest.rows.every(r => r.brand) && new Set(manifest.rows.map(r => r.brand)).size === manifest.rows.length;
const csvPath = `${fixtureDir}/applications.csv`;
if (distinct) await writeFile(csvPath, ['filename,brand,type,abv,volume,producer', ...manifest.rows.map(r => `${r.file},${r.brand},Kentucky Straight Bourbon Whiskey,45,750 mL,"Old Tom Distillery, Bardstown, KY"`)].join('\n') + '\n');
const nodeRows = nodeResultPath && nodeResultPath !== '-' ? Object.fromEntries(JSON.parse(await readFile(nodeResultPath, 'utf8')).rows.map(r => [r.id, r])) : {};
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
const errors = []; page.on('pageerror', e => errors.push(e.message));
const started = Date.now();
try {
  await page.goto(url);
  await page.locator('#images').setInputFiles([...manifest.rows.map(r => `${fixtureDir}/${r.file}`), ...(distinct ? [csvPath] : [])]);
  let clicked;
  if (distinct) {
    await page.locator('#manifest-summary').filter({ hasText: `${manifest.rows.length} rows` }).waitFor({ timeout: 60000 });
    clicked = Date.now();
    await page.getByRole('button', { name: 'Review labels', exact: false }).click();
  } else {
    await page.getByRole('button', { name: 'Review labels', exact: false }).click();
    for (const [name, value] of [['brand', 'OLD TOM DISTILLERY'], ['type', 'Kentucky Straight Bourbon Whiskey'], ['abv', '45'], ['volume', '750 mL'], ['producer', 'Old Tom Distillery, Bardstown, KY']]) await page.locator(`[name="${name}"]`).fill(value);
    clicked = Date.now();
    await page.locator('#save-application').click();
  }
  await page.locator('#status').filter({ hasText: 'Finished:' }).waitFor({ state: 'attached', timeout: 1800000 });
  const finished = Date.now();
  const status = await page.locator('#status').textContent();
  const rows = await page.evaluate(() => [...document.querySelectorAll('.triage-row')].map(row => ({
    name: row.textContent.replace(/\s+/g, ' ').trim(),
    appearance: JSON.parse(row.dataset.appearance || 'null'), timings: JSON.parse(row.dataset.timings || 'null'), findings: JSON.parse(row.dataset.findings || '[]') })));
  const byFile = {};
  for (const item of manifest.rows) byFile[item.file] = item;
  const comparisons = rows.map(row => {
    const item = manifest.rows.find(r => row.name.includes(r.file)) || null;
    const node = item ? nodeRows[item.id] : null;
    const browserVerdict = row.appearance?.status === 'match' ? 'MATCH' : 'REVIEW';
    const brandMatch = row.findings.some(f => f.field === 'Brand name' && f.status === 'match');
    return { file: item?.file || row.name, id: item?.id, expected: item?.expected, brand: item?.brand, brandMatch, browserVerdict, nodeVerdict: node?.verdict, browserRatio: row.appearance?.ratio ?? null, nodeRatio: node?.ratio ?? null,
             ratioDelta: row.appearance?.ratio != null && node?.ratio != null ? Math.abs(row.appearance.ratio - node.ratio) : null, agrees: node ? browserVerdict === node.verdict : null, clickToResultMs: row.timings?.clickToResult, ocrMs: row.timings?.ocr, appearanceMs: row.timings?.appearance };
  });
  const summary = { url, fixtures: manifest.rows.length, rowsRendered: rows.length, status: status.trim(), batchSeconds: (finished - clicked) / 1000,
    verdictAgreement: `${comparisons.filter(c => c.agrees).length}/${comparisons.filter(c => c.nodeVerdict).length}`, csvUploaded: distinct,
    rowsMappedToOwnFile: comparisons.filter(c => c.id).length, brandMatches: `${comparisons.filter(c => c.brandMatch).length}/${comparisons.length}`,
    maxRatioDelta: Math.max(0, ...comparisons.map(c => c.ratioDelta ?? 0)),
    boldMatched: `${comparisons.filter(c => c.expected === 'MATCH' && c.browserVerdict === 'MATCH').length}/${comparisons.filter(c => c.expected === 'MATCH').length}`,
    regularFalse: `${comparisons.filter(c => c.expected === 'REVIEW' && c.browserVerdict === 'MATCH').length}/${comparisons.filter(c => c.expected === 'REVIEW').length}`,
    lastRowClickToResultMs: Math.max(...comparisons.map(c => c.clickToResultMs ?? 0)), // rows time from the batch click, so the last row equals the batch total errors, comparisons,
    scope: 'Built application in headless Chromium on this container; synthetic fixtures; not real-label accuracy.' };
  await writeFile(output, JSON.stringify(summary, null, 1));
  console.log(JSON.stringify({ ...summary, comparisons: undefined }, null, 1));
} finally { await browser.close(); }
