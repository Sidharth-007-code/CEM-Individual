const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Connecting to https://campus-e-marketplace.vercel.app/ with waitUntil: load ...');
  try {
    const res = await page.goto('https://campus-e-marketplace.vercel.app/', { waitUntil: 'load', timeout: 15000 });
    console.log('Landing page HTTP status:', res.status());
    console.log('Title:', await page.title());
    
    await page.goto('https://campus-e-marketplace.vercel.app/browse', { waitUntil: 'load', timeout: 15000 });
    // Wait 3 seconds for client firestore fetch
    await page.waitForTimeout(3000);
    console.log('Browse page title:', await page.title());
    
    // Check if listings are visible
    const listingTitles = await page.$$eval('h3', els => els.map(e => e.textContent.trim()));
    console.log('Headings/Listings on /browse:', listingTitles);
  } catch (err) {
    console.error('Error connecting to deployed app:', err);
  } finally {
    await browser.close();
  }
})();
