#!/usr/bin/env node
/**
 * Validate JavaScript syntax from HTML page
 */

import { chromium } from 'playwright';

async function validateJS() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];

  page.on('pageerror', error => {
    errors.push({
      message: error.message,
      stack: error.stack
    });
  });

  try {
    await page.goto('http://localhost:3001/approval', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('\n=== JavaScript Validation ===\n');

    if (errors.length > 0) {
      console.log('❌ JavaScript Errors Found:\n');
      errors.forEach((err, i) => {
        console.log(`Error ${i + 1}:`);
        console.log(`Message: ${err.message}`);
        if (err.stack) {
          console.log(`Stack: ${err.stack}`);
        }
        console.log('');
      });
    } else {
      console.log('✅ No JavaScript errors detected');
    }

    // Check if functions are defined
    const functionChecks = await page.evaluate(() => {
      return {
        previewEmail: typeof previewEmail !== 'undefined',
        toggleEditMode: typeof toggleEditMode !== 'undefined',
        sendEditedEmail: typeof sendEditedEmail !== 'undefined',
        saveToDrafts: typeof saveToDrafts !== 'undefined',
        pendingData: typeof pendingData !== 'undefined',
        isEditMode: typeof isEditMode !== 'undefined'
      };
    });

    console.log('\n=== Function Availability ===\n');
    Object.entries(functionChecks).forEach(([name, exists]) => {
      console.log(`${exists ? '✅' : '❌'} ${name}: ${exists ? 'defined' : 'undefined'}`);
    });

  } catch (error) {
    console.error('❌ Test Error:', error.message);
  } finally {
    await browser.close();
  }
}

validateJS();
