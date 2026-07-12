"use client";
import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { caja as cajaApi, ventas as ventaApi } from "@/lib/api";

const fmt = (n) => new Intl.NumberFormat("es-NI").format(Number(n) || 0);

export default function Caja() {
  const [cajaActiva, setCajaActiva] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [ventasHoy, setVentasHoy] = useState([]);
  const [montoApertura, setMontoApertura] = useState("");
  const [montoCierre, setMontoCierre] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("resumen"); // resumen | movimientos | ventas

  async function cargar() {
    setLoading(true);
    try {
      const c = await cajaApi.activa();
      setCajaActiva(c);
      if (c) {
        const [movs, ventas] = await Promise.all([cajaApi.movimientos(c.id), ventaApi.list()]);
        setMovimientos(movs);
        setVentasHoy(ventas.filter(v => v.cajaId === c.id));
      }
    } finally { setLoading(false); }
  }
  useEffect(() => { cargar(); }, []);

  async function abrirCaja() {
    if (!montoApertura) return alert("Ingresa el monto inicial");
    try {
      await cajaApi.abrir({ montoInicial: Number(montoApertura), nombre: "Caja Principal" });
      setMontoApertura("");
      cargar();
    } catch (e) { alert(e.message); }
  }

  async function cerrarCaja() {
    if (!montoCierre) return alert("Ingresa el monto final contado");
    if (!confirm("¿Confirmas el cierre de caja?")) return;
    try {
      await cajaApi.cerrar(cajaActiva.id, { montoFinal: Number(montoCierre) });
      setMontoCierre("");
      cargar();
    } catch (e) { alert(e.message); }
  }

  const esperado = cajaActiva ? Number(cajaActiva.montoInicial) + Number(cajaActiva.totalVentas) : 0;
  const diferencia = montoCierre ? Number(montoCierre) - esperado : null;

  if (loading) return <AppLayout title="Caja"><p style={{ color: "var(--text2)" }}>Cargando...</p></AppLayout>;

  return (
    <AppLayout title="Caja">
      {!cajaActiva ? (
        // Abrir caja
        <div style={{ maxWidth: 480, margin: "0 auto", paddingTop: 40 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>💰</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>No hay caja abierta</h2>
            <p style={{ color: "var(--text2)" }}>Abre la caja para comenzar a registrar ventas</p>
          </div>
          <div className="card" style={{ padding: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Apertura de Caja</h3>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, color: "var(--text2)", display: "block", marginBottom: 8 }}>Monto inicial en efectivo (C$)</label>
              <input className="input" type="number" min="0" placeholder="0.00" value={montoApertura} onChange={e => setMontoApertura(e.target.value)} style={{ fontSize: 22, fontWeight: 700, textAlign: "center" }} />
            </div>
            <button className="btn btn-primary" onClick={abrirCaja} style={{ width: "100%", padding: 14, fontSize: 16 }}>
              🔓 Abrir Caja
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Header caja activa */}
          <div className="card" style={{ padding: 20, marginBottom: 20, borderColor: "rgba(34,197,94,.3)", background: "rgba(34,197,94,.05)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(34,197,94,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>💰</div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 16 }}>{cajaActiva.nombre}</p>
                  <p style={{ fontSize: 13, color: "var(--green)" }}>● Abierta · desde {new Date(cajaActiva.abiertoEn).toLocaleTimeString("es-NI", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 24 }}>
                <div style={{ textAlign: "center" }}><p style={{ fontSize: 22, fontWeight: 700 }}>C$ {fmt(cajaActiva.montoInicial)}</p><p style={{ fontSize: 12, color: "var(--text2)" }}>Monto inicial</p></div>
                <div style={{ textAlign: "center" }}><p style={{ fontSize: 22, fontWeight: 700, color: "var(--accent)" }}>C$ {fmt(cajaActiva.totalVentas)}</p><p style={{ fontSize: 12, color: "var(--text2)" }}>Ventas</p></div>
                <div style={{ textAlign: "center" }}><p style={{ fontSize: 22, fontWeight: 700, color: "var(--green)" }}>C$ {fmt(esperado)}</p><p style={{ fontSize: 12, color: "var(--text2)" }}>Esperado en caja</p></div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {[["resumen","📊 Resumen"],["movimientos","📋 Movimientos"],["ventas","🧾 Ventas"],["cerrar","🔒 Cerrar Caja"]].map(([v,l]) => (
              <button key={v} className={`btn ${view === v ? v === "cerrar" ? "btn-danger" : "btn-primary" : "btn-ghost"}`} onClick={() => setView(v)}>{l}</button>
            ))}
          </div>

          {view === "resumen" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
              {[
                { label: "Total ventas", value: ventasHoy.length, icon: "🧾", color: "var(--accent)" },
                { label: "Ingresos del día", value: `C$ ${fmt(cajaActiva.totalVentas)}`, icon: "💰", color: "var(--green)" },
                { label: "Monto inicial", value: `C$ ${fmt(cajaActiva.montoInicial)}`, icon: "🏦", color: "var(--text)" },
                { label: "Total en caja", value: `C$ ${fmt(esperado)}`, icon: "📦", color: "var(--blue)" },
              ].map(s => (
                <div key={s.label} className="card" style={{ padding: 20 }}>
                  <span style={{ fontSize: 26 }}>{s.icon}</span>
                  <p style={{ fontSize: 24, fontWeight: 700, color: s.color, marginTop: 10 }}>{s.value}</p>
                  <p style={{ fontSize: 13, color: "var(--text2)" }}>{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {view === "movimientos" && (
            <div className="card" style={{ overflow: "hidden" }}>
              <table>
                <thead><tr><th>Tipo</th><th>Descripción</th><th>Monto</th><th>Hora</th></tr></thead>
                <tbody>
                  {movimientos.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--text2)", padding: 30 }}>Sin movimientos</td></tr>}
                  {movimientos.map(m => (
                    <tr key={m.id}>
                      <td><span className={`badge ${m.tipo === "VENTA" || m.tipo === "ENTRADA" || m.tipo === "APERTURA" ? "badge-green" : "badge-red"}`}>{m.tipo}</span></td>
                      <td style={{ color: "var(--text2)" }}>{m.descripcion || "—"}</td>
                      <td style={{ fontWeight: 600, color: "var(--accent)" }}>C$ {fmt(m.monto)}</td>
                      <td style={{ color: "var(--text2)", fontSize: 13 }}>{new Date(m.creadoEn).toLocaleTimeString("es-NI", { hour: "2-digit", minute: "2-digit" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {view === "ventas" && (
            <div className="card" style={{ overflow: "hidden" }}>
              <table>
                <thead><tr><th>Recibo</th><th>Cliente</th><th>Items</th><th>Total</th><th>Hora</th></tr></thead>
                <tbody>
                  {ventasHoy.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text2)", padding: 30 }}>Sin ventas en esta caja</td></tr>}
                  {ventasHoy.map(v => (
                    <tr key={v.id}>
                      <td style={{ fontWeight: 600, color: "var(--accent)", fontSize: 13 }}>{v.numeroRecibo}</td>
                      <td>{v.cliente ? `${v.cliente.nombre}` : <span style={{ color: "var(--text2)" }}>Sin cliente</span>}</td>
                      <td style={{ color: "var(--text2)" }}>{v.items?.length || 0} items</td>
                      <td style={{ fontWeight: 700 }}>C$ {fmt(v.total)}</td>
                      <td style={{ color: "var(--text2)", fontSize: 13 }}>{new Date(v.creadoEn).toLocaleTimeString("es-NI", { hour: "2-digit", minute: "2-digit" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {view === "cerrar" && (
            <div style={{ maxWidth: 480, margin: "0 auto" }}>
              <div className="card" style={{ padding: 28 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Cierre de Caja</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ color: "var(--text2)" }}>Monto inicial</span>
                    <span style={{ fontWeight: 600 }}>C$ {fmt(cajaActiva.montoInicial)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ color: "var(--text2)" }}>Ventas del día</span>
                    <span style={{ fontWeight: 600, color: "var(--green)" }}>+ C$ {fmt(cajaActiva.totalVentas)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontWeight: 600 }}>Esperado en caja</span>
                    <span style={{ fontWeight: 700, fontSize: 18, color: "var(--accent)" }}>C$ {fmt(esperado)}</span>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, color: "var(--text2)", display: "block", marginBottom: 8 }}>Efectivo contado en caja (C$)</label>
                  <input className="input" type="number" min="0" placeholder="0.00" value={montoCierre} onChange={e => setMontoCierre(e.target.value)} style={{ fontSize: 22, fontWeight: 700, textAlign: "center" }} />
                </div>
                {diferencia !== null && (
                  <div style={{ padding: "12px 16px", borderRadius: 8, marginBottom: 16, background: diferencia === 0 ? "rgba(34,197,94,.1)" : diferencia > 0 ? "rgba(59,130,246,.1)" : "rgba(239,68,68,.1)", color: diferencia === 0 ? "var(--green)" : diferencia > 0 ? "var(--blue)" : "var(--red)" }}>
                    <p style={{ fontWeight: 700 }}>{diferencia === 0 ? "✅ Caja cuadrada" : diferencia > 0 ? `📈 Sobrante: C$ ${fmt(diferencia)}` : `⚠️ Faltante: C$ ${fmt(Math.abs(diferencia))}`}</p>
                  </div>
                )}
                <button className="btn btn-danger" onClick={cerrarCaja} style={{ width: "100%", padding: 14, fontSize: 15 }}>
                  🔒 Confirmar Cierre de Caja
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
