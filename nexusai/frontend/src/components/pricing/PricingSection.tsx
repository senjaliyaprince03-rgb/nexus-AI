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
} from "lucide-react"

/* ── Pricing Data ─────────────────────────────────────────────────────────── */

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    badge: null,
    description: "Perfect for individuals exploring AI-powered document search.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: "₹",
    icon: Zap,
    iconBg: "bg-[var(--landing-surface-muted)] border border-[var(--landing-border)]",
    iconColor: "text-[#7CB69E]",
    cta: "Start Free",
    ctaVariant: "secondary" as const,
    popular: false,
    features: [
      "5 document uploads",
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
    description:
      "For professionals & teams who need serious document intelligence.",
    monthlyPrice: 1999,
    yearlyPrice: 19190,
    currency: "₹",
    icon: Crown,
    iconBg: "bg-[var(--landing-surface-muted)] border border-[var(--landing-border)]",
    iconColor: "text-[#C5A059]",
    cta: "Get Pro",
    ctaVariant: "primary" as const,
    popular: true,
    features: [
      "Unlimited uploads",
      "Unlimited AI queries",
      "Multi-agent RAG pipeline",
      "Priority email & chat support",
      "5 workspaces",
      "Unlimited chat history",
      "Advanced analytics dashboard",
      "Custom AI instructions",
      "API access (10K req/mo)",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    badge: null,
    description:
      "For organisations needing dedicated infrastructure & compliance.",
    monthlyPrice: 4999,
    yearlyPrice: 47990,
    currency: "₹",
    icon: Shield,
    iconBg: "bg-[var(--landing-surface-muted)] border border-[var(--landing-border)]",
    iconColor: "text-[#3B6FE8]",
    cta: "Contact Us",
    ctaVariant: "secondary" as const,
    popular: false,
    features: [
      "Everything in Pro",
      "Unlimited workspaces",
      "SSO / SAML integration",
      "Dedicated account manager",
      "Custom data residency (India)",
      "99.9% SLA uptime guarantee",
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
          !isYearly ? "text-[var(--landing-text)]" : "text-[var(--landing-text-muted)]"
        }`}
      >
        Monthly
      </span>
      <button
        onClick={onToggle}
        className="relative w-16 h-8 rounded-full bg-[var(--landing-surface-strong)] border border-[var(--landing-border)]
                   transition-colors duration-300 focus:outline-none focus-visible:ring-2
                   focus-visible:ring-[#C5A059]"
        aria-label="Toggle billing period"
      >
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={`absolute top-1 w-6 h-6 rounded-full shadow-md ${
            isYearly
              ? "left-[calc(100%-28px)] bg-[#C5A059]"
              : "left-1 bg-[var(--landing-surface)] border border-[var(--landing-border)]"
          }`}
        />
      </button>
      <span
        className={`text-sm font-medium transition-colors duration-200 ${
          isYearly ? "text-[var(--landing-text)]" : "text-[var(--landing-text-muted)]"
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
                       bg-[var(--landing-surface-strong)] text-[#C5A059] text-xs font-semibold
                       border border-[rgba(255,107,53,0.2)]"
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
      {plan.badge && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute -top-4 left-1/2 -translate-x-1/2 z-20"
        >
          <div
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full
                        bg-[#C5A059] text-white text-xs font-semibold
                        shadow-[0_4px_16px_rgba(255,107,53,0.4)]"
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            {plan.badge}
          </div>
        </motion.div>
      )}

      {/* Card inner */}
      <div
        className={`
          premium-glow-soft flex flex-col flex-1 rounded-[23px] p-8 lg:p-10
          ${
            plan.popular
              ? "bg-[var(--landing-surface)] border-2 border-[#C5A059] shadow-[0_20px_60px_rgba(255,107,53,0.12)]"
              : "bg-[var(--landing-surface)] border border-[var(--landing-border)] shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
          }
          transition-shadow duration-500
        `}
      >
        {/* Icon + Name */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`w-11 h-11 rounded-xl ${plan.iconBg} ${plan.iconColor} flex items-center justify-center`}
          >
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--landing-text)]">{plan.name}</h3>
        </div>

        {/* Description */}
        <p className="text-sm text-[var(--landing-text-muted)] leading-relaxed mb-6 min-h-[40px]">
          {plan.description}
        </p>

        {/* Price */}
        <div className="mb-8">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl lg:text-5xl font-bold text-[var(--landing-text)] tracking-tight">
              <AnimatedPrice
                value={isYearly ? perMonth : price}
                currency={plan.currency}
              />
            </span>
            {plan.monthlyPrice > 0 && (
              <span className="text-sm text-[var(--landing-text-muted)] ml-1">/month</span>
            )}
          </div>
          {isYearly && plan.yearlyPrice > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-[var(--landing-text-muted)] mt-1.5"
            >
              Billed ₹{formatINR(plan.yearlyPrice)}/year · Save ₹
              {formatINR(plan.monthlyPrice * 12 - plan.yearlyPrice)}
            </motion.p>
          )}
          {plan.monthlyPrice === 0 && (
            <p className="text-xs text-[#7CB69E] font-medium mt-1.5">
              Free forever — no credit card required
            </p>
          )}
        </div>

        {/* CTA */}
        <div className="mb-8">
          {plan.popular ? (
            <button
              className="w-full h-12 rounded-2xl text-white font-semibold text-sm
                         bg-gradient-to-r from-[#C5A059] to-[#FF8F5E]
                         shadow-[0_4px_20px_rgba(255,107,53,0.35)]
                         hover:shadow-[0_8px_30px_rgba(255,107,53,0.45)]
                         hover:scale-[1.02] active:scale-[0.98]
                         transition-all duration-200
                         flex items-center justify-center gap-2"
            >
              {plan.cta}
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <Button
              variant={plan.ctaVariant}
              className="w-full h-12 rounded-2xl text-sm"
            >
              {plan.cta}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[rgba(0,0,0,0.08)] to-transparent mb-6" />

        {/* Features */}
        <ul className="flex flex-col gap-3.5 flex-1">
          {plan.features.map((feature, i) => (
            <motion.li
              key={feature}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.04 }}
              className="flex items-start gap-3 text-sm text-[var(--landing-text-secondary)]"
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  plan.popular
                    ? "bg-[var(--landing-surface-strong)] text-[#C5A059]"
                    : "bg-[var(--landing-surface-muted)] text-[#7CB69E]"
                }`}
              >
                <Check className="w-3 h-3" strokeWidth={3} />
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
    <section id="pricing" className="relative overflow-hidden bg-[var(--landing-bg)] px-6 sm:px-8 lg:px-12 py-24 lg:py-32">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full
                      bg-[radial-gradient(circle,rgba(255,107,53,0.04),transparent_70%)]
                      pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full
                      bg-[radial-gradient(circle,rgba(59,111,232,0.03),transparent_70%)]
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
