import { chromium } from '@playwright/test';

const BASE = 'http://localhost:5173';
const API = 'http://localhost:4000/api';
const SCREENSHOTS_DIR = './screenshots/manual';

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // 01 - Login page
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('form');
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/01-login.png`, fullPage: true });
  console.log('01-login.png captured');

  // 02 - Register page
  await page.goto(`${BASE}/register`);
  await page.waitForSelector('form');
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/02-register.png`, fullPage: true });
  console.log('02-register.png captured');

  // Register a user
  const ts = Date.now();
  const email = `screenshot${ts}@test.com`;
  const password = 'password123';
  await page.fill('input#name', 'Screenshot User');
  await page.fill('input#email', email);
  await page.fill('input#password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/boards');
  await page.waitForTimeout(500);

  // 03 - Empty boards dashboard
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/03-boards-empty.png`, fullPage: true });
  console.log('03-boards-empty.png captured');

  // Create boards via API for screenshots
  const loginRes = await (await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })).json();
  const token = loginRes.data.accessToken;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // Create 3 boards
  const board1 = await (await fetch(`${API}/boards`, {
    method: 'POST', headers,
    body: JSON.stringify({ title: 'Project Alpha', color: '#0079bf' }),
  })).json();

  await fetch(`${API}/boards`, {
    method: 'POST', headers,
    body: JSON.stringify({ title: 'Marketing', color: '#d29034' }),
  });

  await fetch(`${API}/boards`, {
    method: 'POST', headers,
    body: JSON.stringify({ title: 'Bug Tracker', color: '#b04632' }),
  });

  // 04 - Boards with data
  await page.reload();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/04-boards-with-data.png`, fullPage: true });
  console.log('04-boards-with-data.png captured');

  // Create lists and cards for Board 1
  const boardId = board1.data.id;

  const list1 = await (await fetch(`${API}/boards/${boardId}/lists`, {
    method: 'POST', headers,
    body: JSON.stringify({ title: 'To Do' }),
  })).json();

  const list2 = await (await fetch(`${API}/boards/${boardId}/lists`, {
    method: 'POST', headers,
    body: JSON.stringify({ title: 'In Progress' }),
  })).json();

  await fetch(`${API}/boards/${boardId}/lists`, {
    method: 'POST', headers,
    body: JSON.stringify({ title: 'Done' }),
  });

  // Create cards
  const card1 = await (await fetch(`${API}/lists/${list1.data.id}/cards`, {
    method: 'POST', headers,
    body: JSON.stringify({ title: 'Design landing page' }),
  })).json();

  await fetch(`${API}/lists/${list1.data.id}/cards`, {
    method: 'POST', headers,
    body: JSON.stringify({ title: 'Set up CI/CD pipeline' }),
  });

  const card2 = await (await fetch(`${API}/lists/${list2.data.id}/cards`, {
    method: 'POST', headers,
    body: JSON.stringify({ title: 'Implement auth flow' }),
  })).json();

  await fetch(`${API}/lists/${list2.data.id}/cards`, {
    method: 'POST', headers,
    body: JSON.stringify({ title: 'Database schema review' }),
  });

  // Add labels to card1
  await fetch(`${API}/cards/${card1.data.id}/labels`, {
    method: 'POST', headers,
    body: JSON.stringify({ text: 'Design', color: '#61bd4f' }),
  });
  await fetch(`${API}/cards/${card1.data.id}/labels`, {
    method: 'POST', headers,
    body: JSON.stringify({ text: 'High Priority', color: '#eb5a46' }),
  });

  // Set due date (future) on card1
  await fetch(`${API}/lists/${list1.data.id}/cards/${card1.data.id}`, {
    method: 'PATCH', headers,
    body: JSON.stringify({ dueDate: '2026-03-20' }),
  });

  // Add checklist to card1
  const cl = await (await fetch(`${API}/cards/${card1.data.id}/checklists`, {
    method: 'POST', headers,
    body: JSON.stringify({ title: 'Design Tasks' }),
  })).json();

  const item1 = await (await fetch(`${API}/cards/${card1.data.id}/checklists/${cl.data.id}/items`, {
    method: 'POST', headers,
    body: JSON.stringify({ text: 'Create wireframes' }),
  })).json();

  await fetch(`${API}/cards/${card1.data.id}/checklists/${cl.data.id}/items`, {
    method: 'POST', headers,
    body: JSON.stringify({ text: 'Design color palette' }),
  });

  await fetch(`${API}/cards/${card1.data.id}/checklists/${cl.data.id}/items`, {
    method: 'POST', headers,
    body: JSON.stringify({ text: 'Create mockups' }),
  });

  // Check one item
  await fetch(`${API}/cards/${card1.data.id}/checklists/${cl.data.id}/items/${item1.data.id}`, {
    method: 'PATCH', headers,
  });

  // Set overdue date on card2
  await fetch(`${API}/lists/${list2.data.id}/cards/${card2.data.id}`, {
    method: 'PATCH', headers,
    body: JSON.stringify({ dueDate: '2026-03-10', description: 'Implement JWT authentication with refresh tokens. Include login, register, and token refresh endpoints.' }),
  });

  await fetch(`${API}/cards/${card2.data.id}/labels`, {
    method: 'POST', headers,
    body: JSON.stringify({ text: 'Backend', color: '#0079bf' }),
  });

  // 05 - Board view with lists and cards
  await page.goto(`${BASE}/boards/${boardId}`);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/05-board-view.png`, fullPage: true });
  console.log('05-board-view.png captured');

  // 06 - Card modal (card1 with label + checklist)
  await page.locator('text=Design landing page').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/06-card-modal.png`, fullPage: true });
  console.log('06-card-modal.png captured');

  // Close modal
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // 07 - Card modal with overdue due date
  await page.locator('text=Implement auth flow').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/07-card-modal-overdue.png`, fullPage: true });
  console.log('07-card-modal-overdue.png captured');

  await browser.close();
  console.log('All screenshots captured!');
}

main().catch(console.error);
