"use client"

import { AlertCircle } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-[#F8F9FA] text-[#18181B] min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[rgba(0,0,0,0.06)] shadow-[0_8px_32px_rgba(0,0,0,0.04)] text-center">
          <div className="w-16 h-16 mx-auto bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-display font-medium mb-3">Critical Error</h2>
          <p className="text-[#4B5563] text-sm mb-8 leading-relaxed">
            A fatal error occurred at the application level. 
          </p>
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center w-full bg-[#18181B] text-white py-3 px-4 rounded-xl font-medium hover:bg-[#1A1A1A] transition-colors"
          >
            Restart Application
          </button>
        </div>
      </body>
    </html>
  )
}
