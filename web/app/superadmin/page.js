"use client";
import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { barberias, dashboard as dashApi } from "@/lib/api";

const PLAN_COLOR = { BASICO: "badge-gray", PROFESIONAL: "badge-blue", ENTERPRISE: "badge-yellow" };
const ESTADO_COLOR = { ACTIVA: "badge-green", SUSPENDIDA: "badge-red", INACTIVA: "badge-gray" };

function ModalBarberia({ onClose, onSave }) {
  const [form, setForm] = useState({ nombre: "", slug: "", email: "", telefono: "", ciudad: "", plan: "BASICO", adminNombre: "", adminEmail: "", adminPassword: "" });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true);
    try { const b = await barberias.create(form); onSave(b); }
    catch (err) { alert(err.message); } finally { setLoading(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div className="card" style={{ width: "100%", maxWidth: 560, padding: 28, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Nueva Barbería</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text2)", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, textTransform: "uppercase" }}>Datos de la barbería</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Nombre *</label><input className="input" required value={form.nombre} onChange={e => { set("nombre", e.target.value); set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")); }} /></div>
            <div><label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Slug (URL) *</label><input className="input" required value={form.slug} onChange={e => set("slug", e.target.value)} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Email</label><input className="input" type="email" value={form.email} onChange={e => set("email", e.target.value)} /></div>
            <div><label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Teléfono</label><input className="input" value={form.telefono} onChange={e => set("telefono", e.target.value)} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Ciudad</label><input className="input" value={form.ciudad} onChange={e => set("ciudad", e.target.value)} /></div>
            <div>
              <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Plan</label>
              <select className="input" value={form.plan} onChange={e => set("plan", e.target.value)}>
                <option value="BASICO">Básico</option>
                <option value="PROFESIONAL">Profesional</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
          </div>
          <p style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, textTransform: "uppercase", marginTop: 8 }}>Administrador</p>
          <div><label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Nombre del admin *</label><input className="input" required value={form.adminNombre} onChange={e => set("adminNombre", e.target.value)} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Email admin *</label><input className="input" type="email" required value={form.adminEmail} onChange={e => set("adminEmail", e.target.value)} /></div>
            <div><label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Contraseña *</label><input className="input" type="password" required value={form.adminPassword} onChange={e => set("adminPassword", e.target.value)} /></div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2 }}>{loading ? "Creando..." : "Crear Barbería"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Superadmin() {
  const [data, setData] = useState(null);
  const [lista, setLista] = useState([]);
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(true);

  async function cargar() {
    setLoading(true);
    Promise.all([dashApi.superadmin(), barberias.list()])
      .then(([d, b]) => { setData(d); setLista(b); })
      .finally(() => setLoading(false));
  }
  useEffect(() => { cargar(); }, []);

  async function toggleEstado(b) {
    const nuevoEstado = b.estado === "ACTIVA" ? "SUSPENDIDA" : "ACTIVA";
    await barberias.setEstado(b.id, nuevoEstado);
    setLista(prev => prev.map(x => x.id === b.id ? { ...x, estado: nuevoEstado } : x));
  }

  return (
    <AppLayout title="Super Admin — Panel Global" actions={
      <button className="btn btn-primary" onClick={() => setModal(true)}>+ Nueva Barbería</button>
    }>
      {modal && <ModalBarberia onClose={() => setModal(false)} onSave={(b) => { setLista(p => [b, ...p]); setModal(false); }} />}

      {/* Stats globales */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Total barberías", value: data?.totalBarberias || 0, icon: "✂️", color: "var(--accent)" },
          { label: "Activas", value: data?.activas || 0, icon: "✅", color: "var(--green)" },
          { label: "Suspendidas", value: data?.suspendidas || 0, icon: "⛔", color: "var(--red)" },
          { label: "Total usuarios", value: data?.totalUsuarios || 0, icon: "👥", color: "var(--blue)" },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 20 }}>
            <span style={{ fontSize: 24 }}>{s.icon}</span>
            <p style={{ fontSize: 28, fontWeight: 700, color: s.color, marginTop: 8 }}>{s.value}</p>
            <p style={{ fontSize: 12, color: "var(--text2)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabla de barberías */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600 }}>Todas las barberías ({lista.length})</h3>
        </div>
        <table>
          <thead><tr><th>Barbería</th><th>Ciudad</th><th>Plan</th><th>Usuarios</th><th>Clientes</th><th>Ventas</th><th>Estado</th><th>Registrada</th><th></th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={9} style={{ textAlign: "center", color: "var(--text2)", padding: 40 }}>Cargando...</td></tr>}
            {lista.map(b => (
              <tr key={b.id}>
                <td>
                  <p style={{ fontWeight: 700 }}>{b.nombre}</p>
                  <p style={{ fontSize: 12, color: "var(--text2)" }}>/{b.slug}</p>
                </td>
                <td style={{ color: "var(--text2)" }}>{b.ciudad || "—"}</td>
                <td><span className={`badge ${PLAN_COLOR[b.plan] || "badge-gray"}`}>{b.plan}</span></td>
                <td style={{ fontWeight: 600 }}>{b._count?.usuarios || 0}</td>
                <td style={{ fontWeight: 600 }}>{b._count?.clientes || 0}</td>
                <td style={{ fontWeight: 600 }}>{b._count?.ventas || 0}</td>
                <td><span className={`badge ${ESTADO_COLOR[b.estado] || "badge-gray"}`}>{b.estado}</span></td>
                <td style={{ fontSize: 12, color: "var(--text2)" }}>{new Date(b.creadoEn).toLocaleDateString("es-NI")}</td>
                <td>
                  <button onClick={() => toggleEstado(b)} style={{ padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500, background: b.estado === "ACTIVA" ? "rgba(239,68,68,.1)" : "rgba(34,197,94,.1)", color: b.estado === "ACTIVA" ? "var(--red)" : "var(--green)" }}>
                    {b.estado === "ACTIVA" ? "Suspender" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
