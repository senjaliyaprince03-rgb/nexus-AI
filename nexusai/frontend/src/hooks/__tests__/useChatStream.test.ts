import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useChatStream } from "@/hooks/useChatStream"
import { useChatStore } from "@/store/chatStore"

function makeSSEStream(frames: string[]) {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const frame of frames) controller.enqueue(encoder.encode(frame))
      controller.close()
    },
  })
}

function makeFrames(tokens: string[], sessionId = "sess-1") {
  return [
    `event: source\ndata: ${JSON.stringify({ chunk_id: "c1", document_id: "d1", document_filename: "doc.pdf", content: "text", score: 0.9, page_number: 1, chunk_index: 0 })}\n\n`,
    ...tokens.map(t => `event: token\ndata: ${JSON.stringify(t)}\n\n`),
    `event: done\ndata: ${JSON.stringify({ session_id: sessionId, confidence_score: 0.95 })}\n\n`,
  ]
}

beforeEach(() => {
  useChatStore.getState().reset()
  useChatStore.setState({ workspaceId: "ws-test" })
})

describe("useChatStream", () => {
  it("appends token events to the streaming message", async () => {
    const frames = makeFrames(["Hello ", "world!"])
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true, body: makeSSEStream(frames),
    }))

    const { result } = renderHook(() => useChatStream())
    await act(async () => { await result.current.sendMessage("test question") })

    const messages = useChatStore.getState().messages
    const assistant = messages.find(m => m.role === "assistant")
    expect(assistant?.content).toContain("Hello ")
    expect(assistant?.content).toContain("world!")
    expect(assistant?.isStreaming).toBe(false)
  })

  it("adds source events to the message", async () => {
    const frames = makeFrames(["Answer"])
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true, body: makeSSEStream(frames),
    }))

    const { result } = renderHook(() => useChatStream())
    await act(async () => { await result.current.sendMessage("question") })

    const messages = useChatStore.getState().messages
    const assistant = messages.find(m => m.role === "assistant")
    expect(assistant?.sources?.length).toBeGreaterThan(0)
  })

  it("sends support metadata when support mode is requested", async () => {
    const frames = makeFrames(["Support answer"])
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, body: makeSSEStream(frames),
    })
    vi.stubGlobal("fetch", fetchMock)

    const { result } = renderHook(() => useChatStream())
    await act(async () => {
      await result.current.sendMessage("help me", {
        mode: "support",
        support_intent: "technical",
        source_policy: "combined",
      })
    })

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.mode).toBe("support")
    expect(body.support_intent).toBe("technical")
    expect(body.source_policy).toBe("combined")
  })

  it("handles fetch error gracefully", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false, json: async () => ({ detail: "Unauthorized" }),
    }))

    const { result } = renderHook(() => useChatStream())
    await act(async () => { await result.current.sendMessage("test") })

    const messages = useChatStore.getState().messages
    const assistant = messages.find(m => m.role === "assistant")
    expect(assistant?.content).toContain("⚠️")
  })

  it("abort cancels the stream", async () => {
    const abortSpy = vi.fn()
    const mockAbort = { abort: abortSpy, signal: { aborted: false } }
    vi.stubGlobal("AbortController", vi.fn(() => mockAbort))
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => new Promise(() => {})))

    const { result } = renderHook(() => useChatStream())
    act(() => { result.current.sendMessage("question") })
    act(() => { result.current.cancel() })
    expect(abortSpy).toHaveBeenCalled()
  })
})
