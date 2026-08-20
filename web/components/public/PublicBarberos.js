"use client";
import { T, cardStyle, iniciales } from "./theme";

export default function PublicBarberos({ barberos, onReservar }) {
  if (!barberos || barberos.length === 0) return null;

  return (
    <section id="barberos" style={{ marginBottom: 44 }}>
      <h2 style={{ fontSize: 21, fontWeight: 800, color: T.text, marginBottom: 20 }}>Nuestros Barberos</h2>
      <div className="public-barberos-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 16 }}>
        {barberos.map((b) => (
          <div key={b.id} className="public-card" style={{ ...cardStyle, padding: "22px 18px", textAlign: "center" }}>
            {b.foto ? (
              <img src={b.foto} alt={b.nombre} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", margin: "0 auto 12px" }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), #b8942a)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 20, fontWeight: 800, color: "#000" }}>
                {iniciales(b.nombre, b.apellido)}
              </div>
            )}
            <p style={{ fontWeight: 700, fontSize: 14.5, color: T.text, marginBottom: 2 }}>{b.nombre} {b.apellido || ""}</p>
            <p style={{ fontSize: 12, color: T.text2, marginBottom: 10 }}>Barbero</p>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "#22C55E", background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.25)", borderRadius: 20, padding: "3px 10px", marginBottom: 14 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E" }} /> Disponible
            </span>
            <button onClick={() => onReservar(b)}
              style={{ width: "100%", background: "rgba(255,255,255,.06)", border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px", color: T.text, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
              Reservar con {b.nombre}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
