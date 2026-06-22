import React from "react"
import { render } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import { AuthBootstrap } from "@/app/providers"

const mockUseAuthStore = vi.fn()
const mockGetToken = vi.fn()
const mockGetItem = vi.fn()

vi.mock("@/store/authStore", () => ({
  useAuthStore: () => mockUseAuthStore(),
}))

vi.mock("@/lib/api", () => ({
  getToken: () => mockGetToken(),
}))

vi.mock("@/lib/storage", () => ({
  getSafeSessionStorage: () => ({
    getItem: mockGetItem,
  }),
}))

vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock("sonner", () => ({
  Toaster: () => null,
}))

vi.mock("@/components/ui/CommandPalette", () => ({
  CommandPalette: () => null,
}))

vi.mock("@/components/support/SupportFloatingWidget", () => ({
  SupportFloatingWidget: () => null,
}))

vi.mock("@/lib/i18n", () => ({
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe("AuthBootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetToken.mockReturnValue(null)
    mockGetItem.mockReturnValue(null)
  })

  it("marks the session checked instead of calling fetchUser when no session exists", () => {
    const fetchUser = vi.fn()
    const markSessionChecked = vi.fn()
    mockUseAuthStore.mockReturnValue({
      sessionChecked: false,
      isLoading: false,
      fetchUser,
      markSessionChecked,
    })

    render(<AuthBootstrap />)

    expect(fetchUser).not.toHaveBeenCalled()
    expect(markSessionChecked).toHaveBeenCalledTimes(1)
  })

  it("calls fetchUser when an access token exists", () => {
    const fetchUser = vi.fn()
    const markSessionChecked = vi.fn()
    mockGetToken.mockReturnValue("token-123")
    mockUseAuthStore.mockReturnValue({
      sessionChecked: false,
      isLoading: false,
      fetchUser,
      markSessionChecked,
    })

    render(<AuthBootstrap />)

    expect(fetchUser).toHaveBeenCalledTimes(1)
    expect(markSessionChecked).not.toHaveBeenCalled()
  })

  it("calls fetchUser when only a refresh token exists", () => {
    const fetchUser = vi.fn()
    const markSessionChecked = vi.fn()
    mockGetItem.mockReturnValue("refresh-123")
    mockUseAuthStore.mockReturnValue({
      sessionChecked: false,
      isLoading: false,
      fetchUser,
      markSessionChecked,
    })

    render(<AuthBootstrap />)

    expect(fetchUser).toHaveBeenCalledTimes(1)
    expect(markSessionChecked).not.toHaveBeenCalled()
  })
})
