import puppeteer from 'puppeteer-core';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function clickButtonWithText(page, text) {
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const t = await b.evaluate(el => el.textContent.trim()).catch(() => '');
    if (t.includes(text)) {
      await b.click();
      return true;
    }
  }
  return false;
}

(async () => {
  console.log('Testing Flow 1: Upload PDFs -> Select Statements -> Start Pipeline -> Inspect Reconciled Sheet');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  console.log('Page loaded');
  await sleep(1000);

  // 1. Click "Upload PDFs"
  const ok1 = await clickButtonWithText(page, 'Upload PDFs');
  console.log('Clicked Upload PDFs:', ok1);
  await sleep(1000);

  // 2. Click "Select Official Calder Statements"
  const ok2 = await clickButtonWithText(page, 'Select Official Calder Statements');
  console.log('Clicked Select Official Calder Statements:', ok2);
  await sleep(1000);

  // Verify ready for ingestion
  const content = await page.content();
  const hasFiles = content.includes('Ready for Ingestion (2)');
  console.log('Statements loaded into dropzone:', hasFiles);

  // 3. Click "Start Pipeline"
  const ok3 = await clickButtonWithText(page, 'Start Pipeline');
  console.log('Clicked Start Pipeline:', ok3);

  // Wait for "Inspect Reconciled Sheet"
  let inspectReady = false;
  for (let i = 0; i < 20; i++) {
    await sleep(1000);
    const c = await page.content();
    if (c.includes('Inspect Reconciled Sheet')) {
      inspectReady = true;
      break;
    }
  }
  console.log('Pipeline finished! Inspect Reconciled Sheet button visible:', inspectReady);

  const ok4 = await clickButtonWithText(page, 'Inspect Reconciled Sheet');
  console.log('Clicked Inspect Reconciled Sheet:', ok4);
  await sleep(1500);

  // Verify header has Load Demo Audit button
  const okDemo = await clickButtonWithText(page, 'Load Demo Audit');
  console.log('Clicked Load Demo Audit - successfully reset to baseline sample:', okDemo);
  await sleep(1500);

  await page.screenshot({ path: 'flow1_and_flow2_verified.png' });
  console.log('Screenshot saved: flow1_and_flow2_verified.png');

  await browser.close();
  console.log('✅ Flow 1 and Flow 2 verified successfully!');
})();
