"use client"

import { motion } from "framer-motion"

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 sm:p-8 relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto relative z-10">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="w-24 h-6 rounded-full bg-black/5 animate-pulse mb-4" />
            <div className="w-64 h-10 rounded-lg bg-black/5 animate-pulse mb-2" />
            <div className="w-96 h-4 rounded-lg bg-black/5 animate-pulse" />
          </div>
          <div className="w-48 h-16 rounded-2xl bg-black/5 animate-pulse" />
        </div>

        <div className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/70 rounded-2xl border border-[#F8F9FA]/50 p-6 h-40">
              <div className="flex items-center justify-between mb-6">
                <div className="w-24 h-3 rounded-full bg-black/5 animate-pulse" />
                <div className="w-10 h-10 rounded-xl bg-black/5 animate-pulse" />
              </div>
              <div className="w-16 h-8 rounded-lg bg-black/5 animate-pulse mb-4" />
              <div className="w-40 h-3 rounded-full bg-black/5 animate-pulse" />
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="bg-white rounded-3xl border border-[rgba(0,0,0,0.06)] p-8 h-80">
            <div className="w-32 h-3 rounded-full bg-black/5 animate-pulse mb-6" />
            <div className="w-64 h-6 rounded-lg bg-black/5 animate-pulse mb-4" />
            <div className="w-full max-w-xl h-16 rounded-xl bg-black/5 animate-pulse" />
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-black/5 rounded-2xl h-32 animate-pulse" />
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-3xl border border-[rgba(0,0,0,0.06)] p-8 h-80">
            <div className="w-32 h-3 rounded-full bg-black/5 animate-pulse mb-6" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-full h-16 rounded-2xl bg-black/5 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
