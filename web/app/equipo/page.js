"use client";
import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { usuarios as userApi } from "@/lib/api";

const ROLES = ["ADMIN","SUPERVISOR","BARBERO","CAJERO","RECEPCIONISTA"];
const ROL_COLOR = { ADMIN:"badge-yellow", SUPERVISOR:"badge-blue", BARBERO:"badge-green", CAJERO:"badge-blue", RECEPCIONISTA:"badge-gray" };

const TODOS_PERMISOS = [
  { key: "crear_usuarios", label: "Crear usuarios" },
  { key: "editar_usuarios", label: "Editar usuarios" },
  { key: "eliminar_usuarios", label: "Eliminar usuarios" },
  { key: "cambiar_precios", label: "Cambiar precios" },
  { key: "agregar_productos", label: "Agregar productos" },
  { key: "eliminar_productos", label: "Eliminar productos" },
  { key: "abrir_caja", label: "Abrir caja" },
  { key: "cerrar_caja", label: "Cerrar caja" },
  { key: "aprobar_descuentos", label: "Aprobar descuentos" },
  { key: "ver_costos", label: "Ver costos" },
  { key: "exportar_reportes", label: "Exportar reportes" },
  { key: "ver_estadisticas", label: "Ver estadísticas" },
  { key: "administrar_inventario", label: "Administrar inventario" },
  { key: "registrar_ventas", label: "Registrar ventas" },
  { key: "registrar_clientes", label: "Registrar clientes" },
  { key: "ver_agenda", label: "Ver agenda" },
  { key: "crear_citas", label: "Crear citas" },
  { key: "cobrar", label: "Cobrar" },
  { key: "ver_comisiones", label: "Ver comisiones" },
];

function Modal({ usuario, onClose, onSave }) {
  const [form, setForm] = useState(usuario?.id
    ? { ...usuario, password: "" }
    : { nombre: "", apellido: "", email: "", password: "", telefono: "", rol: "BARBERO", permisos: [] });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function togglePermiso(key) {
    const permisos = form.permisos || [];
    set("permisos", permisos.includes(key) ? permisos.filter(p => p !== key) : [...permisos, key]);
  }

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true);
    try {
      const data = { ...form };
      if (!data.password) delete data.password;
      const result = form.id ? await userApi.update(form.id, data) : await userApi.create(data);
      onSave(result);
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div className="card" style={{ width: "100%", maxWidth: 600, padding: 28, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{form.id ? "Editar Usuario" : "Nuevo Usuario"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text2)", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Nombre *</label><input className="input" required value={form.nombre} onChange={e => set("nombre", e.target.value)} /></div>
            <div><label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Apellido</label><input className="input" value={form.apellido || ""} onChange={e => set("apellido", e.target.value)} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Email *</label><input className="input" type="email" required value={form.email} onChange={e => set("email", e.target.value)} /></div>
            <div><label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Teléfono</label><input className="input" value={form.telefono || ""} onChange={e => set("telefono", e.target.value)} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Rol *</label>
              <select className="input" value={form.rol} onChange={e => set("rol", e.target.value)}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>{form.id ? "Nueva contraseña (opcional)" : "Contraseña *"}</label><input className="input" type="password" required={!form.id} value={form.password} onChange={e => set("password", e.target.value)} /></div>
          </div>

          {/* Permisos */}
          <div>
            <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 10 }}>Permisos individuales</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {TODOS_PERMISOS.map(p => (
                <label key={p.key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 8px", borderRadius: 6, background: (form.permisos || []).includes(p.key) ? "var(--accent-dim)" : "transparent" }}>
                  <input type="checkbox" checked={(form.permisos || []).includes(p.key)} onChange={() => togglePermiso(p.key)} />
                  <span style={{ fontSize: 13 }}>{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2 }}>{loading ? "Guardando..." : "Guardar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Equipo() {
  const [usuarios, setUsuarios] = useState([]);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { userApi.list().then(setUsuarios).finally(() => setLoading(false)); }, []);

  function handleSave(u) {
    setUsuarios(prev => prev.find(x => x.id === u.id) ? prev.map(x => x.id === u.id ? u : x) : [u, ...prev]);
    setModal(null);
  }

  async function toggleEstado(u) {
    const updated = await userApi.update(u.id, { estado: !u.estado });
    setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, estado: updated.estado } : x));
  }

  return (
    <AppLayout title="Equipo" actions={
      <button className="btn btn-primary" onClick={() => setModal({})}>+ Nuevo Usuario</button>
    }>
      {modal !== null && <Modal usuario={modal} onClose={() => setModal(null)} onSave={handleSave} />}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total miembros", value: usuarios.length, icon: "👥" },
          { label: "Activos", value: usuarios.filter(u => u.estado).length, icon: "✅" },
          { label: "Barberos", value: usuarios.filter(u => u.rol === "BARBERO").length, icon: "✂️" },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 28 }}>{s.icon}</span>
            <div><p style={{ fontSize: 22, fontWeight: 700 }}>{s.value}</p><p style={{ fontSize: 12, color: "var(--text2)" }}>{s.label}</p></div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {loading && <p style={{ color: "var(--text2)" }}>Cargando...</p>}
        {usuarios.map(u => (
          <div key={u.id} className="card" style={{ padding: 20, opacity: u.estado ? 1 : .6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "var(--accent)" }}>
                {u.nombre[0]}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700 }}>{u.nombre} {u.apellido || ""}</p>
                <p style={{ fontSize: 12, color: "var(--text2)" }}>{u.email}</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
              <span className={`badge ${ROL_COLOR[u.rol] || "badge-gray"}`}>{u.rol}</span>
              <span className={`badge ${u.estado ? "badge-green" : "badge-red"}`}>{u.estado ? "Activo" : "Inactivo"}</span>
            </div>
            <p style={{ fontSize: 12, color: "var(--text2)", marginBottom: 14 }}>
              {u.telefono || "Sin teléfono"} · {(u.permisos || []).length} permisos
            </p>
            {u.ultimoAcceso && <p style={{ fontSize: 11, color: "var(--text2)", marginBottom: 14 }}>Último acceso: {new Date(u.ultimoAcceso).toLocaleDateString("es-NI")}</p>}
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setModal(u)} style={{ flex: 1, fontSize: 13 }}>Editar</button>
              <button onClick={() => toggleEstado(u)} style={{ flex: 1, fontSize: 13, padding: "8px", borderRadius: 8, border: "none", cursor: "pointer", background: u.estado ? "rgba(239,68,68,.1)" : "rgba(34,197,94,.1)", color: u.estado ? "var(--red)" : "var(--green)" }}>
                {u.estado ? "Suspender" : "Activar"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
