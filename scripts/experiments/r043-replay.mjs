// Replay saved baseline OCR and exact prepared PNG bytes; no new OCR and no tuning.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const [baselineDir,output,url='http://127.0.0.1:4183']=process.argv.slice(2);
const sha=x=>createHash('sha256').update(x).digest('hex');
const source=JSON.parse(await readFile(join(baselineDir,'summary.json'),'utf8'));
const codeHashes={};
for(const f of ['src/weight.js','scripts/experiments/r043-association.mjs','scripts/experiments/r043-replay.html','scripts/experiments/r043-replay.mjs'])codeHashes[f]=sha(await readFile(f));
const browser=await chromium.launch({headless:true});const rows=[];
try{
  const page=await browser.newPage();await page.goto(`${url}/scripts/experiments/r043-replay.html`,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>typeof window.replayR043==='function');
  for(const summary of source.rows){
    const original=JSON.parse(await readFile(join(baselineDir,summary.id+'.json'),'utf8'));
    const png=await readFile(`evidence/r043-local/${summary.id}-prepared.png`);
    assert.equal(sha(png),original.preparedSha256);
    const {overlayBase64,...result}=await page.evaluate(args=>window.replayR043(args),{base64:png.toString('base64'),blocks:original.blocks,heading:original.heading});
    assert.deepEqual(result.baseline,original.result,`Prepared PNG replay differs from baseline ${summary.id}`);
    await writeFile(`evidence/r043-local/${summary.id}-candidate-overlay.png`,Buffer.from(overlayBase64,'base64'),{flag:'wx'});
    rows.push({id:summary.id,sourceSha256:original.sourceSha256,preparedSha256:original.preparedSha256,...result});
    console.log(JSON.stringify({id:summary.id,result:result.candidate,selected:result.selected,rows:result.rows.length,wordCount:result.wordCount}));
  }
}finally{await browser.close();}
await writeFile(output,JSON.stringify({created:new Date().toISOString(),codeHashes,baseline:baselineDir,rows,
  scope:'Single frozen candidate over saved OCR/pixels; baseline replay asserted identical. Exposed development, not independent accuracy or browser click-to-result.'},null,2),{flag:'wx'});
