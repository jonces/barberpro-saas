import { Scissors } from "lucide-react";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#080A0D", color: "#F5F5F5", textAlign: "center", padding: 24 }}>
      <Scissors size={40} color="var(--accent)" style={{ marginBottom: 16 }} />
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>Barbería no encontrada</h1>
      <p style={{ color: "#9CA3AF", fontSize: 14 }}>Verifica el enlace o contacta a la barbería.</p>
    </div>
  );
}
