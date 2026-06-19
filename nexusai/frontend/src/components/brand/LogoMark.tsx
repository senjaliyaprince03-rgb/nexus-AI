import Image from "next/image"

import { cn } from "@/lib/utils"

type LogoMarkProps = {
  alt?: string
  className?: string
  imageClassName?: string
  priority?: boolean
}

export function LogoMark({
  alt = "NexusAI",
  className,
  imageClassName,
  priority = false,
}: LogoMarkProps) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-xl shadow-[0_4px_14px_rgba(255,107,53,0.24)]",
        className
      )}
    >
      <Image
        src="/icons/nexusai-icon-512.png"
        alt={alt}
        fill
        priority={priority}
        sizes="48px"
        className={cn("object-cover", imageClassName)}
      />
    </span>
  )
}
