"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { getSafeLocalStorage } from "@/lib/storage"

export type NotificationTone = "blue" | "green" | "amber" | "violet"

export type NotificationItem = {
  id: string
  title: string
  message: string
  createdAt: string
  unread: boolean
  tone: NotificationTone
}

type NotificationInput = Omit<NotificationItem, "id" | "createdAt" | "unread"> &
  Partial<Pick<NotificationItem, "id" | "createdAt" | "unread">>

type NotificationState = {
  notifications: NotificationItem[]
  addNotification: (notification: NotificationInput) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
}

const STORAGE_KEY = "nexusai-notifications"

function createNotificationId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `notification-${Date.now()}`
}

function normalizeNotification(notification: NotificationInput): NotificationItem {
  return {
    id: notification.id ?? createNotificationId(),
    title: notification.title,
    message: notification.message,
    createdAt: notification.createdAt ?? new Date().toISOString(),
    unread: notification.unread ?? true,
    tone: notification.tone,
  }
}

function createNotificationStore() {
  return create<NotificationState>()(
    persist(
      (set) => ({
        notifications: [],
        addNotification: (notification) =>
          set((state) => ({
            notifications: [normalizeNotification(notification), ...state.notifications],
          })),
        markAsRead: (id) =>
          set((state) => ({
            notifications: state.notifications.map((notification) =>
              notification.id === id ? { ...notification, unread: false } : notification,
            ),
          })),
        markAllAsRead: () =>
          set((state) => ({
            notifications: state.notifications.map((notification) => ({
              ...notification,
              unread: false,
            })),
          })),
        clearAll: () => set({ notifications: [] }),
      }),
      {
        name: STORAGE_KEY,
        storage: createJSONStorage(() => getSafeLocalStorage()),
        partialize: (state) => ({ notifications: state.notifications }),
      },
    ),
  )
}

export const useNotificationStore = createNotificationStore()
export const notificationStorageKey = STORAGE_KEY
