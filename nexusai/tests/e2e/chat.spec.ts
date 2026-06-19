import { test, expect, Page } from "@playwright/test";
import path from "path";

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("Documents & Chat", () => {
  const USER = { email: `chat_e2e_${Date.now()}@nexusai.dev`, password: "Test1234!" };

  test.beforeEach(async ({ page }) => {
    // Register a fresh user before each test group
    await page.goto("/signup");
    await page.getByLabel(/email/i).fill(USER.email);
    await page.getByLabel(/password/i).fill(USER.password);
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("documents page loads and shows empty state", async ({ page }) => {
    await page.goto("/dashboard/documents");
    await expect(page.getByText(/no documents yet/i)).toBeVisible();
  });

  test("upload button toggles dropzone", async ({ page }) => {
    await page.goto("/dashboard/documents");
    await page.getByRole("button", { name: /upload/i }).click();
    await expect(page.getByText(/PDF, DOCX, TXT, CSV/i)).toBeVisible();
  });

  test("chat page loads with empty state", async ({ page }) => {
    await page.goto("/dashboard/chat");
    await expect(page.getByText(/ask anything about your documents/i)).toBeVisible();
  });

  test("chat input sends message on Enter", async ({ page }) => {
    await page.goto("/dashboard/chat");
    const input = page.getByPlaceholderText(/ask a question/i);
    await input.fill("What is NexusAI?");
    await input.press("Enter");

    // User message should appear
    await expect(page.getByText("What is NexusAI?")).toBeVisible();
  });

  test("new chat button clears messages", async ({ page }) => {
    await page.goto("/dashboard/chat");
    const input = page.getByPlaceholderText(/ask a question/i);
    await input.fill("Hello");
    await input.press("Enter");
    await expect(page.getByText("Hello")).toBeVisible();

    await page.getByRole("button", { name: /\+ new chat/i }).click();
    await expect(page.getByText(/ask anything/i)).toBeVisible();
  });

  test("analytics page renders charts container", async ({ page }) => {
    await page.goto("/dashboard/analytics");
    await expect(page.getByText(/query volume/i)).toBeVisible();
    await expect(page.getByText(/document usage/i)).toBeVisible();
  });

  test("agents page renders task input", async ({ page }) => {
    await page.goto("/dashboard/agents");
    await expect(page.getByPlaceholderText(/complex research task/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /run agent/i })).toBeVisible();
  });

  test("sidebar navigation links work", async ({ page }) => {
    await page.goto("/dashboard");
    for (const [label, urlPattern] of [
      ["Chat", /\/dashboard\/chat/],
      ["Documents", /\/dashboard\/documents/],
      ["Analytics", /\/dashboard\/analytics/],
      ["Agents", /\/dashboard\/agents/],
    ] as [string, RegExp][]) {
      await page.getByRole("link", { name: label }).click();
      await expect(page).toHaveURL(urlPattern);
    }
  });
});
