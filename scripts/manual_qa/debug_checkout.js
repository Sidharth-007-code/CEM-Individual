const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER PAGE ERROR:', err.message));

  console.log('Logging in as Priya...');
  await page.goto('https://campus-e-marketplace.vercel.app/login', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  await page.fill('input[type="email"]', 'priya.patel@msruas.ac.in');
  await page.fill('input[type="password"]', 'StudentPass@2024');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });

  console.log('Navigating to /checkout/lst_calc_01 ...');
  await page.goto('https://campus-e-marketplace.vercel.app/checkout/lst_calc_01', { waitUntil: 'load' });
  await page.waitForTimeout(3000);

  // Check if error is already present or listing status
  const bodyText = await page.$eval('body', el => el.innerText);
  console.log('Initial checkout body text snippet:', bodyText.slice(0, 300));

  console.log('Clicking Continue to UPI Simulator...');
  await page.click('button:has-text("Continue to UPI Simulator")');
  await page.waitForTimeout(1500);

  console.log('Clicking Simulate Successful UPI Pay...');
  await page.click('button:has-text("Simulate Successful UPI Pay")');
  await page.waitForTimeout(5000);

  const errorEl = await page.$('.bg-admin-50');
  if (errorEl) {
    console.log('ON-SCREEN ERROR:', await errorEl.innerText());
  }

  console.log('Current URL after 5s:', page.url());
  await browser.close();
})();
