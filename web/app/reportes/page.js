"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { ventas as ventaApi, liquidaciones as liqApi, comisiones as comisionApi } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Download } from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("es-NI").format(Number(n) || 0);
const PIE_COLORS = ["#d4af37","#3b82f6","#22c55e","#ef4444","#a855f7","#f97316"];
const ROL_LABEL = { ADMIN: "Administrador", GERENTE_GENERAL: "Gerente General", SUPERVISOR: "Supervisor de Barbería" };

function usuarioActual() {
  if (typeof window === "undefined") return {};
  return JSON.parse(localStorage.getItem("usuario") || "{}");
}

function descargarCSV(nombre, filas) {
  if (!filas.length) return;
  const encabezados = Object.keys(filas[0]);
  const csv = [encabezados.join(","), ...filas.map(f => encabezados.map(h => `"${String(f[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nombre; a.click();
  URL.revokeObjectURL(url);
}

/* ─── Reporte de comisiones ─── */
function ReporteComisiones({ desde, hasta }) {
  const [resumen, setResumen] = useState(null);
  const [barberos, setBarberos] = useState(null);
  const [historial, setHistorial] = useState([]);
  const usuario = usuarioActual();
  const puedeExportar = usuario.isSuperAdmin || (usuario.permisos || []).includes("exportar_reportes");

  useEffect(() => {
    Promise.all([
      liqApi.resumen({ desde, hasta }),
      liqApi.barberos({ desde, hasta }),
      comisionApi.historial({}),
    ]).then(([r, b, h]) => { setResumen(r); setBarberos(b); setHistorial(h); });
  }, [desde, hasta]);

  function exportar() {
    descargarCSV(`comisiones_${desde}_${hasta}.csv`, barberos.map(b => ({
      Barbero: b.nombre, Servicios: b.servicios, "Ventas generadas": b.ventasGeneradas,
      "Participación barbero": b.participacionBarbero, "Participación barbería": b.participacionBarberia,
      Propinas: b.propinas, Pagado: b.pagado, "Saldo pendiente": b.saldoPendiente,
    })));
  }

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 20 }}>
        {resumen && [
          ["Ventas de servicios", resumen.ventasServicios], ["Participación barbería", resumen.participacionBarberia],
          ["Generado para barberos", resumen.generadoBarberos], ["Pendiente de liquidar", resumen.pendienteLiquidar],
          ["Ya liquidado", resumen.yaLiquidado], ["Propinas", resumen.propinas],
        ].map(([label, value]) => (
          <div key={label} className="card-glass" style={{ padding: 16 }}>
            <p style={{ fontSize: 10.5, color: "var(--text2)", textTransform: "uppercase", letterSpacing: .4, marginBottom: 6 }}>{label}</p>
            <p style={{ fontSize: 19, fontWeight: 800 }}>C$ {fmt(value)}</p>
          </div>
        ))}
      </div>

      <div className="card-glass" style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: 14.5, fontWeight: 700 }}>Comisiones por barbero</h3>
          {puedeExportar && barberos?.length > 0 && (
            <button onClick={exportar} className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 12px", gap: 5 }}><Download size={13} /> Exportar CSV</button>
          )}
        </div>
        {barberos === null ? (
          <p style={{ padding: 24, color: "var(--text2)", fontSize: 13, textAlign: "center" }}>Cargando...</p>
        ) : barberos.length === 0 ? (
          <p style={{ padding: 24, color: "var(--text2)", fontSize: 13, textAlign: "center" }}>No hay barberos registrados.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead><tr><th>Barbero</th><th>Servicios</th><th>Ventas generadas</th><th>Participación barbero</th><th>Participación barbería</th><th>Propinas</th><th>Pagado</th><th>Saldo pendiente</th><th></th></tr></thead>
              <tbody>
                {barberos.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600 }}>{b.nombre}</td>
                    <td>{b.servicios}</td>
                    <td>C$ {fmt(b.ventasGeneradas)}</td>
                    <td style={{ color: "var(--accent)", fontWeight: 600 }}>C$ {fmt(b.participacionBarbero)}</td>
                    <td>C$ {fmt(b.participacionBarberia)}</td>
                    <td>C$ {fmt(b.propinas)}</td>
                    <td style={{ color: "var(--green)" }}>C$ {fmt(b.pagado)}</td>
                    <td style={{ fontWeight: 700, color: b.saldoPendiente > 0 ? "var(--orange)" : "var(--text2)" }}>C$ {fmt(b.saldoPendiente)}</td>
                    <td><Link href={`/liquidaciones/${b.id}`} style={{ color: "var(--accent)", fontSize: 12.5 }}>Ver →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card-glass" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: 14.5, fontWeight: 700 }}>Historial de cambios de comisión</h3>
        </div>
        {historial.length === 0 ? (
          <p style={{ padding: 24, color: "var(--text2)", fontSize: 13, textAlign: "center" }}>Sin cambios registrados todavía.</p>
        ) : (
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            {historial.map((h) => (
              <div key={h.id} className="timeline-item">
                <p style={{ fontSize: 11.5, color: "#555", marginBottom: 4 }}>{new Intl.DateTimeFormat("es-NI", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(h.creadoEn))}</p>
                <p style={{ fontSize: 13 }}>
                  {h.barberoPctAnterior !== null ? <>Anterior: <strong>{Number(h.barberoPctAnterior)}%</strong> / {Number(h.barberiaPctAnterior)}% → </> : ""}
                  Nuevo: <strong style={{ color: "var(--accent)" }}>{Number(h.barberoPctNuevo)}%</strong> / {Number(h.barberiaPctNuevo)}%
                </p>
                {h.motivo && <p style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>Motivo: {h.motivo}</p>}
                <p style={{ fontSize: 11.5, color: "var(--text2)", marginTop: 2 }}>Modificado por {h.actorNombre} · {ROL_LABEL[h.actorRol] || h.actorRol}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function Reportes() {
  const [tab, setTab] = useState("ventas");
  const [ventas, setVentas] = useState([]);
  const [desde, setDesde] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split("T")[0]; });
  const [hasta, setHasta] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  async function cargar() {
    setLoading(true);
    ventaApi.list({ desde, hasta }).then(setVentas).finally(() => setLoading(false));
  }
  useEffect(() => { cargar(); }, [desde, hasta]);

  const totalIngresos = ventas.reduce((s, v) => s + Number(v.total), 0);
  const ticketPromedio = ventas.length ? totalIngresos / ventas.length : 0;

  // Ventas por día
  const porDia = ventas.reduce((acc, v) => {
    const d = new Date(v.creadoEn).toLocaleDateString("es-NI", { day: "2-digit", month: "2-digit" });
    acc[d] = (acc[d] || 0) + Number(v.total);
    return acc;
  }, {});
  const graficoDia = Object.entries(porDia).map(([fecha, total]) => ({ fecha, total })).slice(-14);

  // Servicios más vendidos
  const serviciosCount = {};
  ventas.forEach(v => v.items?.filter(i => i.servicioId).forEach(i => {
    serviciosCount[i.nombre] = (serviciosCount[i.nombre] || 0) + i.cantidad;
  }));
  const topServicios = Object.entries(serviciosCount).map(([nombre, cantidad]) => ({ nombre, cantidad })).sort((a,b) => b.cantidad - a.cantidad).slice(0, 6);

  return (
    <AppLayout title="Reportes">
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[["ventas", "Ventas"], ["comisiones", "Comisiones"]].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "9px 18px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13,
            background: tab === t ? "var(--accent)" : "var(--surface)", color: tab === t ? "#000" : "var(--text2)",
          }}>{l}</button>
        ))}
      </div>

      {/* Filtros (compartidos) */}
      <div className="card" style={{ padding: 16, marginBottom: 20, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 13, color: "var(--text2)" }}>Desde</label>
          <input type="date" className="input" value={desde} onChange={e => setDesde(e.target.value)} style={{ width: "auto" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 13, color: "var(--text2)" }}>Hasta</label>
          <input type="date" className="input" value={hasta} onChange={e => setHasta(e.target.value)} style={{ width: "auto" }} />
        </div>
        {[
          { label: "Hoy", fn: () => { const h = new Date().toISOString().split("T")[0]; setDesde(h); setHasta(h); } },
          { label: "Este mes", fn: () => { const d = new Date(); d.setDate(1); setDesde(d.toISOString().split("T")[0]); setHasta(new Date().toISOString().split("T")[0]); } },
          { label: "Mes anterior", fn: () => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth()-1); const h = new Date(d); h.setMonth(h.getMonth()+1); h.setDate(0); setDesde(d.toISOString().split("T")[0]); setHasta(h.toISOString().split("T")[0]); } },
        ].map(b => <button key={b.label} className="btn btn-ghost" onClick={b.fn} style={{ fontSize: 13 }}>{b.label}</button>)}
      </div>

      {tab === "comisiones" ? <ReporteComisiones desde={desde} hasta={hasta} /> : (
        <>
          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
            {[
              { label: "Total ventas", value: ventas.length, icon: "🧾", color: "var(--text)" },
              { label: "Ingresos", value: `C$ ${fmt(totalIngresos)}`, icon: "💰", color: "var(--accent)" },
              { label: "Ticket promedio", value: `C$ ${fmt(ticketPromedio)}`, icon: "📊", color: "var(--blue)" },
              { label: "Ventas anuladas", value: ventas.filter(v => v.estado === "ANULADA").length, icon: "❌", color: "var(--red)" },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: 18 }}>
                <span style={{ fontSize: 22 }}>{s.icon}</span>
                <p style={{ fontSize: 24, fontWeight: 700, color: s.color, marginTop: 8 }}>{s.value}</p>
                <p style={{ fontSize: 12, color: "var(--text2)" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Gráficos */}
          <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16, marginBottom: 20 }}>
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Ingresos por día</h3>
              {loading ? <p style={{ color: "var(--text2)", textAlign: "center", padding: 40 }}>Cargando...</p> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={graficoDia}>
                    <XAxis dataKey="fecha" tick={{ fill: "var(--text2)", fontSize: 11 }} />
                    <YAxis tick={{ fill: "var(--text2)", fontSize: 11 }} />
                    <Tooltip formatter={v => [`C$ ${fmt(v)}`, "Total"]} contentStyle={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }} />
                    <Bar dataKey="total" fill="var(--accent)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Servicios más vendidos</h3>
              {topServicios.length === 0 ? <p style={{ color: "var(--text2)", textAlign: "center", padding: 40, fontSize: 13 }}>Sin datos</p> : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={topServicios} dataKey="cantidad" nameKey="nombre" cx="50%" cy="50%" outerRadius={80} label={({ nombre, percent }) => `${nombre} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                      {topServicios.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Tabla de ventas */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 14, fontWeight: 600 }}>Detalle de ventas ({ventas.length})</h3>
            </div>
            <table>
              <thead><tr><th>Recibo</th><th>Fecha</th><th>Cliente</th><th>Items</th><th>Total</th><th>Estado</th></tr></thead>
              <tbody>
                {loading && <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text2)", padding: 30 }}>Cargando...</td></tr>}
                {!loading && ventas.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text2)", padding: 30 }}>Sin ventas en el período</td></tr>}
                {ventas.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 600, fontSize: 13, color: "var(--accent)" }}>{v.numeroRecibo}</td>
                    <td style={{ fontSize: 13, color: "var(--text2)" }}>{new Date(v.creadoEn).toLocaleDateString("es-NI")} {new Date(v.creadoEn).toLocaleTimeString("es-NI", { hour: "2-digit", minute: "2-digit" })}</td>
                    <td>{v.cliente ? `${v.cliente.nombre}` : <span style={{ color: "var(--text2)" }}>—</span>}</td>
                    <td style={{ color: "var(--text2)" }}>{v.items?.length || 0}</td>
                    <td style={{ fontWeight: 700 }}>C$ {fmt(v.total)}</td>
                    <td><span className={`badge ${v.estado === "COMPLETADA" ? "badge-green" : v.estado === "ANULADA" ? "badge-red" : "badge-yellow"}`}>{v.estado}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AppLayout>
  );
}
