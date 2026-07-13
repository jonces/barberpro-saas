"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const fmt = (n) => new Intl.NumberFormat("es-NI").format(Number(n) || 0);

async function api(path) {
  const r = await fetch(`${BASE}${path}`);
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Error");
  return d;
}

const HORAS = Array.from({ length: 22 }, (_, i) => {
  const h = Math.floor(i / 2) + 8;
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

const NAV_LINKS = ["Inicio", "Servicios", "Productos", "Barberos", "Galería", "Contacto"];

export default function PublicPage() {
  const { slug } = useParams();
  const [barberia, setBarberia] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [step, setStep] = useState("inicio");
  const [activeNav, setActiveNav] = useState("Inicio");
  const [form, setForm] = useState({ nombre: "", telefono: "", barberoId: "", fecha: "", hora: "", notas: "" });
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [citaCreada, setCitaCreada] = useState(null);
  const [error, setError] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    Promise.all([
      api(`/publico/${slug}`),
      api(`/publico/${slug}/servicios`),
      api(`/publico/${slug}/barberos`),
      api(`/publico/${slug}/productos`),
    ]).then(([b, s, ba, pr]) => {
      setBarberia(b);
      setServicios(s);
      setBarberos(ba);
      setProductos(pr);
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [slug]);

  function toggleServicio(s) {
    setSeleccionados(prev => prev.find(x => x.id === s.id) ? prev.filter(x => x.id !== s.id) : [...prev, s]);
  }

  function toggleCarrito(p) {
    setCarrito(prev => prev.find(x => x.id === p.id) ? prev.filter(x => x.id !== p.id) : [...prev, p]);
  }

  const totalMin = seleccionados.reduce((a, s) => a + (s.duracion || 30), 0);
  const totalPrecio = seleccionados.reduce((a, s) => a + Number(s.precio), 0);
  const totalCarrito = carrito.reduce((a, p) => a + Number(p.precio), 0);

  async function enviarCita(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      const fechaHora = `${form.fecha}T${form.hora}:00`;
      const r = await fetch(`${BASE}/publico/${slug}/citas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, fecha: fechaHora, servicioIds: seleccionados.map(s => s.id), duracion: totalMin }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error al crear cita");
      setCitaCreada(d);
      setStep("confirmado");
    } catch (err) { alert(err.message); }
    finally { setEnviando(false); }
  }

  const today = new Date().toISOString().split("T")[0];

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0d1117" }}>
      <div style={{ color: "#d4af37", fontSize: 18, fontFamily: "system-ui" }}>Cargando...</div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0d1117", color: "#fff", fontFamily: "system-ui" }}>
      <p style={{ fontSize: 48, marginBottom: 16 }}>✂️</p>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Barbería no encontrada</h1>
      <p style={{ color: "#666" }}>{error}</p>
    </div>
  );

  const sidebarItems = [...seleccionados, ...carrito];
  const sidebarTotal = totalPrecio + totalCarrito;

  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", color: "#fff", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* NAVBAR */}
      <header style={{ background: "#0d1117", borderBottom: "1px solid #1e2330", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg,#d4af37,#b8942a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>✂️</div>
            <div>
              <p style={{ fontWeight: 800, fontSize: 17, color: "#fff", margin: 0 }}>{barberia?.nombre}</p>
              <p style={{ fontSize: 12, color: "#888", margin: 0 }}>{barberia?.ciudad || ""}</p>
            </div>
          </div>
          {/* Nav links */}
          <nav style={{ display: "flex", gap: 4 }}>
            {NAV_LINKS.map(n => (
              <button key={n} onClick={() => { setActiveNav(n); if (n === "Servicios") setStep("servicios"); else if (n === "Productos") setStep("productos"); else setStep("inicio"); }}
                style={{ background: "none", border: "none", color: activeNav === n ? "#d4af37" : "#aaa", cursor: "pointer", fontSize: 14, fontWeight: activeNav === n ? 700 : 400, padding: "8px 14px", borderBottom: activeNav === n ? "2px solid #d4af37" : "2px solid transparent", transition: "all .15s" }}>
                {n}
              </button>
            ))}
          </nav>
          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {barberia?.telefono && (
              <a href={`tel:${barberia.telefono}`}
                style={{ display: "flex", alignItems: "center", gap: 8, background: "#1a2035", border: "1px solid #2a3050", borderRadius: 8, padding: "8px 16px", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
                📞 {barberia.telefono}
              </a>
            )}
            <button onClick={() => setStep("datos")}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "#d4af37", borderRadius: 8, padding: "8px 16px", color: "#000", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, position: "relative" }}>
              🛒
              {sidebarItems.length > 0 && (
                <span style={{ background: "#e74c3c", color: "#fff", borderRadius: "50%", width: 20, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                  {sidebarItems.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
        {step === "confirmado" ? (
          /* CONFIRMACIÓN */
          <div style={{ maxWidth: 500, margin: "80px auto", textAlign: "center" }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(34,197,94,.15)", border: "2px solid rgba(34,197,94,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 24px" }}>✅</div>
            <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>¡Cita agendada!</h2>
            <p style={{ color: "#888", marginBottom: 32 }}>Tu cita ha sido registrada. El equipo de <strong style={{ color: "#d4af37" }}>{barberia.nombre}</strong> te confirmará pronto.</p>
            <div style={{ background: "#111827", border: "1px solid #1e2330", borderRadius: 16, padding: 24, textAlign: "left", marginBottom: 24 }}>
              {[
                ["Fecha", new Date(citaCreada?.fecha).toLocaleDateString("es-NI", { weekday: "long", year: "numeric", month: "long", day: "numeric" })],
                ["Hora", new Date(citaCreada?.fecha).toLocaleTimeString("es-NI", { hour: "2-digit", minute: "2-digit" })],
                ["Duración", `${totalMin} min`],
                ["Servicios", seleccionados.map(s => s.nombre).join(", ")],
                ["Total estimado", `C$ ${fmt(totalPrecio)}`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1e2330" }}>
                  <span style={{ color: "#888", fontSize: 14 }}>{k}</span>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{v}</span>
                </div>
              ))}
            </div>
            <button onClick={() => { setStep("inicio"); setSeleccionados([]); setCarrito([]); setCitaCreada(null); setForm({ nombre: "", telefono: "", barberoId: "", fecha: "", hora: "", notas: "" }); }}
              style={{ padding: "13px 32px", borderRadius: 10, background: "#d4af37", color: "#000", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 15 }}>
              Agendar otra cita
            </button>
          </div>

        ) : step === "datos" ? (
          /* FORMULARIO DATOS */
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 28, padding: "40px 0", alignItems: "start" }}>
            <div>
              <button onClick={() => setStep("servicios")} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 14, marginBottom: 24, padding: 0 }}>← Volver a servicios</button>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Tus datos</h2>
              <form onSubmit={enviarCita} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6, fontWeight: 600 }}>Nombre completo *</label>
                    <input required value={form.nombre} onChange={e => set("nombre", e.target.value)}
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #1e2330", background: "#111827", color: "#fff", fontSize: 14, boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6, fontWeight: 600 }}>Teléfono *</label>
                    <input required value={form.telefono} onChange={e => set("telefono", e.target.value)}
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #1e2330", background: "#111827", color: "#fff", fontSize: 14, boxSizing: "border-box" }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6, fontWeight: 600 }}>Barbero (opcional)</label>
                  <select value={form.barberoId} onChange={e => set("barberoId", e.target.value)}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #1e2330", background: "#111827", color: "#fff", fontSize: 14 }}>
                    <option value="">Sin preferencia</option>
                    {barberos.map(b => <option key={b.id} value={b.id}>{b.nombre} {b.apellido || ""}</option>)}
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6, fontWeight: 600 }}>Fecha *</label>
                    <input type="date" required min={today} value={form.fecha} onChange={e => set("fecha", e.target.value)}
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #1e2330", background: "#111827", color: "#fff", fontSize: 14, boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6, fontWeight: 600 }}>Hora *</label>
                    <select required value={form.hora} onChange={e => set("hora", e.target.value)}
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #1e2330", background: "#111827", color: "#fff", fontSize: 14 }}>
                      <option value="">Seleccionar hora</option>
                      {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6, fontWeight: 600 }}>Notas adicionales</label>
                  <textarea value={form.notas} onChange={e => set("notas", e.target.value)} rows={3}
                    placeholder="Alguna preferencia especial, alergias, etc."
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #1e2330", background: "#111827", color: "#fff", fontSize: 14, resize: "none", boxSizing: "border-box" }} />
                </div>
                <button type="submit" disabled={enviando}
                  style={{ padding: "14px", borderRadius: 10, background: "#d4af37", color: "#000", border: "none", cursor: enviando ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 16, opacity: enviando ? .7 : 1 }}>
                  {enviando ? "Agendando..." : "✅ Confirmar Cita"}
                </button>
              </form>
            </div>
            {/* Resumen lateral */}
            <div style={{ position: "sticky", top: 88, background: "#111827", border: "1px solid #1e2330", borderRadius: 16, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>🛒 Tu selección</h3>
              {seleccionados.map(s => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1e2330" }}>
                  <span style={{ fontSize: 13, color: "#ccc" }}>{s.nombre}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>C$ {fmt(s.precio)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
                <span style={{ fontSize: 13, color: "#888" }}>Duración total</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{totalMin} min</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: "1px solid #2a3050", marginBottom: 8 }}>
                <span style={{ fontWeight: 700 }}>Total</span>
                <span style={{ fontWeight: 800, color: "#d4af37", fontSize: 18 }}>C$ {fmt(totalPrecio)}</span>
              </div>
            </div>
          </div>

        ) : (
          /* PÁGINA PRINCIPAL */
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 28, paddingTop: 32, alignItems: "start" }}>
            <div>
              {/* HERO */}
              <div style={{ borderRadius: 20, overflow: "hidden", marginBottom: 40, position: "relative", background: "linear-gradient(135deg, #0d1117 0%, #1a2035 100%)", minHeight: 280, display: "flex", alignItems: "center" }}>
                <div style={{ padding: "40px 48px", flex: 1 }}>
                  <p style={{ color: "#d4af37", fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>BIENVENIDO A {barberia?.nombre?.toUpperCase()}</p>
                  <h1 style={{ fontSize: 38, fontWeight: 900, lineHeight: 1.15, marginBottom: 16, color: "#fff" }}>Tu estilo,<br />nuestra pasión</h1>
                  <p style={{ color: "#aaa", fontSize: 15, marginBottom: 28, maxWidth: 360 }}>Reserva tu cita y disfruta de la mejor experiencia en cortes, barbas y productos de calidad profesional.</p>
                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                    {[["📅", "Reserva fácil", "Rápido y seguro"], ["⭐", "Profesionales", "Expertos en estilo"], ["🏆", "Calidad premium", "Los mejores productos"]].map(([ic, t, s]) => (
                      <div key={t} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 22 }}>{ic}</span>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 13, color: "#fff", margin: 0 }}>{t}</p>
                          <p style={{ fontSize: 11, color: "#888", margin: 0 }}>{s}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ width: 340, height: 280, flexShrink: 0, overflow: "hidden", position: "relative" }}>
                  <img src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=680&q=80" alt="Barbería"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={e => e.target.style.display = "none"} />
                </div>
              </div>

              {/* SERVICIOS */}
              <section style={{ marginBottom: 40 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, display: "flex", alignItems: "center", gap: 10 }}>✂️ Servicios</h2>
                  <button onClick={() => { setStep("servicios"); setActiveNav("Servicios"); }}
                    style={{ background: "none", border: "none", color: "#d4af37", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>Ver todos →</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))", gap: 14 }}>
                  {servicios.slice(0, 5).map(s => {
                    const sel = seleccionados.find(x => x.id === s.id);
                    return (
                      <button key={s.id} onClick={() => toggleServicio(s)}
                        style={{ padding: 0, borderRadius: 14, border: `2px solid ${sel ? "#d4af37" : "#1e2330"}`, background: sel ? "rgba(212,175,55,.08)" : "#111827", cursor: "pointer", textAlign: "left", overflow: "hidden", transition: "all .15s" }}>
                        <div style={{ position: "relative", height: 130, background: "#1a2035", overflow: "hidden" }}>
                          {s.video ? (
                            <video src={s.video} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }} />
                          ) : s.foto ? (
                            <img src={s.foto} alt={s.nombre} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={e => e.target.style.display = "none"} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>✂️</div>
                          )}
                          <span style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,.75)", borderRadius: 20, padding: "3px 8px", fontSize: 11, color: "#fff", fontWeight: 600 }}>{s.duracion || 30} min</span>
                          {sel && <div style={{ position: "absolute", inset: 0, background: "rgba(212,175,55,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ background: "#d4af37", color: "#000", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>✓</span></div>}
                        </div>
                        <div style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color || "#d4af37", flexShrink: 0 }} />
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{s.nombre}</span>
                          </div>
                          {s.descripcion && <p style={{ fontSize: 11, color: "#777", marginBottom: 8, lineHeight: 1.4 }}>{s.descripcion.slice(0, 55)}{s.descripcion.length > 55 ? "..." : ""}</p>}
                          <span style={{ fontSize: 16, fontWeight: 800, color: "#d4af37" }}>C$ {fmt(s.precio)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* PRODUCTOS */}
              {productos.length > 0 && (
                <section style={{ marginBottom: 40 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 800, display: "flex", alignItems: "center", gap: 10 }}>🛒 Productos</h2>
                    <button onClick={() => { setStep("productos"); setActiveNav("Productos"); }}
                      style={{ background: "none", border: "none", color: "#d4af37", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>Ver todos →</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(165px, 1fr))", gap: 14 }}>
                    {productos.slice(0, 5).map(p => {
                      const enCarrito = carrito.find(x => x.id === p.id);
                      return (
                        <div key={p.id} style={{ borderRadius: 14, border: "1px solid #1e2330", background: "#111827", overflow: "hidden" }}>
                          <div style={{ height: 120, background: "#1a2035", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {p.foto ? <img src={p.foto} alt={p.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display = "none"} /> : <span style={{ fontSize: 32 }}>📦</span>}
                          </div>
                          <div style={{ padding: "12px 14px" }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{p.nombre}</p>
                            {p.descripcion && <p style={{ fontSize: 11, color: "#777", marginBottom: 8 }}>{p.descripcion.slice(0, 40)}</p>}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: 15, fontWeight: 800, color: "#d4af37" }}>C$ {fmt(p.precio)}</span>
                              <button onClick={() => toggleCarrito(p)}
                                style={{ width: 28, height: 28, borderRadius: "50%", background: enCarrito ? "#d4af37" : "#1a2035", border: "none", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: enCarrito ? "#000" : "#d4af37" }}>
                                {enCarrito ? "✓" : "+"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* BARBEROS */}
              {barberos.length > 0 && (
                <section style={{ marginBottom: 40 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>👥 Nuestro Equipo</h2>
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                    {barberos.map(b => (
                      <div key={b.id} style={{ background: "#111827", border: "1px solid #1e2330", borderRadius: 14, padding: "20px 24px", textAlign: "center", minWidth: 130 }}>
                        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#d4af37,#b8942a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, margin: "0 auto 12px" }}>✂️</div>
                        <p style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>{b.nombre} {b.apellido || ""}</p>
                        <p style={{ fontSize: 12, color: "#888" }}>Barbero</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* SIDEBAR */}
            <div style={{ position: "sticky", top: 88, display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Selección */}
              <div style={{ background: "#111827", border: "1px solid #1e2330", borderRadius: 16, padding: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>🛒 Tu selección</h3>
                {sidebarItems.length === 0 ? (
                  <p style={{ color: "#666", fontSize: 13, textAlign: "center", padding: "12px 0" }}>Selecciona servicios o productos</p>
                ) : (
                  <>
                    {sidebarItems.map(s => (
                      <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #1e2330" }}>
                        <span style={{ fontSize: 13, color: "#ccc" }}>{s.nombre}</span>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>C$ {fmt(s.precio)}</span>
                      </div>
                    ))}
                    {totalMin > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                        <span style={{ fontSize: 13, color: "#888" }}>Duración total</span>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{totalMin} min</span>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid #2a3050", marginBottom: 14 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>Total</span>
                      <span style={{ fontWeight: 800, color: "#d4af37", fontSize: 18 }}>C$ {fmt(sidebarTotal)}</span>
                    </div>
                    <button onClick={() => setStep("datos")}
                      style={{ width: "100%", padding: "13px", borderRadius: 10, background: "#d4af37", color: "#000", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 15 }}>
                      Continuar →
                    </button>
                  </>
                )}
              </div>

              {/* WhatsApp */}
              {barberia?.telefono && (
                <div style={{ background: "#111827", border: "1px solid #1e2330", borderRadius: 16, padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(37,211,102,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>💬</div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 13, color: "#fff", margin: 0 }}>¿Necesitas ayuda?</p>
                    <a href={`https://wa.me/${barberia.telefono.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                      style={{ fontSize: 12, color: "#25d366", textDecoration: "none", fontWeight: 600 }}>Contáctanos por WhatsApp</a>
                  </div>
                </div>
              )}

              {/* Beneficios */}
              <div style={{ background: "#111827", border: "1px solid #1e2330", borderRadius: 16, padding: 20 }}>
                {[["🛋️", "Ambiente premium", "Cómodo y moderno"], ["🛡️", "Higiene garantizada", "Seguridad y limpieza"], ["⭐", "Mejores productos", "Marcas profesionales"]].map(([ic, t, s]) => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
                    <span style={{ fontSize: 20 }}>{ic}</span>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 13, color: "#fff", margin: 0 }}>{t}</p>
                      <p style={{ fontSize: 11, color: "#888", margin: 0 }}>{s}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button onClick={() => setStep("servicios")}
                style={{ background: "linear-gradient(135deg,#d4af37,#b8942a)", border: "none", borderRadius: 16, padding: 20, cursor: "pointer", textAlign: "center", color: "#000" }}>
                <p style={{ fontWeight: 800, fontSize: 15, margin: "0 0 4px" }}>📅 Reserva tu cita ahora</p>
                <p style={{ fontSize: 12, margin: 0, opacity: .8 }}>Fácil, rápido y 100% seguro</p>
              </button>
            </div>
          </div>
        )}

        {/* Vista todos los servicios */}
        {step === "servicios" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 28, padding: "40px 0", alignItems: "start" }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Todos los Servicios</h2>
              <p style={{ color: "#888", marginBottom: 24 }}>Selecciona los servicios que deseas</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))", gap: 14 }}>
                {servicios.map(s => {
                  const sel = seleccionados.find(x => x.id === s.id);
                  return (
                    <button key={s.id} onClick={() => toggleServicio(s)}
                      style={{ padding: 0, borderRadius: 14, border: `2px solid ${sel ? "#d4af37" : "#1e2330"}`, background: sel ? "rgba(212,175,55,.08)" : "#111827", cursor: "pointer", textAlign: "left", overflow: "hidden", transition: "all .15s" }}>
                      <div style={{ position: "relative", height: 130, background: "#1a2035", overflow: "hidden" }}>
                        {s.video ? (
                          <video src={s.video} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }} />
                        ) : s.foto ? (
                          <img src={s.foto} alt={s.nombre} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={e => e.target.style.display = "none"} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>✂️</div>
                        )}
                        <span style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,.75)", borderRadius: 20, padding: "3px 8px", fontSize: 11, color: "#fff", fontWeight: 600 }}>{s.duracion || 30} min</span>
                        {sel && <div style={{ position: "absolute", inset: 0, background: "rgba(212,175,55,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ background: "#d4af37", color: "#000", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>✓</span></div>}
                      </div>
                      <div style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color || "#d4af37", flexShrink: 0 }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{s.nombre}</span>
                        </div>
                        {s.descripcion && <p style={{ fontSize: 11, color: "#777", marginBottom: 8, lineHeight: 1.4 }}>{s.descripcion.slice(0, 55)}{s.descripcion.length > 55 ? "..." : ""}</p>}
                        <span style={{ fontSize: 16, fontWeight: 800, color: "#d4af37" }}>C$ {fmt(s.precio)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Sidebar */}
            <div style={{ position: "sticky", top: 88, background: "#111827", border: "1px solid #1e2330", borderRadius: 16, padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🛒 Tu selección</h3>
              {seleccionados.length === 0 ? (
                <p style={{ color: "#666", fontSize: 13, textAlign: "center", padding: "16px 0" }}>Selecciona al menos un servicio</p>
              ) : (
                <>
                  {seleccionados.map(s => (
                    <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #1e2330" }}>
                      <span style={{ fontSize: 13, color: "#ccc" }}>{s.nombre}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>C$ {fmt(s.precio)}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                    <span style={{ fontSize: 13, color: "#888" }}>Duración total</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{totalMin} min</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid #2a3050", marginBottom: 14 }}>
                    <span style={{ fontWeight: 700 }}>Total</span>
                    <span style={{ fontWeight: 800, color: "#d4af37", fontSize: 18 }}>C$ {fmt(totalPrecio)}</span>
                  </div>
                  <button onClick={() => setStep("datos")}
                    style={{ width: "100%", padding: "13px", borderRadius: 10, background: "#d4af37", color: "#000", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 15 }}>
                    Continuar →
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER BAR */}
      <footer style={{ background: "#080c14", borderTop: "1px solid #1e2330", marginTop: 60 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>📍</span>
              <div>
                <p style={{ fontSize: 11, color: "#888", margin: 0 }}>Ubicación</p>
                <p style={{ fontSize: 13, color: "#fff", fontWeight: 600, margin: 0 }}>{barberia?.ciudad || "Nicaragua"}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>🕐</span>
              <div>
                <p style={{ fontSize: 11, color: "#888", margin: 0 }}>Horario</p>
                <p style={{ fontSize: 13, color: "#fff", fontWeight: 600, margin: 0 }}>Lun - Sáb: 8:00 AM - 8:00 PM</p>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 13, color: "#888" }}>Síguenos</span>
            {["📘", "📸", "🎵"].map((ic, i) => (
              <span key={i} style={{ fontSize: 22, cursor: "pointer" }}>{ic}</span>
            ))}
          </div>
          <button onClick={() => setStep("servicios")}
            style={{ background: "#d4af37", border: "none", borderRadius: 10, padding: "10px 20px", color: "#000", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
            📅 Reserva tu cita ahora
          </button>
        </div>
      </footer>
    </div>
  );
}
