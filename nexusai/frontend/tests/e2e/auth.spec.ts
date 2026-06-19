import { test, expect } from "@playwright/test"

const TEST_EMAIL = `e2e_${Date.now()}@nexusai.test`
const TEST_PASS  = "E2eTest123!"

test.describe("Authentication", () => {
  test("signup → redirect to dashboard", async ({ page }) => {
    await page.goto("/signup")
    await expect(page.locator("h1")).toContainText("Create your account")

    await page.fill('input[type="email"]',    TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASS)
    await page.fill('input[placeholder="Acme Corp"]', "E2E Workspace")
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 })
  })

  test("login with valid credentials", async ({ page }) => {
    await page.goto("/login")
    await page.fill('input[type="email"]',    "admin@nexusai.dev")
    await page.fill('input[type="password"]', "password123")
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 })
  })

  test("login with wrong password shows error", async ({ page }) => {
    await page.goto("/login")
    await page.fill('input[type="email"]',    "admin@nexusai.dev")
    await page.fill('input[type="password"]', "wrongpassword")
    await page.click('button[type="submit"]')
    await expect(page.locator("text=Invalid email or password")).toBeVisible({ timeout: 5_000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test("unauthenticated access to dashboard redirects to login", async ({ page }) => {
    // Clear cookies to ensure logged out
    await page.context().clearCookies()
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 })
  })

  test("logout clears session and redirects", async ({ page }) => {
    // Login first
    await page.goto("/login")
    await page.fill('input[type="email"]',    "admin@nexusai.dev")
    await page.fill('input[type="password"]', "password123")
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/dashboard/)

    // Logout
    await page.click("text=Sign out")
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 })

    // Verify session is cleared
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/login/)
  })
})
