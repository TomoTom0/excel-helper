import { chromium } from '@playwright/test';
import { config } from 'dotenv';
import { execSync } from 'child_process';
import { unlinkSync } from 'fs';

config();

async function recordDemo(feature) {
  const browser = await chromium.launch({ headless: true });
  
  const context = await browser.newContext({
    recordVideo: {
      dir: 'tmp/videos/',
      size: { width: 1280, height: 900 }
    },
    viewport: { width: 1280, height: 900 },
    locale: 'ja-JP'
  });
  
  const page = await context.newPage();
  
  const port = process.env.VITE_PORT || 5173;
  const baseURL = `http://localhost:${port}`;
  
  if (feature === 'fixed-length') {
    console.log('🎥 Recording Fixed Length Converter demo...');
    
    await page.goto(`${baseURL}/#/fixed-length`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.waitForTimeout(2000); // 最初のフレーム2秒
    
    const columnLengthsInput = page.locator('textarea').first();
    await columnLengthsInput.click();
    await page.waitForTimeout(300);
    await page.keyboard.insertText('5,5,10');
    await page.waitForTimeout(800);
    
    const dataBodyInput = page.locator('textarea').nth(1);
    await dataBodyInput.click();
    await page.waitForTimeout(300);
    await page.keyboard.insertText('AAAA BBBB CCCCCCCCCC');
    await page.waitForTimeout(800);
    
    await page.locator('button', { hasText: '変換' }).click();
    await page.waitForTimeout(1500);
    await page.waitForTimeout(2000); // 最後のフレーム2秒
    
  } else if (feature === 'numbering-line') {
    console.log('🎥 Recording Numbering Line Converter demo...');
    
    await page.goto(`${baseURL}/#/numbering-line`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.waitForTimeout(2000); // 最初のフレーム2秒
    
    const inputArea = page.locator('textarea').first();
    await inputArea.click();
    await page.waitForTimeout(300);
    await page.keyboard.insertText('"①項目A\n項目A詳細1\n項目A詳細2","②項目B\n項目B詳細","③項目C"');
    await page.waitForTimeout(800);
    
    await page.locator('button', { hasText: '変換' }).click();
    await page.waitForTimeout(1500);
    await page.waitForTimeout(2000); // 最後のフレーム2秒
  }
  
  const videoPath = await page.video().path();
  await context.close();
  await browser.close();
  
  console.log(`✓ ${feature} demo recorded`);
  return videoPath;
}

function convertToGif(videoPath, feature) {
  console.log(`🔄 Converting ${feature} to GIF...`);
  
  const outputGif = `imgs/demos/${feature}-demo.gif`;
  
  // webmからmp4に変換（最初の1秒をトリム）
  const mp4Path = `tmp/videos/${feature}-temp.mp4`;
  execSync(
    `ffmpeg -i "${videoPath}" -ss 1.0 -c:v libx264 -preset fast -crf 23 "${mp4Path}" -y`,
    { stdio: 'pipe' }
  );
  
  // mp4からGIFに変換（fps=8で最適化）
  execSync(
    `ffmpeg -i "${mp4Path}" -vf "fps=8,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 "${outputGif}" -y`,
    { stdio: 'pipe' }
  );
  
  // 一時ファイルを削除
  unlinkSync(videoPath);
  unlinkSync(mp4Path);
  
  console.log(`✓ GIF saved to ${outputGif}`);
}

async function main() {
  // 固定長変換
  const fixedLengthVideo = await recordDemo('fixed-length');
  convertToGif(fixedLengthVideo, 'fixed-length');
  
  // ナンバリング行変換
  const numberingLineVideo = await recordDemo('numbering-line');
  convertToGif(numberingLineVideo, 'numbering-line');
  
  console.log('\n✅ All demo GIFs saved to imgs/demos/');
}

main().catch(console.error);
