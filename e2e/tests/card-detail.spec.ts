import { test, expect } from '@playwright/test';
import { registerUser, createBoard, navigateToBoard } from '../fixtures/test-helpers';

function uniqueEmail(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `cards+${timestamp}${random}@example.com`;
}

test.describe('Card Detail Modal', () => {
  let email: string;
  const password = 'password123';
  const boardTitle = 'Card Detail Board';
  const listTitle = 'Feature List';
  const cardTitle = 'Test Card';

  test.beforeEach(async ({ page }) => {
    email = uniqueEmail();
    await registerUser(page, 'Card Tester', email, password);
    await createBoard(page, boardTitle);
    await navigateToBoard(page, boardTitle);

    // Create a list
    await page.getByText('Add another list').click();
    await page.getByPlaceholder('Enter list title...').fill(listTitle);
    await page.getByRole('button', { name: 'Add list' }).click();
    await expect(page.getByText(listTitle)).toBeVisible();

    // Create a card
    await page.getByText('Add a card').click();
    await page.getByPlaceholder('Enter a title for this card...').fill(cardTitle);
    await page.getByRole('button', { name: 'Add card' }).click();
    await expect(page.getByText(cardTitle)).toBeVisible();
  });

  test('open a card modal', async ({ page }) => {
    await page.getByText(cardTitle).click();

    // The modal should be visible with the card title
    const modal = page.locator('.fixed.inset-0');
    await expect(modal).toBeVisible();
    await expect(modal.getByText(cardTitle)).toBeVisible();
  });

  test('edit the card title', async ({ page }) => {
    await page.getByText(cardTitle).click();
    const modal = page.locator('.fixed.inset-0');
    await expect(modal).toBeVisible();

    // Click the title to start editing
    await modal.locator('h2', { hasText: cardTitle }).click();
    const titleInput = modal.locator('input[type="text"]').first();
    await titleInput.fill('Updated Card Title');
    await titleInput.press('Enter');

    await expect(modal.getByText('Updated Card Title')).toBeVisible();
  });

  test('add a description and save', async ({ page }) => {
    await page.getByText(cardTitle).click();
    const modal = page.locator('.fixed.inset-0');
    await expect(modal).toBeVisible();

    // Click the description placeholder to start editing
    await modal.getByText('Add a more detailed description...').click();
    const textarea = modal.locator('textarea');
    await textarea.fill('This is a detailed description for the test card.');
    await modal.getByRole('button', { name: 'Save' }).click();

    await expect(
      modal.getByText('This is a detailed description for the test card.'),
    ).toBeVisible();
  });

  test('set a due date', async ({ page }) => {
    await page.getByText(cardTitle).click();
    const modal = page.locator('.fixed.inset-0');
    await expect(modal).toBeVisible();

    // Set a due date using the date input
    const dateInput = modal.locator('input[type="date"]');
    await dateInput.fill('2026-12-31');

    // A due date badge should appear (shows "Dec 31")
    await expect(modal.getByText('Dec 31')).toBeVisible({ timeout: 5000 });
  });

  test('add a label', async ({ page }) => {
    await page.getByText(cardTitle).click();
    const modal = page.locator('.fixed.inset-0');
    await expect(modal).toBeVisible();

    // Click "+ Add Label"
    await modal.getByText('+ Add Label').click();

    // Fill in label text and submit
    await modal.getByPlaceholder('Label text').fill('Urgent');
    await modal.getByRole('button', { name: 'Add' }).first().click();

    // The label should appear on the card
    await expect(modal.getByText('Urgent')).toBeVisible();
  });

  test('add a checklist and check an item', async ({ page }) => {
    await page.getByText(cardTitle).click();
    const modal = page.locator('.fixed.inset-0');
    await expect(modal).toBeVisible();

    // Add a checklist
    await modal.getByText('+ Add Checklist').click();
    await modal.getByPlaceholder('Checklist title...').fill('QA Steps');
    // Click the "Add" button next to the checklist title input
    await modal.getByRole('button', { name: 'Add' }).first().click();

    await expect(modal.getByText('QA Steps')).toBeVisible();

    // Add an item to the checklist
    await modal.getByPlaceholder('Add an item...').fill('Verify login');
    // Click the "Add" button for the checklist item
    await modal.getByRole('button', { name: 'Add' }).last().click();
    await expect(modal.getByText('Verify login')).toBeVisible();

    // Check the item
    const checkbox = modal.locator('input[type="checkbox"]').first();
    await checkbox.check();

    // The progress bar should update (shows 100%)
    await expect(modal.getByText('100%')).toBeVisible({ timeout: 5000 });
  });

  test('close modal with X button', async ({ page }) => {
    await page.getByText(cardTitle).click();
    const modal = page.locator('.fixed.inset-0');
    await expect(modal).toBeVisible();

    // Click the X (close) button in the top-right of the modal
    await modal.locator('button').filter({ has: page.locator('svg path') }).first().click();

    await expect(modal).not.toBeVisible({ timeout: 3000 });
  });

  test('close modal with backdrop click', async ({ page }) => {
    await page.getByText(cardTitle).click();
    const modal = page.locator('.fixed.inset-0');
    await expect(modal).toBeVisible();

    // Click on the backdrop (the semi-transparent overlay, not the modal content)
    await modal.click({ position: { x: 10, y: 10 } });

    await expect(modal).not.toBeVisible({ timeout: 3000 });
  });
});
