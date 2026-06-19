import { test, expect } from "@playwright/test";

const TEST_USER = {
  email: `e2e_${Date.now()}@nexusai.dev`,
  password: "Test1234!",
  name: "E2E Tester",
};

test.describe("Authentication", () => {
  test("signup creates account and redirects to dashboard", async ({ page }) => {
    await page.goto("/signup");
    await expect(page).toHaveTitle(/NexusAI/);

    await page.getByLabel(/full name/i).fill(TEST_USER.name);
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByRole("button", { name: /create account/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("login with valid credentials redirects to dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("login with wrong password shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByText(/incorrect email or password/i)).toBeVisible();
  });

  test("unauthenticated user is redirected to login from dashboard", async ({ page }) => {
    // Clear storage to ensure no token
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("authenticated user is redirected from login to dashboard", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Now try to visit login page
    await page.goto("/login");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("logout clears session and redirects to login", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
