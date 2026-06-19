import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { Topbar } from "@/components/layout/Topbar"
import { useNotificationStore } from "@/store/notificationStore"

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}))

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      first_name: "Mock",
      last_name: "User",
      email: "mock-user@nexusai.dev",
      workspace_id: "workspace-1",
    },
    logout: vi.fn(),
    isAdmin: false,
    isLoading: false,
  }),
}))

vi.mock("@/components/brand/LogoMark", () => ({
  LogoMark: () => <div data-testid="logo-mark" />,
}))

describe("Topbar notifications", () => {
  beforeEach(() => {
    useNotificationStore.getState().clearAll()
    useNotificationStore.getState().addNotification({
      title: "Document processing complete",
      message: '"Q3_Financial_Report.pdf" is ready for querying.',
      tone: "green",
      createdAt: "2026-06-05T08:30:00.000Z",
    })
  })

  it("clears the unread indicator when mark all as read is clicked", () => {
    render(<Topbar />)

    fireEvent.click(screen.getByLabelText("Notifications"))
    expect(screen.getByText("1 unread")).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: "Mark all as read" }))

    expect(screen.getByText("All caught up")).toBeTruthy()
    expect(screen.queryByText("1 unread")).toBeNull()
  })
})
