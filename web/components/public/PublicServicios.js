"use client";
import { useState } from "react";
import { Scissors, Check, Clock } from "lucide-react";
import { T, fmt, cardStyle } from "./theme";

function ServicioCard({ s, activo, onToggle }) {
  return (
    <div className="public-card" style={{ ...cardStyle, overflow: "hidden", borderColor: activo ? "var(--accent)" : T.border, background: activo ? "rgba(212,175,55,.06)" : T.elevated }}>
      <div style={{ position: "relative", height: 140, background: "#1a1d24", overflow: "hidden" }}>
        {s.video ? (
          <video src={s.video} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : s.foto ? (
          <img src={s.foto} alt={s.nombre} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Scissors size={30} color="var(--accent)" strokeWidth={1.6} />
          </div>
        )}
        <span style={{ position: "absolute", top: 10, right: 10, display: "flex", alignItems: "center", gap: 4, background: "rgba(0,0,0,.75)", borderRadius: 20, padding: "3px 9px", fontSize: 11, color: "#fff", fontWeight: 600 }}>
          <Clock size={11} /> {s.duracion || 30} min
        </span>
      </div>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color || "var(--accent)", flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{s.nombre}</span>
        </div>
        {s.descripcion && <p style={{ fontSize: 12, color: T.text2, marginBottom: 10, lineHeight: 1.4 }}>{s.descripcion.length > 70 ? `${s.descripcion.slice(0, 70)}...` : s.descripcion}</p>}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: "var(--accent)" }}>C$ {fmt(s.precio)}</span>
          <button onClick={() => onToggle(s)}
            style={{ display: "flex", alignItems: "center", gap: 5, background: activo ? "var(--accent)" : "rgba(255,255,255,.06)", color: activo ? "#000" : T.text, border: activo ? "none" : `1px solid ${T.border}`, borderRadius: 8, padding: "7px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
            {activo ? <><Check size={13} /> Seleccionado</> : "Reservar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PublicServicios({ servicios, seleccionados, onToggle }) {
  const [verTodos, setVerTodos] = useState(false);
  if (!servicios || servicios.length === 0) return null;
  const visibles = verTodos ? servicios : servicios.slice(0, 6);

  return (
    <section id="servicios" style={{ marginBottom: 44 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ fontSize: 21, fontWeight: 800, color: T.text }}>Servicios populares</h2>
        {servicios.length > 6 && (
          <button onClick={() => setVerTodos((v) => !v)} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 13.5, fontWeight: 700 }}>
            {verTodos ? "Ver menos" : "Ver todos →"}
          </button>
        )}
      </div>
      <div className="public-servicios-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        {visibles.map((s) => (
          <ServicioCard key={s.id} s={s} activo={!!seleccionados.find((x) => x.id === s.id)} onToggle={onToggle} />
        ))}
      </div>
    </section>
  );
}
