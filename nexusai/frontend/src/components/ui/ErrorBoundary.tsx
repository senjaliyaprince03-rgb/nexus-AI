"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Strip newlines and control characters from a string before it is written
 * to the console or rendered in the UI.
 *
 * Prevents CWE-117: raw error messages can contain \n / \r that split a
 * single console.error call into multiple log lines, allowing an attacker
 * to forge fake log entries in browser DevTools and log aggregators.
 */
function _sanitiseForLog(value: string): string {
  return value.replace(/[\r\n\t\x00-\x1f\x7f]/g, " ").trim()
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Sanitise before logging to prevent log injection (CWE-117).
    const safeMessage = _sanitiseForLog(error.message ?? "")
    const safeStack   = _sanitiseForLog(error.stack   ?? "")
    const safeComponent = _sanitiseForLog(info.componentStack ?? "")
    console.error("[ErrorBoundary]", { message: safeMessage, stack: safeStack, componentStack: safeComponent })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      // Sanitise the error message before rendering it in the UI.
      const safeMessage = _sanitiseForLog(
        this.state.error?.message ?? "An unexpected error occurred"
      )

      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[200px] p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200 mb-1">Something went wrong</h3>
          <p className="text-xs text-slate-500 mb-4 max-w-xs">
            {safeMessage}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="btn-ghost text-xs gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
