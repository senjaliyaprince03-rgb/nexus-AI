"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Search, LayoutDashboard, MessageSquare, Files, Zap, CreditCard, Settings, UserCircle, Layers, Building2, LifeBuoy } from "lucide-react"

type Command = {
  id: string
  label: string
  icon: React.ElementType
  href: string
  category: string
}

const COMMANDS: Command[] = [
  { id: "home", label: "Home", icon: LayoutDashboard, href: "/dashboard", category: "Navigation" },
  { id: "chat", label: "Chat", icon: MessageSquare, href: "/chat", category: "Navigation" },
  { id: "support", label: "Support", icon: LifeBuoy, href: "/dashboard/support", category: "Navigation" },
  { id: "documents", label: "Documents", icon: Files, href: "/dashboard/documents", category: "Navigation" },
  { id: "agents", label: "Agents", icon: Zap, href: "/dashboard/agents", category: "Navigation" },
  { id: "modules", label: "Modules", icon: Layers, href: "/dashboard/modules", category: "Navigation" },
  { id: "workspace", label: "Workspace", icon: Building2, href: "/dashboard/workspace", category: "Settings" },
  { id: "profile", label: "Profile", icon: UserCircle, href: "/dashboard/profile", category: "Settings" },
  { id: "billing", label: "Billing", icon: CreditCard, href: "/dashboard/billing", category: "Settings" },
  { id: "api-keys", label: "API Keys", icon: Settings, href: "/dashboard/settings", category: "Settings" },
]

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const filteredCommands = COMMANDS.filter((command) =>
    command.label.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery("")
    }
  }, [isOpen])

  const handleSelect = (command: Command) => {
    setIsOpen(false)
    router.push(command.href)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length)
    } else if (e.key === "Enter" && filteredCommands.length > 0) {
      e.preventDefault()
      handleSelect(filteredCommands[selectedIndex])
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-50 bg-[#18181B]/40 dark:bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed left-1/2 top-[15%] z-50 w-full max-w-[500px] -translate-x-1/2 overflow-hidden rounded-2xl bg-white dark:bg-[#18181A] shadow-2xl ring-1 ring-black/5 dark:ring-white/10"
          >
            <div className="flex items-center border-b border-[rgba(0,0,0,0.08)] dark:border-[#F8F9FA]/10 px-4 py-3">
              <Search className="h-5 w-5 text-[#9CA3AF] dark:text-[#A1A1AA]" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command or search..."
                className="w-full bg-transparent px-3 py-1 text-[15px] text-[#18181B] dark:text-[#F8F9FA] placeholder:text-[#9CA3AF] dark:placeholder:text-[#71717A] focus:outline-none"
              />
              <div className="flex items-center gap-1 shrink-0 bg-[#F0EDE8] dark:bg-white/10 rounded px-1.5 py-0.5 text-[10px] font-medium text-[#9CA3AF] dark:text-[#A1A1AA]">
                <kbd>esc</kbd>
              </div>
            </div>

            <div className="max-h-[320px] overflow-y-auto p-2">
              {filteredCommands.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-[#9CA3AF] dark:text-[#A1A1AA]">
                  No results found.
                </div>
              ) : (
                filteredCommands.map((command, index) => {
                  const isSelected = index === selectedIndex
                  return (
                    <button
                      key={command.id}
                      onClick={() => handleSelect(command)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                        isSelected
                          ? "bg-[#C5A059]/10 dark:bg-[#C5A059]/20 text-[#C5A059] dark:text-[#FF8F5E]"
                          : "text-[#4B5563] dark:text-[#A1A1AA] hover:bg-[#F8F9FA] dark:hover:bg-white/5"
                      }`}
                    >
                      <command.icon className="h-4 w-4 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{command.label}</span>
                        <span className="text-[10px] uppercase tracking-wider opacity-60">
                          {command.category}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="ml-auto hidden md:flex items-center gap-1 text-[10px] opacity-60">
                          <kbd className="bg-transparent border border-current rounded px-1 shadow-sm">
                            enter
                          </kbd>
                        </div>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
