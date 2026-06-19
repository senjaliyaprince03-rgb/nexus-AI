import { GlowCard } from "@/components/ui/spotlight-card"

export function Default() {
  return (
    <div className="custom-cursor flex h-screen w-full flex-row items-center justify-center gap-10">
      <GlowCard />
      <GlowCard />
      <GlowCard />
    </div>
  )
}
