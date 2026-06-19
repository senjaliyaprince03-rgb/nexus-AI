"use client"

import { useState, useRef, useEffect } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, X, Send, Bot, User, HelpCircle, Loader2, Shield } from "lucide-react"
import { api, API_BASE_URL, getToken } from "@/lib/api"
import { LogoMark } from "@/components/brand/LogoMark"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

const QUICK_REPLIES = [
  "Billing issue",
  "Technical support",
  "Privacy question",
  "Speak to a human",
]

export function SupportWidget() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! 👋 I'm NexusAI Support. How can I assist you today?",
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  // Hide the floating widget on the dedicated support page to avoid duplication.
  if (pathname === "/dashboard/support") return null

  const handleSend = async (text: string) => {
    if (!text.trim()) return

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInputValue("")
    setIsTyping(true)

    try {
      const token = getToken()
      const response = await fetch(`${API_BASE_URL}/api/support/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          prompt: text,
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to connect to support")
      }

      if (!response.body) throw new Error("No response body")

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      
      let assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "" }
      setMessages(prev => [...prev, assistantMsg])
      setIsTyping(false)

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "")
            try {
              const data = JSON.parse(dataStr)
              if (data.status === "success") break
              
              if (typeof data === "string") {
                assistantMsg = { ...assistantMsg, content: assistantMsg.content + data }
                setMessages(prev => {
                  const newArr = [...prev]
                  newArr[newArr.length - 1] = assistantMsg
                  return newArr
                })
              }
            } catch (e) {
              // Ignore parse errors for partial chunks if any
            }
          }
        }
      }
    } catch (error) {
      console.error(error)
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: "I'm sorry, I'm having trouble connecting to the server. Please try again later." }
      ])
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend(inputValue)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
            className="mb-4 w-[380px] max-w-[calc(100vw-48px)] bg-white dark:bg-[#121212] rounded-2xl shadow-2xl border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] overflow-hidden flex flex-col h-[550px] max-h-[calc(100vh-120px)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#C5A059] to-[#FF8C61] text-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <LogoMark className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">NexusAI Support</h3>
                  <p className="text-[11px] text-white/80">Typically replies instantly</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Close support chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-5 bg-[#F8F9FA] dark:bg-[#18181B]">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-[#1E1E1E] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-[#C5A059]" />
                      </div>
                    )}
                    
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
                      msg.role === "user" 
                        ? "bg-[#18181B] dark:bg-white text-white dark:text-[#18181B] rounded-br-sm" 
                        : "bg-white dark:bg-[#1E1E1E] text-[#4B5563] dark:text-[#A1A1AA] border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.04)] rounded-bl-sm shadow-sm"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-[#1E1E1E] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-[#C5A059]" />
                    </div>
                    <div className="bg-white dark:bg-[#1E1E1E] border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.04)] rounded-2xl rounded-bl-sm shadow-sm px-4 py-3 flex items-center gap-1.5">
                      <motion.div className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                      <motion.div className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                      <motion.div className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Replies */}
              {messages.length === 1 && !isTyping && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {QUICK_REPLIES.map((reply) => (
                    <button
                      key={reply}
                      onClick={() => handleSend(reply)}
                      className="px-3 py-1.5 bg-white dark:bg-[#1E1E1E] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-full text-xs font-medium text-[#4B5563] dark:text-[#A1A1AA] hover:border-[#C5A059] hover:text-[#C5A059] transition-colors shadow-sm"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-[#121212] border-t border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)]">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="w-full bg-[#F8F9FA] dark:bg-[#1E1E1E] border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.04)] rounded-full pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059]/50 transition-all text-[#18181B] dark:text-[#F8F9FA] placeholder:text-[#9CA3AF] dark:placeholder:text-[#71717A]"
                />
                <button
                  onClick={() => handleSend(inputValue)}
                  disabled={!inputValue.trim() || isTyping}
                  className="absolute right-2 p-2 bg-[#C5A059] hover:bg-[#E55A24] text-white rounded-full transition-colors disabled:opacity-50 disabled:hover:bg-[#C5A059]"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3 text-center">
                <p className="text-[10px] text-[#9CA3AF] dark:text-[#71717A] flex items-center justify-center gap-1">
                  <Shield className="w-3 h-3" /> Secure & private AI Support
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-[#C5A059] hover:bg-[#E55A24] text-white rounded-full shadow-[0_8px_24px_rgba(255,107,53,0.4)] flex items-center justify-center transition-colors"
        aria-label="Open support chat"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <HelpCircle className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
