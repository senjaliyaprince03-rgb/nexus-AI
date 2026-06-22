import re

with open(r'c:\Users\Prince\Downloads\NexusAi\nexusai\frontend\src\app\dashboard\billing\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_plans = '''const PLANS = [
  {
    id: "basic",
    name: "Basic",
    badge: null,
    description: "Perfect for getting started with AI",
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: "₹",
    icon: Zap,
    iconBg: "bg-[rgba(212,175,55,0.08)] border border-[rgba(212,175,55,0.2)]",
    iconColor: "text-[#D4AF37]",
    cta: "Start Free 7 Day Trial",
    ctaVariant: "secondary" as const,
    popular: false,
    current: false,
    features: [
      "20 NexusAI Credits",
      "Standard AI responses",
      "Basic search access",
      "Community support",
      "1 project limitation",
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
    cta: "Start Free 7 Day Trial",
    ctaVariant: "primary" as const,
    popular: true,
    current: false,
    features: [
      "100 NexusAI Credits",
      "Priority AI processing",
      "Full web search access",
      "Standard email support",
      "Unlimited workspaces",
      "Advanced model selection",
      "Custom system prompts",
      "API access (Rate limited)",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    badge: null,
    description: "For teams requiring maximum power",
    monthlyPrice: 4999,
    yearlyPrice: 0,
    currency: "₹",
    icon: Shield,
    iconBg: "bg-[rgba(212,175,55,0.08)] border border-[rgba(212,175,55,0.2)]",
    iconColor: "text-[#D4AF37]",
    cta: "Start Free 7 Day Trial",
    ctaVariant: "secondary" as const,
    popular: false,
    current: false,
    features: [
      "1200 NexusAI Credits",
      "Ultra-fast processing",
      "Deep web search features",
      "24/7 dedicated support",
      "Enterprise security controls",
      "Early access to new models",
      "Custom domain deployment",
      "Unlimited API access",
      "Dedicated account manager",
      "Custom AI training",
    ],
  },
]'''

start_idx = content.find('const PLANS = [')
end_idx = content.find('/* ── Helpers ──────────────────────────────────────────────────────────────── */')
if end_idx == -1:
    end_idx = content.find('/* ── Mock Data ────────────────────────────────────────────────────────────── */')
if end_idx == -1:
    # Just find the end of the array manually
    end_idx = content.find(']', start_idx)
    # Actually wait, there are nested arrays in features
    # Let's use regex or just find the end of the third object
    end_idx = content.rfind(']', start_idx, content.find('export default function BillingPage')) + 1

content = content[:start_idx] + new_plans + content[end_idx:]

with open(r'c:\Users\Prince\Downloads\NexusAi\nexusai\frontend\src\app\dashboard\billing\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
