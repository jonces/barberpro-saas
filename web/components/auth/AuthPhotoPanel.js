import { Scissors, ShieldCheck, Calculator, CalendarDays, Users, Percent, Package, TrendingUp } from "lucide-react";

const BENEFICIOS = [
  { icon: Calculator, titulo: "Punto de venta", desc: "Vende más, de forma rápida y eficiente." },
  { icon: CalendarDays, titulo: "Reservas y citas", desc: "Agenda clientes y reduce ausencias." },
  { icon: Users, titulo: "Gestión de barberos", desc: "Organiza tu equipo y su rendimiento." },
  { icon: Percent, titulo: "Comisiones automáticas", desc: "Cálculos precisos y liquidaciones fáciles." },
  { icon: Package, titulo: "Inventario", desc: "Controla tus productos y stock." },
  { icon: TrendingUp, titulo: "Reportes financieros", desc: "Toma decisiones con datos reales." },
];

export default function AuthPhotoPanel({ badge, heroTop, heroAccent, subtitle }) {
  return (
    <div className="auth-photo-panel" style={{ position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", padding: "48px 56px" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "url('/images/barbershop-dashboard.jpg')", backgroundSize: "cover", backgroundPosition: "center 35%", zIndex: 0 }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, rgba(6,6,7,.94) 0%, rgba(8,8,9,.86) 32%, rgba(8,8,9,.55) 62%, rgba(8,8,9,.3) 100%)", zIndex: 1 }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 180, background: "linear-gradient(0deg, rgba(212,175,55,.16) 0%, transparent 100%)", zIndex: 1 }} />
      <div style={{ position: "absolute", right: -80, bottom: -60, width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,55,.20) 0%, transparent 70%)", filter: "blur(10px)", zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
          <Scissors size={22} color="var(--accent)" strokeWidth={2.4} />
          <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: .2 }}>
            <span style={{ color: "#fff" }}>Barber</span><span style={{ color: "var(--accent)" }}>Pro</span>
          </span>
        </div>

        <div className="auth-badge" style={{ display: "inline-flex", alignSelf: "flex-start", padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(212,175,55,.4)", background: "rgba(212,175,55,.08)", boxShadow: "0 0 16px rgba(212,175,55,.12)", marginBottom: 24 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "var(--accent)", textTransform: "uppercase" }}>{badge}</span>
        </div>

        <h1 className="auth-hero" style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.15, marginBottom: 16, letterSpacing: "-.5px" }}>
          <span style={{ color: "#fff" }}>{heroTop}</span><br />
          <span style={{ color: "var(--accent)" }}>{heroAccent}</span>
        </h1>
        <p className="auth-subtitle" style={{ color: "#c7c7cc", fontSize: 15.5, lineHeight: 1.6, maxWidth: 420, marginBottom: 36 }}>
          {subtitle}
        </p>

        <div className="auth-beneficios" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "22px 28px", marginBottom: "auto" }}>
          {BENEFICIOS.map(({ icon: Icon, titulo, desc }) => (
            <div key={titulo} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div className="auth-beneficio-icono" style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(255,255,255,.05)", border: "1px solid rgba(212,175,55,.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={17} color="var(--accent)" strokeWidth={2} />
              </div>
              <div>
                <p className="auth-beneficio-titulo" style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{titulo}</p>
                <p className="auth-beneficio-desc" style={{ fontSize: 12.5, color: "#9a9aa2", lineHeight: 1.4 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="auth-seguridad-panel" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 12, background: "rgba(20,20,22,.55)", border: "1px solid rgba(255,255,255,.1)", backdropFilter: "blur(8px)", marginTop: 32, alignSelf: "flex-start" }}>
          <ShieldCheck size={20} color="var(--accent)" strokeWidth={2} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Tus datos están protegidos</p>
            <p style={{ fontSize: 11.5, color: "#9a9aa2" }}>Seguridad y privacidad garantizadas</p>
          </div>
        </div>
      </div>
    </div>
  );
}
