export const T = {
  bg: "#080A0D",
  surface: "#0E1116",
  elevated: "#131720",
  border: "rgba(255,255,255,.10)",
  text: "#F5F5F5",
  text2: "#9CA3AF",
  green: "#22C55E",
};

export const fmt = (n) => new Intl.NumberFormat("es-NI").format(Number(n) || 0);

export const cardStyle = {
  background: T.elevated,
  border: `1px solid ${T.border}`,
  borderRadius: 14,
  transition: "border-color .15s, transform .15s",
};

export function iniciales(nombre, apellido) {
  const a = (nombre || "").trim()[0] || "";
  const b = (apellido || "").trim()[0] || "";
  return (a + b).toUpperCase() || "?";
}
