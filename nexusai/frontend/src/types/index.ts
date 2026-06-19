// ── Auth ──────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: "user" | "admin";
  workspace_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

// ── Documents ─────────────────────────────────────────────────────
export type DocumentStatus = "pending" | "processing" | "ready" | "failed";

export interface Document {
  id: string;
  filename: string;
  mime_type: string;
  file_size: number;
  status: DocumentStatus;
  chunk_count: number;
  created_at: string;
}

export interface DocumentUploadResponse {
  id: string;
  filename: string;
  status: DocumentStatus;
  task_id: string;
}

export interface IngestionProgress {
  document_id: string;
  stage: "parsing" | "chunking" | "embedding" | "storing" | "done" | "error";
  progress: number;
  message: string;
}

// ── Chat ──────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  sources?: SourceChunk[];
  confidence_score?: number | null;
  source_chunks?: SourceChunk[] | null;
  created_at: string;
}

export interface SourceChunk {
  chunk_id: string;
  document_id: string;
  document_filename: string;
  filename?: string;
  content: string;
  score: number;
  page_number?: number | null;
  chunk_index: number;
}

export interface ChatSession {
  id: string;
  title: string | null;
  workspace_id: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}

export interface StreamEvent {
  event: "token" | "source" | "done" | "error";
  data: string | Record<string, unknown>;
}

// ── Workspace ─────────────────────────────────────────────────────
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "pro" | "enterprise";
}

// ── Pagination ────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}
