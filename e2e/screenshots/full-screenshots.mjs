import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:5174';
const API  = 'http://localhost:4000/api';
const OUT  = './screenshots/current';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// Login page
await page.goto(`${BASE}/login`);
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/01-login.png`, fullPage: true });
console.log('01-login.png ✓');

// Register page
await page.goto(`${BASE}/register`);
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/02-register.png`, fullPage: true });
console.log('02-register.png ✓');

// Register a fresh user
const ts = Date.now();
const email = `demo${ts}@test.com`;
const password = 'password123';
await page.fill('input#name', 'Demo User');
await page.fill('input#email', email);
await page.fill('input#password', password);
await page.click('button[type="submit"]');
await page.waitForURL('**/boards');
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/03-boards-empty.png`, fullPage: true });
console.log('03-boards-empty.png ✓');

// Create boards & data via API
const loginRes = await (await fetch(`${API}/auth/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
})).json();
const token = loginRes.data.accessToken;
const h = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

const b1 = await (await fetch(`${API}/boards`, { method: 'POST', headers: h, body: JSON.stringify({ title: 'Project Alpha', color: '#4f46e5' }) })).json();
await fetch(`${API}/boards`, { method: 'POST', headers: h, body: JSON.stringify({ title: 'Marketing Hub', color: '#0891b2' }) });
await fetch(`${API}/boards`, { method: 'POST', headers: h, body: JSON.stringify({ title: 'Bug Tracker', color: '#dc2626' }) });
await fetch(`${API}/boards`, { method: 'POST', headers: h, body: JSON.stringify({ title: 'Design System', color: '#7c3aed' }) });

await page.reload();
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/04-boards-with-data.png`, fullPage: true });
console.log('04-boards-with-data.png ✓');

// Set up board with lists and cards
const boardId = b1.data.id;
const l1 = await (await fetch(`${API}/boards/${boardId}/lists`, { method: 'POST', headers: h, body: JSON.stringify({ title: 'Backlog' }) })).json();
const l2 = await (await fetch(`${API}/boards/${boardId}/lists`, { method: 'POST', headers: h, body: JSON.stringify({ title: 'In Progress' }) })).json();
const l3 = await (await fetch(`${API}/boards/${boardId}/lists`, { method: 'POST', headers: h, body: JSON.stringify({ title: 'Done' }) })).json();

const c1 = await (await fetch(`${API}/lists/${l1.data.id}/cards`, { method: 'POST', headers: h, body: JSON.stringify({ title: 'Design landing page mockups' }) })).json();
await fetch(`${API}/lists/${l1.data.id}/cards`, { method: 'POST', headers: h, body: JSON.stringify({ title: 'Set up CI/CD pipeline' }) });
await fetch(`${API}/lists/${l1.data.id}/cards`, { method: 'POST', headers: h, body: JSON.stringify({ title: 'API documentation' }) });
const c2 = await (await fetch(`${API}/lists/${l2.data.id}/cards`, { method: 'POST', headers: h, body: JSON.stringify({ title: 'Implement auth flow' }) })).json();
await fetch(`${API}/lists/${l2.data.id}/cards`, { method: 'POST', headers: h, body: JSON.stringify({ title: 'Database schema review' }) });
await fetch(`${API}/lists/${l3.data.id}/cards`, { method: 'POST', headers: h, body: JSON.stringify({ title: 'User research interviews' }) });

// Labels on c1
await fetch(`${API}/cards/${c1.data.id}/labels`, { method: 'POST', headers: h, body: JSON.stringify({ text: 'Design', color: '#4ade80' }) });
await fetch(`${API}/cards/${c1.data.id}/labels`, { method: 'POST', headers: h, body: JSON.stringify({ text: 'High Priority', color: '#f87171' }) });

// Due date + checklist on c1
await fetch(`${API}/lists/${l1.data.id}/cards/${c1.data.id}`, { method: 'PATCH', headers: h, body: JSON.stringify({ dueDate: '2026-05-01' }) });
const cl = await (await fetch(`${API}/cards/${c1.data.id}/checklists`, { method: 'POST', headers: h, body: JSON.stringify({ title: 'Design Tasks' }) })).json();
const it1 = await (await fetch(`${API}/cards/${c1.data.id}/checklists/${cl.data.id}/items`, { method: 'POST', headers: h, body: JSON.stringify({ text: 'Create wireframes' }) })).json();
await fetch(`${API}/cards/${c1.data.id}/checklists/${cl.data.id}/items`, { method: 'POST', headers: h, body: JSON.stringify({ text: 'Design color palette' }) });
await fetch(`${API}/cards/${c1.data.id}/checklists/${cl.data.id}/items`, { method: 'POST', headers: h, body: JSON.stringify({ text: 'Create mockups' }) });
await fetch(`${API}/cards/${c1.data.id}/checklists/${cl.data.id}/items/${it1.data.id}`, { method: 'PATCH', headers: h });

// Overdue date on c2
await fetch(`${API}/lists/${l2.data.id}/cards/${c2.data.id}`, { method: 'PATCH', headers: h, body: JSON.stringify({ dueDate: '2026-01-10', description: 'Implement JWT authentication with refresh tokens.' }) });
await fetch(`${API}/cards/${c2.data.id}/labels`, { method: 'POST', headers: h, body: JSON.stringify({ text: 'Backend', color: '#38bdf8' }) });

// Board view
await page.goto(`${BASE}/boards/${boardId}`);
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/05-board-view.png`, fullPage: true });
console.log('05-board-view.png ✓');

// Card modal
await page.locator('text=Design landing page mockups').click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/06-card-modal.png`, fullPage: true });
console.log('06-card-modal.png ✓');

await page.keyboard.press('Escape');
await page.waitForTimeout(300);
await page.locator('text=Implement auth flow').click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/07-card-modal-overdue.png`, fullPage: true });
console.log('07-card-modal-overdue.png ✓');

await browser.close();
console.log('All done!');
