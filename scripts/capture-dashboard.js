#!/usr/bin/env node
/**
 * Playwright script to capture dashboard screenshots
 */

import { chromium } from 'playwright';
import * as path from 'path';

async function captureDashboard() {
  const url = process.argv[2] || 'http://localhost:3001/approval';
  const outputPath = process.argv[3] || './screenshots/dashboard.png';

  console.log(`📸 Capturing screenshot of: ${url}`);

  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    // Navigate to dashboard
    await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });

    // Wait a bit for any animations
    await page.waitForTimeout(1000);

    // Take full page screenshot
    await page.screenshot({
      path: outputPath,
      fullPage: true
    });

    console.log(`✅ Screenshot saved: ${outputPath}`);

    // Get page info
    const title = await page.title();
    const submissionCount = await page.locator('.card').count();
    const bulkActionsVisible = await page.locator('#bulk-actions.visible').count();

    console.log('\n📊 Dashboard Info:');
    console.log(`  Title: ${title}`);
    console.log(`  Submissions: ${submissionCount}`);
    console.log(`  Bulk actions visible: ${bulkActionsVisible > 0 ? 'Yes' : 'No'}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

captureDashboard();
