import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "./providers"

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: "NexusAI — Ask Your Documents Anything",
  description:
    "Upload any document. Ask anything in plain English. " +
    "Get answers backed by cited sources — powered by multi-agent AI.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/nexusai-icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/nexusai-icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
    shortcut: ["/favicon.ico"],
  },
  openGraph: {
    title: "NexusAI — Ask Your Documents Anything",
    description: "Multi-agent RAG platform with source citations.",
    images: [{ url: "/icons/nexusai-icon-512.png", width: 512, height: 512, alt: "NexusAI" }],
    type: "website",
  },
}

import type { Viewport } from "next"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

import { CookieBanner } from "@/components/ui/CookieBanner"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased">
        <Providers>
          {children}
          <CookieBanner />
        </Providers>
      </body>
    </html>
  )
}
