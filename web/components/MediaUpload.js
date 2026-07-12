"use client";
import { useRef, useState } from "react";
import { upload } from "@/lib/api";

export default function MediaUpload({ foto, video, onFoto, onVideo, label = "Foto / Video" }) {
  const inputRef = useRef();
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(""); setSubiendo(true);
    try {
      const result = await upload.file(file);
      if (result.tipo === "video") { onVideo(result.url); }
      else { onFoto(result.url); }
    } catch (err) { setError(err.message); }
    finally { setSubiendo(false); e.target.value = ""; }
  }

  const tieneMedia = foto || video;

  return (
    <div>
      <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 8 }}>{label}</label>

      {/* Preview actual */}
      {tieneMedia && (
        <div style={{ position: "relative", marginBottom: 10, borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)" }}>
          {video ? (
            <video src={video} controls style={{ width: "100%", maxHeight: 200, display: "block", background: "#000" }} />
          ) : (
            <img src={foto} alt="" style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} onError={e => e.target.style.display = "none"} />
          )}
          <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 6 }}>
            {foto && <button type="button" onClick={() => onFoto("")} style={{ background: "rgba(239,68,68,.9)", border: "none", color: "#fff", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 12 }}>✕ foto</button>}
            {video && <button type="button" onClick={() => onVideo("")} style={{ background: "rgba(239,68,68,.9)", border: "none", color: "#fff", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 12 }}>✕ video</button>}
          </div>
        </div>
      )}

      {/* Botón de subida */}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm" onChange={handleFile} style={{ display: "none" }} />
      <button type="button" onClick={() => inputRef.current.click()} disabled={subiendo}
        style={{ width: "100%", padding: "12px", borderRadius: 10, border: "2px dashed var(--border)", background: "transparent", color: subiendo ? "var(--text2)" : "var(--text)", cursor: subiendo ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "border-color .15s" }}
        onMouseEnter={e => !subiendo && (e.currentTarget.style.borderColor = "var(--accent)")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}>
        {subiendo ? (
          <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span> Subiendo...</>
        ) : (
          <><span style={{ fontSize: 20 }}>📁</span> {tieneMedia ? "Cambiar archivo" : "Subir foto o video"}<br /><span style={{ fontSize: 11, color: "var(--text2)", fontWeight: 400 }}>JPG, PNG, WebP, GIF, MP4, MOV · desde tu celular o computadora</span></>
        )}
      </button>
      {error && <p style={{ fontSize: 12, color: "var(--red)", marginTop: 6 }}>⚠️ {error}</p>}
    </div>
  );
}
