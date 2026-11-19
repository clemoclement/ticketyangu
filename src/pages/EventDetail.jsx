import { useEffect, useState } from "react"; 
import { useParams, useNavigate } from "react-router-dom";
import api from "../api.js"; 
import { useApp } from "../context.jsx"; 
import { dateLong, kes } from "../format.js"; 
import { Skeleton, ErrorNote } from "../components/ui.jsx";

export default function EventDetail() {
  const { id } = useParams(); 
  const nav = useNavigate(); 
  const { setCart } = useApp();
  const [ev, setEv] = useState(null); 
  const [qty, setQty] = useState({}); 
  const [error, setError] = useState("");
  
  useEffect(() => { api.get(`/events/${id}`).then((r) => setEv(r.data)).catch(() => setError("We couldn't find that event.")); }, [id]);
  if (error) return <ErrorNote>{error}</ErrorNote>; if (!ev) return <Skeleton className="h-96" />;
  const lines = ev.tickets.filter((t) => qty[t.id] > 0).map((t) => ({ ticket: t, qty: qty[t.id] }));
  const total = lines.reduce((n, l) => n + l.ticket.price * l.qty, 0);
  const set = (t, v) => setQty({ ...qty, [t.id]: Math.max(0, Math.min(v, t.max_per_order, t.remaining)) });
  return (
  <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
    <div>
        <div className="h-72 overflow-hidden rounded-xl bg-primary-soft">{ev.image_url && <img src={ev.image_url} alt="" className="h-full w-full object-cover" />}</div>
      <p className="mt-6 text-sm text-muted">{ev.category}</p><h1 className="text-5xl font-bold">{ev.title}</h1>
      <p className="mt-2 text-base">{dateLong(ev.starts_at, ev.ends_at)}</p><p className="text-base text-muted">{ev.venue}, {ev.city}</p>
      <p className="mt-6 max-w-prose text-base">{ev.description}</p>{ev.organizer && <p className="mt-6 text-sm text-muted">Organised by {ev.organizer}</p>}
      </div>
    <aside className="card h-fit space-y-4 p-5"><h2 className="text-xl font-semibold">Choose your tickets</h2>
      {ev.tickets.map((t) => (<div key={t.id} className="flex items-center justify-between gap-3 rounded-md border border-line p-3">
        <div>
            <p className="font-semibold">{t.name}</p>
            <p className="text-xs text-muted">{t.description}</p>
            <p className="mt-1 text-sm font-semibold">{kes(t.price)}</p>
          {t.remaining === 0 ? <p className="text-xs font-semibold text-danger">Sold out</p> : t.remaining <= 20 && <p className="text-xs text-warning">{t.remaining} left</p>}
          </div>
        <div className="flex items-center gap-2"><button aria-label={`Remove one ${t.name}`} className="btn-secondary !min-w-[44px] !px-0" onClick={() => set(t, (qty[t.id] || 0) - 1)}>−</button>
          <span className="w-6 text-center text-sm" aria-live="polite">{qty[t.id] || 0}</span>
          <button aria-label={`Add one ${t.name}`} disabled={t.remaining === 0} className="btn-secondary !min-w-[44px] !px-0" onClick={() => set(t, (qty[t.id] || 0) + 1)}>+</button></div></div>))}
      <button className="btn-primary w-full" disabled={!lines.length} onClick={() => { setCart({ event: { id: ev.id, title: ev.title, starts_at: ev.starts_at, venue: ev.venue }, lines }); nav("/cart"); }}>
        {lines.length ? `Add to cart · ${kes(total)}` : "Select a ticket"}</button>
        </aside>
        </div>
        );
}
