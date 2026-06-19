"use client"
// We use force-dynamic because this route handles dynamic user data and Next.js static generation throws cookie usage errors from underlying dependencies.
export const dynamic = "force-dynamic"


import { useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/authStore"
import { API_BASE_URL, api } from "@/lib/api"

// Tab keys
type Tab = "personal" | "preferences" | "security" | "privacy"

export default function ProfilePage() {
  const [tab, setTab] = useState<Tab>("personal")
  const { user, fetchUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  async function handleSave(updatedFields: Record<string, unknown>) {
    try {
      setLoading(true)
      await api.patch("/api/auth/me", updatedFields)
      await fetchUser()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      setErrorMsg("")
    } catch (e: any) {
      setErrorMsg(e.detail || "Failed to update profile.")
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <div className="p-8 text-sm text-[#9CA3AF]">Loading profile...</div>
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 flex flex-col md:flex-row gap-8">
      {/* Sidebar Navigation */}
      <nav className="md:w-64 flex-shrink-0" aria-label="Profile navigation">
        <div className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#C5A059] mb-2">User Profile</p>
          <h1 className="text-3xl font-display tracking-tight text-[#18181B]">Settings</h1>
        </div>
        <ul className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          {(["personal", "preferences", "security", "privacy"] as Tab[]).map((t) => (
            <li key={t}>
              <button
                onClick={() => setTab(t)}
                className={cn(
                  "w-full text-left px-4 py-2.5 rounded-xl text-sm capitalize font-medium transition-colors whitespace-nowrap",
                  tab === t
                    ? "bg-[#FFF0EB] text-[#C5A059]"
                    : "text-[#4B5563] hover:bg-[#F8F9FA] hover:text-[#18181B]"
                )}
                aria-current={tab === t ? "page" : undefined}
              >
                {t}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow min-w-0">
        <div className="bg-white rounded-3xl border border-[rgba(0,0,0,0.06)] shadow-sm overflow-hidden relative">
          
          {/* Global Alert Region for Screen Readers */}
          <div aria-live="polite" className="sr-only">
            {saved ? "Profile changes saved successfully." : ""}
            {errorMsg ? `Error: ${errorMsg}` : ""}
          </div>

          {/* Profile Header (Always visible at top of content, or only in Personal?) */}
          {tab === "personal" && (
             <PersonalDetailsForm user={user} onSave={handleSave} saved={saved} errorMsg={errorMsg} />
          )}

          {tab === "preferences" && (
             <PreferencesForm user={user} onSave={handleSave} saved={saved} errorMsg={errorMsg} />
          )}

          {tab === "security" && (
             <SecurityForm user={user} saved={saved} errorMsg={errorMsg} />
          )}

          {tab === "privacy" && (
             <PrivacyForm user={user} onSave={handleSave} saved={saved} errorMsg={errorMsg} />
          )}

        </div>
      </main>
    </div>
  )
}

// --- Sub-components ---

function PersonalDetailsForm({ user, onSave, saved, errorMsg }: { user: Record<string, any>; onSave: (fields: Record<string, unknown>) => void; saved: boolean; errorMsg: string }) {
  const [formData, setFormData] = useState({
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    bio: user.bio || "",
    phone_number: user.phone_number || "",
    location: user.location || ""
  })

  const [avatar, setAvatar] = useState(user.avatar_url || "")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const fd = new FormData()
    fd.append("avatar", file)

    try {
      const data = await api.upload<{ avatar_url: string }>("/api/auth/me/avatar", fd)
      setAvatar(data.avatar_url)
    } catch (e) {
      console.error(e)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="divide-y divide-[rgba(0,0,0,0.06)]">
      <Section title="Avatar">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-[#F0F0F0] border border-[rgba(0,0,0,0.1)] overflow-hidden flex-shrink-0 relative">
            {avatar ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={`${API_BASE_URL}${avatar}`} alt="User's profile photo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#9CA3AF] text-2xl font-semibold">
                {user.email.charAt(0).toUpperCase()}
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                 <span className="w-4 h-4 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin"></span>
              </div>
            )}
          </div>
          <div>
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleAvatarUpload} aria-label="Upload avatar" />
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="text-sm font-medium text-[#C5A059] hover:text-[#FF8C35] transition-colors bg-[#FFF0EB] px-4 py-2 rounded-full"
            >
              Change picture
            </button>
            <p className="text-xs text-[#9CA3AF] mt-2">JPG or PNG. Max size 2MB.</p>
          </div>
        </div>
      </Section>

      <form onSubmit={handleSubmit}>
        <Section title="Personal details">
          <div className="grid gap-6 max-w-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="First name" id="first_name" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
              <Field label="Last name" id="last_name" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
            </div>
            <Field label="Email address" id="email" value={user.email} disabled hint="Email address is used for login and cannot be changed here." />
            
            <div>
              <label htmlFor="bio" className="block text-xs font-bold text-[#4B5563] mb-2">Bio / About Me</label>
              <textarea 
                id="bio" 
                value={formData.bio} 
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                className="w-full bg-[#F8F9FA] border border-[rgba(0,0,0,0.08)] rounded-xl px-4 py-3 text-sm text-[#18181B] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all"
                rows={3}
                maxLength={500}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Phone number" id="phone" type="tel" value={formData.phone_number} onChange={(e) => setFormData({...formData, phone_number: e.target.value})} />
              <Field label="Location" id="location" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
            </div>
          </div>
          
          {errorMsg && <p className="text-red-500 text-sm mt-4" role="alert">{errorMsg}</p>}
        </Section>
        <div className="p-6 bg-[#F8F9FA] flex justify-end">
          <SaveButton saved={saved} />
        </div>
      </form>
    </div>
  )
}

function PreferencesForm({ user, onSave, saved, errorMsg }: { user: Record<string, any>; onSave: (fields: Record<string, unknown>) => void; saved: boolean; errorMsg: string }) {
  const [formData, setFormData] = useState({
    theme: user.theme || "system",
    timezone: user.timezone || "UTC"
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="divide-y divide-[rgba(0,0,0,0.06)]">
      <form onSubmit={handleSubmit}>
        <Section title="Display Preferences">
          <div className="grid gap-6 max-w-xl">
            <div>
              <label htmlFor="theme" className="block text-xs font-bold text-[#4B5563] mb-2">Theme</label>
              <select 
                id="theme" 
                value={formData.theme}
                onChange={(e) => setFormData({...formData, theme: e.target.value})}
                className="w-full bg-[#F8F9FA] border border-[rgba(0,0,0,0.08)] rounded-xl px-4 py-3 text-sm text-[#18181B] focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]"
              >
                <option value="light">Light mode</option>
                <option value="dark">Dark mode</option>
                <option value="system">System default</option>
              </select>
            </div>
            <div>
              <label htmlFor="timezone" className="block text-xs font-bold text-[#4B5563] mb-2">Time zone</label>
              <select 
                id="timezone" 
                value={formData.timezone}
                onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                className="w-full bg-[#F8F9FA] border border-[rgba(0,0,0,0.08)] rounded-xl px-4 py-3 text-sm text-[#18181B] focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]"
              >
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">Greenwich Mean Time (GMT)</option>
              </select>
            </div>
          </div>
          {errorMsg && <p className="text-red-500 text-sm mt-4" role="alert">{errorMsg}</p>}
        </Section>
        <div className="p-6 bg-[#F8F9FA] flex justify-end">
          <SaveButton saved={saved} />
        </div>
      </form>
    </div>
  )
}

function SecurityForm({ user, saved, errorMsg }: { user: Record<string, any>; saved: boolean; errorMsg: string }) {
  // Mock form for security since password resets typically use different endpoints
  return (
    <div className="divide-y divide-[rgba(0,0,0,0.06)]">
      <Section title="Password">
        <div className="grid gap-6 max-w-xl">
          <Field label="Current password" id="current_pwd" type="password" placeholder="••••••••" />
          <Field label="New password" id="new_pwd" type="password" placeholder="Min. 8 characters" />
          <Field label="Confirm new password" id="confirm_pwd" type="password" placeholder="Repeat new password" />
        </div>
      </Section>
      <Section title="Two-Factor Authentication">
        <div className="flex items-center justify-between bg-[#F8F9FA] border border-[rgba(0,0,0,0.06)] rounded-2xl px-5 py-4 max-w-xl">
          <div>
            <p className="text-sm font-semibold text-[#18181B]">Authenticator App</p>
            <p className="text-xs text-[#9CA3AF] mt-1">Not enabled. Protect your account with an extra layer of security.</p>
          </div>
          <button type="button" className="text-xs font-semibold text-[#C5A059] hover:text-[#FF8C35] transition-colors bg-[#FFF0EB] px-3 py-1.5 rounded-full">Enable</button>
        </div>
      </Section>
      <div className="p-6 bg-[#F8F9FA] flex justify-end">
         <SaveButton saved={false} onClick={(e) => { e.preventDefault(); alert('Password change endpoint pending integration.') }} />
      </div>
    </div>
  )
}

function PrivacyForm({ user, onSave, saved, errorMsg }: { user: Record<string, any>; onSave: (fields: Record<string, unknown>) => void; saved: boolean; errorMsg: string }) {
  const [privacy, setPrivacy] = useState(user.privacy_settings?.visibility || "public")
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ privacy_settings: { visibility: privacy } })
  }

  return (
    <div className="divide-y divide-[rgba(0,0,0,0.06)]">
      <form onSubmit={handleSubmit}>
        <Section title="Profile Visibility">
          <div className="grid gap-4 max-w-xl">
             <label className="flex items-start gap-3 p-4 border border-[rgba(0,0,0,0.08)] rounded-xl cursor-pointer hover:bg-[#F8F9FA] transition-colors">
               <input type="radio" name="visibility" value="public" checked={privacy === "public"} onChange={() => setPrivacy("public")} className="mt-1 accent-[#C5A059]" />
               <div>
                 <p className="text-sm font-semibold text-[#18181B]">Public</p>
                 <p className="text-xs text-[#9CA3AF] mt-0.5">Anyone can view your profile and contact information.</p>
               </div>
             </label>
             <label className="flex items-start gap-3 p-4 border border-[rgba(0,0,0,0.08)] rounded-xl cursor-pointer hover:bg-[#F8F9FA] transition-colors">
               <input type="radio" name="visibility" value="workspace" checked={privacy === "workspace"} onChange={() => setPrivacy("workspace")} className="mt-1 accent-[#C5A059]" />
               <div>
                 <p className="text-sm font-semibold text-[#18181B]">Workspace Only</p>
                 <p className="text-xs text-[#9CA3AF] mt-0.5">Only members of your workspaces can view your profile.</p>
               </div>
             </label>
             <label className="flex items-start gap-3 p-4 border border-[rgba(0,0,0,0.08)] rounded-xl cursor-pointer hover:bg-[#F8F9FA] transition-colors">
               <input type="radio" name="visibility" value="private" checked={privacy === "private"} onChange={() => setPrivacy("private")} className="mt-1 accent-[#C5A059]" />
               <div>
                 <p className="text-sm font-semibold text-[#18181B]">Private</p>
                 <p className="text-xs text-[#9CA3AF] mt-0.5">Only you can view your profile.</p>
               </div>
             </label>
          </div>
          {errorMsg && <p className="text-red-500 text-sm mt-4" role="alert">{errorMsg}</p>}
        </Section>
        <div className="p-6 bg-[#F8F9FA] flex justify-end">
          <SaveButton saved={saved} />
        </div>
      </form>
    </div>
  )
}

// --- Generic UI Components ---

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-6 sm:p-8">
      <h2 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest mb-6">{title}</h2>
      <div>{children}</div>
    </div>
  )
}

function Field({ label, id, hint, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; id: string; hint?: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-bold text-[#4B5563] mb-2">{label}</label>
      <input
        id={id}
        {...props}
        className="w-full bg-[#F8F9FA] border border-[rgba(0,0,0,0.08)] rounded-xl px-4 py-3 text-sm text-[#18181B] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-[#F0F0F0]"
      />
      {hint && <p className="text-xs text-[#9CA3AF] mt-2">{hint}</p>}
    </div>
  )
}

function SaveButton({ saved, onClick }: { saved: boolean; onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void }) {
  return (
    <button 
      type="submit"
      onClick={onClick}
      disabled={saved}
      className={cn("rounded-full px-6 py-2.5 text-sm font-semibold transition-all shadow-sm",
        saved
          ? "bg-[#E6F4EA] text-[#137333] pointer-events-none"
          : "bg-[#18181B] text-white hover:bg-[#1A1A1A] hover:-translate-y-0.5 hover:shadow-md"
      )}
    >
      {saved ? "✓ Saved successfully" : "Save changes"}
    </button>
  )
}
