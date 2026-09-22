import {createWorker} from 'tesseract.js';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {headingBox,strokeEvidence} from '../src/appearance.js';
const directory=process.env.PROBE_DIRECTORY || 'test/fixtures/generated';
const manifest=JSON.parse(await readFile(`${directory}/manifest.json`));
const selected=process.env.PROBE_DIRECTORY ? manifest.labels : manifest.labels.filter(f=>/^spirits-0[1-5]-(valid|warning-weight)$/.test(f.id));
await mkdir('/tmp/treasury-heading-probe',{recursive:true});
const worker=await createWorker('eng',1,{langPath:'node_modules/@tesseract.js-data/eng/4.0.0_best_int',cacheMethod:'none'});
await worker.setParameters({tessedit_pageseg_mode:'11'});
const report=[];
try {
 for (const fixture of selected) {
  const began=performance.now();
  const {data}=await worker.recognize(`${directory}/${fixture.file}`,{}, {text:true,blocks:true});
  const box=headingBox(data.blocks,1600,1200);
  const rgba=execFileSync('magick',[`${directory}/${fixture.file}`,'-depth','8','rgba:-'],{maxBuffer:1600*1200*4+1024});
  const stroke=strokeEvidence(data.blocks,{data:rgba,width:1600,height:1200});
  const record={stroke,id:fixture.id,expected:fixture.headingBold?'BOLD':'REGULAR',box,ocrMilliseconds:Math.round(performance.now()-began)};
  if(box) {
   const file=`/tmp/treasury-heading-probe/${fixture.id}.png`;
   execFileSync('magick',[`${directory}/${fixture.file}`,'-crop',`${box.x1-box.x0}x${box.y1-box.y0}+${box.x0}+${box.y0}`,'+repage','-bordercolor','white','-border','30','-resize','1200x','-colorspace','sRGB','-type','TrueColor',file]);
   record.file=file;record.sha256=createHash('sha256').update(await readFile(file)).digest('hex');
  }
  report.push(record);
 }
} finally {await worker.terminate();}
await writeFile('/tmp/treasury-heading-probe/manifest.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
