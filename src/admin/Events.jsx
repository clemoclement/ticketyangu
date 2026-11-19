import { useEffect, useState } from "react"; 
import api, { errMsg } from "../api.js"; 
import { Skeleton, Empty, ErrorNote } from "../components/ui.jsx"; 
import { dateShort, kes } from "../format.js";

const blank = { title: "", category: "Music", venue: "", city: "Nairobi", description: "", image_url: "", organizer: "", starts_at: "", ends_at: "", featured: true, tickets: [{ name: "General admission", price: 1000, capacity: 100, max_per_order: 10 }] };

export default function Events() {
  const [rows, setRows] = useState(null); 
  const [form, setForm] = useState(null); 
  const [error, setError] = useState("");
  const load = () => api.get("/events")
  .then((r) => setRows(r.data)); 
  useEffect(() => { load(); }, []);
  const edit = async (e) => setForm({ ...(await api.get(`/events/${e.id}`)).data, starts_at: e.starts_at.slice(0, 16), ends_at: (e.ends_at || "").slice(0, 16) });
  const save = async (ev) => { ev.preventDefault(); setError(""); try { form.id ? await api.put(`/admin/events/${form.id}`, form) : await api.post("/admin/events", form); 
  setForm(null); 
  load(); 
} catch (x) { setError(errMsg(x)); } };
  const del = async (e) => { if (!confirm(`Delete "${e.title}"? This can't be undone.`)) return; 
  try { await api.delete(`/admin/events/${e.id}`); load(); 
} catch (x) { setError(errMsg(x)); 

} 
};

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const setT = (i, k) => (e) => setForm({ ...form, tickets: form.tickets.map((t, j) => (j === i ? { ...t, [k]: ["price", "capacity", "max_per_order"].includes(k) ? +e.target.value : e.target.value } : t)) });
  if (form) return (

  <form onSubmit={save} className="card max-w-2xl space-y-3 p-6">
    <h1 className="text-3xl font-bold">{form.id ? "Edit event" : "Create event"}</h1>
    {[["title", "Title"], ["category", "Category"], ["venue", "Venue"], ["organizer", "Organizer"], ["image_url", "Image URL"]].map(([k, l]) => 
    <label key={k} className="block text-sm font-medium">{l}<input required={k !== "image_url" && k !== "organizer"} className="input mt-1" value={form[k] || ""} onChange={set(k)} /></label>)}
    <label className="block text-sm font-medium">Description<textarea className="input mt-1 py-2" rows={3} value={form.description || ""} onChange={set("description")} /></label>
    <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Starts<input required type="datetime-local" className="input mt-1" value={form.starts_at} onChange={set("starts_at")} /></label>
        <label className="text-sm font-medium">Ends<input type="datetime-local" className="input mt-1" value={form.ends_at} onChange={set("ends_at")} /></label>
        </div>
    <h2 className="pt-2 text-xl font-semibold">Ticket types</h2>
    {form.tickets.map((t, i) => 
    <div key={i} className="grid gap-2 sm:grid-cols-4">
        <input required placeholder="Name" className="input" value={t.name} onChange={setT(i, "name")} />
        <input required type="number" min="0" placeholder="Price (KES)" className="input" value={t.price} onChange={setT(i, "price")} />
        <input required type="number" min="1" placeholder="Capacity" className="input" value={t.capacity} onChange={setT(i, "capacity")} />
        <input type="number" min="1" placeholder="Max per order" className="input" value={t.max_per_order} onChange={setT(i, "max_per_order")} />
        </div>)}
    <button type="button" className="btn-ghost" onClick={() => setForm({ ...form, tickets: [...form.tickets, { name: "", price: 0, capacity: 50, max_per_order: 10 }] })}>Add ticket type</button>
    <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={form.featured} onChange={set("featured")} />Featured event</label><ErrorNote>{error}</ErrorNote>
    <div className="flex gap-2">
        <button type="button" className="btn-secondary" onClick={() => setForm(null)}>Cancel</button>
        <button className="btn-primary">Save event</button>
        </div>
        </form>

        );

  return (
    
  <>

  <div className="flex items-center justify-between">
    <h1 className="text-3xl font-bold">Events</h1>
    <button className="btn-primary" onClick={() => 
        setForm(blank)}>Create event</button>
        </div>
        <ErrorNote>{error}</ErrorNote>
    {!rows && <Skeleton className="h-48" />}{rows?.length === 0 && <Empty title="No events yet" body="Create your first event to start selling tickets." />}
    {rows?.map((e) => 
    <div key={e.id} 
    className="card flex items-center justify-between p-4">
        <div>
            <p className="font-semibold">{e.title}</p>
            <p className="text-sm text-muted">{dateShort(e.starts_at)} · {e.venue} · from {kes(e.from_price)}</p>
            </div>

      <div className="flex gap-2">
        <button className="btn-secondary" onClick={() => edit(e)}>Edit</button><button className="btn-secondary text-danger" onClick={() => del(e)}>Delete</button>
        </div>
        </div>
        )}

        </>

        );
}
