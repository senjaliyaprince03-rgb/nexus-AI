import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useAuthStore } from "@/store/auth";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();

vi.stubGlobal("localStorage", localStorageMock);

describe("useAuthStore", () => {
  beforeEach(() => {
    localStorageMock.clear();
    // Reset store between tests
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
    });
  });

  it("initialises with null tokens and no user", () => {
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.accessToken).toBeNull();
    expect(result.current.refreshToken).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it("setAuth stores tokens in state and localStorage", () => {
    const { result } = renderHook(() => useAuthStore());
    act(() => result.current.setAuth("access-123", "refresh-456"));
    expect(result.current.accessToken).toBe("access-123");
    expect(result.current.refreshToken).toBe("refresh-456");
    expect(localStorage.getItem("access_token")).toBe("access-123");
    expect(localStorage.getItem("refresh_token")).toBe("refresh-456");
  });

  it("setUser stores user profile in state", () => {
    const { result } = renderHook(() => useAuthStore());
    const user = { id: "u1", email: "test@nexusai.dev", full_name: "Test", role: "user", workspace_id: null };
    act(() => result.current.setUser(user));
    expect(result.current.user?.email).toBe("test@nexusai.dev");
  });

  it("clearAuth removes tokens from state and localStorage", () => {
    const { result } = renderHook(() => useAuthStore());
    act(() => result.current.setAuth("access-123", "refresh-456"));
    act(() => result.current.clearAuth());
    expect(result.current.accessToken).toBeNull();
    expect(result.current.refreshToken).toBeNull();
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(localStorage.getItem("refresh_token")).toBeNull();
  });

  it("clearAuth also clears user", () => {
    const { result } = renderHook(() => useAuthStore());
    const user = { id: "u1", email: "test@nexusai.dev", full_name: null, role: "user", workspace_id: "ws-1" };
    act(() => { result.current.setAuth("tok", "ref"); result.current.setUser(user); });
    act(() => result.current.clearAuth());
    expect(result.current.user).toBeNull();
  });
});
