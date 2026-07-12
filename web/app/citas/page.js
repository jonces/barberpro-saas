"use client";
import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { citas as citaApi, clientes as clienteApi, servicios as svcApi, usuarios as userApi } from "@/lib/api";

const ESTADOS = { PENDIENTE:"badge-yellow", CONFIRMADA:"badge-blue", EN_PROGRESO:"badge-blue", COMPLETADA:"badge-green", CANCELADA:"badge-red", NO_SHOW:"badge-gray" };

function ModalCita({ onClose, onSave }) {
  const [clientes, setClientes] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [busqCliente, setBusqCliente] = useState("");
  const [form, setForm] = useState({ clienteId: "", barberoId: "", fecha: "", hora: "09:00", duracion: 30, notas: "", servicioIds: [] });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    Promise.all([svcApi.list(), userApi.list()]).then(([s, u]) => {
      setServicios(s.filter(x => x.estado));
      setBarberos(u.filter(x => x.rol === "BARBERO" || x.rol === "ADMIN"));
    });
  }, []);

  useEffect(() => {
    if (busqCliente.length < 2) { setClientes([]); return; }
    clienteApi.list(busqCliente).then(setClientes);
  }, [busqCliente]);

  function toggleServicio(id) {
    set("servicioIds", form.servicioIds.includes(id) ? form.servicioIds.filter(x => x !== id) : [...form.servicioIds, id]);
  }

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true);
    try {
      const fechaHora = `${form.fecha}T${form.hora}:00`;
      const result = await citaApi.create({ ...form, fecha: fechaHora });
      onSave(result);
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div className="card" style={{ width: "100%", maxWidth: 560, padding: 28, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Nueva Cita</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text2)", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Cliente */}
          <div>
            <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Cliente</label>
            <input className="input" placeholder="Buscar cliente..." value={busqCliente} onChange={e => setBusqCliente(e.target.value)} />
            {clientes.length > 0 && (
              <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, marginTop: 4, maxHeight: 150, overflowY: "auto" }}>
                {clientes.map(c => (
                  <button key={c.id} type="button" onClick={() => { set("clienteId", c.id); setBusqCliente(`${c.nombre} ${c.apellido || ""}`); setClientes([]); }}
                    style={{ width: "100%", padding: "8px 12px", background: "none", border: "none", color: "var(--text)", textAlign: "left", cursor: "pointer", fontSize: 14 }}>
                    {c.nombre} {c.apellido} · {c.telefono}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Barbero */}
          <div>
            <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Barbero *</label>
            <select className="input" required value={form.barberoId} onChange={e => set("barberoId", e.target.value)}>
              <option value="">Seleccionar barbero</option>
              {barberos.map(b => <option key={b.id} value={b.id}>{b.nombre} {b.apellido || ""}</option>)}
            </select>
          </div>
          {/* Fecha y hora */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: "span 1" }}><label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Fecha *</label><input className="input" type="date" required value={form.fecha} onChange={e => set("fecha", e.target.value)} /></div>
            <div><label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Hora *</label><input className="input" type="time" required value={form.hora} onChange={e => set("hora", e.target.value)} /></div>
            <div><label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Duración (min)</label><input className="input" type="number" min="5" value={form.duracion} onChange={e => set("duracion", Number(e.target.value))} /></div>
          </div>
          {/* Servicios */}
          <div>
            <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 8 }}>Servicios</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {servicios.map(s => (
                <button key={s.id} type="button" onClick={() => toggleServicio(s.id)}
                  style={{ padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
                    background: form.servicioIds.includes(s.id) ? "var(--accent)" : "var(--surface2)",
                    color: form.servicioIds.includes(s.id) ? "#000" : "var(--text2)" }}>
                  {s.nombre}
                </button>
              ))}
            </div>
          </div>
          <div><label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Notas</label><textarea className="input" rows={2} value={form.notas} onChange={e => set("notas", e.target.value)} style={{ resize: "none" }} /></div>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2 }}>{loading ? "Guardando..." : "Agendar Cita"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Citas() {
  const [citas, setCitas] = useState([]);
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(true);

  async function cargar() {
    setLoading(true);
    citaApi.list({ fecha }).then(setCitas).finally(() => setLoading(false));
  }
  useEffect(() => { cargar(); }, [fecha]);

  async function cambiarEstado(id, estado) {
    await citaApi.setEstado(id, estado);
    setCitas(prev => prev.map(c => c.id === id ? { ...c, estado } : c));
  }

  const pendientes = citas.filter(c => c.estado === "PENDIENTE" || c.estado === "CONFIRMADA").length;

  return (
    <AppLayout title="Agenda de Citas" actions={
      <button className="btn btn-primary" onClick={() => setModal(true)}>+ Nueva Cita</button>
    }>
      {modal && <ModalCita onClose={() => setModal(false)} onSave={(c) => { setCitas(p => [c, ...p]); setModal(false); }} />}

      {/* Selector de fecha + stats */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <input type="date" className="input" value={fecha} onChange={e => setFecha(e.target.value)} style={{ width: "auto" }} />
        <span className="badge badge-yellow">{pendientes} pendientes</span>
        <span className="badge badge-green">{citas.filter(c => c.estado === "COMPLETADA").length} completadas</span>
        <span className="badge badge-red">{citas.filter(c => c.estado === "CANCELADA").length} canceladas</span>
      </div>

      {/* Lista de citas */}
      {loading && <p style={{ color: "var(--text2)" }}>Cargando citas...</p>}
      {!loading && citas.length === 0 && (
        <div style={{ textAlign: "center", padding: 60 }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>📅</p>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Sin citas para este día</p>
          <p style={{ color: "var(--text2)" }}>Agenda una nueva cita usando el botón de arriba</p>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {citas.map(c => (
          <div key={c.id} className="card" style={{ padding: 20, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            {/* Hora */}
            <div style={{ textAlign: "center", minWidth: 60 }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: "var(--accent)" }}>{new Date(c.fecha).toLocaleTimeString("es-NI", { hour: "2-digit", minute: "2-digit" })}</p>
              <p style={{ fontSize: 11, color: "var(--text2)" }}>{c.duracion} min</p>
            </div>
            {/* Separador */}
            <div style={{ width: 2, height: 48, background: "var(--border)", borderRadius: 2 }} />
            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <p style={{ fontWeight: 700, fontSize: 15 }}>{c.cliente ? `${c.cliente.nombre} ${c.cliente.apellido || ""}` : "Sin cliente"}</p>
                <span className={`badge ${ESTADOS[c.estado] || "badge-gray"}`}>{c.estado}</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text2)" }}>✂️ {c.barbero ? c.barbero.nombre : "Sin barbero asignado"}</p>
              {c.items?.length > 0 && <p style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>{c.items.map(i => i.servicio?.nombre).join(" · ")}</p>}
              {c.notas && <p style={{ fontSize: 12, color: "var(--text2)", marginTop: 4, fontStyle: "italic" }}>📝 {c.notas}</p>}
            </div>
            {/* Acciones */}
            <div style={{ display: "flex", gap: 8 }}>
              {c.estado === "PENDIENTE" && <button className="btn" onClick={() => cambiarEstado(c.id, "CONFIRMADA")} style={{ background: "rgba(59,130,246,.15)", color: "var(--blue)", fontSize: 12, padding: "6px 12px" }}>Confirmar</button>}
              {(c.estado === "PENDIENTE" || c.estado === "CONFIRMADA") && <button className="btn" onClick={() => cambiarEstado(c.id, "EN_PROGRESO")} style={{ background: "rgba(212,175,55,.15)", color: "var(--accent)", fontSize: 12, padding: "6px 12px" }}>Iniciar</button>}
              {c.estado === "EN_PROGRESO" && <button className="btn" onClick={() => cambiarEstado(c.id, "COMPLETADA")} style={{ background: "rgba(34,197,94,.15)", color: "var(--green)", fontSize: 12, padding: "6px 12px" }}>Completar</button>}
              {c.estado !== "CANCELADA" && c.estado !== "COMPLETADA" && <button className="btn" onClick={() => cambiarEstado(c.id, "CANCELADA")} style={{ background: "rgba(239,68,68,.1)", color: "var(--red)", fontSize: 12, padding: "6px 12px" }}>Cancelar</button>}
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
