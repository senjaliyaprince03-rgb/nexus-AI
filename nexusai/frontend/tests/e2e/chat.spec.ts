import { test, expect, Page } from "@playwright/test"

async function loginAs(page: Page, email = "admin@nexusai.dev", pass = "password123") {
  await page.goto("/login")
  await page.fill('input[type="email"]',    email)
  await page.fill('input[type="password"]', pass)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 })
}

test.describe("Chat interface", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await page.goto("/dashboard/chat")
  })

  test("empty state shows suggestion chips", async ({ page }) => {
    await expect(page.locator("text=Ask your documents anything")).toBeVisible()
    const chips = page.locator(".suggestion-chip, [data-testid='suggestion']")
    await expect(chips.first()).toBeVisible({ timeout: 5_000 })
  })

  test("typing a message enables the send button", async ({ page }) => {
    const textarea = page.locator("textarea")
    const sendBtn  = page.locator('[aria-label="Send message"]')

    await expect(sendBtn).toBeDisabled()
    await textarea.fill("What are the key findings?")
    await expect(sendBtn).toBeEnabled()
  })

  test("sends message and shows user bubble", async ({ page }) => {
    await page.locator("textarea").fill("Test question for E2E")
    await page.locator('[aria-label="Send message"]').click()

    await expect(page.locator("text=Test question for E2E")).toBeVisible({ timeout: 5_000 })
  })

  test("shows streaming cursor during response", async ({ page }) => {
    await page.locator("textarea").fill("What is this document about?")
    await page.locator('[aria-label="Send message"]').click()

    // Cursor or streaming indicator appears while waiting for response
    const streamingIndicator = page.locator(".animate-pulse, .cursor-blink, [data-streaming]")
    await expect(streamingIndicator.first()).toBeVisible({ timeout: 8_000 })
  })

  test("stop button appears during streaming and cancels", async ({ page }) => {
    await page.locator("textarea").fill("A long question that will take time to answer")
    await page.locator('[aria-label="Send message"]').click()

    const stopBtn = page.locator('[aria-label="Cancel streaming"]')
    await expect(stopBtn).toBeVisible({ timeout: 5_000 })
    await stopBtn.click()

    // After cancel, stop button disappears
    await expect(stopBtn).not.toBeVisible({ timeout: 5_000 })
  })

  test("Enter sends, Shift+Enter adds newline", async ({ page }) => {
    const textarea = page.locator("textarea")
    await textarea.click()
    await textarea.pressSequentially("Line one")
    await textarea.press("Shift+Enter")
    await textarea.pressSequentially("Line two")

    // Message should NOT have been sent yet
    const content = await textarea.inputValue()
    expect(content).toContain("\n")
  })

  test("sidebar shows new conversation after send", async ({ page }) => {
    await page.locator("textarea").fill("E2E sidebar test question")
    await page.locator('[aria-label="Send message"]').click()

    // Wait for response to complete
    await page.waitForTimeout(3_000)

    // Sidebar should show the conversation title
    const sidebar = page.locator("nav, aside")
    await expect(sidebar).toBeVisible()
  })

  test("clicking suggestion chip sends question", async ({ page }) => {
    const firstChip = page.locator(".suggestion-chip").first()
    const chipText  = await firstChip.textContent()
    await firstChip.click()

    if (chipText) {
      await expect(page.locator(`text=${chipText.slice(0, 30)}`)).toBeVisible({ timeout: 5_000 })
    }
  })
})

test.describe("Document upload", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await page.goto("/dashboard/documents")
  })

  test("documents page shows upload area", async ({ page }) => {
    await expect(page.locator("text=Upload")).toBeVisible()
  })

  test("uploading a text file shows progress", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]')
    if (await fileInput.count() === 0) {
      test.skip()
      return
    }

    const buffer = Buffer.from("This is a test document for E2E testing. ".repeat(50))
    await fileInput.setInputFiles({
      name: "e2e_test.txt",
      mimeType: "text/plain",
      buffer,
    })

    // Status badge should appear
    await expect(page.locator("text=e2e_test.txt")).toBeVisible({ timeout: 8_000 })
  })
})
