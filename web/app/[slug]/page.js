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

export default function PublicPage() {
  const { slug } = useParams();
  const [barberia, setBarberia] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [step, setStep] = useState("servicios"); // servicios | datos | confirmado
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
    ]).then(([b, s, ba]) => { setBarberia(b); setServicios(s); setBarberos(ba); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  function toggleServicio(s) {
    setSeleccionados(prev => prev.find(x => x.id === s.id) ? prev.filter(x => x.id !== s.id) : [...prev, s]);
  }

  const totalMin = seleccionados.reduce((a, s) => a + (s.duracion || 30), 0);
  const totalPrecio = seleccionados.reduce((a, s) => a + Number(s.precio), 0);

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

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a" }}>
      <div style={{ color: "#d4af37", fontSize: 18 }}>Cargando...</div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0a0a0a", color: "#fff" }}>
      <p style={{ fontSize: 48, marginBottom: 16 }}>✂️</p>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Barbería no encontrada</h1>
      <p style={{ color: "#666" }}>{error}</p>
    </div>
  );

  const today = new Date().toISOString().split("T")[0];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{ background: "#111", borderBottom: "1px solid #222", padding: "0 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#d4af37", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>✂️</div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 16 }}>{barberia?.nombre}</p>
              {barberia?.ciudad && <p style={{ fontSize: 12, color: "#888" }}>{barberia.ciudad}</p>}
            </div>
          </div>
          {barberia?.telefono && (
            <a href={`tel:${barberia.telefono}`} style={{ color: "#d4af37", textDecoration: "none", fontSize: 14 }}>📞 {barberia.telefono}</a>
          )}
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>
        {step === "confirmado" ? (
          /* Confirmación */
          <div style={{ maxWidth: 500, margin: "0 auto", textAlign: "center" }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(34,197,94,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 24px" }}>✅</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>¡Cita agendada!</h2>
            <p style={{ color: "#888", marginBottom: 32 }}>Tu cita ha sido registrada. El equipo de {barberia.nombre} te confirmará pronto.</p>
            <div style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: 24, textAlign: "left", marginBottom: 24 }}>
              {[
                ["Fecha", new Date(citaCreada?.fecha).toLocaleDateString("es-NI", { weekday: "long", year: "numeric", month: "long", day: "numeric" })],
                ["Hora", new Date(citaCreada?.fecha).toLocaleTimeString("es-NI", { hour: "2-digit", minute: "2-digit" })],
                ["Duración", `${totalMin} min`],
                ["Servicios", seleccionados.map(s => s.nombre).join(", ")],
                ["Total estimado", `C$ ${fmt(totalPrecio)}`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1a1a1a" }}>
                  <span style={{ color: "#888", fontSize: 14 }}>{k}</span>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{v}</span>
                </div>
              ))}
            </div>
            <button onClick={() => { setStep("servicios"); setSeleccionados([]); setCitaCreada(null); setForm({ nombre: "", telefono: "", barberoId: "", fecha: "", hora: "", notas: "" }); }}
              style={{ padding: "12px 32px", borderRadius: 10, background: "#d4af37", color: "#000", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 15 }}>
              Agendar otra cita
            </button>
          </div>
        ) : step === "servicios" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 28, alignItems: "start" }}>
            {/* Catálogo de servicios */}
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Reserva tu cita</h1>
              <p style={{ color: "#888", marginBottom: 28 }}>Selecciona los servicios que deseas</p>
              {servicios.length === 0 && <p style={{ color: "#666" }}>Esta barbería aún no tiene servicios disponibles.</p>}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
                {servicios.map(s => {
                  const sel = seleccionados.find(x => x.id === s.id);
                  return (
                    <button key={s.id} onClick={() => toggleServicio(s)}
                      style={{ padding: 0, borderRadius: 12, border: `2px solid ${sel ? "#d4af37" : "#222"}`, background: sel ? "rgba(212,175,55,.08)" : "#111", cursor: "pointer", textAlign: "left", transition: "all .15s", overflow: "hidden" }}>
                      {s.video ? (
                        <video src={s.video} muted playsInline style={{ width: "100%", height: 130, objectFit: "cover", display: "block", pointerEvents: "none" }} />
                      ) : s.foto ? (
                        <img src={s.foto} alt={s.nombre} style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} onError={e => e.target.style.display = "none"} />
                      ) : null}
                      <div style={{ padding: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color || "#d4af37", flexShrink: 0 }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{s.nombre}</span>
                        </div>
                        <p style={{ fontSize: 12, color: "#888", marginBottom: 10, minHeight: 28 }}>{s.descripcion || ""}</p>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 18, fontWeight: 700, color: "#d4af37" }}>C$ {fmt(s.precio)}</span>
                          <span style={{ fontSize: 12, color: "#666" }}>⏱ {s.duracion || 30} min</span>
                        </div>
                        {sel && <div style={{ marginTop: 8, fontSize: 12, color: "#d4af37", fontWeight: 600 }}>✓ Seleccionado</div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Panel de resumen */}
            <div style={{ position: "sticky", top: 24, background: "#111", border: "1px solid #222", borderRadius: 16, padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Tu selección</h3>
              {seleccionados.length === 0 ? (
                <p style={{ color: "#666", fontSize: 14, textAlign: "center", padding: "20px 0" }}>Selecciona al menos un servicio</p>
              ) : (
                <>
                  {seleccionados.map(s => (
                    <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1a1a1a" }}>
                      <span style={{ fontSize: 13, color: "#ccc" }}>{s.nombre}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>C$ {fmt(s.precio)}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", marginTop: 4 }}>
                    <span style={{ fontSize: 13, color: "#888" }}>Duración total</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{totalMin} min</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: "1px solid #333", marginBottom: 20 }}>
                    <span style={{ fontWeight: 700 }}>Total</span>
                    <span style={{ fontWeight: 700, color: "#d4af37", fontSize: 18 }}>C$ {fmt(totalPrecio)}</span>
                  </div>
                  <button onClick={() => setStep("datos")}
                    style={{ width: "100%", padding: "14px", borderRadius: 10, background: "#d4af37", color: "#000", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 15 }}>
                    Continuar →
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Formulario de datos */
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 28, alignItems: "start" }}>
            <div>
              <button onClick={() => setStep("servicios")} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 14, marginBottom: 24, padding: 0 }}>← Volver</button>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Tus datos</h2>
              <form onSubmit={enviarCita} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>Nombre completo *</label>
                    <input required value={form.nombre} onChange={e => set("nombre", e.target.value)}
                      style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #333", background: "#111", color: "#fff", fontSize: 14, boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>Teléfono *</label>
                    <input required value={form.telefono} onChange={e => set("telefono", e.target.value)}
                      style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #333", background: "#111", color: "#fff", fontSize: 14, boxSizing: "border-box" }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>Barbero (opcional)</label>
                  <select value={form.barberoId} onChange={e => set("barberoId", e.target.value)}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #333", background: "#111", color: "#fff", fontSize: 14 }}>
                    <option value="">Sin preferencia</option>
                    {barberos.map(b => <option key={b.id} value={b.id}>{b.nombre} {b.apellido || ""}</option>)}
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>Fecha *</label>
                    <input type="date" required min={today} value={form.fecha} onChange={e => set("fecha", e.target.value)}
                      style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #333", background: "#111", color: "#fff", fontSize: 14, boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>Hora *</label>
                    <select required value={form.hora} onChange={e => set("hora", e.target.value)}
                      style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #333", background: "#111", color: "#fff", fontSize: 14 }}>
                      <option value="">Seleccionar</option>
                      {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>Notas adicionales</label>
                  <textarea value={form.notas} onChange={e => set("notas", e.target.value)} rows={3}
                    placeholder="Alguna preferencia especial, alergias, etc."
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #333", background: "#111", color: "#fff", fontSize: 14, resize: "none", boxSizing: "border-box" }} />
                </div>
                <button type="submit" disabled={enviando}
                  style={{ padding: "14px", borderRadius: 10, background: "#d4af37", color: "#000", border: "none", cursor: enviando ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 15, opacity: enviando ? .7 : 1 }}>
                  {enviando ? "Agendando..." : "Confirmar Cita"}
                </button>
              </form>
            </div>
            {/* Resumen lateral */}
            <div style={{ position: "sticky", top: 24, background: "#111", border: "1px solid #222", borderRadius: 16, padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Resumen</h3>
              {seleccionados.map(s => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #1a1a1a" }}>
                  <span style={{ fontSize: 13, color: "#ccc" }}>{s.nombre}</span>
                  <span style={{ fontSize: 13 }}>C$ {fmt(s.precio)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: "1px solid #333", marginTop: 8 }}>
                <span style={{ fontWeight: 700 }}>Total estimado</span>
                <span style={{ fontWeight: 700, color: "#d4af37" }}>C$ {fmt(totalPrecio)}</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #1a1a1a", padding: "24px", textAlign: "center", color: "#555", fontSize: 12, marginTop: 60 }}>
        Powered by <span style={{ color: "#d4af37" }}>BarberPro</span>
      </footer>
    </div>
  );
}
