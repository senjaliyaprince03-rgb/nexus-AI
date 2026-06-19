"""Service for the AI Help & Support Agent."""
from __future__ import annotations

import json
from collections.abc import AsyncGenerator

import structlog

from app.core.config import settings
from app.core.openai_clients import get_async_openai_client

log = structlog.get_logger(__name__)

SUPPORT_CONTEXT = """
NexusAI Support Knowledge Base:

1. Billing & Pricing:
   - NexusAI offers 3 tiers: Starter (Free), Pro (₹1,999/mo), and Enterprise (Custom).
   - The Pro plan allows unlimited queries and uploads.
   - Payments are processed via Stripe Checkout when billing is configured.
   - Billing invoices appear in the Billing dashboard after real checkout/webhook setup is configured.
   - Downgrades take effect at the end of the current billing cycle. No cancellation fees.

2. Technical Support:
   - Supported document types: PDF, DOCX, TXT, CSV.
   - Maximum file size per upload: 50MB.
   - If a document fails to index, suggest they check for password protection or scanned images (we require OCR text).
   - "Rate Limit Exceeded" (429 error) means they've hit their query limit (50/mo on Free). They must wait or upgrade.

3. Account & Privacy:
   - Passwords can be reset from the login screen or Settings.
   - We comply with GDPR and CCPA. Data is encrypted in transit and at rest.
   - Users can delete their workspace entirely from the Settings page.

4. Escalation:
   - If the issue is highly specific or involves a refund, apologize and say you are transferring them to a human agent.
"""

SUPPORT_SYSTEM_PROMPT = f"""\
You are a premium, empathetic, and professional AI Help & Support Agent for NexusAI.
Your tone must be polite, patient, and clear. Acknowledge user frustration if they are upset, and build trust.

Guidelines:
1. Always base your answers on the provided Support Knowledge Base.
2. If the user asks something outside the Knowledge Base, politely say you don't have that information and ask if they'd like to be connected to a human agent.
3. Keep responses concise (1-3 paragraphs maximum).
4. Use formatting (bullet points, bold text) to make your answers easy to read.
5. If the user asks to speak to a human, or seems extremely angry, output a message saying: "I understand this is frustrating. I'm escalating you to our support team right away. They will reach out to you via email within 1 hour."

{SUPPORT_CONTEXT}
"""


def _sse(event: str, data: str | dict | list) -> str:
    payload = json.dumps(data, ensure_ascii=False)
    return f"event: {event}\ndata: {payload}\n\n"


async def stream_support_chat(
    prompt: str,
    history: list[dict] | None = None,
) -> AsyncGenerator[str, None]:
    """Stream a response from the Support Agent."""
    messages = [{"role": "system", "content": SUPPORT_SYSTEM_PROMPT}]
    
    if history:
        for msg in history[-10:]:  # Keep last 10 messages for context
            if msg.get("role") in ("user", "assistant"):
                messages.append({"role": msg["role"], "content": msg["content"]})
                
    messages.append({"role": "user", "content": prompt})

    try:
        if settings.use_mongo_mock:
            # Mock mode fallback
            yield _sse("token", "Hello! I am currently running in offline mock mode. ")
            yield _sse("token", "Please connect a real OpenAI key for full support assistance.")
            yield _sse("done", {"status": "success"})
            return

        client = get_async_openai_client()
        completion = await client.chat.completions.create(
            model=settings.llm_model,
            messages=messages,
            stream=True,
            temperature=0.2,
        )
        
        async for chunk in completion:
            if not getattr(chunk, "choices", None):
                continue
            text = chunk.choices[0].delta.content
            if text is None:
                continue
            yield _sse("token", text)
            
        yield _sse("done", {"status": "success"})
        
    except Exception as exc:
        log.error("support.failed", error=str(exc))
        yield _sse("error", "An error occurred while communicating with support. Please try again later.")
