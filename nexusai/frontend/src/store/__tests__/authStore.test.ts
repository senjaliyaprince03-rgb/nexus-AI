import { beforeEach, describe, expect, it, vi } from "vitest"

const mockApiGet = vi.fn()
const mockApiPost = vi.fn()
const mockGetToken = vi.fn()
const mockSetToken = vi.fn()
const mockClearToken = vi.fn()
const mockSessionGetItem = vi.fn()
const mockSessionSetItem = vi.fn()
const mockSessionRemoveItem = vi.fn()
const mockFetch = vi.fn()

vi.mock("@/lib/api", () => ({
  api: {
    get: mockApiGet,
    post: mockApiPost,
  },
  getToken: mockGetToken,
  setToken: mockSetToken,
  clearToken: mockClearToken,
}))

vi.mock("@/lib/storage", () => ({
  getSafeLocalStorage: () => localStorage,
  getSafeSessionStorage: () => ({
    getItem: mockSessionGetItem,
    setItem: mockSessionSetItem,
    removeItem: mockSessionRemoveItem,
  }),
}))

vi.mock("@/lib/auth", () => ({
  login: vi.fn(),
  register: vi.fn(),
  firebaseGoogleLogin: vi.fn(),
  firebaseGithubLogin: vi.fn(),
}))

describe("authStore", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
    mockGetToken.mockReturnValue(null)
    mockSessionGetItem.mockReturnValue(null)
    vi.stubGlobal("fetch", mockFetch)
  })

  it("refreshes the session before requesting the current user when a refresh token exists", async () => {
    mockSessionGetItem.mockImplementation((key: string) => (key === "nexusai_refresh" ? "refresh-123" : null))
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({
      access_token: "access-456",
      refresh_token: "refresh-456",
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }))
    mockApiGet.mockResolvedValue({
      user: {
        id: "user-1",
        email: "admin@example.com",
        role: "admin",
        workspace_id: "workspace-1",
        created_at: "2026-06-22T00:00:00.000Z",
      },
      workspace: null,
    })

    const { useAuthStore } = await import("@/store/authStore")

    await useAuthStore.getState().fetchUser()

    expect(mockFetch).toHaveBeenNthCalledWith(1, "/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    })
    expect(mockApiGet).toHaveBeenCalledWith("/api/auth/me")
    expect(mockSetToken).toHaveBeenCalledWith("access-456")
    expect(mockSessionSetItem).toHaveBeenCalledWith("nexusai_refresh", "refresh-456")
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().sessionChecked).toBe(true)
  })
})
