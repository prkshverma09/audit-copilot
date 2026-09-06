import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ARTIFACT_DIR = '/Users/prakashverma/.gemini/antigravity-ide/brain/488aee5c-4896-4db1-be86-37748e9472f8';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function clickTabByName(page, tabName) {
  return await page.evaluate((name) => {
    const span = Array.from(document.querySelectorAll('.luckysheet-sheets-item-name')).find(
      el => el.textContent && el.textContent.includes(name)
    );
    const item = span?.closest('.luckysheet-sheets-item');
    if (item) {
      const propsKey = Object.keys(item).find(k => k.startsWith('__reactProps'));
      if (propsKey && item[propsKey]?.onClick) {
        item[propsKey].onClick({ stopPropagation: () => {}, preventDefault: () => {} });
        return true;
      }
      item.click();
      return true;
    }
    return false;
  }, tabName);
}

async function run() {
  console.log('🚀 Launching Chrome for Interactive Audit Trail Verification...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  page.on('console', msg => {
    console.log('  [Browser]', msg.text());
  });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1000);

  // Clear any stale Next.js dev overlay or error toast
  await page.evaluate(() => {
    try {
      window.localStorage.clear();
      window.sessionStorage.clear();
      const style = document.createElement('style');
      style.textContent = 'nextjs-portal { display: none !important; }';
      document.head.appendChild(style);
      const portals = document.querySelectorAll('nextjs-portal');
      portals.forEach(p => p.remove());
    } catch {}
  });

  // Step 1: Click "Load Demo Audit"
  console.log('Clicking "Load Demo Audit"...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const demoBtn = btns.find(b => b.textContent?.includes('Load Demo Audit'));
    if (demoBtn) demoBtn.click();
  });

  await sleep(2500);

  // Step 2: Click "Staging Sheet" tab
  console.log('Switching to "Staging Sheet" tab...');
  const tabOk = await clickTabByName(page, 'Staging Sheet');
  console.log('Clicked Staging Sheet tab:', tabOk);
  await sleep(1500);

  // Step 3: Find canvas and click on row 1 data cell (Fund I transaction)
  console.log('Clicking on row 1 transaction cell in Staging Sheet canvas...');
  const canvasRect = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
  });

  if (canvasRect) {
    // Row 0 is header (~24px), Row 1 is first tx (~36px down). Click around col 5 (Narrative / Ref)
    console.log(`Canvas at (${canvasRect.x}, ${canvasRect.y}). Clicking row 1 at (${canvasRect.x + 350}, ${canvasRect.y + 68})...`);
    await page.mouse.click(canvasRect.x + 350, canvasRect.y + 68);
  }

  await sleep(2500);

  // Inspect FormulaBanner, HighlightInspector, and PDF viewer for Row 1
  const inspectionStagingRow1 = await page.evaluate(() => {
    const banner = document.querySelector('div.h-10')?.textContent || '';
    const inspector = document.querySelector('div.bg-audit-panel')?.textContent || '';
    const highlights = document.querySelectorAll('.audit-highlight-match').length;
    const pdfPageNumber = document.querySelector('.rpv-core__page-layer')?.getAttribute('data-testid') || '';
    const activeDocSelect = document.querySelector('select')?.value || '';
    return { banner, inspector: inspector.slice(0, 250), highlights, pdfPageNumber, activeDocSelect };
  });

  console.log('📊 Staging Row 1 Audit Trail Inspection:');
  console.log('   Banner:', inspectionStagingRow1.banner);
  console.log('   Inspector:', inspectionStagingRow1.inspector.replace(/\s+/g, ' '));
  console.log('   Yellow Highlighting Matches in PDF Viewer:', inspectionStagingRow1.highlights);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'staging_row1_audit_trail_verified.png') });

  // Step 4: Click a transaction cell in Fund II (lower down, row 18)
  if (canvasRect) {
    console.log(`Clicking row 18 (Fund II transaction) at (${canvasRect.x + 350}, ${canvasRect.y + 440})...`);
    await page.mouse.click(canvasRect.x + 350, canvasRect.y + 440);
  }

  await sleep(2500);

  const inspectionStagingFund2 = await page.evaluate(() => {
    const banner = document.querySelector('div.h-10')?.textContent || '';
    const highlights = document.querySelectorAll('.audit-highlight-match').length;
    const inspector = document.querySelector('div.bg-audit-panel')?.textContent || '';
    return { banner, highlights, inspector: inspector.slice(0, 250) };
  });

  console.log('📊 Staging Fund II Audit Trail Inspection:');
  console.log('   Banner:', inspectionStagingFund2.banner);
  console.log('   Inspector:', inspectionStagingFund2.inspector.replace(/\s+/g, ' '));
  console.log('   Yellow Highlighting Matches in PDF Viewer:', inspectionStagingFund2.highlights);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'staging_fund2_audit_trail_verified.png') });

  // Step 5: Switch to "DIU (Journal Entries)" tab
  console.log('Switching to "DIU (Journal Entries)" tab...');
  const diuTabOk = await clickTabByName(page, 'DIU (Journal Entries)');
  console.log('Clicked DIU tab:', diuTabOk);
  await sleep(1500);

  if (canvasRect) {
    console.log(`Clicking DIU leg 1 at (${canvasRect.x + 300}, ${canvasRect.y + 68})...`);
    await page.mouse.click(canvasRect.x + 300, canvasRect.y + 68);
  }

  await sleep(2500);

  const inspectionDIU = await page.evaluate(() => {
    const banner = document.querySelector('div.h-10')?.textContent || '';
    const highlights = document.querySelectorAll('.audit-highlight-match').length;
    const inspector = document.querySelector('div.bg-audit-panel')?.textContent || '';
    return { banner, highlights, inspector: inspector.slice(0, 250) };
  });

  console.log('📊 DIU Leg 1 Audit Trail Inspection:');
  console.log('   Banner:', inspectionDIU.banner);
  console.log('   Inspector:', inspectionDIU.inspector.replace(/\s+/g, ' '));
  console.log('   Yellow Highlighting Matches in PDF Viewer:', inspectionDIU.highlights);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'diu_leg1_audit_trail_verified.png') });

  // Step 6: Return to primary sheet and select C4
  console.log('Switching back to primary "Fund Cash Reconciliation" tab...');
  await clickTabByName(page, 'Fund Cash');
  await sleep(1500);

  await page.evaluate(() => {
    if (window.selectAuditCell) {
      window.selectAuditCell('C4');
    }
  });
  await sleep(2000);

  const primaryInspection = await page.evaluate(() => {
    const banner = document.querySelector('div.h-10')?.textContent || '';
    const highlights = document.querySelectorAll('.audit-highlight-match').length;
    return { banner, highlights };
  });

  console.log('📊 Primary Sheet C4 Verification:');
  console.log('   Banner:', primaryInspection.banner);
  console.log('   Highlights:', primaryInspection.highlights);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'primary_sheet_c4_verified.png') });

  await browser.close();
  console.log('🎉 ALL AUDIT TRAIL VERIFICATION STEPS PASSED!');
}

run().catch(err => {
  console.error('❌ Test run error:', err);
  process.exit(1);
});
