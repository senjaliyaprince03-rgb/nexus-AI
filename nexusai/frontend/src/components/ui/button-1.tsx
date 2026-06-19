"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ChevronDown, type LucideIcon } from "lucide-react"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group inline-flex cursor-pointer items-center justify-center whitespace-nowrap text-sm font-medium transition-[color,box-shadow,background-color] disabled:pointer-events-none disabled:opacity-60 [&_svg]:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25",
  {
    variants: {
      variant: {
        primary: "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90",
        mono: "bg-zinc-950 text-white hover:bg-zinc-900 dark:bg-zinc-300 dark:text-black dark:hover:bg-zinc-200",
        destructive: "bg-red-600 text-white hover:bg-red-500",
        secondary: "bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] hover:opacity-80",
        outline:
          "border border-[hsl(var(--input))] bg-transparent text-[hsl(var(--foreground))] hover:bg-white/5",
        dashed:
          "border border-dashed border-[hsl(var(--input))] bg-transparent text-[hsl(var(--foreground))] hover:bg-white/5",
        ghost: "bg-transparent text-[hsl(var(--foreground))] hover:bg-white/5",
        dim: "bg-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]",
        foreground: "bg-transparent text-[hsl(var(--foreground))]",
        inverse: "bg-transparent text-inherit hover:bg-white/10",
      },
      appearance: {
        default: "",
        ghost: "shadow-none",
      },
      underline: {
        solid: "",
        dashed: "",
      },
      underlined: {
        solid: "",
        dashed: "",
      },
      size: {
        lg: "h-10 gap-1.5 rounded-md px-4 text-sm [&_svg:not([class*=size-])]:size-4",
        md: "h-8.5 gap-1.5 rounded-md px-3 text-[0.8125rem] [&_svg:not([class*=size-])]:size-4",
        sm: "h-7 gap-1.25 rounded-md px-2.5 text-xs [&_svg:not([class*=size-])]:size-3.5",
        icon: "size-8.5 rounded-md p-0 [&_svg:not([class*=size-])]:size-4",
      },
      autoHeight: {
        true: "h-auto",
        false: "",
      },
      shape: {
        default: "",
        circle: "rounded-full",
      },
      mode: {
        default: "",
        icon: "p-0",
        link: "h-auto rounded-none bg-transparent p-0 text-[hsl(var(--foreground))] hover:bg-transparent",
        input:
          "justify-start border border-[hsl(var(--input))] bg-transparent font-normal hover:bg-transparent",
      },
      placeholder: {
        true: "text-[hsl(var(--muted-foreground))]",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "primary",
        mode: "link",
        className: "text-[hsl(var(--primary))] hover:underline hover:underline-offset-4",
      },
      {
        variant: "inverse",
        mode: "link",
        className: "hover:underline hover:underline-offset-4",
      },
      {
        variant: "foreground",
        mode: "link",
        className: "hover:underline hover:underline-offset-4",
      },
      {
        underlined: "solid",
        mode: "link",
        className: "underline underline-offset-4",
      },
      {
        underlined: "dashed",
        mode: "link",
        className: "underline decoration-dashed underline-offset-4",
      },
      {
        underline: "dashed",
        mode: "link",
        className: "hover:decoration-dashed",
      },
      {
        size: "sm",
        mode: "icon",
        className: "h-7 w-7",
      },
      {
        size: "md",
        mode: "icon",
        className: "h-8.5 w-8.5",
      },
      {
        size: "lg",
        mode: "icon",
        className: "h-10 w-10",
      },
    ],
    defaultVariants: {
      variant: "primary",
      mode: "default",
      size: "md",
      shape: "default",
      appearance: "default",
      autoHeight: false,
      placeholder: false,
    },
  },
)

function Button({
  className,
  selected,
  variant,
  shape,
  appearance,
  mode,
  size,
  autoHeight,
  underlined,
  underline,
  asChild = false,
  placeholder = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    selected?: boolean
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(
        buttonVariants({
          variant,
          size,
          shape,
          appearance,
          mode,
          autoHeight,
          placeholder,
          underlined,
          underline,
          className,
        }),
        asChild && props.disabled && "pointer-events-none opacity-50",
      )}
      {...(selected && { "data-state": "open" })}
      {...props}
    />
  )
}

interface ButtonArrowProps extends React.SVGProps<SVGSVGElement> {
  icon?: LucideIcon
}

function ButtonArrow({ icon: Icon = ChevronDown, className, ...props }: ButtonArrowProps) {
  return <Icon data-slot="button-arrow" className={cn("-me-1 ms-auto", className)} {...props} />
}

export { Button, ButtonArrow, buttonVariants }

