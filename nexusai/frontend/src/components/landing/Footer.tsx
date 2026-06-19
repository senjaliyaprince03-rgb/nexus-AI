import Link from "next/link"
import { LogoMark } from "@/components/brand/LogoMark"

export function Footer() {
  return (
    <footer className="border-t border-slate-800/60 py-12 px-6 bg-[#020617]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <LogoMark className="h-8 w-8 rounded-lg" />
          <span className="font-syne font-semibold text-slate-200">NexusAI</span>
        </div>
        <div className="flex gap-6 text-sm text-slate-500">
          <Link href="/login" className="hover:text-slate-300 transition-colors">Sign in</Link>
          <Link href="/signup" className="hover:text-slate-300 transition-colors">Sign up</Link>
        </div>
        <p className="text-xs text-slate-700">© 2026 NexusAI · MIT License</p>
      </div>
    </footer>
  )
}
