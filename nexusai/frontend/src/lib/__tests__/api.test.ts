import { afterEach, describe, expect, it, vi } from "vitest"
import { api } from "@/lib/api"

describe("api offline handling", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("uses a friendly offline message without leaking localhost details", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")))

    await expect(api.get("/api/auth/me")).rejects.toMatchObject({
      detail: "Live backend is unavailable right now. Start the API server, then try again.",
    })
  })
})
