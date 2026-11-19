import { Link, useNavigate } from "react-router-dom"; 
import { useApp } from "../context.jsx"; 
import { Empty, Summary, SERVICE_FEE } from "../components/ui.jsx"; 
import { dateShort } from "../format.js";

export default function Cart() {
  const { cart, setCart } = useApp(); 
  const nav = useNavigate();

  if (!cart?.lines.length) return 
  <Empty title="Your cart is empty" body="Pick an event and choose your tickets.">
    <Link to="/" className="btn-primary">Explore events</Link>
    </Empty>;

  const lines = cart.lines.map((l) => ({ name: l.ticket.name, price: l.ticket.price, qty: l.qty }));
  const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);
  return (
  <div className="mx-auto max-w-xl space-y-4">
    <h1 className="text-3xl font-bold">Your cart</h1>

    <div className="card space-y-4 p-5">
        <div>
            <p className="font-semibold">{cart.event.title}</p>
            <p className="text-sm text-muted">{dateShort(cart.event.starts_at)} · {cart.event.venue}</p>
            </div>

      <Summary lines={lines} subtotal={subtotal} fee={SERVICE_FEE} total={subtotal + SERVICE_FEE} />
      </div>

    <div className="flex gap-2">
        <button className="btn-secondary" onClick={() => setCart(null)}>Clear cart</button>
        <button className="btn-primary flex-1" onClick={() => nav("/checkout")}>Proceed to checkout</button>
        </div>
        </div>
        );
}
