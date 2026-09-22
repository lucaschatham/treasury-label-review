import { cpSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const target = resolve('public/ocr');
mkdirSync(target, { recursive: true });
cpSync(resolve('node_modules/tesseract.js/dist/worker.min.js'), resolve(target, 'worker.min.js'));
cpSync(resolve('node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz'), resolve(target, 'eng.traineddata.gz'));
const cores = ['tesseract-core', 'tesseract-core-simd', 'tesseract-core-lstm', 'tesseract-core-simd-lstm', 'tesseract-core-relaxedsimd', 'tesseract-core-relaxedsimd-lstm'];
for (const core of cores) {
  for (const suffix of ['.wasm.js', '.wasm']) {
    cpSync(resolve(`node_modules/tesseract.js-core/${core}${suffix}`), resolve(target, `${core}${suffix}`));
  }
}
