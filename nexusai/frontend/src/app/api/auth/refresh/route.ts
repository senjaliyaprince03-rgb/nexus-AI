/**
 * POST /api/auth/refresh
 *
 * Server-side token refresh using the httpOnly cookie.
 * Called by middleware when the access token has expired.
 * Reads the refresh token from the httpOnly cookie (not accessible to client JS),
 * calls the FastAPI backend, and sets new cookies.
 */
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

const API_URL =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000"
const IS_PROD = process.env.NODE_ENV === "production"

function authUnavailableResponse(message: string) {
  // We intentionally return 200 here because this route is used during auth
  // bootstrap. An expired session or unreachable backend should resolve to
  // "not authenticated" instead of surfacing as a Next.js route failure.
  return NextResponse.json({ ok: false, error: message }, { status: 200 })
}

export async function POST(_req: NextRequest) {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get("nexusai_refresh")?.value

  if (!refreshToken) {
    return authUnavailableResponse("No refresh token")
  }

  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    })

    if (!res.ok) {
      // Refresh failed — clear cookies and signal re-login
      cookieStore.delete("nexusai_access")
      cookieStore.delete("nexusai_refresh")
      return authUnavailableResponse("Refresh failed")
    }

    const data = await res.json() as {
      access_token?: string
      refresh_token?: string
      expires_in: number
    }

    if (!data.access_token || !data.refresh_token) {
      cookieStore.delete("nexusai_access")
      cookieStore.delete("nexusai_refresh")
      return authUnavailableResponse("Invalid refresh response")
    }

    // Set new cookies
    cookieStore.set("nexusai_access", data.access_token, {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: "lax",
      path: "/",
      maxAge: data.expires_in,
    })

    cookieStore.set("nexusai_refresh", data.refresh_token, {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })

    return NextResponse.json({
      ok: true,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    })
  } catch {
    return authUnavailableResponse("Auth backend unavailable")
  }
}
