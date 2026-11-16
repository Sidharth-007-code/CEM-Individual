const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });

  console.log('=== RUNNING TC-10, TC-12, TC-13, TC-14 on Local Emulator (http://localhost:3000) ===');

  // Rohit Kumar context
  const rohitContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const rohitPage = await rohitContext.newPage();

  console.log('[TC-10] Logging in as Rohit Kumar...');
  await rohitPage.goto('http://localhost:3000/login', { waitUntil: 'load' });
  await rohitPage.waitForTimeout(2000);
  await rohitPage.fill('input[type="email"]', 'rohit.kumar@msruas.ac.in');
  await rohitPage.fill('input[type="password"]', 'StudentPass@2024');
  await rohitPage.click('button[type="submit"]');
  await rohitPage.waitForURL('**/dashboard', { timeout: 15000 });

  // TC-10: Single sale test on lst_book_sold
  console.log('[TC-10] Rohit opens sold listing /listings/lst_book_sold ...');
  await rohitPage.goto('http://localhost:3000/listings/lst_book_sold', { waitUntil: 'load' });
  await rohitPage.waitForTimeout(2000);

  const banner = await rohitPage.$eval('.bg-admin-50', el => el.innerText.trim()).catch(() => '');
  console.log('[TC-10] Observed Sold Banner on Listing:', banner);

  const btnDisabled = await rohitPage.$eval('button[disabled]', el => el.innerText.trim()).catch(() => '');
  console.log('[TC-10] Checkout button state:', btnDisabled);

  console.log('[TC-10] Rohit attempts direct checkout URL navigation /checkout/lst_book_sold ...');
  await rohitPage.goto('http://localhost:3000/checkout/lst_book_sold', { waitUntil: 'load' });
  await rohitPage.waitForTimeout(2000);

  const blockHeading = await rohitPage.$eval('h2', el => el.innerText.trim()).catch(() => '');
  const blockDesc = await rohitPage.$eval('p.text-ink-600', el => el.innerText.trim()).catch(() => '');
  console.log('[TC-10] Observed Block Heading:', blockHeading);
  console.log('[TC-10] Observed Block Exact Message:', blockDesc);

  const tc10Path = path.resolve('docs/screenshots/manual/tc10.png');
  await rohitPage.screenshot({ path: tc10Path, fullPage: true });
  console.log('[TC-10] Screenshot saved to:', tc10Path);

  // TC-12: Invoice verification on ord_demo_101
  console.log('\n--- [TC-12] Invoice Verification on /orders/ord_demo_101/invoice ---');
  await rohitPage.goto('http://localhost:3000/orders/ord_demo_101/invoice', { waitUntil: 'load' });
  await rohitPage.waitForTimeout(2500);

  const invoiceBody = await rohitPage.$eval('body', el => el.innerText);
  console.log('[TC-12] Checking Invoice Contents:');
  console.log(' - Item Digital Logic & Computer Design?:', invoiceBody.includes('Digital Logic & Computer Design'));
  console.log(' - Buyer Rohit Kumar?:', invoiceBody.includes('Rohit Kumar'));
  console.log(' - Seller Priya Patel?:', invoiceBody.includes('Priya Patel'));
  console.log(' - Total 320?:', invoiceBody.includes('320'));
  console.log(' - Payment Method Simulated UPI?:', invoiceBody.includes('Simulated UPI'));

  const tc12Path = path.resolve('docs/screenshots/manual/tc12.png');
  await rohitPage.screenshot({ path: tc12Path, fullPage: true });
  console.log('[TC-12] Screenshot saved to:', tc12Path);

  // TC-13: Tracking Verification on /orders/ord_demo_101
  console.log('\n--- [TC-13] Order Tracking Timeline on /orders/ord_demo_101 ---');
  await rohitPage.goto('http://localhost:3000/orders/ord_demo_101', { waitUntil: 'load' });
  await rohitPage.waitForTimeout(2500);

  const orderStatus = await rohitPage.$eval('.font-mono.uppercase', el => el.innerText.trim()).catch(() => '');
  console.log('[TC-13] Order status on page:', orderStatus);

  const timelineEntries = await rohitPage.$$eval('.divide-y-2 > div', els => els.map(e => e.innerText.replace(/\n+/g, ' - ').trim()));
  console.log('[TC-13] Timeline entries:', timelineEntries);

  const tc13Path = path.resolve('docs/screenshots/manual/tc13.png');
  await rohitPage.screenshot({ path: tc13Path, fullPage: true });
  console.log('[TC-13] Screenshot saved to:', tc13Path);

  // TC-14: Return Request Submission
  console.log('\n--- [TC-14] Return Request Submission ---');
  console.log('[TC-14] Rohit clicking Report Issue / Request Return...');
  await rohitPage.click('button:has-text("Report Issue / Request Return")');
  await rohitPage.waitForTimeout(1500);

  console.log('[TC-14] Filling return reason...');
  await rohitPage.fill('textarea[placeholder*="Explain why"]', 'Book cover spine has severe tearing and three pages from Chapter 4 are missing.');
  await rohitPage.click('button:has-text("Submit Return Request")');
  await rohitPage.waitForTimeout(3000);

  const tc14Path = path.resolve('docs/screenshots/manual/tc14.png');
  await rohitPage.screenshot({ path: tc14Path, fullPage: true });
  console.log('[TC-14] Screenshot saved to:', tc14Path);

  await browser.close();
  console.log('=== Local Emulator Testing Finished Successfully ===');
})();
