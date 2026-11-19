from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()
STATUSES = ["Pending", "Preparing", "Ready", "Completed"]  # MVP flow, forward-only


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(160), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(10), nullable=False, default="client")  # client | admin

    def set_password(self, pw): self.password_hash = generate_password_hash(pw)
    def check_password(self, pw): return check_password_hash(self.password_hash, pw)
    def to_dict(self): return {"id": self.id, "name": self.name, "email": self.email, "role": self.role}


class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(160), nullable=False)
    category = db.Column(db.String(40), nullable=False)
    description = db.Column(db.Text, default="")
    venue = db.Column(db.String(160), nullable=False)
    city = db.Column(db.String(80), default="Nairobi")
    image_url = db.Column(db.String(500))
    organizer = db.Column(db.String(120))
    starts_at = db.Column(db.DateTime, nullable=False)
    ends_at = db.Column(db.DateTime)
    featured = db.Column(db.Boolean, default=False)
    tickets = db.relationship("TicketType", backref="event", cascade="all, delete-orphan")

    def to_dict(self, with_tickets=True):
        d = {"id": self.id, "title": self.title, "category": self.category,
             "description": self.description, "venue": self.venue, "city": self.city,
             "image_url": self.image_url, "organizer": self.organizer, "featured": self.featured,
             "starts_at": self.starts_at.isoformat(),
             "ends_at": self.ends_at.isoformat() if self.ends_at else None,
             "from_price": min((t.price for t in self.tickets), default=0)}
        if with_tickets: d["tickets"] = [t.to_dict() for t in self.tickets]
        return d


class TicketType(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey("event.id"), nullable=False)
    name = db.Column(db.String(80), nullable=False)
    description = db.Column(db.String(200))
    price = db.Column(db.Integer, nullable=False)  # KES, whole shillings
    capacity = db.Column(db.Integer, nullable=False)
    sold = db.Column(db.Integer, default=0)
    max_per_order = db.Column(db.Integer, default=10)

    @property
    def remaining(self): return max(self.capacity - self.sold, 0)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "description": self.description,
                "price": self.price, "capacity": self.capacity, "remaining": self.remaining,
                "max_per_order": self.max_per_order}


class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    reference = db.Column(db.String(24), unique=True, nullable=False)  # TK-261219-0842
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey("event.id"), nullable=False)
    attendee_name = db.Column(db.String(120), nullable=False)
    attendee_email = db.Column(db.String(160), nullable=False)
    phone = db.Column(db.String(16), nullable=False)  # +2547XXXXXXXX
    subtotal = db.Column(db.Integer, nullable=False)
    service_fee = db.Column(db.Integer, nullable=False)
    total = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(12), nullable=False, default="Pending", index=True)
    payment_status = db.Column(db.String(12), nullable=False, default="Unpaid")  # Unpaid|Waiting|Paid|Failed|TimedOut
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    event = db.relationship("Event")
    user = db.relationship("User")
    items = db.relationship("BookingItem", backref="booking", cascade="all, delete-orphan")
    payments = db.relationship("Payment", backref="booking", cascade="all, delete-orphan")

    def to_dict(self):
        paid = next((p for p in self.payments if p.result_code == 0), None)
        return {"id": self.id, "reference": self.reference, "status": self.status,
                "payment_status": self.payment_status, "attendee_name": self.attendee_name,
                "attendee_email": self.attendee_email, "phone": self.phone,
                "subtotal": self.subtotal, "service_fee": self.service_fee, "total": self.total,
                "created_at": self.created_at.isoformat(), "event": self.event.to_dict(False),
                "items": [i.to_dict() for i in self.items],
                "mpesa_receipt": paid.mpesa_receipt if paid else None}


class BookingItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey("booking.id"), nullable=False)
    ticket_type_id = db.Column(db.Integer, db.ForeignKey("ticket_type.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Integer, nullable=False)  # snapshot at purchase
    ticket_type = db.relationship("TicketType")

    def to_dict(self):
        return {"ticket_type": self.ticket_type.name, "quantity": self.quantity,
                "unit_price": self.unit_price}


class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey("booking.id"), nullable=False)
    checkout_request_id = db.Column(db.String(80), unique=True, index=True)
    amount = db.Column(db.Integer, nullable=False)
    result_code = db.Column(db.Integer)  # 0 = success, 1032 = cancelled, 1 = insufficient, 2001 = wrong PIN
    result_desc = db.Column(db.String(255))
    mpesa_receipt = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
