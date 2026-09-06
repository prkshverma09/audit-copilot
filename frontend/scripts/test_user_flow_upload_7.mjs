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

(async () => {
  console.log('🚀 Running User Flow: Load Demo Audit -> Upload 7 PDFs -> Verify Switch to Portfolio Sheet');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  page.on('console', msg => {
    const text = msg.text();
    if (!text.includes('React DevTools')) {
      console.log('PAGE LOG:', text);
    }
  });
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Open app
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await sleep(1000);

  // 2. Load Demo Audit first (simulating user's exact state)
  console.log('\n--- 1. Loading Demo Audit ---');
  await clickButtonWithText(page, 'Load Demo Audit');
  await sleep(1500);

  // 3. Open Upload Modal
  console.log('\n--- 2. Opening Upload Modal ---');
  await clickButtonWithText(page, 'Upload PDFs');
  await sleep(1000);

  // 4. Staging 7 PDF files
  const statementsDir = '/Users/prakashverma/src/audit-copilot/Ylookup Hackathon Datasets/01-bank-statements-to-journal-entries/statements';
  const files = fs.readdirSync(statementsDir).filter(f => f.endsWith('.pdf'));
  const filePaths = files.map(f => path.join(statementsDir, f));

  const fileInput = await page.$('input[type="file"]');
  await fileInput.uploadFile(...filePaths);
  await sleep(1000);

  // 5. Start Pipeline
  console.log('\n--- 3. Starting Pipeline with 7 PDFs ---');
  await clickButtonWithText(page, 'Start Pipeline');

  // Wait for completion
  console.log('Waiting for pipeline to complete...');
  for (let i = 0; i < 40; i++) {
    await sleep(1000);
    const content = await page.content();
    if (content.includes('Audit Grid Ready for Verification') || content.includes('Inspect Reconciled Sheet')) {
      console.log(`Pipeline finished at second ${i + 1}, clicking "Inspect Reconciled Sheet"...`);
      await clickButtonWithText(page, 'Inspect Reconciled Sheet');
      await sleep(2000);
      break;
    }
  }

  await sleep(2000);

  // 6. Verify Spreadsheet state
  console.log('\n--- 4. Checking if UI Updated from Demo to Portfolio Sheet ---');
  const checkResult = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasPortfolioReconciliation: text.includes('Portfolio Reconciliation'),
      hasUSD: text.includes('USD') || text.includes('4373') || text.includes('943,598.38'),
      hasGBP: text.includes('GBP') || text.includes('3252') || text.includes('103,014.97'),
      hasDKK: text.includes('DKK') || text.includes('0541') || text.includes('1,135,207.84'),
      hasEURConsolidated: text.includes('14,435,556.89') || text.includes('14435556.89'),
      activeCellText: document.querySelector('.audit-highlight')?.innerText || '',
    };
  });

  console.log('Verification Results:');
  console.log('  Portfolio Reconciliation Title/Tab:', checkResult.hasPortfolioReconciliation);
  console.log('  USD statement present:', checkResult.hasUSD);
  console.log('  GBP statement present:', checkResult.hasGBP);
  console.log('  DKK statements present:', checkResult.hasDKK);
  console.log('  EUR Consolidated Balance present:', checkResult.hasEURConsolidated);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'user_flow_7_docs_portfolio_verified.png') });
  console.log('📸 Saved user_flow_7_docs_portfolio_verified.png');

  await browser.close();
})();
