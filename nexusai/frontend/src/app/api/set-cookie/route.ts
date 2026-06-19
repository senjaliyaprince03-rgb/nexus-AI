/**
 * POST /api/set-cookie
 *
 * Called by the login page after receiving tokens from FastAPI.
 * Sets the access token in an httpOnly cookie so JS can't read it
 * (XSS protection). The refresh token is stored in sessionStorage
 * by the auth store for tab-session persistence.
 *
 * This is a Next.js Route Handler — runs on the server edge, not in the browser.
 */
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

const IS_PROD = process.env.NODE_ENV === "production"

async function readTokenPayload(req: NextRequest): Promise<{ access_token?: string; refresh_token?: string } | null> {
  const contentType = req.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    return (await req.json()) as { access_token?: string; refresh_token?: string }
  }

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const formData = await req.formData()
    return {
      access_token: typeof formData.get("access_token") === "string" ? String(formData.get("access_token")) : undefined,
      refresh_token: typeof formData.get("refresh_token") === "string" ? String(formData.get("refresh_token")) : undefined,
    }
  }

  const url = new URL(req.url)
  const access_token = url.searchParams.get("access_token") ?? undefined
  const refresh_token = url.searchParams.get("refresh_token") ?? undefined
  if (access_token || refresh_token) {
    return { access_token, refresh_token }
  }

  return null
}

async function setCookiesFromRequest(req: NextRequest) {
  try {
    const body = await readTokenPayload(req)
    const { access_token, refresh_token } = body ?? {}

    if (!access_token) {
      return NextResponse.json({ error: "access_token required" }, { status: 400 })
    }

    const cookieStore = await cookies()

    // Set access token as httpOnly cookie
    cookieStore.set("nexusai_access", access_token, {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60, // 1 hour — matches ACCESS_TOKEN_EXPIRE_MINUTES
    })

    // Set refresh token as httpOnly cookie (longer lived)
    if (refresh_token) {
      cookieStore.set("nexusai_refresh", refresh_token, {
        httpOnly: true,
        secure: IS_PROD,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  return setCookiesFromRequest(req)
}

export async function GET(req: NextRequest) {
  if (IS_PROD) {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
  }

  return setCookiesFromRequest(req)
}

export async function DELETE() {
  /** Called on logout to clear auth cookies */
  const cookieStore = await cookies()
  cookieStore.delete("nexusai_access")
  cookieStore.delete("nexusai_refresh")
  return NextResponse.json({ ok: true })
}
