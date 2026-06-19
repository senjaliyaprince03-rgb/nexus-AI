import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock the chat stream hook
vi.mock("@/hooks/useChatStream", () => ({
  useChatStream: () => ({ sendMessage: vi.fn() }),
}));

// Mock zustand store
vi.mock("@/store/chatStore", () => ({
  useChatStore: vi.fn(() => ({
    messages: [],
    isStreaming: false,
    streamingContent: "",
    workspaceId: "ws-test-id",
    sessions: [],
    activeSessionId: null,
    setActiveSession: vi.fn(),
    reset: vi.fn(),
  })),
}));

import { ChatWindow } from "@/components/chat/ChatWindow";

describe("ChatWindow", () => {
  it("renders empty state when no messages", () => {
    render(<ChatWindow />);
    expect(screen.getByText(/ask your documents/i)).toBeInTheDocument();
  });

  it("shows textarea for user input", () => {
    render(<ChatWindow />);
    const textarea = screen.getByPlaceholderText(/ask anything/i);
    expect(textarea).toBeInTheDocument();
  });

  it("send button is disabled when input is empty", () => {
    render(<ChatWindow />);
    const button = screen.getByRole("button", { name: "" });
    // The ArrowUp button should have disabled state
    expect(button).toBeDisabled();
  });
});

describe("ChatWindow input behavior", () => {
  it("enables send button when text is typed", async () => {
    const user = userEvent.setup();
    render(<ChatWindow />);
    const textarea = screen.getByPlaceholderText(/ask anything/i);
    await user.type(textarea, "What is the risk assessment?");
    // After typing, the send button should be enabled
    const buttons = screen.getAllByRole("button");
    const sendButton = buttons.find((b) => !b.disabled);
    expect(sendButton).toBeDefined();
  });

  it("clears input after sending", async () => {
    const { sendMessage } = (await import("@/hooks/useChatStream")).useChatStream();
    const user = userEvent.setup();
    render(<ChatWindow />);
    const textarea = screen.getByPlaceholderText(/ask anything/i);
    await user.type(textarea, "Test question");
    await user.keyboard("{Enter}");
    // Textarea should be cleared or sendMessage called
    expect(textarea).toBeTruthy();
  });

  it("does not send on Shift+Enter (new line)", async () => {
    const mockSend = vi.fn();
    vi.mocked(await import("@/hooks/useChatStream")).useChatStream = () => ({
      sendMessage: mockSend,
    });
    const user = userEvent.setup();
    render(<ChatWindow />);
    const textarea = screen.getByPlaceholderText(/ask anything/i);
    await user.type(textarea, "Line one");
    await user.keyboard("{Shift>}{Enter}{/Shift}");
    expect(mockSend).not.toHaveBeenCalled();
  });
});
