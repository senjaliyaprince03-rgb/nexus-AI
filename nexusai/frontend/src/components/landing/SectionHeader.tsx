import { cn } from "@/lib/utils"

export function SectionHeader({
  title,
  eyebrow,
  description,
  align = "left",
}: {
  title: string
  eyebrow?: string
  description?: string
  align?: "left" | "center"
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
      {eyebrow ? (
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.34em] text-amber-300/80">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display text-balance text-4xl tracking-[-0.04em] text-[var(--landing-text)] sm:text-5xl lg:text-6xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  )
}
