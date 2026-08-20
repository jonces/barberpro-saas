"use client";
import { ArrowRight, ChevronDown } from "lucide-react";
import { T } from "./theme";

export default function PublicHero({ barberia, onReservar, onVerServicios }) {
  const heroImage = barberia?.configuracion?.heroImage;
  const inicial = (barberia?.nombre || "?").trim()[0]?.toUpperCase() || "?";

  return (
    <section id="inicio" style={{ position: "relative", overflow: "hidden", borderRadius: 20, marginTop: 24, minHeight: 420, display: "flex", alignItems: "flex-end" }}>
      {heroImage ? (
        <>
          <div style={{ position: "absolute", inset: 0, backgroundImage: `url('${heroImage}')`, backgroundSize: "cover", backgroundPosition: "center", zIndex: 0 }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(8,10,13,.92) 10%, rgba(8,10,13,.45) 60%, rgba(8,10,13,.15) 100%)", zIndex: 1 }} />
        </>
      ) : (
        <>
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 80% 20%, rgba(212,175,55,.14) 0%, transparent 55%), linear-gradient(135deg, ${T.surface} 0%, ${T.bg} 100%)`, zIndex: 0 }} />
          <div style={{ position: "absolute", right: -40, top: "50%", transform: "translateY(-50%)", fontSize: 260, fontWeight: 900, color: "rgba(255,255,255,.03)", lineHeight: 1, userSelect: "none", zIndex: 0 }}>{inicial}</div>
        </>
      )}

      <div style={{ position: "relative", zIndex: 2, padding: "48px 40px", maxWidth: 620 }}>
        <p style={{ color: "var(--accent)", fontSize: 12.5, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14 }}>
          Bienvenido a {barberia?.nombre}
        </p>
        <h1 style={{ fontSize: "clamp(30px, 5vw, 46px)", fontWeight: 900, lineHeight: 1.12, marginBottom: 16, color: T.text }}>
          Tu estilo,<br /><span style={{ color: "var(--accent)" }}>nuestra pasión</span>
        </h1>
        <p style={{ color: T.text2, fontSize: 15.5, lineHeight: 1.6, marginBottom: 30, maxWidth: 460 }}>
          Reserva tu cita y disfruta de la mejor experiencia en cortes, barbas y productos de calidad profesional.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button onClick={onReservar}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--accent)", color: "#000", border: "none", borderRadius: 10, padding: "13px 24px", fontSize: 14.5, fontWeight: 700, cursor: "pointer" }}>
            Reservar cita ahora <ArrowRight size={16} />
          </button>
          <button onClick={onVerServicios}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.06)", color: T.text, border: `1px solid ${T.border}`, borderRadius: 10, padding: "13px 24px", fontSize: 14.5, fontWeight: 700, cursor: "pointer" }}>
            Ver servicios <ChevronDown size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
