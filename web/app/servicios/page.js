"use client";
import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import MediaUpload from "@/components/MediaUpload";
import { servicios as svcApi, ai as aiApi } from "@/lib/api";

const fmt = (n) => new Intl.NumberFormat("es-NI").format(Number(n) || 0);
const COLORES = ["#d4af37","#3b82f6","#22c55e","#ef4444","#a855f7","#f97316","#06b6d4","#ec4899"];

function Modal({ item, categorias, onClose, onSave }) {
  const [form, setForm] = useState(item?.id
    ? { ...item }
    : { nombre: "", descripcion: "", precio: "", duracion: 30, color: "#d4af37", categoriaId: "", foto: "", video: "", estado: true });
  const [loading, setLoading] = useState(false);
  const [generando, setGenerando] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function generarDescripcion() {
    if (!form.nombre.trim()) return;
    setGenerando(true);
    try {
      const r = await aiApi.descripcion(form.nombre, "servicio");
      set("descripcion", r.descripcion);
    } catch {}
    finally { setGenerando(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true);
    try {
      const result = form.id ? await svcApi.update(form.id, form) : await svcApi.create(form);
      onSave(result);
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div className="card" style={{ width: "100%", maxWidth: 560, padding: 28, maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{form.id ? "Editar Servicio" : "Nuevo Servicio"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text2)", fontSize: 24, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Nombre */}
          <div>
            <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Nombre del servicio *</label>
            <input className="input" required placeholder="Ej: Corte Clásico" value={form.nombre}
              onChange={e => set("nombre", e.target.value)}
              onBlur={() => { if (form.nombre.trim() && !form.descripcion) generarDescripcion(); }} />
          </div>

          {/* Descripción */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <label style={{ fontSize: 12, color: "var(--text2)" }}>Descripción (visible para clientes)</label>
              <button type="button" onClick={generarDescripcion} disabled={!form.nombre.trim() || generando}
                style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, border: "none", cursor: form.nombre.trim() ? "pointer" : "not-allowed", background: "rgba(212,175,55,.15)", color: "var(--accent)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                {generando ? "⏳ Generando..." : "✨ Generar con IA"}
              </button>
            </div>
            <textarea className="input" rows={3} placeholder="Escribe el nombre del servicio y presiona '✨ Generar con IA'..." value={form.descripcion || ""} onChange={e => set("descripcion", e.target.value)} style={{ resize: "vertical" }} />
          </div>

          {/* Precio y Duración */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Precio (C$) *</label>
              <input className="input" type="number" min="0" step="0.01" required placeholder="0.00" value={form.precio} onChange={e => set("precio", e.target.value)} style={{ fontSize: 18, fontWeight: 700 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Duración (minutos)</label>
              <input className="input" type="number" min="5" step="5" value={form.duracion} onChange={e => set("duracion", Number(e.target.value))} />
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Categoría</label>
            <select className="input" value={form.categoriaId || ""} onChange={e => set("categoriaId", e.target.value)}>
              <option value="">Sin categoría</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          {/* Color */}
          <div>
            <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 8 }}>Color identificador</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {COLORES.map(c => (
                <button key={c} type="button" onClick={() => set("color", c)}
                  style={{ width: 32, height: 32, borderRadius: "50%", background: c, cursor: "pointer", border: form.color === c ? "3px solid white" : "3px solid transparent", boxShadow: form.color === c ? `0 0 0 2px ${c}` : "none", transition: "all .15s" }} />
              ))}
            </div>
          </div>

          {/* Foto / Video */}
          <MediaUpload
            foto={form.foto}
            video={form.video}
            onFoto={url => set("foto", url)}
            onVideo={url => set("video", url)}
            label="Foto o video del servicio (visible para clientes en línea)"
          />

          {/* Estado */}
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 12px", borderRadius: 8, background: "var(--surface2)" }}>
            <input type="checkbox" checked={form.estado} onChange={e => set("estado", e.target.checked)} style={{ width: 16, height: 16 }} />
            <span style={{ fontSize: 14, fontWeight: 500 }}>Servicio activo (visible en catálogo y POS)</span>
          </label>

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2, padding: 13, fontSize: 14 }}>
              {loading ? "Guardando..." : form.id ? "Guardar cambios" : "Crear Servicio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Servicios() {
  const [servicios, setServicios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [modal, setModal] = useState(null);
  const [filtro, setFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([svcApi.list(), svcApi.categorias.list()])
      .then(([s, c]) => { setServicios(s); setCategorias(c); })
      .finally(() => setLoading(false));
  }, []);

  function handleSave(s) {
    setServicios(prev => prev.find(x => x.id === s.id) ? prev.map(x => x.id === s.id ? s : x) : [s, ...prev]);
    setModal(null);
  }

  async function toggleEstado(s) {
    const updated = await svcApi.update(s.id, { estado: !s.estado });
    setServicios(prev => prev.map(x => x.id === s.id ? { ...x, estado: updated.estado } : x));
  }

  async function eliminar(s) {
    if (!confirm(`¿Eliminar "${s.nombre}"? No se podrá deshacer.`)) return;
    await svcApi.remove(s.id);
    setServicios(prev => prev.filter(x => x.id !== s.id));
  }

  const lista = servicios.filter(s => {
    if (filtro === "activos" && !s.estado) return false;
    if (filtro === "inactivos" && s.estado) return false;
    if (busqueda && !s.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  return (
    <AppLayout title="Servicios" actions={
      <button className="btn btn-primary" onClick={() => setModal({})}>+ Nuevo Servicio</button>
    }>
      {modal !== null && <Modal item={modal} categorias={categorias} onClose={() => setModal(null)} onSave={handleSave} />}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total servicios", value: servicios.length, icon: "✂️", color: "var(--accent)" },
          { label: "Activos", value: servicios.filter(s => s.estado).length, icon: "✅", color: "var(--green)" },
          { label: "Con foto/video", value: servicios.filter(s => s.foto || s.video).length, icon: "📸", color: "var(--blue)" },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 28 }}>{s.icon}</span>
            <div><p style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</p><p style={{ fontSize: 12, color: "var(--text2)" }}>{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        {[["todos","Todos"],["activos","Activos"],["inactivos","Inactivos"]].map(([f, l]) => (
          <button key={f} onClick={() => setFiltro(f)} style={{ padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: filtro === f ? 600 : 400, fontSize: 13, background: filtro === f ? "var(--accent)" : "var(--surface)", color: filtro === f ? "#000" : "var(--text2)" }}>{l}</button>
        ))}
        <input className="input" placeholder="Buscar servicio..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={{ flex: 1, minWidth: 200, fontSize: 13 }} />
      </div>

      {/* Grid de servicios */}
      {loading ? <p style={{ color: "var(--text2)" }}>Cargando...</p> : lista.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text2)" }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>✂️</p>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No hay servicios</p>
          <p style={{ fontSize: 13, marginBottom: 24 }}>Crea tu primer servicio con precio, duración y foto</p>
          <button className="btn btn-primary" onClick={() => setModal({})}>+ Crear primer servicio</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {lista.map(s => (
            <div key={s.id} className="card" style={{ overflow: "hidden", opacity: s.estado ? 1 : .6, transition: "opacity .2s" }}>
              {/* Media */}
              {s.video ? (
                <video src={s.video} controls muted style={{ width: "100%", height: 160, objectFit: "cover", display: "block", background: "#000" }} />
              ) : s.foto ? (
                <img src={s.foto} alt={s.nombre} style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} onError={e => e.target.style.display = "none"} />
              ) : (
                <div style={{ width: "100%", height: 80, background: `linear-gradient(135deg, ${s.color}22, ${s.color}08)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: s.color }} />
                </div>
              )}

              <div style={{ padding: 18 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{s.nombre}</p>
                    {s.descripcion && <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{s.descripcion}</p>}
                  </div>
                  <span style={{ background: `${s.color}22`, color: s.color, fontSize: 11, padding: "3px 8px", borderRadius: 20, fontWeight: 600, whiteSpace: "nowrap", marginLeft: 8 }}>{s.duracion}min</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <p style={{ fontSize: 22, fontWeight: 800, color: "var(--accent)" }}>C$ {fmt(s.precio)}</p>
                  <span className={`badge ${s.estado ? "badge-green" : "badge-red"}`}>{s.estado ? "Activo" : "Inactivo"}</span>
                </div>

                {/* Acciones */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-primary" onClick={() => setModal(s)} style={{ flex: 2, fontSize: 13 }}>✏️ Editar</button>
                  <button onClick={() => toggleEstado(s)} style={{ flex: 1, fontSize: 12, padding: "8px", borderRadius: 8, border: "none", cursor: "pointer", background: s.estado ? "rgba(239,68,68,.1)" : "rgba(34,197,94,.1)", color: s.estado ? "var(--red)" : "var(--green)", fontWeight: 600 }}>
                    {s.estado ? "Desactivar" : "Activar"}
                  </button>
                  <button onClick={() => eliminar(s)} style={{ padding: "8px 10px", borderRadius: 8, border: "none", cursor: "pointer", background: "rgba(239,68,68,.08)", color: "var(--red)", fontSize: 14 }} title="Eliminar">🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
