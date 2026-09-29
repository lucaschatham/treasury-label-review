// Real browser workflows against a built app. No detector accuracy claim.
// PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node scripts/qa/audit-workflows.mjs URL OUTPUT.json
import assert from 'node:assert/strict';
import {writeFile,readFile,mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';
import os from 'node:os';
import ExcelJS from 'exceljs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const [url='http://127.0.0.1:4184',output='evidence/audit-workflows.json']=process.argv.slice(2);
const browser=await chromium.launch({headless:true});
const checks=[];
const png=await readFile('public/samples/old-tom.png');
const headers=['filename','brand','type','abv','volume','producer','imported','country'];
const values=(name,abv=45)=>[name,'OLD TOM DISTILLERY','Kentucky Straight Bourbon Whiskey',abv,'750 mL','Old Tom Distillery, Bardstown, KY',false,''];
const csv=rows=>Buffer.from([headers,...rows].map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\r'));
const image=name=>({name,mimeType:'image/png',buffer:png});
async function finish(page){await page.waitForFunction(()=>/^(Finished|Stopped):/.test(document.querySelector('#status').textContent),{},{timeout:60000});}
async function sample(page){await page.locator('#sample-button').click();await page.locator('#run-button').click();await finish(page);}
async function selectRow(page,index=0){
  for(const pile of ['review','passed','failed']){
    await page.locator(`.large.${pile}`).click();
    const visible=page.locator('.triage-row:visible');
    if(await visible.count()>index){await visible.nth(index).click();return;}
  }
  throw new Error('No visible row');
}
async function upload(page,files){await page.locator('#images').setInputFiles(files);await page.waitForFunction(()=>!document.querySelector('#images').disabled);}
async function run(name,fn,{mobile=false}={}){
  if(process.env.AUDIT_FILTER && !name.includes(process.env.AUDIT_FILTER))return;
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},reducedMotion:'reduce'});
  if(process.env.AUDIT_COOKIE_FILE){
    const cookies=(await readFile(process.env.AUDIT_COOKIE_FILE,'utf8')).split('\n').filter(line=>line.includes('\t')).map(line=>{
      const [domain,,path,secure,expires,name,value]=line.replace(/^#HttpOnly_/,'').split('\t');
      return {domain,path,secure:secure==='TRUE',expires:Number(expires),name,value};
    });
    await context.addCookies(cookies);
  }
  const page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));
  context.on('request',r=>requests.push({url:r.url(),method:r.method()}));
  const started=Date.now();
  try {
    const detail=await fn(page,context);
    assert.deepEqual(errors,[],'Unhandled browser errors');
    assert.deepEqual([...new Set(requests.filter(r=>/^https?:/.test(r.url)).map(r=>new URL(r.url).origin))],[new URL(url).origin],'Unexpected request destination');
    assert.ok(requests.every(r=>r.method==='GET'),'Unexpected outbound mutation');
    checks.push({...detail,name,status:'PASS',durationMs:Date.now()-started,requestOrigins:[new URL(url).origin],pageErrors:errors});
    console.log('PASS',name);
  }catch(error){
    checks.push({name,status:'FAIL',error:error.message,pageErrors:errors});console.error('FAIL',name,error.message);
  }finally{await context.close();}
}
try {
  await run('sample, human decision, reset protection and reload',async p=>{
    await p.goto(url);await sample(p);
    const row=p.locator('.triage-row');assert.equal(await row.count(),1);
    const appearance=JSON.parse(await row.getAttribute('data-appearance'));
    assert.equal(appearance.status,'match');
    const findings=await row.getAttribute('data-findings');
    const timings=JSON.parse(await row.getAttribute('data-timings'));
    await selectRow(p);await p.locator('.decision-dialog input').fill('Audit check');
    await p.locator('.approve-action').click();assert.equal(await row.getAttribute('data-findings'),findings);
    await p.locator('#clear-files').click();await p.locator('#keep-reviewing').click();assert.equal(await row.count(),1);
    await p.locator('#clear-files').click();await p.locator('#confirm-reset').click();await row.waitFor({state:'detached'});
    await sample(p);await p.reload();assert.equal(await p.locator('.triage-row').count(),0);
    return {appearance,clickToResultMs:timings.clickToResult};
  });
  await run('CR-only CSV exact filename association and literal hostile filename',async p=>{
    await p.goto(url);
    const hostile='<img src=x onerror=alert(1)>.png';
    const rows=[values(hostile),values('wrong.png',10)];
    await upload(p,[image('wrong.png'),image(hostile),{name:'applications.csv',mimeType:'text/csv',buffer:csv(rows)}]);
    await p.locator('#run-button').click();await finish(p);
    const results=await p.locator('.triage-row').evaluateAll(nodes=>nodes.map(n=>({name:n.getAttribute('aria-label'),findings:JSON.parse(n.dataset.findings)})));
    assert.equal(results.length,2);
    assert.equal(results.find(r=>r.name==='Open wrong.png').findings.find(f=>f.field==='Alcohol content').status,'mismatch');
    assert.equal(results.find(r=>r.name===`Open ${hostile}`).findings.find(f=>f.field==='Alcohol content').status,'match');
    assert.equal(await p.locator('img[src="x"]').count(),0);
    return {results};
  });
  await run('real XLSX upload and per-row values',async p=>{
    const book=new ExcelJS.Workbook();book.addWorksheet('Applications').addRows([headers,values('excel.png')]);
    await p.goto(url);await upload(p,[image('excel.png'),{name:'applications.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:Buffer.from(await book.xlsx.writeBuffer())}]);
    await p.locator('#run-button').click();await finish(p);
    assert.match(await p.locator('#status').textContent(),/1 reviewed, 0 failed/);
    const findings=JSON.parse(await p.locator('.triage-row').getAttribute('data-findings'));
    assert.equal(findings.find(f=>f.field==='Alcohol content').status,'match');return{findings};
  });
  await run('corrupt image fails individually; remaining label completes',async p=>{
    await p.goto(url);await upload(p,[{name:'bad.png',mimeType:'image/png',buffer:Buffer.from('not an image')},image('good.png'),{name:'applications.csv',mimeType:'text/csv',buffer:csv([values('bad.png'),values('good.png')])}]);
    await p.locator('#run-button').click();await finish(p);
    assert.match(await p.locator('#status').textContent(),/1 reviewed, 1 failed, 0 remaining/);
    const rows=await p.locator('.triage-row').evaluateAll(nodes=>nodes.map(n=>({name:n.getAttribute('aria-label'),appearance:JSON.parse(n.dataset.appearance)})));
    assert.equal(rows.find(r=>r.name==='Open bad.png').appearance.status,'failed');return{rows};
  });
  await run('missing spreadsheet association and 301-image limit',async p=>{
    await p.goto(url);await upload(p,[image('present.png'),{name:'applications.csv',mimeType:'text/csv',buffer:csv([values('missing.png')])}]);
    assert.equal(await p.locator('#run-button').isDisabled(),true);assert.match(await p.locator('#status').textContent(),/Missing images|spreadsheet/i);
    await p.locator('#clear-files').click();
    await upload(p,Array.from({length:301},(_,i)=>({name:`${i}.png`,mimeType:'image/png',buffer:Buffer.from('x')})));
    assert.equal(await p.locator('#run-button').isDisabled(),true);assert.match(await p.locator('#status').textContent(),/300/);
  });
  await run('stop retains completed rows and accounts for remaining work',async p=>{
    await p.goto(url);const names=Array.from({length:5},(_,i)=>`stop-${i}.png`);
    await upload(p,[...names.map(image),{name:'applications.csv',mimeType:'text/csv',buffer:csv(names.map(n=>values(n)))}]);
    await p.locator('#run-button').click();await p.locator('.triage-row').first().waitFor({state:'attached',timeout:60000});
    await p.locator('#stop-button').click();await finish(p);
    const status=await p.locator('#status').textContent(),count=await p.locator('.triage-row').count();
    assert.match(status,/^Stopped:/);assert.ok(count>=1&&count<5);
    assert.match(status,new RegExp(`${5-count} remaining`));return{workflowStatus:status,completedRows:count};
  });
  await run('warm offline review uses cached worker and local image',async(p,c)=>{
    await p.goto(url);await sample(p);await c.setOffline(true);
    await p.locator('#run-button').click();await finish(p);
    assert.match(await p.locator('#status').textContent(),/1 reviewed, 0 failed/);
  });
  await run('mobile layout, keyboard details, unchanged source findings',async p=>{
    await p.goto(url);await sample(p);
    assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await selectRow(p);assert.equal(await p.locator('.decision-dialog').evaluate(n=>n.scrollWidth<=n.clientWidth),true);
    await p.keyboard.press('Escape');await p.locator('#edit-details').click();
    await p.locator('[name="abv"]').fill('10');await p.keyboard.press('Escape');
    assert.equal(await p.locator('[name="abv"]').inputValue(),'45');assert.equal(await p.locator('.triage-row').count(),1);
  },{mobile:true});
  if(process.env.AUDIT_FAULTS==='1')await run('OCR model 503 becomes actionable error; reload recovers',async p=>{
    await p.route('**/*traineddata*',r=>r.fulfill({status:503,body:'Unavailable'}));
    await p.goto(url);await p.locator('#sample-button').click();await p.locator('#run-button').click();
    await p.waitForFunction(()=>!document.querySelector('#run-button').disabled && /Reload/.test(document.querySelector('#status').textContent),{},{timeout:15000});
    assert.equal(await p.locator('#stop-button').isVisible(),false);assert.equal(await p.locator('.triage-row').count(),0);
    const failureMessage=await p.locator('#status').textContent();
    await p.unroute('**/*traineddata*');await p.reload();await sample(p);
    assert.match(await p.locator('#status').textContent(),/1 reviewed, 0 failed/);return{failureMessage};
  });
}finally{
  const result={recordedAt:new Date().toISOString(),url,browser:browser.version(),platform:`${os.platform()} ${os.arch()}`,filter:process.env.AUDIT_FILTER||null,scope:'Workflow correctness on the sample and controlled inputs; no real-label accuracy claim. Offline case requires assets and worker already loaded.',checks};
  await browser.close();await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify(result,null,2)+'\n');
}
if(checks.some(c=>c.status==='FAIL'))process.exitCode=1;
