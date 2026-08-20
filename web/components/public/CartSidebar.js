"use client";
import { ShoppingCart, X, ArrowRight } from "lucide-react";
import { T, fmt, cardStyle } from "./theme";

export default function CartSidebar({ seleccionados, carrito, onQuitarServicio, onQuitarProducto, onContinuar }) {
  const totalMin = seleccionados.reduce((a, s) => a + (s.duracion || 30), 0);
  const total = seleccionados.reduce((a, s) => a + Number(s.precio), 0) + carrito.reduce((a, p) => a + Number(p.precio), 0);
  const vacio = seleccionados.length === 0 && carrito.length === 0;

  return (
    <div style={{ ...cardStyle, padding: 20 }}>
      <h3 style={{ fontSize: 14.5, fontWeight: 700, color: T.text, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
        <ShoppingCart size={16} color="var(--accent)" /> Tu selección
      </h3>
      {vacio ? (
        <p style={{ color: T.text2, fontSize: 12.5, textAlign: "center", padding: "14px 0" }}>Selecciona servicios o productos</p>
      ) : (
        <>
          {seleccionados.map((s) => (
            <div key={`s-${s.id}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${T.border}` }}>
              <div>
                <p style={{ fontSize: 12.5, color: T.text, margin: 0 }}>{s.nombre}</p>
                <p style={{ fontSize: 10, color: "var(--accent)", margin: 0, fontWeight: 700, textTransform: "uppercase", letterSpacing: .3 }}>Servicio</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: T.text }}>C$ {fmt(s.precio)}</span>
                <button onClick={() => onQuitarServicio(s)} aria-label="Quitar" style={{ background: "none", border: "none", color: T.text2, cursor: "pointer", padding: 2, display: "flex" }}><X size={13} /></button>
              </div>
            </div>
          ))}
          {carrito.map((p) => (
            <div key={`p-${p.id}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${T.border}` }}>
              <div>
                <p style={{ fontSize: 12.5, color: T.text, margin: 0 }}>{p.nombre}</p>
                <p style={{ fontSize: 10, color: T.text2, margin: 0, fontWeight: 700, textTransform: "uppercase", letterSpacing: .3 }}>Producto</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: T.text }}>C$ {fmt(p.precio)}</span>
                <button onClick={() => onQuitarProducto(p)} aria-label="Quitar" style={{ background: "none", border: "none", color: T.text2, cursor: "pointer", padding: 2, display: "flex" }}><X size={13} /></button>
              </div>
            </div>
          ))}
          {totalMin > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
              <span style={{ fontSize: 12, color: T.text2 }}>Duración total</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{totalMin} min</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: `1px solid ${T.border}`, marginBottom: 14 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>Total</span>
            <span style={{ fontWeight: 800, color: "var(--accent)", fontSize: 18 }}>C$ {fmt(total)}</span>
          </div>
          <button onClick={onContinuar}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", borderRadius: 10, background: "var(--accent)", color: "#000", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
            Ver carrito y continuar <ArrowRight size={15} />
          </button>
        </>
      )}
    </div>
  );
}
