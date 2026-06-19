"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, ArrowUpRight, Shield } from "lucide-react"
import { LogoMark } from "@/components/brand/LogoMark"

const LAST_UPDATED = "June 1, 2026"

const sections = [
  { id: "information-we-collect", title: "Information We Collect" },
  { id: "how-we-use", title: "How We Use Your Data" },
  { id: "cookies", title: "Cookies & Tracking" },
  { id: "data-sharing", title: "Data Sharing & Third Parties" },
  { id: "data-storage", title: "Data Storage & Security" },
  { id: "data-retention", title: "Data Retention" },
  { id: "gdpr", title: "GDPR Rights (EU Users)" },
  { id: "ccpa", title: "CCPA Rights (California)" },
  { id: "international-transfers", title: "International Data Transfers" },
  { id: "children", title: "Children's Privacy" },
  { id: "changes", title: "Changes to This Policy" },
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

export default function PrivacyPolicyPage() {
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
                          ? "text-[#C5A059] bg-[rgba(212,175,55,0.08)] dark:bg-[#C5A059]/10 font-medium"
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
                  <div className="w-10 h-10 rounded-xl bg-[#EEF6F1] dark:bg-[#7CB69E]/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-[#7CB69E]" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] dark:text-[#71717A]">
                    Legal
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-[#18181B] dark:text-[#F8F9FA] tracking-tight mb-4">
                  Privacy Policy
                </h1>
                <p className="text-[#9CA3AF] dark:text-[#71717A] text-sm">
                  Last updated: {LAST_UPDATED}
                </p>
              </motion.div>

              {/* Introduction */}
              <motion.div variants={fadeUp} custom={1} className="prose-section mb-12">
                <p className="text-[#4B5563] dark:text-[#A1A1AA] leading-relaxed text-[15px]">
                  At NexusAI, your privacy is fundamental to everything we build. This Privacy Policy explains how
                  we collect, use, disclose, and safeguard your information when you use our multi-agent RAG
                  platform. We are committed to transparency and to giving you control over your personal data. This
                  policy applies to all users worldwide, including those protected under the GDPR and CCPA. Please
                  also review our{" "}
                  <Link href="/terms" className="text-[#C5A059] hover:underline">
                    Terms of Service
                  </Link>
                  .
                </p>
              </motion.div>

              {/* Sections */}
              <div className="space-y-14">
                <motion.section variants={fadeUp} custom={2} id="information-we-collect">
                  <SectionHeading>1. Information We Collect</SectionHeading>
                  <SectionBody>
                    <h3>1.1 Information You Provide</h3>
                    <ul>
                      <li>
                        <strong>Account Information:</strong> When you create an account, we collect your name,
                        email address, and password (stored as a cryptographic hash).
                      </li>
                      <li>
                        <strong>Payment Information:</strong> If you subscribe to a paid plan, payment details are
                        processed by our third-party payment processor (Stripe). We do not store your full credit
                        card number.
                      </li>
                      <li>
                        <strong>Documents & Queries:</strong> Files you upload and questions you ask are processed
                        by our multi-agent system to provide the Service. We treat your documents as confidential.
                      </li>
                      <li>
                        <strong>Communications:</strong> When you contact our support team, we retain the
                        correspondence to resolve your inquiry and improve our Service.
                      </li>
                    </ul>

                    <h3>1.2 Information Collected Automatically</h3>
                    <ul>
                      <li>
                        <strong>Usage Data:</strong> We collect information about how you interact with the
                        Service, including pages visited, features used, queries made, and timestamps.
                      </li>
                      <li>
                        <strong>Device Information:</strong> Browser type, operating system, device type, screen
                        resolution, and language preferences.
                      </li>
                      <li>
                        <strong>Log Data:</strong> IP addresses, access times, referring URLs, and error logs for
                        security and diagnostic purposes.
                      </li>
                    </ul>
                  </SectionBody>
                </motion.section>

                <motion.section variants={fadeUp} custom={3} id="how-we-use">
                  <SectionHeading>2. How We Use Your Data</SectionHeading>
                  <SectionBody>
                    <p>We use the information we collect for the following purposes:</p>
                    <ul>
                      <li>
                        <strong>Service Delivery:</strong> To process your documents, generate AI-powered
                        responses, and maintain your workspace.
                      </li>
                      <li>
                        <strong>Account Management:</strong> To create and manage your account, authenticate your
                        identity, and process payments.
                      </li>
                      <li>
                        <strong>Service Improvement:</strong> To analyze usage patterns (in aggregate), identify
                        bugs, and improve platform performance and features.
                      </li>
                      <li>
                        <strong>Communications:</strong> To send you service-related notices, security alerts,
                        and, with your consent, product updates and marketing communications.
                      </li>
                      <li>
                        <strong>Security:</strong> To detect, prevent, and address fraud, abuse, and security
                        incidents.
                      </li>
                      <li>
                        <strong>Legal Compliance:</strong> To comply with legal obligations, resolve disputes, and
                        enforce our Terms of Service.
                      </li>
                    </ul>
                    <p>
                      <strong>Important:</strong> We do not use your uploaded documents or query content to train
                      our AI models unless you explicitly opt in to our data improvement program.
                    </p>
                  </SectionBody>
                </motion.section>

                <motion.section variants={fadeUp} custom={4} id="cookies">
                  <SectionHeading>3. Cookies & Tracking Technologies</SectionHeading>
                  <SectionBody>
                    <p>
                      NexusAI uses cookies and similar tracking technologies to enhance your experience. You can
                      manage your cookie preferences through our cookie banner or your browser settings.
                    </p>

                    <h3>Types of Cookies We Use</h3>
                    <ul>
                      <li>
                        <strong>Essential Cookies:</strong> Required for the Service to function. These handle
                        authentication, session management, and security. Cannot be disabled.
                      </li>
                      <li>
                        <strong>Functional Cookies:</strong> Remember your preferences such as theme (light/dark
                        mode), workspace layout, and language settings.
                      </li>
                      <li>
                        <strong>Analytics Cookies:</strong> Help us understand how users interact with the
                        Service. We use privacy-respecting analytics that do not track individual users across
                        sites.
                      </li>
                      <li>
                        <strong>Performance Cookies:</strong> Monitor Service performance and help us identify
                        areas for optimization.
                      </li>
                    </ul>
                    <p>
                      We do not use advertising or cross-site tracking cookies. You may disable non-essential
                      cookies at any time without affecting the core functionality of the Service.
                    </p>
                  </SectionBody>
                </motion.section>

                <motion.section variants={fadeUp} custom={5} id="data-sharing">
                  <SectionHeading>4. Data Sharing & Third-Party Services</SectionHeading>
                  <SectionBody>
                    <p>
                      We do not sell your personal data. We share information only in the following limited
                      circumstances:
                    </p>
                    <ul>
                      <li>
                        <strong>Service Providers:</strong> We work with trusted third-party providers who assist
                        in operating the Service, including cloud hosting (AWS), payment processing (Stripe),
                        email delivery, and error monitoring. These providers are contractually bound to protect
                        your data.
                      </li>
                      <li>
                        <strong>AI Model Providers:</strong> Queries may be processed through third-party AI
                        model APIs (e.g., OpenAI, Anthropic). We send only the minimum data necessary and have
                        data processing agreements in place with each provider. Your data is not used to train
                        their models.
                      </li>
                      <li>
                        <strong>Legal Requirements:</strong> We may disclose information if required by law,
                        court order, or governmental regulation, or when we believe disclosure is necessary to
                        protect our rights, your safety, or the safety of others.
                      </li>
                      <li>
                        <strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of
                        assets, your data may be transferred to the acquiring entity, subject to the same privacy
                        commitments.
                      </li>
                    </ul>
                  </SectionBody>
                </motion.section>

                <motion.section variants={fadeUp} custom={6} id="data-storage">
                  <SectionHeading>5. Data Storage & Security</SectionHeading>
                  <SectionBody>
                    <p>
                      We implement industry-standard security measures to protect your information:
                    </p>
                    <ul>
                      <li>
                        <strong>Encryption:</strong> All data is encrypted in transit (TLS 1.3) and at rest
                        (AES-256).
                      </li>
                      <li>
                        <strong>Access Controls:</strong> Strict role-based access controls limit employee access
                        to user data on a need-to-know basis.
                      </li>
                      <li>
                        <strong>Infrastructure:</strong> Our services are hosted on SOC 2 Type II certified cloud
                        infrastructure with regular security audits.
                      </li>
                      <li>
                        <strong>Monitoring:</strong> We employ continuous monitoring, intrusion detection, and
                        automated threat response systems.
                      </li>
                      <li>
                        <strong>Incident Response:</strong> In the event of a data breach, we will notify
                        affected users and relevant authorities within 72 hours as required by applicable law.
                      </li>
                    </ul>
                    <p>
                      While we strive to protect your data, no method of transmission or storage is 100% secure.
                      We encourage you to use strong, unique passwords and enable two-factor authentication.
                    </p>
                  </SectionBody>
                </motion.section>

                <motion.section variants={fadeUp} custom={7} id="data-retention">
                  <SectionHeading>6. Data Retention</SectionHeading>
                  <SectionBody>
                    <p>We retain your data only for as long as necessary to fulfill the purposes described in
                      this policy:</p>
                    <ul>
                      <li>
                        <strong>Account Data:</strong> Retained while your account is active, plus 30 days after
                        deletion to allow for account recovery.
                      </li>
                      <li>
                        <strong>Documents & Queries:</strong> Retained while your account is active. Deleted
                        within 30 days of account termination or upon your request.
                      </li>
                      <li>
                        <strong>Usage Analytics:</strong> Aggregated, anonymized analytics data may be retained
                        indefinitely for product improvement.
                      </li>
                      <li>
                        <strong>Billing Records:</strong> Financial records are retained for 7 years as required
                        by tax and accounting regulations.
                      </li>
                      <li>
                        <strong>Security Logs:</strong> Access and security logs are retained for up to 12 months
                        for security and fraud prevention purposes.
                      </li>
                    </ul>
                  </SectionBody>
                </motion.section>

                <motion.section variants={fadeUp} custom={8} id="gdpr">
                  <SectionHeading>7. GDPR Rights (EU/EEA Users)</SectionHeading>
                  <SectionBody>
                    <p>
                      If you are located in the European Union or European Economic Area, you have the following
                      rights under the General Data Protection Regulation (GDPR):
                    </p>
                    <ul>
                      <li>
                        <strong>Right of Access:</strong> Request a copy of the personal data we hold about you.
                      </li>
                      <li>
                        <strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete
                        data.
                      </li>
                      <li>
                        <strong>Right to Erasure:</strong> Request deletion of your personal data (&ldquo;right
                        to be forgotten&rdquo;).
                      </li>
                      <li>
                        <strong>Right to Restrict Processing:</strong> Request that we limit how we use your
                        data.
                      </li>
                      <li>
                        <strong>Right to Data Portability:</strong> Receive your data in a structured, commonly
                        used, machine-readable format.
                      </li>
                      <li>
                        <strong>Right to Object:</strong> Object to our processing of your data for certain
                        purposes, including direct marketing.
                      </li>
                      <li>
                        <strong>Right to Withdraw Consent:</strong> Where processing is based on consent, you may
                        withdraw it at any time without affecting prior processing.
                      </li>
                    </ul>
                    <p>
                      To exercise any of these rights, contact us at{" "}
                      <a href="mailto:privacy@nexusai.com" className="text-[#C5A059] hover:underline">
                        privacy@nexusai.com
                      </a>
                      . We will respond within 30 days. You also have the right to lodge a complaint with your
                      local data protection authority.
                    </p>
                    <p>
                      <strong>Legal Basis for Processing:</strong> We process your data based on: (a) performance
                      of our contract with you, (b) your consent, (c) our legitimate interests (such as security
                      and service improvement), and (d) compliance with legal obligations.
                    </p>
                  </SectionBody>
                </motion.section>

                <motion.section variants={fadeUp} custom={9} id="ccpa">
                  <SectionHeading>8. CCPA Rights (California Residents)</SectionHeading>
                  <SectionBody>
                    <p>
                      If you are a California resident, the California Consumer Privacy Act (CCPA) grants you
                      specific rights regarding your personal information:
                    </p>
                    <ul>
                      <li>
                        <strong>Right to Know:</strong> You may request disclosure of the categories and specific
                        pieces of personal information we have collected about you.
                      </li>
                      <li>
                        <strong>Right to Delete:</strong> You may request deletion of your personal information,
                        subject to certain exceptions.
                      </li>
                      <li>
                        <strong>Right to Opt-Out:</strong> You have the right to opt out of the sale of your
                        personal information. Note: NexusAI does not sell personal information.
                      </li>
                      <li>
                        <strong>Right to Non-Discrimination:</strong> We will not discriminate against you for
                        exercising your CCPA rights.
                      </li>
                    </ul>
                    <p>
                      To exercise your rights, contact us at{" "}
                      <a href="mailto:privacy@nexusai.com" className="text-[#C5A059] hover:underline">
                        privacy@nexusai.com
                      </a>{" "}
                      or use the data management tools in your account settings. We will verify your identity
                      before processing any request.
                    </p>
                    <p>
                      In the preceding 12 months, we have collected the following categories of personal
                      information: identifiers (name, email), commercial information (subscription history),
                      internet activity (usage data), and professional information (organization details).
                    </p>
                  </SectionBody>
                </motion.section>

                <motion.section variants={fadeUp} custom={10} id="international-transfers">
                  <SectionHeading>9. International Data Transfers</SectionHeading>
                  <SectionBody>
                    <p>
                      NexusAI operates globally, and your data may be transferred to and processed in countries
                      other than your country of residence. We ensure that all international data transfers are
                      protected by appropriate safeguards:
                    </p>
                    <ul>
                      <li>Standard Contractual Clauses (SCCs) approved by the European Commission.</li>
                      <li>Data Processing Agreements with all sub-processors.</li>
                      <li>Adequacy decisions where applicable.</li>
                    </ul>
                    <p>
                      Our primary data processing facilities are located in the United States and the European
                      Union.
                    </p>
                  </SectionBody>
                </motion.section>

                <motion.section variants={fadeUp} custom={11} id="children">
                  <SectionHeading>10. Children&apos;s Privacy</SectionHeading>
                  <SectionBody>
                    <p>
                      NexusAI is not intended for users under the age of 18 (or the applicable age of majority in
                      your jurisdiction). We do not knowingly collect personal information from children. If we
                      become aware that we have collected data from a child, we will promptly delete that
                      information.
                    </p>
                    <p>
                      If you are a parent or guardian and believe your child has provided us with personal
                      information, please contact us at{" "}
                      <a href="mailto:privacy@nexusai.com" className="text-[#C5A059] hover:underline">
                        privacy@nexusai.com
                      </a>
                      .
                    </p>
                  </SectionBody>
                </motion.section>

                <motion.section variants={fadeUp} custom={12} id="changes">
                  <SectionHeading>11. Changes to This Policy</SectionHeading>
                  <SectionBody>
                    <p>
                      We may update this Privacy Policy from time to time to reflect changes in our practices,
                      technology, legal requirements, or other factors. When we make material changes:
                    </p>
                    <ul>
                      <li>We will update the &ldquo;Last Updated&rdquo; date at the top of this page.</li>
                      <li>We will notify you via email or a prominent notice in the Service.</li>
                      <li>
                        For significant changes, we may request your explicit consent before continuing to
                        process your data under the new policy.
                      </li>
                    </ul>
                    <p>
                      We encourage you to review this policy periodically to stay informed about how we protect
                      your data.
                    </p>
                  </SectionBody>
                </motion.section>

                <motion.section variants={fadeUp} custom={13} id="contact">
                  <SectionHeading>12. Contact Us</SectionHeading>
                  <SectionBody>
                    <p>
                      If you have questions or concerns about this Privacy Policy, or wish to exercise your data
                      rights, please contact us:
                    </p>
                    <ul>
                      <li>
                        <strong>Privacy Team:</strong>{" "}
                        <a href="mailto:privacy@nexusai.com" className="text-[#C5A059] hover:underline">
                          privacy@nexusai.com
                        </a>
                      </li>
                      <li>
                        <strong>Data Protection Officer:</strong>{" "}
                        <a href="mailto:dpo@nexusai.com" className="text-[#C5A059] hover:underline">
                          dpo@nexusai.com
                        </a>
                      </li>
                      <li>
                        <strong>Postal Address:</strong> NexusAI, Inc., 1209 Orange Street, Wilmington, DE 19801,
                        United States
                      </li>
                    </ul>
                    <p>
                      We aim to respond to all privacy-related inquiries within 30 days.
                    </p>
                  </SectionBody>
                </motion.section>
              </div>

              {/* Footer link to Terms */}
              <motion.div
                variants={fadeUp}
                custom={14}
                className="mt-16 pt-8 border-t border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.12)]"
              >
                <Link
                  href="/terms"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#C5A059] hover:underline group"
                >
                  Read our Terms of Service
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
                 [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-[#18181B] [&_h3]:dark:text-[#F8F9FA] [&_h3]:mt-6 [&_h3]:mb-2
                 [&_strong]:text-[#18181B] [&_strong]:dark:text-[#F8F9FA] [&_strong]:font-medium"
    >
      {children}
    </div>
  )
}

