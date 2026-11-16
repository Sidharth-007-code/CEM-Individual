const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // Log in as student to see notice board
  console.log('[TC-07] Logging in as priya.patel@msruas.ac.in...');
  await page.goto('https://campus-e-marketplace.vercel.app/login', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  await page.fill('input[type="email"]', 'priya.patel@msruas.ac.in');
  await page.fill('input[type="password"]', 'StudentPass@2024');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });

  console.log('[TC-07] Navigating to /browse ...');
  await page.goto('https://campus-e-marketplace.vercel.app/browse', { waitUntil: 'load' });
  await page.waitForTimeout(3000);

  // Type "calculator" into search input
  console.log('[TC-07] Searching for "calculator"...');
  const searchInput = await page.$('input[placeholder*="Search syllabus textbooks"]');
  if (searchInput) {
    await searchInput.fill('calculator');
    await page.waitForTimeout(1500);
  }

  // Click "Electronics & Calculators" category button
  console.log('[TC-07] Selecting "Electronics & Calculators" category...');
  const catBtn = await page.$('button:has-text("Electronics & Calculators")');
  if (catBtn) {
    await catBtn.click();
    await page.waitForTimeout(2000);
  }

  // Inspect matching listings
  const cardTitles = await page.$$eval('.font-sans.font-black.text-sm.line-clamp-2', els => els.map(e => e.innerText.trim()));
  console.log('[TC-07] Displayed matching listings:', cardTitles);

  // Check if any pending or sold items appear
  const hasPendingOrSold = await page.$$eval('body', els => {
    const text = els[0].innerText.toLowerCase();
    return text.includes('pending verification') || text.includes('sold out') || text.includes('item sold');
  });
  console.log('[TC-07] Contains pending or sold indicators in results grid?:', hasPendingOrSold);

  const screenshotPath = path.resolve('docs/screenshots/manual/tc07.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('[TC-07] Screenshot saved to:', screenshotPath);

  await browser.close();
})();
