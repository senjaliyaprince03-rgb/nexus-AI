"use client"
import { useState, useRef, useEffect } from "react"
import { useUIStore } from "@/store/uiStore"
import { X, Send, Bot, Minus } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
}

export function AntigravetiyWidget() {
  const { isAntigravetiyOpen, closeAntigravetiy } = useUIStore()
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm NexusAI, your friendly AI assistant. How can I help you today?" }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (!isAntigravetiyOpen) return null

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    const userMessage = input.trim()
    setInput("")
    setMessages(prev => [...prev, { role: "user", content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch("/api/antigravetiy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [...messages, { role: "user", content: userMessage }]
        }),
      })

      const data = await response.json()
      if (data.reply) {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }])
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "I'm sorry, I encountered an error connecting to my servers." }])
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "I'm having trouble connecting right now. Please try again later." }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 w-full max-w-[calc(100vw-48px)] sm:max-w-[380px] h-[550px] max-h-[85vh] bg-[var(--landing-surface)] border border-[var(--landing-border)] rounded-2xl shadow-2xl flex flex-col z-[100] overflow-hidden backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#C5A059] to-[#FF8B5B] text-white">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <h3 className="font-semibold text-sm">NexusAI Assistant</h3>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={closeAntigravetiy} className="p-1 hover:bg-white/20 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
              msg.role === "user" 
                ? "bg-[#C5A059] text-white rounded-br-sm" 
                : "bg-[var(--landing-bg-muted)] text-[var(--landing-text)] border border-[var(--landing-border-soft)] rounded-bl-sm"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm bg-[var(--landing-bg-muted)] text-[var(--landing-text)] border border-[var(--landing-border-soft)] rounded-bl-sm flex gap-1">
              <span className="w-1.5 h-1.5 bg-[#C5A059] rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-[#C5A059] rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></span>
              <span className="w-1.5 h-1.5 bg-[#C5A059] rounded-full animate-bounce" style={{animationDelay: "0.4s"}}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-[var(--landing-border)] bg-[var(--landing-surface)]">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your message..."
            className="w-full bg-[var(--landing-bg-muted)] border border-[var(--landing-border-soft)] rounded-full pl-4 pr-10 py-2.5 text-sm text-[var(--landing-text)] focus:outline-none focus:border-[#C5A059] transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-1.5 p-1.5 bg-[#C5A059] text-white rounded-full disabled:opacity-50 hover:bg-[#e85a25] transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
