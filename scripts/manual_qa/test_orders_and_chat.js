const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });

  console.log('=== RUNNING TC-11, TC-10, TC-12, TC-13, TC-14 ===');

  // Context 1: Priya Patel (Buyer)
  const priyaContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const priyaPage = await priyaContext.newPage();

  console.log('[TC-11] Step 1: Log in as Priya Patel (priya.patel@msruas.ac.in)...');
  await priyaPage.goto('https://campus-e-marketplace.vercel.app/login', { waitUntil: 'load' });
  await priyaPage.waitForTimeout(2000);
  await priyaPage.fill('input[type="email"]', 'priya.patel@msruas.ac.in');
  await priyaPage.fill('input[type="password"]', 'StudentPass@2024');
  await priyaPage.click('button[type="submit"]');
  await priyaPage.waitForURL('**/dashboard', { timeout: 15000 });

  console.log('[TC-11] Step 2: Open available listing /listings/lst_calc_01 ...');
  await priyaPage.goto('https://campus-e-marketplace.vercel.app/listings/lst_calc_01', { waitUntil: 'load' });
  await priyaPage.waitForTimeout(3000);

  // Click Buy Now
  console.log('[TC-11] Step 3: Clicking Buy Now button...');
  await priyaPage.click('a:has-text("Buy Now")');
  await priyaPage.waitForURL('**/checkout/lst_calc_01', { timeout: 10000 });
  await priyaPage.waitForTimeout(2000);

  // Select Meetup Spot
  console.log('[TC-11] Selecting Meetup Spot: Central Campus Library Entrance...');
  await priyaPage.selectOption('select', { index: 0 });

  // Open UPI modal
  console.log('[TC-11] Clicking Continue to UPI Simulator...');
  await priyaPage.click('button:has-text("Continue to UPI Simulator")');
  await priyaPage.waitForTimeout(1500);

  // Test Failure simulation
  console.log('[TC-11] Clicking Simulate Failed Payment Response...');
  await priyaPage.click('button:has-text("Simulate Failed Payment Response")');
  await priyaPage.waitForTimeout(1500);

  const failMsg = await priyaPage.$eval('.bg-admin-50', el => el.innerText.trim()).catch(() => '');
  console.log('[TC-11] Observed Failure Banner:', failMsg);
  console.log('[TC-11] Verifying URL did NOT change (order not created):', priyaPage.url());

  // Capture screenshot of payment simulation failure state
  const tc11Path = path.resolve('docs/screenshots/manual/tc11.png');
  await priyaPage.screenshot({ path: tc11Path, fullPage: true });
  console.log('[TC-11] Screenshot saved to:', tc11Path);

  // Now test Success simulation
  console.log('[TC-11] Clicking Simulate Successful UPI Pay...');
  await priyaPage.click('button:has-text("Simulate Successful UPI Pay")');

  // Wait for redirect to order tracking page
  await priyaPage.waitForURL('**/orders/**', { timeout: 20000 });
  const orderUrl = priyaPage.url();
  const orderId = orderUrl.split('/orders/')[1]?.split('?')[0];
  console.log('[TC-11] UPI Order Confirmed! Redirected to:', orderUrl, 'Order ID:', orderId);

  // Test Cash on Delivery on a second listing (e.g. lst_draft_01)
  console.log('[TC-11] Step 4: Testing Cash at Meetup on /listings/lst_draft_01 ...');
  await priyaPage.goto('https://campus-e-marketplace.vercel.app/listings/lst_draft_01', { waitUntil: 'load' });
  await priyaPage.waitForTimeout(2000);
  const buyCashBtn = await priyaPage.$('a:has-text("Buy Now")');
  if (buyCashBtn) {
    await buyCashBtn.click();
    await priyaPage.waitForURL('**/checkout/lst_draft_01', { timeout: 10000 });
    await priyaPage.waitForTimeout(2000);
    // Select Cash radio
    await priyaPage.click('label:has-text("Cash at Meetup")');
    await priyaPage.waitForTimeout(1000);
    // Confirm Cash Order
    await priyaPage.click('button:has-text("Confirm Cash Order")');
    await priyaPage.waitForURL('**/orders/**', { timeout: 20000 });
    console.log('[TC-11] Cash Order created successfully! URL:', priyaPage.url());
  }

  // -------------------------------------------------------------
  // TC-10: Single sale race condition with Rohit Kumar
  // -------------------------------------------------------------
  console.log('\n--- [TC-10] Single Sale Verification ---');
  const rohitContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const rohitPage = await rohitContext.newPage();

  console.log('[TC-10] Logging in as Rohit Kumar (rohit.kumar@msruas.ac.in)...');
  await rohitPage.goto('https://campus-e-marketplace.vercel.app/login', { waitUntil: 'load' });
  await rohitPage.waitForTimeout(2000);
  await rohitPage.fill('input[type="email"]', 'rohit.kumar@msruas.ac.in');
  await rohitPage.fill('input[type="password"]', 'StudentPass@2024');
  await rohitPage.click('button[type="submit"]');
  await rohitPage.waitForURL('**/dashboard', { timeout: 15000 });

  console.log('[TC-10] Rohit opens sold listing /listings/lst_calc_01 ...');
  await rohitPage.goto('https://campus-e-marketplace.vercel.app/listings/lst_calc_01', { waitUntil: 'load' });
  await rohitPage.waitForTimeout(3000);

  const soldBanner = await rohitPage.$eval('.bg-admin-50', el => el.innerText.trim()).catch(() => '');
  console.log('[TC-10] Observed Sold Banner on Listing:', soldBanner);

  const soldBtnText = await rohitPage.$eval('button[disabled]', el => el.innerText.trim()).catch(() => '');
  console.log('[TC-10] Checkout button state for Rohit:', soldBtnText);

  // Now Rohit tries navigating directly to /checkout/lst_calc_01
  console.log('[TC-10] Rohit attempts direct checkout URL navigation...');
  await rohitPage.goto('https://campus-e-marketplace.vercel.app/checkout/lst_calc_01', { waitUntil: 'load' });
  await rohitPage.waitForTimeout(3000);

  const blockHeading = await rohitPage.$eval('h2', el => el.innerText.trim()).catch(() => '');
  const blockDesc = await rohitPage.$eval('p.text-ink-600', el => el.innerText.trim()).catch(() => '');
  console.log('[TC-10] Observed Block Heading:', blockHeading);
  console.log('[TC-10] Observed Block Exact Message:', blockDesc);

  const tc10Path = path.resolve('docs/screenshots/manual/tc10.png');
  await rohitPage.screenshot({ path: tc10Path, fullPage: true });
  console.log('[TC-10] Screenshot saved to:', tc10Path);

  // -------------------------------------------------------------
  // TC-12: Invoice verification
  // -------------------------------------------------------------
  console.log('\n--- [TC-12] Invoice Verification ---');
  console.log('[TC-12] Priya opens /orders/' + orderId + '/invoice ...');
  await priyaPage.goto(`https://campus-e-marketplace.vercel.app/orders/${orderId}/invoice`, { waitUntil: 'load' });
  await priyaPage.waitForTimeout(3000);

  const invoiceText = await priyaPage.$eval('body', el => el.innerText);
  console.log('[TC-12] Checking Invoice Details:');
  console.log(' - Contains Casio fx-991EX?:', invoiceText.includes('Casio fx-991EX'));
  console.log(' - Contains Priya Patel?:', invoiceText.includes('Priya Patel'));
  console.log(' - Contains Aarav Sharma?:', invoiceText.includes('Aarav Sharma'));
  console.log(' - Contains 950?:', invoiceText.includes('950'));
  console.log(' - Contains Simulated UPI?:', invoiceText.includes('Simulated UPI') || invoiceText.includes('upi_sim'));

  const tc12Path = path.resolve('docs/screenshots/manual/tc12.png');
  await priyaPage.screenshot({ path: tc12Path, fullPage: true });
  console.log('[TC-12] Screenshot saved to:', tc12Path);

  // -------------------------------------------------------------
  // TC-13: Order Tracking & Progression
  // -------------------------------------------------------------
  console.log('\n--- [TC-13] Order Tracking Timeline & Status Steps ---');
  await priyaPage.goto(`https://campus-e-marketplace.vercel.app/orders/${orderId}`, { waitUntil: 'load' });
  await priyaPage.waitForTimeout(3000);

  console.log('[TC-13] Step 1: Update Meetup spot & time...');
  await priyaPage.click('button:has-text("Propose / Change Spot")');
  await priyaPage.waitForTimeout(1000);
  await priyaPage.fill('input[placeholder*="e.g. Today"]', 'Today at 5:00 PM at Central Library');
  await priyaPage.click('button:has-text("Save Meetup Plan")');
  await priyaPage.waitForTimeout(3000);

  const statusAfterMeetup = await priyaPage.$eval('.font-mono.uppercase', el => el.innerText.trim()).catch(() => '');
  console.log('[TC-13] Order status after meetup schedule:', statusAfterMeetup);

  console.log('[TC-13] Step 2: Confirm physical handover complete...');
  const handoverBtn = await priyaPage.$('button:has-text("Confirm Physical Handover Complete")');
  if (handoverBtn) {
    await handoverBtn.click();
    await priyaPage.waitForTimeout(3000);
  }

  const finalStatus = await priyaPage.$eval('.font-mono.uppercase', el => el.innerText.trim()).catch(() => '');
  console.log('[TC-13] Order status after handover:', finalStatus);

  // Read tracking history entries
  const timelineEntries = await priyaPage.$$eval('.divide-y-2 > div', els => els.map(e => e.innerText.replace(/\n+/g, ' - ').trim()));
  console.log('[TC-13] Tracking History Timeline Entries:', timelineEntries);

  const tc13Path = path.resolve('docs/screenshots/manual/tc13.png');
  await priyaPage.screenshot({ path: tc13Path, fullPage: true });
  console.log('[TC-13] Screenshot saved to:', tc13Path);

  // -------------------------------------------------------------
  // TC-14: Return Request & Resolution
  // -------------------------------------------------------------
  console.log('\n--- [TC-14] Return Request Submission ---');
  console.log('[TC-14] Buyer Priya clicking Report Issue / Request Return...');
  await priyaPage.click('button:has-text("Report Issue / Request Return")');
  await priyaPage.waitForTimeout(1500);

  console.log('[TC-14] Entering return details...');
  await priyaPage.fill('textarea[placeholder*="Explain why"]', 'Calculated matrices produce unexpected syntax error on shift key. Screen has minor scratch.');
  await priyaPage.click('button:has-text("Submit Return Request")');
  await priyaPage.waitForTimeout(3000);

  const tc14Path = path.resolve('docs/screenshots/manual/tc14.png');
  await priyaPage.screenshot({ path: tc14Path, fullPage: true });
  console.log('[TC-14] Screenshot saved to:', tc14Path);

  await browser.close();
  console.log('=== TC-11, TC-10, TC-12, TC-13, TC-14 COMPLETE ===');
})();
