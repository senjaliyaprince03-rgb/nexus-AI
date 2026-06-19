"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuthStore } from "@/store/authStore"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"
import {
  Check,
  BadgePercent,
  Zap,
  Shield,
  Crown,
  Star,
  ArrowRight,
  IndianRupee,
  CreditCard,
  Receipt,
  ChevronDown,
  HelpCircle,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react"

/* ── Pricing Plans ─────────────────────────────────────────────────────────── */

const PLANS = [
  {
    id: "free",
    name: "Starter",
    badge: null,
    description: "Perfect for individuals exploring AI-powered document search.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: "₹",
    icon: Zap,
    iconBg: "bg-[#EDF7F1]",
    iconColor: "text-[#D4AF37]",
    cta: "Current Plan",
    popular: false,
    current: true,
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
    description: "For professionals & teams who need serious document intelligence.",
    monthlyPrice: 1999,
    yearlyPrice: 19190,
    currency: "₹",
    icon: Crown,
    iconBg: "bg-[#FFF0EB]",
    iconColor: "text-[#D4AF37]",
    cta: "Upgrade to Pro",
    popular: true,
    current: false,
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
    description: "For organisations needing dedicated infrastructure & compliance.",
    monthlyPrice: 4999,
    yearlyPrice: 47990,
    currency: "₹",
    icon: Shield,
    iconBg: "bg-[#EEF0FF]",
    iconColor: "text-[#3B6FE8]",
    cta: "Contact Sales",
    popular: false,
    current: false,
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

/* ── FAQ Data ──────────────────────────────────────────────────────────────── */

const FAQS = [
  {
    q: "Can I pay in Indian Rupees (INR)?",
    a: "Absolutely. All prices are in INR. Payments are handled through secure hosted checkout once Stripe billing is configured.",
  },
  {
    q: "Do you provide GST-compliant invoices?",
    a: "Invoices appear here after real checkout/webhook billing is configured. No mock invoices are shown.",
  },
  {
    q: "Can I switch plans or cancel anytime?",
    a: "Yes. You can upgrade, downgrade, or cancel at any time. Downgrades take effect at the end of the current billing cycle. No lock-in, no cancellation fees.",
  },
  {
    q: "What happens when my free plan quota runs out?",
    a: "You'll receive a notification when you reach 80% usage. Once exhausted, queries are paused (your documents remain safe). Upgrade to Pro to unlock unlimited queries instantly.",
  },
  {
    q: "Is there a discount for startups or educational institutions?",
    a: "Yes! We offer 40% off on Pro plans for DPIIT-recognised startups, registered NGOs, and .edu/.ac.in institutions. Contact support@nexusai.in with your verification documents.",
  },
]

/* ── Helpers ───────────────────────────────────────────────────────────────── */

function formatINR(amount: number): string {
  if (amount === 0) return "0"
  return amount.toLocaleString("en-IN")
}

/* ── Animated Price ─────────────────────────────────────────────────────────── */

function AnimatedPrice({ value, currency }: { value: number; currency: string }) {
  return (
    <span className="tabular-nums">
      {currency}
      {formatINR(value)}
    </span>
  )
}

/* ── Billing Toggle ─────────────────────────────────────────────────────────── */

function BillingToggle({ isYearly, onToggle }: { isYearly: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-center gap-4 mb-10">
      <span className={`text-sm font-medium transition-colors duration-200 ${!isYearly ? "text-white" : "text-[#94a3b8]"}`}>
        Monthly
      </span>
      <button
        onClick={onToggle}
        className="relative w-14 h-7 rounded-full bg-[#1A1A1A] border border-[rgba(0,0,0,0.08)] transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
        aria-label="Toggle billing period"
      >
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={`absolute top-1 w-5 h-5 rounded-full shadow-md ${
            isYearly ? "left-[calc(100%-24px)] bg-[#D4AF37]" : "left-1 bg-white border border-[rgba(0,0,0,0.1)]"
          }`}
        />
      </button>
      <span className={`text-sm font-medium transition-colors duration-200 ${isYearly ? "text-white" : "text-[#94a3b8]"}`}>
        Yearly
      </span>
      <AnimatePresence>
        {isYearly && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8, x: -8 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -8 }}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FFF0EB] text-[#D4AF37] text-sm font-semibold border border-[rgba(245,158,11,0.2)]"
          >
            <BadgePercent className="w-3 h-3" />
            Save 20%
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Pricing Card ───────────────────────────────────────────────────────────── */

function PricingCard({ plan, isYearly, index, currentPlanId, onUpgrade, isUpgrading }: { plan: (typeof PLANS)[0]; isYearly: boolean; index: number; currentPlanId: string; onUpgrade: (id: string) => void; isUpgrading: boolean }) {
  const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice
  const perMonth = isYearly && plan.yearlyPrice > 0 ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice
  const Icon = plan.icon
  const isCurrent = currentPlanId === plan.id
  const isEnterprise = plan.id === "enterprise"

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={`relative flex flex-col rounded-2xl p-[1px] transition-all duration-500 ${
        plan.popular ? "lg:scale-[1.03] z-10" : "hover:scale-[1.01]"
      }`}
      style={
        plan.popular
          ? { background: "conic-gradient(from 225deg, #D4AF37, #FF9A6C, #FFDBC8, #D4AF37)" }
          : {}
      }
    >
      {/* Popular badge */}
      {plan.badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37] text-white text-sm font-semibold shadow-[0_4px_16px_rgba(245,158,11,0.4)]">
            <Star className="w-3 h-3 fill-current" />
            {plan.badge}
          </div>
        </div>
      )}

      {/* Card inner */}
      <div
        className={`flex flex-col flex-1 rounded-[15px] p-6 ${
          plan.popular
            ? "bg-white shadow-[0_20px_60px_rgba(245,158,11,0.12)]"
            : isCurrent
            ? "bg-[#F8F9FA] border border-[rgba(0,0,0,0.1)]"
            : "bg-white border border-[rgba(0,0,0,0.07)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
        } transition-shadow duration-500`}
      >
        {/* Icon + Name */}
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-10 h-10 rounded-xl ${plan.iconBg} ${plan.iconColor} flex items-center justify-center`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">{plan.name}</h3>
            {isCurrent && (
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#D4AF37]">Current Plan</span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-[#94a3b8] leading-relaxed mb-4 min-h-[32px]">{plan.description}</p>

        {/* Price */}
        <div className="mb-5">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-white tracking-tight">
              <AnimatedPrice value={isYearly ? perMonth : price} currency={plan.currency} />
            </span>
            {plan.monthlyPrice > 0 && <span className="text-sm text-[#94a3b8] ml-1">/month</span>}
          </div>
          {isYearly && plan.yearlyPrice > 0 && (
            <p className="text-[11px] text-[#94a3b8] mt-1">
              Billed ₹{formatINR(plan.yearlyPrice)}/year · Save ₹{formatINR(plan.monthlyPrice * 12 - plan.yearlyPrice)}
            </p>
          )}
          {plan.monthlyPrice === 0 && (
            <p className="text-[11px] text-[#D4AF37] font-medium mt-1">Free forever · no credit card required</p>
          )}
        </div>

        {/* CTA */}
        <div className="mb-5">
          {isCurrent ? (
            <button
              disabled
              className="w-full py-2.5 rounded-xl text-sm font-medium bg-[#1A1A1A] text-[#94a3b8] cursor-not-allowed border border-[rgba(0,0,0,0.06)]"
            >
              ✓ Active Plan
            </button>
          ) : plan.popular ? (
            <button 
              onClick={() => onUpgrade(plan.id)}
              disabled={isUpgrading}
              className="w-full py-2.5 rounded-xl text-white text-sm font-semibold bg-gradient-to-r from-[#D4AF37] to-[#d97706] shadow-[0_4px_20px_rgba(245,158,11,0.35)] hover:shadow-[0_8px_30px_rgba(245,158,11,0.45)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2"
            >
              {plan.cta}
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : isEnterprise ? (
            <a
              href="mailto:sales@nexusai.in"
              className="w-full py-2.5 rounded-xl text-sm font-medium border border-[rgba(0,0,0,0.12)] text-[#C7CDD8] hover:bg-[#F8F9FA] transition-all duration-200 flex items-center justify-center gap-2"
            >
              {plan.cta}
              <ArrowRight className="w-4 h-4" />
            </a>
          ) : (
            <button 
              onClick={() => onUpgrade(plan.id)}
              disabled={isUpgrading}
              className="w-full py-2.5 rounded-xl text-sm font-medium border border-[rgba(0,0,0,0.12)] text-[#C7CDD8] hover:bg-[#F8F9FA] disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2"
            >
              {plan.cta}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[rgba(0,0,0,0.08)] to-transparent mb-4" />

        {/* Features */}
        <ul className="flex flex-col gap-2.5 flex-1">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm text-[#C7CDD8]">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  plan.popular ? "bg-[#FFF0EB] text-[#D4AF37]" : "bg-[#F4F3EF] text-[#D4AF37]"
                }`}
              >
                <Check className="w-2.5 h-2.5" strokeWidth={3} />
              </div>
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}

/* ── Usage Meter ────────────────────────────────────────────────────────────── */

function UsageMeter() {
  const usedQueries = 12
  const totalQueries = 50
  const usedDocs = 1
  const totalDocs = 5
  const queryPct = Math.round((usedQueries / totalQueries) * 100)
  const docPct = Math.round((usedDocs / totalDocs) * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-white border border-[rgba(0,0,0,0.07)] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-[#EDF7F1] flex items-center justify-center">
          <RefreshCw className="w-4 h-4 text-[#D4AF37]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Current Usage</h3>
          <p className="text-[11px] text-[#94a3b8]">Resets on 1st July 2026</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Queries */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-sm font-medium text-[#C7CDD8]">AI Queries</span>
            <span className="text-sm text-[#94a3b8]">{usedQueries} / {totalQueries}</span>
          </div>
          <div className="h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${queryPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
              className={`h-full rounded-full ${queryPct > 80 ? "bg-[#D4AF37]" : "bg-[#7CB69E]"}`}
            />
          </div>
          <p className="text-[10px] text-[#94a3b8] mt-1">{queryPct}% used</p>
        </div>

        {/* Documents */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-sm font-medium text-[#C7CDD8]">Documents Uploaded</span>
            <span className="text-sm text-[#94a3b8]">{usedDocs} / {totalDocs}</span>
          </div>
          <div className="h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${docPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
              className={`h-full rounded-full ${docPct > 80 ? "bg-[#D4AF37]" : "bg-[#7CB69E]"}`}
            />
          </div>
          <p className="text-[10px] text-[#94a3b8] mt-1">{docPct}% used</p>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-[rgba(0,0,0,0.06)]">
        <div className="flex items-start gap-2 p-3 rounded-xl bg-[#FFF9F6] border border-[rgba(245,158,11,0.1)]">
          <AlertCircle className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-[#C7CDD8] leading-relaxed">
            Upgrade to <strong className="text-[#D4AF37]">Pro</strong> for unlimited queries and documents with no monthly caps.
          </p>
        </div>
      </div>
    </motion.div>
  )
}

/* ── Invoice History ────────────────────────────────────────────────────────── */

function InvoiceHistory() {
  const workspace = useAuthStore(s => s.workspace)
  
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", workspace?.id],
    queryFn: () => api.get<{ id: string; date: string; amount: string; status: "paid" | "pending" | "failed"; download_url?: string | null }[]>(`/api/billing/invoices?workspace_id=${workspace?.id}`),
    enabled: !!workspace?.id,
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white border border-[rgba(0,0,0,0.07)] rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-[#EEF0FF] flex items-center justify-center">
          <Receipt className="w-4 h-4 text-[#3B6FE8]" />
        </div>
        <h3 className="text-sm font-semibold text-white">Invoice History</h3>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-10">
          <div className="w-5 h-5 border-2 border-[#3B6FE8] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-12 h-12 rounded-full bg-[#F8F9FA] flex items-center justify-center mb-3">
            <Receipt className="w-5 h-5 text-[#C0BDB8]" />
          </div>
          <p className="text-sm font-medium text-[#C7CDD8]">No invoices yet</p>
          <p className="text-sm text-[#94a3b8] mt-1">Your billing history will appear here after your first payment.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl border border-[rgba(0,0,0,0.06)] hover:bg-[#F8F9FA] transition-colors">
              <div className="flex items-center gap-3">
                {inv.status === "paid" ? (
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                ) : inv.status === "pending" ? (
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-white">{inv.date}</p>
                  <p className="text-[10px] text-[#94a3b8]">{inv.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-white">{inv.amount}</span>
                <button
                  disabled={!inv.download_url}
                  onClick={() => {
                    if (!inv.download_url) {
                      toast.error("Invoice download is not configured for this billing provider yet.")
                      return
                    }
                    window.location.href = inv.download_url
                  }}
                  className="w-7 h-7 rounded-lg border border-[rgba(0,0,0,0.08)] flex items-center justify-center hover:bg-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                  aria-label={`Download invoice ${inv.id}`}
                >
                  <Download className="w-3.5 h-3.5 text-[#C7CDD8]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

/* ── FAQ Accordion ──────────────────────────────────────────────────────────── */

function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="space-y-2">
      {FAQS.map((faq, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i }}
        >
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className={`w-full flex items-start justify-between gap-4 text-left px-5 py-4 rounded-xl transition-all duration-200 ${
              openIndex === i
                ? "bg-[#FFF9F6] border border-[rgba(245,158,11,0.15)]"
                : "bg-white border border-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.12)]"
            }`}
          >
            <span className={`text-sm font-medium leading-snug ${openIndex === i ? "text-[#D4AF37]" : "text-white"}`}>
              {faq.q}
            </span>
            <motion.div animate={{ rotate: openIndex === i ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0 mt-0.5">
              <ChevronDown className={`w-4 h-4 ${openIndex === i ? "text-[#D4AF37]" : "text-[#94a3b8]"}`} />
            </motion.div>
          </button>
          <AnimatePresence initial={false}>
            {openIndex === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <p className="px-5 pt-2 pb-4 text-sm text-[#C7CDD8] leading-relaxed">{faq.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  )
}

/* ── Trust Bar ──────────────────────────────────────────────────────────────── */

function TrustBar() {
  const items = [
    { icon: IndianRupee, label: "Pay in INR via UPI, Cards & NetBanking" },
    { icon: Shield, label: "Data hosted in India (Mumbai region)" },
    { icon: Star, label: "GST invoice included on all plans" },
    { icon: CreditCard, label: "Secured by Stripe Checkout" },
  ]
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-10 pt-8 border-t border-[rgba(0,0,0,0.06)]">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2 text-sm text-[#94a3b8]">
          <item.icon className="w-3.5 h-3.5 text-[#D4AF37]" />
          {item.label}
        </div>
      ))}
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────────────────────────── */

export default function BillingPage() {
  const [isYearly, setIsYearly] = useState(false)
  const [isUpgrading, setIsUpgrading] = useState(false)
  
  const workspace = useAuthStore(s => s.workspace)
  const currentPlanId = (workspace?.plan || "free") as string
  const currentPlan = PLANS.find(p => p.id === currentPlanId) || PLANS.find(p => p.id === "free")!

  const handleUpgrade = async (planId: string) => {
    if (!workspace?.id) return
    setIsUpgrading(true)
    const toastId = toast.loading("Connecting to secure checkout...")
    try {
      const response = await api.post<{ url: string }>("/api/billing/checkout", {
        plan: planId,
        interval: isYearly ? "yearly" : "monthly",
      })
      if (response.url) {
        window.location.href = response.url
      } else {
        throw new Error("Failed to get checkout URL")
      }
    } catch (err: any) {
      toast.error(err.detail || "Checkout failed", { id: toastId })
      setIsUpgrading(false)
    }
  }

  return (
    <div className="min-h-full bg-[#F8F7F4]">
      {/* Page header */}
      <div className="px-8 pt-8 pb-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#D4AF37] mb-1">Billing</p>
          <h1 className="text-3xl font-display tracking-tight text-white">Plans & Billing</h1>
          <p className="mt-1 text-sm text-[#94a3b8]">
            Manage your subscription, review usage, and download invoices.
          </p>
        </motion.div>
      </div>

      <div className="px-8 pb-12 space-y-10">

        {/* ── Current Plan Banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[rgba(0,0,0,0.07)] rounded-2xl px-6 py-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
        >
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${currentPlan.iconBg} flex items-center justify-center`}>
              <currentPlan.icon className={`w-5 h-5 ${currentPlan.iconColor}`} />
            </div>
            <div>
              <p className="text-sm text-[#94a3b8] font-medium uppercase tracking-wider">Current Plan</p>
              <p className="text-lg font-semibold text-white">{currentPlan.name} — {currentPlanId === "free" ? "Free" : "Active"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EDF7F1] text-[#D4AF37] text-sm font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7CB69E] animate-pulse" />
              Active
            </span>
            {currentPlanId !== "pro" && currentPlanId !== "enterprise" && (
              <button 
                onClick={() => handleUpgrade("pro")}
                disabled={isUpgrading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#d97706] text-white text-sm font-semibold shadow-[0_2px_10px_rgba(245,158,11,0.3)] hover:shadow-[0_4px_20px_rgba(245,158,11,0.4)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all duration-200"
              >
                <Crown className="w-3.5 h-3.5" />
                Upgrade to Pro
              </button>
            )}
          </div>
        </motion.div>

        {/* ── Usage + Invoices ── */}
        <div className="grid md:grid-cols-2 gap-6">
          <UsageMeter />
          <InvoiceHistory />
        </div>

        {/* ── Pricing Plans ── */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFF0EB] border border-[rgba(245,158,11,0.2)] text-[#D4AF37] text-sm font-medium mb-4">
              <IndianRupee className="w-3.5 h-3.5" />
              Simple, transparent pricing
            </div>
            <h2 className="font-display text-2xl lg:text-3xl tracking-[-0.02em] text-white mb-2">
              Choose the right plan for you
            </h2>
            <p className="text-sm text-[#C7CDD8]">
              All plans include INR billing, GST invoicing, and data residency in India.
            </p>
          </motion.div>

          <BillingToggle isYearly={isYearly} onToggle={() => setIsYearly((v) => !v)} />

          <div className="grid md:grid-cols-3 gap-5 items-start mt-2">
            {PLANS.map((plan, i) => (
              <PricingCard 
                key={plan.id} 
                plan={plan} 
                isYearly={isYearly} 
                index={i} 
                currentPlanId={currentPlanId}
                onUpgrade={handleUpgrade}
                isUpgrading={isUpgrading}
              />
            ))}
          </div>
        </div>

        {/* ── Trust Bar ── */}
        <TrustBar />

        {/* ── FAQ ── */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 mb-6"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-[rgba(0,0,0,0.08)] flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-[#94a3b8]" />
            </div>
            <h2 className="text-lg font-semibold text-white">Frequently Asked Questions</h2>
          </motion.div>
          <FAQAccordion />
          <div className="text-center mt-8">
            <p className="text-sm text-[#94a3b8] mb-3">Still have questions?</p>
            <a
              href="mailto:support@nexusai.in"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-[#D4AF37] bg-white border border-[rgba(245,158,11,0.2)] hover:bg-[#FFF0EB] transition-all duration-200"
            >
              Contact Support →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
