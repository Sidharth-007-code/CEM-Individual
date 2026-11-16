const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  console.log('Logging in as Aarav Sharma...');
  await page.goto('https://campus-e-marketplace.vercel.app/login', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  await page.fill('input[type="email"]', 'aarav.sharma@msruas.ac.in');
  await page.fill('input[type="password"]', 'StudentPass@2024');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });

  console.log('Opening /listings/lst_kettle_01 ...');
  await page.goto('https://campus-e-marketplace.vercel.app/listings/lst_kettle_01', { waitUntil: 'load' });
  await page.waitForTimeout(3000);

  console.log('Opening report modal...');
  await page.click('button[title="Report this listing"]');
  await page.waitForTimeout(1000);

  console.log('Submitting report...');
  await page.click('button:has-text("Submit Flag to Admin")');
  await page.waitForTimeout(4000);

  const tc15Path = path.resolve('docs/screenshots/manual/tc15.png');
  await page.screenshot({ path: tc15Path, fullPage: true });
  console.log('Saved tc15.png to:', tc15Path);

  await browser.close();
})();
