import { createRequire } from "node:module";

const requireFromFrontend = createRequire(
  new URL("../nexusai/frontend/package.json", import.meta.url),
);
const { chromium } = requireFromFrontend("playwright");

const target = process.env.FRONTEND_URL || "http://127.0.0.1:3000/login";
const screenshotPath =
  process.env.LOGIN_SCREENSHOT ||
  "C:/Users/Prince/Downloads/NexusAi/login-smoke.png";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

await page.goto(target, { waitUntil: "domcontentloaded", timeout: 30000 });
await page.locator('input[type="email"]').waitFor({ timeout: 30000 });
await page.locator('input[type="email"]').fill("codex-smoke@example.com");
await page.locator('input[type="password"]').fill("not-a-real-password-123");
await page.getByRole("button", { name: /^sign in$/i }).click();
await page.waitForTimeout(2500);

const bodyText = await page.locator("body").innerText();
await page.screenshot({ path: screenshotPath, fullPage: false });
await browser.close();

if (bodyText.includes("Cannot reach the NexusAI API")) {
  throw new Error("Frontend still reports that the backend API cannot be reached.");
}

console.log(
  JSON.stringify(
    {
      target,
      apiReachable: true,
      screenshotPath,
    },
    null,
    2,
  ),
);
