"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { barberias } from "@/lib/api";
import {
  Scissors, ShieldCheck, Store, MapPin, Phone, User, Mail, Lock, Eye, EyeOff,
  ArrowRight, Check, Calculator, CalendarDays, Users, Percent, Package, TrendingUp, Loader2,
} from "lucide-react";

const BENEFICIOS = [
  { icon: Calculator, titulo: "Punto de venta", desc: "Vende más, de forma rápida y eficiente." },
  { icon: CalendarDays, titulo: "Reservas y citas", desc: "Agenda clientes y reduce ausencias." },
  { icon: Users, titulo: "Gestión de barberos", desc: "Organiza tu equipo y su rendimiento." },
  { icon: Percent, titulo: "Comisiones automáticas", desc: "Cálculos precisos y liquidaciones fáciles." },
  { icon: Package, titulo: "Inventario", desc: "Controla tus productos y stock." },
  { icon: TrendingUp, titulo: "Reportes financieros", desc: "Toma decisiones con datos reales." },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Field({ id, icon: Icon, label, error, right, children }) {
  return (
    <div>
      <label htmlFor={id} style={{ display: "block", fontSize: 13, color: "var(--text2)", marginBottom: 6 }}>{label}</label>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        {Icon && <Icon size={17} style={{ position: "absolute", left: 14, color: error ? "var(--red)" : "var(--text2)", pointerEvents: "none" }} />}
        {children}
        {right}
      </div>
      {error && <p style={{ fontSize: 12, color: "var(--red)", marginTop: 5 }}>{error}</p>}
    </div>
  );
}

const inputStyle = (hasIcon, error) => ({
  width: "100%", height: 52, padding: `0 14px 0 ${hasIcon ? 42 : 14}px`, borderRadius: 9,
  background: "var(--surface2)", border: `1px solid ${error ? "var(--red)" : "var(--border)"}`,
  color: "var(--text)", fontSize: 14, outline: "none", transition: "border-color .15s, box-shadow .15s",
  boxSizing: "border-box",
});

export default function Registro() {
  const router = useRouter();
  const [form, setForm] = useState({ nombreBarberia: "", adminNombre: "", adminApellido: "", adminEmail: "", adminPassword: "", telefono: "", ciudad: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); if (errors[k]) setErrors(er => ({ ...er, [k]: null })); };

  function validar() {
    const er = {};
    if (!form.nombreBarberia.trim()) er.nombreBarberia = "El nombre de la barbería es obligatorio.";
    if (!form.ciudad.trim()) er.ciudad = "La ciudad es obligatoria.";
    if (!form.telefono.trim()) er.telefono = "El teléfono es obligatorio.";
    if (!form.adminNombre.trim()) er.adminNombre = "Tu nombre es obligatorio.";
    if (!form.adminApellido.trim()) er.adminApellido = "Tu apellido es obligatorio.";
    if (!EMAIL_RE.test(form.adminEmail.trim())) er.adminEmail = "Ingresa un correo electrónico válido.";
    if (form.adminPassword.length < 8) er.adminPassword = "La contraseña debe tener al menos 8 caracteres.";
    setErrors(er);
    return Object.keys(er).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError("");
    if (!validar()) return;
    setLoading(true);
    try {
      const { token, usuario } = await barberias.registro(form);
      localStorage.setItem("token", token);
      localStorage.setItem("usuario", JSON.stringify(usuario));
      router.replace("/dashboard");
    } catch (err) {
      setApiError(err.message);
    } finally { setLoading(false); }
  }

  const passwordOk = form.adminPassword.length >= 8;

  return (
    <div className="registro-grid" style={{ minHeight: "100vh", background: "#08090a" }}>
      {/* ── PANEL IZQUIERDO — barbería ── */}
      <div className="registro-photo-panel" style={{ position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", padding: "48px 56px" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url('/images/barbershop-dashboard.jpg')", backgroundSize: "cover", backgroundPosition: "center 35%", zIndex: 0 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, rgba(6,6,7,.94) 0%, rgba(8,8,9,.86) 32%, rgba(8,8,9,.55) 62%, rgba(8,8,9,.3) 100%)", zIndex: 1 }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 180, background: "linear-gradient(0deg, rgba(212,175,55,.16) 0%, transparent 100%)", zIndex: 1 }} />
        <div style={{ position: "absolute", right: -80, bottom: -60, width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,55,.20) 0%, transparent 70%)", filter: "blur(10px)", zIndex: 1 }} />

        <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", height: "100%" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
            <Scissors size={22} color="var(--accent)" strokeWidth={2.4} />
            <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: .2 }}>
              <span style={{ color: "#fff" }}>Barber</span><span style={{ color: "var(--accent)" }}>Pro</span>
            </span>
          </div>

          {/* Badge */}
          <div className="registro-badge" style={{ display: "inline-flex", alignSelf: "flex-start", padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(212,175,55,.4)", background: "rgba(212,175,55,.08)", boxShadow: "0 0 16px rgba(212,175,55,.12)", marginBottom: 24 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "var(--accent)", textTransform: "uppercase" }}>Gestión profesional para barberías</span>
          </div>

          {/* Hero */}
          <h1 className="registro-hero" style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.15, marginBottom: 16, letterSpacing: "-.5px" }}>
            <span style={{ color: "#fff" }}>Lleva tu barbería</span><br />
            <span style={{ color: "var(--accent)" }}>al siguiente nivel</span>
          </h1>
          <p className="registro-subtitle" style={{ color: "#c7c7cc", fontSize: 15.5, lineHeight: 1.6, maxWidth: 420, marginBottom: 36 }}>
            Administra tu negocio, equipo, citas, ventas y comisiones desde un solo lugar.
          </p>

          {/* Beneficios */}
          <div className="registro-beneficios" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "22px 28px", marginBottom: "auto" }}>
            {BENEFICIOS.map(({ icon: Icon, titulo, desc }) => (
              <div key={titulo} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div className="registro-beneficio-icono" style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(255,255,255,.05)", border: "1px solid rgba(212,175,55,.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={17} color="var(--accent)" strokeWidth={2} />
                </div>
                <div>
                  <p className="registro-beneficio-titulo" style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{titulo}</p>
                  <p className="registro-beneficio-desc" style={{ fontSize: 12.5, color: "#9a9aa2", lineHeight: 1.4 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Seguridad */}
          <div className="registro-seguridad-panel" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 12, background: "rgba(20,20,22,.55)", border: "1px solid rgba(255,255,255,.1)", backdropFilter: "blur(8px)", marginTop: 32, alignSelf: "flex-start" }}>
            <ShieldCheck size={20} color="var(--accent)" strokeWidth={2} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Tus datos están protegidos</p>
              <p style={{ fontSize: 11.5, color: "#9a9aa2" }}>Seguridad y privacidad garantizadas</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── PANEL DERECHO — formulario ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", background: "radial-gradient(ellipse 900px 600px at 50% 0%, rgba(212,175,55,.05) 0%, transparent 60%), #0a0a0b" }}>
        <div style={{ width: "100%", maxWidth: 460 }}>
          <div style={{ textAlign: "center", marginBottom: 26 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 9, marginBottom: 18 }}>
              <Scissors size={20} color="var(--accent)" strokeWidth={2.4} />
              <span style={{ fontSize: 18, fontWeight: 800 }}><span style={{ color: "#fff" }}>Barber</span><span style={{ color: "var(--accent)" }}>Pro</span></span>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Crea tu barbería</h2>
            <p style={{ fontSize: 13.5, color: "var(--text2)" }}>Configura tu negocio y comienza a administrarlo en minutos.</p>
          </div>

          {/* Indicador de progreso (visual — el formulario sigue siendo de una sola página) */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--accent)", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>01</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--accent)", letterSpacing: .5, textTransform: "uppercase" }}>Negocio</span>
            </div>
            <div style={{ width: 44, height: 2, borderRadius: 2, background: "linear-gradient(90deg, var(--accent), var(--border))" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 24, height: 24, borderRadius: "50%", background: "transparent", border: "1px solid var(--border)", color: "var(--text2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>02</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text2)", letterSpacing: .5, textTransform: "uppercase" }}>Administrador</span>
            </div>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 32, boxShadow: "0 12px 40px rgba(0,0,0,.3)" }}>
            <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: "var(--accent)", letterSpacing: 1, textTransform: "uppercase" }}>Información de la barbería</p>

              <Field id="nombreBarberia" icon={Store} label="Nombre de la barbería *" error={errors.nombreBarberia}>
                <input id="nombreBarberia" autoComplete="organization" placeholder="Barbería El Estilo" value={form.nombreBarberia} onChange={e => set("nombreBarberia", e.target.value)}
                  style={inputStyle(true, errors.nombreBarberia)} onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = errors.nombreBarberia ? "var(--red)" : "var(--border)"} />
              </Field>

              <div className="registro-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field id="ciudad" icon={MapPin} label="Ciudad *" error={errors.ciudad}>
                  <input id="ciudad" autoComplete="address-level2" placeholder="Managua" value={form.ciudad} onChange={e => set("ciudad", e.target.value)}
                    style={inputStyle(true, errors.ciudad)} onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = errors.ciudad ? "var(--red)" : "var(--border)"} />
                </Field>
                <Field id="telefono" icon={Phone} label="Teléfono *" error={errors.telefono}>
                  <input id="telefono" autoComplete="tel" placeholder="+505 8888-0000" value={form.telefono} onChange={e => set("telefono", e.target.value)}
                    style={inputStyle(true, errors.telefono)} onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = errors.telefono ? "var(--red)" : "var(--border)"} />
                </Field>
              </div>

              <div style={{ height: 1, background: "var(--border)", margin: "6px 0 2px" }} />
              <p style={{ fontSize: 11.5, fontWeight: 700, color: "var(--accent)", letterSpacing: 1, textTransform: "uppercase" }}>Tu cuenta de administrador</p>

              <div className="registro-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field id="adminNombre" icon={User} label="Nombre *" error={errors.adminNombre}>
                  <input id="adminNombre" autoComplete="given-name" placeholder="Carlos" value={form.adminNombre} onChange={e => set("adminNombre", e.target.value)}
                    style={inputStyle(true, errors.adminNombre)} onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = errors.adminNombre ? "var(--red)" : "var(--border)"} />
                </Field>
                <Field id="adminApellido" icon={User} label="Apellido *" error={errors.adminApellido}>
                  <input id="adminApellido" autoComplete="family-name" placeholder="López" value={form.adminApellido} onChange={e => set("adminApellido", e.target.value)}
                    style={inputStyle(true, errors.adminApellido)} onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = errors.adminApellido ? "var(--red)" : "var(--border)"} />
                </Field>
              </div>

              <Field id="adminEmail" icon={Mail} label="Correo electrónico *" error={errors.adminEmail}>
                <input id="adminEmail" type="email" autoComplete="email" placeholder="tu@correo.com" value={form.adminEmail} onChange={e => set("adminEmail", e.target.value)}
                  style={inputStyle(true, errors.adminEmail)} onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = errors.adminEmail ? "var(--red)" : "var(--border)"} />
              </Field>

              <Field
                id="adminPassword" icon={Lock} label="Contraseña *" error={errors.adminPassword}
                right={
                  <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    style={{ position: "absolute", right: 12, background: "none", border: "none", color: "var(--text2)", cursor: "pointer", display: "flex", padding: 4 }}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                }
              >
                <input id="adminPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Mínimo 8 caracteres" value={form.adminPassword} onChange={e => set("adminPassword", e.target.value)}
                  style={{ ...inputStyle(true, errors.adminPassword), paddingRight: 42 }} onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = errors.adminPassword ? "var(--red)" : "var(--border)"} />
              </Field>
              {!errors.adminPassword && (
                <p style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: passwordOk ? "var(--green)" : "var(--text2)", marginTop: -10 }}>
                  <Check size={13} strokeWidth={3} /> Mínimo 8 caracteres
                </p>
              )}

              {apiError && <p style={{ color: "var(--red)", fontSize: 13, background: "rgba(239,68,68,.1)", padding: "10px 14px", borderRadius: 8 }}>{apiError}</p>}

              <button type="submit" disabled={loading} className="registro-submit-btn"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", height: 54, marginTop: 6,
                  borderRadius: 9, background: "var(--accent)", color: "#000", border: "none", fontSize: 15, fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer", opacity: loading ? .85 : 1, transition: "filter .15s, transform .1s, box-shadow .15s",
                }}>
                {loading ? <><Loader2 size={18} className="registro-spin" /> Creando tu barbería...</> : <>Crear mi barbería <ArrowRight size={17} /></>}
              </button>

              <p style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12, color: "var(--text2)" }}>
                <Lock size={12} /> Tus datos están protegidos
              </p>
            </form>
          </div>

          <p style={{ textAlign: "center", color: "var(--text2)", fontSize: 13, marginTop: 22 }}>
            ¿Ya tienes cuenta? <Link href="/login" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
