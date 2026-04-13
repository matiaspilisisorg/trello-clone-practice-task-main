import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:5174';
const OUT = './screenshots/current';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

await page.goto(`${BASE}/login`);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/login.png`, fullPage: true });
console.log('login.png ✓');

await page.goto(`${BASE}/register`);
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/register.png`, fullPage: true });
console.log('register.png ✓');

await browser.close();
