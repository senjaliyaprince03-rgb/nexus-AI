"use client"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Shield, Key, Activity, ArrowRight, CreditCard, Copy, Check } from "lucide-react"
import { toast } from "sonner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuth } from "@/hooks/useAuth"

type Tab = "general" | "security" | "api"
type ApiKey = { id: string; name: string; masked_key: string; created_at: string; is_active: boolean }

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("general")
  const [newKey, setNewKey] = useState<string | null>(null)
  
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  const [show2FA, setShow2FA] = useState(false)
  const [totpCode, setTotpCode] = useState("")
  const [qrCodeData, setQrCodeData] = useState<{qr_code: string, secret: string} | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  
  const { user, refreshUser } = useAuth()
  const queryClient = useQueryClient()

  const { data: keysResponse, isLoading: isLoadingKeys } = useQuery({
    queryKey: ["api-keys"],
    queryFn: () => api.get<{ keys: ApiKey[] }>("/api/keys")
  })
  const apiKeys = keysResponse?.keys || []

  const createKey = useMutation({
    mutationFn: (name: string) => api.post<{ key: string }>("/api/keys", { name }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] })
      setNewKey(data.key)
      toast.success("API key generated successfully!")
    },
    onError: (err: any) => toast.error(err.detail || "Failed to create key")
  })

  const revokeKey = useMutation({
    mutationFn: (id: string) => api.delete(`/api/keys/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] })
      toast.success("API key revoked.")
    },
    onError: (err: any) => toast.error(err.detail || "Failed to revoke key")
  })

  const changePassword = useMutation({
    mutationFn: () => api.post("/api/auth/change-password", {
      current_password: currentPassword,
      new_password: newPassword
    }),
    onSuccess: () => {
      toast.success("Password changed successfully!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    },
    onError: (err: any) => toast.error(err.detail || "Failed to change password")
  })

  const setup2FA = useMutation({
    mutationFn: () => api.post<{qr_code: string, secret: string}>("/api/2fa/setup"),
    onSuccess: (data) => {
      setQrCodeData(data)
      setShow2FA(true)
    },
    onError: (err: any) => toast.error(err.detail || "Failed to setup 2FA")
  })

  const enable2FA = useMutation({
    mutationFn: () => api.post<{message: string, backup_codes: string[]}>("/api/2fa/enable", {
      code: totpCode,
      secret: qrCodeData?.secret
    }),
    onSuccess: (data) => {
      setBackupCodes(data.backup_codes)
      refreshUser()
      toast.success("2FA enabled successfully!")
    },
    onError: (err: any) => toast.error(err.detail || "Invalid code")
  })

  const disable2FA = useMutation({
    mutationFn: () => api.post("/api/2fa/disable", { password: currentPassword }),
    onSuccess: () => {
      refreshUser()
      toast.success("2FA disabled successfully!")
      setCurrentPassword("")
    },
    onError: (err: any) => toast.error(err.detail || "Failed to disable 2FA")
  })

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match")
      return
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters")
      return
    }
    changePassword.mutate()
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8">
      <div className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#C5A059] mb-2">Settings</p>
        <h1 className="text-3xl font-display tracking-tight text-[#18181B] dark:text-[#F8F9FA]">Application Preferences</h1>
        <p className="mt-2 text-sm text-[#4B5563] dark:text-[#A1A1AA]">
          Manage your subscription, security protocols, and integration keys.
        </p>
      </div>

      {/* Billing quick-link card */}
      <Link
        href="/dashboard/billing"
        className="mb-6 flex items-center justify-between gap-4 bg-gradient-to-r from-[rgba(212,175,55,0.08)] to-[rgba(212,175,55,0.04)] dark:from-[#C5A059]/10 dark:to-[#C5A059]/5 border border-[rgba(255,107,53,0.18)] rounded-2xl px-5 py-4 hover:shadow-[0_4px_20px_rgba(255,107,53,0.1)] transition-all duration-200 group max-w-xl"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#C5A059]/10 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-[#C5A059]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#18181B] dark:text-[#F8F9FA]">Plans & Billing</p>
            <p className="text-xs text-[#9CA3AF] dark:text-[#A1A1AA]">Manage your subscription, usage and invoices</p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-[#C5A059] group-hover:translate-x-1 transition-transform duration-200" />
      </Link>

      <div className="mb-8 flex w-fit gap-2 border-b border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)]">
        {(["general", "security", "api"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-4 py-3 text-sm capitalize transition-all border-b-2 font-medium flex items-center gap-2",
              tab === t
                ? "border-[#C5A059] text-[#C5A059]"
                : "border-transparent text-[#9CA3AF] hover:text-[#18181B] dark:hover:text-[#F8F9FA] hover:border-[rgba(0,0,0,0.1)] dark:hover:border-[rgba(255,255,255,0.1)]"
            )}>
            {t === "general" && <Activity className="w-4 h-4" />}
            {t === "security" && <Shield className="w-4 h-4" />}
            {t === "api" && <Key className="w-4 h-4" />}
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-[#18181A] rounded-3xl border border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)] shadow-sm overflow-hidden">
        {tab === "general" && (
          <div className="divide-y divide-[rgba(0,0,0,0.06)]">
            <Section title="Display & Theme">
              <div className="grid gap-6 max-w-xl">
                <Field label="System Theme" type="text" value="System Default (Auto)" disabled />
                <Field label="Language" type="text" value="English (US)" disabled />
              </div>
            </Section>
            <Section title="Data & Privacy">
              <div className="flex items-center justify-between p-4 bg-[#F8F9FA] rounded-2xl border border-[rgba(0,0,0,0.08)] max-w-xl">
                 <div>
                   <p className="text-sm font-semibold text-[#18181B]">Data Collection</p>
                   <p className="text-xs text-[#9CA3AF] mt-1">Allow anonymous usage telemetry to improve NexusAI.</p>
                 </div>
                 <div className="w-10 h-6 bg-[#C5A059] rounded-full relative cursor-pointer shadow-inner">
                   <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                 </div>
              </div>
            </Section>
          </div>
        )}

        {tab === "security" && (
          <div className="divide-y divide-[rgba(0,0,0,0.06)]">
            <Section title="Account Security">
              <form onSubmit={handlePasswordSubmit} className="grid gap-6 max-w-xl">
                <Field 
                  label="Current Password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required
                />
                <Field 
                  label="New Password" 
                  type="password" 
                  placeholder="At least 8 characters" 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                />
                <Field 
                  label="Confirm New Password" 
                  type="password" 
                  placeholder="Confirm new password" 
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
                <div className="flex justify-end mt-2">
                  <button 
                    type="submit" 
                    disabled={changePassword.isPending || !currentPassword || !newPassword || !confirmPassword}
                    className="bg-[#18181B] dark:bg-white text-white dark:text-[#18181B] px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1A1A1A] dark:hover:bg-[#E5E5E5] transition-colors disabled:opacity-50"
                  >
                    {changePassword.isPending ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </Section>
            <Section title="Two-Factor Authentication">
              <div className="flex items-center justify-between bg-[#F8F9FA] border border-[rgba(0,0,0,0.06)] rounded-2xl px-5 py-4 max-w-xl">
                <div>
                  <p className="text-sm font-semibold text-[#18181B]">Authenticator App</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">
                    {user?.is_totp_enabled 
                      ? "Enabled. Your account is protected." 
                      : "Not enabled. Protect your account with an extra layer of security."}
                  </p>
                </div>
                {!user?.is_totp_enabled ? (
                  <button 
                    onClick={() => setup2FA.mutate()}
                    disabled={setup2FA.isPending}
                    className="text-xs font-semibold text-[#C5A059] hover:text-[#FF8C35] transition-colors bg-[rgba(212,175,55,0.08)] px-3 py-1.5 rounded-full"
                  >
                    {setup2FA.isPending ? "Setting up..." : "Enable"}
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      placeholder="Current Password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="text-xs px-2 py-1 border rounded"
                    />
                    <button 
                      onClick={() => disable2FA.mutate()}
                      disabled={disable2FA.isPending || !currentPassword}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors bg-red-50 px-3 py-1.5 rounded-full disabled:opacity-50"
                    >
                      {disable2FA.isPending ? "Disabling..." : "Disable"}
                    </button>
                  </div>
                )}
              </div>

              {show2FA && qrCodeData && !backupCodes.length && (
                <div className="mt-4 p-4 border rounded-xl max-w-xl bg-white">
                  <h3 className="font-semibold text-sm mb-2">Scan this QR Code</h3>
                  <p className="text-xs text-gray-500 mb-4">Use Google Authenticator or Authy to scan this code.</p>
                  <div className="flex justify-center mb-4">
                    <Image src={qrCodeData.qr_code} alt="2FA QR Code" width={192} height={192} className="w-48 h-48" unoptimized />
                  </div>
                  <p className="text-xs text-center text-gray-500 mb-4 font-mono">{qrCodeData.secret}</p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="6-digit code" 
                      value={totpCode}
                      onChange={e => setTotpCode(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      maxLength={6}
                    />
                    <button 
                      onClick={() => enable2FA.mutate()}
                      disabled={enable2FA.isPending || totpCode.length !== 6}
                      className="bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                    >
                      {enable2FA.isPending ? "Verifying..." : "Verify"}
                    </button>
                  </div>
                </div>
              )}

              {backupCodes.length > 0 && (
                <div className="mt-4 p-4 border border-green-200 bg-green-50 rounded-xl max-w-xl">
                  <h3 className="font-semibold text-sm text-green-800 mb-2">2FA Enabled Successfully!</h3>
                  <p className="text-xs text-green-700 mb-4">Please save these backup codes in a secure place. You will not see them again.</p>
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                    {backupCodes.map((code, i) => (
                      <div key={i} className="bg-white px-3 py-1 rounded border text-center">{code}</div>
                    ))}
                  </div>
                  <button 
                    onClick={() => {
                      setBackupCodes([])
                      setShow2FA(false)
                    }}
                    className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg text-sm w-full font-semibold"
                  >
                    I have saved them
                  </button>
                </div>
              )}
            </Section>
          </div>
        )}

        {tab === "api" && (
          <div className="divide-y divide-[rgba(0,0,0,0.06)] dark:divide-[rgba(255,255,255,0.06)]">
            <Section title="API access">
              <div className="max-w-2xl">
                <p className="text-sm text-[#4B5563] dark:text-[#A1A1AA] leading-relaxed mb-6">
                  Use the NexusAI API to query your workspace programmatically. Generate an API key to get started.
                </p>
                
                <div className="mb-8 border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.1)] rounded-2xl overflow-hidden">
                  <div className="bg-[#F8F9FA] dark:bg-[#2A2A2A] px-5 py-3 border-b border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.1)] flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#18181B] dark:text-[#F8F9FA] uppercase tracking-wider">Active Keys</span>
                    <button 
                      onClick={() => {
                        const name = window.prompt("Enter a name for the new API key:")
                        if (name) createKey.mutate(name)
                      }}
                      disabled={createKey.isPending}
                      className="text-xs font-semibold bg-[#18181B] dark:bg-white text-white dark:text-[#18181B] px-3 py-1.5 rounded-full hover:bg-[#1A1A1A] dark:hover:bg-[#E5E5E5] transition-colors disabled:opacity-50"
                    >
                      {createKey.isPending ? "Creating..." : "+ Create new key"}
                    </button>
                  </div>
                  <div className="divide-y divide-[rgba(0,0,0,0.04)] dark:divide-[rgba(255,255,255,0.04)] bg-white dark:bg-[#18181A]">
                    {isLoadingKeys ? (
                      <div className="px-5 py-8 text-center text-sm text-[#9CA3AF] dark:text-[#71717A]">
                        Loading keys...
                      </div>
                    ) : apiKeys.length === 0 ? (
                      <div className="px-5 py-8 text-center text-sm text-[#9CA3AF] dark:text-[#71717A]">
                        No API keys generated yet.
                      </div>
                    ) : (
                      apiKeys.map((k) => (
                        <div key={k.id} className="px-5 py-4 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-[#18181B] dark:text-[#F8F9FA]">{k.name}</p>
                              <span className="text-[10px] bg-[#EDF7F1] dark:bg-[#EDF7F1]/10 text-[#7CB69E] px-2 py-0.5 rounded-full font-medium">Active</span>
                            </div>
                            <p className="text-xs text-[#9CA3AF] dark:text-[#71717A] mt-1 font-mono">{k.masked_key}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-[#9CA3AF] dark:text-[#71717A]">Created {new Date(k.created_at).toLocaleDateString()}</span>
                            <button 
                              onClick={() => {
                                if (window.confirm("Are you sure you want to revoke this key? Any integrations using it will immediately stop working.")) {
                                  revokeKey.mutate(k.id)
                                }
                              }}
                              className="text-xs font-medium text-[#C5A059] hover:text-[#E55A25] transition-colors"
                            >
                              Revoke
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-[#1A1A1A] rounded-2xl p-5 shadow-inner border border-[#F8F9FA]/10">
                  <p className="text-[10px] text-[#9CA3AF] mb-3 font-mono uppercase tracking-wider">Sample request</p>
                  <pre className="text-[13px] text-[#E5E5E5] font-mono leading-relaxed overflow-x-auto selection:bg-[#C5A059]/30">
{`curl -X POST https://api.nexusai.example.com/api/chat/query \\
  -H "Authorization: Bearer <token>" \\
  -d '{"question":"What are the key risks?"}'`}
                  </pre>
                </div>
              </div>
            </Section>
          </div>
        )}
      </div>
      {newKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#18181A] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-xl border border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)]">
            <h3 className="text-lg font-display text-[#18181B] dark:text-[#F8F9FA] mb-2">Save your API key</h3>
            <p className="text-sm text-[#4B5563] dark:text-[#A1A1AA] mb-6">
              Please copy this key and save it somewhere safe. For security reasons, <strong>you won&apos;t be able to see it again</strong>.
            </p>
            <div className="flex items-center gap-2 bg-[#F8F9FA] dark:bg-[#2A2A2A] p-4 rounded-xl border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.1)] mb-6">
              <code className="text-xs font-mono text-[#18181B] dark:text-[#F8F9FA] break-all flex-1">{newKey}</code>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(newKey)
                  toast.success("Copied to clipboard!")
                }}
                className="p-2 hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors flex-shrink-0"
              >
                <Copy className="w-4 h-4 text-[#9CA3AF]" />
              </button>
            </div>
            <button 
              onClick={() => setNewKey(null)}
              className="w-full py-3 bg-[#18181B] dark:bg-white text-white dark:text-[#18181B] rounded-xl text-sm font-semibold hover:bg-[#1A1A1A] dark:hover:bg-[#E5E5E5] transition-colors"
            >
              I&apos;ve saved it securely
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-6 sm:p-8">
      <h2 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest mb-6">{title}</h2>
      <div>{children}</div>
    </div>
  )
}

function Field({ label, hint, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-bold text-[#4B5563] mb-2">{label}</label>
      <input
        {...props}
        className="w-full bg-[#F8F9FA] border border-[rgba(0,0,0,0.08)] rounded-xl px-4 py-3 text-sm text-[#18181B] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-[#F0F0F0]"
      />
      {hint && <p className="text-xs text-[#9CA3AF] mt-2">{hint}</p>}
    </div>
  )
}

