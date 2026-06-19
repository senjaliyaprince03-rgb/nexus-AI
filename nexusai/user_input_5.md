<USER_REQUEST>
https://tendem.ai/?segment_id=broad
I've fully analysed tendem.ai. Here is everything I observed about their design system, then the complete master prompt for your agent.
Tendem.ai design breakdown:

Background: Pure white #FFFFFF with very light warm-grey sections #F8F7F4
Primary text: Near-black #0A0A0A / #111111
Accent: Warm coral-orange #FF6B35 for CTAs and highlights
Secondary: Soft sage green #7CB69E for success states
Cards: White with subtle 1px border rgba(0,0,0,0.08) and soft box-shadow
Typography: Large serif-like display font for headlines, clean sans-serif for body
Layout: Generous whitespace, asymmetric grids, floating UI cards
Animations: Subtle scroll-reveal fades, floating card elements, no heavy 3D
Style: Clean, editorial, professional — NOT dark/gamer aesthetic
UI pattern: Split layouts, comparison tables, step-by-step numbered flows, expert profile cards

You are a world-class senior frontend engineer and UI/UX designer.
I have a NexusAI project (FastAPI backend + Next.js 14 frontend — 
a multi-agent RAG platform for document Q&A).

Redesign the ENTIRE frontend to match the aesthetic of tendem.ai:
clean, editorial, professional, light-mode, generous whitespace,
serif display headlines, floating UI cards, subtle scroll animations.

Analyse the design system carefully before writing a single line of code.
Complete every task in order. Confirm each task before moving to the next.

═══════════════════════════════════════════════════════════════════════
DESIGN SYSTEM — MATCH TENDEM.AI EXACTLY
═══════════════════════════════════════════════════════════════════════

Colors (extract these from tendem.ai and use throughout):
  --bg-primary:      #FFFFFF
  --bg-secondary:    #F8F7F4   (warm off-white se
<truncated 45215 bytes>
 <p className="text-xs text-[#8A8A8A]">
            Built with FastAPI + Next.js 14 + pgvector
          </p>
        </div>
      </div>
    </footer>
  )
}
```

--- Assemble frontend/src/app/page.tsx ---

```tsx
import { Navbar }                from "@/components/landing/Navbar"
import { HeroSection }           from "@/components/landing/HeroSection"
import { LogoMarquee }           from "@/components/landing/LogoMarquee"
import { TaskShowcaseSection }   from "@/components/landing/TaskShowcaseSection"
import { HowItWorksSection }     from "@/components/landing/HowItWorksSection"
import { AgentPipelineSection }  from "@/components/landing/AgentPipelineSection"
import { ComparisonSection }     from "@/components/landing/ComparisonSection"
import { CTASection }            from "@/components/landing/CTASection"
import { LandingFooter }         from "@/components/landing/LandingFooter"

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <LogoMarquee />
        <TaskShowcaseSection />
        <HowItWorksSection />
        <AgentPipelineSection />
        <ComparisonSection />
        <CTASection />
      </main>
      <LandingFooter />
    </>
  )
}
```

═══════════════════════════════════════════════════════════════════════
TASK 7 — REDESIGN DASHBOARD SIDEBAR (clean light style)
═══════════════════════════════════════════════════════════════════════

Replace frontend/src/components/layout/Sidebar.tsx:

```tsx
"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion 
<truncated 19136 bytes>

NOTE: The output was truncated because it was too long. Use a more targeted query or a smaller range to get the information you need.