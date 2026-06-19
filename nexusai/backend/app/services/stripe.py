"""Stripe API integration service."""
from __future__ import annotations

import structlog
from typing import Any

try:
    import stripe
except ModuleNotFoundError:  # pragma: no cover - optional local dependency
    stripe = None  # type: ignore[assignment]

from app.core.config import settings
from app.services.mongo_store import store

log = structlog.get_logger(__name__)

if settings.stripe_api_key:
    if stripe is not None:
        stripe.api_key = settings.stripe_api_key
    else:
        log.warning("stripe.unavailable", msg="Stripe package is not installed. Using mock billing flow.")

class BillingConfigurationError(RuntimeError):
    """Raised when billing is requested before Stripe is configured."""


_PLACEHOLDER_PRICE_IDS = {
    "",
    "price_pro_monthly_placeholder",
    "price_pro_yearly_placeholder",
}


async def create_checkout_session(user_id: str, email: str, price_id: str) -> str:
    """Create a Stripe checkout session and return the URL."""
    if stripe is None or not settings.stripe_api_key:
        log.warning("stripe.missing_api_key", msg="Stripe API key is not set. Checkout blocked.")
        raise BillingConfigurationError("Stripe checkout is not configured.")

    if price_id in _PLACEHOLDER_PRICE_IDS:
        log.warning("stripe.missing_price_id", price_id=price_id or "<empty>")
        raise BillingConfigurationError("Stripe price id is not configured.")

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price": price_id,
                    "quantity": 1,
                },
            ],
            mode="subscription",
            success_url=f"{settings.app_base_url}/dashboard/billing?success=true",
            cancel_url=f"{settings.app_base_url}/dashboard/billing?canceled=true",
            customer_email=email,
            client_reference_id=user_id,
        )
        return session.url
    except Exception as e:
        log.error("stripe.checkout.error", error=str(e))
        raise


async def process_webhook(payload: bytes, sig_header: str) -> None:
    """Process a Stripe webhook payload."""
    if stripe is None or not settings.stripe_webhook_secret:
        log.warning("stripe.missing_webhook_secret", msg="Webhook secret not set. Skipping verification.")
        return

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except ValueError as e:
        log.error("stripe.webhook.invalid_payload", error=str(e))
        raise
    except stripe.error.SignatureVerificationError as e:
        log.error("stripe.webhook.invalid_signature", error=str(e))
        raise

    log.info("stripe.webhook.received", event_type=event.type)

    if event.type == "checkout.session.completed":
        session = event.data.object
        user_id = session.get("client_reference_id")
        
        if user_id:
            from app.core.mongo import to_object_id
            
            # Upgrade the user's workspace to Pro
            user = await store.users.find_one({"_id": to_object_id(user_id)})
            if user:
                default_workspace = user.get("active_workspace_id") or user.get("default_workspace_id")
                if default_workspace:
                    await store.workspaces.update_one(
                        {"_id": default_workspace},
                        {"$set": {"plan": "pro"}}
                    )
                    log.info("stripe.webhook.workspace_upgraded", workspace_id=str(default_workspace))
