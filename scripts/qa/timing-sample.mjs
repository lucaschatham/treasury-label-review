// Uncached click-to-result timing of the built application in headless Chromium.
// Each run uses a fresh browser context (no cached OCR assets in memory; HTTP cache empty),
// so first-use OCR initialization is included. Usage:
//   npm run build && npx vite preview --port 4173 &  then
//   PLAYWRIGHT_MODULE=$(npm root -g)/playwright node scripts/qa/timing-sample.mjs http://127.0.0.1:4173 evidence/<output>.json [runs] [fixture dir]
// With a fixture dir (R-040 manifest), each run uploads one fixture instead of the sample.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import { readFile, writeFile } from 'node:fs/promises';
const [url = 'http://127.0.0.1:4173', output = '', runsArg = '3', fixtureDir = ''] = process.argv.slice(2);
const runs = Number(runsArg);
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH });
const results = [];
const manifest = fixtureDir ? JSON.parse(await readFile(`${fixtureDir}/manifest.json`, 'utf8')) : null;
try {
  for (let i = 0; i < runs; i++) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(url);
    if (manifest) {
      const item = manifest.rows[i % manifest.rows.length];
      await page.locator('#images').setInputFiles(`${fixtureDir}/${item.file}`);
      await page.getByRole('button', { name: 'Review labels', exact: false }).click();
      for (const [name, value] of [['brand', 'OLD TOM DISTILLERY'], ['type', 'Kentucky Straight Bourbon Whiskey'], ['abv', '45'], ['volume', '750 mL'], ['producer', 'Old Tom Distillery, Bardstown, KY']]) await page.locator(`[name="${name}"]`).fill(value);
      await page.locator('#save-application').click();
    } else {
      await page.getByRole('button', { name: 'Try a sample review' }).click();
      await page.getByRole('button', { name: 'Review labels', exact: false }).click();
    }
    await page.locator('#status').filter({ hasText: 'Finished:' }).waitFor({ state: 'attached', timeout: 180000 });
    const row = page.locator('.triage-row').first();
    const timings = JSON.parse(await row.getAttribute('data-timings'));
    const appearance = JSON.parse(await row.getAttribute('data-appearance'));
    const summaryText = (await row.textContent()).replace(/\s+/g, ' ').trim();
    results.push({ run: i + 1, fixture: manifest ? manifest.rows[i % manifest.rows.length].id : 'sample old-tom.png', timings, appearance, errors, summaryText });
    console.log(JSON.stringify({ run: i + 1, clickToResultMs: timings.clickToResult, ocrMs: timings.ocr, appearanceMs: timings.appearance, appearance }));
    await context.close();
  }
} finally { await browser.close(); }
const clicks = results.map(r => r.timings.clickToResult).sort((a, b) => a - b);
const summary = { url, runs: results.length, clickToResultMs: clicks, maxClickToResultMs: clicks.at(-1), environment: `headless Chromium ${browser.version()} via Playwright, fresh context per run (uncached), Linux container`, results,
  scope: 'Browser click-to-result including OCR initialization on this container; device speed differs elsewhere.' };
if (output) await writeFile(output, JSON.stringify(summary, null, 1));
console.log(JSON.stringify({ runs: results.length, clickToResultMs: clicks }));
