const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://campus-e-marketplace.vercel.app/login', { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'aarav.sharma@msruas.ac.in');
    await page.fill('input[type="password"]', 'StudentPass@2024');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    console.log('Logged into dashboard!');
    await page.waitForTimeout(3000);
    
    // Check what text is on dashboard
    const bodyText = await page.innerText('body');
    console.log('Dashboard text snippet:\n', bodyText.substring(0, 500));
    
    // Let's also navigate to /browse as logged in user
    await page.goto('https://campus-e-marketplace.vercel.app/browse', { waitUntil: 'load' });
    await page.waitForTimeout(4000);
    const browseText = await page.innerText('body');
    console.log('Browse text snippet:\n', browseText.substring(0, 500));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
})();
