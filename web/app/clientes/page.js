"use client";
import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { clientes as clienteApi } from "@/lib/api";

const fmt = (n) => new Intl.NumberFormat("es-NI").format(Number(n) || 0);

function Modal({ cliente, onClose, onSave }) {
  const [form, setForm] = useState(cliente || { nombre: "", apellido: "", telefono: "", email: "", notas: "" });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true);
    try {
      const result = cliente?.id ? await clienteApi.update(cliente.id, form) : await clienteApi.create(form);
      onSave(result);
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div className="card" style={{ width: "100%", maxWidth: 480, padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{cliente?.id ? "Editar Cliente" : "Nuevo Cliente"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text2)", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Nombre *</label><input className="input" required value={form.nombre} onChange={e => set("nombre", e.target.value)} /></div>
            <div><label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Apellido</label><input className="input" value={form.apellido || ""} onChange={e => set("apellido", e.target.value)} /></div>
          </div>
          <div><label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Teléfono</label><input className="input" value={form.telefono || ""} onChange={e => set("telefono", e.target.value)} /></div>
          <div><label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Email</label><input className="input" type="email" value={form.email || ""} onChange={e => set("email", e.target.value)} /></div>
          <div><label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Notas</label><textarea className="input" rows={2} value={form.notas || ""} onChange={e => set("notas", e.target.value)} style={{ resize: "none" }} /></div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2 }}>{loading ? "Guardando..." : "Guardar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [busq, setBusq] = useState("");
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);

  async function cargar(q = "") { setLoading(true); clienteApi.list(q).then(setClientes).finally(() => setLoading(false)); }
  useEffect(() => { cargar(); }, []);
  useEffect(() => { const t = setTimeout(() => cargar(busq), 350); return () => clearTimeout(t); }, [busq]);

  function handleSave(c) {
    setClientes(prev => prev.find(x => x.id === c.id) ? prev.map(x => x.id === c.id ? c : x) : [c, ...prev]);
    setModal(null);
  }

  return (
    <AppLayout title="Clientes" actions={
      <button className="btn btn-primary" onClick={() => setModal({})}>+ Nuevo Cliente</button>
    }>
      {modal !== null && <Modal cliente={modal} onClose={() => setModal(null)} onSave={handleSave} />}

      {/* Stats rápidas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total clientes", value: clientes.length, icon: "👤" },
          { label: "Visitas totales", value: clientes.reduce((s, c) => s + c.totalVisitas, 0), icon: "✂️" },
          { label: "Ingresos generados", value: `C$ ${fmt(clientes.reduce((s, c) => s + Number(c.totalGastado || 0), 0))}`, icon: "💰" },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 28 }}>{s.icon}</span>
            <div><p style={{ fontSize: 20, fontWeight: 700 }}>{s.value}</p><p style={{ fontSize: 12, color: "var(--text2)" }}>{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* Búsqueda */}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <input className="input" placeholder="🔍 Buscar por nombre, teléfono o email..." value={busq} onChange={e => setBusq(e.target.value)} />
      </div>

      {/* Tabla */}
      <div className="card" style={{ overflow: "hidden" }}>
        <table>
          <thead><tr><th>Cliente</th><th>Teléfono</th><th>Visitas</th><th>Total gastado</th><th>Última visita</th><th></th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text2)", padding: 40 }}>Cargando...</td></tr>}
            {!loading && clientes.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text2)", padding: 40 }}>Sin clientes registrados</td></tr>}
            {clientes.map(c => (
              <tr key={c.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{c.nombre[0]}</div>
                    <div><p style={{ fontWeight: 600 }}>{c.nombre} {c.apellido || ""}</p>{c.email && <p style={{ fontSize: 12, color: "var(--text2)" }}>{c.email}</p>}</div>
                  </div>
                </td>
                <td style={{ color: "var(--text2)" }}>{c.telefono || "—"}</td>
                <td><span style={{ fontWeight: 700 }}>{c.totalVisitas}</span></td>
                <td><span style={{ color: "var(--accent)", fontWeight: 600 }}>C$ {fmt(c.totalGastado)}</span></td>
                <td style={{ color: "var(--text2)", fontSize: 13 }}>{c.ultimaVisita ? new Date(c.ultimaVisita).toLocaleDateString("es-NI") : "—"}</td>
                <td><button className="btn btn-ghost" onClick={() => setModal(c)} style={{ padding: "6px 14px", fontSize: 13 }}>Editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
