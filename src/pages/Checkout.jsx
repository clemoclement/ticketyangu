import { useState } from "react"; 
import { Navigate, useNavigate } from "react-router-dom";
import api, { errMsg } from "../api.js"; 
import { useApp } from "../context.jsx"; 
import { Summary, ErrorNote, SERVICE_FEE } from "../components/ui.jsx";

const validPhone = (v) => /^(?:\+?254|0)?[71]\d{8}$/.test(v.replace(/\s/g, ""));

export default function Checkout() {
  const { cart, setCart, user } = useApp(); const nav = useNavigate();
  const [f, setF] = useState({ name: user.name, email: user.email, phone: "" }); 
  const [error, setError] = useState(""); 
  const [busy, setBusy] = useState(false);

  if (!cart?.lines.length) return <Navigate to="/cart" replace />;
  const lines = cart.lines.map((l) => ({ name: l.ticket.name, price: l.ticket.price, qty: l.qty }));
  const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);
  const submit = async (e) => { e.preventDefault(); setError("");
    if (!validPhone(f.phone)) return setError("Enter a valid Safaricom number, e.g. 0712 345 678");
    setBusy(true);
    try { const { data: b } = await api.post("/bookings", { event_id: cart.event.id, attendee_name: f.name, attendee_email: f.email, phone: f.phone,
        items: cart.lines.map((l) => ({ ticket_type_id: l.ticket.id, quantity: l.qty })) });
      await api.post(`/bookings/${b.id}/pay`); setCart(null); nav(`/bookings/${b.id}`);
    } catch (x) { setError(errMsg(x)); setBusy(false); } };
  const field = (k, label, type = "text", hint) => (<label className="block text-sm font-medium">{label}
    <input required type={type} className="input mt-1" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />{hint && <span className="text-xs font-normal text-muted">{hint}</span>}</label>);
  return (<form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_360px]">
    <div className="space-y-4"><h1 className="text-3xl font-bold">You're two steps away</h1>
      <div className="card space-y-4 p-5"><h2 className="text-xl font-semibold">Your details</h2>{field("name", "Full name")}{field("email", "Email", "email")}</div>
      <div className="card space-y-4 p-5"><h2 className="text-xl font-semibold">Pay with M-Pesa</h2>{field("phone", "M-Pesa phone number", "tel", "We'll send a payment prompt to this number.")}</div>
      <ErrorNote>{error}</ErrorNote></div>
    <aside className="card h-fit space-y-4 p-5"><h2 className="text-xl font-semibold">Order summary</h2><Summary lines={lines} subtotal={subtotal} fee={SERVICE_FEE} total={subtotal + SERVICE_FEE} />
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Sending prompt…" : "Pay with M-Pesa"}</button>
      </aside>
      </form>
      );
}
