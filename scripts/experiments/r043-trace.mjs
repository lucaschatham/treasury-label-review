// Stage 1 only: unchanged app image preparation and OCR in Chromium, plus rejection-gate diagnostics.
// PLAYWRIGHT_MODULE=/absolute/playwright/index.mjs node scripts/experiments/r043-trace.mjs <source evidence dir> <new output dir> [url]
import {readFile, writeFile, mkdir, readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join, resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const [sourceDir, outputDir, url='http://127.0.0.1:4183'] = process.argv.slice(2);
if (!sourceDir || !outputDir) throw new Error('source directory and new output directory required');
const sha = x => createHash('sha256').update(x).digest('hex');
const main = await readFile('src/main.js', 'utf8');
const prepareSource = main.slice(main.indexOf('async function prepareImage(file) {'), main.indexOf('\nsampleButton.addEventListener')).trim();
if (!prepareSource.endsWith('}') || !prepareSource.startsWith('async function prepareImage')) throw new Error('prepareImage boundary changed');
await mkdir(outputDir, {recursive:false});
const localDir = resolve('evidence/r043-local');
await mkdir(localDir, {recursive:true});
const ids = [
  'cola-26202001000840-01','cola-26216001000317-02','cola-26218001000008-02','prior-bruery-back-1',
  'cola-26222001000694-01','cola-26233001000352-02','cola-26205001000390-01','cola-26237001000144-01',
  'cola-26232001000090-02','cola-26237001000168-02','cola-26237001000210-02',
];
const manifest = JSON.parse(await readFile(join(sourceDir,'manifest.json'),'utf8'));
const files = Object.fromEntries(manifest.records.map(r => [r.image_id,r]));
const codeHashes = {};
for (const file of ['src/main.js','src/appearance.js','src/weight.js','scripts/experiments/r043-harness.html','scripts/experiments/r043-trace.mjs']) codeHashes[file] = sha(await readFile(file));
const ocrAssetHashes = {};
for (const file of await readdir('public/ocr')) ocrAssetHashes[file] = sha(await readFile(join('public/ocr',file)));
const provenance = {id:'R-043 stage 1',sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  sourceDir:resolve(sourceDir),created:new Date().toISOString(),codeHashes,ocrAssetHashes,prepareSourceSha256:sha(prepareSource),
  runtime:process.version,platform:process.platform,scope:'Unchanged baseline in Chromium; diagnostic stage times exclude worker initialization and are not application click-to-result. No candidate or new accuracy qualification.'};
await writeFile(join(outputDir,'provenance.json'), JSON.stringify(provenance,null,2));
const browser = await chromium.launch({headless:true});
const summaries = [];
try {
  for (const id of ids) {
    const item = files[id];
    if (!item) throw new Error(`Missing source record ${id}`);
    const bytes = await readFile(join(sourceDir,item.file));
    if (sha(bytes) !== item.sha256) throw new Error(`Changed source ${id}`);
    const context = await browser.newContext({viewport:{width:1400,height:1200}});
    const page = await context.newPage(); const errors=[];
    page.on('pageerror', e => errors.push(e.message));
    try {
      await page.goto(`${url}/scripts/experiments/r043-harness.html`, {waitUntil:'networkidle'});
      await page.waitForFunction(() => typeof window.traceR043 === 'function');
      const r = await page.evaluate(args => window.traceR043(args), {base64:bytes.toString('base64'),mime:item.file.endsWith('.png')?'image/png':'image/jpeg',prepareSource});
      const {preparedBase64,overlayBase64,...trace}=r;
      const prepared=Buffer.from(preparedBase64,'base64');
      await writeFile(join(localDir,`${id}-prepared.png`),prepared,{flag:'wx'});
      await writeFile(join(localDir,`${id}-overlay.png`),Buffer.from(overlayBase64,'base64'),{flag:'wx'});
      const result={id,sourceFile:item.file,sourceSha256:item.sha256,preparedSha256:sha(prepared),browser:browser.version(),errors,...trace};
      await writeFile(join(outputDir,`${id}.json`),JSON.stringify(result,null,1),{flag:'wx'});
      const summary={id,heading:trace.heading,result:trace.result,selected:trace.selected,
        potentialIgnoringVertical:trace.candidates.filter(c=>c.passesIgnoringVertical).map(c=>({text:c.text,box:c.firstSymbol.box})),
        candidateGates:trace.candidates.map(c=>({text:c.text,wordConfidence:c.confidence,symbolConfidence:c.firstSymbol?.confidence,capHeight:c.firstSymbol?c.firstSymbol.box.y1-c.firstSymbol.box.y0:null,rejected:c.rejected})),
        nativeSize:trace.nativeSize,preparedSize:trace.preparedSize,ocrMs:trace.ocrMs,measureMs:trace.measureMs};
      summaries.push(summary);
      console.log(JSON.stringify(summary));
    } finally {await context.close();}
  }
} finally {
  await browser.close();
  await writeFile(join(outputDir,'summary.json'),JSON.stringify({provenance,completed:summaries.length,rows:summaries},null,2));
}
