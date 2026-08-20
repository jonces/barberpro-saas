"use client";
import { Phone, Mail, AtSign, ThumbsUp, Music2, MessageCircle, CreditCard, Banknote, Landmark } from "lucide-react";
import { T, cardStyle } from "./theme";

const METODO_ICONOS = { efectivo: Banknote, tarjeta: CreditCard, transferencia: Landmark };
const METODO_LABELS = { efectivo: "Efectivo", tarjeta: "Tarjeta", transferencia: "Transferencia" };

export default function PublicContacto({ barberia }) {
  const whatsapp = barberia?.configuracion?.whatsapp;
  const tiktok = barberia?.configuracion?.tiktok;
  const metodosPago = Array.isArray(barberia?.configuracion?.metodosPago) ? barberia.configuracion.metodosPago : [];

  const canales = [
    barberia?.telefono && { icon: Phone, label: barberia.telefono, href: `tel:${barberia.telefono}` },
    barberia?.email && { icon: Mail, label: barberia.email, href: `mailto:${barberia.email}` },
    whatsapp && { icon: MessageCircle, label: "WhatsApp", href: `https://wa.me/${whatsapp.replace(/\D/g, "")}` },
    barberia?.instagram && { icon: AtSign, label: "Instagram", href: barberia.instagram.startsWith("http") ? barberia.instagram : `https://instagram.com/${barberia.instagram.replace("@", "")}` },
    barberia?.facebook && { icon: ThumbsUp, label: "Facebook", href: barberia.facebook.startsWith("http") ? barberia.facebook : `https://facebook.com/${barberia.facebook}` },
    tiktok && { icon: Music2, label: "TikTok", href: tiktok.startsWith("http") ? tiktok : `https://tiktok.com/@${tiktok.replace("@", "")}` },
  ].filter(Boolean);

  if (canales.length === 0 && metodosPago.length === 0) return null;

  return (
    <section id="contacto" style={{ marginBottom: 44 }}>
      <h2 style={{ fontSize: 21, fontWeight: 800, color: T.text, marginBottom: 20 }}>Contáctanos</h2>
      <div className={metodosPago.length ? "public-2col" : undefined} style={{ display: "grid", gap: 16, ...(metodosPago.length ? {} : { gridTemplateColumns: "1fr" }) }}>
        {canales.length > 0 && (
          <div style={{ ...cardStyle, padding: 22, display: "flex", flexDirection: "column", gap: 10 }}>
            {canales.map(({ icon: Icon, label, href }) => (
              <a key={label + href} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 10, color: T.text, textDecoration: "none", fontSize: 13.5, fontWeight: 600 }}>
                <span style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(212,175,55,.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={15} color="var(--accent)" />
                </span>
                {label}
              </a>
            ))}
          </div>
        )}
        {metodosPago.length > 0 && (
          <div style={{ ...cardStyle, padding: 22 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>Métodos de pago aceptados</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {metodosPago.map((m) => {
                const Icon = METODO_ICONOS[m] || Banknote;
                return (
                  <span key={m} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.06)", border: `1px solid ${T.border}`, borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: T.text }}>
                    <Icon size={13} color="var(--accent)" /> {METODO_LABELS[m] || m}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
