"use client";
import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import MediaUpload from "@/components/MediaUpload";
import { productos as prodApi, ai as aiApi } from "@/lib/api";

const fmt = (n) => new Intl.NumberFormat("es-NI").format(Number(n) || 0);

function ModalProducto({ item, categorias, onClose, onSave }) {
  const [form, setForm] = useState(item?.id ? { ...item } : { nombre: "", descripcion: "", precio: "", costo: "", stock: 0, stockMinimo: 5, unidad: "unidad", categoriaId: "", foto: "", video: "", estado: true });
  const [loading, setLoading] = useState(false);
  const [generando, setGenerando] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function generarDescripcion() {
    if (!form.nombre.trim()) return;
    setGenerando(true);
    try {
      const r = await aiApi.descripcion(form.nombre, "producto");
      set("descripcion", r.descripcion);
    } catch {}
    finally { setGenerando(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true);
    try {
      const result = form.id ? await prodApi.update(form.id, form) : await prodApi.create(form);
      onSave(result);
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  }

  const utilidad = form.precio && form.costo ? ((Number(form.precio) - Number(form.costo)) / Number(form.precio) * 100).toFixed(1) : 0;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div className="card" style={{ width: "100%", maxWidth: 540, padding: 28, maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{form.id ? "Editar Producto" : "Nuevo Producto"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text2)", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Nombre *</label>
            <input className="input" required value={form.nombre} onChange={e => set("nombre", e.target.value)}
              onBlur={() => { if (form.nombre.trim() && !form.descripcion) generarDescripcion(); }} />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <label style={{ fontSize: 12, color: "var(--text2)" }}>Descripción</label>
              <button type="button" onClick={generarDescripcion} disabled={!form.nombre.trim() || generando}
                style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, border: "none", cursor: form.nombre.trim() ? "pointer" : "not-allowed", background: "rgba(212,175,55,.15)", color: "var(--accent)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                {generando ? "⏳ Generando..." : "✨ Generar con IA"}
              </button>
            </div>
            <textarea className="input" rows={2} value={form.descripcion || ""} onChange={e => set("descripcion", e.target.value)} style={{ resize: "none" }} placeholder="Escribe el nombre y presiona '✨ Generar con IA'..." />
          </div>
          <MediaUpload
            foto={form.foto}
            video={form.video}
            onFoto={url => set("foto", url)}
            onVideo={url => set("video", url)}
            label="Foto o video del producto (visible para clientes en línea)"
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Precio venta (C$) *</label>
              <input className="input" type="number" min="0" step="0.01" required value={form.precio} onChange={e => set("precio", e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Costo (C$)</label>
              <input className="input" type="number" min="0" step="0.01" value={form.costo || ""} onChange={e => set("costo", e.target.value)} />
            </div>
          </div>
          {utilidad > 0 && <p style={{ fontSize: 12, color: "var(--green)", background: "rgba(34,197,94,.1)", padding: "6px 12px", borderRadius: 6 }}>📈 Margen de utilidad: {utilidad}% (C$ {fmt(Number(form.precio) - Number(form.costo))} por unidad)</p>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div><label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Stock inicial</label><input className="input" type="number" min="0" value={form.stock} onChange={e => set("stock", Number(e.target.value))} /></div>
            <div><label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Stock mínimo</label><input className="input" type="number" min="0" value={form.stockMinimo} onChange={e => set("stockMinimo", Number(e.target.value))} /></div>
            <div><label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Unidad</label><input className="input" value={form.unidad} onChange={e => set("unidad", e.target.value)} /></div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Categoría</label>
            <select className="input" value={form.categoriaId || ""} onChange={e => set("categoriaId", e.target.value)}>
              <option value="">Sin categoría</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
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

function ModalStock({ producto, onClose, onSave }) {
  const [tipo, setTipo] = useState("ENTRADA");
  const [cantidad, setCantidad] = useState(1);
  const [nota, setNota] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true);
    try {
      await prodApi.ajustarStock(producto.id, { tipo, cantidad: Number(cantidad), nota });
      onSave();
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div className="card" style={{ width: "100%", maxWidth: 400, padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Ajustar Stock — {producto.nombre}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text2)", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20 }}>Stock actual: <strong style={{ color: "var(--text)" }}>{producto.stock} {producto.unidad}</strong></p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {["ENTRADA","SALIDA","AJUSTE"].map(t => (
              <button key={t} type="button" onClick={() => setTipo(t)}
                style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                  background: tipo === t ? (t === "ENTRADA" ? "rgba(34,197,94,.2)" : t === "SALIDA" ? "rgba(239,68,68,.2)" : "rgba(212,175,55,.2)") : "var(--surface2)",
                  color: tipo === t ? (t === "ENTRADA" ? "var(--green)" : t === "SALIDA" ? "var(--red)" : "var(--accent)") : "var(--text2)" }}>
                {t === "ENTRADA" ? "📥 Entrada" : t === "SALIDA" ? "📤 Salida" : "📝 Ajuste"}
              </button>
            ))}
          </div>
          <div><label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Cantidad</label><input className="input" type="number" min="1" required value={cantidad} onChange={e => setCantidad(e.target.value)} /></div>
          <div><label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Nota (opcional)</label><input className="input" value={nota} onChange={e => setNota(e.target.value)} placeholder="Motivo del ajuste..." /></div>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2 }}>{loading ? "Guardando..." : "Confirmar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Inventario() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [modal, setModal] = useState(null);
  const [stockModal, setStockModal] = useState(null);
  const [filtro, setFiltro] = useState("todos");
  const [busq, setBusq] = useState("");
  const [loading, setLoading] = useState(true);

  async function cargar() {
    setLoading(true);
    Promise.all([prodApi.list(), prodApi.categorias.list()])
      .then(([p, c]) => { setProductos(p); setCategorias(c); })
      .finally(() => setLoading(false));
  }
  useEffect(() => { cargar(); }, []);

  function handleSave(p) {
    setProductos(prev => prev.find(x => x.id === p.id) ? prev.map(x => x.id === p.id ? p : x) : [p, ...prev]);
    setModal(null);
  }

  const filtrados = productos.filter(p => {
    if (filtro === "bajo_stock") return p.stock <= p.stockMinimo && p.estado;
    if (filtro === "inactivos") return !p.estado;
    if (filtro === "activos") return p.estado;
    return true;
  }).filter(p => !busq || p.nombre.toLowerCase().includes(busq.toLowerCase()));

  const bajosStock = productos.filter(p => p.stock <= p.stockMinimo && p.estado).length;

  return (
    <AppLayout title="Inventario" actions={
      <button className="btn btn-primary" onClick={() => setModal({})}>+ Nuevo Producto</button>
    }>
      {modal !== null && <ModalProducto item={modal} categorias={categorias} onClose={() => setModal(null)} onSave={handleSave} />}
      {stockModal && <ModalStock producto={stockModal} onClose={() => setStockModal(null)} onSave={() => { setStockModal(null); cargar(); }} />}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total productos", value: productos.length, icon: "📦", color: "var(--text)" },
          { label: "Valor inventario", value: `C$ ${fmt(productos.reduce((s, p) => s + p.stock * Number(p.costo), 0))}`, icon: "💎", color: "var(--accent)" },
          { label: "Bajo stock", value: bajosStock, icon: "⚠️", color: bajosStock > 0 ? "var(--red)" : "var(--green)" },
          { label: "Categorías", value: categorias.length, icon: "🏷", color: "var(--text)" },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 18 }}>
            <span style={{ fontSize: 22 }}>{s.icon}</span>
            <p style={{ fontSize: 22, fontWeight: 700, color: s.color, marginTop: 8 }}>{s.value}</p>
            <p style={{ fontSize: 12, color: "var(--text2)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros + búsqueda */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input className="input" placeholder="🔍 Buscar producto..." value={busq} onChange={e => setBusq(e.target.value)} style={{ maxWidth: 260 }} />
        {[["todos","Todos"],["activos","Activos"],["bajo_stock","⚠️ Bajo Stock"],["inactivos","Inactivos"]].map(([v,l]) => (
          <button key={v} onClick={() => setFiltro(v)} className={`btn ${filtro === v ? "btn-primary" : "btn-ghost"}`} style={{ fontSize: 13 }}>{l}</button>
        ))}
      </div>

      {/* Grid de productos */}
      {loading ? <p style={{ color: "var(--text2)" }}>Cargando...</p> : filtrados.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text2)" }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>📦</p>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No hay productos</p>
          <p style={{ fontSize: 13, marginBottom: 24 }}>Crea tu primer producto con precio, stock y foto</p>
          <button className="btn btn-primary" onClick={() => setModal({})}>+ Agregar primer producto</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {filtrados.map(p => {
            const margen = p.costo > 0 ? ((Number(p.precio) - Number(p.costo)) / Number(p.precio) * 100).toFixed(0) : null;
            const stockBajo = p.stock <= p.stockMinimo;
            return (
              <div key={p.id} className="card" style={{ overflow: "hidden", opacity: p.estado ? 1 : .6 }}>
                {/* Media */}
                {p.video ? (
                  <video src={p.video} controls muted style={{ width: "100%", height: 160, objectFit: "cover", display: "block", background: "#000" }} />
                ) : p.foto ? (
                  <img src={p.foto} alt={p.nombre} style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} onError={e => e.target.style.display = "none"} />
                ) : (
                  <div style={{ width: "100%", height: 60, background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 28 }}>📦</span>
                  </div>
                )}
                <div style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, flex: 1 }}>{p.nombre}</p>
                    <span className={`badge ${p.estado ? "badge-green" : "badge-gray"}`} style={{ marginLeft: 6 }}>{p.estado ? "Activo" : "Inactivo"}</span>
                  </div>
                  {p.descripcion && <p style={{ fontSize: 12, color: "var(--text2)", marginBottom: 10, lineHeight: 1.4 }}>{p.descripcion}</p>}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: "var(--accent)" }}>C$ {fmt(p.precio)}</p>
                    {margen && <span className="badge badge-green">{margen}% margen</span>}
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, padding: "8px 12px", borderRadius: 8, background: stockBajo ? "rgba(239,68,68,.08)" : "rgba(34,197,94,.06)" }}>
                    <span style={{ fontSize: 16 }}>{stockBajo ? "⚠️" : "📦"}</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: stockBajo ? "var(--red)" : "var(--green)" }}>{p.stock} {p.unidad}</p>
                      <p style={{ fontSize: 11, color: "var(--text2)" }}>Mín: {p.stockMinimo}</p>
                    </div>
                    {p.categoria && <span className="badge badge-gray" style={{ marginLeft: "auto", fontSize: 10 }}>{p.categoria.nombre}</span>}
                  </div>

                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-primary" onClick={() => setModal(p)} style={{ flex: 2, fontSize: 12 }}>✏️ Editar</button>
                    <button onClick={() => setStockModal(p)} style={{ flex: 1, fontSize: 12, padding: "8px", borderRadius: 8, border: "none", cursor: "pointer", background: "rgba(212,175,55,.12)", color: "var(--accent)", fontWeight: 600 }}>📥 Stock</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
