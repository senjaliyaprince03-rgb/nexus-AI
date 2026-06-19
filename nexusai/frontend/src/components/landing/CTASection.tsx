"use client"
import { RevealOnScroll } from "@/components/ui/RevealOnScroll"
import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section className="bg-[var(--landing-bg)] px-6 sm:px-8 lg:px-12 py-24 lg:py-32">
      <RevealOnScroll variant="pop" duration={0.6}>
        <div className="max-w-[720px] mx-auto text-center">
          <h2 className="font-display text-4xl lg:text-5xl font-bold tracking-[-0.02em] text-[var(--landing-text)] leading-[1.05] mb-6">
            You don&apos;t need to dig
            <br />
            <span className="italic text-[#C5A059] font-serif font-normal">through documents yourself</span>
          </h2>
          <p className="text-xl text-[var(--landing-text-secondary)] mb-10">
            Upload. Ask. Get cited answers in seconds.
            No setup. No API key. No learning curve.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button href="/signup" variant="primary" size="lg">
              Start Free
            </Button>
            <Button href="/login" variant="secondary" size="lg">
              Log in
            </Button>
          </div>
          <p className="text-sm text-[var(--landing-text-muted)] mt-6">
            Free to start · Works in 60 seconds
          </p>
        </div>
      </RevealOnScroll>
    </section>
  )
}
