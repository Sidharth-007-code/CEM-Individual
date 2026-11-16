const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  // Student context
  const studentContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const studentPage = await studentContext.newPage();

  console.log('[TC-05/06] Step 1: Log in as Aarav Sharma (aarav.sharma@msruas.ac.in)...');
  await studentPage.goto('https://campus-e-marketplace.vercel.app/login', { waitUntil: 'load' });
  await studentPage.waitForTimeout(2000);
  await studentPage.fill('input[type="email"]', 'aarav.sharma@msruas.ac.in');
  await studentPage.fill('input[type="password"]', 'StudentPass@2024');
  await studentPage.click('button[type="submit"]');
  await studentPage.waitForURL('**/dashboard', { timeout: 15000 });

  console.log('[TC-05/06] Step 2: Navigate to /listings/new ...');
  await studentPage.goto('https://campus-e-marketplace.vercel.app/listings/new', { waitUntil: 'load' });
  await studentPage.waitForTimeout(3000);

  // Fill in listing fields
  console.log('[TC-05/06] Filling title, description, category, price...');
  await studentPage.fill('input[placeholder*="Casio fx-991CW"]', 'Sony Wireless Stereo Headset (QA Verification Test)');
  await studentPage.fill('textarea', 'Genuine Sony over-ear headphones with original cables and box. Tested and working.');
  await studentPage.fill('input[type="number"]', '1500');

  // Prepare test images
  const img1 = path.resolve('public/images/products/headphones.jpg');
  const img2 = path.resolve('public/images/products/gaming_controller.jpg');
  const img3 = path.resolve('public/images/products/electric_kettle.jpg');

  // Upload ONLY 2 images first (TC-05)
  console.log('[TC-05] Uploading only 2 images to test validation threshold...');
  const fileInput = await studentPage.$('input[type="file"]');
  if (fileInput) {
    await fileInput.setInputFiles([img1, img2]);
    await studentPage.waitForTimeout(3000);
  }

  // Check the image counter badge and submit button state
  const badgeText = await studentPage.$eval('.bg-brutal-yellow:has-text("Min Images")', el => el.innerText.trim()).catch(() => '');
  console.log('[TC-05] Image counter badge:', badgeText);

  const submitBtn = await studentPage.$('button[type="submit"]');
  const isDisabled = await submitBtn.evaluate(el => el.disabled);
  console.log('[TC-05] Submit button disabled attribute:', isDisabled);

  // Trigger form submit to test explicit error display
  console.log('[TC-05] Attempting programmatic form submission to trigger validation error banner...');
  await studentPage.evaluate(() => {
    const form = document.querySelector('form');
    if (form) form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  });
  await studentPage.waitForTimeout(1500);

  // Observe error message
  const errorBanner = await studentPage.$eval('.bg-brutal-pink', el => el.innerText.trim()).catch(() => '');
  console.log('[TC-05] Observed Validation Block Banner:', errorBanner);

  // Capture TC-05 screenshot
  const tc05Path = path.resolve('docs/screenshots/manual/tc05.png');
  await studentPage.screenshot({ path: tc05Path, fullPage: true });
  console.log('[TC-05] Screenshot saved to:', tc05Path);

  // Now upload 3rd image (TC-06)
  console.log('[TC-06] Adding 3rd image to satisfy minimum threshold...');
  // In our UI, file input replaces or appends depending on input handler.
  // The input handler does: setImages(prev => [...prev, ...newImages])
  if (fileInput) {
    await fileInput.setInputFiles([img3]);
    await studentPage.waitForTimeout(3000);
  }

  const badgeTextAfter = await studentPage.$eval('.border-2:has-text("Min Images")', el => el.innerText.trim()).catch(() => '');
  console.log('[TC-06] Image counter badge after 3rd image:', badgeTextAfter);

  const isDisabledAfter = await submitBtn.evaluate(el => el.disabled);
  console.log('[TC-06] Submit button disabled attribute after 3rd image:', isDisabledAfter);

  console.log('[TC-06] Clicking Submit Item for Verification...');
  await submitBtn.click();

  // Wait for redirect to dashboard
  await studentPage.waitForURL('**/dashboard', { timeout: 20000 });
  console.log('[TC-06] Listing submitted successfully! Redirected to dashboard:', studentPage.url());

  // Step 3: Verifier checks the queue
  console.log('[TC-06] Step 3: Logging into fresh context as Verifier (verifier@msruas.ac.in)...');
  const verifierContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const verifierPage = await verifierContext.newPage();

  await verifierPage.goto('https://campus-e-marketplace.vercel.app/login', { waitUntil: 'load' });
  await verifierPage.waitForTimeout(2000);
  await verifierPage.fill('input[type="email"]', 'verifier@msruas.ac.in');
  await verifierPage.fill('input[type="password"]', 'CampusVerifier@2024');
  await verifierPage.click('button[type="submit"]');

  await verifierPage.waitForTimeout(3000);
  console.log('[TC-06] Verifier navigating to /verifier ...');
  await verifierPage.goto('https://campus-e-marketplace.vercel.app/verifier', { waitUntil: 'load' });
  await verifierPage.waitForTimeout(4000);

  // Check if our test listing is visible in the pending queue
  const queueItems = await verifierPage.$$eval('h3', els => els.map(e => e.innerText.trim()));
  console.log('[TC-06] Items visible in Verifier Queue:', queueItems);

  const tc06Path = path.resolve('docs/screenshots/manual/tc06.png');
  await verifierPage.screenshot({ path: tc06Path, fullPage: true });
  console.log('[TC-06] Screenshot saved to:', tc06Path);

  await browser.close();
})();
