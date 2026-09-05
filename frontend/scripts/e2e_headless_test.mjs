import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SCREENSHOT_DIR = '/Users/prakashverma/.gemini/antigravity-ide/brain/488aee5c-4896-4db1-be86-37748e9472f8';

async function runE2E() {
  console.log('Starting headless browser E2E test using local Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1440,900'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    console.log('[Step 1] Navigating to http://localhost:3000 ...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2500)); // allow PDF.js canvas to render

    // 1. Initial State
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'e2e_1_initial_c4.png') });
    console.log('  ✓ Captured: e2e_1_initial_c4.png');

    // 2. Click Jump to C6
    console.log('[Step 2] Clicking Jump C6 (Consolidated Cash)...');
    const c6Btn = await page.waitForSelector('button ::-p-text(C6)', { timeout: 5000 });
    await c6Btn.click();
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'e2e_2_cell_c6_consolidated.png') });
    console.log('  ✓ Captured: e2e_2_cell_c6_consolidated.png');

    // 3. Click D5 citation pill in FormulaBanner
    console.log('[Step 3] Clicking D5 citation pill...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const d5Btn = btns.find((b) => b.textContent?.includes('View in PDF') || b.textContent?.includes('D5:'));
      if (d5Btn) d5Btn.click();
    });
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'e2e_3_citation_d5_switch_doc.png') });
    console.log('  ✓ Captured: e2e_3_citation_d5_switch_doc.png');

    // 4. Click Jump to E11 (Net Tie-Out Delta)
    console.log('[Step 4] Clicking Jump E11 (Intercompany Net Tie-Out)...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const e11 = btns.find((b) => b.textContent?.trim() === 'E11');
      if (e11) e11.click();
    });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'e2e_4_cell_e11_tieout.png') });
    console.log('  ✓ Captured: e2e_4_cell_e11_tieout.png');

    // 5. Click Jump to C14 (Suspense-Q1 Review Required)
    console.log('[Step 5] Clicking Jump C14 (Review Required Suspense)...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const c14 = btns.find((b) => b.textContent?.trim() === 'C14');
      if (c14) c14.click();
    });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'e2e_5_cell_c14_review_required.png') });
    console.log('  ✓ Captured: e2e_5_cell_c14_review_required.png');

    // 6. Click Upload PDFs modal
    console.log('[Step 6] Opening Upload PDFs modal...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const upload = btns.find((b) => b.textContent?.includes('Upload PDFs'));
      if (upload) upload.click();
    });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'e2e_6_upload_modal.png') });
    console.log('  ✓ Captured: e2e_6_upload_modal.png');

    // Close modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('button svg.lucide-x')?.parentElement;
      if (closeBtn) closeBtn.click();
    });
    await new Promise((r) => setTimeout(r, 500));

    // 7. Click Run Audit
    console.log('[Step 7] Clicking Run Audit button...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const run = btns.find((b) => b.textContent?.includes('Run Audit'));
      if (run) run.click();
    });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'e2e_7_run_audit_toast.png') });
    console.log('  ✓ Captured: e2e_7_run_audit_toast.png');

    console.log('All E2E headless tests completed successfully!');
  } finally {
    await browser.close();
  }
}

runE2E().catch((err) => {
  console.error('E2E test failed:', err);
  process.exit(1);
});
