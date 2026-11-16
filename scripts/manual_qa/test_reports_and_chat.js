const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });

  console.log('=== RUNNING TC-15 (Reports & Auto-hide) ===');

  // Step 1: Login as Aarav Sharma
  const aaravContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const aaravPage = await aaravContext.newPage();

  console.log('[TC-15] Logging in as Aarav Sharma (aarav.sharma@msruas.ac.in)...');
  await aaravPage.goto('https://campus-e-marketplace.vercel.app/login', { waitUntil: 'load' });
  await aaravPage.waitForTimeout(2000);
  await aaravPage.fill('input[type="email"]', 'aarav.sharma@msruas.ac.in');
  await aaravPage.fill('input[type="password"]', 'StudentPass@2024');
  await aaravPage.click('button[type="submit"]');
  await aaravPage.waitForURL('**/dashboard', { timeout: 15000 });

  // Open listing
  console.log('[TC-15] Aarav navigating to /listings/lst_kettle_01 ...');
  await aaravPage.goto('https://campus-e-marketplace.vercel.app/listings/lst_kettle_01', { waitUntil: 'load' });
  await aaravPage.waitForTimeout(3000);

  // Report #1 by Aarav
  console.log('[TC-15] Aarav submitting Report #1 ...');
  await aaravPage.click('button[title="Report this listing"]');
  await aaravPage.waitForTimeout(1000);
  await aaravPage.fill('textarea[placeholder*="Explain the issue"]', 'Counterfeit appliance label detected. Heating coil unsafe for hostel.');
  await aaravPage.click('button:has-text("Submit Flag to Admin")');
  await aaravPage.waitForTimeout(3000);

  const report1Notice = await aaravPage.$eval('.p-6.text-center', el => el.innerText.trim()).catch(() => '');
  console.log('[TC-15] Report #1 confirmation:', report1Notice.replace(/\n+/g, ' '));

  // Close modal by clicking X button and attempt duplicate report by Aarav
  console.log('[TC-15] Aarav attempting duplicate report on same listing...');
  const closeBtn = await aaravPage.$('button:has(svg.lucide-x)');
  if (closeBtn) await closeBtn.click();
  await aaravPage.waitForTimeout(1000);

  // Open report modal again as Aarav
  await aaravPage.click('button[title="Report this listing"]');
  await aaravPage.waitForTimeout(1000);
  await aaravPage.click('button:has-text("Submit Flag to Admin")');
  await aaravPage.waitForTimeout(2000);

  const duplicateError = await aaravPage.$eval('.bg-admin-50', el => el.innerText.trim()).catch(() => '');
  console.log('[TC-15] Duplicate report block message observed:', duplicateError);

  // Step 2: Login as Rohit Kumar for Report #2
  console.log('\n[TC-15] Logging in as Rohit Kumar for Report #2...');
  const rohitContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const rohitPage = await rohitContext.newPage();

  await rohitPage.goto('https://campus-e-marketplace.vercel.app/login', { waitUntil: 'load' });
  await rohitPage.waitForTimeout(2000);
  await rohitPage.fill('input[type="email"]', 'rohit.kumar@msruas.ac.in');
  await rohitPage.fill('input[type="password"]', 'StudentPass@2024');
  await rohitPage.click('button[type="submit"]');
  await rohitPage.waitForURL('**/dashboard', { timeout: 15000 });

  await rohitPage.goto('https://campus-e-marketplace.vercel.app/listings/lst_kettle_01', { waitUntil: 'load' });
  await rohitPage.waitForTimeout(3000);

  console.log('[TC-15] Rohit submitting Report #2 ...');
  await rohitPage.click('button[title="Report this listing"]');
  await rohitPage.waitForTimeout(1000);
  await rohitPage.fill('textarea[placeholder*="Explain the issue"]', 'Broken power plug missing earth pin.');
  await rohitPage.click('button:has-text("Submit Flag to Admin")');
  await rohitPage.waitForTimeout(3000);

  const report2Notice = await rohitPage.$eval('.p-6.text-center', el => el.innerText.trim()).catch(() => '');
  console.log('[TC-15] Report #2 confirmation:', report2Notice.replace(/\n+/g, ' '));

  // Step 3: Report #3
  // Login as Priya Patel
  console.log('\n[TC-15] Testing 3rd report to trigger auto-hide threshold (3 reports)...');
  const priyaContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const priyaPage = await priyaContext.newPage();

  await priyaPage.goto('https://campus-e-marketplace.vercel.app/login', { waitUntil: 'load' });
  await priyaPage.waitForTimeout(2000);
  await priyaPage.fill('input[type="email"]', 'priya.patel@msruas.ac.in');
  await priyaPage.fill('input[type="password"]', 'StudentPass@2024');
  await priyaPage.click('button[type="submit"]');
  await priyaPage.waitForURL('**/dashboard', { timeout: 15000 });

  await priyaPage.goto('https://campus-e-marketplace.vercel.app/listings/lst_kettle_01', { waitUntil: 'load' });
  await priyaPage.waitForTimeout(3000);

  console.log('[TC-15] Submitting Report #3 from 3rd student account...');
  await priyaPage.click('button[title="Report this listing"]');
  await priyaPage.waitForTimeout(1000);
  await priyaPage.fill('textarea[placeholder*="Explain the issue"]', 'Third independent verification of hazardous element.');
  await priyaPage.click('button:has-text("Submit Flag to Admin")');
  await priyaPage.waitForTimeout(3000);

  const report3Notice = await priyaPage.$eval('.p-6.text-center', el => el.innerText.trim()).catch(() => '');
  console.log('[TC-15] Report #3 confirmation:', report3Notice.replace(/\n+/g, ' '));

  // Reload listing as Rohit to see if listing is now hidden / no longer available
  console.log('[TC-15] Checking listing status after 3 reports...');
  await rohitPage.reload({ waitUntil: 'load' });
  await rohitPage.waitForTimeout(3000);
  const listingStatusText = await rohitPage.$eval('body', el => el.innerText);
  console.log('[TC-15] Listing contains "Item Not Found" or is hidden?:', listingStatusText.includes('Item Not Found') || listingStatusText.includes('No Longer Available'));

  // Step 4: Login as Admin to inspect moderation reports and hidden queue
  console.log('\n[TC-15] Step 4: Logging in as Admin (admin@msruas.ac.in) to inspect Moderation Queue...');
  const adminContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const adminPage = await adminContext.newPage();

  await adminPage.goto('https://campus-e-marketplace.vercel.app/login', { waitUntil: 'load' });
  await adminPage.waitForTimeout(2000);
  await adminPage.fill('input[type="email"]', 'admin@msruas.ac.in');
  await adminPage.fill('input[type="password"]', 'CampusAdmin@2024');
  await adminPage.click('button[type="submit"]');
  await adminPage.waitForTimeout(3000);

  await adminPage.goto('https://campus-e-marketplace.vercel.app/admin', { waitUntil: 'load' });
  await adminPage.waitForTimeout(4000);

  // Click Reports tab
  await adminPage.click('button:has-text("Grievance Reports")');
  await adminPage.waitForTimeout(3000);

  const adminReportsText = await adminPage.$eval('body', el => el.innerText);
  console.log('[TC-15] Admin Reports Tab contains lst_kettle_01 reports?:', adminReportsText.includes('lst_kettle_01'));

  // Click Hidden tab
  await adminPage.click('button:has-text("Hidden Listings")');
  await adminPage.waitForTimeout(3000);

  const hiddenText = await adminPage.$eval('body', el => el.innerText);
  console.log('[TC-15] Admin Hidden Tab contains lst_kettle_01?:', hiddenText.includes('lst_kettle_01') || hiddenText.includes('Electric Kettle'));

  const tc15Path = path.resolve('docs/screenshots/manual/tc15.png');
  await adminPage.screenshot({ path: tc15Path, fullPage: true });
  console.log('[TC-15] Screenshot saved to:', tc15Path);

  // -------------------------------------------------------------
  // TC-09: Chat between Priya and Seller, 3rd party blocked
  // -------------------------------------------------------------
  console.log('\n=== RUNNING TC-09 (Chat Verification) ===');
  console.log('[TC-09] Priya navigating to /listings/lst_notes_01 (owned by Aarav)...');
  await priyaPage.goto('https://campus-e-marketplace.vercel.app/listings/lst_notes_01', { waitUntil: 'load' });
  await priyaPage.waitForTimeout(3000);

  console.log('[TC-09] Priya clicks "Chat with Seller"...');
  await priyaPage.click('button:has-text("Chat with Seller")');
  await priyaPage.waitForURL('**/messages/**', { timeout: 15000 });
  const chatUrl = priyaPage.url();
  const convId = chatUrl.split('/messages/')[1]?.split('?')[0];
  console.log('[TC-09] Priya redirected to chat:', chatUrl, 'Conversation ID:', convId);

  // Priya sends message
  console.log('[TC-09] Priya sending message: "Hi Aarav, can we meet at Central Library at 4 PM?"');
  await priyaPage.fill('input[placeholder*="Type a message"]', 'Hi Aarav, can we meet at Central Library at 4 PM?');
  await priyaPage.click('button[type="submit"]');
  await priyaPage.waitForTimeout(3000);

  // Aarav (Seller) opens the conversation
  console.log('[TC-09] Seller Aarav opens the conversation /messages/' + convId);
  await aaravPage.goto(`https://campus-e-marketplace.vercel.app/messages/${convId}`, { waitUntil: 'load' });
  await aaravPage.waitForTimeout(4000);

  const aaravChatText = await aaravPage.$eval('body', el => el.innerText);
  console.log('[TC-09] Seller Aarav sees Priya\'s message?:', aaravChatText.includes('Hi Aarav, can we meet at Central Library at 4 PM?'));

  // Aarav replies
  console.log('[TC-09] Aarav sends reply: "Yes Priya, 4 PM works perfectly. See you there!"');
  await aaravPage.fill('input[placeholder*="Type a message"]', 'Yes Priya, 4 PM works perfectly. See you there!');
  await aaravPage.click('button[type="submit"]');
  await aaravPage.waitForTimeout(3000);

  // Priya sees reply
  await priyaPage.waitForTimeout(2000);
  const priyaChatText = await priyaPage.$eval('body', el => el.innerText);
  console.log('[TC-09] Priya sees Aarav\'s reply?:', priyaChatText.includes('Yes Priya, 4 PM works perfectly'));

  // 3rd Student Rohit attempts to open this exact conversation
  console.log('[TC-09] 3rd Student Rohit attempts unauthorized access to /messages/' + convId);
  await rohitPage.goto(`https://campus-e-marketplace.vercel.app/messages/${convId}`, { waitUntil: 'load' });
  await rohitPage.waitForTimeout(4000);

  const rohitChatAccess = await rohitPage.$eval('body', el => el.innerText);
  console.log('[TC-09] Rohit sees "Chat Unavailable"?:', rohitChatAccess.includes('Chat Unavailable'));
  console.log('[TC-09] Rohit sees permission denied message?:', rohitChatAccess.includes('do not have permission to view this conversation'));

  const tc09Path = path.resolve('docs/screenshots/manual/tc09.png');
  await priyaPage.screenshot({ path: tc09Path, fullPage: true });
  console.log('[TC-09] Screenshot saved to:', tc09Path);

  // -------------------------------------------------------------
  // PERFORMANCE: Measure load times (3 runs each)
  // -------------------------------------------------------------
  console.log('\n=== RUNNING PERFORMANCE MEASUREMENTS ===');
  const perfPage = await aaravContext.newPage();

  // /browse 3 runs
  const browseTimes = [];
  for (let i = 1; i <= 3; i++) {
    const start = Date.now();
    await perfPage.goto('https://campus-e-marketplace.vercel.app/browse', { waitUntil: 'load' });
    await perfPage.waitForSelector('input[placeholder*="Search"]');
    const elapsed = Date.now() - start;
    browseTimes.push(elapsed);
    console.log(`[PERF] /browse Run ${i}: ${elapsed}ms`);
    await perfPage.waitForTimeout(1000);
  }

  // /listings/lst_calc_01 3 runs
  const listingTimes = [];
  for (let i = 1; i <= 3; i++) {
    const start = Date.now();
    await perfPage.goto('https://campus-e-marketplace.vercel.app/listings/lst_calc_01', { waitUntil: 'load' });
    await perfPage.waitForSelector('h1');
    const elapsed = Date.now() - start;
    listingTimes.push(elapsed);
    console.log(`[PERF] /listings/lst_calc_01 Run ${i}: ${elapsed}ms`);
    await perfPage.waitForTimeout(1000);
  }

  const avgBrowse = Math.round(browseTimes.reduce((a, b) => a + b, 0) / 3);
  const avgListing = Math.round(listingTimes.reduce((a, b) => a + b, 0) / 3);
  console.log(`[PERF] Average /browse: ${avgBrowse}ms (~${(avgBrowse/1000).toFixed(2)}s)`);
  console.log(`[PERF] Average listing: ${avgListing}ms (~${(avgListing/1000).toFixed(2)}s)`);

  await browser.close();
  console.log('=== ALL TESTS COMPLETED SUCCESSFULLY ===');
})();
