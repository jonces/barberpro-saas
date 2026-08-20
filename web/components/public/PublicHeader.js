"use client";
import { Scissors, Phone, ShoppingCart, Menu, X } from "lucide-react";
import { T } from "./theme";

const NAV = [
  { id: "servicios", label: "Servicios" },
  { id: "productos", label: "Productos" },
  { id: "barberos", label: "Barberos" },
  { id: "galeria", label: "Galería" },
  { id: "contacto", label: "Contacto" },
];

export default function PublicHeader({ barberia, cartCount, onCartClick, onNav, menuOpen, setMenuOpen }) {
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(8,10,13,.92)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${T.border}` }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 66 }}>
        <button onClick={() => onNav("inicio")} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}>
          {barberia?.logo ? (
            <img src={barberia.logo} alt={barberia.nombre} style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover" }} />
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, var(--accent), #b8942a)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Scissors size={18} color="#000" strokeWidth={2.4} />
            </div>
          )}
          <div>
            <p style={{ fontWeight: 800, fontSize: 15, color: T.text, margin: 0, lineHeight: 1.2 }}>{barberia?.nombre}</p>
            {barberia?.ciudad && <p style={{ fontSize: 11.5, color: T.text2, margin: 0 }}>{barberia.ciudad}</p>}
          </div>
        </button>

        <nav className="public-nav-links" style={{ display: "flex", gap: 4 }}>
          {NAV.map((n) => (
            <button key={n.id} onClick={() => onNav(n.id)}
              style={{ background: "none", border: "none", color: T.text2, cursor: "pointer", fontSize: 13.5, fontWeight: 600, padding: "8px 12px", borderRadius: 8, transition: "color .15s, background .15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = T.text; e.currentTarget.style.background = "rgba(255,255,255,.05)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = T.text2; e.currentTarget.style.background = "none"; }}>
              {n.label}
            </button>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {barberia?.telefono && (
            <a href={`tel:${barberia.telefono}`} className="public-phone-link"
              style={{ display: "flex", alignItems: "center", gap: 7, background: T.elevated, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 14px", color: T.text, textDecoration: "none", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
              <Phone size={14} /> <span className="public-phone-label">{barberia.telefono}</span>
            </a>
          )}
          <button onClick={onCartClick} aria-label="Ver carrito"
            style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 8, background: "var(--accent)", border: "none", cursor: "pointer", flexShrink: 0 }}>
            <ShoppingCart size={17} color="#000" strokeWidth={2.2} />
            {cartCount > 0 && (
              <span style={{ position: "absolute", top: -5, right: -5, background: "#e74c3c", color: "#fff", borderRadius: "50%", width: 19, height: 19, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 800 }}>
                {cartCount}
              </span>
            )}
          </button>
          <button className="public-nav-toggle" onClick={() => setMenuOpen((v) => !v)} aria-label="Abrir menú"
            style={{ display: "none", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 8, background: T.elevated, border: `1px solid ${T.border}`, color: T.text, cursor: "pointer", flexShrink: 0 }}>
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="public-nav-mobile" style={{ display: "flex", flexDirection: "column", padding: "6px 20px 14px", borderTop: `1px solid ${T.border}` }}>
          {NAV.map((n) => (
            <button key={n.id} onClick={() => { onNav(n.id); setMenuOpen(false); }}
              style={{ background: "none", border: "none", color: T.text, cursor: "pointer", fontSize: 15, fontWeight: 600, padding: "12px 4px", textAlign: "left", borderBottom: `1px solid ${T.border}` }}>
              {n.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
