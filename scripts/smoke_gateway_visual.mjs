import { createRequire } from "node:module";

const requireFromFrontend = createRequire(
  new URL("../nexusai/frontend/package.json", import.meta.url),
);
const { chromium } = requireFromFrontend("playwright");

const target = process.env.GATEWAY_URL || "http://127.0.0.1:9100";
const screenshotPath =
  process.env.GATEWAY_SCREENSHOT ||
  "C:/Users/Prince/Downloads/NexusAi/gateway-smoke.png";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

await page.goto(target, { waitUntil: "networkidle", timeout: 15000 });

const title = await page.locator("h1").innerText();
const projectCards = await page.locator(".project-card").count();
const metrics = await page
  .locator(".metric strong")
  .evaluateAll((nodes) => nodes.map((node) => node.textContent));

await page.screenshot({ path: screenshotPath, fullPage: false });
await browser.close();

console.log(
  JSON.stringify(
    {
      target,
      title,
      projectCards,
      metrics,
      screenshotPath,
    },
    null,
    2,
  ),
);
