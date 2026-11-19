import { Link, NavLink, useNavigate } from "react-router-dom";
import { useApp } from "../context.jsx";

export const Logo = () => 

<Link to="/" className="flex items-center gap-2 text-xl font-bold">
<span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-xs text-white">▣</span>ticketyangu</Link>;
const nav = ({ isActive }) => `rounded-md px-3 py-2 text-sm font-medium ${isActive ? "text-primary" : "text-muted hover:text-ink"}`;
export function Header() {
  const { user, signOut, cart } = useApp(); const go = useNavigate();
  const count = cart?.lines.reduce((n, l) => n + l.qty, 0) || 0;
  return (
    <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
      <div className="flex items-center gap-6">
        <Logo />

        <nav className="hidden gap-1 sm:flex">
            <NavLink end to="/" className={nav}>Discover</NavLink>
            <NavLink to="/bookings" className={nav}>My bookings</NavLink>
            </nav>
            </div>

      <div className="flex items-center gap-2">
        <Link to="/cart" className="btn-secondary relative" aria-label={`Cart, ${count} tickets`}>Cart{count > 0 && <span className="ml-2 rounded-full bg-primary px-2 text-xs text-white">{count}</span>}</Link>
        {user?.role === "admin" && <Link to="/admin" className="btn-ghost">Admin</Link>}
        {user ? <button className="btn-secondary" onClick={() => { signOut(); go("/"); }}>Sign out</button> : <Link to="/sign-in" className="btn-primary">Sign in</Link>}
      </div>
      </div>
      </header>);
}
export const Footer = () => (
  <footer className="border-t border-line">
    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-muted">
    <span><b className="text-ink">ticketyangu</b> Now in for the good times.</span><span>Help center · Terms · © 2026 ticketyangu</span></div></footer>);
