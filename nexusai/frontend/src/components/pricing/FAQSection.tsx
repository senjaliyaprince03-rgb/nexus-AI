"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, HelpCircle, Bot } from "lucide-react"
import { useUIStore } from "@/store/uiStore"

/* ── FAQ Data (Indian context) ────────────────────────────────────────────── */

const FAQS = [
  {
    q: "Can I pay in Indian Rupees (INR)?",
    a: "Absolutely. All prices are in INR. Payments are handled through secure hosted checkout once Stripe billing is configured.",
  },
  {
    q: "Do you provide GST-compliant invoices?",
    a: "Invoices appear in your billing dashboard after real checkout/webhook billing is configured.",
  },
  {
    q: "Where is my data stored?",
    a: "All data is hosted in AWS Mumbai (ap-south-1) region. Your documents and embeddings never leave Indian soil. Enterprise customers can choose a dedicated VPC for additional isolation.",
  },
  {
    q: "Can I switch plans or cancel anytime?",
    a: "Yes. You can upgrade, downgrade, or cancel your subscription at any time from the billing dashboard. Downgrades take effect at the end of the current billing cycle. No lock-in, no cancellation fees.",
  },
  {
    q: "What happens when my free plan quota runs out?",
    a: "You'll receive a notification when you reach 80% usage. Once exhausted, queries are paused (your documents remain safe). Upgrade to Pro to unlock unlimited queries instantly.",
  },
  {
    q: "Is there a discount for startups or educational institutions?",
    a: "Yes! We offer 40% off on Pro plans for DPIIT-recognised startups, registered NGOs, and .edu/.ac.in institutions. Contact us at support@nexusai.in with your verification documents.",
  },
  {
    q: "Do you offer annual billing?",
    a: "Yes. Switch to yearly billing and save 20% compared to monthly. Annual plans are billed upfront and include the same GST invoice.",
  },
  {
    q: "What kind of support do I get?",
    a: "Starter: community forums. Pro: priority email & live chat (response within 4 hours IST). Enterprise: dedicated Slack channel, phone support, and a named account manager.",
  },
]

/* ── Accordion Item ───────────────────────────────────────────────────────── */

function FAQItem({
  faq,
  isOpen,
  onToggle,
  index,
}: {
  faq: (typeof FAQS)[0]
  isOpen: boolean
  onToggle: () => void
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
    >
      <button
        onClick={onToggle}
          className={`
          w-full flex items-start justify-between gap-4 text-left
          px-6 py-5 rounded-2xl transition-all duration-300
          ${
            isOpen
              ? "bg-[var(--landing-surface-strong)] border border-[rgba(255,107,53,0.15)]"
              : "bg-[var(--landing-surface)] border border-[var(--landing-border-soft)] hover:border-[var(--landing-border)] hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
          }
        `}
        aria-expanded={isOpen}
      >
        <span
          className={`text-[15px] font-medium leading-snug transition-colors duration-200 ${
            isOpen ? "text-[#C5A059]" : "text-[var(--landing-text)]"
          }`}
        >
          {faq.q}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="flex-shrink-0 mt-0.5"
        >
          <ChevronDown
            className={`w-5 h-5 transition-colors duration-200 ${
              isOpen ? "text-[#C5A059]" : "text-[var(--landing-text-muted)]"
            }`}
          />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <p className="px-6 pt-2 pb-5 text-sm text-[var(--landing-text-secondary)] leading-relaxed">
              {faq.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ── Main Export ──────────────────────────────────────────────────────────── */

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="relative bg-[var(--landing-bg-muted)] px-6 py-24 lg:py-32">
      {/* Subtle top border gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--landing-border-soft)] to-transparent" />

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <div
            className="inline-flex items-center gap-2 rounded-full border border-[var(--landing-border)]
                        bg-[var(--landing-surface)] px-3 py-1.5 text-xs font-medium text-[var(--landing-text-muted)] mb-5"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Frequently asked questions
          </div>
          <h2 className="font-display text-3xl lg:text-5xl tracking-[-0.02em] text-[var(--landing-text)] mb-3">
            Got <span className="italic text-[#C5A059]">questions?</span>
          </h2>
          <p className="text-base text-[var(--landing-text-secondary)]">
            Everything you need to know about NexusAI pricing in India.
          </p>
        </motion.div>

        {/* Accordion */}
        <div className="flex flex-col gap-3">
          {FAQS.map((faq, i) => (
            <FAQItem
              key={i}
              faq={faq}
              index={i}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center mt-14"
        >
          <p className="text-sm text-[var(--landing-text-muted)] mb-4">
            Still have questions? We&apos;re happy to help.
          </p>
          <button
            onClick={() => useUIStore.getState().openAntigravetiy()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full
                       text-sm font-medium text-white shadow-md
                       bg-gradient-to-r from-[#C5A059] to-[#FF8B5B]
                       hover:shadow-lg hover:from-[#e85a25] hover:to-[#ff7b44]
                       transition-all duration-300 hover:scale-[1.02]"
          >
            <Bot className="w-4 h-4" />
            Ask our AI Agent
          </button>
        </motion.div>
      </div>
    </section>
  )
}
