/**
 * Typed API client for NexusAI backend.
 * - Reads JWT from localStorage (set by auth flow)
 * - Injects Authorization header automatically
 * - Throws typed ApiError on non-2xx responses
 * - Returns typed responses via generics
 */

import { getSafeLocalStorage } from "@/lib/storage"

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"

// ── Error type ────────────────────────────────────────────────────────────────

/**
 * Strip HTML-significant characters from a server-supplied error string.
 * Prevents CWE-79/80: a malicious backend response containing
 * `<script>` or event-handler attributes in the `detail` field would be
 * executed if any component renders ApiError.detail via innerHTML /
 * dangerouslySetInnerHTML.
 */
function _sanitiseDetail(raw: unknown): string {
  const str = typeof raw === "string" ? raw : "Unknown error"
  return str.replace(/[<>"'&]/g, "")
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
    public details?: unknown,
  ) {
    super(detail)
    this.name = "ApiError"
  }
}

// ── Path validation ───────────────────────────────────────────────────────────

/**
 * Asserts that *path* is a safe root-relative API path.
 *
 * Prevents CWE-918: a caller-supplied path like "//evil.com/api/stream" or
 * "https://evil.com/steal" would be concatenated onto BASE_URL and cause the
 * browser to send the JWT token to an attacker-controlled server.
 *
 * Valid:   "/api/chat/query", "/api/documents/"
 * Invalid: "//evil.com/steal", "https://evil.com", "../escape"
 */
function _assertSafePath(path: string): void {
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes(":") ||
    /[\r\n\0]/.test(path)
  ) {
    throw new ApiError(400, `Unsafe API path rejected`)
  }
}

function _extractErrorDetails(body: any): unknown {
  return body?.error?.details ?? body?.errors ?? body?.error ?? undefined
}

function _offlineApiError(error: unknown): ApiError {
  return new ApiError(
    0,
    "Live backend is unavailable right now. Start the API server, then try again.",
    error,
  )
}

// ── Token management ──────────────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return getSafeLocalStorage().getItem("nexusai_token")
}

export function setToken(token: string): void {
  getSafeLocalStorage().setItem("nexusai_token", token)
}

export function clearToken(): void {
  const storage = getSafeLocalStorage()
  storage.removeItem("nexusai_token")
  storage.removeItem("nexusai_workspace")
}

// ── Base fetch ────────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  _assertSafePath(path)
  const token = getToken()

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }
  if (token) headers["Authorization"] = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers, credentials: "include" })
  } catch (error) {
    throw _offlineApiError(error)
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    const rawDetail =
      body.detail ??
      body?.error?.message ??
      body?.error?.detail ??
      body?.error ??
      res.statusText
    // Sanitise the server-supplied detail before storing it in ApiError
    // so callers can safely render it in the UI (CWE-79/80).
    throw new ApiError(res.status, _sanitiseDetail(rawDetail), _extractErrorDetails(body))
  }

  // 204 No Content
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

// ── HTTP methods ──────────────────────────────────────────────────────────────

export const api = {
  baseURL: API_BASE_URL,

  get<T>(path: string): Promise<T> {
    return request<T>(path)
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  },

  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  },

  delete<T = void>(path: string): Promise<T> {
    return request<T>(path, { method: "DELETE" })
  },

  /** Upload a file with multipart/form-data (no Content-Type override) */
  upload<T>(path: string, form: FormData): Promise<T> {
    _assertSafePath(path)
    const token = getToken()
    return fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      body: form,
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).catch((error) => {
      throw _offlineApiError(error)
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: res.statusText }))
        const rawDetail =
          body.detail ??
          body?.error?.message ??
          body?.error?.detail ??
          body?.error ??
          res.statusText
        throw new ApiError(res.status, _sanitiseDetail(rawDetail), _extractErrorDetails(body))
      }
      return res.json() as Promise<T>
    })
  },

  /**
   * Returns a native EventSource URL string.
   * The token is passed as a query param since EventSource doesn't support headers.
   */
  sseUrl(path: string, params: Record<string, string> = {}): string {
    _assertSafePath(path)
    const token = getToken()
    const q = new URLSearchParams({ ...params, ...(token ? { token } : {}) })
    return `${API_BASE_URL}${path}?${q.toString()}`
  },
}
