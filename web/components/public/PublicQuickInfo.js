"use client";
import { CalendarCheck, Award, Sparkles, ShieldCheck } from "lucide-react";
import { T } from "./theme";

const ITEMS = [
  { icon: CalendarCheck, titulo: "Reserva fácil", desc: "Rápido y seguro" },
  { icon: Award, titulo: "Profesionales", desc: "Expertos en estilo" },
  { icon: Sparkles, titulo: "Calidad premium", desc: "Los mejores productos" },
  { icon: ShieldCheck, titulo: "Higiene garantizada", desc: "Seguridad y limpieza" },
];

export default function PublicQuickInfo() {
  return (
    <div className="public-quickinfo" style={{ display: "grid", gap: 14, margin: "24px 0 40px" }}>
      {ITEMS.map(({ icon: Icon, titulo, desc }) => (
        <div key={titulo} style={{ display: "flex", alignItems: "center", gap: 12, background: T.elevated, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(212,175,55,.1)", border: "1px solid rgba(212,175,55,.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon size={16} color="var(--accent)" />
          </div>
          <div>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: T.text, margin: 0 }}>{titulo}</p>
            <p style={{ fontSize: 11, color: T.text2, margin: 0 }}>{desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
