"use client"
import { motion } from "framer-motion"
import { 
  SiStripe, 
  SiAirbnb, 
  SiNotion, 
  SiVercel, 
  SiLinear, 
  SiLoom, 
  SiIntercom 
} from "react-icons/si"

function GoogleLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function MicrosoftLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 21 21" {...props}>
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  )
}

function FigmaLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 38 57" {...props}>
      <path fill="#E14E1D" d="M19 28.5c0 5.247-4.253 9.5-9.5 9.5S0 33.747 0 28.5 4.253 19 9.5 19 19 23.253 19 28.5z"/>
      <path fill="#F24E1E" d="M0 9.5C0 4.253 4.253 0 9.5 0S19 4.253 19 9.5 14.747 19 9.5 19 0 14.747 0 9.5z"/>
      <path fill="#FF7262" d="M38 9.5C38 4.253 33.747 0 28.5 0S19 4.253 19 9.5 23.253 19 28.5 19 38 14.747 38 9.5z"/>
      <path fill="#1ABCFE" d="M38 28.5c0 5.247-4.253 9.5-9.5 9.5S19 33.747 19 28.5 23.253 19 28.5 19 38 23.253 38 28.5z"/>
      <path fill="#0ACF83" d="M9.5 57C4.253 57 0 52.747 0 47.5S4.253 38 9.5 38 19 42.253 19 47.5v9.5H9.5z"/>
    </svg>
  )
}

const COMPANIES = [
  { name: "Google", Icon: GoogleLogo, color: "original" },
  { name: "Microsoft", Icon: MicrosoftLogo, color: "original" },
  { name: "Stripe", Icon: SiStripe, color: "#635BFF" },
  { name: "Airbnb", Icon: SiAirbnb, color: "#FF5A5F" },
  { name: "Notion", Icon: SiNotion, color: "currentColor" },
  { name: "Figma", Icon: FigmaLogo, color: "original" },
  { name: "Vercel", Icon: SiVercel, color: "currentColor" },
  { name: "Linear", Icon: SiLinear, color: "#5E6AD2" },
  { name: "Loom", Icon: SiLoom, color: "#625DF5" },
  { name: "Intercom", Icon: SiIntercom, color: "#286EFA" },
]

export function LogoMarquee() {
  return (
    <section className="relative overflow-hidden border-y border-[var(--landing-border)] bg-[var(--landing-bg-muted)] py-10 sm:py-12">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[var(--landing-bg-muted)] to-transparent sm:w-28" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[var(--landing-bg-muted)] to-transparent sm:w-28" />

      <div className="relative mx-auto max-w-7xl px-6">
        <p className="mb-5 text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--landing-text-muted)] sm:mb-6">
          Used by teams at
        </p>

        <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <motion.div
            animate={{ x: ["0%", "-33.333%"] }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
            className="flex w-max items-center whitespace-nowrap will-change-transform"
          >
            {[0, 1, 2].map((group) => (
              <div
                key={group}
                className="flex min-w-max items-center gap-12 pr-12"
                aria-hidden={group > 0}
              >
                {COMPANIES.map((c) => (
                  <div
                    key={`${group}-${c.name}`}
                    className="flex items-center gap-2.5 text-[var(--landing-text-secondary)] transition-colors hover:text-[var(--landing-text)] group/logo"
                  >
                    <c.Icon 
                      className="h-5 w-5 opacity-80 transition-opacity group-hover/logo:opacity-100" 
                      style={c.color !== 'currentColor' && c.color !== 'original' ? { color: c.color } : {}}
                    />
                    <span className="flex-shrink-0 text-sm font-semibold">
                      {c.name}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
