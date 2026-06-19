import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatInput } from "@/components/chat/ChatInput";

describe("ChatInput", () => {
  it("renders placeholder text", () => {
    render(<ChatInput onSend={vi.fn()} />);
    expect(screen.getByPlaceholderText(/ask a question/i)).toBeInTheDocument();
  });

  it("calls onSend with trimmed text on Enter", async () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);
    const textarea = screen.getByRole("textbox");
    await userEvent.type(textarea, "What is Paris?");
    await userEvent.keyboard("{Enter}");
    expect(onSend).toHaveBeenCalledWith("What is Paris?");
  });

  it("does not call onSend on Shift+Enter", async () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);
    const textarea = screen.getByRole("textbox");
    await userEvent.type(textarea, "Line one");
    await userEvent.keyboard("{Shift>}{Enter}{/Shift}");
    expect(onSend).not.toHaveBeenCalled();
  });

  it("clears input after send", async () => {
    render(<ChatInput onSend={vi.fn()} />);
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    await userEvent.type(textarea, "Test message");
    await userEvent.keyboard("{Enter}");
    expect(textarea.value).toBe("");
  });

  it("does not send empty or whitespace-only messages", async () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);
    const textarea = screen.getByRole("textbox");
    await userEvent.type(textarea, "   ");
    await userEvent.keyboard("{Enter}");
    expect(onSend).not.toHaveBeenCalled();
  });

  it("disables textarea and send button when disabled=true", () => {
    render(<ChatInput onSend={vi.fn()} disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
  });

  it("shows streaming placeholder when disabled", () => {
    render(<ChatInput onSend={vi.fn()} disabled />);
    expect(screen.getByPlaceholderText(/waiting for response/i)).toBeInTheDocument();
  });
});
