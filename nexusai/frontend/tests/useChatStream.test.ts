import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useChatStream } from "@/hooks/useChatStream";

// Mock fetch with a streaming SSE response
function makeSSEResponse(events: string[]) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(ctrl) {
      for (const ev of events) ctrl.enqueue(encoder.encode(ev));
      ctrl.close();
    },
  });
  return new Response(stream, {
    headers: { "content-type": "text/event-stream" },
  });
}

describe("useChatStream", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => "mock-token"),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
    vi.stubGlobal("crypto", { randomUUID: vi.fn(() => "mock-uuid") });
  });

  afterEach(() => vi.restoreAllMocks());

  it("initialises with empty messages and not streaming", () => {
    const { result } = renderHook(() => useChatStream("ws-1"));
    expect(result.current.messages).toHaveLength(0);
    expect(result.current.isStreaming).toBe(false);
  });

  it("adds user message immediately on send", async () => {
    const sseEvents = [
      `data: ${JSON.stringify({ type: "token", data: "Hello" })}\n\n`,
      `data: ${JSON.stringify({ type: "done", data: "" })}\n\n`,
    ];
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(makeSSEResponse(sseEvents))));

    const { result } = renderHook(() => useChatStream("ws-1"));
    await act(async () => {
      await result.current.sendMessage("What is RAG?");
    });

    expect(result.current.messages[0].role).toBe("user");
    expect(result.current.messages[0].content).toBe("What is RAG?");
  });

  it("appends tokens to assistant message", async () => {
    const sseEvents = [
      `data: ${JSON.stringify({ type: "token", data: "RAG " })}\n\n`,
      `data: ${JSON.stringify({ type: "token", data: "stands for" })}\n\n`,
      `data: ${JSON.stringify({ type: "done", data: "" })}\n\n`,
    ];
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(makeSSEResponse(sseEvents))));

    const { result } = renderHook(() => useChatStream("ws-1"));
    await act(async () => {
      await result.current.sendMessage("What is RAG?");
    });

    const assistant = result.current.messages.find((m) => m.role === "assistant");
    expect(assistant?.content).toContain("RAG stands for");
    expect(assistant?.isStreaming).toBe(false);
  });

  it("clearMessages resets to empty array", async () => {
    const { result } = renderHook(() => useChatStream("ws-1"));
    act(() => result.current.clearMessages());
    expect(result.current.messages).toHaveLength(0);
  });
});
