import React from "react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { SupportChatPanel } from "@/components/support/SupportChatPanel"
import { useChatStore } from "@/store/chatStore"

beforeEach(() => {
  useChatStore.getState().reset()
})

describe("SupportChatPanel", () => {
  it("changes support topic when a topic chip is clicked", () => {
    const onIntentChange = vi.fn()
    render(
      <SupportChatPanel
        activeIntent="technical"
        onIntentChange={onIntentChange}
        onSend={vi.fn()}
        onCancel={vi.fn()}
        isStreaming={false}
      />,
    )

    fireEvent.click(screen.getByText("Billing"))
    expect(onIntentChange).toHaveBeenCalledWith("billing")
  })

  it("sends starter prompts with the active intent", () => {
    const onSend = vi.fn()
    render(
      <SupportChatPanel
        activeIntent="privacy"
        onIntentChange={vi.fn()}
        onSend={onSend}
        onCancel={vi.fn()}
        isStreaming={false}
      />,
    )

    fireEvent.click(screen.getByText("How do I keep sensitive information safe in support chat?"))
    expect(onSend).toHaveBeenCalledWith("How do I keep sensitive information safe in support chat?", "privacy")
  })
})
