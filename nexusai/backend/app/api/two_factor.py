"""Two-Factor Authentication routes."""
from __future__ import annotations

import base64
import io
import pyotp
import qrcode
import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.services.mongo_store import store
from app.core.security import verify_password

router = APIRouter(prefix="/2fa", tags=["2fa"])

class Enable2FARequest(BaseModel):
    code: str
    secret: str

class Disable2FARequest(BaseModel):
    password: str

@router.post("/setup")
async def setup_2fa(user: dict = Depends(get_current_user)):
    if user.get("is_totp_enabled"):
        raise HTTPException(status_code=400, detail="2FA is already enabled")
        
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    # The URI for the authenticator app
    provisioning_uri = totp.provisioning_uri(name=user["email"], issuer_name="NexusAI")
    
    # Generate QR Code image (base64)
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    
    return {
        "secret": secret,
        "qr_code": f"data:image/png;base64,{img_str}"
    }

@router.post("/enable")
async def enable_2fa(body: Enable2FARequest, user: dict = Depends(get_current_user)):
    if user.get("is_totp_enabled"):
        raise HTTPException(status_code=400, detail="2FA is already enabled")
        
    totp = pyotp.TOTP(body.secret)
    if not totp.verify(body.code):
        raise HTTPException(status_code=400, detail="Invalid 2FA code")
        
    backup_codes = [secrets.token_hex(4) for _ in range(10)]
    await store.enable_totp(user["_id"], body.secret, backup_codes)
    return {"message": "2FA enabled successfully", "backup_codes": backup_codes}

@router.post("/disable")
async def disable_2fa(body: Disable2FARequest, user: dict = Depends(get_current_user)):
    if not user.get("is_totp_enabled"):
        raise HTTPException(status_code=400, detail="2FA is not enabled")
        
    if not user.get("password_hash"):
        raise HTTPException(status_code=400, detail="OAuth accounts cannot disable 2FA this way")
        
    if not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Incorrect password")
        
    await store.disable_totp(user["_id"])
    return {"message": "2FA disabled successfully"}
