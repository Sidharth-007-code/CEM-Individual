const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });

  console.log('=== RUNNING TC-09 (Chat) on Deployed App ===');

  // Context 1: Priya Patel
  const priyaContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const priyaPage = await priyaContext.newPage();

  console.log('[TC-09] Logging in as Priya Patel (priya.patel@msruas.ac.in)...');
  await priyaPage.goto('https://campus-e-marketplace.vercel.app/login', { waitUntil: 'load' });
  await priyaPage.waitForTimeout(2000);
  await priyaPage.fill('input[type="email"]', 'priya.patel@msruas.ac.in');
  await priyaPage.fill('input[type="password"]', 'StudentPass@2024');
  await priyaPage.click('button[type="submit"]');
  await priyaPage.waitForURL('**/dashboard', { timeout: 15000 });

  // Open lst_book_01 owned by Aarav
  console.log('[TC-09] Priya navigating to /listings/lst_book_01 ...');
  await priyaPage.goto('https://campus-e-marketplace.vercel.app/listings/lst_book_01', { waitUntil: 'load' });
  await priyaPage.waitForTimeout(3000);

  console.log('[TC-09] Priya clicks Chat with Seller...');
  await priyaPage.click('button:has-text("Chat with Seller")');
  await priyaPage.waitForURL('**/messages/**', { timeout: 15000 });
  const chatUrl = priyaPage.url();
  const convId = chatUrl.split('/messages/')[1]?.split('?')[0];
  console.log('[TC-09] Chat opened:', chatUrl, 'Conversation ID:', convId);

  // Priya sends a message
  console.log('[TC-09] Priya sending message: "Hello Aarav, is this textbook still available?"');
  await priyaPage.fill('input[placeholder*="Type your message"]', 'Hello Aarav, is this textbook still available?');
  await priyaPage.click('button[type="submit"]');
  await priyaPage.waitForTimeout(3000);

  // Context 2: Aarav Sharma (Seller)
  const aaravContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const aaravPage = await aaravContext.newPage();

  console.log('[TC-09] Logging in as Aarav Sharma (aarav.sharma@msruas.ac.in)...');
  await aaravPage.goto('https://campus-e-marketplace.vercel.app/login', { waitUntil: 'load' });
  await aaravPage.waitForTimeout(2000);
  await aaravPage.fill('input[type="email"]', 'aarav.sharma@msruas.ac.in');
  await aaravPage.fill('input[type="password"]', 'StudentPass@2024');
  await aaravPage.click('button[type="submit"]');
  await aaravPage.waitForURL('**/dashboard', { timeout: 15000 });

  console.log('[TC-09] Aarav navigating to conversation /messages/' + convId);
  await aaravPage.goto(`https://campus-e-marketplace.vercel.app/messages/${convId}`, { waitUntil: 'load' });
  await aaravPage.waitForTimeout(3000);

  const aaravBodyText = await aaravPage.$eval('body', el => el.innerText);
  const aaravSeesMessage = aaravBodyText.includes('Hello Aarav, is this textbook still available?');
  console.log('[TC-09] Aarav sees Priya message?:', aaravSeesMessage);

  // Aarav replies
  console.log('[TC-09] Aarav replying: "Yes Priya, mint condition. Can meet tomorrow."');
  await aaravPage.fill('input[placeholder*="Type your message"]', 'Yes Priya, mint condition. Can meet tomorrow.');
  await aaravPage.click('button[type="submit"]');
  await aaravPage.waitForTimeout(3000);

  // Check Priya sees reply
  await priyaPage.waitForTimeout(2000);
  const priyaBodyText = await priyaPage.$eval('body', el => el.innerText);
  const priyaSeesReply = priyaBodyText.includes('Yes Priya, mint condition');
  console.log('[TC-09] Priya sees Aarav reply?:', priyaSeesReply);

  // Context 3: Rohit Kumar (Unauthorized 3rd student)
  const rohitContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const rohitPage = await rohitContext.newPage();

  console.log('[TC-09] Logging in as Rohit Kumar (rohit.kumar@msruas.ac.in)...');
  await rohitPage.goto('https://campus-e-marketplace.vercel.app/login', { waitUntil: 'load' });
  await rohitPage.waitForTimeout(2000);
  await rohitPage.fill('input[type="email"]', 'rohit.kumar@msruas.ac.in');
  await rohitPage.fill('input[type="password"]', 'StudentPass@2024');
  await rohitPage.click('button[type="submit"]');
  await rohitPage.waitForURL('**/dashboard', { timeout: 15000 });

  console.log('[TC-09] Rohit attempts to open unauthorized conversation /messages/' + convId);
  await rohitPage.goto(`https://campus-e-marketplace.vercel.app/messages/${convId}`, { waitUntil: 'load' });
  await rohitPage.waitForTimeout(3000);

  const rohitBodyText = await rohitPage.$eval('body', el => el.innerText);
  console.log('[TC-09] Rohit sees Chat Unavailable?:', rohitBodyText.includes('Chat Unavailable'));
  console.log('[TC-09] Rohit sees permission denied explanation?:', rohitBodyText.includes('do not have permission to view this conversation'));

  const tc09Path = path.resolve('docs/screenshots/manual/tc09.png');
  await priyaPage.screenshot({ path: tc09Path, fullPage: true });
  console.log('[TC-09] Screenshot saved to:', tc09Path);

  // -------------------------------------------------------------
  // Performance measurements on deployed app
  // -------------------------------------------------------------
  console.log('\n=== PERFORMANCE MEASUREMENTS (Deployed App) ===');
  const browseTimes = [];
  for (let i = 1; i <= 3; i++) {
    const start = Date.now();
    await priyaPage.goto('https://campus-e-marketplace.vercel.app/browse', { waitUntil: 'load' });
    await priyaPage.waitForSelector('input[placeholder*="Search"]');
    const elapsed = Date.now() - start;
    browseTimes.push(elapsed);
    console.log(`[PERF] /browse Run ${i}: ${elapsed}ms`);
    await priyaPage.waitForTimeout(1000);
  }

  const listingTimes = [];
  for (let i = 1; i <= 3; i++) {
    const start = Date.now();
    await priyaPage.goto('https://campus-e-marketplace.vercel.app/listings/lst_calc_01', { waitUntil: 'load' });
    await priyaPage.waitForSelector('h1');
    const elapsed = Date.now() - start;
    listingTimes.push(elapsed);
    console.log(`[PERF] /listings/lst_calc_01 Run ${i}: ${elapsed}ms`);
    await priyaPage.waitForTimeout(1000);
  }

  const avgBrowse = Math.round(browseTimes.reduce((a, b) => a + b, 0) / 3);
  const avgListing = Math.round(listingTimes.reduce((a, b) => a + b, 0) / 3);
  console.log(`[PERF] Average /browse: ${avgBrowse}ms (~${(avgBrowse/1000).toFixed(2)}s)`);
  console.log(`[PERF] Average listing: ${avgListing}ms (~${(avgListing/1000).toFixed(2)}s)`);

  await browser.close();
  console.log('=== TC-09 and Performance Complete ===');
})();
