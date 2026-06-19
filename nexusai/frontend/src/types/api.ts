// ── Auth ──────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  _id?: string
  email: string
  first_name?: string
  last_name?: string
  bio?: string | null
  phone_number?: string | null
  location?: string | null
  avatar_url?: string | null
  theme?: string | null
  timezone?: string | null
  social_links?: Record<string, string> | null
  notification_preferences?: Record<string, boolean> | null
  privacy_settings?: Record<string, string> | null
  role: "user" | "admin"
  workspace_id: string | null
  is_verified?: boolean
  is_totp_enabled?: boolean
  created_at: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface AuthSessionResponse extends TokenResponse {
  user: User
  workspace: Workspace | null
}

export interface CurrentUserResponse {
  user: User
  workspace: Workspace | null
}

// ── Workspace ─────────────────────────────────────────────────────────────────

export interface Workspace {
  id: string
  name: string
  slug: string
  plan: "free" | "pro" | "enterprise"
  owner_id?: string | null
  created_at: string
  updated_at?: string | null
}

export interface ApiErrorBody {
  ok?: false
  detail?: string
  errors?: Array<{ field: string; message: string }>
  error?: {
    code?: string
    message?: string
    details?: unknown
  }
}

// ── Documents ─────────────────────────────────────────────────────────────────

export type DocumentStatus = "pending" | "processing" | "ready" | "failed"

export interface DocumentItem {
  id: string
  filename: string
  status: DocumentStatus
  chunk_count: number
  file_size_bytes: number
  content_type: string
  created_at: string
  error_message?: string | null
}

// ── Chat / RAG ────────────────────────────────────────────────────────────────

export interface SourceChunk {
  chunk_id: string
  document_id: string
  document_filename: string
  content: string
  score: number
  page_number?: number | null
  chunk_index: number
  source_type?: "workspace_doc" | "faq"
  support_intent?: SupportIntent | null
}

/** A single parsed SSE frame from the streaming chat endpoint */
export type StreamEvent =
  | { event: "token";  data: string }
  | { event: "source"; data: SourceChunk }
  | { event: "done";   data: { session_id: string; confidence_score: number; [key: string]: unknown } }
  | { event: "error";  data: string }

export type MessageRole = "user" | "assistant" | "system"

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  /** Full text assembled from token events */
  isStreaming?: boolean
  sources?: SourceChunk[]
  confidence_score?: number | null
  created_at: string
  mode?: ChatMode
  metadata?: Record<string, unknown>
}

export interface ChatSession {
  id: string
  title: string
  workspace_id: string
  created_at: string
  updated_at: string
  messages: ChatMessage[]
  mode?: ChatMode
  metadata?: Record<string, unknown>
}

export type ChatMode = "document" | "support"
export type SupportIntent = "billing" | "technical" | "account" | "privacy" | "other"
export type SupportSourcePolicy = "combined" | "workspace_docs" | "faq"

// ── Query request sent to backend ─────────────────────────────────────────────

export interface QueryRequest {
  question: string
  session_id?: string | null
  workspace_id: string
  top_k?: number
  use_agents?: boolean
  mode?: ChatMode
  support_intent?: SupportIntent | null
  source_policy?: SupportSourcePolicy
}

export interface SupportMetrics {
  queries: number
  fallback_rate: number
  csat: number | null
  avg_response_ms: number
  source_coverage: {
    faq: number
    workspace_docs: number
    workspace_doc_ratio: number
  }
}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  pages?: number
  has_next: boolean
}
