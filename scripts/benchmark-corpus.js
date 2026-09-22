import { createWorker } from 'tesseract.js';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { reviewLabel } from '../src/review.js';
import { readLayout, comparisonText } from '../src/layout.js';

const directory = new URL('../test/fixtures/generated/', import.meta.url);
const manifestBytes = await readFile(new URL('manifest.json', directory));
const manifest = JSON.parse(manifestBytes);
const output = new URL('../evidence/ocr-layout-current-run.json', import.meta.url);
const report = {
  startedAt: new Date().toISOString(),
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  node: process.version,
  platform: `${process.platform}/${process.arch}`,
  manifestSha256: createHash('sha256').update(manifestBytes).digest('hex'),
  scope: 'Sequential Node OCR and production layout-aware text comparisons. Does not verify browser upload, memory, cloud capacity, or automated boldness.',
  results: [],
};
const start = performance.now();
const worker = await createWorker('eng', 1, {
  langPath: new URL('../node_modules/@tesseract.js-data/eng/4.0.0_best_int/', import.meta.url).pathname,
  cacheMethod: 'none',
});
await worker.setParameters({ tessedit_pageseg_mode: '11' });
try {
  for (const fixture of manifest.labels) {
    const began = performance.now();
    try {
      const bytes = await readFile(new URL(fixture.file, directory));
      if (createHash('sha256').update(bytes).digest('hex') !== fixture.sha256) throw new Error('Fixture hash mismatch');
      const { data } = await worker.recognize(bytes, {}, {text:true,blocks:true});
      const layout = readLayout(data.blocks);
      const text = comparisonText(data, layout);
      report.results.push({
        id: fixture.id, split: fixture.split, quality: fixture.quality,
        expectedDefect: fixture.expectedDefect, milliseconds: Math.round(performance.now() - began),
        confidence: data.confidence, text,
        findings: reviewLabel(text, fixture.application, layout.lines.length ? layout : null).map(({ field, status, found }) => ({ field, status, found })),
      });
    } catch (error) {
      report.results.push({ id: fixture.id, error: String(error), milliseconds: Math.round(performance.now() - began) });
    }
    if (report.results.length % 25 === 0) {
      await writeFile(output, JSON.stringify(report, null, 2) + '\n');
      console.log(`${report.results.length}/${manifest.labels.length} processed`);
    }
  }
} finally {
  await worker.terminate();
  report.finishedAt = new Date().toISOString();
  report.totalMilliseconds = Math.round(performance.now() - start);
  report.errors = report.results.filter((result) => result.error).length;
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({ count: report.results.length, errors: report.errors, totalMilliseconds: report.totalMilliseconds }));
