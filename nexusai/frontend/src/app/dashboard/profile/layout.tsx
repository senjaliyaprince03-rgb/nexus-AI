// Force dynamic rendering to prevent Next.js from throwing cookies() errors during static build
export const dynamic = "force-dynamic"

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
