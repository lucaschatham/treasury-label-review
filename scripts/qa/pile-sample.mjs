const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
import assert from 'node:assert/strict';
const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:1280,height:900}});
if (process.env.PILE_COOKIE_FILE) {
  const {readFile} = await import('node:fs/promises');
  const cookies = (await readFile(process.env.PILE_COOKIE_FILE,'utf8')).split('\n').filter(line => line.includes('\t')).map(line => {
    const [domain,,path,secure,expires,name,value] = line.replace(/^#HttpOnly_/, '').split('\t');
    return {domain,path,secure:secure==='TRUE',expires:Number(expires),name,value};
  });
  await page.context().addCookies(cookies);
}
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(process.env.PILE_URL || 'http://127.0.0.1:5184');
await page.getByRole('button',{name:'Try a sample review'}).click();
await page.getByRole('button',{name:'Review labels',exact:false}).click();
await page.locator('#status').filter({hasText:'Finished:'}).waitFor({timeout:120000});
assert.match(await page.locator('#status').textContent(),/1 reviewed, 0 failed, 0 remaining/);
const row=page.locator('.triage-row');
assert.equal(await row.count(),1);
assert.ok(JSON.parse(await row.getAttribute('data-timings')));
assert.ok(JSON.parse(await row.getAttribute('data-appearance')));
for (const key of ['review','passed','failed']) { await page.locator(`.large.${key}`).click(); if(await row.isVisible()) break; }
await row.click();
await page.getByRole('dialog').getByLabel('Note',{exact:true}).fill('Verified sample');
await page.getByRole('dialog').getByRole('button',{name:'Approve',exact:true}).click();
await page.locator('.large.passed').click();
assert.match(await row.textContent(),/Person/);
assert.equal(await page.locator('.north-star strong').textContent(),'0');
await page.screenshot({path:'evidence/pile-triage-preview.png',fullPage:true});
await page.reload();
assert.equal(await page.locator('.triage-row').count(),0);
assert.deepEqual(errors,[]);
console.log('PASS: deployed sample OCR, batch accounting, instrumentation, modal approval, session-only reset.');
await browser.close();
