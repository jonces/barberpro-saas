"use client";
import { MapPin, Clock, ExternalLink } from "lucide-react";
import { T, cardStyle } from "./theme";
import { calcularEstado, formatearHora, nombreDia, ordenarHorarios } from "@/lib/horarios";

export default function PublicUbicacionHorario({ barberia, horarios }) {
  const tieneUbicacion = barberia?.direccion || barberia?.ciudad;
  const tieneHorario = horarios && horarios.length > 0;
  if (!tieneUbicacion && !tieneHorario) return null;

  const estado = tieneHorario ? calcularEstado(horarios) : null;
  const mapsQuery = [barberia?.direccion, barberia?.ciudad, barberia?.pais].filter(Boolean).join(", ");
  const mapsUrl = mapsQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}` : null;

  return (
    <section style={{ marginBottom: 44 }}>
      <div className="public-2col" style={{ display: "grid", gap: 16 }}>
        {tieneUbicacion && (
          <div style={{ ...cardStyle, padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <MapPin size={18} color="var(--accent)" />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0 }}>Ubicación</h3>
            </div>
            {barberia.direccion && <p style={{ fontSize: 13.5, color: T.text, marginBottom: 4 }}>{barberia.direccion}</p>}
            <p style={{ fontSize: 13.5, color: T.text2, marginBottom: mapsUrl ? 16 : 0 }}>{[barberia.ciudad, barberia.pais].filter(Boolean).join(", ")}</p>
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: "var(--accent)", textDecoration: "none" }}>
                Ver en Google Maps <ExternalLink size={13} />
              </a>
            )}
          </div>
        )}

        {tieneHorario && (
          <div style={{ ...cardStyle, padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Clock size={18} color="var(--accent)" />
                <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: 0 }}>Horario de atención</h3>
              </div>
              {estado?.texto && (
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700, color: estado.abierto ? "#22C55E" : T.text2 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: estado.abierto ? "#22C55E" : "#6B7280" }} />
                  {estado.texto}
                </span>
              )}
            </div>
            {ordenarHorarios(horarios).map((h) => (
              <div key={h.diaSemana} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}`, fontSize: 13 }}>
                <span style={{ color: T.text2 }}>{nombreDia(h.diaSemana)}</span>
                <span style={{ color: T.text, fontWeight: 600 }}>{h.abierto ? `${formatearHora(h.apertura)} – ${formatearHora(h.cierre)}` : "Cerrado"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
