import { useEffect, useState } from "react"; 
import api from "../api.js"; 
import EventCard from "../components/EventCard.jsx"; 
import { Skeleton, Empty, ErrorNote } from "../components/ui.jsx";

const CATS = ["All", "Music", "Food & drink", "Arts & culture", "Outdoors"];
export default function Discover() {
  const [q, setQ] = useState(""); 
  const [cat, setCat] = useState("All"); 
  const [events, setEvents] = useState(null); 
  const [error, setError] = useState("");
  
  useEffect(() => { const t = setTimeout(() => {
    setEvents(null); api.get("/events", { params: { q: q || undefined, category: cat === "All" ? undefined : cat } }).then((r) => setEvents(r.data)).catch(() => setError("Could not load events. Refresh to try again.")); 
}, 250); 
return () => clearTimeout(t); }, [q, cat]);
  return (
  <div className="space-y-6">
    <section className="rounded-xl bg-primary p-8 text-white">
        <h1 className="max-w-md text-5xl font-bold">Make room for unforgettable.</h1>
      <p className="mt-3 max-w-md text-base">Live music, food and a little adventure. Find your next good time, right here.</p>
      <input className="input mt-6 max-w-md text-ink" placeholder="Search events, artists or venues" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search events" />
      </section>

    <div className="flex flex-wrap gap-2">{CATS.map((c) => <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c} className={`min-h-[44px] rounded-full px-4 text-sm font-medium ${cat === c ? "bg-primary text-white" : "border border-line text-muted hover:text-ink"}`}>{c}</button>
)}
</div>

    <ErrorNote>{error}</ErrorNote>
    {!events && !error && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-72" />)}</div>}
    {events?.length === 0 && <Empty title="No events found" body="Try a different search or category." />}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{events?.map((e) => <EventCard key={e.id} e={e} />)}</div>
    </div>
    );
}
