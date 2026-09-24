// Historical harness for the retired I-stem stroke guard (R-003/R-005 evidence). It imports
// strokeEvidence, which no longer exists on main; run it from a checkout of a61f00a or earlier.
import {createHash} from 'node:crypto';
import {createWorker} from 'tesseract.js';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {strokeEvidence} from '../src/appearance.js';
const baselineSource='c3ebde8cd36065d917677787f195b1dab46929b9';
const baseline=execFileSync('git',['show',`${baselineSource}:src/appearance.js`],{encoding:'utf8'});
const {strokeEvidence:original}=await import('data:text/javascript;base64,'+Buffer.from(baseline).toString('base64'));
const root=process.env.GUARD_FIXTURES || 'test/fixtures/generated/appearance-holdout';
const manifest=JSON.parse(await readFile(`${root}/manifest.json`,'utf8'));
console.log(Object.keys(manifest));
const fixtures=(Array.isArray(manifest)?manifest:manifest.labels).filter(item=>!process.env.GUARD_IDS||new RegExp(process.env.GUARD_IDS).test(item.id));
const worker=await createWorker('eng',1,{langPath:'node_modules/@tesseract.js-data/eng/4.0.0_best_int',cacheMethod:'none'});
await worker.setParameters({tessedit_pageseg_mode:'11'});
const results=[];
try {
 for(const item of fixtures){
  const file=`${root}/${item.file}`;
  if(item.sha256 && createHash('sha256').update(await readFile(file)).digest('hex')!==item.sha256)throw new Error(`Frozen fixture changed: ${item.id}`);
  const {data}=await worker.recognize(file,{}, {text:true,blocks:true});
  const pixels=execFileSync('magick',[file,'-depth','8','rgba:-'],{maxBuffer:1600*1200*4+1024});
  const guard=strokeEvidence(data.blocks,{width:1600,height:1200,data:pixels});
  results.push({...item,guard,original:original(data.blocks,{width:1600,height:1200,data:pixels})});
  console.log(item.id,JSON.stringify(guard));
 }
} finally {await worker.terminate();}
await writeFile(process.env.GUARD_OUTPUT || 'evidence/appearance-repair-local-holdout.json',JSON.stringify({scope:'Local guard only; no cloud inference. Frozen fixtures unchanged.',baselineSource,results},null,2)+'\n');
