"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { barberias } from "@/lib/api";

export default function Registro() {
  const router = useRouter();
  const [form, setForm] = useState({ nombreBarberia: "", adminNombre: "", adminApellido: "", adminEmail: "", adminPassword: "", telefono: "", ciudad: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const { token, usuario } = await barberias.registro(form);
      localStorage.setItem("token", token);
      localStorage.setItem("usuario", JSON.stringify(usuario));
      router.replace("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 460 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "var(--accent)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16, fontSize: 28 }}>
            ✂️
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text)" }}>BarberPro</h1>
          <p style={{ color: "var(--text2)", fontSize: 14, marginTop: 4 }}>Crea la cuenta de tu barbería</p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Registrar barbería</h2>
          <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 24 }}>Obtén tu propia página para clientes, punto de venta, comisiones y liquidaciones — sin necesidad de que nadie te dé acceso.</p>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, color: "var(--text2)", marginBottom: 6 }}>Nombre de la barbería *</label>
              <input className="input" placeholder="Barbería El Estilo" value={form.nombreBarberia} onChange={e => set("nombreBarberia", e.target.value)} required />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, color: "var(--text2)", marginBottom: 6 }}>Ciudad</label>
                <input className="input" placeholder="Managua" value={form.ciudad} onChange={e => set("ciudad", e.target.value)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, color: "var(--text2)", marginBottom: 6 }}>Teléfono</label>
                <input className="input" placeholder="+505 8888-0000" value={form.telefono} onChange={e => set("telefono", e.target.value)} />
              </div>
            </div>

            <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
            <p style={{ fontSize: 12, color: "var(--text2)", fontWeight: 600, textTransform: "uppercase", letterSpacing: .5 }}>Tu cuenta de administrador</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, color: "var(--text2)", marginBottom: 6 }}>Tu nombre *</label>
                <input className="input" value={form.adminNombre} onChange={e => set("adminNombre", e.target.value)} required />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, color: "var(--text2)", marginBottom: 6 }}>Apellido</label>
                <input className="input" value={form.adminApellido} onChange={e => set("adminApellido", e.target.value)} />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: "var(--text2)", marginBottom: 6 }}>Correo electrónico *</label>
              <input className="input" type="email" placeholder="tu@correo.com" value={form.adminEmail} onChange={e => set("adminEmail", e.target.value)} required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: "var(--text2)", marginBottom: 6 }}>Contraseña *</label>
              <input className="input" type="password" placeholder="Mínimo 8 caracteres" value={form.adminPassword} onChange={e => set("adminPassword", e.target.value)} required minLength={8} />
            </div>

            {error && <p style={{ color: "var(--red)", fontSize: 13, background: "rgba(239,68,68,.1)", padding: "10px 14px", borderRadius: 8 }}>{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8, width: "100%", padding: "12px" }}>
              {loading ? "Creando cuenta..." : "Crear mi barbería"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", color: "var(--text2)", fontSize: 13, marginTop: 20 }}>
          ¿Ya tienes cuenta? <Link href="/login" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
