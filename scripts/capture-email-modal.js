#!/usr/bin/env node
/**
 * Capture email preview modal screenshot
 */

import { chromium } from 'playwright';

async function captureEmailModal() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('📸 Navigating to dashboard...');
    await page.goto('http://localhost:3001/approval', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    console.log('🖱️  Clicking Preview Email button...');
    // Click the first "Preview Email" button
    await page.click('button:has-text("Preview Email")');

    // Wait for modal to appear
    await page.waitForSelector('#email-modal.visible', { timeout: 5000 });
    await page.waitForTimeout(500);

    console.log('📸 Capturing modal screenshot...');
    // Capture just the modal element
    const modalElement = await page.locator('#email-modal .modal-content');
    await modalElement.screenshot({
      path: './screenshots/email_modal.png'
    });

    console.log('✅ Screenshot saved: ./screenshots/email_modal.png');

    // Get modal dimensions
    const modalBox = await page.locator('#email-modal .modal-content').boundingBox();
    console.log('\n📊 Modal Info:');
    console.log(`  Width: ${modalBox?.width}px`);
    console.log(`  Height: ${modalBox?.height}px`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

captureEmailModal();
