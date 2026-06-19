import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock cookies
vi.mock("js-cookie", () => ({ default: { get: vi.fn(() => "test-token") } }));

// Mock the chat store
const mockStore = {
  workspaceId: "ws-123",
  activeSessionId: null,
  addUserMessage: vi.fn(),
  appendToken: vi.fn(),
  setPendingSources: vi.fn(),
  finaliseStream: vi.fn(),
  setStreaming: vi.fn(),
};
vi.mock("@/store/chatStore", () => ({
  useChatStore: vi.fn(() => mockStore),
}));

import { useChatStream } from "@/hooks/useChatStream";

// Helpers to build mock SSE responses
function makeSseResponse(events: Array<{ type: string; data: string }>) {
  const body = events
    .map((e) => `data: ${JSON.stringify({ type: e.type, data: e.data })}\n\n`)
    .join("");

  const encoder = new TextEncoder();
  const encoded = encoder.encode(body);
  let offset = 0;

  const stream = new ReadableStream({
    pull(controller) {
      if (offset < encoded.length) {
        controller.enqueue(encoded.slice(offset, offset + 32));
        offset += 32;
      } else {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

describe("useChatStream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls addUserMessage immediately on sendMessage", async () => {
    global.fetch = vi.fn().mockResolvedValue(makeSseResponse([{ type: "done", data: "" }]));
    const { result } = renderHook(() => useChatStream());
    await act(async () => {
      await result.current.sendMessage("What are the risks?");
    });
    expect(mockStore.addUserMessage).toHaveBeenCalledWith("What are the risks?");
  });

  it("sets streaming to true while processing", async () => {
    global.fetch = vi.fn().mockResolvedValue(makeSseResponse([{ type: "done", data: "" }]));
    const { result } = renderHook(() => useChatStream());
    await act(async () => {
      await result.current.sendMessage("test");
    });
    expect(mockStore.setStreaming).toHaveBeenCalledWith(true);
  });

  it("appends token events to the store", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      makeSseResponse([
        { type: "token", data: "Hello" },
        { type: "token", data: " world" },
        { type: "done", data: "" },
      ])
    );
    const { result } = renderHook(() => useChatStream());
    await act(async () => {
      await result.current.sendMessage("test");
    });
    expect(mockStore.appendToken).toHaveBeenCalledWith("Hello");
  });

  it("calls setPendingSources when source event arrives", async () => {
    const sources = [{ chunk_id: "c1", filename: "doc.pdf", score: 0.9 }];
    global.fetch = vi.fn().mockResolvedValue(
      makeSseResponse([
        { type: "source", data: JSON.stringify(sources) },
        { type: "done", data: "" },
      ])
    );
    const { result } = renderHook(() => useChatStream());
    await act(async () => {
      await result.current.sendMessage("test");
    });
    expect(mockStore.setPendingSources).toHaveBeenCalledWith(sources);
  });

  it("calls finaliseStream on done event", async () => {
    global.fetch = vi.fn().mockResolvedValue(makeSseResponse([{ type: "done", data: "" }]));
    const { result } = renderHook(() => useChatStream());
    await act(async () => {
      await result.current.sendMessage("test");
    });
    expect(mockStore.finaliseStream).toHaveBeenCalled();
  });

  it("does not send when workspaceId is null", async () => {
    mockStore.workspaceId = null as any;
    global.fetch = vi.fn();
    const { result } = renderHook(() => useChatStream());
    await act(async () => {
      await result.current.sendMessage("test");
    });
    expect(global.fetch).not.toHaveBeenCalled();
    mockStore.workspaceId = "ws-123";
  });
});
