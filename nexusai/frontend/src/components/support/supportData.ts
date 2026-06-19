import {
  BadgeHelp,
  CreditCard,
  FileSearch,
  LockKeyhole,
  Settings2,
  UserCircle2,
  type LucideIcon,
} from "lucide-react"
import type { SupportIntent, SupportMetrics } from "@/types/api"

export interface SupportTopic {
  id: SupportIntent
  label: string
  description: string
  prompt: string
  icon: LucideIcon
}

export const SUPPORT_TOPICS: SupportTopic[] = [
  {
    id: "billing",
    label: "Billing",
    description: "Plans, invoices, payments",
    prompt: "Help me understand my NexusAI billing, plan limits, or invoice options.",
    icon: CreditCard,
  },
  {
    id: "technical",
    label: "Technical",
    description: "API, indexing, document issues",
    prompt: "Help me troubleshoot a technical issue with document indexing, chat, or the API.",
    icon: Settings2,
  },
  {
    id: "account",
    label: "Account",
    description: "Sign in, verification, access",
    prompt: "Help me with account access, email verification, password reset, or workspace permissions.",
    icon: UserCircle2,
  },
  {
    id: "privacy",
    label: "Privacy",
    description: "Security and data handling",
    prompt: "Explain NexusAI privacy and security expectations for workspace documents and sensitive information.",
    icon: LockKeyhole,
  },
  {
    id: "other",
    label: "Other",
    description: "General guidance",
    prompt: "I need general help using NexusAI. Ask me one focused question and guide me safely.",
    icon: BadgeHelp,
  },
]

export const SUPPORT_STARTERS = [
  "Why am I not getting document-backed answers?",
  "How do I fix login or verification problems?",
  "What should I check when the backend API is unreachable?",
  "How do I keep sensitive information safe in support chat?",
]

export const SUPPORT_FALLBACK_METRICS: SupportMetrics = {
  queries: 0,
  fallback_rate: 0,
  csat: null,
  avg_response_ms: 0,
  source_coverage: {
    faq: 0,
    workspace_docs: 0,
    workspace_doc_ratio: 0,
  },
}

export const topicById = new Map(SUPPORT_TOPICS.map((topic) => [topic.id, topic]))

export function formatPercent(value: number | null | undefined): string {
  if (value == null) return "--"
  return `${Math.round(value * 100)}%`
}

export function formatLatency(ms: number | null | undefined): string {
  if (!ms) return "--"
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export { FileSearch }
