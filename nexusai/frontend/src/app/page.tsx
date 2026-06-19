import { Navbar }                from "@/components/landing/Navbar"
import { HeroSection }           from "@/components/landing/HeroSection"
import { LogoMarquee }           from "@/components/landing/LogoMarquee"
import { MetricsSection }        from "@/components/landing/MetricsSection"
import { HowItWorksSection }     from "@/components/landing/HowItWorksSection"
import { TaskShowcaseSection }   from "@/components/landing/TaskShowcaseSection"
import { AgentPipelineSection }  from "@/components/landing/AgentPipelineSection"
import { ComparisonSection }     from "@/components/landing/ComparisonSection"
import { CTASection }            from "@/components/landing/CTASection"
import { PricingSection }        from "@/components/pricing/PricingSection"
import { FAQSection }            from "@/components/pricing/FAQSection"
import { LandingFooter }         from "@/components/landing/LandingFooter"
import { AntigravetiyWidget }      from "@/components/landing/AntigravetiyWidget"

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="bg-[var(--landing-bg)]">
        <HeroSection />
        <LogoMarquee />
        <MetricsSection />
        <HowItWorksSection />
        <TaskShowcaseSection />
        <AgentPipelineSection />
        <ComparisonSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <LandingFooter />
      <AntigravetiyWidget />
    </>
  )
}
