import { useEffect, useState } from "react"; 
import { Link } from "react-router-dom"; 
import api from "../api.js";
import { StatusBadge, Skeleton, Empty } from "../components/ui.jsx"; 
import { kes, dateShort } from "../format.js";

export default function MyBookings() {
  const [rows, setRows] = useState(null); 
  useEffect(() => { api.get("/bookings/mine").then((r) => setRows(r.data)); }, []);
  return (
  <div className="mx-auto max-w-2xl space-y-4"><h1 className="text-3xl font-bold">My bookings</h1>
    {!rows && [1, 2].map((i) => <Skeleton key={i} />)}
    {rows?.length === 0 && <Empty title="No bookings yet" body="When you book an event, it shows up here."><Link to="/" className="btn-primary">Explore events</Link></Empty>}
    {rows?.map((b) => 
    <Link key={b.id} to={`/bookings/${b.id}`} className="card flex items-center justify-between p-4 hover:border-primary">
      <div>
        <p className="font-semibold">{b.event.title}</p>
        <p className="text-sm text-muted">#{b.reference} · {dateShort(b.event.starts_at)} · {kes(b.total)}</p>
        </div>
        <StatusBadge status={b.status} />
        </Link>
        )}
        </div>
      );
}
