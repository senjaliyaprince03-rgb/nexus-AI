"use client"

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import * as React from "react"
import { RiStarFill } from "@remixicon/react"

import { cn } from "@/lib/utils"

const ReviewFilterGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn("flex w-full max-w-md flex-col gap-2", className)}
    {...props}
  />
))

ReviewFilterGroup.displayName = RadioGroupPrimitive.Root.displayName

const ReviewFilterItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> & {
    stars: number
    count: number
    total: number
  }
>(({ className, stars, count, total, ...props }, ref) => {
  const percentage = Math.round((count / total) * 100)

  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex items-center gap-3 rounded-md border border-[hsl(var(--input))] p-2 transition-colors",
        "hover:border-[#F8F9FA]/30 hover:bg-white/5",
        "data-[state=checked]:border-gray-500 data-[state=checked]:bg-white/10",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-[72px] items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <RiStarFill
            key={i}
            size={16}
            className={i < stars ? "text-amber-500" : "text-white/20"}
          />
        ))}
      </div>

      <div className="h-2 flex-1 rounded-full bg-white/10">
        <div className="h-2 rounded-full bg-white" style={{ width: `${percentage}%` }} />
      </div>

      <span className="w-12 text-right text-xs font-medium text-[hsl(var(--muted-foreground))]">
        {count.toLocaleString()}
      </span>
    </RadioGroupPrimitive.Item>
  )
})

ReviewFilterItem.displayName = "ReviewFilterItem"

export { ReviewFilterGroup, ReviewFilterItem }

