"use client";
import { ArrowRight } from "lucide-react";
import { fmt } from "./theme";

export default function CartMobileBar({ seleccionados, carrito, onOpen }) {
  const count = seleccionados.length + carrito.length;
  if (count === 0) return null;
  const total = seleccionados.reduce((a, s) => a + Number(s.precio), 0) + carrito.reduce((a, p) => a + Number(p.precio), 0);

  return (
    <button onClick={onOpen} className="public-mobile-cartbar"
      style={{ position: "fixed", left: 12, right: 12, bottom: 12, zIndex: 150, display: "none", alignItems: "center", justifyContent: "space-between", background: "var(--accent)", color: "#000", border: "none", borderRadius: 14, padding: "14px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 8px 24px rgba(0,0,0,.4)" }}>
      <span>{count} artículo{count !== 1 ? "s" : ""} • C$ {fmt(total)}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>Ver selección <ArrowRight size={15} /></span>
    </button>
  );
}
