"use client";
import { MessageCircle, Sofa, ShieldCheck, Sparkles, CalendarCheck } from "lucide-react";
import { T, cardStyle } from "./theme";

const CONFIANZA = [
  { icon: Sofa, titulo: "Ambiente premium", desc: "Cómodo y moderno" },
  { icon: ShieldCheck, titulo: "Higiene garantizada", desc: "Seguridad y limpieza" },
  { icon: Sparkles, titulo: "Productos profesionales", desc: "Marcas de calidad" },
];

export function WhatsAppCard({ barberia }) {
  const numero = barberia?.configuracion?.whatsapp || barberia?.telefono;
  if (!numero) return null;
  return (
    <a href={`https://wa.me/${numero.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
      style={{ ...cardStyle, padding: 16, display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(37,211,102,.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <MessageCircle size={18} color="#25D366" />
      </div>
      <div>
        <p style={{ fontWeight: 700, fontSize: 13, color: T.text, margin: 0 }}>¿Necesitas ayuda?</p>
        <p style={{ fontSize: 12, color: "#25D366", margin: 0, fontWeight: 600 }}>Contáctanos por WhatsApp</p>
      </div>
    </a>
  );
}

export function TrustPanel() {
  return (
    <div style={{ ...cardStyle, padding: 18 }}>
      {CONFIANZA.map(({ icon: Icon, titulo, desc }) => (
        <div key={titulo} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
          <Icon size={18} color="var(--accent)" style={{ flexShrink: 0 }} />
          <div>
            <p style={{ fontWeight: 700, fontSize: 12.5, color: T.text, margin: 0 }}>{titulo}</p>
            <p style={{ fontSize: 11, color: T.text2, margin: 0 }}>{desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReservaCTA({ onClick }) {
  return (
    <button onClick={onClick}
      style={{ background: "linear-gradient(135deg, var(--accent), #b8942a)", border: "none", borderRadius: 14, padding: 20, cursor: "pointer", textAlign: "left", color: "#000", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
      <div>
        <p style={{ fontWeight: 800, fontSize: 14.5, margin: "0 0 3px" }}>Reserva tu cita ahora</p>
        <p style={{ fontSize: 12, margin: 0, opacity: .75 }}>Fácil, rápido y seguro</p>
      </div>
      <CalendarCheck size={22} strokeWidth={2} />
    </button>
  );
}
