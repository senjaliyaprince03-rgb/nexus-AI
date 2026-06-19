import React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ChatInput } from "@/components/chat/ChatInput"

describe("ChatInput", () => {
  it("renders textarea and send button", () => {
    render(<ChatInput onSend={vi.fn()} onCancel={vi.fn()} isStreaming={false} />)
    expect(screen.getByRole("textbox")).toBeTruthy()
    expect(screen.getByLabelText("Send message")).toBeTruthy()
  })

  it("calls onSend with trimmed text on Enter", () => {
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} onCancel={vi.fn()} isStreaming={false} />)
    const ta = screen.getByRole("textbox") as HTMLTextAreaElement
    fireEvent.change(ta, { target: { value: "  hello world  " } })
    fireEvent.keyDown(ta, { key: "Enter", shiftKey: false })
    expect(onSend).toHaveBeenCalledWith("hello world")
  })

  it("does not send on Shift+Enter", () => {
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} onCancel={vi.fn()} isStreaming={false} />)
    const ta = screen.getByRole("textbox")
    fireEvent.change(ta, { target: { value: "test" } })
    fireEvent.keyDown(ta, { key: "Enter", shiftKey: true })
    expect(onSend).not.toHaveBeenCalled()
  })

  it("shows Stop button when streaming", () => {
    render(<ChatInput onSend={vi.fn()} onCancel={vi.fn()} isStreaming={true} />)
    expect(screen.getByLabelText("Cancel streaming")).toBeTruthy()
  })

  it("calls onCancel when Stop is clicked", () => {
    const onCancel = vi.fn()
    render(<ChatInput onSend={vi.fn()} onCancel={onCancel} isStreaming={true} />)
    fireEvent.click(screen.getByLabelText("Cancel streaming"))
    expect(onCancel).toHaveBeenCalled()
  })

  it("disables send when message is empty", () => {
    render(<ChatInput onSend={vi.fn()} onCancel={vi.fn()} isStreaming={false} />)
    const btn = screen.getByLabelText("Send message") as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it("enforces MAX_LENGTH character limit", () => {
    render(<ChatInput onSend={vi.fn()} onCancel={vi.fn()} isStreaming={false} />)
    const ta = screen.getByRole("textbox") as HTMLTextAreaElement
    const longText = "a".repeat(2500)
    fireEvent.change(ta, { target: { value: longText } })
    expect(ta.value.length).toBeLessThanOrEqual(2000)
  })
})
