import { test, expect } from '@playwright/test';
import { registerUser, loginUser } from '../fixtures/test-helpers';

/**
 * Generate a unique email address to avoid collisions between test runs.
 */
function uniqueEmail(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `testuser+${timestamp}${random}@example.com`;
}

test.describe('Authentication', () => {
  test('user can register with valid credentials and land on /boards', async ({ page }) => {
    const email = uniqueEmail();
    await registerUser(page, 'Test User', email, 'password123');

    await expect(page).toHaveURL(/\/boards$/);
    await expect(page.getByText('Your Boards')).toBeVisible();
  });

  test('user cannot register with duplicate email', async ({ page }) => {
    const email = uniqueEmail();

    // Register the first time
    await registerUser(page, 'First User', email, 'password123');

    // Log out so we can try registering again
    await page.getByText('First User').click();
    await page.getByText('Log out').click();
    await page.waitForURL('**/login');

    // Attempt to register with the same email
    await page.goto('/register');
    await page.getByLabel('Name').fill('Duplicate User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign up' }).click();

    // Should see an error message (toast or inline)
    await expect(page.getByText(/already in use|Registration failed/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test('user can log in and log out', async ({ page }) => {
    const email = uniqueEmail();

    // Register first
    await registerUser(page, 'Login Test', email, 'password123');

    // Log out
    await page.getByText('Login Test').click();
    await page.getByText('Log out').click();
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/\/login$/);

    // Log back in
    await loginUser(page, email, 'password123');
    await expect(page).toHaveURL(/\/boards$/);
    await expect(page.getByText('Your Boards')).toBeVisible();
  });

  test('logged-out user visiting /boards is redirected to /login', async ({ page }) => {
    await page.goto('/boards');
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText('Log in to Trello Clone')).toBeVisible();
  });
});
