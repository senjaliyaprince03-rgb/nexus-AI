import { beforeEach, describe, expect, it, vi } from "vitest"
import { notificationStorageKey, useNotificationStore } from "@/store/notificationStore"

describe("notificationStore", () => {
  beforeEach(() => {
    localStorage.clear()
    useNotificationStore.getState().clearAll()
  })

  it("tracks unread notifications and marks all as read", () => {
    useNotificationStore.getState().addNotification({
      title: "Document processing complete",
      message: '"Q3_Financial_Report.pdf" is ready for querying.',
      tone: "green",
      createdAt: "2026-06-05T08:30:00.000Z",
    })

    expect(useNotificationStore.getState().notifications).toHaveLength(1)
    expect(useNotificationStore.getState().notifications[0].unread).toBe(true)

    useNotificationStore.getState().markAllAsRead()

    expect(useNotificationStore.getState().notifications.every((notification) => notification.unread === false)).toBe(true)
  })

  it("persists notifications to localStorage and restores them on reload", async () => {
    useNotificationStore.getState().addNotification({
      title: "Workspace synced",
      message: "Your latest dashboard data is ready.",
      tone: "blue",
      createdAt: "2026-06-05T08:30:00.000Z",
    })

    const persisted = JSON.parse(localStorage.getItem(notificationStorageKey) ?? "{}") as {
      state?: { notifications?: Array<{ title: string }> }
    }

    expect(persisted.state?.notifications).toHaveLength(1)
    expect(persisted.state?.notifications?.[0]?.title).toBe("Workspace synced")

    vi.resetModules()
    const { useNotificationStore: reloadedStore } = await import("@/store/notificationStore")

    expect(reloadedStore.getState().notifications).toHaveLength(1)
    expect(reloadedStore.getState().notifications[0].title).toBe("Workspace synced")
  })

  it("supports clearing all notifications for an empty state", () => {
    useNotificationStore.getState().addNotification({
      title: "New module available",
      message: "Open the module catalog to review it.",
      tone: "violet",
      createdAt: "2026-06-05T08:30:00.000Z",
    })

    useNotificationStore.getState().clearAll()

    expect(useNotificationStore.getState().notifications).toHaveLength(0)
  })
})
