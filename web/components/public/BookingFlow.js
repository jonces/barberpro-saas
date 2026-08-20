"use client";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, CalendarCheck, Loader2 } from "lucide-react";
import { T, fmt, cardStyle, iniciales } from "./theme";
import { publico } from "@/lib/api";
import { aIsoManagua, TIMEZONE } from "@/lib/horarios";

const PASOS = ["Servicio", "Barbero", "Fecha y hora", "Datos", "Confirmar"];
const HORAS_DEFAULT = Array.from({ length: 22 }, (_, i) => {
  const h = Math.floor(i / 2) + 8;
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

function generarHoras(horarios, fechaStr) {
  if (!fechaStr) return [];
  if (!horarios || horarios.length === 0) return HORAS_DEFAULT;
  const dia = new Date(`${fechaStr}T00:00:00`).getDay();
  const h = horarios.find((x) => x.diaSemana === dia);
  if (!h || !h.abierto) return [];
  const [hi, mi] = h.apertura.split(":").map(Number);
  const [hf, mf] = h.cierre.split(":").map(Number);
  let cur = hi * 60 + mi;
  const fin = hf * 60 + mf;
  const out = [];
  while (cur < fin) {
    out.push(`${String(Math.floor(cur / 60)).padStart(2, "0")}:${String(cur % 60).padStart(2, "0")}`);
    cur += 30;
  }
  return out;
}

function Stepper({ pasoActivo }) {
  return (
    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 28 }}>
      {PASOS.map((p, i) => (
        <div key={p} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10.5, fontWeight: 800, flexShrink: 0,
              background: i <= pasoActivo ? "var(--accent)" : "transparent",
              border: i <= pasoActivo ? "none" : `1px solid ${T.border}`,
              color: i <= pasoActivo ? "#000" : T.text2,
            }}>{i < pasoActivo ? <Check size={12} /> : i + 1}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: i <= pasoActivo ? "var(--accent)" : T.text2, textTransform: "uppercase", letterSpacing: .3 }}>{p}</span>
          </div>
          {i < PASOS.length - 1 && <span style={{ width: 20, height: 1, background: T.border }} />}
        </div>
      ))}
    </div>
  );
}

export default function BookingFlow({ slug, servicios, barberos, horarios, seleccionados, carrito, barberoPreferido, onToggleServicio, onVolver, onCompletado }) {
  const [paso, setPaso] = useState(barberoPreferido ? 1 : 0);
  const [barberoId, setBarberoId] = useState(barberoPreferido?.id || "");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [form, setForm] = useState({ nombre: "", telefono: "", email: "", notas: "" });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [citaCreada, setCitaCreada] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const totalMin = seleccionados.reduce((a, s) => a + (s.duracion || 30), 0) || 30;
  const totalPrecio = seleccionados.reduce((a, s) => a + Number(s.precio), 0) + carrito.reduce((a, p) => a + Number(p.precio), 0);
  const today = new Date().toISOString().split("T")[0];
  const horasDisponibles = generarHoras(horarios, fecha);
  const barberoElegido = barberos.find((b) => b.id === barberoId);

  const notasProductos = carrito.length
    ? `Productos deseados: ${carrito.map((p) => p.nombre).join(", ")}`
    : "";

  async function confirmar() {
    setEnviando(true);
    setError("");
    try {
      const cita = await publico.crearCita(slug, {
        nombre: form.nombre,
        telefono: form.telefono,
        email: form.email || undefined,
        barberoId: barberoId || undefined,
        fecha: aIsoManagua(fecha, hora),
        duracion: totalMin,
        notas: [form.notas, notasProductos].filter(Boolean).join(" — ") || undefined,
        servicioIds: seleccionados.map((s) => s.id),
      });
      setCitaCreada(cita);
      setPaso(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (paso === 4 && citaCreada) {
    return (
      <div style={{ maxWidth: 480, margin: "40px auto", textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(34,197,94,.12)", border: "2px solid rgba(34,197,94,.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px" }}>
          <Check size={30} color="#22C55E" strokeWidth={2.4} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: T.text, marginBottom: 8 }}>¡Cita agendada!</h2>
        <p style={{ color: T.text2, marginBottom: 28, fontSize: 14 }}>Te confirmaremos pronto por teléfono o WhatsApp.</p>
        <div style={{ ...cardStyle, padding: 22, textAlign: "left", marginBottom: 24 }}>
          {[
            ["Fecha", new Date(citaCreada.fecha).toLocaleDateString("es-NI", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: TIMEZONE })],
            ["Hora", new Date(citaCreada.fecha).toLocaleTimeString("es-NI", { hour: "2-digit", minute: "2-digit", timeZone: TIMEZONE })],
            ["Barbero", citaCreada.barbero?.nombre || "Sin preferencia"],
            ["Servicios", seleccionados.map((s) => s.nombre).join(", ") || "—"],
            ["Total estimado", `C$ ${fmt(totalPrecio)}`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ color: T.text2, fontSize: 13 }}>{k}</span>
              <span style={{ fontWeight: 600, fontSize: 13, color: T.text, textAlign: "right" }}>{v}</span>
            </div>
          ))}
        </div>
        <button onClick={onCompletado} style={{ padding: "13px 30px", borderRadius: 10, background: "var(--accent)", color: "#000", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14.5 }}>
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 0 60px" }}>
      <button onClick={onVolver} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: T.text2, cursor: "pointer", fontSize: 13.5, marginBottom: 20, padding: 0 }}>
        <ArrowLeft size={15} /> Volver
      </button>
      <Stepper pasoActivo={paso} />

      {paso === 0 && (
        <div style={{ maxWidth: 560 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 6 }}>Tu selección</h2>
          <p style={{ color: T.text2, fontSize: 13.5, marginBottom: 18 }}>Elige uno o más servicios para tu cita.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
            {servicios.map((s) => {
              const activo = !!seleccionados.find((x) => x.id === s.id);
              return (
                <button key={s.id} onClick={() => onToggleServicio(s)}
                  style={{ ...cardStyle, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", cursor: "pointer", textAlign: "left", borderColor: activo ? "var(--accent)" : T.border, background: activo ? "rgba(212,175,55,.06)" : T.elevated }}>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 700, color: T.text, margin: 0 }}>{s.nombre}</p>
                    <p style={{ fontSize: 11.5, color: T.text2, margin: 0 }}>{s.duracion || 30} min</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "var(--accent)" }}>C$ {fmt(s.precio)}</span>
                    {activo && <Check size={16} color="var(--accent)" />}
                  </div>
                </button>
              );
            })}
          </div>
          <button disabled={seleccionados.length === 0} onClick={() => setPaso(1)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "13px 26px", borderRadius: 10, background: seleccionados.length ? "var(--accent)" : "rgba(255,255,255,.06)", color: seleccionados.length ? "#000" : T.text2, border: "none", cursor: seleccionados.length ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 14 }}>
            Continuar <ArrowRight size={15} />
          </button>
        </div>
      )}

      {paso === 1 && (
        <div style={{ maxWidth: 640 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 6 }}>¿Con quién deseas reservar?</h2>
          <p style={{ color: T.text2, fontSize: 13.5, marginBottom: 18 }}>Elige un barbero o continúa sin preferencia.</p>
          <div className="public-barberos-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 12, marginBottom: 22 }}>
            <button onClick={() => setBarberoId("")}
              style={{ ...cardStyle, padding: "18px 14px", textAlign: "center", cursor: "pointer", borderColor: barberoId === "" ? "var(--accent)" : T.border, background: barberoId === "" ? "rgba(212,175,55,.06)" : T.elevated }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: "0 0 4px" }}>Sin preferencia</p>
              <p style={{ fontSize: 11, color: T.text2, margin: 0 }}>Cualquier barbero disponible</p>
            </button>
            {barberos.map((b) => (
              <button key={b.id} onClick={() => setBarberoId(b.id)}
                style={{ ...cardStyle, padding: "16px 14px", textAlign: "center", cursor: "pointer", borderColor: barberoId === b.id ? "var(--accent)" : T.border, background: barberoId === b.id ? "rgba(212,175,55,.06)" : T.elevated }}>
                {b.foto ? (
                  <img src={b.foto} alt={b.nombre} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", margin: "0 auto 8px" }} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), #b8942a)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", fontSize: 15, fontWeight: 800, color: "#000" }}>
                    {iniciales(b.nombre, b.apellido)}
                  </div>
                )}
                <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: 0 }}>{b.nombre}</p>
              </button>
            ))}
          </div>
          <button onClick={() => setPaso(2)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "13px 26px", borderRadius: 10, background: "var(--accent)", color: "#000", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
            Continuar <ArrowRight size={15} />
          </button>
        </div>
      )}

      {paso === 2 && (
        <div style={{ maxWidth: 460 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 18 }}>Elige fecha y hora</h2>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 12.5, color: T.text2, display: "block", marginBottom: 6, fontWeight: 600 }}>Fecha</label>
            <input type="date" min={today} value={fecha} onChange={(e) => { setFecha(e.target.value); setHora(""); }}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.elevated, color: T.text, fontSize: 14, boxSizing: "border-box" }} />
          </div>
          {fecha && (
            <div style={{ marginBottom: 22 }}>
              <label style={{ fontSize: 12.5, color: T.text2, display: "block", marginBottom: 8, fontWeight: 600 }}>Hora</label>
              {horasDisponibles.length === 0 ? (
                <p style={{ fontSize: 13, color: T.text2 }}>Cerrado ese día — elige otra fecha.</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))", gap: 8 }}>
                  {horasDisponibles.map((h) => (
                    <button key={h} onClick={() => setHora(h)}
                      style={{ padding: "10px 6px", borderRadius: 8, border: `1px solid ${hora === h ? "var(--accent)" : T.border}`, background: hora === h ? "var(--accent)" : "transparent", color: hora === h ? "#000" : T.text, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                      {h}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button disabled={!fecha || !hora} onClick={() => setPaso(3)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "13px 26px", borderRadius: 10, background: fecha && hora ? "var(--accent)" : "rgba(255,255,255,.06)", color: fecha && hora ? "#000" : T.text2, border: "none", cursor: fecha && hora ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 14 }}>
            Continuar <ArrowRight size={15} />
          </button>
        </div>
      )}

      {paso === 3 && (
        <div style={{ maxWidth: 460 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 18 }}>Tus datos</h2>
          <form onSubmit={(e) => { e.preventDefault(); confirmar(); }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12.5, color: T.text2, display: "block", marginBottom: 6, fontWeight: 600 }}>Nombre completo *</label>
              <input required value={form.nombre} onChange={(e) => set("nombre", e.target.value)}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.elevated, color: T.text, fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12.5, color: T.text2, display: "block", marginBottom: 6, fontWeight: 600 }}>Teléfono *</label>
              <input required value={form.telefono} onChange={(e) => set("telefono", e.target.value)}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.elevated, color: T.text, fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12.5, color: T.text2, display: "block", marginBottom: 6, fontWeight: 600 }}>Correo (opcional)</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.elevated, color: T.text, fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12.5, color: T.text2, display: "block", marginBottom: 6, fontWeight: 600 }}>Notas adicionales</label>
              <textarea rows={3} value={form.notas} onChange={(e) => set("notas", e.target.value)} placeholder="Alguna preferencia especial, alergias, etc."
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.elevated, color: T.text, fontSize: 14, resize: "none", boxSizing: "border-box" }} />
            </div>

            <div style={{ ...cardStyle, padding: 16, marginTop: 4 }}>
              <p style={{ fontSize: 12.5, fontWeight: 700, color: T.text, marginBottom: 8 }}>Resumen</p>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: T.text2, marginBottom: 4 }}>
                <span>{fecha} · {hora}</span>
                <span>{barberoElegido ? barberoElegido.nombre : "Sin preferencia"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, color: T.text, marginTop: 8 }}>
                <span>Total estimado</span>
                <span style={{ color: "var(--accent)" }}>C$ {fmt(totalPrecio)}</span>
              </div>
            </div>

            {error && <p style={{ color: "#ef4444", fontSize: 13, background: "rgba(239,68,68,.1)", padding: "10px 14px", borderRadius: 8 }}>{error}</p>}

            <button type="submit" disabled={enviando}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", borderRadius: 10, background: "var(--accent)", color: "#000", border: "none", cursor: enviando ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 15, opacity: enviando ? .8 : 1 }}>
              {enviando ? <><Loader2 size={17} className="auth-spin" /> Agendando...</> : <><CalendarCheck size={17} /> Confirmar cita</>}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
