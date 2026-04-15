import { chromium } from 'playwright';
async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://www.letras.mus.br/?q=love', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  
  const targetPage = 3;
  const targetButton = page.locator('.gsc-cursor-page').getByText(String(targetPage), { exact: true }).first();
  console.log("Count:", await targetButton.count());
  await targetButton.click();
  
  await page.waitForFunction(() => {
      const current = document.querySelector('.gsc-cursor-page.gsc-cursor-current-page');
      return current && current.textContent?.trim() === '3' && document.querySelectorAll('.gsc-webResult.gsc-result').length > 0;
  });
  console.log("Success! Clicked page 3");
  await browser.close();
}
test().catch(e => console.error(e));
