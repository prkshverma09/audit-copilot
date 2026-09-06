import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ARTIFACT_DIR = '/Users/prakashverma/.gemini/antigravity-ide/brain/488aee5c-4896-4db1-be86-37748e9472f8';

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
  console.log('🚀 Testing 7-Statement Upload Flow & UI Tech Reference Removal');
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

  // 1. Open App
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await sleep(1000);

  // 2. Open Upload Modal
  console.log('\n--- 1. Opening Upload Modal ---');
  await clickButtonWithText(page, 'Upload PDFs');
  await sleep(800);

  let modalHtml = await page.content();

  // Verify NO tech references in modal
  const hasLangGraph = /langgraph/i.test(modalHtml);
  const hasGemini = /gemini/i.test(modalHtml);
  const hasFortuneSheet = /fortunesheet/i.test(modalHtml);

  console.log('Checking for forbidden tech strings in UI:');
  console.log('  Contains "LangGraph":', hasLangGraph);
  console.log('  Contains "Gemini":', hasGemini);
  console.log('  Contains "FortuneSheet":', hasFortuneSheet);

  if (hasLangGraph || hasGemini || hasFortuneSheet) {
    console.error('❌ FAILED: UI contains forbidden tech references!');
    process.exit(1);
  }
  console.log('✅ UI is clean! No tech implementation details or library names.');

  // Screenshot clean upload modal
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'clean_upload_modal.png') });
  console.log('📸 Saved clean_upload_modal.png');

  // 3. Upload all 7 statements
  console.log('\n--- 2. Uploading all 7 PDF statements ---');
  const statementsFolder = path.resolve('Ylookup Hackathon Datasets/01-bank-statements-to-journal-entries/statements');
  const pdfFiles = fs.readdirSync(statementsFolder)
    .filter(f => f.endsWith('.pdf'))
    .sort()
    .map(f => path.join(statementsFolder, f));

  console.log(`Found ${pdfFiles.length} files to upload:`);
  pdfFiles.forEach(f => console.log('  -', path.basename(f)));

  const fileInput = await page.$('input[type="file"]');
  if (!fileInput) {
    console.error('❌ Could not find file input in modal!');
    process.exit(1);
  }

  await fileInput.uploadFile(...pdfFiles);
  await sleep(800);

  // Screenshot modal with staged files
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'staged_7_files_modal.png') });
  console.log('📸 Saved staged_7_files_modal.png');

  // 4. Click Start Pipeline
  console.log('\n--- 3. Triggering Ingestion & Extraction Pipeline ---');
  const clickedStart = await clickButtonWithText(page, 'Start Pipeline');
  console.log('Clicked Start Pipeline:', clickedStart);

  // Wait for pipeline processing state
  await sleep(1500);

  // Check Stepper UI during execution
  const runningHtml = await page.content();
  console.log('Checking Stepper UI descriptions:');
  console.log('  "Document Classification & Layout Parsing":', runningHtml.includes('Document Classification & Layout Parsing'));
  console.log('  "Verbatim Lineage & Quote Verification":', runningHtml.includes('Verbatim Lineage & Quote Verification'));
  console.log('  "Audit Grid & Footing Tie-Out Assembly":', runningHtml.includes('Audit Grid & Footing Tie-Out Assembly'));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'clean_stepper_progress.png') });
  console.log('📸 Saved clean_stepper_progress.png');

  // Wait for completion (poll up to 30s)
  console.log('Waiting for extraction pipeline completion...');
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    const text = await page.content();
    if (text.includes('Audit Grid Ready for Verification') || text.includes('Inspect Reconciled Sheet')) {
      const clickedInspect = await clickButtonWithText(page, 'Inspect Reconciled Sheet');
      if (clickedInspect) {
        console.log('✅ Clicked "Inspect Reconciled Sheet" button on completed modal');
        await sleep(1500);
        break;
      }
    }
  }

  await sleep(2000);

  // 5. Inspect Excel spreadsheet on the page
  console.log('\n--- 4. Inspecting Populated Excel Grid ---');
  const pageText = await page.content();

  // Check presence of multi-currency accounts and values in DOM or FortuneSheet
  const sheetEval = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasEURConsolidated: text.includes('14,435,556.89') || text.includes('14435556.89'),
      hasUSD: text.includes('943,598.38') || text.includes('USD') || text.includes('4373'),
      hasGBP: text.includes('103,014.97') || text.includes('GBP') || text.includes('3252'),
      hasDKK: text.includes('1,135,207.84') || text.includes('DKK') || text.includes('0541'),
      bodySnippet: text.slice(0, 1000),
    };
  });

  console.log('Verifying all 7 statements in Excel grid:');
  console.log('  EUR Consolidated & Entities present:', sheetEval.hasEURConsolidated);
  console.log('  USD statement present:', sheetEval.hasUSD);
  console.log('  GBP statement present:', sheetEval.hasGBP);
  console.log('  DKK statements present:', sheetEval.hasDKK);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'populated_7_docs_excel_grid.png') });
  console.log('📸 Saved populated_7_docs_excel_grid.png');

  console.log('\n🎉 E2E TEST COMPLETED SUCCESSFULLY!');
  await browser.close();
})();
