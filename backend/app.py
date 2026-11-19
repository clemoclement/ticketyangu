import os, random
from datetime import datetime, timedelta
from functools import wraps
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import (JWTManager, create_access_token, jwt_required,
                                get_jwt, get_jwt_identity)
from flask_migrate import Migrate
from sqlalchemy import func
from models import db, User, Event, TicketType, Booking, BookingItem, Payment, STATUSES
import mpesa

load_dotenv()
app = Flask(__name__)
app.config.update(
    SQLALCHEMY_DATABASE_URI=os.getenv("DATABASE_URL", "sqlite:///tiko.db").replace("postgres://", "postgresql://"),
    JWT_SECRET_KEY=os.getenv("JWT_SECRET_KEY", "dev-secret"),
    JWT_ACCESS_TOKEN_EXPIRES=timedelta(hours=12))
CORS(app, origins=os.getenv("CORS_ORIGIN", "*").split(","))
db.init_app(app); Migrate(app, db); JWTManager(app)
SERVICE_FEE = int(os.getenv("SERVICE_FEE", 200))


def err(msg, code=400): return jsonify({"error": msg}), code


def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*a, **kw):
        if get_jwt().get("role") != "admin": return err("Admins only", 403)
        return fn(*a, **kw)
    return wrapper


# ---------- auth ----------
@app.post("/api/auth/register")
def register():
    d = request.get_json() or {}
    if not all(d.get(k) for k in ("name", "email", "password")): return err("Name, email and password are required")
    if len(d["password"]) < 8: return err("Password must be at least 8 characters")
    if User.query.filter_by(email=d["email"].lower()).first(): return err("That email is already registered", 409)
    u = User(name=d["name"], email=d["email"].lower()); u.set_password(d["password"])
    db.session.add(u); db.session.commit()
    return jsonify(token=create_access_token(str(u.id), additional_claims={"role": u.role}), user=u.to_dict()), 201


@app.post("/api/auth/login")
def login():
    d = request.get_json() or {}
    u = User.query.filter_by(email=(d.get("email") or "").lower()).first()
    if not u or not u.check_password(d.get("password", "")): return err("Email or password is incorrect", 401)
    return jsonify(token=create_access_token(str(u.id), additional_claims={"role": u.role}), user=u.to_dict())


# ---------- events ----------
@app.get("/api/events")
def list_events():
    q = Event.query
    if s := request.args.get("q"): q = q.filter(Event.title.ilike(f"%{s}%") | Event.venue.ilike(f"%{s}%"))
    if c := request.args.get("category"): q = q.filter_by(category=c)
    if request.args.get("featured") == "1": q = q.filter_by(featured=True)
    return jsonify([e.to_dict(False) for e in q.order_by(Event.starts_at).all()])


@app.get("/api/events/<int:eid>")
def get_event(eid): return jsonify(db.get_or_404(Event, eid).to_dict())


def _apply_event(e, d):
    for k in ("title", "category", "description", "venue", "city", "image_url", "organizer", "featured"):
        if k in d: setattr(e, k, d[k])
    if d.get("starts_at"): e.starts_at = datetime.fromisoformat(d["starts_at"])
    if d.get("ends_at"): e.ends_at = datetime.fromisoformat(d["ends_at"])
    for t in d.get("tickets", []):
        tt = db.session.get(TicketType, t["id"]) if t.get("id") else TicketType(event=e)
        for k in ("name", "description", "price", "capacity", "max_per_order"):
            if k in t: setattr(tt, k, t[k])
        db.session.add(tt)


@app.post("/api/admin/events")
@admin_required
def create_event():
    d = request.get_json() or {}
    if not all(d.get(k) for k in ("title", "category", "venue", "starts_at")): return err("Title, category, venue and start time are required")
    e = Event(); _apply_event(e, d); db.session.add(e); db.session.commit()
    return jsonify(e.to_dict()), 201


@app.put("/api/admin/events/<int:eid>")
@admin_required
def update_event(eid):
    e = db.get_or_404(Event, eid); _apply_event(e, request.get_json() or {}); db.session.commit()
    return jsonify(e.to_dict())


@app.delete("/api/admin/events/<int:eid>")
@admin_required
def delete_event(eid):
    e = db.get_or_404(Event, eid)
    if Booking.query.filter_by(event_id=eid).count(): return err("This event has bookings. Unfeature it instead of deleting.", 409)
    db.session.delete(e); db.session.commit(); return "", 204


# ---------- bookings ----------
def _reference(event):
    base = f"TK-{event.starts_at:%y%m%d}-"
    while True:
        ref = base + f"{random.randint(0, 9999):04d}"
        if not Booking.query.filter_by(reference=ref).first(): return ref


@app.post("/api/bookings")
@jwt_required()
def create_booking():
    d = request.get_json() or {}
    event = db.session.get(Event, d.get("event_id"))
    items = [i for i in d.get("items", []) if i.get("quantity", 0) > 0]
    if not event or not items: return err("Choose an event and at least one ticket")
    if not (d.get("attendee_name") and d.get("attendee_email")): return err("Attendee name and email are required")
    try: phone = mpesa.normalise_phone(d.get("phone", ""))
    except ValueError as ex: return err(str(ex))
    lines, subtotal = [], 0
    for i in items:  # lock rows so two buyers cannot oversell the last ticket
        tt = db.session.query(TicketType).with_for_update().filter_by(id=i["ticket_type_id"], event_id=event.id).first()
        if not tt: return err("Ticket type not found", 404)
        if i["quantity"] > tt.max_per_order: return err(f"Max {tt.max_per_order} {tt.name} tickets per order")
        if i["quantity"] > tt.remaining:
            db.session.rollback(); return err(f"Only {tt.remaining} {tt.name} tickets left", 409)
        tt.sold += i["quantity"]; subtotal += tt.price * i["quantity"]
        lines.append(BookingItem(ticket_type_id=tt.id, quantity=i["quantity"], unit_price=tt.price))
    b = Booking(reference=_reference(event), user_id=int(get_jwt_identity()), event_id=event.id,
                attendee_name=d["attendee_name"], attendee_email=d["attendee_email"], phone=phone,
                subtotal=subtotal, service_fee=SERVICE_FEE, total=subtotal + SERVICE_FEE, items=lines)
    db.session.add(b); db.session.commit()
    return jsonify(b.to_dict()), 201


@app.post("/api/bookings/<int:bid>/pay")
@jwt_required()
def pay(bid):
    """Send (or resend) the M-Pesa STK push."""
    b = db.get_or_404(Booking, bid)
    if b.user_id != int(get_jwt_identity()): return err("Not your booking", 403)
    if b.payment_status == "Paid": return err("Already paid", 409)
    last = max((p.created_at for p in b.payments), default=None)
    if last and datetime.utcnow() - last < timedelta(seconds=30): return err("Wait 30 seconds before resending the prompt", 429)
    try: cid = mpesa.stk_push(b.phone, b.total, b.reference)
    except Exception: return err("Could not reach M-Pesa. Try again in a moment.", 502)
    db.session.add(Payment(booking_id=b.id, checkout_request_id=cid, amount=b.total))
    b.payment_status = "Waiting"; db.session.commit()
    return jsonify(b.to_dict())


@app.post("/api/payments/mpesa/callback")  # called by Safaricom, no JWT
def mpesa_callback():
    cb = (request.get_json() or {}).get("Body", {}).get("stkCallback", {})
    p = Payment.query.filter_by(checkout_request_id=cb.get("CheckoutRequestID")).first()
    if not p: return jsonify(ResultCode=0, ResultDesc="Accepted")
    p.result_code, p.result_desc = cb.get("ResultCode"), cb.get("ResultDesc")
    meta = {i["Name"]: i.get("Value") for i in cb.get("CallbackMetadata", {}).get("Item", [])}
    p.mpesa_receipt = meta.get("MpesaReceiptNumber")
    b = p.booking
    if p.result_code == 0: b.payment_status = "Paid"
    else:  # release held tickets
        b.payment_status = "Failed"
        for i in b.items: i.ticket_type.sold = max(i.ticket_type.sold - i.quantity, 0)
    db.session.commit()
    return jsonify(ResultCode=0, ResultDesc="Accepted")


@app.post("/api/dev/bookings/<int:bid>/simulate-paid")  # MPESA_MOCK only
@jwt_required()
def simulate_paid(bid):
    if not mpesa.MOCK: return err("Not available", 404)
    b = db.get_or_404(Booking, bid)
    p = b.payments[-1]; p.result_code, p.mpesa_receipt = 0, "MOCK" + str(random.randint(10**6, 10**7))
    b.payment_status = "Paid"; db.session.commit(); return jsonify(b.to_dict())


@app.get("/api/bookings/mine")
@jwt_required()
def my_bookings():
    rows = Booking.query.filter_by(user_id=int(get_jwt_identity())).order_by(Booking.created_at.desc()).all()
    return jsonify([b.to_dict() for b in rows])


@app.get("/api/bookings/<int:bid>")  # also used for polling payment + status
@jwt_required()
def get_booking(bid):
    b = db.get_or_404(Booking, bid)
    if b.user_id != int(get_jwt_identity()) and get_jwt().get("role") != "admin": return err("Not your booking", 403)
    return jsonify(b.to_dict())


# ---------- admin bookings ----------
@app.get("/api/admin/bookings")
@admin_required
def admin_bookings():
    q = Booking.query.join(Event).join(User, Booking.user_id == User.id)
    if s := request.args.get("status"): q = q.filter(Booking.status == s)
    if s := request.args.get("q"):
        q = q.filter(Booking.reference.ilike(f"%{s}%") | Booking.attendee_name.ilike(f"%{s}%") | Booking.phone.ilike(f"%{s}%"))
    return jsonify([b.to_dict() for b in q.order_by(Booking.created_at.desc()).limit(200)])


@app.patch("/api/admin/bookings/<int:bid>/status")
@admin_required
def set_status(bid):
    b, new = db.get_or_404(Booking, bid), (request.get_json() or {}).get("status")
    if new not in STATUSES: return err("Status must be one of: " + ", ".join(STATUSES))
    if b.payment_status != "Paid" and new != "Pending": return err("Only paid bookings can move past Pending", 409)
    if STATUSES.index(new) < STATUSES.index(b.status): return err("Status can only move forward", 409)
    b.status = new; db.session.commit(); return jsonify(b.to_dict())


@app.get("/api/admin/stats")
@admin_required
def stats():
    paid = Booking.query.filter_by(payment_status="Paid")
    return jsonify(total_bookings=Booking.query.count(),
                   pending=Booking.query.filter_by(status="Pending").count(),
                   revenue=paid.with_entities(func.coalesce(func.sum(Booking.total), 0)).scalar())


@app.cli.command("seed")
def seed():
    db.create_all()
    a = User(name="Admin", email="admin@tiko.co.ke", role="admin"); a.set_password("admin12345"); db.session.add(a)
    e = Event(title="Solstice Fest 2026", category="Music", venue="Uhuru Gardens", organizer="Solstice Collective",
              description="One city. One stage. A thousand good memories.", featured=True,
              starts_at=datetime(2026, 12, 19, 14), ends_at=datetime(2026, 12, 19, 23))
    e.tickets = [TicketType(name="General admission", price=2500, capacity=1000, description="Festival entry + all live performances"),
                 TicketType(name="VIP experience", price=5500, capacity=200, description="Priority entry + exclusive viewing area")]
    db.session.add(e); db.session.commit(); print("Seeded. Admin: admin@tiko.co.ke / admin12345")


if __name__ == "__main__":
    app.run(debug=True, port=5000)
