// Print what the application's OCR configuration and brand locator read from label images.
// Diagnostic only. Usage: node scripts/experiments/ocr_probe.mjs <image> [<image> ...]
import { createWorker } from 'tesseract.js';
import { readLayout, comparisonText } from '../../src/layout.js';
const worker = await createWorker('eng', 1, { langPath: 'node_modules/@tesseract.js-data/eng/4.0.0_best_int', cacheMethod: 'none' });
await worker.setParameters({ tessedit_pageseg_mode: '11' });
try {
  for (const file of process.argv.slice(2)) {
    const { data } = await worker.recognize(file, {}, { text: true, blocks: true });
    const layout = readLayout(data.blocks);
    const words = data.blocks.flatMap(b => b.paragraphs.flatMap(p => p.lines.flatMap(l => l.words)));
    const brandWords = words.filter(w => w.bbox.y1 < 200).map(w => `${w.text}(${w.confidence.toFixed(0)},${w.bbox.y1 - w.bbox.y0}px)`);
    console.log(JSON.stringify({ file, confidence: data.confidence, brandText: layout.brandText, topWords: brandWords.slice(0, 8), firstLines: layout.lines.slice(0, 3).map(l => l.text), textHead: comparisonText(data, layout).slice(0, 80) }));
  }
} finally { await worker.terminate(); }
