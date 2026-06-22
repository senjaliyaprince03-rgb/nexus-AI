import re
import os

new_plans = '''const PLANS = [
  {
    id: "starter",
    name: "Starter",
    badge: null,
    description: "Perfect for getting started with AI",
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: "₹",
    icon: Sparkles,
    iconBg: "bg-[rgba(212,175,55,0.08)] border border-[rgba(212,175,55,0.2)]",
    iconColor: "text-[#D4AF37]",
    cta: "Choose Plan",
    ctaVariant: "secondary" as const,
    popular: false,
    current: false,
    credits: 20,
    features: [
      "2 document uploads",
      "50 AI queries / month",
      "Basic RAG pipeline",
      "Community support",
      "1 workspace",
      "7-day chat history",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    badge: "Most Popular",
    description: "Ideal for power users & creators",
    monthlyPrice: 1999,
    yearlyPrice: 0,
    currency: "₹",
    icon: Crown,
    iconBg: "bg-[rgba(212,175,55,0.08)] border border-[rgba(212,175,55,0.2)]",
    iconColor: "text-[#D4AF37]",
    cta: "Upgrade to Pro",
    ctaVariant: "primary" as const,
    popular: true,
    current: false,
    credits: 100,
    features: [
      "1,000 document uploads",
      "100,000 AI queries",
      "Multi-agent RAG pipeline",
      "Priority email & chat support",
      "5 workspaces",
      "1-year chat history",
      "Advanced analytics dashboard",
      "Custom AI instructions",
      "API access (10K req/mo)",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    badge: null,
    description: "For teams requiring maximum power",
    monthlyPrice: 4999,
    yearlyPrice: 0,
    currency: "₹",
    icon: Building2,
    iconBg: "bg-[rgba(212,175,55,0.08)] border border-[rgba(212,175,55,0.2)]",
    iconColor: "text-[#D4AF37]",
    cta: "Get Enterprise",
    ctaVariant: "secondary" as const,
    popular: false,
    current: false,
    credits: 1200,
    features: [
      "Everything in Pro",
      "50 workspaces",
      "SSO / SAML integration",
      "Dedicated account manager",
      "Custom data residency (India)",
      "99.9% SLA uptime guarantee",
      "Forever chat history",
      "On-prem deployment option",
      "SOC 2 & ISO 27001 compliance",
      "Invoice & PO billing with GST",
      "Unlimited API access",
    ],
  },
]'''

# ----------------- PricingSection.tsx -----------------
ps_path = r'c:\Users\Prince\Downloads\NexusAi\nexusai\frontend\src\components\pricing\PricingSection.tsx'
with open(ps_path, 'r', encoding='utf-8') as f:
    ps_content = f.read()

# Replace Building2 import if missing
if 'Building2' not in ps_content:
    ps_content = ps_content.replace('import {', 'import { Building2,', 1)

# Replace PLANS array
start_idx = ps_content.find('const PLANS = [')
end_idx = ps_content.find('/* ── Helpers ──────────────────────────────────────────────────────────────── */')
array_end = ps_content.rfind(']', start_idx, end_idx) + 1
ps_content = ps_content[:start_idx] + new_plans + ps_content[array_end:]

# Inject structural changes into PricingCard
cta_section = '''{/* CTA */}
        <div className="mb-4">'''

ps_content = ps_content.replace('{/* CTA */}\n        <div className="mb-8">', cta_section)

trial_and_credits = '''
        {/* Trial & Credits Box */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <p className="text-xs font-medium text-[var(--landing-text-muted)]">
            Start Free 7 Day Trial
          </p>
          <div className="w-full rounded-xl border border-[rgba(212,175,55,0.3)] bg-[rgba(212,175,55,0.04)] p-3 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-sm font-semibold text-[var(--landing-text)]">{plan.credits} Astrology Credits</span>
          </div>
        </div>

        {/* Divider */}'''

ps_content = ps_content.replace('{/* Divider */}', trial_and_credits)

with open(ps_path, 'w', encoding='utf-8') as f:
    f.write(ps_content)


# ----------------- page.tsx -----------------
page_path = r'c:\Users\Prince\Downloads\NexusAi\nexusai\frontend\src\app\dashboard\billing\page.tsx'
with open(page_path, 'r', encoding='utf-8') as f:
    page_content = f.read()

if 'Building2' not in page_content:
    page_content = page_content.replace('import {', 'import { Building2,', 1)

start_idx = page_content.find('const PLANS = [')
end_idx = page_content.find('export default function BillingPage')
array_end = page_content.rfind(']', start_idx, end_idx) + 1

page_content = page_content[:start_idx] + new_plans + page_content[array_end:]

# Fallback fix
page_content = page_content.replace('workspace?.plan === "free" ? "basic"', 'workspace?.plan === "free" ? "starter"')
page_content = page_content.replace('p.id === "basic"', 'p.id === "starter"')
page_content = page_content.replace(') || "basic"', ') || "starter"')

# Inject structural changes into PricingCard
page_cta_section = '''{/* CTA */}
        <div className="mb-4">'''

page_content = page_content.replace('{/* CTA */}\n        <div className="mb-5">', page_cta_section)

page_trial_and_credits = '''
        {/* Trial & Credits Box */}
        <div className="flex flex-col items-center mb-6 gap-3">
          <p className="text-[11px] font-medium text-[#94a3b8]">
            Start Free 7 Day Trial
          </p>
          <div className="w-full rounded-xl border border-[rgba(212,175,55,0.2)] bg-[rgba(212,175,55,0.04)] p-2.5 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-xs font-semibold text-white">{plan.credits} Astrology Credits</span>
          </div>
        </div>

        {/* Divider */}'''

# It seems page.tsx PricingCard does NOT have `{/* Divider */}` natively! Let's check where to inject.
# In page.tsx:
#        {/* CTA */}
#        <div className="mb-5">
#           <button... />
#        </div>
#
#        {/* Features */}
# Let's inject before {/* Features */}

page_content = page_content.replace('{/* Features */}', page_trial_and_credits + '\n\n        {/* Features */}')

with open(page_path, 'w', encoding='utf-8') as f:
    f.write(page_content)
