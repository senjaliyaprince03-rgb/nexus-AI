import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/storage", () => ({
  getSafeSessionStorage: () => sessionStorage,
}))

describe("chatStore", () => {
  beforeEach(() => {
    vi.resetModules()
    sessionStorage.clear()
  })

  it("loads persisted messages when a session becomes active", async () => {
    const { useChatStore } = await import("@/store/chatStore")

    const storedMessages = [
      {
        id: "m-1",
        role: "user" as const,
        content: "Summarize the contract",
        created_at: "2026-06-22T00:00:00.000Z",
      },
      {
        id: "m-2",
        role: "assistant" as const,
        content: "Here is the summary.",
        created_at: "2026-06-22T00:00:01.000Z",
      },
    ]

    useChatStore.setState({
      sessions: [
        {
          id: "session-1",
          title: "Contract summary",
          workspace_id: "workspace-1",
          created_at: "2026-06-22T00:00:00.000Z",
          updated_at: "2026-06-22T00:00:02.000Z",
          messages: storedMessages,
          mode: "document",
        },
      ],
      activeSessionId: null,
      messages: [],
    })

    useChatStore.getState().setActiveSession("session-1")

    expect(useChatStore.getState().messages).toEqual(storedMessages)
  })

  it("keeps active session messages in sync during streaming", async () => {
    const { useChatStore } = await import("@/store/chatStore")

    useChatStore.setState({
      sessions: [
        {
          id: "session-2",
          title: "Workspace question",
          workspace_id: "workspace-1",
          created_at: "2026-06-22T00:00:00.000Z",
          updated_at: "2026-06-22T00:00:00.000Z",
          messages: [],
          mode: "document",
        },
      ],
      activeSessionId: "session-2",
      messages: [],
    })

    useChatStore.getState().addMessage({
      id: "user-1",
      role: "user",
      content: "What are the key deadlines?",
      created_at: "2026-06-22T00:00:00.000Z",
      mode: "document",
    })
    useChatStore.getState().startStreaming("assistant-1", { mode: "document" })
    useChatStore.getState().appendToken("The key deadline is June 30.")
    useChatStore.getState().finalizeStream("session-2", 0.92)

    const session = useChatStore.getState().sessions.find((item) => item.id === "session-2")
    expect(session?.messages).toHaveLength(2)
    expect(session?.messages[1].content).toContain("June 30")
    expect(session?.messages[1].confidence_score).toBe(0.92)
  })
})
