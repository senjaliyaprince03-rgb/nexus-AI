"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mb-5">
        <span className="text-xl">⚠️</span>
      </div>

      <h2 className="text-base font-semibold text-[#18181B] mb-2">Something went wrong</h2>

      <p className="text-sm text-[#4B5563] max-w-xs mb-1 leading-relaxed">
        {error.message || "An unexpected error occurred in this page."}
      </p>

      {error.digest && (
        <p className="text-xs text-[#9CA3AF] font-mono mb-5">
          Error ID: {error.digest}
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 text-sm font-medium bg-[#C5A059] text-white rounded-full hover:bg-[#E55A25] transition-colors shadow-[0_2px_8px_rgba(255,107,53,0.35)]"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="px-4 py-2 text-sm text-[#4B5563] border border-[rgba(0,0,0,0.12)] rounded-full hover:bg-[#F8F7F4] transition-colors"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
