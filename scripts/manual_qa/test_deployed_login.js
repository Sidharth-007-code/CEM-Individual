const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to deployed /login...');
    await page.goto('https://campus-e-marketplace.vercel.app/login', { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    
    // Fill credentials
    await page.fill('input[type="email"]', 'aarav.sharma@msruas.ac.in');
    await page.fill('input[type="password"]', 'StudentPass@2024');
    
    // Click submit
    await page.click('button[type="submit"]');
    
    // Wait for response or navigation or error
    await page.waitForTimeout(5000);
    console.log('Current URL after submit:', page.url());
    
    const errorMsg = await page.$eval('.bg-brutal-pink', el => el.textContent.trim()).catch(() => null);
    if (errorMsg) {
      console.log('Observed Error Message on screen:', errorMsg);
    }
  } catch (err) {
    console.error('Error during test:', err.message);
  } finally {
    await browser.close();
  }
})();
