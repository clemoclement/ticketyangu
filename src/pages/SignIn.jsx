import { useState } from "react"; 
import { useNavigate, useLocation } from "react-router-dom"; 
import api, { errMsg } from "../api.js"; 
import { useApp } from "../context.jsx"; 
import { ErrorNote } from "../components/ui.jsx";

export default function SignIn() {
  const { signIn } = useApp(); 
  const nav = useNavigate(); 
  const { state } = useLocation();
  const [mode, setMode] = useState("login"); 
  const [f, setF] = useState({ name: "", email: "", password: "" }); 
  const [error, setError] = useState("");
  const submit = async (e) => { e.preventDefault(); setError("");
    try { const { data } = await api.post(mode === "login" ? "/auth/login" : "/auth/register", f); 
    signIn(data.token, data.user); 
    nav(state?.from || (data.user.role === "admin" ? "/admin" : "/")); 
} catch (x) { setError(errMsg(x)); 

} };
  const inp = (k, label, type = "text") => <label className="block text-sm font-medium">{label}<input required type={type} className="input mt-1" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></label>;
  return (
  <form onSubmit={submit} className="card mx-auto max-w-sm space-y-4 p-6">
    <h1 className="text-3xl font-bold">{mode === "login" ? "Sign in" : "Create account"}</h1>
    {mode === "register" && inp("name", "Full name")}{inp("email", "Email", "email")}{inp("password", "Password", "password")}<ErrorNote>{error}</ErrorNote>
    <button className="btn-primary w-full">{mode === "login" ? "Sign in" : "Create account"}</button>
    <button type="button" className="btn-ghost w-full" onClick={() => setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "New to ticketyangu? Create an account" : "Have an account? Sign in"}</button>
    </form>
    );
}
