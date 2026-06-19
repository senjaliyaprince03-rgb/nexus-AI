"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { LogoMark } from "@/components/brand/LogoMark"
import { Button } from "@/components/ui/button"

const LINKS = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Features",     href: "/#features" },
  { label: "Pricing",      href: "/#pricing" },
  { label: "Experts",      href: "/#experts" },
]

export function Navbar() {
  const [scrolled, setScrolled]   = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  const loginHref = "/login"
  const signupHref = "/signup"
  const loginLabel = "Log in"
  const signupLabel = "Get Started →"
  const isDark = mounted ? theme === "dark" : false

  return (
    <>
      <header
        className={`
          landing-header-shell transition-all duration-300
          ${scrolled
            ? "bg-[var(--landing-bg)] backdrop-blur-md border-b border-[var(--landing-border)] shadow-[0_1px_8px_rgba(0,0,0,0.18)]"
            : "bg-transparent"
          }
        `}
      >
        <nav className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <LogoMark className="h-10 w-10 rounded-lg transition-transform duration-200 group-hover:scale-110" priority />
            <span className="text-lg font-semibold tracking-tight text-[var(--landing-text)]">
              NexusAI
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-2">
            {LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-5 py-2.5 text-[15px] font-medium text-[var(--landing-text-secondary)]
                           transition-all duration-150 hover:bg-[var(--landing-surface-strong)] hover:text-[var(--landing-text)]"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--landing-border)] bg-[var(--landing-surface)] text-[var(--landing-text-secondary)] shadow-sm transition hover:border-[var(--landing-border-soft)] hover:text-[var(--landing-text)]"
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </button>
            <Button href={loginHref} variant="ghost" className="px-6 !text-[var(--landing-text-secondary)] hover:!bg-[var(--landing-surface-strong)] hover:!text-[var(--landing-text)]">
              {loginLabel}
            </Button>
            <Button href={signupHref} variant="primary" className="px-6">
              {signupLabel}
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--landing-surface-strong)] text-[var(--landing-text)]"
            aria-label="Toggle menu"
          >
            <span className="text-lg">{menuOpen ? "✕" : "☰"}</span>
          </button>
        </nav>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-x-0 top-16 z-40 border-b border-[var(--landing-border)] bg-[var(--landing-bg)] shadow-[0_12px_30px_rgba(0,0,0,0.25)] md:hidden"
        >
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-1">
              {LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm text-[var(--landing-text-secondary)] transition-colors hover:bg-[var(--landing-surface-strong)] hover:text-[var(--landing-text)]"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-1 flex gap-3 border-t border-[var(--landing-border)] pt-3">
                <button
                  type="button"
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                  className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--landing-border)] bg-[var(--landing-surface)] text-[var(--landing-text-secondary)] shadow-sm transition hover:border-[var(--landing-border-soft)] hover:text-[var(--landing-text)]"
                  aria-label="Toggle theme"
                >
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </button>
                <Button href={loginHref} variant="secondary" size="sm" className="flex-1">
                  {loginLabel}
                </Button>
                <Button href={signupHref} variant="primary" size="sm" className="flex-1">
                  {signupLabel}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
