import { createRequire } from "node:module"
import os from "node:os"
import path from "node:path"

const require = createRequire(new URL("../nexusai/frontend/package.json", import.meta.url))
const { chromium } = require("playwright")

const apiBase = process.env.NEXUSAI_API_URL || "http://127.0.0.1:8000"
const frontendBase = process.env.NEXUSAI_FRONTEND_URL || "http://localhost:3000"
const password = "QaPass123!"
const email = `dashboard-qa-${Date.now()}@nexusai.dev`

function screenshotPath(name) {
  return path.join(os.tmpdir(), `nexusai-${name}-${Date.now()}.png`)
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 1440, height: 960 },
  deviceScaleFactor: 1,
})
await context.addInitScript(() => {
  localStorage.setItem("nexusai-onboarding-completed", "true")
  localStorage.setItem("nexusai-cookie-consent", "accept")
})

const registerRes = await context.request.post(`${apiBase}/api/auth/register`, {
  data: { email, password, workspace_name: "Dashboard QA" },
})

if (!registerRes.ok()) {
  throw new Error(`Could not create QA account: ${registerRes.status()} ${await registerRes.text()}`)
}

const auth = await registerRes.json()
if (auth.verify_url) {
  const verifyPage = await context.newPage()
  await verifyPage.goto(auth.verify_url, { waitUntil: "networkidle", timeout: 60000 })
  await Promise.race([
    verifyPage.getByText("Email verified").waitFor({ state: "visible", timeout: 60000 }),
    verifyPage.getByText("Continue to dashboard").waitFor({ state: "visible", timeout: 60000 }),
  ]).catch(() => {})
  await verifyPage.waitForTimeout(1000)
  await verifyPage.close()
}
await context.addInitScript(
  ({ accessToken, refreshToken }) => {
    localStorage.setItem("nexusai_token", accessToken)
    sessionStorage.setItem("nexusai_refresh", refreshToken)
  },
  {
    accessToken: auth.access_token,
    refreshToken: auth.refresh_token,
  },
)
await context.addCookies([
  {
    name: "nexusai_access",
    value: auth.access_token,
    domain: "localhost",
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
  },
  {
    name: "nexusai_refresh",
    value: auth.refresh_token,
    domain: "localhost",
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
  },
])

const page = await context.newPage()
const consoleMessages = []
const pageErrors = []
page.on("console", (message) => {
  if (["error", "warning"].includes(message.type())) {
    consoleMessages.push(`${message.type()}: ${message.text()}`)
  }
})
page.on("pageerror", (error) => pageErrors.push(error.message))

await page.goto(`${frontendBase}/dashboard`, { waitUntil: "domcontentloaded", timeout: 60000 })
await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {})
await page.waitForTimeout(2500)

const desktopScreenshot = screenshotPath("dashboard-desktop")
await page.screenshot({ path: desktopScreenshot, fullPage: false, timeout: 10000 }).catch(() => {})

const desktopTitleVisible = await page.getByText("NexusAI Command Center").isVisible()
const projectCards = await page.locator("article").count()
const inlineBackendError = await page.getByText("Cannot reach the NexusAI API").isVisible().catch(() => false)
const topology = await page.evaluate(() => {
  const canvas = document.querySelector("canvas")
  if (!canvas) return { present: false, width: 0, height: 0, dataLength: 0 }
  let dataLength = 0
  try {
    dataLength = canvas.toDataURL("image/png").length
  } catch {
    dataLength = 0
  }
  return {
    present: true,
    width: canvas.width,
    height: canvas.height,
    dataLength,
  }
})

await page.setViewportSize({ width: 390, height: 844 })
await page.waitForTimeout(1000)
const mobileNoHorizontalOverflow = await page.evaluate(
  () => document.documentElement.scrollWidth <= window.innerWidth + 2,
)
console.log(JSON.stringify({
  desktopUrl: page.url(),
  mobileNoHorizontalOverflow,
  mobileNavButtons: await page.getByLabel("Open more navigation").count().catch(() => 0),
  bodyPreview: (await page.textContent("body").catch(() => "")).slice(0, 300),
}))
await page.getByLabel("Open more navigation").click()
const mobileMenuItems = {
  analytics: await page.getByRole("link", { name: "Analytics", exact: true }).isVisible(),
  agents: await page.getByRole("link", { name: "Agents", exact: true }).isVisible(),
  modules: await page.getByRole("link", { name: "Modules", exact: true }).isVisible(),
}
const mobileScreenshot = screenshotPath("dashboard-mobile")
await page.screenshot({ path: mobileScreenshot, fullPage: false, timeout: 10000 }).catch(() => {})

await browser.close()

console.log(
  JSON.stringify(
    {
      desktopTitleVisible,
      projectCards,
      inlineBackendError,
      topology,
      mobileNoHorizontalOverflow,
      mobileMenuItems,
      consoleMessages,
      pageErrors,
      desktopScreenshot,
      mobileScreenshot,
    },
    null,
    2,
  ),
)
