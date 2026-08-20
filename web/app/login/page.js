"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/api";
import { Scissors, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import AuthPhotoPanel from "@/components/auth/AuthPhotoPanel";
import { Field, inputStyle } from "@/components/auth/AuthField";

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token, usuario } = await auth.login(form);
      localStorage.setItem("token", token);
      localStorage.setItem("usuario", JSON.stringify(usuario));
      router.replace("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-grid" style={{ minHeight: "100vh", background: "#08090a" }}>
      <AuthPhotoPanel
        badge="Gestión profesional para barberías"
        heroTop="Bienvenido de"
        heroAccent="nuevo"
        subtitle="Inicia sesión para seguir administrando tu negocio, equipo, citas y ventas."
      />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", background: "radial-gradient(ellipse 900px 600px at 50% 0%, rgba(212,175,55,.05) 0%, transparent 60%), #0a0a0b" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ textAlign: "center", marginBottom: 30 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 9, marginBottom: 18 }}>
              <Scissors size={20} color="var(--accent)" strokeWidth={2.4} />
              <span style={{ fontSize: 18, fontWeight: 800 }}><span style={{ color: "#fff" }}>Barber</span><span style={{ color: "var(--accent)" }}>Pro</span></span>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Iniciar sesión</h2>
            <p style={{ fontSize: 13.5, color: "var(--text2)" }}>Ingresa tus credenciales para acceder a tu cuenta.</p>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 32, boxShadow: "0 12px 40px rgba(0,0,0,.3)" }}>
            <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Field id="email" icon={Mail} label="Correo electrónico">
                <input id="email" type="email" autoComplete="email" placeholder="tu@correo.com" value={form.email} onChange={e => set("email", e.target.value)}
                  style={inputStyle(true, false)} onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = "var(--border)"} required />
              </Field>

              <Field
                id="password" icon={Lock} label="Contraseña"
                right={
                  <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    style={{ position: "absolute", right: 12, background: "none", border: "none", color: "var(--text2)", cursor: "pointer", display: "flex", padding: 4 }}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                }
              >
                <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="••••••••" value={form.password} onChange={e => set("password", e.target.value)}
                  style={{ ...inputStyle(true, false), paddingRight: 42 }} onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = "var(--border)"} required />
              </Field>

              {error && <p style={{ color: "var(--red)", fontSize: 13, background: "rgba(239,68,68,.1)", padding: "10px 14px", borderRadius: 8 }}>{error}</p>}

              <button type="submit" disabled={loading} className="auth-submit-btn"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", height: 54, marginTop: 6,
                  borderRadius: 9, background: "var(--accent)", color: "#000", border: "none", fontSize: 15, fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer", opacity: loading ? .85 : 1, transition: "filter .15s, transform .1s, box-shadow .15s",
                }}>
                {loading ? <><Loader2 size={18} className="auth-spin" /> Iniciando sesión...</> : <>Entrar <ArrowRight size={17} /></>}
              </button>

              <p style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12, color: "var(--text2)" }}>
                <Lock size={12} /> Tus datos están protegidos
              </p>
            </form>
          </div>

          <p style={{ textAlign: "center", color: "var(--text2)", fontSize: 13, marginTop: 22 }}>
            ¿No tienes cuenta? <Link href="/registro" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>Registra tu barbería</Link>
          </p>
          <p style={{ textAlign: "center", color: "var(--text2)", fontSize: 12, marginTop: 20 }}>
            BarberPro © 2026 — Todos los derechos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
