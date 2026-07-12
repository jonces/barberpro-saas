"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/api";

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const { token, usuario } = await auth.login(form);
      localStorage.setItem("token", token);
      localStorage.setItem("usuario", JSON.stringify(usuario));
      router.replace("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "var(--accent)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16, fontSize: 28 }}>
            ✂️
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text)" }}>BarberPro</h1>
          <p style={{ color: "var(--text2)", fontSize: 14, marginTop: 4 }}>Sistema Profesional para Barberías</p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>Iniciar sesión</h2>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, color: "var(--text2)", marginBottom: 6 }}>Correo electrónico</label>
              <input className="input" type="email" placeholder="tu@correo.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: "var(--text2)", marginBottom: 6 }}>Contraseña</label>
              <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            {error && <p style={{ color: "var(--red)", fontSize: 13, background: "rgba(239,68,68,.1)", padding: "10px 14px", borderRadius: 8 }}>{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8, width: "100%", padding: "12px" }}>
              {loading ? "Iniciando..." : "Entrar"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", color: "var(--text2)", fontSize: 12, marginTop: 24 }}>
          BarberPro © 2025 — Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}
