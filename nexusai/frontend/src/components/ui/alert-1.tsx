"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button-1"
import { cn } from "@/lib/utils"

const alertVariants = cva("flex w-full items-stretch gap-2", {
  variants: {
    variant: {
      secondary: "",
      primary: "",
      destructive: "",
      success: "",
      info: "",
      mono: "",
      warning: "",
    },
    icon: {
      primary: "",
      destructive: "",
      success: "",
      info: "",
      warning: "",
    },
    appearance: {
      solid: "",
      outline: "",
      light: "",
      stroke: "text-[hsl(var(--foreground))]",
    },
    size: {
      lg: "rounded-lg gap-3 p-4 text-base [&>[data-slot=alert-icon]>svg]:size-6 [&_[data-slot=alert-close]]:mt-1",
      md: "rounded-lg gap-2.5 p-3.5 text-sm [&>[data-slot=alert-icon]>svg]:size-5 [&_[data-slot=alert-close]]:mt-0.5",
      sm: "rounded-md gap-2 px-3 py-2.5 text-xs [&>[data-slot=alert-icon]>svg]:size-4 [&_[data-slot=alert-close]_svg]:size-3.5",
    },
  },
  compoundVariants: [
    { variant: "secondary", appearance: "solid", className: "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]" },
    { variant: "primary", appearance: "solid", className: "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]" },
    { variant: "destructive", appearance: "solid", className: "bg-red-600 text-white" },
    { variant: "success", appearance: "solid", className: "bg-emerald-600 text-white" },
    { variant: "info", appearance: "solid", className: "bg-violet-600 text-white" },
    { variant: "warning", appearance: "solid", className: "bg-amber-500 text-black" },
    { variant: "mono", appearance: "solid", className: "bg-zinc-950 text-white dark:bg-zinc-300 dark:text-black" },

    {
      variant: "secondary",
      appearance: "outline",
      className: "border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]",
    },
    {
      variant: "primary",
      appearance: "outline",
      className: "border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-white",
    },
    {
      variant: "destructive",
      appearance: "outline",
      className: "border border-red-500/40 bg-[hsl(var(--background))] text-red-400",
    },
    {
      variant: "success",
      appearance: "outline",
      className: "border border-emerald-500/40 bg-[hsl(var(--background))] text-emerald-400",
    },
    {
      variant: "info",
      appearance: "outline",
      className: "border border-violet-500/40 bg-[hsl(var(--background))] text-violet-400",
    },
    {
      variant: "warning",
      appearance: "outline",
      className: "border border-amber-500/40 bg-[hsl(var(--background))] text-amber-400",
    },
    {
      variant: "mono",
      appearance: "outline",
      className: "border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]",
    },

    {
      variant: "secondary",
      appearance: "light",
      className: "border border-[hsl(var(--border))] bg-white/5 text-[hsl(var(--foreground))]",
    },
    {
      variant: "primary",
      appearance: "light",
      className: "border border-blue-400/20 bg-blue-500/10 text-[hsl(var(--foreground))] [&_[data-slot=alert-icon]]:text-blue-300",
    },
    {
      variant: "destructive",
      appearance: "light",
      className: "border border-red-400/20 bg-red-500/10 text-[hsl(var(--foreground))] [&_[data-slot=alert-icon]]:text-red-400",
    },
    {
      variant: "success",
      appearance: "light",
      className: "border border-emerald-400/20 bg-emerald-500/10 text-[hsl(var(--foreground))] [&_[data-slot=alert-icon]]:text-emerald-400",
    },
    {
      variant: "info",
      appearance: "light",
      className: "border border-violet-400/20 bg-violet-500/10 text-[hsl(var(--foreground))] [&_[data-slot=alert-icon]]:text-violet-400",
    },
    {
      variant: "warning",
      appearance: "light",
      className: "border border-amber-400/20 bg-amber-500/10 text-[hsl(var(--foreground))] [&_[data-slot=alert-icon]]:text-amber-400",
    },

    { variant: "mono", icon: "primary", className: "[&_[data-slot=alert-icon]]:text-blue-400" },
    { variant: "mono", icon: "warning", className: "[&_[data-slot=alert-icon]]:text-amber-400" },
    { variant: "mono", icon: "success", className: "[&_[data-slot=alert-icon]]:text-emerald-400" },
    { variant: "mono", icon: "destructive", className: "[&_[data-slot=alert-icon]]:text-red-400" },
    { variant: "mono", icon: "info", className: "[&_[data-slot=alert-icon]]:text-violet-400" },
  ],
  defaultVariants: {
    variant: "secondary",
    appearance: "solid",
    size: "md",
  },
})

interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  close?: boolean
  onClose?: () => void
}

interface AlertIconProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {}

function Alert({
  className,
  variant,
  size,
  icon,
  appearance,
  close = false,
  onClose,
  children,
  ...props
}: AlertProps) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant, size, icon, appearance }), className)}
      {...props}
    >
      {children}
      {close && (
        <Button
          size="sm"
          variant="inverse"
          mode="icon"
          onClick={onClose}
          aria-label="Dismiss"
          data-slot="alert-close"
          className="size-4 shrink-0"
        >
          <X className="size-4 opacity-60 transition-opacity group-hover:opacity-100" />
        </Button>
      )}
    </div>
  )
}

function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <div data-slot="alert-title" className={cn("grow tracking-tight", className)} {...props} />
}

function AlertIcon({ children, className, ...props }: AlertIconProps) {
  return (
    <div data-slot="alert-icon" className={cn("shrink-0", className)} {...props}>
      {children}
    </div>
  )
}

function AlertToolbar({ children, className, ...props }: AlertIconProps) {
  return (
    <div data-slot="alert-toolbar" className={cn(className)} {...props}>
      {children}
    </div>
  )
}

function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      data-slot="alert-description"
      className={cn("text-sm [&_p]:mb-2 [&_p]:leading-relaxed", className)}
      {...props}
    />
  )
}

function AlertContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="alert-content"
      className={cn("space-y-2 [&_[data-slot=alert-title]]:font-semibold", className)}
      {...props}
    />
  )
}

export { Alert, AlertContent, AlertDescription, AlertIcon, AlertTitle, AlertToolbar }

