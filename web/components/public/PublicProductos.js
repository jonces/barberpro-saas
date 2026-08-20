"use client";
import { useState } from "react";
import { Package, Check } from "lucide-react";
import { T, fmt, cardStyle } from "./theme";

function ProductoCard({ p, enCarrito, onToggle }) {
  const agotado = p.stock !== undefined && p.stock <= 0;
  return (
    <div className="public-card" style={{ ...cardStyle, overflow: "hidden", borderColor: enCarrito ? "var(--accent)" : T.border, background: enCarrito ? "rgba(212,175,55,.06)" : T.elevated, opacity: agotado ? .6 : 1 }}>
      <div style={{ position: "relative", height: 120, background: "#1a1d24", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {p.foto ? (
          <img src={p.foto} alt={p.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <Package size={26} color="var(--accent)" strokeWidth={1.6} />
        )}
        {agotado && (
          <span style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,.8)", color: "#fff", fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 20, textTransform: "uppercase", letterSpacing: .5 }}>
            Agotado
          </span>
        )}
      </div>
      <div style={{ padding: "13px 15px" }}>
        <p style={{ fontSize: 13.5, fontWeight: 700, color: T.text, marginBottom: 3 }}>{p.nombre}</p>
        {p.descripcion && <p style={{ fontSize: 11.5, color: T.text2, marginBottom: 9, lineHeight: 1.4 }}>{p.descripcion.length > 45 ? `${p.descripcion.slice(0, 45)}...` : p.descripcion}</p>}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: "var(--accent)" }}>C$ {fmt(p.precio)}</span>
          <button onClick={() => !agotado && onToggle(p)} disabled={agotado}
            style={{ display: "flex", alignItems: "center", gap: 5, background: agotado ? "rgba(255,255,255,.04)" : enCarrito ? "var(--accent)" : "rgba(255,255,255,.06)", color: agotado ? T.text2 : enCarrito ? "#000" : T.text, border: enCarrito || agotado ? "none" : `1px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: agotado ? "not-allowed" : "pointer" }}>
            {enCarrito ? <><Check size={12} /> Agregado</> : "Agregar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PublicProductos({ productos, carrito, onToggle }) {
  const [verTodos, setVerTodos] = useState(false);
  if (!productos || productos.length === 0) return null;
  const visibles = verTodos ? productos : productos.slice(0, 8);

  return (
    <section id="productos" style={{ marginBottom: 44 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ fontSize: 21, fontWeight: 800, color: T.text }}>Productos destacados</h2>
        {productos.length > 8 && (
          <button onClick={() => setVerTodos((v) => !v)} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 13.5, fontWeight: 700 }}>
            {verTodos ? "Ver menos" : "Ver todos →"}
          </button>
        )}
      </div>
      <div className="public-productos-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 14 }}>
        {visibles.map((p) => (
          <ProductoCard key={p.id} p={p} enCarrito={!!carrito.find((x) => x.id === p.id)} onToggle={onToggle} />
        ))}
      </div>
    </section>
  );
}
