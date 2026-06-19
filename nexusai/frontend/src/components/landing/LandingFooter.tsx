import Link from "next/link"
import { LogoMark } from "@/components/brand/LogoMark"

const LINKS = {
  Product:  [{ label: "Capabilities",  href: "#capabilities" },
             { label: "How it works",  href: "#how-it-works" },
             { label: "Features",      href: "#features" },
             { label: "Pricing",       href: "#pricing" }],
  Company:  [{ label: "Log in",        href: "/login" },
             { label: "Sign up",       href: "/signup" },
             { label: "Dashboard",     href: "/dashboard" }],
  Legal:    [{ label: "Privacy",      href: "/privacy" },
             { label: "Terms",        href: "/terms" }],
}

export function LandingFooter() {
  return (
    <footer className="border-t border-[var(--landing-border)] bg-[var(--landing-bg-muted)] py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <LogoMark className="h-8 w-8 rounded-lg" />
              <span className="font-semibold text-[var(--landing-text)]">NexusAI</span>
            </Link>
            <p className="text-sm text-[var(--landing-text-muted)] max-w-[220px] leading-relaxed">
              Multi-agent RAG platform. Ask your documents anything.
            </p>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([section, links]) => (
            <div key={section}>
              <p className="text-xs font-semibold text-[var(--landing-text)] uppercase
                            tracking-widest mb-4">
                {section}
              </p>
              <ul className="space-y-3">
                {links.map(link => (
                  <li key={link.label}>
                    {(link as any).external ? (
                      <a href={link.href} target="_blank" rel="noopener noreferrer"
                         className="text-sm text-[var(--landing-text-muted)] hover:text-[var(--landing-text)]
                                    transition-colors">
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href}
                            className="text-sm text-[var(--landing-text-muted)] hover:text-[var(--landing-text)]
                                       transition-colors">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-[var(--landing-border)] flex flex-col
                        sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--landing-text-muted)]">
            © 2026 NexusAI. All rights reserved.
          </p>
          <p className="text-xs text-[var(--landing-text-muted)]">
            Built with FastAPI + Next.js 14 + MongoDB
          </p>
        </div>
      </div>
    </footer>
  )
}
