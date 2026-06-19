"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, ArrowUpRight, FileText } from "lucide-react"
import { LogoMark } from "@/components/brand/LogoMark"

const LAST_UPDATED = "June 1, 2026"

const sections = [
  { id: "acceptance", title: "Acceptance of Terms" },
  { id: "account-terms", title: "Account Terms" },
  { id: "api-usage", title: "API Usage & Limits" },
  { id: "payment", title: "Payment & Billing" },
  { id: "data-rights", title: "Your Data & Rights" },
  { id: "intellectual-property", title: "Intellectual Property" },
  { id: "prohibited-use", title: "Prohibited Use" },
  { id: "disclaimers", title: "Disclaimers & Warranties" },
  { id: "limitation-liability", title: "Limitation of Liability" },
  { id: "indemnification", title: "Indemnification" },
  { id: "termination", title: "Termination" },
  { id: "modifications", title: "Modifications to Terms" },
  { id: "governing-law", title: "Governing Law" },
  { id: "contact", title: "Contact Us" },
]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.05 * i, duration: 0.5, ease: "easeOut" as any },
  }),
}

export default function TermsOfServicePage() {
  const [activeSection, setActiveSection] = useState("")

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    )

    sections.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-[#18181B] transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.12)] bg-white/80 dark:bg-[#18181B]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <LogoMark className="h-8 w-8 rounded-lg" />
            <span className="font-semibold text-[#18181B] dark:text-[#F8F9FA]">NexusAI</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-[#9CA3AF] dark:text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F8F9FA] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16">
        <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-16">
          {/* Sidebar — Table of Contents */}
          <aside className="hidden lg:block">
            <nav className="sticky top-28">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] dark:text-[#71717A] mb-4">
                On this page
              </p>
              <ul className="space-y-1">
                {sections.map(({ id, title }) => (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      className={`block text-[13px] py-1.5 px-3 rounded-lg transition-all duration-200 ${
                        activeSection === id
                          ? "text-[#C5A059] bg-[#FFF0EB] dark:bg-[#C5A059]/10 font-medium"
                          : "text-[#4B5563] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F8F9FA] hover:bg-[#F8F7F4] dark:hover:bg-[#18181A]"
                      }`}
                    >
                      {title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="min-w-0">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.04 } },
              }}
            >
              {/* Title Block */}
              <motion.div variants={fadeUp} custom={0} className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF0EB] dark:bg-[#C5A059]/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[#C5A059]" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] dark:text-[#71717A]">
                    Legal
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-[#18181B] dark:text-[#F8F9FA] tracking-tight mb-4">
                  Terms of Service
                </h1>
                <p className="text-[#9CA3AF] dark:text-[#71717A] text-sm">
                  Last updated: {LAST_UPDATED}
                </p>
              </motion.div>

              {/* Introduction */}
              <motion.div variants={fadeUp} custom={1} className="prose-section mb-12">
                <p className="text-[#4B5563] dark:text-[#A1A1AA] leading-relaxed text-[15px]">
                  Welcome to NexusAI. These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the
                  NexusAI platform, including our website, APIs, and all related services (collectively, the
                  &ldquo;Service&rdquo;). Please read these Terms carefully before using our Service. By accessing or
                  using NexusAI, you agree to be bound by these Terms and our{" "}
                  <Link href="/privacy" className="text-[#C5A059] hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </motion.div>

              {/* Sections */}
              <div className="space-y-14">
                <motion.section variants={fadeUp} custom={2} id="acceptance">
                  <SectionHeading>1. Acceptance of Terms</SectionHeading>
                  <SectionBody>
                    <p>
                      By creating an account, accessing, or using any part of the Service, you acknowledge that you
                      have read, understood, and agree to be bound by these Terms. If you are using the Service on
                      behalf of an organization, you represent and warrant that you have the authority to bind that
                      organization to these Terms.
                    </p>
                    <p>
                      If you do not agree to these Terms, you must not access or use the Service. Your continued use
                      of the Service following any modifications to these Terms constitutes acceptance of those
                      changes.
                    </p>
                    <p>
                      You must be at least 18 years of age, or the age of legal majority in your jurisdiction, to
                      use the Service. By using NexusAI, you represent that you meet this requirement.
                    </p>
                  </SectionBody>
                </motion.section>

                <motion.section variants={fadeUp} custom={3} id="account-terms">
                  <SectionHeading>2. Account Terms</SectionHeading>
                  <SectionBody>
                    <p>
                      To access certain features of the Service, you must create an account. You agree to provide
                      accurate, current, and complete information during registration and to keep your account
                      information up to date.
                    </p>
                    <ul>
                      <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                      <li>You are responsible for all activities that occur under your account.</li>
                      <li>You must notify us immediately of any unauthorized use of your account.</li>
                      <li>You may not share, transfer, or sell your account to any other person or entity.</li>
                      <li>
                        We reserve the right to suspend or terminate accounts that violate these Terms or that have
                        been inactive for an extended period.
                      </li>
                    </ul>
                    <p>
                      NexusAI supports team and organizational accounts. The account administrator is responsible
                      for managing member access and ensuring all team members comply with these Terms.
                    </p>
                  </SectionBody>
                </motion.section>

                <motion.section variants={fadeUp} custom={4} id="api-usage">
                  <SectionHeading>3. API Usage & Limits</SectionHeading>
                  <SectionBody>
                    <p>
                      NexusAI provides API access to its multi-agent RAG platform. Your use of the API is subject
                      to the following conditions:
                    </p>
                    <ul>
                      <li>
                        <strong>Rate Limits:</strong> API requests are subject to rate limits based on your
                        subscription plan. Exceeding these limits may result in throttling or temporary suspension
                        of API access.
                      </li>
                      <li>
                        <strong>Authentication:</strong> All API requests must be authenticated using valid API
                        keys. You are responsible for keeping your API keys secure and must not share them publicly.
                      </li>
                      <li>
                        <strong>Fair Use:</strong> You agree not to abuse the API through excessive requests,
                        automated scraping, or any activity that degrades the Service for other users.
                      </li>
                      <li>
                        <strong>Data Processing:</strong> Documents uploaded through the API are processed by our
                        multi-agent system. You retain all rights to your uploaded content as outlined in
                        Section 5.
                      </li>
                    </ul>
                    <p>
                      We reserve the right to modify rate limits, introduce new usage tiers, or adjust API
                      functionality with reasonable notice. Current rate limits and quotas are published in our
                      API documentation.
                    </p>
                  </SectionBody>
                </motion.section>

                <motion.section variants={fadeUp} custom={5} id="payment">
                  <SectionHeading>4. Payment & Billing</SectionHeading>
                  <SectionBody>
                    <p>
                      Certain features of the Service require a paid subscription. By subscribing to a paid plan,
                      you agree to the following:
                    </p>
                    <ul>
                      <li>
                        <strong>Billing Cycle:</strong> Subscription fees are billed in advance on a monthly or
                        annual basis, depending on the plan you select.
                      </li>
                      <li>
                        <strong>Payment Method:</strong> You must provide a valid payment method. You authorize us
                        to charge your payment method for all applicable fees.
                      </li>
                      <li>
                        <strong>Price Changes:</strong> We may change subscription prices with at least 30 days
                        prior notice. Price changes take effect at the start of your next billing cycle.
                      </li>
                      <li>
                        <strong>Refunds:</strong> Subscription fees are non-refundable except as required by
                        applicable law or as explicitly stated in our refund policy.
                      </li>
                      <li>
                        <strong>Taxes:</strong> All fees are exclusive of applicable taxes. You are responsible for
                        paying any taxes associated with your use of the Service.
                      </li>
                    </ul>
                    <p>
                      If your payment fails, we may suspend access to paid features until the outstanding balance
                      is resolved. We will attempt to notify you before any suspension occurs.
                    </p>
                  </SectionBody>
                </motion.section>

                <motion.section variants={fadeUp} custom={6} id="data-rights">
                  <SectionHeading>5. Your Data & Rights</SectionHeading>
                  <SectionBody>
                    <p>
                      NexusAI respects your ownership of the data you upload and process through our platform:
                    </p>
                    <ul>
                      <li>
                        <strong>Ownership:</strong> You retain all rights, title, and interest in your data.
                        Uploading content to NexusAI does not transfer ownership to us.
                      </li>
                      <li>
                        <strong>License Grant:</strong> By uploading data, you grant NexusAI a limited,
                        non-exclusive license to process, store, and analyze your data solely for the purpose of
                        providing the Service to you.
                      </li>
                      <li>
                        <strong>Data Portability:</strong> You may export your data at any time through the
                        Service&apos;s export functionality or via our API.
                      </li>
                      <li>
                        <strong>Data Deletion:</strong> Upon account termination or your request, we will delete
                        your data within 30 days, except as required by law or for legitimate business purposes
                        (such as maintaining billing records).
                      </li>
                      <li>
                        <strong>No Training:</strong> We do not use your uploaded documents or queries to train
                        our AI models without your explicit opt-in consent.
                      </li>
                    </ul>
                  </SectionBody>
                </motion.section>

                <motion.section variants={fadeUp} custom={7} id="intellectual-property">
                  <SectionHeading>6. Intellectual Property</SectionHeading>
                  <SectionBody>
                    <p>
                      The Service, including its original content, features, and functionality, is owned by NexusAI
                      and is protected by international copyright, trademark, patent, trade secret, and other
                      intellectual property laws.
                    </p>
                    <p>
                      Our trademarks, service marks, logos, and trade names may not be used in connection with any
                      product or service without our prior written consent. Nothing in these Terms grants you any
                      right to use NexusAI&apos;s branding or intellectual property.
                    </p>
                    <p>
                      The AI-generated responses produced by the Service are provided to you for your use. However,
                      you acknowledge that similar responses may be generated for other users asking similar
                      questions, and NexusAI does not claim ownership over AI-generated outputs.
                    </p>
                  </SectionBody>
                </motion.section>

                <motion.section variants={fadeUp} custom={8} id="prohibited-use">
                  <SectionHeading>7. Prohibited Use</SectionHeading>
                  <SectionBody>
                    <p>You agree not to use the Service to:</p>
                    <ul>
                      <li>Upload, process, or distribute content that is illegal, harmful, threatening, abusive,
                        defamatory, or otherwise objectionable.</li>
                      <li>Violate any applicable local, state, national, or international law or regulation.</li>
                      <li>Infringe upon or violate the intellectual property rights of others.</li>
                      <li>Attempt to gain unauthorized access to other users&apos; accounts or our systems.</li>
                      <li>Interfere with or disrupt the integrity or performance of the Service.</li>
                      <li>Use the Service for competitive analysis, benchmarking, or to build a competing product.</li>
                      <li>Reverse engineer, decompile, or disassemble any part of the Service.</li>
                      <li>Use automated means to access the Service beyond the provided API, except with our
                        written consent.</li>
                    </ul>
                  </SectionBody>
                </motion.section>

                <motion.section variants={fadeUp} custom={9} id="disclaimers">
                  <SectionHeading>8. Disclaimers & Warranties</SectionHeading>
                  <SectionBody>
                    <p>
                      THE SERVICE IS PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS,
                      WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
                      IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
                      NON-INFRINGEMENT.
                    </p>
                    <p>
                      NexusAI does not warrant that the Service will be uninterrupted, error-free, or completely
                      secure. AI-generated responses may contain inaccuracies, and you should independently verify
                      any critical information obtained through the Service.
                    </p>
                    <p>
                      We make no guarantees regarding the accuracy, reliability, or completeness of any
                      AI-generated content. The Service is a tool to assist your work, not a substitute for
                      professional judgment.
                    </p>
                  </SectionBody>
                </motion.section>

                <motion.section variants={fadeUp} custom={10} id="limitation-liability">
                  <SectionHeading>9. Limitation of Liability</SectionHeading>
                  <SectionBody>
                    <p>
                      TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, NEXUSAI AND ITS OFFICERS, DIRECTORS,
                      EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
                      CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA,
                      USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
                    </p>
                    <ul>
                      <li>Your access to or use of (or inability to access or use) the Service.</li>
                      <li>Any conduct or content of any third party on the Service.</li>
                      <li>Any content obtained from the Service, including AI-generated responses.</li>
                      <li>Unauthorized access, use, or alteration of your transmissions or content.</li>
                    </ul>
                    <p>
                      Our total liability for all claims related to the Service shall not exceed the amount you
                      paid to NexusAI during the twelve (12) months preceding the claim.
                    </p>
                  </SectionBody>
                </motion.section>

                <motion.section variants={fadeUp} custom={11} id="indemnification">
                  <SectionHeading>10. Indemnification</SectionHeading>
                  <SectionBody>
                    <p>
                      You agree to defend, indemnify, and hold harmless NexusAI, its affiliates, and their
                      respective officers, directors, employees, and agents from and against any claims, damages,
                      obligations, losses, liabilities, costs, or expenses (including reasonable attorneys&apos;
                      fees) arising from:
                    </p>
                    <ul>
                      <li>Your use of the Service.</li>
                      <li>Your violation of these Terms.</li>
                      <li>Your violation of any third-party rights, including intellectual property rights.</li>
                      <li>Any content you upload, process, or transmit through the Service.</li>
                    </ul>
                  </SectionBody>
                </motion.section>

                <motion.section variants={fadeUp} custom={12} id="termination">
                  <SectionHeading>11. Termination</SectionHeading>
                  <SectionBody>
                    <p>
                      Either party may terminate this agreement at any time:
                    </p>
                    <ul>
                      <li>
                        <strong>By You:</strong> You may close your account at any time through your account
                        settings or by contacting our support team. Termination does not entitle you to a refund
                        of prepaid fees.
                      </li>
                      <li>
                        <strong>By NexusAI:</strong> We may suspend or terminate your access immediately, without
                        prior notice, if you violate these Terms, engage in fraudulent activity, or if required by
                        law.
                      </li>
                    </ul>
                    <p>
                      Upon termination, your right to use the Service ceases immediately. We will retain your data
                      for 30 days following termination to allow for data export, after which it will be
                      permanently deleted unless retention is required by law.
                    </p>
                    <p>
                      Sections that by their nature should survive termination will survive, including but not
                      limited to: intellectual property provisions, warranty disclaimers, limitation of liability,
                      and indemnification.
                    </p>
                  </SectionBody>
                </motion.section>

                <motion.section variants={fadeUp} custom={13} id="modifications">
                  <SectionHeading>12. Modifications to Terms</SectionHeading>
                  <SectionBody>
                    <p>
                      We reserve the right to modify these Terms at any time. When we make material changes, we
                      will notify you by:
                    </p>
                    <ul>
                      <li>Posting the updated Terms on our website with a revised &ldquo;Last Updated&rdquo; date.</li>
                      <li>Sending an email notification to the address associated with your account.</li>
                      <li>Displaying a prominent notice within the Service.</li>
                    </ul>
                    <p>
                      Your continued use of the Service after the effective date of any modifications constitutes
                      acceptance of the updated Terms. If you do not agree to the updated Terms, you must stop
                      using the Service.
                    </p>
                  </SectionBody>
                </motion.section>

                <motion.section variants={fadeUp} custom={14} id="governing-law">
                  <SectionHeading>13. Governing Law</SectionHeading>
                  <SectionBody>
                    <p>
                      These Terms shall be governed by and construed in accordance with the laws of the State of
                      Delaware, United States, without regard to its conflict of law provisions.
                    </p>
                    <p>
                      Any disputes arising out of or relating to these Terms or the Service shall be resolved
                      exclusively in the state or federal courts located in Wilmington, Delaware. You consent to
                      the personal jurisdiction of these courts and waive any objection to venue.
                    </p>
                    <p>
                      For users located in the European Union, nothing in these Terms affects your rights under
                      applicable EU consumer protection laws. Any mandatory consumer protection provisions of your
                      country of residence shall apply.
                    </p>
                  </SectionBody>
                </motion.section>

                <motion.section variants={fadeUp} custom={15} id="contact">
                  <SectionHeading>14. Contact Us</SectionHeading>
                  <SectionBody>
                    <p>
                      If you have any questions about these Terms, please contact us:
                    </p>
                    <ul>
                      <li>
                        <strong>Email:</strong>{" "}
                        <a href="mailto:legal@nexusai.com" className="text-[#C5A059] hover:underline">
                          legal@nexusai.com
                        </a>
                      </li>
                      <li>
                        <strong>Address:</strong> NexusAI, Inc., 1209 Orange Street, Wilmington, DE 19801, United States
                      </li>
                    </ul>
                  </SectionBody>
                </motion.section>
              </div>

              {/* Footer link to Privacy Policy */}
              <motion.div
                variants={fadeUp}
                custom={16}
                className="mt-16 pt-8 border-t border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.12)]"
              >
                <Link
                  href="/privacy"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#C5A059] hover:underline group"
                >
                  Read our Privacy Policy
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
                <p className="mt-3 text-xs text-[#9CA3AF] dark:text-[#71717A]">
                  © {new Date().getFullYear()} NexusAI, Inc. All rights reserved.
                </p>
              </motion.div>
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  )
}

/* ── Shared sub-components ── */

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-semibold text-[#18181B] dark:text-[#F8F9FA] tracking-tight mb-4">
      {children}
    </h2>
  )
}

function SectionBody({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="space-y-4 text-[15px] leading-relaxed text-[#4B5563] dark:text-[#A1A1AA]
                 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2
                 [&_strong]:text-[#18181B] [&_strong]:dark:text-[#F8F9FA] [&_strong]:font-medium"
    >
      {children}
    </div>
  )
}
