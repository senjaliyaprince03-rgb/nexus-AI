"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { AlertCircle, RefreshCcw } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl p-8 border border-[rgba(0,0,0,0.06)] shadow-[0_8px_32px_rgba(0,0,0,0.04)] text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C5A059] to-[#FF8C35]" />
        
        <div className="w-16 h-16 mx-auto bg-[#FFF0EB] text-[#C5A059] rounded-2xl flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        
        <h2 className="text-2xl font-display font-medium text-[#18181B] mb-3">
          Something went wrong
        </h2>
        
        <p className="text-[#4B5563] text-sm mb-8 leading-relaxed">
          We encountered an unexpected issue while loading this page. Our systems have logged the error.
        </p>

        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center gap-2 w-full bg-[#18181B] text-white py-3 px-4 rounded-xl font-medium hover:bg-[#1A1A1A] transition-colors"
        >
          <RefreshCcw className="w-4 h-4" />
          Try again
        </button>
      </motion.div>
    </div>
  )
}
