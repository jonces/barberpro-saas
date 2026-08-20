"use client";
import { X, ArrowRight } from "lucide-react";
import { T, fmt } from "./theme";

export default function CartBottomSheet({ open, onClose, seleccionados, carrito, onQuitarServicio, onQuitarProducto, onContinuar }) {
  if (!open) return null;
  const totalMin = seleccionados.reduce((a, s) => a + (s.duracion || 30), 0);
  const total = seleccionados.reduce((a, s) => a + Number(s.precio), 0) + carrito.reduce((a, p) => a + Number(p.precio), 0);

  return (
    <div role="dialog" aria-modal="true" onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 250, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "flex-end" }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxHeight: "78vh", overflowY: "auto", background: T.elevated, borderTop: `1px solid ${T.border}`, borderRadius: "20px 20px 0 0", padding: "18px 20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0 }}>Tu selección</h3>
          <button onClick={onClose} aria-label="Cerrar" style={{ background: "rgba(255,255,255,.06)", border: "none", borderRadius: 8, width: 32, height: 32, color: T.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} />
          </button>
        </div>

        {seleccionados.map((s) => (
          <div key={`s-${s.id}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${T.border}` }}>
            <div>
              <p style={{ fontSize: 13.5, color: T.text, margin: 0 }}>{s.nombre}</p>
              <p style={{ fontSize: 10, color: "var(--accent)", margin: 0, fontWeight: 700, textTransform: "uppercase" }}>Servicio</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>C$ {fmt(s.precio)}</span>
              <button onClick={() => onQuitarServicio(s)} aria-label="Quitar" style={{ background: "none", border: "none", color: T.text2, cursor: "pointer", display: "flex" }}><X size={14} /></button>
            </div>
          </div>
        ))}
        {carrito.map((p) => (
          <div key={`p-${p.id}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${T.border}` }}>
            <div>
              <p style={{ fontSize: 13.5, color: T.text, margin: 0 }}>{p.nombre}</p>
              <p style={{ fontSize: 10, color: T.text2, margin: 0, fontWeight: 700, textTransform: "uppercase" }}>Producto</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>C$ {fmt(p.precio)}</span>
              <button onClick={() => onQuitarProducto(p)} aria-label="Quitar" style={{ background: "none", border: "none", color: T.text2, cursor: "pointer", display: "flex" }}><X size={14} /></button>
            </div>
          </div>
        ))}

        {totalMin > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
            <span style={{ fontSize: 12.5, color: T.text2 }}>Duración total</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>{totalMin} min</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: `1px solid ${T.border}`, marginBottom: 16 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: T.text }}>Total</span>
          <span style={{ fontWeight: 800, color: "var(--accent)", fontSize: 19 }}>C$ {fmt(total)}</span>
        </div>
        <button onClick={onContinuar}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", borderRadius: 10, background: "var(--accent)", color: "#000", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 15 }}>
          Continuar <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
