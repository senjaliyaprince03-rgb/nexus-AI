"use client"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Check,
  BadgePercent,
  Zap,
  Shield,
  Crown,
  Star,
  ArrowRight,
  IndianRupee,
  Building2,
  Sparkles,
} from "lucide-react"

/* ── Pricing Data ─────────────────────────────────────────────────────────── */

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    badge: "CURRENT PLAN",
    description: "Perfect for getting started with AI",
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: "₹",
    icon: Sparkles,
    iconBg: "bg-[rgba(212,175,55,0.08)] border border-[rgba(212,175,55,0.2)]",
    iconColor: "text-[#D4AF37]",
    cta: "✓ Active Plan",
    ctaVariant: "secondary" as const,
    popular: false,
    current: true,
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
]

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function formatINR(amount: number): string {
  if (amount === 0) return "0"
  return amount.toLocaleString("en-IN")
}

/* ── Animated Counter ─────────────────────────────────────────────────────── */

function AnimatedPrice({
  value,
  currency,
}: {
  value: number
  currency: string
}) {
  const [displayed, setDisplayed] = useState(value)
  const prevRef = useRef(value)

  useEffect(() => {
    const from = prevRef.current
    const to = value
    prevRef.current = value
    if (from === to) return

    const duration = 400
    const start = performance.now()

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(from + (to - from) * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [value])

  return (
    <span className="tabular-nums">
      {currency}
      {formatINR(displayed)}
    </span>
  )
}

/* ── Billing Toggle ───────────────────────────────────────────────────────── */

function BillingToggle({
  isYearly,
  onToggle,
}: {
  isYearly: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-center gap-4 mt-8 mb-16">
      <span
        className={`text-sm font-medium transition-colors duration-200 ${
          !isYearly ? "text-gray-900" : "text-gray-400"
        }`}
      >
        Monthly
      </span>
      <button
        onClick={onToggle}
        className="relative w-14 h-7 rounded-full bg-gray-200 border border-gray-300
                   transition-colors duration-300 focus:outline-none focus-visible:ring-2
                   focus-visible:ring-[#C5A059]"
        aria-label="Toggle billing period"
      >
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={`absolute top-[2px] w-5 h-5 rounded-full shadow-sm ${
            isYearly
              ? "left-[calc(100%-22px)] bg-white"
              : "left-[2px] bg-white border border-gray-200"
          }`}
        />
      </button>
      <span
        className={`text-sm font-medium transition-colors duration-200 ${
          isYearly ? "text-gray-900" : "text-gray-400"
        }`}
      >
        Yearly
      </span>
      <AnimatePresence>
        {isYearly && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8, x: -8 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -8 }}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full
                       bg-white text-[#C5A059] text-xs font-semibold
                       border border-[#F0E6D2] shadow-sm"
          >
            <BadgePercent className="w-3 h-3" />
            Save 20%
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Pricing Card ─────────────────────────────────────────────────────────── */

function PricingCard({
  plan,
  isYearly,
  index,
}: {
  plan: (typeof PLANS)[0]
  isYearly: boolean
  index: number
}) {
  const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice
  const perMonth = isYearly && plan.yearlyPrice > 0
    ? Math.round(plan.yearlyPrice / 12)
    : plan.monthlyPrice
  const Icon = plan.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.12 }}
      className={`
        relative flex flex-col rounded-3xl p-[1px] transition-all duration-500
        ${
          plan.popular
            ? "lg:scale-[1.04] z-10"
            : "hover:scale-[1.02]"
        }
      `}
      style={
        plan.popular
          ? {
              background:
                "var(--landing-surface)",
            }
          : {}
      }
    >
      {/* Popular badge */}
      {plan.badge && plan.popular && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute -top-4 left-1/2 -translate-x-1/2 z-20"
        >
          <div
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full
                        bg-[#D4AF37] text-white text-xs font-semibold
                        shadow-md border border-[#C5A059]"
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            {plan.badge}
          </div>
        </motion.div>
      )}

      {/* Card inner */}
      <div
        className={`
          flex flex-col flex-1 rounded-[23px] p-8 lg:p-10
          ${
            plan.popular
              ? "bg-white border-[1.5px] border-[#D4AF37] shadow-[0_20px_60px_rgba(212,175,55,0.08)]"
              : "bg-white border border-gray-200 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]"
          }
          transition-shadow duration-500
        `}
      >
        {/* Icon + Name */}
        <div className="flex flex-col mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl ${plan.iconBg} ${plan.iconColor} flex items-center justify-center`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
              {plan.current && (
                <span className="text-[10px] font-bold text-[#D4AF37] tracking-widest uppercase mt-0.5">
                  CURRENT PLAN
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-500 leading-relaxed mb-6 min-h-[40px]">
          {plan.description}
        </p>

        {/* Price */}
        <div className="mb-8">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
              <AnimatedPrice
                value={isYearly ? perMonth : price}
                currency={plan.currency}
              />
            </span>
            {plan.monthlyPrice > 0 && (
              <span className="text-sm text-gray-400 ml-1">/month</span>
            )}
          </div>
          {isYearly && plan.yearlyPrice > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-gray-400 mt-1.5"
            >
              Billed ₹{formatINR(plan.yearlyPrice)}/year · Save ₹
              {formatINR(plan.monthlyPrice * 12 - plan.yearlyPrice)}
            </motion.p>
          )}
          {plan.monthlyPrice === 0 && (
            <p className="text-[11px] text-[#D4AF37] font-medium mt-1.5">
              Free forever · no credit card required
            </p>
          )}
        </div>

        {/* CTA */}
        <div className="mb-4">
          {plan.current ? (
            <button
              className="w-full h-11 rounded-xl text-white font-semibold text-sm
                         bg-[#18181B] hover:bg-gray-800
                         transition-all duration-200
                         flex items-center justify-center gap-2"
            >
              {plan.cta}
            </button>
          ) : plan.popular ? (
            <button
              className="w-full h-11 rounded-xl text-white font-semibold text-sm
                         bg-[#C5A059] hover:bg-[#B38D45] shadow-sm hover:shadow-md
                         transition-all duration-200
                         flex items-center justify-center gap-2"
            >
              {plan.cta}
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              className="w-full h-11 rounded-xl text-gray-900 font-medium text-sm
                         bg-white border border-gray-200 hover:bg-gray-50
                         transition-all duration-200
                         flex items-center justify-center gap-2"
            >
              {plan.cta}
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          )}
        </div>

        {/* Trial & Credits Box */}
        <div className="flex flex-col items-center mb-8 gap-3 mt-1">
          <p className="text-[11px] font-medium text-gray-400">
            Start Free 7 Day Trial
          </p>
          <div className="w-full rounded-xl border border-[#F0E6D2] bg-[#FDF9F0] p-2.5 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-xs font-semibold text-gray-900">{plan.credits} NexusAI Credits</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 mb-6" />

        {/* Features */}
        <ul className="flex flex-col gap-3.5 flex-1">
          {plan.features.map((feature, i) => (
            <motion.li
              key={feature}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.04 }}
              className="flex items-start gap-3 text-sm text-gray-500"
            >
              <div
                className={`w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5 text-[#D4AF37]`}
              >
                <Check className="w-4 h-4" strokeWidth={2.5} />
              </div>
              {feature}
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}

/* ── Trust Bar ────────────────────────────────────────────────────────────── */

function TrustBar() {
  const items = [
    { icon: IndianRupee, label: "Pay in INR via UPI, Cards & NetBanking" },
    { icon: Shield, label: "Data hosted in India (Mumbai region)" },
    { icon: Star, label: "GST invoice included on all plans" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.4 }}
      className="flex flex-wrap items-center justify-center gap-6 lg:gap-10 mt-16 pt-10
                 border-t border-[var(--landing-border)]"
      >
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-2.5 text-sm text-[var(--landing-text-muted)]"
        >
          <item.icon className="w-4 h-4 text-[#7CB69E]" />
          {item.label}
        </div>
      ))}
    </motion.div>
  )
}

/* ── Main Export ──────────────────────────────────────────────────────────── */

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false)

  return (
    <section id="pricing" className="relative overflow-hidden bg-[#FAFAFA] px-6 sm:px-8 lg:px-12 py-24 lg:py-32">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full
                      bg-[radial-gradient(circle,rgba(212,175,55,0.05),transparent_70%)]
                      pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full
                      bg-[radial-gradient(circle,rgba(212,175,55,0.03),transparent_70%)]
                      pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto"
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                        bg-[var(--landing-surface-strong)] border border-[rgba(255,107,53,0.2)]
                        text-[#C5A059] text-xs font-medium mb-5"
          >
            <IndianRupee className="w-3.5 h-3.5" />
            Simple, transparent pricing
          </div>
          <h2 className="font-display text-4xl lg:text-5xl font-bold tracking-[-0.02em] text-[var(--landing-text)] leading-[1.05] mb-4">
            Plans that grow{" "}
            <span className="italic text-[#C5A059] font-serif font-normal">with you</span>
          </h2>
          <p className="text-lg text-[var(--landing-text-secondary)] leading-relaxed">
            Start free, upgrade when you&apos;re ready. All plans include Indian
            Rupee billing, GST invoicing, and data residency in India.
          </p>
        </motion.div>

        {/* Toggle */}
        <BillingToggle
          isYearly={isYearly}
          onToggle={() => setIsYearly((v) => !v)}
        />

        {/* Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-4 items-start">
          {PLANS.map((plan, i) => (
            <PricingCard key={plan.id} plan={plan} isYearly={isYearly} index={i} />
          ))}
        </div>

        {/* Trust bar */}
        <TrustBar />
      </div>
    </section>
  )
}
