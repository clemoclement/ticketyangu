export const kes = (n) => `KES ${Number(n).toLocaleString("en-KE")}`;
const d = (s) => new Date(s);
export const dateShort = (s) => d(s).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
export const dateLong = (s, e) => {
  const t = (x) => d(x).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${d(s).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · ${t(s)}${e ? ` – ${t(e)}` : ""} EAT`;
};
export const STATUSES = ["Pending", "Preparing", "Ready", "Completed"];
