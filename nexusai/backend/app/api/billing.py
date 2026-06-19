"""Billing and subscription routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from app.api.deps import ensure_workspace_access, get_current_user
from app.core.config import settings
from app.core.mongo import utc_now
from app.services.mongo_store import store
from app.services.stripe import BillingConfigurationError, create_checkout_session, process_webhook

router = APIRouter(prefix="/billing", tags=["billing"])


class UpgradePlanRequest(BaseModel):
    workspace_id: str
    plan: str


class CheckoutRequest(BaseModel):
    price_id: str | None = None
    plan: str = "pro"
    interval: str = "monthly"


class Invoice(BaseModel):
    id: str
    date: str
    amount: str
    status: str


@router.post("/checkout")
async def checkout(
    body: CheckoutRequest,
    user: dict = Depends(get_current_user),
):
    """Create a Stripe Checkout Session."""
    if body.plan != "pro":
        raise HTTPException(
            status_code=422,
            detail="Only the Pro self-serve plan supports checkout.",
        )
    price_id = body.price_id
    if not price_id:
        price_id = (
            settings.stripe_pro_yearly_price_id
            if body.interval == "yearly"
            else settings.stripe_pro_monthly_price_id
        )
    try:
        url = await create_checkout_session(
            user_id=str(user["_id"]),
            email=user["email"],
            price_id=price_id,
        )
    except BillingConfigurationError as exc:
        raise HTTPException(
            status_code=503,
            detail=(
                "Billing is not configured. Set STRIPE_API_KEY, STRIPE_WEBHOOK_SECRET, "
                "STRIPE_PRO_MONTHLY_PRICE_ID, and STRIPE_PRO_YEARLY_PRICE_ID."
            ),
        ) from exc
    return {"url": url}


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe Webhooks."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")
        
    await process_webhook(payload, sig_header)
    return {"status": "success"}

@router.post("/upgrade")
async def upgrade_plan(
    body: UpgradePlanRequest,
    user: dict = Depends(get_current_user),
):
    await ensure_workspace_access(user, body.workspace_id)
    workspace = await store.get_workspace(body.workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if workspace.get("owner_id") != user["_id"]:
        raise HTTPException(
            status_code=403,
            detail="Only the workspace owner can upgrade the plan",
        )

    if body.plan not in ["free", "pro", "enterprise"]:
        raise HTTPException(status_code=400, detail="Invalid plan")
    if body.plan != "free":
        raise HTTPException(
            status_code=409,
            detail="Paid plans must be activated through Stripe checkout.",
        )

    await store.workspaces.update_one(
        {"_id": workspace["_id"]},
        {"$set": {"plan": body.plan, "updated_at": utc_now()}},
    )

    return {"message": f"Successfully upgraded to {body.plan} plan", "plan": body.plan}


@router.get("/invoices")
async def list_invoices(
    workspace_id: str,
    user: dict = Depends(get_current_user),
):
    # Verify access
    await ensure_workspace_access(user, workspace_id)
    
    return []
