from datetime import datetime, timedelta
import hashlib
import hmac
import json
from base64 import b64encode
from urllib.error import HTTPError, URLError
from urllib.request import Request as UrlRequest, urlopen

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from ..config import settings
from ..deps import get_current_user, get_db
from ..models import Subscription, User

router = APIRouter(prefix="/billing", tags=["billing"])

try:
    import razorpay  # type: ignore
except Exception:
    razorpay = None


def _razorpay_client():
    if not razorpay:
        return None
    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        return None
    return razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))


def _assert_razorpay_keys_configured():
    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env and restart backend.",
        )


def _create_order_via_http(*, amount_paise: int, receipt: str, notes: dict):
    auth = b64encode(f"{settings.razorpay_key_id}:{settings.razorpay_key_secret}".encode("utf-8")).decode("ascii")
    payload = json.dumps(
        {
            "amount": amount_paise,
            "currency": "INR",
            "receipt": receipt,
            "notes": notes,
        }
    ).encode("utf-8")
    req = UrlRequest(
        "https://api.razorpay.com/v1/orders",
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Basic {auth}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urlopen(req, timeout=15) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body)
    except HTTPError as exc:
        detail = "Razorpay order creation failed."
        try:
            err_payload = json.loads(exc.read().decode("utf-8"))
            detail = err_payload.get("error", {}).get("description") or detail
        except Exception:
            pass
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=detail) from exc
    except URLError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not reach Razorpay API. Check server internet/network and try again.",
        ) from exc


@router.get("/plans")
def list_plans():
    return {
        "free": {"meeting_limit": settings.free_plan_meeting_limit, "price_inr": 0},
        "pro_monthly": {"meeting_limit": "unlimited", "price_inr": 2900},
        "pro_yearly": {"meeting_limit": "unlimited", "price_inr": 25900},
        "enterprise": {"meeting_limit": "custom", "price_inr": "contact sales"},
    }


@router.post("/subscribe/pro")
def subscribe_pro(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subscription = db.query(Subscription).filter(Subscription.user_id == current_user.id).first()
    if not subscription:
        subscription = Subscription(user_id=current_user.id)

    subscription.plan = "pro"
    subscription.status = "active"
    subscription.provider = "razorpay"
    subscription.current_period_end = datetime.utcnow() + timedelta(days=30)
    current_user.plan = "pro"

    db.add(subscription)
    db.add(current_user)
    db.commit()
    return {"status": "ok", "message": "User upgraded to pro (Razorpay dev shortcut)."}


@router.post("/razorpay/order")
def create_razorpay_order(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = (payload.get("plan") or "").lower()
    cycle = (payload.get("cycle") or "monthly").lower()
    if plan not in {"pro", "enterprise"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid plan")
    if cycle not in {"monthly", "yearly"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid cycle")

    if plan == "enterprise":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Enterprise is contact-sales only")

    _assert_razorpay_keys_configured()
    amount_inr = 2900 if cycle == "monthly" else 25900
    receipt = f"user-{current_user.id}-{cycle}-{int(datetime.utcnow().timestamp())}"
    notes = {
        "user_id": str(current_user.id),
        "plan": plan,
        "cycle": cycle,
    }

    client = _razorpay_client()
    if client is not None:
        order = client.order.create(
            {
                "amount": amount_inr * 100,
                "currency": "INR",
                "receipt": receipt,
                "notes": notes,
            }
        )
    else:
        order = _create_order_via_http(amount_paise=amount_inr * 100, receipt=receipt, notes=notes)

    return {
        "mode": "live",
        "order_id": order["id"],
        "amount": order["amount"],
        "currency": order["currency"],
        "key_id": settings.razorpay_key_id,
    }


@router.post("/razorpay/verify")
def verify_razorpay_payment(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _assert_razorpay_keys_configured()

    order_id = (payload.get("razorpay_order_id") or "").strip()
    payment_id = (payload.get("razorpay_payment_id") or "").strip()
    signature = (payload.get("razorpay_signature") or "").strip()
    plan = (payload.get("plan") or "pro").strip().lower()
    cycle = (payload.get("cycle") or "monthly").strip().lower()
    is_non_production = settings.app_env.strip().lower() in {"development", "dev", "local", "test", "testing"}

    if (not order_id or not payment_id or not signature) and not is_non_production:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing Razorpay payment verification fields")
    if plan not in {"pro", "enterprise"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid plan")
    if cycle not in {"monthly", "yearly"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid cycle")

    signature_ok = False
    if order_id and payment_id and signature:
        signed_payload = f"{order_id}|{payment_id}".encode("utf-8")
        expected = hmac.new(settings.razorpay_key_secret.encode("utf-8"), signed_payload, hashlib.sha256).hexdigest()
        signature_ok = hmac.compare_digest(expected, signature)
    if not signature_ok and not is_non_production:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Razorpay payment signature")

    subscription = db.query(Subscription).filter(Subscription.user_id == current_user.id).first()
    if not subscription:
        subscription = Subscription(user_id=current_user.id)

    subscription.plan = plan
    subscription.status = "active"
    subscription.provider = "razorpay" if signature_ok else "razorpay_test"
    subscription.current_period_end = datetime.utcnow() + (timedelta(days=365) if cycle == "yearly" else timedelta(days=30))
    current_user.plan = plan
    current_user.meetings_used = 0

    db.add(subscription)
    db.add(current_user)
    db.commit()
    return {
        "status": "ok",
        "message": "Payment verified and plan upgraded" if signature_ok else "Test payment accepted and plan upgraded",
        "verification": "verified" if signature_ok else "test-bypass",
    }


@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    payload = await request.body()
    signature = request.headers.get("X-Razorpay-Signature")
    if not settings.razorpay_webhook_secret or not signature:
        return {"received": True, "note": "Webhook secret/signature missing. Configure Razorpay webhook."}

    expected = hmac.new(
        settings.razorpay_webhook_secret.encode("utf-8"),
        payload,
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(expected, signature):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook signature")

    event = json.loads(payload.decode("utf-8"))
    event_type = event.get("event", "")
    payment_entity = event.get("payload", {}).get("payment", {}).get("entity", {})
    notes = payment_entity.get("notes", {})
    user_id_raw = notes.get("user_id")
    plan = (notes.get("plan") or "pro").lower()
    cycle = (notes.get("cycle") or "monthly").lower()

    if event_type in {"payment.captured", "order.paid"} and user_id_raw:
        try:
            user_id = int(user_id_raw)
        except Exception:
            user_id = None
        if user_id is not None:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()
                if not sub:
                    sub = Subscription(user_id=user.id)

                sub.provider = "razorpay"
                sub.plan = plan if plan in {"pro", "enterprise"} else "pro"
                sub.status = "active"
                sub.current_period_end = datetime.utcnow() + (timedelta(days=365) if cycle == "yearly" else timedelta(days=30))

                user.plan = sub.plan
                if sub.plan != "free":
                    user.meetings_used = 0

                db.add(sub)
                db.add(user)
                db.commit()

    return {"received": True, "event": event_type}
