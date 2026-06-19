import { NextRequest, NextResponse } from "next/server"

const PUBLIC_PATHS = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/verify-email",
  "/auth/login", "/auth/signup", "/auth/forgot-password", "/auth/reset-password", "/auth/verify-email"]

/**
 * Returns true when *path* is a safe same-origin relative path.
 * Rejects protocol-relative URLs (//evil.com), absolute URLs, and
 * paths containing control characters that could be used for header injection.
 */
function _isSafePath(path: string): boolean {
  return (
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.includes(":") &&
    !/[\r\n\0]/.test(path)
  );
}

export function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith("/_next") || pathname.startsWith("/api"))) {
    return NextResponse.next()
  }
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/chat")) {
    const accessToken = request.cookies.get("nexusai_access")?.value || request.cookies.get("nexusai_token")?.value
    const refreshToken = request.cookies.get("nexusai_refresh")?.value
    if (!accessToken && !refreshToken) {
      // Use request.nextUrl.origin (server-verified) instead of request.url
      // (client-influenced via Host / X-Forwarded-Host) to prevent open redirect
      // SSRF where a crafted Host header redirects to an attacker-controlled domain.
      const loginUrl = new URL("/login", origin)
      // Only append the from param when pathname is a safe relative path.
      // Rejects protocol-relative (//evil.com) and absolute URLs that would
      // turn the redirect param itself into an open redirect vector.
      if (_isSafePath(pathname)) {
        loginUrl.searchParams.set("from", pathname)
      }
      return NextResponse.redirect(loginUrl)
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/chat/:path*"],
}
