"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuthStore } from "@/store/authStore"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"
import { useI18n } from "@/lib/i18n"
import type { Language } from "@/locales/translations"
import {
  Check,
  BadgePercent,
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
  Building2,
  Sparkles,
} from "lucide-react"

type BillingCopy = {
  pageKicker: string
  pageTitle: string
  pageSubtitle: string
  monthly: string
  yearly: string
  save20: string
  currentPlan: string
  freeLabel: string
  activeLabel: string
  active: string
  upgradeToPro: string
  usageTitle: string
  usageReset: string
  aiQueries: string
  documentsUploaded: string
  percentUsed: string
  usageUpgradeHint: string
  invoiceHistory: string
  noInvoices: string
  noInvoicesHint: string
  downloadUnavailable: string
  invoiceDownloadAria: (id: string) => string
  pricingBadge: string
  pricingTitle: string
  pricingSubtitle: string
  currentPlanBadge: string
  billedPerMonth: string
  billedYear: string
  saveAmount: string
  freeForever: string
  activePlan: string
  startTrial: string
  creditsSuffix: string
  faqTitle: string
  stillQuestions: string
  contactSupport: string
  trustItems: [string, string, string, string]
}

type PlanDefinition = {
  id: "starter" | "pro" | "enterprise"
  name: string
  badge: string | null
  description: string
  monthlyPrice: number
  yearlyPrice: number
  currency: string
  icon: typeof Sparkles
  iconBg: string
  iconColor: string
  cta: string
  ctaVariant: "primary" | "secondary"
  popular: boolean
  current: boolean
  credits: number
  features: string[]
}

type FaqItem = {
  q: string
  a: string
}

const BASE_PLANS: PlanDefinition[] = [
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
    ctaVariant: "secondary",
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
    ctaVariant: "primary",
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
    iconBg: "bg-[#EEF4FF] border border-[#BFDBFE]",
    iconColor: "text-[#3B6FE8]",
    cta: "Get Enterprise",
    ctaVariant: "secondary",
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

const BASE_FAQS: FaqItem[] = [
  {
    q: "Can I pay in Indian Rupees (INR)?",
    a: "Absolutely. All prices are in INR. Payments are handled through secure hosted checkout once Stripe billing is configured.",
  },
  {
    q: "Do you provide GST-compliant invoices?",
    a: "Invoices appear here after real checkout and webhook billing are configured. No mock invoices are shown.",
  },
  {
    q: "Can I switch plans or cancel anytime?",
    a: "Yes. You can upgrade, downgrade, or cancel at any time. Downgrades take effect at the end of the current billing cycle. No lock-in and no cancellation fees.",
  },
  {
    q: "What happens when my free plan quota runs out?",
    a: "You will receive a notification when you reach 80% usage. Once exhausted, queries are paused while your documents remain safe. Upgrade to Pro to unlock more capacity instantly.",
  },
  {
    q: "Is there a discount for startups or educational institutions?",
    a: "Yes. We offer discounted Pro pricing for eligible startups, NGOs, and educational institutions. Contact support@nexusai.in with your verification documents.",
  },
]

const BILLING_COPY: Record<Language, BillingCopy> = {
  en: {
    pageKicker: "Billing",
    pageTitle: "Plans & Billing",
    pageSubtitle: "Manage your subscription, review usage, and download invoices.",
    monthly: "Monthly",
    yearly: "Yearly",
    save20: "Save 20%",
    currentPlan: "Current Plan",
    freeLabel: "Free",
    activeLabel: "Active",
    active: "Active",
    upgradeToPro: "Upgrade to Pro",
    usageTitle: "Current Usage",
    usageReset: "Resets on 1st July 2026",
    aiQueries: "AI Queries",
    documentsUploaded: "Documents Uploaded",
    percentUsed: "used",
    usageUpgradeHint: "for unlimited queries and documents with no monthly caps.",
    invoiceHistory: "Invoice History",
    noInvoices: "No invoices yet",
    noInvoicesHint: "Your billing history will appear here after your first payment.",
    downloadUnavailable: "Invoice download is not configured for this billing provider yet.",
    invoiceDownloadAria: (id) => `Download invoice ${id}`,
    pricingBadge: "Simple, transparent pricing",
    pricingTitle: "Choose the right plan for you",
    pricingSubtitle: "All plans include INR billing, GST invoicing, and data residency in India.",
    currentPlanBadge: "Current Plan",
    billedPerMonth: "/month",
    billedYear: "Billed",
    saveAmount: "Save",
    freeForever: "Free forever · no credit card required",
    activePlan: "Active Plan",
    startTrial: "Start Free 7 Day Trial",
    creditsSuffix: "NexusAI Credits",
    faqTitle: "Frequently Asked Questions",
    stillQuestions: "Still have questions?",
    contactSupport: "Contact Support →",
    trustItems: [
      "Pay in INR via UPI, Cards & NetBanking",
      "Data hosted in India (Mumbai region)",
      "GST invoice included on all plans",
      "Secured by Stripe Checkout",
    ],
  },
  es: {
    pageKicker: "Facturacion",
    pageTitle: "Planes y Facturacion",
    pageSubtitle: "Administra tu suscripcion, revisa el uso y descarga facturas.",
    monthly: "Mensual",
    yearly: "Anual",
    save20: "Ahorra 20%",
    currentPlan: "Plan actual",
    freeLabel: "Gratis",
    activeLabel: "Activo",
    active: "Activo",
    upgradeToPro: "Actualizar a Pro",
    usageTitle: "Uso actual",
    usageReset: "Se restablece el 1 de julio de 2026",
    aiQueries: "Consultas de IA",
    documentsUploaded: "Documentos subidos",
    percentUsed: "usado",
    usageUpgradeHint: "para consultas y documentos ilimitados sin limites mensuales.",
    invoiceHistory: "Historial de facturas",
    noInvoices: "Aun no hay facturas",
    noInvoicesHint: "Tu historial de facturacion aparecera aqui despues de tu primer pago.",
    downloadUnavailable: "La descarga de facturas aun no esta configurada para este proveedor de facturacion.",
    invoiceDownloadAria: (id) => `Descargar factura ${id}`,
    pricingBadge: "Precios simples y transparentes",
    pricingTitle: "Elige el plan adecuado para ti",
    pricingSubtitle: "Todos los planes incluyen facturacion en INR, factura GST y residencia de datos en India.",
    currentPlanBadge: "Plan actual",
    billedPerMonth: "/mes",
    billedYear: "Facturado",
    saveAmount: "Ahorra",
    freeForever: "Gratis para siempre · no se requiere tarjeta",
    activePlan: "Plan activo",
    startTrial: "Iniciar prueba gratis de 7 dias",
    creditsSuffix: "Creditos NexusAI",
    faqTitle: "Preguntas frecuentes",
    stillQuestions: "Todavia tienes preguntas?",
    contactSupport: "Contactar soporte →",
    trustItems: [
      "Paga en INR con UPI, tarjetas y NetBanking",
      "Datos alojados en India (region de Mumbai)",
      "Factura GST incluida en todos los planes",
      "Protegido por Stripe Checkout",
    ],
  },
  fr: {
    pageKicker: "Facturation",
    pageTitle: "Forfaits et Facturation",
    pageSubtitle: "Gerez votre abonnement, consultez l'utilisation et telechargez les factures.",
    monthly: "Mensuel",
    yearly: "Annuel",
    save20: "Economisez 20%",
    currentPlan: "Forfait actuel",
    freeLabel: "Gratuit",
    activeLabel: "Actif",
    active: "Actif",
    upgradeToPro: "Passer a Pro",
    usageTitle: "Utilisation actuelle",
    usageReset: "Reinitialise le 1 juillet 2026",
    aiQueries: "Requetes IA",
    documentsUploaded: "Documents televerses",
    percentUsed: "utilise",
    usageUpgradeHint: "pour des requetes et documents sans limite mensuelle.",
    invoiceHistory: "Historique des factures",
    noInvoices: "Aucune facture pour le moment",
    noInvoicesHint: "Votre historique de facturation apparaitra ici apres votre premier paiement.",
    downloadUnavailable: "Le telechargement des factures n'est pas encore configure pour ce fournisseur.",
    invoiceDownloadAria: (id) => `Telecharger la facture ${id}`,
    pricingBadge: "Tarification simple et transparente",
    pricingTitle: "Choisissez le forfait qui vous convient",
    pricingSubtitle: "Tous les forfaits incluent la facturation en INR, la facture GST et l'hebergement des donnees en Inde.",
    currentPlanBadge: "Forfait actuel",
    billedPerMonth: "/mois",
    billedYear: "Facture",
    saveAmount: "Economisez",
    freeForever: "Gratuit a vie · aucune carte requise",
    activePlan: "Forfait actif",
    startTrial: "Demarrer l'essai gratuit de 7 jours",
    creditsSuffix: "Credits NexusAI",
    faqTitle: "Questions frequentes",
    stillQuestions: "Vous avez encore des questions ?",
    contactSupport: "Contacter le support →",
    trustItems: [
      "Payez en INR via UPI, cartes et NetBanking",
      "Donnees hebergees en Inde (region de Mumbai)",
      "Facture GST incluse dans tous les forfaits",
      "Securise par Stripe Checkout",
    ],
  },
  de: {
    pageKicker: "Abrechnung",
    pageTitle: "Tarife und Abrechnung",
    pageSubtitle: "Verwalten Sie Ihr Abo, prufen Sie die Nutzung und laden Sie Rechnungen herunter.",
    monthly: "Monatlich",
    yearly: "Jahrlich",
    save20: "20% sparen",
    currentPlan: "Aktueller Tarif",
    freeLabel: "Kostenlos",
    activeLabel: "Aktiv",
    active: "Aktiv",
    upgradeToPro: "Auf Pro wechseln",
    usageTitle: "Aktuelle Nutzung",
    usageReset: "Wird am 1. Juli 2026 zuruckgesetzt",
    aiQueries: "KI-Anfragen",
    documentsUploaded: "Hochgeladene Dokumente",
    percentUsed: "verbraucht",
    usageUpgradeHint: "fur unbegrenzte Anfragen und Dokumente ohne monatliche Limits.",
    invoiceHistory: "Rechnungsverlauf",
    noInvoices: "Noch keine Rechnungen",
    noInvoicesHint: "Ihr Rechnungsverlauf erscheint hier nach Ihrer ersten Zahlung.",
    downloadUnavailable: "Der Rechnungsdownload ist fur diesen Anbieter noch nicht konfiguriert.",
    invoiceDownloadAria: (id) => `Rechnung ${id} herunterladen`,
    pricingBadge: "Einfache, transparente Preise",
    pricingTitle: "Wahlen Sie den richtigen Tarif",
    pricingSubtitle: "Alle Tarife enthalten INR-Abrechnung, GST-Rechnungen und Datenhosting in Indien.",
    currentPlanBadge: "Aktueller Tarif",
    billedPerMonth: "/Monat",
    billedYear: "Abgerechnet",
    saveAmount: "Sie sparen",
    freeForever: "Fur immer kostenlos · keine Karte erforderlich",
    activePlan: "Aktiver Tarif",
    startTrial: "Kostenlose 7-Tage-Testphase starten",
    creditsSuffix: "NexusAI Credits",
    faqTitle: "Haufig gestellte Fragen",
    stillQuestions: "Noch Fragen?",
    contactSupport: "Support kontaktieren →",
    trustItems: [
      "Zahlen Sie in INR per UPI, Karten und NetBanking",
      "Daten in Indien gehostet (Region Mumbai)",
      "GST-Rechnung in allen Tarifen enthalten",
      "Gesichert durch Stripe Checkout",
    ],
  },
}

const PLAN_TRANSLATIONS: Record<Exclude<Language, "en">, Record<PlanDefinition["id"], Pick<PlanDefinition, "name" | "badge" | "description" | "cta" | "features">>> = {
  es: {
    starter: {
      name: "Inicial",
      badge: null,
      description: "Perfecto para comenzar con IA",
      cta: "Elegir plan",
      features: [
        "2 cargas de documentos",
        "50 consultas de IA / mes",
        "Canal RAG basico",
        "Soporte de la comunidad",
        "1 espacio de trabajo",
        "Historial de chat de 7 dias",
      ],
    },
    pro: {
      name: "Pro",
      badge: "Mas popular",
      description: "Ideal para usuarios avanzados y creadores",
      cta: "Actualizar a Pro",
      features: [
        "1.000 cargas de documentos",
        "100.000 consultas de IA",
        "Canal RAG con multiples agentes",
        "Soporte prioritario por correo y chat",
        "5 espacios de trabajo",
        "Historial de chat de 1 ano",
        "Panel avanzado de analiticas",
        "Instrucciones de IA personalizadas",
        "Acceso API (10K solicitudes/mes)",
      ],
    },
    enterprise: {
      name: "Empresarial",
      badge: null,
      description: "Para equipos que requieren maxima potencia",
      cta: "Obtener empresarial",
      features: [
        "Todo en Pro",
        "50 espacios de trabajo",
        "Integracion SSO / SAML",
        "Gerente de cuenta dedicado",
        "Residencia de datos personalizada (India)",
        "Garantia de disponibilidad SLA del 99,9%",
        "Historial de chat permanente",
        "Opcion de despliegue local",
        "Cumplimiento SOC 2 e ISO 27001",
        "Facturacion por factura y orden de compra con GST",
        "Acceso API ilimitado",
      ],
    },
  },
  fr: {
    starter: {
      name: "Starter",
      badge: null,
      description: "Parfait pour demarrer avec l'IA",
      cta: "Choisir ce forfait",
      features: [
        "2 televersements de documents",
        "50 requetes IA / mois",
        "Pipeline RAG de base",
        "Support communautaire",
        "1 espace de travail",
        "Historique de chat sur 7 jours",
      ],
    },
    pro: {
      name: "Pro",
      badge: "Le plus populaire",
      description: "Ideal pour les utilisateurs avances et createurs",
      cta: "Passer a Pro",
      features: [
        "1 000 televersements de documents",
        "100 000 requetes IA",
        "Pipeline RAG multi-agents",
        "Support prioritaire par email et chat",
        "5 espaces de travail",
        "Historique de chat sur 1 an",
        "Tableau analytique avance",
        "Instructions IA personnalisees",
        "Acces API (10K req/mois)",
      ],
    },
    enterprise: {
      name: "Entreprise",
      badge: null,
      description: "Pour les equipes qui exigent une puissance maximale",
      cta: "Obtenir Entreprise",
      features: [
        "Tout ce qui est dans Pro",
        "50 espaces de travail",
        "Integration SSO / SAML",
        "Responsable de compte dedie",
        "Residence des donnees personnalisee (Inde)",
        "Garantie de disponibilite SLA 99,9%",
        "Historique de chat permanent",
        "Option de deploiement sur site",
        "Conformite SOC 2 et ISO 27001",
        "Facturation par facture et bon de commande avec GST",
        "Acces API illimite",
      ],
    },
  },
  de: {
    starter: {
      name: "Starter",
      badge: null,
      description: "Perfekt fur den Einstieg mit KI",
      cta: "Tarif wahlen",
      features: [
        "2 Dokument-Uploads",
        "50 KI-Anfragen / Monat",
        "Grundlegende RAG-Pipeline",
        "Community-Support",
        "1 Arbeitsbereich",
        "7 Tage Chatverlauf",
      ],
    },
    pro: {
      name: "Pro",
      badge: "Am beliebtesten",
      description: "Ideal fur Power-User und Creator",
      cta: "Auf Pro wechseln",
      features: [
        "1.000 Dokument-Uploads",
        "100.000 KI-Anfragen",
        "Multi-Agent-RAG-Pipeline",
        "Priorisierter E-Mail- und Chat-Support",
        "5 Arbeitsbereiche",
        "1 Jahr Chatverlauf",
        "Erweitertes Analyse-Dashboard",
        "Benutzerdefinierte KI-Anweisungen",
        "API-Zugang (10K Anfragen/Monat)",
      ],
    },
    enterprise: {
      name: "Enterprise",
      badge: null,
      description: "Fur Teams mit maximalem Leistungsbedarf",
      cta: "Enterprise anfragen",
      features: [
        "Alles aus Pro",
        "50 Arbeitsbereiche",
        "SSO / SAML-Integration",
        "Dedizierter Account Manager",
        "Benutzerdefinierter Datenstandort (Indien)",
        "99,9% SLA-Verfugbarkeitsgarantie",
        "Unbegrenzter Chatverlauf",
        "On-Prem-Bereitstellung moglich",
        "SOC 2- und ISO 27001-Konformitat",
        "Rechnungs- und Bestellabrechnung mit GST",
        "Unbegrenzter API-Zugriff",
      ],
    },
  },
}

const FAQ_TRANSLATIONS: Record<Exclude<Language, "en">, FaqItem[]> = {
  es: [
    {
      q: "Puedo pagar en rupias indias (INR)?",
      a: "Si. Todos los precios estan en INR. Los pagos se gestionan mediante un checkout seguro alojado cuando la facturacion de Stripe esta configurada.",
    },
    {
      q: "Ofrecen facturas compatibles con GST?",
      a: "Las facturas apareceran aqui cuando el checkout real y los webhooks de facturacion esten configurados. No mostramos facturas de ejemplo.",
    },
    {
      q: "Puedo cambiar de plan o cancelar en cualquier momento?",
      a: "Si. Puedes actualizar, bajar de plan o cancelar en cualquier momento. Las reducciones de plan entran en vigor al final del ciclo actual.",
    },
    {
      q: "Que pasa cuando se agota la cuota del plan gratuito?",
      a: "Recibiras una notificacion al llegar al 80% de uso. Cuando se agote, las consultas se pausaran y tus documentos seguiran seguros.",
    },
    {
      q: "Hay descuento para startups o instituciones educativas?",
      a: "Si. Ofrecemos precios reducidos para startups, ONG e instituciones educativas que cumplan los requisitos. Contacta a support@nexusai.in.",
    },
  ],
  fr: [
    {
      q: "Puis-je payer en roupies indiennes (INR) ?",
      a: "Oui. Tous les prix sont en INR. Les paiements sont traites via une page de paiement securisee lorsque Stripe est configure.",
    },
    {
      q: "Fournissez-vous des factures conformes a la GST ?",
      a: "Les factures apparaitront ici une fois le vrai checkout et la facturation webhook configures. Aucune facture fictive n'est affichee.",
    },
    {
      q: "Puis-je changer de forfait ou annuler a tout moment ?",
      a: "Oui. Vous pouvez mettre a niveau, retrograder ou annuler a tout moment. Les retrogradations prennent effet a la fin du cycle en cours.",
    },
    {
      q: "Que se passe-t-il lorsque le quota du forfait gratuit est epuise ?",
      a: "Vous recevrez une notification a 80% d'utilisation. Une fois epuise, les requetes sont suspendues et vos documents restent en securite.",
    },
    {
      q: "Existe-t-il une reduction pour les startups ou les etablissements scolaires ?",
      a: "Oui. Nous proposons des tarifs reduits pour certaines startups, ONG et institutions educatives. Contactez support@nexusai.in.",
    },
  ],
  de: [
    {
      q: "Kann ich in indischen Rupien (INR) bezahlen?",
      a: "Ja. Alle Preise sind in INR. Zahlungen werden uber einen sicheren gehosteten Checkout abgewickelt, sobald Stripe konfiguriert ist.",
    },
    {
      q: "Stellen Sie GST-konforme Rechnungen aus?",
      a: "Rechnungen erscheinen hier, sobald echter Checkout und Webhook-Abrechnung eingerichtet sind. Es werden keine Mock-Rechnungen angezeigt.",
    },
    {
      q: "Kann ich meinen Tarif jederzeit wechseln oder kundigen?",
      a: "Ja. Sie konnen jederzeit upgraden, downgraden oder kundigen. Downgrades werden zum Ende des aktuellen Abrechnungszeitraums wirksam.",
    },
    {
      q: "Was passiert, wenn mein kostenloses Kontingent aufgebraucht ist?",
      a: "Sie erhalten bei 80% Nutzung eine Benachrichtigung. Danach werden Anfragen pausiert, wahrend Ihre Dokumente sicher gespeichert bleiben.",
    },
    {
      q: "Gibt es Rabatte fur Startups oder Bildungseinrichtungen?",
      a: "Ja. Wir bieten reduzierte Pro-Preise fur qualifizierte Startups, NGOs und Bildungseinrichtungen. Kontaktieren Sie support@nexusai.in.",
    },
  ],
}

function formatINR(amount: number): string {
  if (amount === 0) return "0"
  return amount.toLocaleString("en-IN")
}

function getLocalizedPlans(language: Language): PlanDefinition[] {
  if (language === "en") {
    return BASE_PLANS
  }

  const localized = PLAN_TRANSLATIONS[language]
  return BASE_PLANS.map((plan) => ({
    ...plan,
    ...localized[plan.id],
  }))
}

function getLocalizedFaqs(language: Language): FaqItem[] {
  if (language === "en") {
    return BASE_FAQS
  }

  return FAQ_TRANSLATIONS[language]
}

function AnimatedPrice({ value, currency }: { value: number; currency: string }) {
  return (
    <span className="tabular-nums">
      {currency}
      {formatINR(value)}
    </span>
  )
}

function BillingToggle({ isYearly, onToggle, copy }: { isYearly: boolean; onToggle: () => void; copy: BillingCopy }) {
  return (
    <div className="mb-10 flex items-center justify-center gap-4">
      <span className={`text-sm font-medium transition-colors duration-200 ${!isYearly ? "text-[#18181B] dark:text-white" : "text-[#64748B] dark:text-[#94a3b8]"}`}>
        {copy.monthly}
      </span>
      <button
        onClick={onToggle}
        className="relative h-7 w-14 rounded-full border border-[rgba(0,0,0,0.08)] bg-[#E5E7EB] transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] dark:border-[rgba(255,255,255,0.08)] dark:bg-[#1A1A1A]"
        aria-label="Toggle billing period"
      >
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={`absolute top-1 h-5 w-5 rounded-full shadow-md ${
            isYearly ? "left-[calc(100%-24px)] bg-[#D4AF37]" : "left-1 border border-[rgba(0,0,0,0.1)] bg-white"
          }`}
        />
      </button>
      <span className={`text-sm font-medium transition-colors duration-200 ${isYearly ? "text-[#18181B] dark:text-white" : "text-[#64748B] dark:text-[#94a3b8]"}`}>
        {copy.yearly}
      </span>
      <AnimatePresence>
        {isYearly && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8, x: -8 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -8 }}
            className="inline-flex items-center gap-1 rounded-full border border-[rgba(212,175,55,0.2)] bg-[rgba(212,175,55,0.08)] px-3 py-1 text-sm font-semibold text-[#D4AF37]"
          >
            <BadgePercent className="h-3 w-3" />
            {copy.save20}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

function PricingCard({
  plan,
  isYearly,
  index,
  currentPlanId,
  onUpgrade,
  isUpgrading,
  copy,
}: {
  plan: PlanDefinition
  isYearly: boolean
  index: number
  currentPlanId: string
  onUpgrade: (id: string) => void
  isUpgrading: boolean
  copy: BillingCopy
}) {
  const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice
  const perMonth = isYearly && plan.yearlyPrice > 0 ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice
  const Icon = plan.icon
  const isCurrent = currentPlanId === plan.id
  const isEnterprise = plan.id === "enterprise"
  const iconClassName = isEnterprise ? "h-[18px] w-[18px]" : "h-5 w-5"

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={`relative flex h-full flex-col rounded-2xl p-[1px] transition-all duration-500 ${
        plan.popular ? "z-10 lg:scale-[1.03]" : "hover:scale-[1.01]"
      }`}
      style={plan.popular ? { background: "conic-gradient(from 225deg, #D4AF37, #FF9A6C, #FFDBC8, #D4AF37)" } : {}}
    >
      {plan.badge && (
        <div className="absolute left-1/2 top-[-14px] z-20 -translate-x-1/2">
          <div className="flex items-center gap-1.5 rounded-full bg-[#D4AF37] px-3 py-1 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(212,175,55,0.4)]">
            <Star className="h-3 w-3 fill-current" />
            {plan.badge}
          </div>
        </div>
      )}

      <div
        className={`flex flex-1 flex-col rounded-[15px] p-6 ${
          plan.popular
            ? "bg-white shadow-[0_20px_60px_rgba(212,175,55,0.12)]"
            : isCurrent
              ? "border border-[rgba(0,0,0,0.1)] bg-[#F8F9FA]"
              : "border border-[rgba(0,0,0,0.07)] bg-white hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
        } transition-shadow duration-500`}
      >
        <div className="mb-2 flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${plan.iconBg} ${plan.iconColor}`}>
            <Icon className={iconClassName} strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#18181B] dark:text-white">{plan.name}</h3>
            {isCurrent && (
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#D4AF37]">
                {copy.currentPlanBadge}
              </span>
            )}
          </div>
        </div>

        <p className="mb-4 min-h-[40px] text-sm leading-relaxed text-[#64748B] dark:text-[#94a3b8]">{plan.description}</p>

        <div className="mb-5">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tight text-[#18181B] dark:text-white">
              <AnimatedPrice value={isYearly ? perMonth : price} currency={plan.currency} />
            </span>
            {plan.monthlyPrice > 0 && <span className="ml-1 text-sm text-[#64748B] dark:text-[#94a3b8]">{copy.billedPerMonth}</span>}
          </div>
          {isYearly && plan.yearlyPrice > 0 && (
            <p className="mt-1 text-[11px] text-[#64748B] dark:text-[#94a3b8]">
              {copy.billedYear} ₹{formatINR(plan.yearlyPrice)}/year · {copy.saveAmount} ₹{formatINR(plan.monthlyPrice * 12 - plan.yearlyPrice)}
            </p>
          )}
          {plan.monthlyPrice === 0 && (
            <p className="mt-1 text-[11px] font-medium text-[#D4AF37]">{copy.freeForever}</p>
          )}
        </div>

        <div className="mb-4">
          {isCurrent ? (
            <button
              disabled
              className="w-full cursor-not-allowed rounded-xl border border-[rgba(0,0,0,0.06)] bg-[#1A1A1A] py-2.5 text-sm font-medium text-[#94a3b8]"
            >
              ✓ {copy.activePlan}
            </button>
          ) : plan.popular ? (
            <button
              onClick={() => onUpgrade(plan.id)}
              disabled={isUpgrading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8962D] py-2.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(212,175,55,0.35)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(212,175,55,0.45)] active:scale-[0.98] disabled:opacity-50"
            >
              {plan.cta}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : isEnterprise ? (
            <a
              href="mailto:sales@nexusai.in"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[rgba(0,0,0,0.12)] py-2.5 text-sm font-medium text-[#374151] transition-all duration-200 hover:bg-[#F8F9FA] dark:text-[#C7CDD8] dark:hover:bg-[#111827]"
            >
              {plan.cta}
              <ArrowRight className="h-4 w-4" />
            </a>
          ) : (
            <button
              onClick={() => onUpgrade(plan.id)}
              disabled={isUpgrading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[rgba(0,0,0,0.12)] py-2.5 text-sm font-medium text-[#374151] transition-all duration-200 hover:bg-[#F8F9FA] hover:text-[#18181B] disabled:opacity-50 dark:text-[#C7CDD8] dark:hover:bg-[#111827] dark:hover:text-white"
            >
              {plan.cta}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-1 mb-6 flex flex-col items-center gap-3">
          <p className="text-[11px] font-medium text-[#64748B] dark:text-[#94a3b8]">{copy.startTrial}</p>
          <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-[rgba(212,175,55,0.2)] bg-[rgba(212,175,55,0.04)] p-2.5">
            <Sparkles className="h-4 w-4 text-[#D4AF37]" />
            <span className="text-xs font-semibold text-[#18181B] dark:text-white">
              {plan.credits} {copy.creditsSuffix}
            </span>
          </div>
        </div>

        <ul className="flex flex-1 flex-col gap-2.5">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm text-[#475569] dark:text-[#C7CDD8]">
              <div
                className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full ${
                  plan.popular ? "bg-[rgba(212,175,55,0.08)] text-[#D4AF37]" : "bg-[#F4F3EF] text-[#D4AF37]"
                }`}
              >
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              </div>
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}

function UsageMeter({ copy }: { copy: BillingCopy }) {
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
      className="rounded-2xl border border-[rgba(0,0,0,0.07)] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
    >
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EDF7F1]">
          <RefreshCw className="h-4 w-4 text-[#D4AF37]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#18181B] dark:text-white">{copy.usageTitle}</h3>
          <p className="text-[11px] text-[#64748B] dark:text-[#94a3b8]">{copy.usageReset}</p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-medium text-[#334155] dark:text-[#C7CDD8]">{copy.aiQueries}</span>
            <span className="text-sm text-[#64748B] dark:text-[#94a3b8]">
              {usedQueries} / {totalQueries}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#E5E7EB] dark:bg-[#1A1A1A]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${queryPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
              className={`h-full rounded-full ${queryPct > 80 ? "bg-[#D4AF37]" : "bg-[#7CB69E]"}`}
            />
          </div>
          <p className="mt-1 text-[10px] text-[#64748B] dark:text-[#94a3b8]">
            {queryPct}% {copy.percentUsed}
          </p>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-medium text-[#334155] dark:text-[#C7CDD8]">{copy.documentsUploaded}</span>
            <span className="text-sm text-[#64748B] dark:text-[#94a3b8]">
              {usedDocs} / {totalDocs}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#E5E7EB] dark:bg-[#1A1A1A]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${docPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
              className={`h-full rounded-full ${docPct > 80 ? "bg-[#D4AF37]" : "bg-[#7CB69E]"}`}
            />
          </div>
          <p className="mt-1 text-[10px] text-[#64748B] dark:text-[#94a3b8]">
            {docPct}% {copy.percentUsed}
          </p>
        </div>
      </div>

      <div className="mt-5 border-t border-[rgba(0,0,0,0.06)] pt-4">
        <div className="flex items-start gap-2 rounded-xl border border-[rgba(212,175,55,0.1)] bg-[rgba(212,175,55,0.04)] p-3">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#D4AF37]" />
          <p className="text-[11px] leading-relaxed text-[#475569] dark:text-[#C7CDD8]">
            {copy.upgradeToPro} <strong className="text-[#D4AF37]">Pro</strong> {copy.usageUpgradeHint}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

function InvoiceHistory({ copy }: { copy: BillingCopy }) {
  const workspace = useAuthStore((s) => s.workspace)

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", workspace?.id],
    queryFn: () =>
      api.get<{ id: string; date: string; amount: string; status: "paid" | "pending" | "failed"; download_url?: string | null }[]>(
        `/api/billing/invoices?workspace_id=${workspace?.id}`
      ),
    enabled: !!workspace?.id,
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex flex-col rounded-2xl border border-[rgba(0,0,0,0.07)] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
    >
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF0FF]">
          <Receipt className="h-4 w-4 text-[#3B6FE8]" />
        </div>
        <h3 className="text-sm font-semibold text-[#18181B] dark:text-white">{copy.invoiceHistory}</h3>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#3B6FE8] border-t-transparent" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F8F9FA]">
            <Receipt className="h-5 w-5 text-[#C0BDB8]" />
          </div>
          <p className="text-sm font-medium text-[#334155] dark:text-[#C7CDD8]">{copy.noInvoices}</p>
          <p className="mt-1 text-sm text-[#64748B] dark:text-[#94a3b8]">{copy.noInvoicesHint}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between rounded-xl border border-[rgba(0,0,0,0.06)] p-3 transition-colors hover:bg-[#F8F9FA]"
            >
              <div className="flex items-center gap-3">
                {inv.status === "paid" ? (
                  <CheckCircle2 className="h-4 w-4 text-[#D4AF37]" />
                ) : inv.status === "pending" ? (
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-[#18181B] dark:text-white">{inv.date}</p>
                  <p className="text-[10px] text-[#64748B] dark:text-[#94a3b8]">{inv.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[#18181B] dark:text-white">{inv.amount}</span>
                <button
                  disabled={!inv.download_url}
                  onClick={() => {
                    if (!inv.download_url) {
                      toast.error(copy.downloadUnavailable)
                      return
                    }
                    window.location.href = inv.download_url
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-[rgba(0,0,0,0.08)] transition-colors hover:bg-[#F3F4F6] disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-[#1A1A1A]"
                  aria-label={copy.invoiceDownloadAria(inv.id)}
                >
                  <Download className="h-3.5 w-3.5 text-[#64748B] dark:text-[#C7CDD8]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

function FAQAccordion({ faqs }: { faqs: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="space-y-2">
      {faqs.map((faq, i) => (
        <motion.div
          key={faq.q}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i }}
        >
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className={`flex w-full items-start justify-between gap-4 rounded-xl px-5 py-4 text-left transition-all duration-200 ${
              openIndex === i
                ? "border border-[rgba(212,175,55,0.15)] bg-[rgba(212,175,55,0.04)]"
                : "border border-[rgba(0,0,0,0.06)] bg-white hover:border-[rgba(0,0,0,0.12)]"
            }`}
          >
            <span className={`text-sm font-medium leading-snug ${openIndex === i ? "text-[#D4AF37]" : "text-[#334155] dark:text-white"}`}>
              {faq.q}
            </span>
            <motion.div animate={{ rotate: openIndex === i ? 180 : 0 }} transition={{ duration: 0.2 }} className="mt-0.5 flex-shrink-0">
              <ChevronDown className={`h-4 w-4 ${openIndex === i ? "text-[#D4AF37]" : "text-[#64748B] dark:text-[#94a3b8]"}`} />
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
                <p className="px-5 pb-4 pt-2 text-sm leading-relaxed text-[#64748B] dark:text-[#C7CDD8]">{faq.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  )
}

function TrustBar({ copy }: { copy: BillingCopy }) {
  const items = [
    { icon: IndianRupee, label: copy.trustItems[0] },
    { icon: Shield, label: copy.trustItems[1] },
    { icon: Star, label: copy.trustItems[2] },
    { icon: CreditCard, label: copy.trustItems[3] },
  ]

  return (
    <div className="flex flex-wrap items-center justify-center gap-6 border-t border-[rgba(0,0,0,0.06)] pt-8 lg:gap-10">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2 text-sm text-[#64748B] dark:text-[#94a3b8]">
          <item.icon className="h-3.5 w-3.5 text-[#D4AF37]" />
          {item.label}
        </div>
      ))}
    </div>
  )
}

export default function BillingPage() {
  const [isYearly, setIsYearly] = useState(false)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const workspace = useAuthStore((s) => s.workspace)
  const { language } = useI18n()
  const copy = BILLING_COPY[language] || BILLING_COPY.en
  const plans = useMemo(() => getLocalizedPlans(language), [language])
  const faqs = useMemo(() => getLocalizedFaqs(language), [language])

  const currentPlanId = (workspace?.plan === "free" ? "starter" : workspace?.plan) || "starter"
  const currentPlan = plans.find((plan) => plan.id === currentPlanId) || plans.find((plan) => plan.id === "starter")!

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
      <div className="px-8 pb-6 pt-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-[#D4AF37]">{copy.pageKicker}</p>
          <h1 className="font-display text-3xl tracking-tight text-[#18181B] dark:text-white">{copy.pageTitle}</h1>
          <p className="mt-1 text-sm text-[#64748B] dark:text-[#94a3b8]">{copy.pageSubtitle}</p>
        </motion.div>
      </div>

      <div className="space-y-10 px-8 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col justify-between gap-4 rounded-2xl border border-[rgba(0,0,0,0.07)] bg-white px-6 py-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] sm:flex-row sm:items-center"
        >
          <div className="flex items-center gap-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${currentPlan.iconBg}`}>
              <currentPlan.icon className={`h-5 w-5 ${currentPlan.iconColor}`} />
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-[#64748B] dark:text-[#94a3b8]">{copy.currentPlan}</p>
              <p className="text-lg font-semibold text-[#18181B] dark:text-white">
                {currentPlan.name} — {currentPlanId === "starter" ? copy.freeLabel : copy.activeLabel}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EDF7F1] px-3 py-1.5 text-sm font-medium text-[#D4AF37]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7CB69E]" />
              {copy.active}
            </span>
            {currentPlanId !== "pro" && currentPlanId !== "enterprise" && (
              <button
                onClick={() => handleUpgrade("pro")}
                disabled={isUpgrading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8962D] px-4 py-2 text-sm font-semibold text-white shadow-[0_2px_10px_rgba(212,175,55,0.3)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_4px_20px_rgba(212,175,55,0.4)] active:scale-[0.98] disabled:opacity-50"
              >
                <Crown className="h-3.5 w-3.5" />
                {copy.upgradeToPro}
              </button>
            )}
          </div>
        </motion.div>

        <div className="grid items-stretch gap-6 md:grid-cols-2">
          <UsageMeter copy={copy} />
          <InvoiceHistory copy={copy} />
        </div>

        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mb-8 text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(212,175,55,0.2)] bg-[rgba(212,175,55,0.08)] px-3 py-1.5 text-sm font-medium text-[#D4AF37]">
              <IndianRupee className="h-3.5 w-3.5" />
              {copy.pricingBadge}
            </div>
            <h2 className="mb-2 font-display text-2xl tracking-[-0.02em] text-[#18181B] dark:text-white lg:text-3xl">
              {copy.pricingTitle}
            </h2>
            <p className="text-sm text-[#64748B] dark:text-[#C7CDD8]">{copy.pricingSubtitle}</p>
          </motion.div>

          <BillingToggle isYearly={isYearly} onToggle={() => setIsYearly((value) => !value)} copy={copy} />

          <div className="mt-2 grid items-stretch gap-5 md:grid-cols-3">
            {plans.map((plan, i) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                isYearly={isYearly}
                index={i}
                currentPlanId={currentPlanId}
                onUpgrade={handleUpgrade}
                isUpgrading={isUpgrading}
                copy={copy}
              />
            ))}
          </div>
        </div>

        <TrustBar copy={copy} />

        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 flex items-center gap-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(0,0,0,0.08)] bg-white">
              <HelpCircle className="h-4 w-4 text-[#94a3b8]" />
            </div>
            <h2 className="text-lg font-semibold text-[#18181B] dark:text-white">{copy.faqTitle}</h2>
          </motion.div>
          <FAQAccordion faqs={faqs} />
          <div className="mt-8 text-center">
            <p className="mb-3 text-sm text-[#64748B] dark:text-[#94a3b8]">{copy.stillQuestions}</p>
            <a
              href="mailto:support@nexusai.in"
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,175,55,0.2)] bg-white px-5 py-2.5 text-sm font-medium text-[#D4AF37] transition-all duration-200 hover:bg-[rgba(212,175,55,0.08)]"
            >
              {copy.contactSupport}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
