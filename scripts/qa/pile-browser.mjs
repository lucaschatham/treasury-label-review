// Requires an installed Playwright Core runtime and Chromium.
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
import assert from 'node:assert/strict';
const browser = await chromium.launch({headless:true});
try {
  const page = await browser.newPage({viewport:{width:1280,height:900}});
  const errors=[]; page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`${process.env.PILE_URL || 'http://127.0.0.1:5184'}/test/triage-browser.html`);
  await page.getByRole('button',{name:'Run UI acceptance checks'}).click();
  assert.match(await page.locator('#outcome').textContent(),/^PASS:/);
  await page.setViewportSize({width:400,height:850});
  await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await page.locator('.pile-wires').isVisible(),false);
  assert.deepEqual(errors,[]);
  console.log(await page.locator('#outcome').textContent());
} finally {await browser.close();}
