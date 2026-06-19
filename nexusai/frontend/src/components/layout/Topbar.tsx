"use client"

import React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Bell, BellOff, CheckCircle2, LogOut, Moon, ShieldCheck, Sun, Zap } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { LogoMark } from "@/components/brand/LogoMark"
import { useAuth } from "@/hooks/useAuth"
import { useNotificationStore } from "@/store/notificationStore"

export function Topbar({ title }: { title?: string }) {
  const { user, logout, isAdmin, isLoading } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [showNotifications, setShowNotifications] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const notifications = useNotificationStore((state) => state.notifications)
  const markAsRead = useNotificationStore((state) => state.markAsRead)
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead)
  const unreadNotifications = useMemo(() => notifications.filter((notification) => notification.unread), [notifications])
  const unreadCount = unreadNotifications.length

  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.email?.split("@")[0] ||
    (isLoading ? "Loading account" : "Account")
  const displayEmail = user?.email || (isLoading ? "Checking saved session..." : "No active session")

  const handleUpgradeClick = () => {
    router.push("/dashboard/billing")
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  useEffect(() => {
    if (!showNotifications) return

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowNotifications(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [showNotifications])

  return (
    <header className="sticky top-0 z-20 border-b border-[rgba(0,0,0,0.08)] bg-white/80 px-5 backdrop-blur-2xl dark:border-[rgba(255,255,255,0.08)] dark:bg-transparent">
      <div className="mx-auto flex h-[78px] max-w-[calc(100%-1rem)] items-center justify-between gap-4 rounded-b-[28px] border-x border-[rgba(0,0,0,0.06)] px-2 dark:border-[rgba(255,255,255,0.06)]">
        <div className="flex min-w-0 items-center gap-3">
          <LogoMark className="hidden h-11 w-11 rounded-2xl lg:inline-flex" priority />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] dark:text-[#71717A]">Control Room</p>
            <span className="block truncate font-display text-2xl tracking-[-0.03em] text-[#18181B] dark:text-[#F8F9FA]">
              {title ?? "NexusAI"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ y: -1, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleUpgradeClick}
            className="hidden items-center gap-1.5 rounded-full bg-gradient-to-r from-[#C5A059] to-[#FF8C35] px-4 py-1.5 text-xs font-semibold text-white shadow-[0_2px_10px_rgba(255,107,53,0.3)] md:flex"
          >
            <Zap strokeWidth={1.75} className="h-4 w-4 fill-current transition-transform group-hover:scale-110" />
            Upgrade to Pro
          </motion.button>

          {user?.workspace_id && (
            <div className="hidden items-center gap-2 rounded-full border border-[rgba(0,0,0,0.08)] bg-[#F8F9FA] px-3 py-1.5 text-xs font-medium text-[#4B5563] md:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7CB69E] shadow-[0_0_8px_rgba(124,182,158,0.8)] animate-pulse" />
              <span>Workspace Active</span>
            </div>
          )}
          {isAdmin && (
            <span className="hidden items-center gap-1 rounded-full border border-[#C5A059]/30 bg-[#FFF0EB] px-3 py-1 text-xs text-[#C5A059] md:inline-flex">
              <ShieldCheck strokeWidth={1.75} className="h-4 w-4" />
              Admin
            </span>
          )}

          <div className="hidden select-none border-l border-[rgba(0,0,0,0.08)] pl-4 text-right sm:block dark:border-[rgba(255,255,255,0.1)]">
            <p className="text-sm font-medium text-[#18181B] dark:text-[#F8F9FA]">{displayName}</p>
            <p className="text-[11px] text-[#9CA3AF] dark:text-[#A1A1AA]">{displayEmail}</p>
          </div>

          <div className="ml-2 flex items-center gap-2 border-l border-[rgba(0,0,0,0.08)] pl-4 dark:border-[rgba(255,255,255,0.1)]">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="relative rounded-full p-2 text-[#4B5563] transition-colors hover:bg-[#F8F9FA] dark:text-[#A1A1AA] dark:hover:bg-[#2A2A2A]"
              aria-label="Toggle theme"
            >
              <Sun strokeWidth={1.75} className="h-4 w-4 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0 group-hover:rotate-12" />
              <Moon strokeWidth={1.75} className="absolute left-2 top-2 h-4 w-4 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100 group-hover:-rotate-12" />
            </motion.button>

            <div ref={menuRef} className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotifications((value) => !value)}
                className="relative rounded-full p-2 text-[#4B5563] transition-colors hover:bg-[#F8F9FA] dark:text-[#A1A1AA] dark:hover:bg-[#2A2A2A]"
                aria-label="Notifications"
              >
                <Bell strokeWidth={1.75} className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                {unreadCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-[#C5A059] px-1 text-[9px] font-bold leading-4 text-white ring-2 ring-white dark:ring-[#121212]">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </motion.button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:border-[rgba(255,255,255,0.1)] dark:bg-[#18181A]"
                  >
                    <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.06)] p-4 dark:border-[rgba(255,255,255,0.06)]">
                      <div>
                        <h3 className="text-sm font-semibold text-[#18181B] dark:text-[#F8F9FA]">Notifications</h3>
                        <p className="mt-0.5 text-[11px] text-[#9CA3AF] dark:text-[#A1A1AA]">
                          {unreadCount > 0 ? `${unreadCount} unread` : "No unread notifications"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        disabled={unreadCount === 0}
                        className="text-[11px] font-medium text-[#C5A059] transition hover:text-[#E55A25] disabled:cursor-not-allowed disabled:text-[#C8A38D]"
                      >
                        Mark all as read
                      </button>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto">
                      {unreadNotifications.length > 0 ? (
                        unreadNotifications.map((notification, index) => (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() => {
                              markAsRead(notification.id)
                              setShowNotifications(false)
                            }}
                            className={`block w-full border-b border-[rgba(0,0,0,0.04)] px-4 py-4 text-left transition-colors hover:bg-[#F8F9FA] dark:border-[rgba(255,255,255,0.04)] dark:hover:bg-[#2A2A2A] ${
                              index === unreadNotifications.length - 1 ? "border-b-0" : ""
                            }`}
                          >
                            <div className="flex gap-3">
                              <div className="mt-0.5 shrink-0">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EDF7F1] dark:bg-[#EDF7F1]/10">
                                  <CheckCircle2 strokeWidth={1.75} className="h-[18px] w-[18px] text-[#7CB69E]" />
                                </div>
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-xs font-medium text-[#18181B] dark:text-[#F8F9FA]">{notification.title}</p>
                                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#C5A059]" />
                                </div>
                                <p className="mt-0.5 line-clamp-2 text-[11px] text-[#9CA3AF] dark:text-[#A1A1AA]">
                                  {notification.message}
                                </p>
                                <p className="mt-1.5 text-[10px] text-[#9CA3AF] dark:text-[#A1A1AA]">
                                  {formatRelativeTime(notification.createdAt)}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="flex flex-col items-center gap-3 px-5 py-8 text-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F8F9FA] text-[#9CA3AF] dark:bg-[#2A2A2A] dark:text-[#A1A1AA]">
                            <BellOff strokeWidth={1.75} className="h-5 w-5 opacity-70" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#18181B] dark:text-[#F8F9FA]">All caught up</p>
                            <p className="mt-1 text-xs leading-5 text-[#9CA3AF] dark:text-[#A1A1AA]">
                              New document, agent, and workspace updates will appear here.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              whileHover={{ y: -1, backgroundColor: "var(--bg-secondary)" }}
              onClick={() => logout()}
              className="ml-2 inline-flex items-center gap-2 rounded-full border border-[rgba(0,0,0,0.12)] bg-white px-4 py-2 text-xs font-medium text-[#4B5563] shadow-sm transition-all hover:text-[#18181B] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#18181A] dark:text-[#A1A1AA] dark:hover:text-[#F8F9FA]"
            >
              <LogOut strokeWidth={1.75} className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Sign out
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  )
}

function formatRelativeTime(value: string) {
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return "recently"
  const diff = Math.max(0, Date.now() - time)
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
