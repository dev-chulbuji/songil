import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { execSync } from 'child_process';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

await page.goto('http://localhost:9321/');
await page.waitForLoadState('networkidle');

// Step 1: 기본 정보
await page.fill('input[name="name"]', '홍길동');
await page.locator('input[type="radio"][name="gender"][value="여"]').check();
await page.fill('#bdY', '1985');
await page.fill('#bdM', '03');
await page.fill('#bdD', '15');
await page.fill('input[name="phone"]', '010-1234-5678');

// Click 다음
await page.locator('.btn-next').click();

// Step 2: 주증상 - pick first radio for sx1
await page.locator('input[type="radio"][name="sx1"]').first().check();
await page.locator('.btn-next').click();

// Step 3: 수면
await page.locator('input[type="radio"][name="slG"]').first().check();
await page.locator('.btn-next').click();

// Step 4: 식사
await page.locator('input[type="radio"][name="meals"]').first().check();
await page.locator('.btn-next').click();

// Step 5: 대변/소변
await page.locator('input[type="radio"][name="bwFreq"]').first().check();
await page.locator('input[type="radio"][name="bs"]').first().check();
await page.locator('.btn-next').click();

// Step 6: 소변
await page.locator('input[type="radio"][name="urD"]').first().check();
await page.locator('input[type="radio"][name="urN"]').first().check();
await page.locator('.btn-next').click();

// Step 7: 체온
await page.locator('input[type="radio"][name="tp"]').first().check();
await page.locator('.btn-next').click();

// Step 8: 땀/수분
await page.locator('input[type="radio"][name="swAmt"]').first().check();
await page.locator('input[type="radio"][name="water"]').first().check();
await page.locator('input[type="radio"][name="wtT"]').first().check();
await page.locator('.btn-next').click();

// Step 9: 기타 (optional)
await page.locator('.btn-next').click();

// Step 10: 스트레스
await page.locator('input[type="radio"][name="st"]').first().check();
await page.locator('.btn-next').click();

// Step 11: 여성 문항 (mc, md, mp, mr, mf, mb) - required
const step11Radios = ['mc','md','mp','mr','mf','mb'];
for (const n of step11Radios) {
  const r = page.locator(`input[type="radio"][name="${n}"]`).first();
  if (await r.count() > 0) await r.check();
}
await page.locator('.btn-next').click();

// Step 12: 음주/흡연
await page.locator('input[type="radio"][name="alcF"]').first().check();
await page.locator('input[type="radio"][name="smk"]').first().check();
await page.locator('.btn-next').click();

// Step 13: 기타 메모 (optional)
await page.locator('.btn-next').click();

// Wait for result card
await page.waitForSelector('#resultCard', { timeout: 5000 });
await page.waitForTimeout(2000); // wait for PDF pre-generation

// Take screenshot of result card
await page.screenshot({ path: '/tmp/result_card.png', fullPage: true });
console.log('Result card screenshot saved');

// Now generate PDF by calling buildPDF directly
const pdfBase64 = await page.evaluate(async () => {
  await window.loadLibs();
  const pdf = await window.buildPDF();
  return pdf.output('datauristring');
});

const base64Data = pdfBase64.replace('data:application/pdf;filename=generated.pdf;base64,', '')
                            .replace('data:application/pdf;base64,', '');
writeFileSync('/tmp/result.pdf', Buffer.from(base64Data, 'base64'));
console.log('PDF saved to /tmp/result.pdf');

await browser.close();
