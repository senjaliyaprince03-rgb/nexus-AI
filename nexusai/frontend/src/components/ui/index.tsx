// Base UI primitives for NexusAI
// Simplified shadcn/ui-style components with Tailwind
import { cn } from "@/lib/utils"
import { forwardRef } from "react"

// ── Button ────────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "md", ...props }, ref) => {
    const variants = {
      primary: "bg-amber-500 text-slate-950 hover:bg-amber-400 font-medium",
      secondary: "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700/50",
      ghost: "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50",
      danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20",
    }
    const sizes = { sm: "px-3 py-1.5 text-xs rounded-lg", md: "px-4 py-2 text-sm rounded-xl", lg: "px-6 py-3 text-base rounded-xl" }
    return (
      <button ref={ref}
        className={cn("inline-flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed", variants[variant], sizes[size], className)}
        {...props} />
    )
  }
)
Button.displayName = "Button"

// ── Input ─────────────────────────────────────────────────────────────────────
export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref}
      className={cn("w-full bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-amber-500/50 transition-colors", className)}
      {...props} />
  )
)
Input.displayName = "Input"

// ── Badge ─────────────────────────────────────────────────────────────────────
interface BadgeProps { children: React.ReactNode; variant?: "default" | "success" | "warning" | "danger"; className?: string }
export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-slate-700/60 text-slate-300",
    success: "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20",
    warning: "bg-amber-400/10 text-amber-400 border border-amber-400/20",
    danger: "bg-red-400/10 text-red-400 border border-red-400/20",
  }
  return <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", variants[variant], className)}>{children}</span>
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-slate-800 rounded-lg", className)} />
}

// ── Dialog (simple modal) ─────────────────────────────────────────────────────
interface DialogProps { open: boolean; onClose: () => void; title: string; children: React.ReactNode }
export function Dialog({ open, onClose, title, children }: DialogProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700/60 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
interface TooltipProps { children: React.ReactNode; content: string }
export function Tooltip({ children, content }: TooltipProps) {
  return (
    <div className="relative group inline-block">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 border border-slate-700/50 rounded-lg text-xs text-slate-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        {content}
      </div>
    </div>
  )
}
