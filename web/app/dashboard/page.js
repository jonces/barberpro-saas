"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { dashboard } from "@/lib/api";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  DollarSign, TrendingUp, CalendarDays, Users, Wallet, PackageX,
  ArrowUp, ArrowDown, Lock, ShoppingCart, CalendarPlus, UserPlus, PackagePlus,
  Scissors, Package, AlertTriangle, AlertCircle, PartyPopper, ChevronRight,
} from "lucide-react";
import pkg from "../../package.json";

const fmt = (n) => new Intl.NumberFormat("es-NI", { minimumFractionDigits: 0 }).format(n || 0);
const hora = (d) => d ? new Intl.DateTimeFormat("es-NI", { hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(d)) : "—";
function saludo() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}
function fechaHoy() {
  const s = new Intl.DateTimeFormat("es-NI", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const ESTADO_COLOR = {
  CONFIRMADA: { bg: "var(--green-dim)", color: "var(--green)" },
  PENDIENTE: { bg: "var(--orange-dim)", color: "var(--orange)" },
  COMPLETADA: { bg: "var(--blue-dim)", color: "var(--blue)" },
  CANCELADA: { bg: "var(--red-dim)", color: "var(--red)" },
  EN_PROGRESO: { bg: "var(--purple-dim)", color: "var(--purple)" },
  NO_SHOW: { bg: "#222", color: "var(--text2)" },
};
const ALERTA_ICON = { error: AlertCircle, warning: AlertTriangle, info: CalendarDays, success: PartyPopper };
const ALERTA_COLOR = { error: "var(--red)", warning: "var(--orange)", info: "var(--purple)", success: "var(--green)" };
const ACTIVIDAD_ICON = { venta: DollarSign, venta_producto: Package, cita_completada: Scissors, caja_abierta: Wallet };
const ACTIVIDAD_COLOR = { venta: "var(--green)", venta_producto: "var(--orange)", cita_completada: "var(--blue)", caja_abierta: "var(--purple)" };

function Skel({ h = 16, w = "100%", r = 8 }) {
  return <div className="skeleton" style={{ height: h, width: w, borderRadius: r }} />;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function Variacion({ v }) {
  if (v === null || v === undefined) return null;
  const up = v >= 0;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 12, color: up ? "var(--green)" : "var(--red)" }}>
      <Icon size={12} />{Math.abs(v)}%
    </span>
  );
}

function Sparkline({ data, color = "var(--accent)" }) {
  if (!data || data.length < 2) return null;
  return (
    <div style={{ width: 74, height: 28 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="total" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function KpiCard({ icon: Icon, iconColor, label, value, sub, extra, locked, right }) {
  return (
    <div className="card-glass" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 11, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: "var(--text2)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px" }}>{label}</span>
        <span style={{ width: 30, height: 30, borderRadius: 9, background: `${iconColor}1f`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={15} color={iconColor} />
        </span>
      </div>
      {locked ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text2)" }}>
          <Lock size={14} /><span style={{ fontSize: 13 }}>Sin acceso</span>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
          <p style={{ fontSize: 25, fontWeight: 800, color: "var(--text)", lineHeight: 1.1, wordBreak: "break-word", letterSpacing: "-.3px" }}>{value}</p>
          {right}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {sub && <p style={{ fontSize: 11.5, color: "var(--text2)" }}>{sub}</p>}
        {extra}
      </div>
    </div>
  );
}

const ERRORES_SESION = ["Token requerido", "Token inválido", "Sin acceso"];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periodo, setPeriodo] = useState("7d");
  const [usuario] = useState(() => (typeof window !== "undefined" ? JSON.parse(localStorage.getItem("usuario") || "{}") : {}));
  const router = useRouter();

  useEffect(() => {
    if (usuario.rol === "SUPERADMIN") router.replace("/superadmin");
  }, [usuario.rol, router]);

  function cargar() {
    if (usuario.rol === "SUPERADMIN") return;
    dashboard.get(periodo).then((d) => { setData(d); setError(null); }).catch((e) => {
      if (ERRORES_SESION.includes(e.message)) {
        localStorage.removeItem("token"); localStorage.removeItem("usuario");
        router.replace("/login");
        return;
      }
      setError(e.message);
    }).finally(() => setLoading(false));
  }

  useEffect(() => { cargar(); }, [periodo, usuario.rol]);

  const nombre = usuario.nombre || "";
  const barberiaNombre = usuario.barberia?.nombre || "tu barbería";

  return (
    <AppLayout>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 26 }}>
        <div>
          <h1 style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-.4px", textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>{saludo()}, {nombre.split(" ")[0] || "de nuevo"} 👋</h1>
          <p style={{ color: "var(--text2)", fontSize: 14, marginTop: 5, textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}>Aquí tienes el resumen de {barberiaNombre}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: "var(--text2)", display: "flex", alignItems: "center", gap: 6 }}>
            <CalendarDays size={14} />{fechaHoy()}
          </span>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-primary" onClick={() => router.push("/pos")} style={{ gap: 8 }}>
              <ShoppingCart size={15} /> Nueva venta
            </button>
            <button className="btn btn-ghost" onClick={() => router.push("/citas")} style={{ gap: 8, border: "1px solid var(--border)" }}>
              <CalendarPlus size={15} /> Nueva cita
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="card-glass" style={{ padding: 32, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <AlertCircle size={28} color="var(--red)" />
          <p style={{ fontSize: 15, fontWeight: 600 }}>No se pudo cargar el dashboard</p>
          <p style={{ fontSize: 13, color: "var(--text2)" }}>{error}</p>
          <button className="btn btn-primary" onClick={cargar} style={{ marginTop: 6 }}>Reintentar</button>
        </div>
      ) : loading || !data ? <DashboardSkeleton /> : (
        <>
          {/* KPIs */}
          <div className="dash-kpi-grid" style={{ marginBottom: 16 }}>
            <KpiCard
              icon={DollarSign} iconColor="var(--accent)" label="Ventas de hoy"
              locked={!data.permisoFinanzas}
              value={`C$ ${fmt(data.ventasHoy.total)}`}
              sub={`${data.ventasHoy.cantidad} venta${data.ventasHoy.cantidad === 1 ? "" : "s"}`}
              extra={<Variacion v={data.ventasHoy.variacion} />}
              right={<Sparkline data={data.graficoVentas?.slice(-7)} />}
            />
            <KpiCard
              icon={TrendingUp} iconColor="var(--purple)" label="Ventas del mes"
              locked={!data.permisoFinanzas}
              value={`C$ ${fmt(data.ventasMes.total)}`}
              sub={`${data.ventasMes.cantidad} transacciones`}
              extra={<Variacion v={data.ventasMes.variacion} />}
              right={<Sparkline data={data.graficoVentas?.slice(-7)} color="var(--purple)" />}
            />
            <KpiCard
              icon={CalendarDays} iconColor="var(--purple)" label="Citas de hoy"
              value={data.citasHoy.total}
              sub={`${data.citasHoy.confirmadas} confirmada${data.citasHoy.confirmadas === 1 ? "" : "s"} · ${data.citasHoy.pendientes} pendiente${data.citasHoy.pendientes === 1 ? "" : "s"}`}
              extra={<span style={{ fontSize: 11.5, color: "var(--text2)" }}>Próxima: {data.citasHoy.proxima ? hora(data.citasHoy.proxima.hora) : "—"}</span>}
            />
            <KpiCard
              icon={Users} iconColor="var(--blue)" label="Clientes"
              value={fmt(data.clientesTotal)}
              sub={`+${data.clientesNuevosMes} este mes`}
            />
            <KpiCard
              icon={Wallet} iconColor="var(--green)" label="Caja"
              locked={data.caja.abierta && !data.permisoFinanzas}
              value={data.caja.abierta ? "Abierta" : "Cerrada"}
              sub={data.caja.abierta ? (data.permisoFinanzas ? `C$ ${fmt(data.caja.montoActual)} en caja` : undefined) : "Sin caja abierta"}
              extra={data.caja.abierta && <span style={{ fontSize: 11.5, color: "var(--green)", display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} />Abierta desde {hora(data.caja.abiertoEn)}</span>}
            />
            <KpiCard
              icon={PackageX} iconColor={data.inventario.total > 0 ? "var(--red)" : "var(--green)"} label="Stock bajo"
              value={data.inventario.total}
              sub="productos"
              extra={<span style={{ fontSize: 11.5, color: data.inventario.total > 0 ? "var(--orange)" : "var(--green)" }}>{data.inventario.total > 0 ? "Requieren atención" : "Todo en orden"}</span>}
            />
          </div>

          {/* Fila principal */}
          <div className="dash-main-grid" style={{ marginBottom: 16 }}>
            <VentasCard data={data} periodo={periodo} setPeriodo={setPeriodo} router={router} />
            <CitasCard data={data} router={router} />
            <TopServiciosCard data={data} />
          </div>

          {/* Fila secundaria */}
          <div className="dash-secondary-grid">
            <ActividadCard data={data} />
            <EquipoCard data={data} />
            <AlertasCard data={data} router={router} />
            <AccionesCard router={router} />
          </div>
        </>
      )}

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28, paddingTop: 16, borderTop: "1px solid var(--border)", fontSize: 11.5, color: "#555" }}>
        <span>BarberPro © {new Date().getFullYear()} — Todos los derechos reservados</span>
        <span>Versión {pkg.version}</span>
      </div>
    </AppLayout>
  );
}

function SectionHeader({ title, actionLabel, onAction }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <h3 style={{ fontSize: 14.5, fontWeight: 600 }}>{title}</h3>
      {actionLabel && (
        <button onClick={onAction} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 12.5, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 2 }}>
          {actionLabel} <ChevronRight size={13} />
        </button>
      )}
    </div>
  );
}

function EmptyState({ title, sub, ctaLabel, onCta }) {
  return (
    <div style={{ textAlign: "center", padding: "28px 12px", color: "var(--text2)" }}>
      <p style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text)", marginBottom: 4 }}>{title}</p>
      {sub && <p style={{ fontSize: 12.5, marginBottom: ctaLabel ? 14 : 0 }}>{sub}</p>}
      {ctaLabel && <button className="btn btn-primary" onClick={onCta} style={{ padding: "8px 16px", fontSize: 13 }}>{ctaLabel}</button>}
    </div>
  );
}

function VentasCard({ data, periodo, setPeriodo, router }) {
  const FILTROS = [{ id: "7d", label: "7 días" }, { id: "30d", label: "30 días" }, { id: "mes", label: "Este mes" }];
  const reduceMotion = usePrefersReducedMotion();
  return (
    <div className="card-glass" style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <h3 style={{ fontSize: 14.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><TrendingUp size={16} color="var(--accent)" /> Ventas</h3>
        {data.permisoFinanzas && (
          <div style={{ display: "flex", gap: 4, background: "var(--surface2)", borderRadius: 8, padding: 3 }}>
            {FILTROS.map((f) => (
              <button key={f.id} onClick={() => setPeriodo(f.id)} style={{
                padding: "5px 10px", borderRadius: 6, fontSize: 12, border: "none", cursor: "pointer",
                background: periodo === f.id ? "var(--accent)" : "transparent",
                color: periodo === f.id ? "#000" : "var(--text2)", fontWeight: periodo === f.id ? 600 : 400,
              }}>{f.label}</button>
            ))}
          </div>
        )}
      </div>

      {!data.permisoFinanzas ? (
        <EmptyState title="Sin acceso a información financiera" sub="No tienes permiso para ver las ventas de la barbería." />
      ) : data.totalPeriodo === 0 ? (
        <EmptyState title="Aún no hay ventas registradas" sub="Registra tu primera venta para comenzar a visualizar tus ingresos." ctaLabel="Nueva venta" onCta={() => router.push("/pos")} />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.graficoVentas}>
              <defs>
                <linearGradient id="ventasFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="fecha" tick={{ fill: "var(--text2)", fontSize: 11 }} tickFormatter={(v) => v.split("-").slice(1).join("/")} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
              <YAxis tick={{ fill: "var(--text2)", fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
              <Tooltip formatter={(v) => [`C$ ${fmt(v)}`, "Ventas"]} contentStyle={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }} labelStyle={{ color: "var(--text2)" }} />
              <Area type="monotone" dataKey="total" stroke="var(--accent)" strokeWidth={2.5} fill="url(#ventasFill)" isAnimationActive={!reduceMotion} animationDuration={600} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 32, marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
            <div>
              <p style={{ fontSize: 11.5, color: "var(--text2)" }}>Total período</p>
              <p style={{ fontSize: 17, fontWeight: 700 }}>C$ {fmt(data.totalPeriodo)}</p>
            </div>
            <div>
              <p style={{ fontSize: 11.5, color: "var(--text2)" }}>Promedio diario</p>
              <p style={{ fontSize: 17, fontWeight: 700 }}>C$ {fmt(Math.round(data.promedioDiario))}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CitasCard({ data, router }) {
  return (
    <div className="card-glass" style={{ padding: 20 }}>
      <SectionHeader title="Citas de hoy" actionLabel="Ver todas" onAction={() => router.push("/citas")} />
      {data.citasProximas.length === 0 ? (
        <EmptyState title="No hay citas para hoy" sub="Tu agenda está libre por ahora." ctaLabel="Nueva cita" onCta={() => router.push("/citas")} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {data.citasProximas.map((c) => {
            const est = ESTADO_COLOR[c.estado] || ESTADO_COLOR.PENDIENTE;
            return (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 4px", borderBottom: "1px solid #1a1a1a" }}>
                <div style={{ fontSize: 12, color: "var(--text2)", width: 52, flexShrink: 0, lineHeight: 1.2 }}>{hora(c.hora)}</div>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--accent)", flexShrink: 0, overflow: "hidden" }}>
                  {c.clienteFoto ? <img src={c.clienteFoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (c.cliente || "?")[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.cliente}</p>
                  <p style={{ fontSize: 11.5, color: "var(--text2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.servicio || "Servicio"}{c.duracion ? ` · ${c.duracion} min` : ""}{c.barbero ? ` · ${c.barbero}` : ""}
                  </p>
                </div>
                <span className="badge" style={{ background: est.bg, color: est.color, flexShrink: 0 }}>{c.estado}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TopServiciosCard({ data }) {
  const max = Math.max(1, ...data.topServicios.map((s) => s.cantidad));
  return (
    <div className="card-glass" style={{ padding: 20 }}>
      <SectionHeader title="Top Servicios del Mes" />
      {data.topServicios.length === 0 ? (
        <EmptyState title="Todavía no hay suficientes ventas" sub="Vende servicios este mes para ver el ranking aquí." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {data.topServicios.map((s, i) => (
            <div key={s.nombre}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--accent-dim)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.nombre}</p>
                  <p style={{ fontSize: 11.5, color: "var(--text2)" }}>{s.cantidad} servicio{s.cantidad === 1 ? "" : "s"}</p>
                </div>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: "var(--accent)", flexShrink: 0 }}>C$ {fmt(s.total)}</p>
              </div>
              <div style={{ height: 5, background: "var(--surface2)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(s.cantidad / max) * 100}%`, background: i === 0 ? "var(--accent)" : `rgba(212,175,55,${0.75 - i * 0.18})`, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActividadCard({ data }) {
  return (
    <div className="card-glass" style={{ padding: 20 }}>
      <SectionHeader title="Actividad reciente" />
      {data.actividadReciente.length === 0 ? (
        <EmptyState title="Aún no hay actividad reciente" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {data.actividadReciente.map((a, i) => {
            const Icon = ACTIVIDAD_ICON[a.tipo] || DollarSign;
            const color = ACTIVIDAD_COLOR[a.tipo] || "var(--text2)";
            return (
              <div key={i} className="timeline-item" style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={13} color={color} />
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 500 }}>{a.titulo}</p>
                    <span style={{ fontSize: 10.5, color: "#555", flexShrink: 0 }}>{hora(a.hora)}</span>
                  </div>
                  <p style={{ fontSize: 11.5, color: "var(--text2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.detalle}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EquipoCard({ data }) {
  const max = Math.max(1, ...data.rendimientoEquipo.map((e) => e.servicios));
  return (
    <div className="card-glass" style={{ padding: 20 }}>
      <SectionHeader title="Rendimiento del equipo" />
      {data.rendimientoEquipo.length === 0 ? (
        <EmptyState title="Aún no hay datos de rendimiento" sub="Se mostrará cuando el equipo registre servicios este mes." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {data.rendimientoEquipo.map((e, i) => (
            <div key={e.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 12, width: 16, color: "var(--text2)", flexShrink: 0 }}>{i + 1}</span>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--accent)", flexShrink: 0, overflow: "hidden" }}>
                  {e.foto ? <img src={e.foto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : e.nombre[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.nombre}</p>
                  <p style={{ fontSize: 11, color: "var(--text2)" }}>{e.servicios} servicio{e.servicios === 1 ? "" : "s"}</p>
                </div>
                {e.generado !== null && <p style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", flexShrink: 0, textAlign: "right" }}>C$ {fmt(e.generado)}<br /><span style={{ fontSize: 9.5, color: "var(--text2)", fontWeight: 400 }}>generado</span></p>}
              </div>
              <div style={{ height: 5, background: "var(--surface2)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(e.servicios / max) * 100}%`, background: i === 0 ? "var(--accent)" : `rgba(212,175,55,${0.75 - i * 0.18})`, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AlertasCard({ data }) {
  return (
    <div className="card-glass" style={{ padding: 20 }}>
      <SectionHeader title="Requiere tu atención" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {data.alertas.length === 0 ? (
          <Alerta tipo="success" titulo="¡Todo está al día! 🎉" detalle="Excelente trabajo." />
        ) : data.alertas.map((a, i) => <Alerta key={i} tipo={a.tipo} titulo={a.titulo} detalle={a.detalle} />)}
      </div>
    </div>
  );
}
function Alerta({ tipo, titulo, detalle }) {
  const Icon = ALERTA_ICON[tipo] || AlertCircle;
  const color = ALERTA_COLOR[tipo];
  return (
    <div className="alert-item" style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 8, background: `${color}12`, borderLeftColor: color }}>
      <Icon size={15} color={color} style={{ marginTop: 1, flexShrink: 0 }} />
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 12.5, fontWeight: 500 }}>{titulo}</p>
        <p style={{ fontSize: 11, color: "var(--text2)" }}>{detalle}</p>
      </div>
    </div>
  );
}

function AccionesCard({ router }) {
  const ACCIONES = [
    { label: "Nueva venta", icon: ShoppingCart, href: "/pos" },
    { label: "Nueva cita", icon: CalendarPlus, href: "/citas" },
    { label: "Nuevo cliente", icon: UserPlus, href: "/clientes" },
    { label: "Agregar producto", icon: PackagePlus, href: "/inventario" },
  ];
  return (
    <div className="card-glass" style={{ padding: 20 }}>
      <SectionHeader title="Acciones rápidas" />
      <div className="dash-quick-grid">
        {ACCIONES.map((a) => (
          <button key={a.href} className="quick-action-btn" onClick={() => router.push(a.href)}>
            <a.icon size={18} color="var(--accent)" />
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="dash-kpi-grid" style={{ marginBottom: 16 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card-glass" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
            <Skel h={12} w="60%" /><Skel h={26} w="70%" /><Skel h={10} w="50%" />
          </div>
        ))}
      </div>
      <div className="dash-main-grid" style={{ marginBottom: 16 }}>
        <div className="card-glass" style={{ padding: 20 }}><Skel h={200} /></div>
        <div className="card-glass" style={{ padding: 20 }}><Skel h={200} /></div>
        <div className="card-glass" style={{ padding: 20 }}><Skel h={200} /></div>
      </div>
      <div className="dash-secondary-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card-glass" style={{ padding: 20 }}><Skel h={140} /></div>
        ))}
      </div>
    </>
  );
}
