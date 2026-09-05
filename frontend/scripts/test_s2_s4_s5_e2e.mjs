/**
 * E2E Verification Script for Stretch Goals S.2, S.4, S.5
 * 
 * S.2: Exception & Unmatched Badges (C14 amber badge, review_required status)
 * S.4: Lineage Coverage & Audit Confidence Header Meter (live stats display)
 * S.5: Multi-Document Tabbed Split Viewer & Citation Switcher (C6 dual evidence)
 */

import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'fs';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:8000';

let browser;
let page;
const results = [];
let passed = 0;
let failed = 0;
const sleep = ms => new Promise(r => setTimeout(r, ms));

function assert(name, condition, detail = '') {
  const status = condition ? 'PASS' : 'FAIL';
  if (condition) passed++;
  else failed++;
  results.push({ name, status, detail });
  console.log(`  [${status}] ${name}${detail ? ': ' + detail : ''}`);
}

async function screenshot(name) {
  const path = `/Users/prakashverma/.gemini/antigravity-ide/brain/488aee5c-4896-4db1-be86-37748e9472f8/${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`  📸 ${name}.png`);
  return path;
}

async function run() {
  console.log('🚀 Starting S.2, S.4, S.5 E2E Verification\n');

  browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 },
  });

  page = await browser.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('  🔴 Console Error:', msg.text());
  });

  // ============================================================
  // PRE-CHECK: Backend API
  // ============================================================
  console.log('\n📡 PRE-CHECK: Backend API\n');
  
  try {
    const tieoutRes = await fetch(`${BACKEND_URL}/api/v1/tieout/summary`);
    const tieoutData = await tieoutRes.json();
    assert('Backend /tieout/summary OK', tieoutRes.ok, `Status ${tieoutRes.status}`);
    assert('4 tie-out bridges present', tieoutData.total_bridges === 4, `Got ${tieoutData.total_bridges}`);
    assert('S.2: C14 decoration exists', 'C14' in tieoutData.cell_decorations, `Keys: ${Object.keys(tieoutData.cell_decorations).join(', ')}`);
    assert('S.2: C14 status = review_required', tieoutData.cell_decorations.C14?.status === 'review_required', `Got: ${tieoutData.cell_decorations.C14?.status}`);
    assert('S.2: C6 status = footed_and_tied', tieoutData.cell_decorations.C6?.status === 'footed_and_tied', `Got: ${tieoutData.cell_decorations.C6?.status}`);
    assert('3 bridges passed, 1 flagged', tieoutData.passed_bridges === 3 && tieoutData.flagged_bridges === 1, `Passed: ${tieoutData.passed_bridges}, Flagged: ${tieoutData.flagged_bridges}`);
    
    const lineageRes = await fetch(`${BACKEND_URL}/api/v1/lineage/default`);
    const lineageData = await lineageRes.json();
    assert('Backend /lineage/default OK', lineageRes.ok, `Status ${lineageRes.status}`);
    const cellCount = Object.keys(lineageData.cells || {}).length;
    assert('S.4: Lineage has cells for coverage stats', cellCount > 0, `${cellCount} cells`);
    const reviewCount = Object.values(lineageData.cells || {}).filter(c => c.status === 'review_required').length;
    assert('S.2: review_required cell(s) in lineage', reviewCount >= 1, `${reviewCount} review_required cells`);
  } catch (err) {
    assert('Backend API accessible', false, err.message);
  }

  // ============================================================
  // STEP 1: Load app
  // ============================================================
  console.log('\n🌐 STEP 1: Page load\n');
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 4000));
  const title = await page.title();
  assert('Page loads', title.length > 0, title);

  // ============================================================
  // STEP 2: S.4 - Coverage Meter in Header
  // ============================================================
  console.log('\n📊 STEP 2: S.4 — Coverage Header Meter\n');
  await sleep(1500);
  const headerText = await page.$eval('header', el => el.textContent).catch(() => '');
  assert('S.4: "Lineage Coverage" in header', headerText.includes('Lineage Coverage'), headerText.substring(0, 200));
  assert('S.4: Percentage in header', headerText.includes('%'), 'Has %');
  assert('S.4: "Traced" count in header', headerText.includes('Traced'), 'Has Traced');
  assert('S.4: "Review" indicator in header', headerText.includes('Review'), 'Has Review');
  assert('S.4: "Tie-Outs" button in header', headerText.includes('Tie-Outs') || headerText.includes('Tied'), 'Has Tie-Out button');
  await screenshot('e2e_s2_s4_header_state');

  // ============================================================
  // STEP 3: S.2 — C14 Exception Badge
  // ============================================================
  console.log('\n🚨 STEP 3: S.2 — C14 Exception Badge\n');
  
  // Click C14 quick-jump
  let clickedC14 = false;
  const allBtns = await page.$$('button');
  for (const btn of allBtns) {
    const txt = await btn.evaluate(el => el.textContent.trim()).catch(() => '');
    if (txt === 'C14') {
      await btn.click();
      await sleep(1500);
      clickedC14 = true;
      break;
    }
  }
  assert('S.2: C14 quick-jump button exists', clickedC14, clickedC14 ? 'Clicked' : 'Not found');
  
  const pageAfterC14 = await page.content();
  assert('S.2: Review Required text shown for C14', 
    pageAfterC14.includes('Review Required') || pageAfterC14.includes('Pending Confirmation'), 
    'Review status visible');
  assert('S.2: Audit discrepancy note shown', 
    pageAfterC14.includes('SUSPENSE') || pageAfterC14.includes('Suspense') || pageAfterC14.includes('Unallocated') || pageAfterC14.includes('unsubstantiated'),
    'Discrepancy note visible');
  assert('S.2: Audit Review Flag visible',
    pageAfterC14.includes('Audit Review Flag') || pageAfterC14.includes('Discrepancy Reason') || pageAfterC14.includes('discrepancy'),
    'Flag section visible');
  await screenshot('e2e_s2_c14_exception_badge');

  // ============================================================
  // STEP 4: S.5 — Multi-Doc Citation Switcher (C6)
  // ============================================================
  console.log('\n📄 STEP 4: S.5 — Multi-Doc Citation Switcher (C6)\n');
  
  let clickedC6 = false;
  const allBtns2 = await page.$$('button');
  for (const btn of allBtns2) {
    const txt = await btn.evaluate(el => el.textContent.trim()).catch(() => '');
    if (txt === 'C6') {
      await btn.click();
      await sleep(1500);
      clickedC6 = true;
      break;
    }
  }
  assert('S.5: C6 quick-jump button exists', clickedC6, clickedC6 ? 'Clicked' : 'Not found');
  
  const pageAfterC6 = await page.content();
  assert('S.5: Formula equation shown (Sum:)', 
    pageAfterC6.includes('Sum:') || pageAfterC6.includes('formula_display'),
    'Formula equation visible');
  assert('S.5: "Source Citations" count shown', 
    pageAfterC6.includes('Source Citations') || pageAfterC6.includes('2 Source'),
    'Multiple citations indicator');
  assert('S.5: Both C4 and D5 inputs shown', 
    pageAfterC6.includes('C4') && pageAfterC6.includes('D5'),
    'Dual input cells referenced');
  
  const viewPDFCount = await page.$$eval('button', btns => 
    btns.filter(b => b.textContent.includes('View in PDF')).length
  ).catch(() => 0);
  assert('S.5: "View in PDF" citation switcher buttons present', viewPDFCount >= 1, `Found ${viewPDFCount}`);
  
  await screenshot('e2e_s5_c6_dual_citation');
  
  // Click "View in PDF" to test switching
  if (viewPDFCount >= 1) {
    const allBtns3 = await page.$$('button');
    for (const btn of allBtns3) {
      const txt = await btn.evaluate(el => el.textContent.trim()).catch(() => '');
      if (txt.includes('View in PDF')) {
        await btn.click();
        await sleep(800);
        break;
      }
    }
    const pageAfterSwitch = await page.content();
    assert('S.5: After switching, "Viewing in PDF below" label appears', 
      pageAfterSwitch.includes('Viewing in PDF'),
      'Active citation label visible');
    await screenshot('e2e_s5_citation_switched');
  }

  // ============================================================
  // SUMMARY
  // ============================================================
  await browser.close();
  
  console.log('\n' + '═'.repeat(60));
  console.log(`📊 RESULTS: ${passed} PASSED / ${failed} FAILED / ${passed + failed} TOTAL`);
  console.log('═'.repeat(60));
  
  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  • ${r.name}: ${r.detail}`);
    });
  }

  console.log(failed === 0 ? '\n✅ ALL TESTS PASSING\n' : `\n❌ ${failed} FAILURES FOUND\n`);
  writeFileSync('/tmp/s2_s4_s5_results.json', JSON.stringify({ passed, failed, results }, null, 2));
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Fatal:', err);
  if (browser) browser.close();
  process.exit(1);
});
