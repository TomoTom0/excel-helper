import { chromium, expect } from '@playwright/test';
import { config } from 'dotenv';

config();

async function captureScreenshots() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ 
    viewport: { width: 1200, height: 800 },
    locale: 'ja-JP'
  });
  
  const port = process.env.VITE_PORT || 5173;
  const baseURL = `http://localhost:${port}`;
  
  console.log('📸 Capturing screenshots...');
  
  // 固定長変換のデモ
  await page.goto(`${baseURL}/#/fixed-length`);
  await page.waitForLoadState('networkidle');
  
  // カラム長を入力
  const columnLengthsInput = page.locator('textarea').first();
  await columnLengthsInput.fill('5,5,10');
  
  // データ本体を入力
  const dataBodyInput = page.locator('textarea').nth(1);
  await dataBodyInput.fill('AAAA BBBB CCCCCCCCCC');
  
  // 変換ボタンをクリック
  await page.locator('button', { hasText: '変換' }).click();
await expect(page.locator('.result-section textarea')).not.toBeEmpty();
  
  await page.screenshot({ 
    path: 'imgs/screenshots/screenshot-fixed-length-demo.png',
    fullPage: true 
  });
  console.log('✓ Fixed Length Converter screenshot saved');
  
  // 採番行変換のデモ
  await page.goto(`${baseURL}/#/numbering-line`);
  await page.waitForLoadState('networkidle');
  
  // テストデータを入力（複数行を含むセルデータ - ダブルクォーテーションで囲む）
  const inputArea = page.locator('textarea').first();
  await inputArea.fill('"①項目A\n項目A詳細1\n項目A詳細2","②項目B\n項目B詳細","③項目C"');
  
  // 変換ボタンをクリック
  await page.locator('button', { hasText: '変換' }).click();
await expect(page.locator('.result-section textarea')).not.toBeEmpty();
  
  await page.screenshot({ 
    path: 'imgs/screenshots/screenshot-numbering-line-demo.png',
    fullPage: true 
  });
  console.log('✓ Numbering Line Converter screenshot saved');
  
  await browser.close();
  console.log('\n✅ All screenshots saved to imgs/screenshots/');
}

captureScreenshots().catch(console.error);
