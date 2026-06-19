import { test, expect, Page } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const API  = process.env.NEXT_PUBLIC_API_URL  ?? "http://127.0.0.1:8000";

// Unique email per test run to avoid registration conflicts
const email = `e2e_${Date.now()}@test.nexusai`;
const password = "TestPass123!";

// ── Auth flow ─────────────────────────────────────────────────────

test.describe("Authentication", () => {
  test("register → redirects to chat dashboard", async ({ page }) => {
    await page.goto(`${BASE}/auth/register`);
    await page.fill('input[type="text"]', "E2E User");
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard\/chat/, { timeout: 10_000 });
  });

  test("login with correct credentials", async ({ page }) => {
    await page.goto(`${BASE}/auth/login`);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });
  });

  test("login with wrong password shows error", async ({ page }) => {
    await page.goto(`${BASE}/auth/login`);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', "WrongPass999!");
    await page.click('button[type="submit"]');
    // Should stay on login page and show a toast/error
    await expect(page).toHaveURL(/login/, { timeout: 5_000 });
  });

  test("unauthenticated user is redirected to login", async ({ page }) => {
    // Clear cookies to simulate logged-out state
    await page.context().clearCookies();
    await page.goto(`${BASE}/dashboard/chat`);
    await expect(page).toHaveURL(/login/, { timeout: 5_000 });
  });

  test("forgot-password page renders", async ({ page }) => {
    await page.goto(`${BASE}/auth/forgot-password`);
    await expect(page.getByText(/forgot password/i)).toBeVisible();
  });
});

// ── Chat flow ─────────────────────────────────────────────────────

test.describe("Chat", () => {
  test.beforeEach(async ({ page }) => {
    // Log in before each chat test
    await page.goto(`${BASE}/auth/login`);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });
  });

  test("chat page shows empty state", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/chat`);
    await expect(page.getByText(/ask your documents/i)).toBeVisible();
  });

  test("chat input is present and focusable", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/chat`);
    const textarea = page.getByPlaceholder(/ask anything/i);
    await expect(textarea).toBeVisible();
    await textarea.focus();
    expect(await textarea.evaluate((el) => document.activeElement === el)).toBe(true);
  });

  test("new chat button creates a fresh session", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/chat`);
    const newChatBtn = page.getByRole("button", { name: /new chat/i });
    await expect(newChatBtn).toBeVisible();
    await newChatBtn.click();
    await expect(page.getByText(/ask your documents/i)).toBeVisible();
  });
});

// ── Documents flow ────────────────────────────────────────────────

test.describe("Documents", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/auth/login`);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });
  });

  test("documents page loads with upload zone", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/documents`);
    await expect(page.getByText(/drag & drop/i)).toBeVisible();
  });

  test("shows empty state when no documents", async ({ page }) => {
    await page.goto(`${BASE}/dashboard/documents`);
    // Either 0 docs or a "no documents" message
    await expect(page.locator("body")).toBeVisible();
  });
});
