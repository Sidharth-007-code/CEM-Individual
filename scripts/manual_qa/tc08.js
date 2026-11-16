const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log('[TC-08] Logging in as priya.patel@msruas.ac.in...');
  await page.goto('https://campus-e-marketplace.vercel.app/login', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  await page.fill('input[type="email"]', 'priya.patel@msruas.ac.in');
  await page.fill('input[type="password"]', 'StudentPass@2024');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });

  console.log('[TC-08] Navigating to listing /listings/lst_calc_01 ...');
  await page.goto('https://campus-e-marketplace.vercel.app/listings/lst_calc_01', { waitUntil: 'load' });
  await page.waitForTimeout(3000);

  // Find wishlist button (contains Heart icon or title "wishlist")
  const wishlistBtn = await page.$('button[title*="wishlist" i], button[title*="Wishlist" i], button:has(svg.lucide-heart)');
  if (!wishlistBtn) {
    console.error('[TC-08] Wishlist button not found on listing detail!');
  } else {
    console.log('[TC-08] Clicking wishlist button to ADD item...');
    await wishlistBtn.click();
    await page.waitForTimeout(2000);
  }

  // Navigate to /wishlist
  console.log('[TC-08] Navigating to /wishlist to verify item presence...');
  await page.goto('https://campus-e-marketplace.vercel.app/wishlist', { waitUntil: 'load' });
  await page.waitForTimeout(3000);

  const wishlistItemsAfterAdd = await page.$$eval('h3', els => els.map(e => e.innerText.trim()));
  console.log('[TC-08] Items on /wishlist after adding:', wishlistItemsAfterAdd);

  // Return to listing and remove from wishlist
  console.log('[TC-08] Returning to /listings/lst_calc_01 to REMOVE item...');
  await page.goto('https://campus-e-marketplace.vercel.app/listings/lst_calc_01', { waitUntil: 'load' });
  await page.waitForTimeout(3000);

  const removeWishlistBtn = await page.$('button[title*="wishlist" i], button[title*="Wishlist" i], button:has(svg.lucide-heart)');
  if (removeWishlistBtn) {
    await removeWishlistBtn.click();
    console.log('[TC-08] Clicked remove wishlist button.');
    await page.waitForTimeout(2000);
  }

  // Reload /wishlist to confirm persistence of removal
  console.log('[TC-08] Reloading /wishlist to verify removal...');
  await page.goto('https://campus-e-marketplace.vercel.app/wishlist', { waitUntil: 'load' });
  await page.waitForTimeout(3000);

  const wishlistItemsAfterRemove = await page.$$eval('h3', els => els.map(e => e.innerText.trim()));
  console.log('[TC-08] Items on /wishlist after removal:', wishlistItemsAfterRemove);

  const screenshotPath = path.resolve('docs/screenshots/manual/tc08.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('[TC-08] Screenshot saved to:', screenshotPath);

  await browser.close();
})();
