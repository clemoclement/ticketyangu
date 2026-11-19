import { NavLink, Outlet } from "react-router-dom"; 
import { Logo } from "../components/Layout.jsx";
const l = ({ isActive }) => `block rounded-md px-3 py-2 text-sm font-medium ${isActive ? "bg-primary-soft text-primary" : "text-muted hover:text-ink"}`;

export default function AdminLayout() {
  return (
  <div className="flex min-h-screen">
    <aside className="w-56 shrink-0 space-y-1 border-r border-line p-4">
        <div className="mb-4 px-3">
            <Logo />
            </div>
    <NavLink end to="/admin" className={l}>Overview</NavLink>
    <NavLink to="/admin/events" className={l}>Events</NavLink>
    <NavLink to="/admin/bookings" className={l}>Bookings</NavLink>
    <NavLink to="/" className={l}>View storefront</NavLink>
    </aside>
    <main className="flex-1 space-y-6 bg-gray-50 p-6">
        <Outlet />
        </main>
        </div>
        );
}
