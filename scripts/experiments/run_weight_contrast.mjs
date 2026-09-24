// OCR-located weight-contrast evaluation on full-label fixtures (R-039 development, R-040 qualification).
// Uses the application's Tesseract.js configuration, headingBox locator and weightContrast measurement.
// Usage: node scripts/experiments/run_weight_contrast.mjs <fixture dir> <output json> [experiment id]
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createWorker } from 'tesseract.js';
import { headingBox } from '../../src/appearance.js';
import { weightContrast, CONTRAST_CUTOFF } from '../../src/weight.js';

const [dir, output, experiment = 'weight-contrast'] = process.argv.slice(2);
if (existsSync(output)) throw new Error('Refusing to overwrite existing output');
const manifest = JSON.parse(await readFile(`${dir}/manifest.json`, 'utf8'));
const sha = buffer => createHash('sha256').update(buffer).digest('hex');
const worker = await createWorker('eng', 1, { langPath: 'node_modules/@tesseract.js-data/eng/4.0.0_best_int', cacheMethod: 'none' });
await worker.setParameters({ tessedit_pageseg_mode: '11' });
const rows = []; const started = performance.now();
const scratch = mkdtempSync(join(tmpdir(), 'weight-contrast-'));
// Pixels are decoded by Pillow (same decoder as the fixtures' renderer); the browser decodes its own uploads.
const pixels = file => { execFileSync('python3', ['scripts/experiments/dump_rgba.py', scratch, file]); const stem = file.replace(/^.*\//, '').replace(/\.(png|jpg)$/, ''); return stem; };
try {
  for (const item of manifest.rows) {
    const file = await readFile(`${dir}/${item.file}`);
    if (sha(file) !== item.fileSha256) throw new Error(`Fixture changed: ${item.id}`);
    const stem = pixels(`${dir}/${item.file}`);
    const meta = JSON.parse(await readFile(`${scratch}/${stem}.json`, 'utf8'));
    const image = { width: meta.width, height: meta.height, data: new Uint8ClampedArray(await readFile(`${scratch}/${stem}.rgba`)) };
    rmSync(`${scratch}/${stem}.rgba`);
    const ocrStarted = performance.now();
    const { data } = await worker.recognize(file, {}, { text: true, blocks: true });
    const ocrMs = performance.now() - ocrStarted;
    const measureStarted = performance.now();
    const heading = headingBox(data.blocks, image.width, image.height);
    const contrast = heading ? weightContrast(data.blocks, heading, image) : { supportsBold: false, ratio: null, reason: 'missing-heading' };
    const measureMs = performance.now() - measureStarted;
    const verdict = contrast.supportsBold ? 'MATCH' : 'REVIEW';
    rows.push({ id: item.id, arm: item.arm, headingFamily: item.headingFamily, headingWeight: item.headingWeight, bodyWeight: item.bodyWeight,
                targetCap: item.targetCap, jpeg: item.jpeg, expected: item.expected, verdict, correct: verdict === item.expected,
                heading, ...contrast, ocrMs, measureMs });
    console.log(item.id, verdict, contrast.reason, contrast.ratio?.toFixed(4) ?? '', `${ocrMs.toFixed(0)}ms`);
  }
} finally { await worker.terminate(); rmSync(scratch, { recursive: true, force: true }); }
const statement = rows.filter(r => r.arm === 'statement' || r.arm === 'independent');
const bold = statement.filter(r => r.headingWeight === 700), regular = statement.filter(r => r.headingWeight === 400);
const usable = r => r.ratio !== null;
const perFamily = {};
for (const family of new Set(statement.map(r => r.headingFamily))) {
  const fb = bold.filter(r => r.headingFamily === family), fr = regular.filter(r => r.headingFamily === family);
  perFamily[family] = { boldMatched: `${fb.filter(r => r.verdict === 'MATCH').length}/${fb.length}`, regularFalse: `${fr.filter(r => r.verdict === 'MATCH').length}/${fr.length}`,
                        boldRatioMin: Math.min(...fb.filter(usable).map(r => r.ratio)), regularRatioMax: Math.max(...fr.filter(usable).map(r => r.ratio)), unusable: statement.filter(r => r.headingFamily === family && !usable(r)).map(r => `${r.id}:${r.reason}`) };
}
const summary = {
  experiment, cutoff: CONTRAST_CUTOFF, fixtures: rows.length, seconds: (performance.now() - started) / 1000, ocrMsMedian: [...rows.map(r => r.ocrMs)].sort((a, b) => a - b)[rows.length >> 1], measureMsMax: Math.max(...rows.map(r => r.measureMs)),
  bold: bold.length, boldMatches: bold.filter(r => r.verdict === 'MATCH').length, regular: regular.length, regularFalseMatches: regular.filter(r => r.verdict === 'MATCH').length,
  usableReferenceRate: statement.filter(usable).length / statement.length,
  boldRatioMin: Math.min(...bold.filter(usable).map(r => r.ratio)), regularRatioMax: Math.max(...regular.filter(usable).map(r => r.ratio)),
  controls: Object.fromEntries(['body-bold', 'display-over-light', 'display-over-self'].map(arm => [arm, rows.filter(r => r.arm === arm).map(r => ({ id: r.id, verdict: r.verdict, ratio: r.ratio, reason: r.reason }))])),
  perFamily, manifestCodeSha256: manifest.codeSha256, rows,
  scope: 'Synthetic full-label fixtures through the application OCR configuration and measurement in Node; pixels decoded by Pillow, not a browser. Not real-label accuracy or browser timing.'
};
await writeFile(output, JSON.stringify(summary, null, 1));
console.log(JSON.stringify({ ...summary, rows: undefined, perFamily: undefined, controls: undefined }, null, 1));
