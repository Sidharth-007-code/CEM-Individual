const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log('[TC-16] Logging in as student priya.patel@msruas.ac.in...');
  await page.goto('https://campus-e-marketplace.vercel.app/login', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  await page.fill('input[type="email"]', 'priya.patel@msruas.ac.in');
  await page.fill('input[type="password"]', 'StudentPass@2024');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  console.log('[TC-16] Logged in as student. Testing direct access to /admin...');

  // Try direct access to /admin
  await page.goto('https://campus-e-marketplace.vercel.app/admin', { waitUntil: 'load' });
  await page.waitForTimeout(3000);

  const adminAccessDenied = await page.$eval('h2', el => el.innerText.trim()).catch(() => '');
  const adminMsg = await page.$eval('p.text-sm', el => el.innerText.trim()).catch(() => '');
  console.log('[TC-16] /admin Header:', adminAccessDenied);
  console.log('[TC-16] /admin Message:', adminMsg);

  // Take screenshot of /admin denial
  const screenshotPath = path.resolve('docs/screenshots/manual/tc16.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('[TC-16] Screenshot saved to:', screenshotPath);

  // Try direct access to /verifier
  console.log('[TC-16] Testing direct access to /verifier...');
  await page.goto('https://campus-e-marketplace.vercel.app/verifier', { waitUntil: 'load' });
  await page.waitForTimeout(3000);

  const verifierAccessDenied = await page.$eval('h2', el => el.innerText.trim()).catch(() => '');
  const verifierMsg = await page.$eval('p.text-sm', el => el.innerText.trim()).catch(() => '');
  console.log('[TC-16] /verifier Header:', verifierAccessDenied);
  console.log('[TC-16] /verifier Message:', verifierMsg);

  await browser.close();
})();
