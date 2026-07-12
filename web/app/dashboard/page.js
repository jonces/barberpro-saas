"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { dashboard } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

function StatCard({ icon, label, value, sub, color = "var(--accent)" }) {
  return (
    <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <p style={{ fontSize: 26, fontWeight: 700, color }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: "var(--text2)" }}>{sub}</p>}
    </div>
  );
}

const fmt = (n) => new Intl.NumberFormat("es-NI", { minimumFractionDigits: 0 }).format(n || 0);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    if (usuario.rol === "SUPERADMIN") { router.replace("/superadmin"); return; }
    dashboard.get().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <AppLayout title="Dashboard"><p style={{ color: "var(--text2)" }}>Cargando...</p></AppLayout>;
  if (!data) return <AppLayout title="Dashboard"><p style={{ color: "var(--text2)" }}>Sin datos</p></AppLayout>;

  return (
    <AppLayout title="Dashboard">
      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard icon="💰" label="Ventas del día" value={`C$ ${fmt(data.ventasHoy.total)}`} sub={`${data.ventasHoy.cantidad} ventas hoy`} color="var(--green)" />
        <StatCard icon="📈" label="Ventas del mes" value={`C$ ${fmt(data.ventasMes.total)}`} sub={`${data.ventasMes.cantidad} ventas este mes`} />
        <StatCard icon="👤" label="Clientes" value={fmt(data.clientesTotal)} sub={`+${data.clientesNuevosMes} nuevos este mes`} color="var(--blue)" />
        <StatCard icon="📅" label="Citas hoy" value={data.citasHoy} sub="pendientes / confirmadas" color="#a855f7" />
        <StatCard icon="💼" label="Caja" value={data.cajaActiva ? "Abierta" : "Cerrada"} sub={data.cajaActiva ? "En operación" : "Sin caja abierta"} color={data.cajaActiva ? "var(--green)" : "var(--red)"} />
        <StatCard icon="⚠️" label="Stock bajo" value={data.inventarioBajo} sub="productos con poco stock" color={data.inventarioBajo > 0 ? "var(--red)" : "var(--green)"} />
      </div>

      {/* Gráficos */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        {/* Ventas 7 días */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 20, color: "var(--text)" }}>Ventas últimos 7 días</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.graficoVentas}>
              <XAxis dataKey="fecha" tick={{ fill: "var(--text2)", fontSize: 11 }} tickFormatter={v => v.split("-").slice(1).join("/")} />
              <YAxis tick={{ fill: "var(--text2)", fontSize: 11 }} />
              <Tooltip formatter={(v) => [`C$ ${fmt(v)}`, "Ventas"]} contentStyle={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }} />
              <Bar dataKey="total" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top servicios */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "var(--text)" }}>Top Servicios del Mes</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {(data.topServicios || []).length === 0 && <p style={{ color: "var(--text2)", fontSize: 13 }}>Sin datos aún</p>}
            {(data.topServicios || []).map((s, i) => (
              <div key={s.nombre} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--accent-dim)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 500 }}>{s.nombre}</p>
                  <p style={{ fontSize: 11, color: "var(--text2)" }}>{s._sum.cantidad} veces · C$ {fmt(s._sum.subtotal)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
