// Force dynamic rendering to prevent Next.js from throwing cookies() errors during static build
export const dynamic = "force-dynamic"

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
