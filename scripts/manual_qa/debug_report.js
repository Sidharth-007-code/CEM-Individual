const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

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

  console.log('Clicking report button...');
  await page.click('button[title="Report this listing"]');
  await page.waitForTimeout(1000);

  console.log('Submitting report...');
  await page.click('button:has-text("Submit Flag to Admin")');
  await page.waitForTimeout(4000);

  const errorBanner = await page.$eval('.bg-admin-50', el => el.innerText.trim()).catch(() => null);
  console.log('Error Banner on Report Modal:', errorBanner);

  const successBox = await page.$eval('.p-6.text-center', el => el.innerText.trim()).catch(() => null);
  console.log('Success Box on Report Modal:', successBox);

  await browser.close();
})();
