"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { liquidaciones as liqApi } from "@/lib/api";
import {
  ArrowLeft, X, AlertTriangle, Plus, Printer, Ban, CheckCircle2,
} from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("es-NI").format(Number(n) || 0);
const fmtFecha = (d) => d ? new Intl.DateTimeFormat("es-NI", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d)) : "—";
const fmtFechaHora = (d) => d ? new Intl.DateTimeFormat("es-NI", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(d)) : "—";
const ROLES_GESTOR = ["ADMIN", "GERENTE_GENERAL", "SUPERVISOR"];
const ERRORES_SESION = ["Token requerido", "Token inválido", "Sin acceso"];
const ESTADO_BADGE = { PENDIENTE: "badge-yellow", LIQUIDADA: "badge-green", PARCIAL: "badge-blue", ANULADA: "badge-red" };
const METODOS = [["EFECTIVO", "Efectivo"], ["TRANSFERENCIA", "Transferencia"], ["CHEQUE", "Cheque"], ["OTRO", "Otro"]];

function usuarioActual() {
  if (typeof window === "undefined") return {};
  return JSON.parse(localStorage.getItem("usuario") || "{}");
}
function puedeGestionar(u) { return u.isSuperAdmin || ROLES_GESTOR.includes(u.rol); }

function Kpi({ label, value, color, big }) {
  return (
    <div>
      <p style={{ fontSize: 10.5, color: "var(--text2)", textTransform: "uppercase", letterSpacing: .4, marginBottom: 3 }}>{label}</p>
      <p style={{ fontSize: big ? 22 : 16, fontWeight: 800, color: color || "var(--text)" }}>{value}</p>
    </div>
  );
}

/* ─── Modal: Liquidar ───
   Si ya existe una liquidación CONFIRMADA con saldo (`abierta`), esta acción
   abona a esa MISMA liquidación (POST /:id/pagos) en vez de crear una nueva —
   evita que las mismas comisiones se incluyan dos veces. Solo cuando no hay
   ninguna abierta se crea una liquidación nueva para el período actual. */
function ModalLiquidar({ barbero, cuenta, periodo, abierta, onClose, onSaved }) {
  const [paso, setPaso] = useState("revisar");
  const totalAPagar = cuenta.kpis.saldoPendiente;
  const [monto, setMonto] = useState(String(Math.max(0, totalAPagar)));
  const [metodo, setMetodo] = useState("EFECTIVO");
  const [referencia, setReferencia] = useState("");
  const [notas, setNotas] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [comprobante, setComprobante] = useState(null);

  const parcial = Number(monto) < totalAPagar;

  async function confirmar() {
    setLoading(true); setError("");
    try {
      let liq;
      if (abierta) {
        await liqApi.pagar(abierta.id, { monto: Number(monto), metodo, referencia: referencia || undefined, notas: notas || undefined });
        liq = await liqApi.get(abierta.id);
      } else {
        liq = await liqApi.crear({
          barberoId: barbero.id,
          periodoDesde: periodo.desde, periodoHasta: periodo.hasta,
          pago: Number(monto) > 0 ? { monto: Number(monto), metodo, referencia: referencia || undefined, notas: notas || undefined } : undefined,
        });
      }
      setComprobante(liq);
      setPaso("comprobante");
    } catch (e) { setError(e.message); setPaso("revisar"); }
    finally { setLoading(false); }
  }

  if (paso === "comprobante" && comprobante) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 150, padding: 20 }}>
        <div style={{ background: "#fff", color: "#000", borderRadius: 16, padding: 28, maxWidth: 420, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <CheckCircle2 size={36} color="#22c55e" style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 17, fontWeight: 800 }}>Comprobante de liquidación</p>
            <p style={{ fontSize: 12, color: "#666" }}>BarberPro</p>
          </div>
          <hr style={{ border: "none", borderTop: "1px dashed #ccc", margin: "12px 0" }} />
          <div style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Número</span><strong>{comprobante.numero}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Barbero</span><strong>{barbero.nombre}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Período</span><span>{fmtFecha(comprobante.periodoDesde)} – {fmtFecha(comprobante.periodoHasta)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Comisiones</span><span>C$ {fmt(comprobante.totalComisiones)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Propinas</span><span>C$ {fmt(comprobante.totalPropinas)}</span></div>
            {Number(comprobante.totalBonos) > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Bonos</span><span>+C$ {fmt(comprobante.totalBonos)}</span></div>}
            {Number(comprobante.totalDeducciones) > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Deducciones</span><span>-C$ {fmt(comprobante.totalDeducciones)}</span></div>}
            {Number(comprobante.totalAdelantos) > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Adelantos</span><span>-C$ {fmt(comprobante.totalAdelantos)}</span></div>}
            <hr style={{ border: "none", borderTop: "1px dashed #ccc", margin: "6px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 16 }}><span>Total pagado</span><span>C$ {fmt(comprobante.montoPagado)}</span></div>
            {Number(comprobante.montoPagado) < Number(comprobante.montoCalculado) && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "#b45309", fontWeight: 600 }}><span>Saldo pendiente</span><span>C$ {fmt(comprobante.montoCalculado - comprobante.montoPagado)}</span></div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Método</span><span>{METODOS.find(m => m[0] === metodo)?.[1]}</span></div>
            {referencia && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Referencia</span><span>{referencia}</span></div>}
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Fecha</span><span>{fmtFecha(comprobante.creadoEn)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Liquidado por</span><span>{comprobante.creadoPor?.nombre}</span></div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={() => window.print()} style={{ flex: 1, padding: 12, borderRadius: 10, background: "#1a1a1a", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Printer size={15} /> Imprimir
            </button>
            <button onClick={() => onSaved()} style={{ flex: 1, padding: 12, borderRadius: 10, background: "#d4af37", color: "#000", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
              Listo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 150, padding: 20 }}>
      <div className="card-glass" style={{ width: "100%", maxWidth: 440, padding: 26, maxHeight: "90vh", overflowY: "auto", background: "rgba(16,16,18,0.97)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>Liquidar a {barbero.nombre}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer" }}><X size={18} /></button>
        </div>

        {abierta ? (
          <>
            <p style={{ fontSize: 12.5, color: "var(--text2)", marginBottom: 14 }}>
              Ya existe una liquidación abierta (<strong style={{ color: "var(--text)" }}>{abierta.numero}</strong>) — este pago se abona a ella para no duplicar comisiones ya incluidas.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13.5, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text2)" }}>Monto calculado</span><span>C$ {fmt(abierta.montoCalculado)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text2)" }}>Ya pagado</span><span>-C$ {fmt(abierta.montoPagado)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 17, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                <span>SALDO A PAGAR</span><span style={{ color: "var(--accent)" }}>C$ {fmt(totalAPagar)}</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize: 12.5, color: "var(--text2)", marginBottom: 14 }}>Período: {fmtFecha(periodo.desde)} – {fmtFecha(periodo.hasta)}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13.5, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text2)" }}>Comisiones</span><span>C$ {fmt(cuenta.kpis.comision)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text2)" }}>Propinas</span><span>+C$ {fmt(cuenta.kpis.propinas)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text2)" }}>Bonos</span><span>+C$ {fmt(cuenta.kpis.bonos)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text2)" }}>Deducciones</span><span>-C$ {fmt(cuenta.kpis.deducciones)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text2)" }}>Adelantos</span><span>-C$ {fmt(cuenta.kpis.adelantos)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 17, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                <span>TOTAL A PAGAR</span><span style={{ color: "var(--accent)" }}>C$ {fmt(totalAPagar)}</span>
              </div>
            </div>
          </>
        )}

        {totalAPagar <= 0 ? (
          <p style={{ fontSize: 13, color: "var(--text2)" }}>No hay saldo pendiente para este período.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Monto a pagar hoy</label>
              <input className="input" type="number" min="0" max={totalAPagar} step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} />
              {parcial && <p style={{ fontSize: 11.5, color: "var(--orange)", marginTop: 4 }}>Pago parcial — quedará un saldo de C$ {fmt(totalAPagar - Number(monto || 0))}</p>}
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Método</label>
              <select className="input" value={metodo} onChange={(e) => setMetodo(e.target.value)}>
                {METODOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Referencia (opcional)</label>
              <input className="input" value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Nº de transferencia, cheque, etc." />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Notas (opcional)</label>
              <textarea className="input" rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} />
            </div>
            {error && <p style={{ color: "var(--red)", fontSize: 13, background: "rgba(239,68,68,.1)", padding: "10px 14px", borderRadius: 8 }}>{error}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }} disabled={loading}>Cancelar</button>
              <button className="btn btn-primary" onClick={confirmar} style={{ flex: 2 }} disabled={loading || !(Number(monto) >= 0)}>
                {loading ? "Procesando..." : "Confirmar liquidación"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Modal genérico: Adelanto / Ajuste ─── */
function ModalMovimiento({ tipo, barbero, onClose, onSaved }) {
  const esAdelanto = tipo === "adelanto";
  const [monto, setMonto] = useState("");
  const [tipoAjuste, setTipoAjuste] = useState("BONO");
  const [metodo, setMetodo] = useState("EFECTIVO");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function guardar() {
    if (!(Number(monto) > 0)) { setError("El monto debe ser mayor a 0"); return; }
    if (!esAdelanto && !motivo.trim()) { setError("El motivo es obligatorio"); return; }
    setLoading(true); setError("");
    try {
      if (esAdelanto) await liqApi.adelantos.crear({ barberoId: barbero.id, monto: Number(monto), metodo, motivo: motivo || undefined });
      else await liqApi.ajustes.crear({ barberoId: barbero.id, tipo: tipoAjuste, monto: Number(monto), motivo });
      onSaved();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 150, padding: 20 }}>
      <div className="card-glass" style={{ width: "100%", maxWidth: 400, padding: 26, background: "rgba(16,16,18,0.97)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>{esAdelanto ? "Registrar adelanto" : "Registrar bono / ajuste"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer" }}><X size={18} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Barbero</label>
            <p style={{ fontSize: 14, fontWeight: 600 }}>{barbero.nombre}</p>
          </div>
          {!esAdelanto && (
            <div>
              <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Tipo</label>
              <select className="input" value={tipoAjuste} onChange={(e) => setTipoAjuste(e.target.value)}>
                <option value="BONO">Bono (+)</option>
                <option value="AJUSTE_POSITIVO">Ajuste positivo (+)</option>
                <option value="DEDUCCION">Deducción (−)</option>
                <option value="AJUSTE_NEGATIVO">Ajuste negativo (−)</option>
              </select>
            </div>
          )}
          <div>
            <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Monto</label>
            <input className="input" type="number" min="0" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} />
          </div>
          {esAdelanto && (
            <div>
              <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Método</label>
              <select className="input" value={metodo} onChange={(e) => setMetodo(e.target.value)}>
                {METODOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          )}
          <div>
            <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Motivo{!esAdelanto && " *"}</label>
            <textarea className="input" rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </div>
          {error && <p style={{ color: "var(--red)", fontSize: 13, background: "rgba(239,68,68,.1)", padding: "10px 14px", borderRadius: 8 }}>{error}</p>}
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }} disabled={loading}>Cancelar</button>
            <button className="btn btn-primary" onClick={guardar} style={{ flex: 2 }} disabled={loading}>{loading ? "Guardando..." : "Guardar"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EstadoCuenta() {
  const { barberoId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cuenta, setCuenta] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(searchParams.get("liquidar") === "1" ? "liquidar" : null);
  const yo = usuarioActual();
  const puede = puedeGestionar(yo);

  const hoyIso = new Date().toISOString().slice(0, 10);
  const [desde, setDesde] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10); });
  const [hasta, setHasta] = useState(hoyIso);

  const cargar = useCallback(() => {
    Promise.all([
      liqApi.estadoCuenta(barberoId, { desde, hasta }),
      liqApi.list({ barberoId }),
    ]).then(([c, h]) => { setCuenta(c); setHistorial(h); setError(null); }).catch((e) => {
      if (ERRORES_SESION.includes(e.message)) {
        localStorage.removeItem("token"); localStorage.removeItem("usuario");
        router.replace("/login");
        return;
      }
      setError(e.message);
    });
  }, [barberoId, desde, hasta, router]);

  useEffect(() => { cargar(); }, [cargar]);

  function cerrarModal(saved) {
    setModal(null);
    if (searchParams.get("liquidar")) router.replace(`/liquidaciones/${barberoId}`);
    if (saved) cargar();
  }

  async function anular(id) {
    const motivo = window.prompt("Motivo de la anulación:");
    if (!motivo) return;
    try { await liqApi.anular(id, { motivo }); cargar(); } catch (e) { alert(e.message); }
  }

  if (error) return (
    <AppLayout>
      <div className="card-glass" style={{ padding: 32, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, maxWidth: 420, margin: "40px auto" }}>
        <AlertTriangle size={26} color="var(--red)" />
        <p style={{ fontSize: 15, fontWeight: 600 }}>No se pudo cargar el estado de cuenta</p>
        <p style={{ fontSize: 13, color: "var(--text2)" }}>{error}</p>
        <button className="btn btn-primary" onClick={cargar} style={{ marginTop: 6 }}>Reintentar</button>
      </div>
    </AppLayout>
  );
  if (!cuenta) return <AppLayout><p style={{ color: "var(--text2)" }}>Cargando...</p></AppLayout>;

  return (
    <AppLayout>
      <button onClick={() => router.push("/liquidaciones")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--text2)", fontSize: 13, cursor: "pointer", marginBottom: 18 }}>
        <ArrowLeft size={15} /> Volver a Liquidaciones
      </button>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14, marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "var(--accent)", overflow: "hidden", flexShrink: 0 }}>
            {cuenta.barbero.foto ? <img src={cuenta.barbero.foto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : cuenta.barbero.nombre[0]}
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>{cuenta.barbero.nombre}</h1>
            <p style={{ fontSize: 12.5, color: "var(--text2)" }}>Período: {fmtFecha(desde)} – {fmtFecha(hasta)}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", minWidth: 0 }}>
          <input className="input" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} style={{ width: 145, fontSize: 12.5, padding: "7px 10px" }} />
          <input className="input" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} style={{ width: 145, fontSize: 12.5, padding: "7px 10px" }} />
          {puede && (
            <>
              <button className="btn btn-ghost" style={{ fontSize: 12.5, padding: "8px 12px", gap: 5 }} onClick={() => setModal("adelanto")}><Plus size={13} /> Adelanto</button>
              <button className="btn btn-ghost" style={{ fontSize: 12.5, padding: "8px 12px", gap: 5 }} onClick={() => setModal("ajuste")}><Plus size={13} /> Bono/Ajuste</button>
              <button className="btn btn-primary" style={{ fontSize: 12.5, padding: "8px 14px" }} onClick={() => setModal("liquidar")} disabled={cuenta.kpis.saldoPendiente <= 0}>Liquidar</button>
            </>
          )}
        </div>
      </div>

      <div className="card-glass" style={{ padding: 20, marginBottom: 20, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 18 }}>
        <Kpi label="Servicios" value={cuenta.kpis.servicios} big />
        <Kpi label="Ventas generadas" value={`C$ ${fmt(cuenta.kpis.ventasGeneradas)}`} big />
        <Kpi label="Comisión" value={`C$ ${fmt(cuenta.kpis.comision)}`} color="var(--accent)" big />
        <Kpi label="Propinas" value={`C$ ${fmt(cuenta.kpis.propinas)}`} />
        <Kpi label="Adelantos" value={`C$ ${fmt(cuenta.kpis.adelantos)}`} color="var(--red)" />
        <Kpi label="Bonos" value={`C$ ${fmt(cuenta.kpis.bonos)}`} color="var(--green)" />
        <Kpi label="Pagado" value={`C$ ${fmt(cuenta.kpis.pagado)}`} color="var(--green)" />
        <Kpi label="Saldo pendiente" value={`C$ ${fmt(cuenta.kpis.saldoPendiente)}`} color={cuenta.kpis.saldoPendiente > 0 ? "var(--orange)" : "var(--text2)"} big />
      </div>

      <div className="card-glass" style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: 14.5, fontWeight: 700 }}>Detalle de servicios</h3>
        </div>
        {cuenta.detalle.length === 0 ? (
          <p style={{ padding: 24, color: "var(--text2)", fontSize: 13, textAlign: "center" }}>No hay servicios registrados en este período.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th><th>Factura</th><th>Cliente</th><th>Servicio</th><th>Precio</th><th>Desc.</th><th>Neto</th><th>%</th><th>Barbero</th><th>Barbería</th><th>Propina</th><th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {cuenta.detalle.map((d) => (
                  <tr key={d.id}>
                    <td>{fmtFechaHora(d.fecha)}</td>
                    <td>{d.factura}</td>
                    <td>{d.cliente || "—"}</td>
                    <td>{d.servicio}</td>
                    <td>C$ {fmt(d.precio)}</td>
                    <td>{Number(d.descuento) > 0 ? `C$ ${fmt(d.descuento)}` : "—"}</td>
                    <td>C$ {fmt(d.neto)}</td>
                    <td>{Number(d.porcentaje)}%</td>
                    <td>C$ {fmt(d.montoBarbero)}</td>
                    <td>C$ {fmt(d.montoBarberia)}</td>
                    <td>{Number(d.propina) > 0 ? `C$ ${fmt(d.propina)}` : "—"}</td>
                    <td><span className={`badge ${ESTADO_BADGE[d.estado] || "badge-gray"}`}>{d.estado}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card-glass" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: 14.5, fontWeight: 700 }}>Liquidaciones anteriores</h3>
        </div>
        {historial.length === 0 ? (
          <p style={{ padding: 24, color: "var(--text2)", fontSize: 13, textAlign: "center" }}>Todavía no se ha liquidado a este barbero.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {historial.map((h) => (
              <div key={h.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid #1a1a1a", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 600 }}>{h.numero}</p>
                  <p style={{ fontSize: 11.5, color: "var(--text2)" }}>{fmtFecha(h.periodoDesde)} – {fmtFecha(h.periodoHasta)} · {fmtFecha(h.creadoEn)}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>C$ {fmt(h.montoPagado)} / C$ {fmt(h.montoCalculado)}</span>
                  <span className={`badge ${h.estado === "PAGADA" ? "badge-green" : h.estado === "ANULADA" ? "badge-red" : "badge-yellow"}`}>{h.estado}</span>
                  {puede && h.estado !== "ANULADA" && Number(h.montoPagado) === 0 && (
                    <button onClick={() => anular(h.id)} title="Anular" style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", display: "flex", alignItems: "center" }}><Ban size={15} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal === "liquidar" && (
        <ModalLiquidar
          barbero={cuenta.barbero} cuenta={cuenta} periodo={{ desde, hasta }}
          abierta={historial.find((h) => h.estado === "CONFIRMADA") || null}
          onClose={() => cerrarModal(false)} onSaved={() => cerrarModal(true)}
        />
      )}
      {(modal === "adelanto" || modal === "ajuste") && (
        <ModalMovimiento tipo={modal} barbero={cuenta.barbero} onClose={() => cerrarModal(false)} onSaved={() => cerrarModal(true)} />
      )}

      {!puede && (
        <div style={{ marginTop: 16, display: "flex", gap: 8, alignItems: "center", color: "var(--text2)", fontSize: 12.5 }}>
          <AlertTriangle size={14} /> Solo Administrador, Gerente General o Supervisor pueden liquidar, registrar adelantos o ajustes.
        </div>
      )}
    </AppLayout>
  );
}
