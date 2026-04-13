import { test, expect } from '@playwright/test';
import { registerUser, createBoard, navigateToBoard } from '../fixtures/test-helpers';

function uniqueEmail(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `lists+${timestamp}${random}@example.com`;
}

test.describe('Lists & Cards', () => {
  let email: string;
  const password = 'password123';
  const boardTitle = 'Lists Test Board';

  test.beforeEach(async ({ page }) => {
    email = uniqueEmail();
    await registerUser(page, 'List Tester', email, password);
    await createBoard(page, boardTitle);
    await navigateToBoard(page, boardTitle);
  });

  test('add a list to a board', async ({ page }) => {
    await page.getByText('Add another list').click();
    await page.getByPlaceholder('Enter list title...').fill('To Do');
    await page.getByRole('button', { name: 'Add list' }).click();

    await expect(page.getByText('To Do')).toBeVisible();
  });

  test('rename a list inline', async ({ page }) => {
    // Create a list first
    await page.getByText('Add another list').click();
    await page.getByPlaceholder('Enter list title...').fill('Original Name');
    await page.getByRole('button', { name: 'Add list' }).click();
    await expect(page.getByText('Original Name')).toBeVisible();

    // Click the list title to edit it
    await page.locator('h3', { hasText: 'Original Name' }).click();
    const titleInput = page.locator('input[type="text"]').filter({
      has: page.locator('[value="Original Name"]'),
    }).or(page.locator('input[value="Original Name"]'));
    await titleInput.fill('Renamed List');
    await titleInput.press('Enter');

    await expect(page.getByText('Renamed List')).toBeVisible();
  });

  test('add a card to a list', async ({ page }) => {
    // Create a list
    await page.getByText('Add another list').click();
    await page.getByPlaceholder('Enter list title...').fill('Backlog');
    await page.getByRole('button', { name: 'Add list' }).click();
    await expect(page.getByText('Backlog')).toBeVisible();

    // Add a card
    await page.getByText('Add a card').click();
    await page.getByPlaceholder('Enter a title for this card...').fill('My First Card');
    await page.getByRole('button', { name: 'Add card' }).click();

    await expect(page.getByText('My First Card')).toBeVisible();
  });

  test('delete a list and its cards disappear', async ({ page }) => {
    // Create a list
    await page.getByText('Add another list').click();
    await page.getByPlaceholder('Enter list title...').fill('Temporary List');
    await page.getByRole('button', { name: 'Add list' }).click();
    await expect(page.getByText('Temporary List')).toBeVisible();

    // Add a card to it
    await page.getByText('Add a card').click();
    await page.getByPlaceholder('Enter a title for this card...').fill('Doomed Card');
    await page.getByRole('button', { name: 'Add card' }).click();
    await expect(page.getByText('Doomed Card')).toBeVisible();

    // Accept the confirmation dialog
    page.on('dialog', (dialog) => dialog.accept());

    // Click the delete button on the list (the trash icon in the list header)
    const listHeader = page.locator('h3', { hasText: 'Temporary List' }).locator('..');
    await listHeader.locator('button').click();

    // Both the list title and the card should be gone
    await expect(page.getByText('Temporary List')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Doomed Card')).not.toBeVisible({ timeout: 5000 });
  });

  // Drag-and-drop tests are skipped because they require complex mouse
  // simulation that is fragile in headless Playwright.
  test.skip('drag a card between lists', async () => {
    // Placeholder for future drag-and-drop E2E tests
  });
});
