import { test, expect } from '@playwright/test';
import { registerUser, createBoard, navigateToBoard } from '../fixtures/test-helpers';

function uniqueEmail(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `boards+${timestamp}${random}@example.com`;
}

test.describe('Boards', () => {
  let email: string;
  const password = 'password123';

  test.beforeEach(async ({ page }) => {
    email = uniqueEmail();
    await registerUser(page, 'Board Tester', email, password);
  });

  test('create a new board from the dashboard', async ({ page }) => {
    await createBoard(page, 'My Test Board');
    await expect(page.getByText('My Test Board')).toBeVisible();
  });

  test('board appears in grid with correct title', async ({ page }) => {
    await createBoard(page, 'Grid Board Alpha');
    await createBoard(page, 'Grid Board Beta');

    await expect(page.getByText('Grid Board Alpha')).toBeVisible();
    await expect(page.getByText('Grid Board Beta')).toBeVisible();
  });

  test('delete a board (confirm and it disappears)', async ({ page }) => {
    await createBoard(page, 'Board To Delete');
    await expect(page.getByText('Board To Delete')).toBeVisible();

    // Accept the confirm dialog before clicking delete
    page.on('dialog', (dialog) => dialog.accept());

    // Hover over the board tile to reveal the delete button, then click it
    const boardTile = page.locator('div', { hasText: 'Board To Delete' }).filter({
      has: page.locator('h3'),
    });
    await boardTile.hover();
    await boardTile.getByTitle('Delete board').click();

    await expect(page.getByText('Board To Delete')).not.toBeVisible({ timeout: 5000 });
  });

  test('navigate to a board', async ({ page }) => {
    await createBoard(page, 'Navigable Board');
    await navigateToBoard(page, 'Navigable Board');

    await expect(page).toHaveURL(/\/boards\/.+/);
    await expect(page.getByText('Navigable Board')).toBeVisible();
    // Board view should show the "Add another list" button
    await expect(page.getByText('Add another list')).toBeVisible();
  });
});
