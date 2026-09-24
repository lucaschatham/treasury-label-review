import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resizeRGB} from '../scripts/experiments/browser_pixels.js';
const fixtures=JSON.parse(readFileSync(new URL('./fixtures/bicubic-parity.json',import.meta.url)));
test('experimental RGB resize reproduces independently generated Pillow pixels',()=>{
 for(const sample of fixtures.cases){
  const input=Uint8Array.from(sample.input),before=input.slice();
  const result=resizeRGB({width:sample.width,height:sample.height,data:input},sample.outWidth,sample.outHeight);
  assert.deepEqual(Array.from(result.data),sample.expected,`${sample.width}x${sample.height} to ${sample.outWidth}x${sample.outHeight}`);
  assert.deepEqual(input,before);
 }
});
