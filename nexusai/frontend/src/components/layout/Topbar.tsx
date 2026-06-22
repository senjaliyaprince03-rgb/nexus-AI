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
import { useI18n } from "@/lib/i18n"
import type { Language } from "@/locales/translations"

const TOPBAR_LABELS: Record<Language, { upgrade: string; workspaceActive: string; unread: string; now: string; recently: string; minutesAgo: string; hoursAgo: string; daysAgo: string }> = {
  en: {
    upgrade: "Upgrade to Pro",
    workspaceActive: "Workspace Active",
    unread: "unread",
    now: "now",
    recently: "recently",
    minutesAgo: "m ago",
    hoursAgo: "h ago",
    daysAgo: "d ago",
  },
  es: {
    upgrade: "Actualizar a Pro",
    workspaceActive: "Espacio activo",
    unread: "sin leer",
    now: "ahora",
    recently: "reciente",
    minutesAgo: "min",
    hoursAgo: "h",
    daysAgo: "d",
  },
  fr: {
    upgrade: "Passer a Pro",
    workspaceActive: "Espace actif",
    unread: "non lus",
    now: "maintenant",
    recently: "recent",
    minutesAgo: "min",
    hoursAgo: "h",
    daysAgo: "j",
  },
  de: {
    upgrade: "Auf Pro wechseln",
    workspaceActive: "Arbeitsbereich aktiv",
    unread: "ungelesen",
    now: "jetzt",
    recently: "vor kurzem",
    minutesAgo: "Min.",
    hoursAgo: "Std.",
    daysAgo: "T.",
  },
}

export function Topbar({ title }: { title?: string }) {
  const { user, logout, isAdmin, isLoading } = useAuth()
  const router = useRouter()
  const { setTheme, resolvedTheme } = useTheme()
  const { t, language } = useI18n()
  const copy = TOPBAR_LABELS[language] || TOPBAR_LABELS.en
  const [showNotifications, setShowNotifications] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const notifications = useNotificationStore((state) => state.notifications)
  const markAsRead = useNotificationStore((state) => state.markAsRead)
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead)
  const unreadNotifications = useMemo(() => notifications.filter((notification) => notification.unread), [notifications])
  const unreadCount = unreadNotifications.length

  const displayId =
    user?.email?.split("@")[0] ||
    user?.first_name ||
    user?.id ||
    (isLoading ? t("checkingSession") : t("account"))
  const displayEmail = user?.email || (isLoading ? t("checkingSession") : t("noSession"))

  const handleUpgradeClick = () => {
    router.push("/dashboard/billing")
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
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
    <header className="sticky top-0 z-20 border-b border-[rgba(0,0,0,0.08)] bg-white px-5 backdrop-blur-2xl dark:border-[rgba(255,255,255,0.08)] dark:bg-transparent">
      <div className="mx-auto flex h-[78px] max-w-[calc(100%-1rem)] items-center justify-between gap-5 border-x border-[rgba(0,0,0,0.06)] px-4 dark:border-[rgba(255,255,255,0.06)]">
        <div className="flex min-w-0 items-center gap-4">
          <LogoMark className="hidden h-11 w-11 rounded-2xl lg:inline-flex" priority />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B0B7C3] dark:text-[#71717A]">{t("controlRoom")}</p>
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
            className="hidden items-center gap-1.5 rounded-full bg-gradient-to-r from-[#D69B3C] to-[#FF8C35] px-5 py-2 text-xs font-semibold text-white shadow-[0_2px_10px_rgba(255,107,53,0.28)] md:flex"
          >
            <Zap strokeWidth={1.75} className="h-4 w-4 fill-current transition-transform group-hover:scale-110" />
            {copy.upgrade}
          </motion.button>

          {user?.workspace_id && (
            <div className="hidden min-h-[42px] items-center gap-2 rounded-full border border-[rgba(0,0,0,0.08)] bg-[#FAFAFA] px-4 py-2 text-xs font-semibold text-[#64748B] shadow-[0_1px_2px_rgba(0,0,0,0.02)] md:flex dark:border-[rgba(255,255,255,0.1)] dark:bg-[#18181A] dark:text-[#D4D4D8]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7CB69E] shadow-[0_0_8px_rgba(124,182,158,0.8)] animate-pulse" />
              <span>{copy.workspaceActive}</span>
            </div>
          )}
          {isAdmin && (
            <span className="hidden items-center gap-1 rounded-full border border-[#C5A059]/30 bg-[rgba(212,175,55,0.08)] px-3 py-1 text-xs text-[#C5A059] md:inline-flex">
              <ShieldCheck strokeWidth={1.75} className="h-4 w-4" />
              {t("admin")}
            </span>
          )}

          <div className="hidden min-h-[50px] min-w-[210px] select-none border-l border-[rgba(0,0,0,0.08)] pl-5 text-center sm:flex sm:flex-col sm:justify-center dark:border-[rgba(255,255,255,0.1)]">
            <p className="truncate text-sm font-semibold leading-5 text-[#3F3F46] dark:text-[#F8F9FA]">{displayId}</p>
            <p className="truncate text-[11px] leading-4 text-[#A1A1AA] dark:text-[#A1A1AA]">{displayEmail}</p>
          </div>

          <div className="ml-1 flex items-center gap-2 border-l border-[rgba(0,0,0,0.08)] pl-5 dark:border-[rgba(255,255,255,0.1)]">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="relative rounded-full p-2 text-[#6B7280] transition-colors hover:bg-[#F8F9FA] dark:text-[#A1A1AA] dark:hover:bg-[#2A2A2A]"
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
                className="relative rounded-full p-2 text-[#6B7280] transition-colors hover:bg-[#F8F9FA] dark:text-[#A1A1AA] dark:hover:bg-[#2A2A2A]"
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
                        <h3 className="text-sm font-semibold text-[#18181B] dark:text-[#F8F9FA]">{t("notifications")}</h3>
                        <p className="mt-0.5 text-[11px] text-[#9CA3AF] dark:text-[#A1A1AA]">
                          {unreadCount > 0 ? `${unreadCount} ${copy.unread}` : t("noUnread")}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        disabled={unreadCount === 0}
                        className="text-[11px] font-medium text-[#C5A059] transition hover:text-[#E55A25] disabled:cursor-not-allowed disabled:text-[#C8A38D]"
                      >
                        {t("markAllAsRead")}
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
                                  {formatRelativeTime(notification.createdAt, copy)}
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
                            <p className="text-sm font-semibold text-[#18181B] dark:text-[#F8F9FA]">{t("allCaughtUp")}</p>
                            <p className="mt-1 text-xs leading-5 text-[#9CA3AF] dark:text-[#A1A1AA]">
                              {t("newUpdates")}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => logout()}
              className="group ml-2 inline-flex min-h-[42px] items-center gap-2 rounded-full border border-[rgba(0,0,0,0.12)] bg-white px-5 py-2 text-xs font-medium text-[#6B7280] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:text-[#18181B] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#18181A] dark:text-[#A1A1AA] dark:hover:bg-[#202022] dark:hover:text-[#F8F9FA]"
            >
              <LogOut strokeWidth={1.75} className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              {t("signOut")}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

function formatRelativeTime(value: string, copy: (typeof TOPBAR_LABELS)[Language]) {
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return copy.recently
  const diff = Math.max(0, Date.now() - time)
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return copy.now
  if (minutes < 60) return `${minutes}${copy.minutesAgo}`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}${copy.hoursAgo}`
  return `${Math.floor(hours / 24)}${copy.daysAgo}`
}

