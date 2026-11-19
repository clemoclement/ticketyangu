import { STATUSES } from "../format.js";

const tone = { Pending: "bg-warning-soft text-warning", Preparing: "bg-primary-soft text-primary-dark", Ready: "bg-success-soft text-success", Completed: "bg-gray-100 text-ink" };
export const StatusBadge = ({ status }) => <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tone[status]}`}>{status}</span>;
export function StatusTracker({ status }) {
  const at = STATUSES.indexOf(status);
  const note = ["Booking received", "Creating your tickets", "Tickets are ready", "Checked in at the event"];
  
  return (
  <ol className="grid grid-cols-4 gap-2">{STATUSES.map((s, i) => (
    <li key={s} className="text-center" aria-current={i === at ? "step" : undefined}>
      <div className={`mx-auto grid h-9 w-9 place-items-center rounded-full text-sm font-semibold ${i <= at ? "bg-primary text-white" : "bg-gray-100 text-muted"}`}>{i < at ? "✓" : i + 1}</div>
      <p className="mt-2 text-sm font-semibold">{s}</p>
      <p className="text-xs text-muted">{note[i]}</p>
      </li>
      ))}
      </ol>
      );
}
export const Skeleton = ({ className = "h-24" }) => <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />;
export const Empty = ({ title, body, children }) => <div className="card p-10 text-center"><h2 className="text-xl font-semibold">{title}</h2><p className="mx-auto mt-1 max-w-sm text-sm text-muted">{body}</p><div className="mt-4">{children}</div></div>;
export const ErrorNote = ({ children }) => children ? <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{children}</p> : null;
export const Summary = ({ lines, subtotal, fee, total }) => (
  <div className="space-y-2 text-sm">{lines.map((l) => <div key={l.name} className="flex justify-between"><span>{l.name} × {l.qty}</span><span>{kes(l.price * l.qty)}</span></div>)}
    <div className="flex justify-between text-muted"><span>Service fee</span><span>{kes(fee)}</span></div>
    <div className="flex justify-between border-t border-line pt-2 text-base font-semibold"><span>Total</span><span>{kes(total)}</span></div></div>);
import { kes } from "../format.js";

export const SERVICE_FEE = 200; // keep in sync with backend SERVICE_FEE
