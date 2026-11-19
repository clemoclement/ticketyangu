import { createContext, useContext, useState, useEffect } from "react";
const Ctx = createContext();
export const useApp = () => useContext(Ctx);
const load = (k, f) => { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } };
export function AppProvider({ children }) {
  const [user, setUser] = useState(() => load("user", null));
  const [cart, setCart] = useState(() => load("cart", null)); // { event, lines: [{ticket, qty}] } one event per cart
  useEffect(() => localStorage.setItem("cart", JSON.stringify(cart)), [cart]);
  const signIn = (token, u) => { localStorage.setItem("token", token); localStorage.setItem("user", JSON.stringify(u)); setUser(u); };
  const signOut = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); setUser(null); setCart(null); };
  return <Ctx.Provider value={{ user, signIn, signOut, cart, setCart }}>{children}</Ctx.Provider>;
}
