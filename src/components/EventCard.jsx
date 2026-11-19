import { useEffect, useState } from "react"; 
import api from "../api.js"; 
import { kes } from "../format.js";

export default function Overview() {

  const [s, setS] = useState(null); 
  useEffect(() => { api.get("/admin/stats").then((r) => setS(r.data)); }, []);
  const tiles = s ? [["Total bookings", s.total_bookings], ["Pending", s.pending], ["Revenue (paid)", kes(s.revenue)]] : [];
  
  return (
  
  <>
  
  <div>
    <h1 className="text-3xl font-bold">Sales &amp; bookings</h1>
    <p className="text-sm text-muted">Your events, ticket sales and bookings in one place.</p>
    </div>

    <div className="grid gap-4 sm:grid-cols-3">{tiles.map(([k, v]) => <div key={k} className="card p-5">
        <p className="text-sm text-muted">{k}</p>
        <p className="mt-1 text-3xl font-bold">{v}</p>
        </div>
        
        )}
        </div>
        
        </>
        );
}
