import { createRequire } from "node:module";

const requireFromFrontend = createRequire(
  new URL("../nexusai/frontend/package.json", import.meta.url),
);
const { chromium } = requireFromFrontend("playwright");

const baseUrl = process.env.FRONTEND_BASE_URL || "http://localhost:3000";
const screenshotPath =
  process.env.AUTH_FLOW_SCREENSHOT ||
  "C:/Users/Prince/Downloads/NexusAi/auth-flows-smoke.png";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const consoleErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") {
    consoleErrors.push(message.text());
  }
});
page.on("pageerror", (error) => {
  consoleErrors.push(error.message);
});

await page.goto(`${baseUrl}/auth/register`, { waitUntil: "domcontentloaded", timeout: 30000 });
await page.getByText("Work Email").waitFor({ timeout: 15000 });
if (!page.url().includes("/signup")) {
  throw new Error(`/auth/register did not redirect to /signup. Current URL: ${page.url()}`);
}

await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
await page.locator('input[type="email"]').waitFor({ timeout: 30000 });
const declineButton = page.getByRole("button", { name: /^decline$/i });
if (await declineButton.isVisible().catch(() => false)) {
  await declineButton.click();
}
await page.getByRole("button", { name: /sign in with apple/i }).waitFor({ timeout: 30000 });
await page.waitForTimeout(1000);

await page.getByRole("button", { name: /sign in with apple/i }).click();
await page.locator('p[role="status"]', { hasText: /Apple sign-in needs OAuth client keys/i }).waitFor({ timeout: 5000 });

await page.getByRole("button", { name: /sign in with facebook/i }).click();
await page.locator('p[role="status"]', { hasText: /Facebook sign-in needs OAuth client keys/i }).waitFor({ timeout: 5000 });

await page.locator('input[type="email"]').fill("codex-smoke@example.com");
await page.locator('input[type="password"]').fill("not-a-real-password-123");
await page.getByRole("button", { name: /^sign in$/i }).click();
await page.getByText(/Invalid email or password/i).waitFor({ timeout: 10000 });

const bodyText = await page.locator("body").innerText();
await page.screenshot({ path: screenshotPath, fullPage: false });
await browser.close();

if (bodyText.includes("Cannot reach the NexusAI API")) {
  throw new Error("Login still reports that the backend API cannot be reached.");
}

const unexpectedConsoleErrors = consoleErrors.filter(
  (message) => !message.includes("the server responded with a status of 401"),
);

if (unexpectedConsoleErrors.length > 0) {
  throw new Error(`Auth flow emitted console errors:\n${unexpectedConsoleErrors.join("\n")}`);
}

console.log(
  JSON.stringify(
    {
      signUpRedirect: true,
      socialButtonsClickable: true,
      loginApiReachable: true,
      unexpectedConsoleErrors: 0,
      screenshotPath,
    },
    null,
    2,
  ),
);
