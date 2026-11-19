import { useEffect, useState } from "react"; 
import api, { errMsg } from "../api.js"; 
import { StatusBadge, Skeleton, Empty, ErrorNote } from "../components/ui.jsx"; 
import { STATUSES, kes } from "../format.js";

export default function Bookings() {
  const [rows, setRows] = useState(null); 
  const [status, setStatus] = useState(""); 
  const [q, setQ] = useState(""); 
  const [error, setError] = useState("");
  const load = () => { 
    setRows(null); 
    api.get("/admin/bookings", { params: { status: status || undefined, q: q || undefined } })
    .then((r) => setRows(r.data)); 
};
  useEffect(() => { 
    const t = setTimeout(load, 250); return () => clearTimeout(t); 
}, [status, q]);
  const update = async (b, s) => { setError(""); 
    try { const { data } = await api.patch(`/admin/bookings/${b.id}/status`, { status: s }); 
    setRows(rows.map((r) => (r.id === b.id ? data : r))); 
} catch (x) { setError(errMsg(x)); } };

  return (
  <>
  <h1 className="text-3xl font-bold">Bookings</h1>
    <div className="flex flex-wrap gap-2">
        <input className="input max-w-xs" placeholder="Search name, phone or booking ID" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search bookings" />
      <select className="input max-w-[180px]" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
        <option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
      </select>
      </div>
    <ErrorNote>{error}</ErrorNote>{!rows && <Skeleton className="h-64" />}{rows?.length === 0 && <Empty title="No bookings match" body="Change the search or status filter." />}
    {rows?.length > 0 && <div className="card overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-line text-xs text-muted"><tr>{["Booking", "Customer", "Event", "Amount", "Payment", "Status", "Update"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
      <tbody>{rows.map((b) => 
        <tr key={b.id} className="border-b border-line last:border-0">
            <td className="px-4 py-3 font-medium text-primary">#{b.reference}</td>
            <td className="px-4 py-3">{b.attendee_name}<br /><span className="text-xs text-muted">{b.phone}</span></td>
        <td className="px-4 py-3">{b.event.title}</td>
        <td className="px-4 py-3">{kes(b.total)}</td>
        <td className="px-4 py-3">{b.payment_status}</td>
        <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
        <td className="px-4 py-3">
            <select className="input !min-h-[36px] w-32" value={b.status} aria-label={`Update status for ${b.reference}`} onChange={(e) => update(b, e.target.value)}>{STATUSES.map((s) => 
                <option key={s}>{s}</option>
            )}
    </select>
    </td>
    </tr>
    )}
    </tbody>
    </table>
    </div>
    }
    </>);
}
