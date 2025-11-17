#!/usr/bin/env node
/**
 * Test email modal buttons and capture console errors
 */

import { chromium } from 'playwright';

async function testButtons() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Capture console messages and errors
  const consoleMessages = [];
  const errors = [];

  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    console.log(`CONSOLE [${msg.type()}]:`, msg.text());
  });

  page.on('pageerror', error => {
    errors.push(error.message);
    console.error('PAGE ERROR:', error.message);
  });

  try {
    console.log('📱 Navigating to dashboard...');
    await page.goto('http://localhost:3001/approval', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    console.log('🖱️  Clicking Preview Email button...');
    await page.click('button:has-text("Preview Email")');

    console.log('⏳ Waiting for modal...');
    await page.waitForSelector('#email-modal.visible', { timeout: 5000 });
    await page.waitForTimeout(500);

    console.log('✅ Modal opened successfully\n');

    // Test Edit Email button
    console.log('🧪 Testing "Edit Email" button...');
    await page.click('#btn-edit');
    await page.waitForTimeout(1000);

    const editSectionVisible = await page.isVisible('#edit-section');
    console.log(`   Edit section visible: ${editSectionVisible}`);

    // Test switching back to preview
    console.log('🧪 Testing "Preview" button (toggle back)...');
    await page.click('#btn-edit');
    await page.waitForTimeout(1000);

    const previewSectionVisible = await page.isVisible('#preview-section');
    console.log(`   Preview section visible: ${previewSectionVisible}`);

    // Test Send Now button (with confirm dialog)
    console.log('🧪 Testing "Send Now" button...');
    page.on('dialog', async dialog => {
      console.log(`   Dialog appeared: "${dialog.message()}"`);
      await dialog.dismiss();
    });
    await page.click('#btn-send');
    await page.waitForTimeout(1000);

    // Test Save to Drafts button
    console.log('🧪 Testing "Save to Drafts" button...');
    await page.click('#btn-draft');
    await page.waitForTimeout(2000);

    console.log('\n📊 Summary:');
    console.log(`   Console messages: ${consoleMessages.length}`);
    console.log(`   Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n❌ JavaScript Errors Found:');
      errors.forEach(err => console.log(`   - ${err}`));
    } else {
      console.log('\n✅ No JavaScript errors detected');
    }

    console.log('\n⏸️  Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Test Error:', error.message);
  } finally {
    await browser.close();
  }
}

testButtons();
