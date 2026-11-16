const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log('[TC-03] Navigating to https://campus-e-marketplace.vercel.app/login ...');
  await page.goto('https://campus-e-marketplace.vercel.app/login', { waitUntil: 'load' });
  await page.waitForTimeout(2000);

  console.log('[TC-03] Entering valid email with wrong password...');
  await page.fill('input[type="email"]', 'admin@msruas.ac.in');
  await page.fill('input[type="password"]', 'WrongPassword123!');
  await page.click('button[type="submit"]');

  // Wait for error banner
  await page.waitForSelector('.bg-brutal-pink', { timeout: 8000 });
  const errorText = await page.$eval('.bg-brutal-pink', el => el.innerText.trim());
  const currentUrl = page.url();

  console.log('[TC-03] Observed Error Text:', errorText);
  console.log('[TC-03] URL after failed submit:', currentUrl);

  const screenshotPath = path.resolve('docs/screenshots/manual/tc03.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('[TC-03] Screenshot saved to:', screenshotPath);

  await browser.close();
})();
