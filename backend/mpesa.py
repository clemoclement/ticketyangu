import base64, os, uuid
from datetime import datetime
import requests

MOCK = os.getenv("MPESA_MOCK", "1") == "1"
BASE = "https://sandbox.safaricom.co.ke"


def normalise_phone(raw: str) -> str:
    p = "".join(c for c in raw if c.isdigit())
    if p.startswith("0") and len(p) == 10: p = "254" + p[1:]
    elif len(p) == 9 and p[0] in "71": p = "254" + p
    if not (p.startswith("254") and len(p) == 12):
        raise ValueError("Enter a valid Safaricom number, e.g. 0712 345 678")
    return "+" + p


def _token():
    r = requests.get(f"{BASE}/oauth/v1/generate?grant_type=client_credentials",
                     auth=(os.environ["MPESA_CONSUMER_KEY"], os.environ["MPESA_CONSUMER_SECRET"]), timeout=15)
    r.raise_for_status()
    return r.json()["access_token"]


def stk_push(phone: str, amount: int, reference: str) -> str:
    """Returns CheckoutRequestID."""
    if MOCK:
        return "mock-" + uuid.uuid4().hex[:12]
    ts = datetime.now().strftime("%Y%m%d%H%M%S")
    shortcode, passkey = os.environ["MPESA_SHORTCODE"], os.environ["MPESA_PASSKEY"]
    body = {"BusinessShortCode": shortcode,
            "Password": base64.b64encode(f"{shortcode}{passkey}{ts}".encode()).decode(),
            "Timestamp": ts, "TransactionType": "CustomerPayBillOnline", "Amount": amount,
            "PartyA": phone.lstrip("+"), "PartyB": shortcode, "PhoneNumber": phone.lstrip("+"),
            "CallBackURL": os.environ["MPESA_CALLBACK_URL"],
            "AccountReference": reference, "TransactionDesc": "Tiko tickets"}
    r = requests.post(f"{BASE}/mpesa/stkpush/v1/processrequest", json=body,
                      headers={"Authorization": f"Bearer {_token()}"}, timeout=20)
    r.raise_for_status()
    return r.json()["CheckoutRequestID"]
