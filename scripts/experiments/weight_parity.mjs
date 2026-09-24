// Parity of src/weight.js against the Python R-038 estimator on dumped R-038 images.
// Usage: node scripts/experiments/weight_parity.mjs <r037 dir> <rgba dir (dump_rgba.py output)> <r038 result.json>
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { localThickness, median } from '../../src/weight.js';
const [r037Dir, rgbaDir, r038Path] = process.argv.slice(2);
const r037 = JSON.parse(await readFile(`${r037Dir}/result.json`, 'utf8'));
const r038 = JSON.parse(await readFile(r038Path, 'utf8'));
const boxes = Object.fromEntries(r037.rows.map(r => [r.id, r.boxes]));
const rows = [];
for (const row of r038.rows) {
  const stem = row.file.replace(/\.(png|jpg)$/, '');
  if (!existsSync(`${rgbaDir}/${stem}.json`)) continue;
  const meta = JSON.parse(await readFile(`${rgbaDir}/${stem}.json`, 'utf8'));
  const data = new Uint8ClampedArray(await readFile(`${rgbaDir}/${stem}.rgba`));
  const image = { width: meta.width, height: meta.height, data };
  const [hx0, hy0, hx1, hy1] = boxes[row.id].heading, [bx0, by0, bx1, by1] = boxes[row.id].body;
  const heading = median(localThickness(image, { x0: hx0, y0: hy0, x1: hx1, y1: hy1 }));
  const body = median(localThickness(image, { x0: bx0, y0: by0, x1: bx1, y1: by1 }));
  rows.push({ id: row.id, python: { heading: row.headingThickness, body: row.bodyThickness }, node: { heading, body },
              delta: Math.max(Math.abs(heading - row.headingThickness), Math.abs(body - row.bodyThickness)) });
}
const maxDelta = Math.max(...rows.map(r => r.delta));
const result = { scope: 'Estimator parity only; not detector accuracy', images: rows.length, maxAbsoluteDelta: maxDelta, rows };
if (process.env.PARITY_OUTPUT) await writeFile(process.env.PARITY_OUTPUT, JSON.stringify(result, null, 1));
console.log(JSON.stringify({ images: rows.length, maxAbsoluteDelta: maxDelta }));
if (!(maxDelta < 1e-3)) { console.error('Parity failed'); process.exit(1); }
