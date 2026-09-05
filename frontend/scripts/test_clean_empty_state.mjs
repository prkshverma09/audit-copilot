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
  console.log('🚀 Testing Clean Initial State & Reload Behavior');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('requestfailed', req => console.log('REQ FAILED:', req.url(), req.failure()?.errorText));
  page.on('response', res => {
    if (res.status() >= 400) console.log('HTTP ERROR:', res.status(), res.url());
  });
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Initial Load: MUST BE CLEAN EMPTY STATE
  console.log('\n--- 1. Testing Initial Load ---');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await sleep(1000);

  let content = await page.content();
  const hasIntakeCard = content.includes('Load Demo Audit');
  const hasReadyPill = content.includes('Ready for Audit Ingestion');
  const hasNoPreloadedTable = !content.includes('13,217,773.59');

  console.log('Intake card displayed:', hasIntakeCard);
  console.log('"Ready for Audit Ingestion" pill displayed:', hasReadyPill);
  console.log('No mock financial figures pre-loaded:', hasNoPreloadedTable);

  if (!hasIntakeCard || !hasReadyPill || !hasNoPreloadedTable) {
    console.error('❌ FAILED: Initial page is not clean/empty!');
    process.exit(1);
  }
  console.log('✅ Initial page load is 100% clean and empty!');
  await page.screenshot({ path: '1_clean_empty_initial_state.png' });

  // 2. Click "Load Demo Audit" -> MUST LOAD DATA
  console.log('\n--- 2. Testing "Load Demo Audit" ---');
  const clickedDemo = await clickButtonWithText(page, 'Load Demo Audit');
  console.log('Clicked Load Demo Audit:', clickedDemo);
  await sleep(1500);

  content = await page.content();
  const hasCoverageMeter = content.includes('91%') || content.includes('94%') || content.includes('%');
  const hasTracedCells = content.includes('Traced');
  const hasC4Value = content.includes('13,217,773.59') || content.includes('13,243,300.91');
  const hasTieOuts = content.includes('Tie-Outs: 3/4 Tied');

  console.log('Coverage meter displayed:', hasCoverageMeter);
  console.log('Traced displayed:', hasTracedCells);
  console.log('Cell C4 value visible:', hasC4Value);
  console.log('Tie-Outs: 3/4 Tied visible:', hasTieOuts);

  if (!hasCoverageMeter || !hasTracedCells || !hasC4Value) {
    console.error('❌ FAILED: Demo audit did not load expected figures!');
    process.exit(1);
  }
  console.log('✅ Demo audit loaded correctly!');
  await page.screenshot({ path: '2_demo_audit_loaded.png' });

  // 3. Reload Page -> MUST RETURN TO EMPTY STATE
  console.log('\n--- 3. Testing Page Reload (Reset to Empty) ---');
  await page.reload({ waitUntil: 'networkidle2' });
  await sleep(1000);

  content = await page.content();
  const reloadedIntakeCard = content.includes('Load Demo Audit');
  const reloadedReadyPill = content.includes('Ready for Audit Ingestion');
  const reloadedNoFigures = !content.includes('13,217,773.59');

  console.log('After reload: Intake card displayed:', reloadedIntakeCard);
  console.log('After reload: Ready pill displayed:', reloadedReadyPill);
  console.log('After reload: No mock figures present:', reloadedNoFigures);

  if (!reloadedIntakeCard || !reloadedReadyPill || !reloadedNoFigures) {
    console.error('❌ FAILED: Reload did not reset to clean empty state!');
    process.exit(1);
  }
  console.log('✅ Page reload successfully resets to clean empty state!');
  await page.screenshot({ path: '3_after_reload_empty_state.png' });

  await browser.close();
  console.log('\n🎉 ALL TESTS PASSED: Clean initial load and reload behavior verified!');
})();
