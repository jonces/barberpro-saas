"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { liquidaciones as liqApi } from "@/lib/api";
import {
  DollarSign, Scissors, HandCoins, Clock, CheckCircle2, Gift, ArrowRight,
} from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("es-NI").format(Number(n) || 0);

const PERIODOS = [
  { id: "hoy", label: "Hoy" },
  { id: "semana", label: "Esta semana" },
  { id: "quincena", label: "Quincena" },
  { id: "mes", label: "Este mes" },
  { id: "personalizado", label: "Personalizado" },
];

function rangoPara(periodo, desdeCustom, hastaCustom) {
  const hoy = new Date(); hoy.setHours(23, 59, 59, 999);
  const desde = new Date();
  if (periodo === "hoy") desde.setHours(0, 0, 0, 0);
  else if (periodo === "semana") { desde.setDate(desde.getDate() - 7); desde.setHours(0, 0, 0, 0); }
  else if (periodo === "quincena") { desde.setDate(desde.getDate() - 15); desde.setHours(0, 0, 0, 0); }
  else if (periodo === "mes") { desde.setDate(1); desde.setHours(0, 0, 0, 0); }
  else if (periodo === "personalizado") return { desde: desdeCustom, hasta: hastaCustom };
  return { desde: desde.toISOString().slice(0, 10), hasta: hoy.toISOString().slice(0, 10) };
}

function KpiCard({ icon: Icon, iconColor, label, value, sub }) {
  return (
    <div className="card-glass" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 11, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: "var(--text2)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px" }}>{label}</span>
        <span style={{ width: 30, height: 30, borderRadius: 9, background: `${iconColor}1f`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={15} color={iconColor} />
        </span>
      </div>
      <p style={{ fontSize: 23, fontWeight: 800, color: "var(--text)", lineHeight: 1.1, letterSpacing: "-.3px" }}>{value}</p>
      {sub && <p style={{ fontSize: 11.5, color: "var(--text2)" }}>{sub}</p>}
    </div>
  );
}

export default function Liquidaciones() {
  const router = useRouter();
  const [periodo, setPeriodo] = useState("semana");
  const hoyIso = new Date().toISOString().slice(0, 10);
  const [desdeCustom, setDesdeCustom] = useState(hoyIso);
  const [hastaCustom, setHastaCustom] = useState(hoyIso);
  const [resumen, setResumen] = useState(null);
  const [barberos, setBarberos] = useState(null);

  const cargar = useCallback(() => {
    const { desde, hasta } = rangoPara(periodo, desdeCustom, hastaCustom);
    Promise.all([liqApi.resumen({ desde, hasta }), liqApi.barberos({ desde, hasta })])
      .then(([r, b]) => { setResumen(r); setBarberos(b); })
      .catch(() => { setResumen({}); setBarberos([]); });
  }, [periodo, desdeCustom, hastaCustom]);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <AppLayout>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 14, marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>Liquidaciones</h1>
          <p style={{ fontSize: 13.5, color: "var(--text2)", marginTop: 4, textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}>Controla las comisiones, saldos y pagos de tu equipo.</p>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", minWidth: 0 }}>
          {PERIODOS.map((p) => (
            <button key={p.id} onClick={() => setPeriodo(p.id)} style={{
              padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              border: periodo === p.id ? "1px solid var(--accent)" : "1px solid var(--border)",
              background: periodo === p.id ? "var(--accent-dim)" : "var(--surface2)",
              color: periodo === p.id ? "var(--accent)" : "var(--text2)",
            }}>{p.label}</button>
          ))}
          {periodo === "personalizado" && (
            <>
              <input className="input" type="date" value={desdeCustom} onChange={(e) => setDesdeCustom(e.target.value)} style={{ width: 145, fontSize: 12.5, padding: "7px 10px" }} />
              <input className="input" type="date" value={hastaCustom} onChange={(e) => setHastaCustom(e.target.value)} style={{ width: 145, fontSize: 12.5, padding: "7px 10px" }} />
            </>
          )}
        </div>
      </div>

      <div className="dash-kpi-grid" style={{ marginBottom: 22 }}>
        <KpiCard icon={Scissors} iconColor="#d4af37" label="Ventas de servicios" value={resumen ? `C$ ${fmt(resumen.ventasServicios)}` : "—"} />
        <KpiCard icon={DollarSign} iconColor="#a855f7" label="Participación barbería" value={resumen ? `C$ ${fmt(resumen.participacionBarberia)}` : "—"} />
        <KpiCard icon={HandCoins} iconColor="#3b82f6" label="Generado para barberos" value={resumen ? `C$ ${fmt(resumen.generadoBarberos)}` : "—"} />
        <KpiCard icon={Clock} iconColor="#f97316" label="Pendiente de liquidar" value={resumen ? `C$ ${fmt(resumen.pendienteLiquidar)}` : "—"} />
        <KpiCard icon={CheckCircle2} iconColor="#22c55e" label="Ya liquidado" value={resumen ? `C$ ${fmt(resumen.yaLiquidado)}` : "—"} />
        <KpiCard icon={Gift} iconColor="#d4af37" label="Propinas" value={resumen ? `C$ ${fmt(resumen.propinas)}` : "—"} />
      </div>

      <div className="card-glass" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Equipo</h3>
        </div>

        {barberos === null ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text2)" }}>Cargando...</div>
        ) : barberos.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text2)" }}>No hay barberos registrados todavía.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {barberos.map((b) => (
              <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderBottom: "1px solid #1a1a1a", flexWrap: "wrap" }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "var(--accent)", overflow: "hidden", flexShrink: 0 }}>
                  {b.foto ? <img src={b.foto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : b.nombre[0]}
                </div>
                <div style={{ minWidth: 140 }}>
                  <p style={{ fontSize: 14, fontWeight: 700 }}>{b.nombre}</p>
                  <p style={{ fontSize: 12, color: "var(--text2)" }}>{b.servicios} servicio{b.servicios !== 1 ? "s" : ""}</p>
                </div>

                <div style={{ display: "flex", gap: 22, flexWrap: "wrap", flex: 1, minWidth: 260 }}>
                  <div>
                    <p style={{ fontSize: 10.5, color: "var(--text2)", textTransform: "uppercase", letterSpacing: .4 }}>Ventas generadas</p>
                    <p style={{ fontSize: 14, fontWeight: 600 }}>C$ {fmt(b.ventasGeneradas)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10.5, color: "var(--text2)", textTransform: "uppercase", letterSpacing: .4 }}>Participación {b.nombre.split(" ")[0]}</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--accent)" }}>C$ {fmt(b.participacionBarbero)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10.5, color: "var(--text2)", textTransform: "uppercase", letterSpacing: .4 }}>Participación barbería</p>
                    <p style={{ fontSize: 14, fontWeight: 600 }}>C$ {fmt(b.participacionBarberia)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10.5, color: "var(--text2)", textTransform: "uppercase", letterSpacing: .4 }}>Propinas</p>
                    <p style={{ fontSize: 14, fontWeight: 600 }}>C$ {fmt(b.propinas)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10.5, color: "var(--text2)", textTransform: "uppercase", letterSpacing: .4 }}>Pagado</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--green)" }}>C$ {fmt(b.pagado)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10.5, color: "var(--text2)", textTransform: "uppercase", letterSpacing: .4 }}>Saldo pendiente</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: b.saldoPendiente > 0 ? "var(--orange)" : "var(--text2)" }}>C$ {fmt(b.saldoPendiente)}</p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
                  <button className="btn btn-ghost" style={{ fontSize: 12.5, padding: "8px 14px" }} onClick={() => router.push(`/liquidaciones/${b.id}`)}>
                    Ver estado de cuenta
                  </button>
                  <button className="btn btn-primary" style={{ fontSize: 12.5, padding: "8px 14px", gap: 5 }} onClick={() => router.push(`/liquidaciones/${b.id}?liquidar=1`)} disabled={b.saldoPendiente <= 0}>
                    Liquidar <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
