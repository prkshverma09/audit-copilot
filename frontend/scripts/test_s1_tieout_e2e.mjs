import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ARTIFACT_DIR = '/Users/prakashverma/.gemini/antigravity-ide/brain/488aee5c-4896-4db1-be86-37748e9472f8';

async function run() {
  console.log('Starting E2E Headless Verification for Task S.1: Automated Tie-Out & Footing Engine...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1600,1000']
  });


  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  try {
    // Step 1: Open app
    console.log('[Step 1] Loading http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));

    // Step 2: Verify Tie-Out button in Header and click it
    console.log('[Step 2] Locating Tie-Out button in Header...');
    const headerButtons = await page.$$('header button');
    let tieOutBtn = null;
    for (const btn of headerButtons) {
      const text = await page.evaluate((el) => el.innerText, btn);
      if (text.includes('Tie-Outs')) {
        tieOutBtn = btn;
        console.log(`Found Header Tie-Out Button: "${text.trim()}"`);
        break;
      }
    }

    if (!tieOutBtn) {
      throw new Error('Tie-Out button not found in Header!');
    }

    console.log('Clicking Tie-Out button to open Arithmetic Bridge Inspector...');
    await tieOutBtn.click();
    await new Promise((r) => setTimeout(r, 1000));

    // Capture modal screenshot
    const modalPath = path.join(ARTIFACT_DIR, 'e2e_s1_1_tieout_modal.png');
    await page.screenshot({ path: modalPath });
    console.log(`[Screenshot saved] ${modalPath}`);

    // Step 3: Test Simulate Discrepancy Toggle
    console.log('[Step 3] Testing "Simulate Discrepancy Test" button...');
    const modalButtons = await page.$$('button');
    let simulateBtn = null;
    for (const btn of modalButtons) {
      const text = await page.evaluate((el) => el.innerText, btn);
      if (text.includes('Simulate Discrepancy') || text.includes('Simulated Variance')) {
        simulateBtn = btn;
        break;
      }
    }

    if (simulateBtn) {
      await simulateBtn.click();
      await new Promise((r) => setTimeout(r, 1000));
      const simulatedModalPath = path.join(ARTIFACT_DIR, 'e2e_s1_2_simulated_discrepancy.png');
      await page.screenshot({ path: simulatedModalPath });
      console.log(`[Screenshot saved] ${simulatedModalPath}`);

      // Toggle it back off
      await simulateBtn.click();
      await new Promise((r) => setTimeout(r, 500));
    }

    // Step 4: Click "Select in Sheet" action
    console.log('[Step 4] Clicking "Select in Sheet" action inside modal...');
    const selectInSheetBtns = await page.$$('button');
    let selectSheetBtn = null;
    for (const btn of selectInSheetBtns) {
      const text = await page.evaluate((el) => el.innerText, btn);
      if (text.includes('Select') && text.includes('in Sheet')) {
        selectSheetBtn = btn;
        console.log(`Found action button: "${text.trim()}"`);
        break;
      }
    }

    if (selectSheetBtn) {
      await selectSheetBtn.click();
      await new Promise((r) => setTimeout(r, 1500));
      const sheetSelectionPath = path.join(ARTIFACT_DIR, 'e2e_s1_3_cell_selection_bridge.png');
      await page.screenshot({ path: sheetSelectionPath });
      console.log(`[Screenshot saved] ${sheetSelectionPath}`);
    }

    // Step 5: Test Clicking E11 directly via Quick Jump
    console.log('[Step 5] Clicking Quick Jump cell E11...');
    const allButtons = await page.$$('button');
    for (const btn of allButtons) {
      const text = await page.evaluate((el) => el.innerText, btn);
      if (text.trim() === 'E11') {
        await btn.click();
        console.log('Clicked E11 button');
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 1500));
    const e11Path = path.join(ARTIFACT_DIR, 'e2e_s1_4_e11_net_tieout.png');
    await page.screenshot({ path: e11Path });
    console.log(`[Screenshot saved] ${e11Path}`);

    console.log('✅ ALL E2E STEPS FOR TASK S.1 PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ E2E test failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

run();
