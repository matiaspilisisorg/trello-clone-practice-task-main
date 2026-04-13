import { type Page, expect } from '@playwright/test';

/**
 * Register a new user by filling in the registration form and submitting it.
 * Waits for navigation to /boards after successful registration.
 */
export async function registerUser(
  page: Page,
  name: string,
  email: string,
  password: string,
): Promise<void> {
  await page.goto('/register');
  await page.getByLabel('Name').fill(name);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign up' }).click();
  await page.waitForURL('**/boards');
  await expect(page).toHaveURL(/\/boards$/);
}

/**
 * Log in an existing user by filling in the login form and submitting it.
 * Waits for navigation to /boards after successful login.
 */
export async function loginUser(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL('**/boards');
  await expect(page).toHaveURL(/\/boards$/);
}

/**
 * Create a board from the boards dashboard.
 * Assumes the user is already on /boards.
 */
export async function createBoard(page: Page, title: string): Promise<void> {
  await page.getByText('Create new board').click();
  await page.getByPlaceholder('Board title').fill(title);
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByText(title)).toBeVisible();
}

/**
 * Navigate to a board by clicking on its tile in the dashboard.
 * Waits for the URL to change to /boards/:id.
 */
export async function navigateToBoard(
  page: Page,
  title: string,
): Promise<void> {
  await page.getByText(title).click();
  await page.waitForURL('**/boards/**');
  await expect(page.locator('h1', { hasText: title })).toBeVisible();
}
