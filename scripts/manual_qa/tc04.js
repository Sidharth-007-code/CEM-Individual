const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log('[TC-04] Logging in as rohit.kumar@msruas.ac.in...');
  await page.goto('https://campus-e-marketplace.vercel.app/login', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  await page.fill('input[type="email"]', 'rohit.kumar@msruas.ac.in');
  await page.fill('input[type="password"]', 'StudentPass@2024');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard', { timeout: 15000 });
  console.log('[TC-04] Logged in successfully. Navigating to /profile...');

  await page.goto('https://campus-e-marketplace.vercel.app/profile', { waitUntil: 'load' });
  await page.waitForTimeout(3000);

  // Fill in new phone or bio
  const testPhone = '9876543219';
  const testBio = 'Passionate maker, 2nd year Mech. Serviced bicycles & drafting gear available.';
  
  // Fill phone if input available
  const phoneInput = await page.$('input[placeholder*="9876543210"], input[type="tel"], input[name="phone"]');
  if (phoneInput) {
    await phoneInput.fill(testPhone);
    console.log('[TC-04] Entered phone:', testPhone);
  }

  // Fill bio
  const bioInput = await page.$('textarea');
  if (bioInput) {
    await bioInput.fill(testBio);
    console.log('[TC-04] Entered bio:', testBio);
  }

  // Submit form
  const saveBtn = await page.$('button[type="submit"]');
  if (saveBtn) {
    await saveBtn.click();
    console.log('[TC-04] Clicked Save Profile button.');
  }

  // Wait for notification banner
  await page.waitForTimeout(4000);

  // Reload page to verify persistence
  console.log('[TC-04] Reloading /profile to test persistence...');
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(3000);

  // Read persisted values with fresh selectors
  const reloadedPhoneInput = await page.$('input[placeholder*="9876543210"], input[type="tel"], input[name="phone"]');
  const reloadedBioInput = await page.$('textarea');
  const reloadedPhone = reloadedPhoneInput ? await reloadedPhoneInput.inputValue() : '';
  const reloadedBio = reloadedBioInput ? await reloadedBioInput.inputValue() : '';
  console.log('[TC-04] Reloaded Phone value:', reloadedPhone);
  console.log('[TC-04] Reloaded Bio value:', reloadedBio);

  // Navigate to Dashboard
  await page.goto('https://campus-e-marketplace.vercel.app/dashboard', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  console.log('[TC-04] Dashboard opened at URL:', page.url());

  const screenshotPath = path.resolve('docs/screenshots/manual/tc04.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('[TC-04] Screenshot saved to:', screenshotPath);

  await browser.close();
})();
