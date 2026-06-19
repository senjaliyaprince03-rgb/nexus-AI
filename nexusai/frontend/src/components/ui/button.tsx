import Link from "next/link"
import { cn } from "@/lib/utils"

interface ButtonProps {
  href?: string
  onClick?: () => void
  variant?: "primary" | "secondary" | "ghost" | "default"
  size?: "sm" | "md" | "lg"
  children: React.ReactNode
  className?: string
  type?: "button" | "submit"
  disabled?: boolean
  external?: boolean
  asChild?: boolean
}

export function Button({
  href,
  onClick,
  variant = "primary",
  size = "md",
  children,
  className,
  type = "button",
  disabled,
  external,
  asChild,
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold tracking-tight " +
    "rounded-full transition-all duration-200 focus-visible:outline-none " +
    "focus-visible:ring-2 focus-visible:ring-[#C5A059] disabled:opacity-50 " +
    "disabled:cursor-not-allowed select-none"

  const variants: Record<string, string> = {
    primary:
      "bg-[#C5A059] text-white hover:bg-[#E55A25] " +
      "shadow-[0_2px_8px_rgba(255,107,53,0.35)] " +
      "hover:shadow-[0_4px_16px_rgba(255,107,53,0.45)] " +
      "hover:scale-[1.02] active:scale-[0.98]",
    secondary:
      "bg-white text-[#18181B] border border-[rgba(0,0,0,0.12)] " +
      "hover:border-[rgba(0,0,0,0.2)] hover:shadow-card hover:scale-[1.02]",
    ghost:
      "text-[#4B5563] hover:text-[#18181B] hover:bg-[#F8F7F4]",
    default:
      "bg-[#C5A059] text-white hover:bg-[#E55A25] " +
      "shadow-[0_2px_8px_rgba(255,107,53,0.35)] " +
      "hover:shadow-[0_4px_16px_rgba(255,107,53,0.45)] " +
      "hover:scale-[1.02] active:scale-[0.98]",
  }

  const sizes: Record<string, string> = {
    sm: "h-9 px-4 text-sm",
    md: "h-10 px-6 text-sm",
    lg: "h-12 px-8 text-base",
  }

  const cls = cn(base, variants[variant], sizes[size], className)

  // If asChild, just render children wrapped in a styled div
  if (asChild) {
    return (
      <span className={cls}>
        {children}
      </span>
    )
  }

  if (href) {
    return external ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    ) : (
      <Link href={href} className={cls}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  )
}
