"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { getSafeLocalStorage } from "@/lib/storage"

export function CookieBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Only show if consent has not been set yet
    const consent = getSafeLocalStorage().getItem("nexusai-cookie-consent")
    if (!consent) {
      // Add slight delay before showing for premium feel
      const timer = setTimeout(() => setShow(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleConsent = (value: "accept" | "decline") => {
    getSafeLocalStorage().setItem("nexusai-cookie-consent", value)
    setShow(false)
  }

  const handleSettings = () => {
    // In a full implementation, this would open a detailed cookie preference modal.
    // For now, we will simply log or show an alert, or even just set a specific setting.
    console.log("Opening cookie settings...")
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", bounce: 0, duration: 0.6 }}
          className="fixed bottom-24 left-4 right-4 z-30 md:bottom-6 md:left-6 md:right-auto md:w-[420px] lg:w-[440px]
                     bg-[var(--landing-surface)] border border-[var(--landing-border)] rounded-2xl shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)]
                     max-h-[calc(100vh-2rem)] overflow-y-auto p-5 md:p-6 flex flex-col gap-5"
        >
          {/* Subtle accent line at the top */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C5A059] to-[#FFA382]" />
          
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#FFF0EB] text-[#C5A059] flex items-center justify-center flex-shrink-0 mt-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="mb-1.5 text-base font-semibold text-[var(--landing-text)]">
                We value your privacy
              </h3>
              <p className="text-sm leading-relaxed text-[var(--landing-text-secondary)]">
                NexusAI uses cookies to enhance your Multi-Agent RAG experience, 
                remember your workspace preferences, and ensure our services 
                operate securely. By choosing &ldquo;Accept&rdquo;, you agree to our use of cookies.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col items-center justify-between gap-3 border-t border-[var(--landing-border-soft)] pt-2 sm:flex-row">
            <button 
              onClick={handleSettings}
              className="w-full text-left text-xs font-semibold tracking-wide text-[var(--landing-text-muted)] transition-colors hover:text-[var(--landing-text)] sm:w-auto sm:text-center"
            >
              COOKIE SETTINGS
            </button>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => handleConsent("decline")}
                className="w-full rounded-full border border-[var(--landing-border)] px-5 py-2.5 text-sm font-medium text-[var(--landing-text-secondary)] transition-colors hover:bg-[var(--landing-bg-muted)] hover:text-[var(--landing-text)] sm:w-auto"
              >
                Decline
              </button>
              <button
                onClick={() => handleConsent("accept")}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#C5A059] text-white text-sm font-medium hover:bg-[#E55A25] shadow-[0_2px_8px_rgba(255,107,53,0.35)] transition-all"
              >
                Accept All
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
