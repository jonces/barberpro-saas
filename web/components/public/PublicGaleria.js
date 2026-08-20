"use client";
import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { T } from "./theme";

export default function PublicGaleria({ fotos }) {
  const [verTodas, setVerTodas] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  if (!fotos || fotos.length === 0) return null;

  const visibles = verTodas ? fotos : fotos.slice(0, 6);

  return (
    <section id="galeria" style={{ marginBottom: 44 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ fontSize: 21, fontWeight: 800, color: T.text }}>Galería</h2>
        {fotos.length > 6 && !verTodas && (
          <button onClick={() => setVerTodas(true)} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 13.5, fontWeight: 700 }}>
            Ver más fotos →
          </button>
        )}
      </div>
      <div className="public-galeria-grid" style={{ display: "grid", gap: 10 }}>
        {visibles.map((url, i) => (
          <button key={url + i} onClick={() => setLightbox(i)}
            style={{ padding: 0, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", cursor: "pointer", aspectRatio: "1 / 1", background: "#1a1d24" }}>
            <img src={url} alt={`Foto ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </button>
        ))}
      </div>

      {lightbox !== null && (
        <div role="dialog" aria-modal="true" onClick={() => setLightbox(null)}
          style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,.9)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <button aria-label="Cerrar" onClick={() => setLightbox(null)}
            style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,.1)", border: "none", borderRadius: 8, width: 40, height: 40, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={20} />
          </button>
          {visibles.length > 1 && (
            <button aria-label="Anterior" onClick={(e) => { e.stopPropagation(); setLightbox((i) => (i - 1 + visibles.length) % visibles.length); }}
              style={{ position: "absolute", left: 20, background: "rgba(255,255,255,.1)", border: "none", borderRadius: 8, width: 44, height: 44, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronLeft size={22} />
            </button>
          )}
          <img src={visibles[lightbox]} alt="" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain", borderRadius: 8 }} />
          {visibles.length > 1 && (
            <button aria-label="Siguiente" onClick={(e) => { e.stopPropagation(); setLightbox((i) => (i + 1) % visibles.length); }}
              style={{ position: "absolute", right: 20, background: "rgba(255,255,255,.1)", border: "none", borderRadius: 8, width: 44, height: 44, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronRight size={22} />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
