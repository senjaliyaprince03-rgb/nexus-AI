import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import { useAuth } from "@/hooks/useAuth"

const mockReplace = vi.fn()
const mockPush = vi.fn()
const mockUseAuthStore = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
}))

vi.mock("@/store/authStore", () => ({
  useAuthStore: () => mockUseAuthStore(),
}))

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState({}, "", "/")
    mockUseAuthStore.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      sessionChecked: false,
      login: vi.fn(),
      logout: vi.fn(),
      fetchUser: vi.fn(),
      clearAuth: vi.fn(),
    })
  })

  it("does not bootstrap fetchUser on its own", () => {
    const fetchUser = vi.fn()
    mockUseAuthStore.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      sessionChecked: false,
      login: vi.fn(),
      logout: vi.fn(),
      fetchUser,
      clearAuth: vi.fn(),
    })

    renderHook(() => useAuth())

    expect(fetchUser).not.toHaveBeenCalled()
  })

  it("redirects to login when requireAuth is true and the session is unauthenticated", () => {
    window.history.replaceState({}, "", "/dashboard/chat")

    mockUseAuthStore.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      sessionChecked: true,
      login: vi.fn(),
      logout: vi.fn(),
      fetchUser: vi.fn(),
      clearAuth: vi.fn(),
    })

    renderHook(() => useAuth({ requireAuth: true }))

    expect(mockReplace).toHaveBeenCalledWith("/login?from=%2Fdashboard%2Fchat")
  })
})
