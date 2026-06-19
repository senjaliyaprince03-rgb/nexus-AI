import { describe, expect, it } from "vitest"
import { ApiError } from "@/lib/api"
import { getAuthFailureMessage } from "@/components/auth/LoginPage"

describe("getAuthFailureMessage", () => {
  it("maps offline auth errors to a friendly inline message", () => {
    expect(getAuthFailureMessage(new ApiError(0, "Cannot reach the API"), "Login failed.")).toBe(
      "Sign-in service is temporarily unavailable. Start the backend server, then try again.",
    )
  })

  it("keeps non-offline details when available", () => {
    expect(getAuthFailureMessage(new Error("Invalid password"), "Login failed.")).toBe("Invalid password")
  })
})
