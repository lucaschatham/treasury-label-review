import {createWorker} from 'tesseract.js';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {reviewLabel} from '../src/review.js';
import {readLayout,comparisonText} from '../src/layout.js';
const root='/tmp/treasury-field-images';await mkdir(root,{recursive:true});
const application={brand:'OLD TOM DISTILLERY',type:'Kentucky Straight Bourbon Whiskey',abv:'45',volume:'750 mL',producer:'Old Tom Distillery, Bardstown, KY',imported:true,country:'France'};
const cases=[
 {id:'origin-address-decoy',field:'Country of origin',text:'Imported by Acme, Paris, France',y:610},
 {id:'type-company-decoy',field:'Class / type',rect:'60,270 1520,330',text:'Produced by Bourbon Street Distilling',y:310,application:{...application,type:'Bourbon'}},
 {id:'recycled-percent-decoy',field:'Alcohol content',rect:'60,340 1520,415',text:'45% recycled materials',y:390},
 {id:'origin-conflict',field:'Country of origin',text:'Product of France',y:610,extra:[{y:660,text:'Made in Poland'}]},
 {id:'type-complete-positive',field:'Class / type',text:'',y:610,expected:'match'},
 {id:'producer-complete-positive',field:'Producer / address',text:'',y:610,expected:'match'},
 {id:'wrapped-abv',field:'Alcohol content',rect:'60,340 1520,415',text:'ABV:',y:365,extra:[{y:407,text:'45%'}],expected:'match'},
 {id:'wrapped-origin',field:'Country of origin',text:'Product of',y:610,extra:[{y:650,text:'France'}],expected:'match'},
 {id:'origin-separate-columns',field:'Country of origin',text:'Product of',y:610,extra:[{x:950,y:650,text:'France'}]},
 {id:'wrapped-type',field:'Class / type',rect:'60,270 1520,335',text:'Kentucky Straight',y:280,extra:[{y:320,text:'Bourbon Whiskey'}],expected:'match'},
 {id:'unrelated-valid-origin',field:'Country of origin',text:'Product of France',y:610,extra:[{x:800,y:660,text:'Imported by Acme, Poland'}],expected:'match'},

 {id:'type-different',field:'Class / type',rect:'60,270 1520,330',text:'London Dry Gin',y:310},
 {id:'type-absent',field:'Class / type',rect:'60,270 1520,330',text:'',y:310},
 {id:'producer-different',field:'Producer / address',rect:'60,515 1520,565',text:'Produced by Another Company, Boston, MA',y:550},
 {id:'producer-absent',field:'Producer / address',rect:'60,515 1520,565',text:'',y:550},
 {id:'country-different',field:'Country of origin',text:'Product of Canada',y:610},
 {id:'country-absent',field:'Country of origin',text:'',y:610},
 {id:'country-correct',field:'Country of origin',text:'Product of France',y:610,expected:'match'},
 {id:'alcohol-conflict',field:'Alcohol content',text:'40% ABV',y:610},
 {id:'quantity-conflict',field:'Net contents',text:'700 mL',y:610},
 {id:'unsupported-quantity',field:'Net contents',rect:'60,420 1520,475',text:'25 oz',y:460},
 {id:'abv-exception',field:'Alcohol content',text:'',y:610,application:{...application,abv:''}},
];
const worker=await createWorker('eng',1,{langPath:'node_modules/@tesseract.js-data/eng/4.0.0_best_int',cacheMethod:'none'});await worker.setParameters({tessedit_pageseg_mode:'11'});
const results=[];
try{
 for(const item of cases){
  const file=`${root}/${item.id}.png`;
  const args=['test/fixtures/generated/spirits-01-valid.png'];
  for(const rect of item.clear||[])args.push('-fill','white','-draw',`rectangle ${rect}`);
  if(item.rect)args.push('-fill','white','-draw',`rectangle ${item.rect}`);
  args.push('-font','Helvetica','-pointsize','32','-fill','#151515','-annotate',`+70+${item.y}`,item.text,'-strip',file);
  for(const extra of item.extra||[])args.splice(args.length-2,0,'-annotate',`+${extra.x||70}+${extra.y}`,extra.text);
  execFileSync('magick',args);
  const {data}=await worker.recognize(file,{}, {text:true,blocks:true});const layout=readLayout(data.blocks);
  const findings=reviewLabel(comparisonText(data,layout),item.application||application,layout);
  const finding=findings.find(x=>x.field===item.field);const pass=item.expected==='match'?finding.status==='match':finding.status!=='match';
  results.push({id:item.id,field:item.field,expected:item.expected||'review',pass,finding,text:comparisonText(data,layout)});
 }
}finally{await worker.terminate();}
const report={scope:'Actual generated full-image OCR and current deterministic field comparisons; excludes browser and cloud appearance.',results};
await writeFile('evidence/field-image-repair.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(results.map(({id,pass,finding})=>({id,pass,status:finding.status}))));
if(results.some(x=>!x.pass))process.exitCode=1;
