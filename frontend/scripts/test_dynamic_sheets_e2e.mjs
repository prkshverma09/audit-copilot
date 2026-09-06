import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ARTIFACT_DIR = '/Users/prakashverma/.gemini/antigravity-ide/brain/488aee5c-4896-4db1-be86-37748e9472f8';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function clickButtonWithText(page, targetText) {
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.innerText.trim(), btn);
    if (text.includes(targetText)) {
      await btn.click();
      return true;
    }
  }
  return false;
}

async function clickTabByName(page, tabName) {
  return await page.evaluate((name) => {
    const elements = Array.from(document.querySelectorAll('*'));
    const tab = elements.find(el => el.innerText && el.innerText.trim().startsWith(name) && el.children.length === 0);
    if (tab) {
      tab.click();
      return true;
    }
    return false;
  }, tabName);
}

(async () => {
  console.log('🚀 TESTING FULLY DYNAMIC STATEMENT PARSER & MULTI-SHEET WORKBOOK (DEMO + 7-DOC UPLOAD)');

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  page.on('console', msg => {
    const text = msg.text();
    if (!text.includes('React DevTools')) {
      console.log('   [PAGE LOG]:', text);
    }
  });
  page.on('pageerror', err => console.log('   [PAGE ERROR]:', err.message));
  await page.setViewport({ width: 1440, height: 900 });

  // ----------------------------------------------------
  // PART 1: DEMO AUDIT FLOW (2 STATEMENTS DYNAMIC EXTRACTION)
  // ----------------------------------------------------
  console.log('\n--- 1. Testing Demo Audit Flow ---');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await sleep(800);

  await clickButtonWithText(page, 'Load Demo Audit');
  await sleep(2000);

  // Switch to Staging Sheet
  console.log('Switching to Demo Staging Sheet tab...');
  await clickTabByName(page, 'Staging Sheet');
  await sleep(1200);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_demo_dynamic_staging_sheet.png') });
  console.log('📸 Saved e2e_demo_dynamic_staging_sheet.png');

  // Switch to DIU tab
  console.log('Switching to Demo DIU tab...');
  await clickTabByName(page, 'DIU');
  await sleep(1200);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_demo_dynamic_diu_sheet.png') });
  console.log('📸 Saved e2e_demo_dynamic_diu_sheet.png');

  // ----------------------------------------------------
  // PART 2: 7 PDF STATEMENT UPLOAD FLOW (100 TRANSACTIONS DYNAMIC EXTRACTION)
  // ----------------------------------------------------
  console.log('\n--- 2. Testing 7 PDF Statement Upload Flow ---');
  await clickButtonWithText(page, 'Upload PDFs');
  await sleep(1000);

  const statementsDir = '/Users/prakashverma/src/audit-copilot/Ylookup Hackathon Datasets/01-bank-statements-to-journal-entries/statements';
  const files = fs.readdirSync(statementsDir).filter(f => f.endsWith('.pdf'));
  const filePaths = files.map(f => path.join(statementsDir, f));

  const fileInput = await page.$('input[type="file"]');
  await fileInput.uploadFile(...filePaths);
  await sleep(1000);

  console.log('Starting pipeline with 7 PDFs...');
  await clickButtonWithText(page, 'Start Pipeline');

  // Wait for pipeline completion
  for (let s = 0; s < 45; s++) {
    await sleep(1000);
    const content = await page.content();
    if (content.includes('Audit Grid Ready for Verification') || content.includes('Inspect Reconciled Sheet')) {
      console.log(`Pipeline finished in second ${s + 1}, inspecting sheet...`);
      await clickButtonWithText(page, 'Inspect Reconciled Sheet');
      await sleep(2500);
      break;
    }
  }

  // 1. Primary Portfolio Reconciliation
  console.log('\n--- 3. Verifying Portfolio Multi-Sheet Output ---');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_upload_portfolio_primary.png') });
  console.log('📸 Saved e2e_upload_portfolio_primary.png');

  // 2. Dynamic 7-Doc Staging Sheet
  console.log('Switching to 7-Document Staging Sheet...');
  await clickTabByName(page, 'Staging Sheet');
  await sleep(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_upload_dynamic_staging_100_txs.png') });
  console.log('📸 Saved e2e_upload_dynamic_staging_100_txs.png');

  // 3. Dynamic 7-Doc DIU Journal Entries
  console.log('Switching to 7-Document DIU Journal Entries...');
  await clickTabByName(page, 'DIU');
  await sleep(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_upload_dynamic_diu_200_legs.png') });
  console.log('📸 Saved e2e_upload_dynamic_diu_200_legs.png');

  console.log('\n✅ DYNAMIC STATEMENT EXTRACTION TEST COMPLETED!');
  await browser.close();
})();
