"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { usuarios as userApi, comisiones, servicios as servicioApi } from "@/lib/api";
import {
  ArrowLeft, Percent, Pencil, Plus, History, X, AlertTriangle, ScissorsSquare,
} from "lucide-react";

const ROL_LABEL = {
  ADMIN: "Administrador", GERENTE_GENERAL: "Gerente General", SUPERVISOR: "Supervisor de Barbería",
  BARBERO: "Barbero", CAJERO: "Cajero", RECEPCIONISTA: "Recepcionista", SUPERADMIN: "Super Admin",
};
const ROLES_GESTOR = ["ADMIN", "GERENTE_GENERAL", "SUPERVISOR"];

// vigenteDesde es una fecha "de calendario" (sin hora significativa) — se
// formatea en UTC para que no se corra un día por la zona horaria local.
const fmtFecha = (d) => d ? new Intl.DateTimeFormat("es-NI", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(d)) : "—";
const fmtFechaHora = (d) => d ? new Intl.DateTimeFormat("es-NI", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(d)) : "—";

function usuarioActual() {
  if (typeof window === "undefined") return {};
  return JSON.parse(localStorage.getItem("usuario") || "{}");
}
function puedeGestionar(u) {
  return u.isSuperAdmin || ROLES_GESTOR.includes(u.rol);
}

function EmptyRegla({ onConfigurar, puede }) {
  return (
    <div style={{ textAlign: "center", padding: "22px 12px", color: "var(--text2)" }}>
      <p style={{ fontSize: 13.5, color: "var(--text)", marginBottom: 4 }}>Este barbero no tiene una regla de comisión configurada.</p>
      {puede
        ? <button className="btn btn-primary" onClick={onConfigurar} style={{ marginTop: 10, padding: "8px 16px", fontSize: 13 }}>Configurar comisión</button>
        : <p style={{ fontSize: 12 }}>Pídele a un administrador que la configure.</p>}
    </div>
  );
}

function ReglaGeneral({ regla, onEditar, puede }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontSize: 11, color: "var(--text2)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px" }}>Modalidad</span>
        <span className="badge badge-green">{regla.estado === "ACTIVA" ? "ACTIVO" : regla.estado}</span>
      </div>
      <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 18 }}>Comisión porcentual</p>

      <div style={{ display: "flex", gap: 28, marginBottom: 18, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: 11, color: "var(--text2)" }}>Barbero</p>
          <p style={{ fontSize: 26, fontWeight: 800, color: "var(--accent)" }}>{Number(regla.barberoPct)}%</p>
        </div>
        <div>
          <p style={{ fontSize: 11, color: "var(--text2)" }}>Barbería</p>
          <p style={{ fontSize: 26, fontWeight: 800 }}>{Number(regla.barberiaPct)}%</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: "var(--text2)", marginBottom: 18 }}>
        <p>Vigente desde: <span style={{ color: "var(--text)" }}>{fmtFecha(regla.vigenteDesde)}</span></p>
        <p>Configurado por: <span style={{ color: "var(--text)" }}>{[regla.creadoPor?.nombre, regla.creadoPor?.apellido].filter(Boolean).join(" ")} · {ROL_LABEL[regla.creadoPor?.rol] || regla.creadoPor?.rol}</span></p>
      </div>

      {puede && (
        <button className="btn btn-ghost" onClick={onEditar} style={{ fontSize: 13, gap: 6 }}>
          <Pencil size={14} /> Editar acuerdo
        </button>
      )}
    </div>
  );
}

function ModalConfigurar({ barbero, servicios, reglaActual, servicioIdFijo, onClose, onSaved }) {
  const [paso, setPaso] = useState("form");
  const [servicioId, setServicioId] = useState(servicioIdFijo || "");
  const [barberoPct, setBarberoPct] = useState(reglaActual ? Number(reglaActual.barberoPct) : 70);
  const [vigenteDesde, setVigenteDesde] = useState(new Date().toISOString().slice(0, 10));
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const barberiaPct = Math.round((100 - barberoPct) * 100) / 100;

  async function confirmar() {
    setLoading(true); setError("");
    try {
      await comisiones.crear({
        barberoId: barbero.id,
        servicioId: servicioId || null,
        barberoPct, barberiaPct,
        vigenteDesde,
        motivo: motivo || undefined,
      });
      onSaved();
    } catch (e) {
      setError(e.message);
      setPaso("form");
    } finally { setLoading(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div className="card-glass" style={{ width: "100%", maxWidth: 460, padding: 26, maxHeight: "90vh", overflowY: "auto", background: "rgba(16,16,18,0.97)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>{paso === "form" ? "Configurar comisión" : "Confirmar cambio de comisión"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer" }}><X size={18} /></button>
        </div>

        {paso === "form" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Barbero</label>
              <p style={{ fontSize: 14, fontWeight: 600 }}>{barbero.nombre} {barbero.apellido || ""}</p>
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Sucursal</label>
              <p style={{ fontSize: 13, color: "var(--text2)" }}>{barbero.sucursal?.nombre || "Todas las sucursales"}</p>
            </div>
            {!servicioIdFijo && (
              <div>
                <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Servicio (vacío = regla general)</label>
                <select className="input" value={servicioId} onChange={(e) => setServicioId(e.target.value)}>
                  <option value="">General — todos los servicios</option>
                  {servicios.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Porcentaje del barbero</label>
                <input className="input" type="number" min="0" max="100" step="0.5" value={barberoPct} onChange={(e) => setBarberoPct(Number(e.target.value))} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Porcentaje de la barbería</label>
                <input className="input" type="number" value={barberiaPct} disabled style={{ opacity: .7 }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Vigente desde</label>
              <input className="input" type="date" value={vigenteDesde} onChange={(e) => setVigenteDesde(e.target.value)} />
            </div>
            {reglaActual && (
              <div>
                <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 5 }}>Motivo del cambio *</label>
                <textarea className="input" required rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej: Nuevo acuerdo contractual" />
              </div>
            )}
            {error && <p style={{ color: "var(--red)", fontSize: 13, background: "rgba(239,68,68,.1)", padding: "10px 14px", borderRadius: 8 }}>{error}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
              <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancelar</button>
              <button
                className="btn btn-primary" style={{ flex: 2 }}
                disabled={barberoPct < 0 || barberoPct > 100 || (reglaActual && !motivo.trim())}
                onClick={() => setPaso("confirmar")}
              >
                Guardar nueva regla
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 600 }}>{barbero.nombre} {barbero.apellido || ""}</p>
            <div style={{ display: "flex", gap: 24 }}>
              {reglaActual && (
                <div>
                  <p style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4 }}>Anterior</p>
                  <p style={{ fontSize: 13 }}>Barbero {Number(reglaActual.barberoPct)}%</p>
                  <p style={{ fontSize: 13 }}>Barbería {Number(reglaActual.barberiaPct)}%</p>
                </div>
              )}
              <div>
                <p style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4 }}>Nueva</p>
                <p style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600 }}>Barbero {barberoPct}%</p>
                <p style={{ fontSize: 13, fontWeight: 600 }}>Barbería {barberiaPct}%</p>
              </div>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--text2)" }}>Vigente desde: <span style={{ color: "var(--text)" }}>{fmtFecha(vigenteDesde)}</span></p>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", borderRadius: 8, background: "var(--orange-dim)" }}>
              <AlertTriangle size={15} color="var(--orange)" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: "var(--text2)" }}>Las ventas anteriores <strong style={{ color: "var(--text)" }}>NO</strong> serán modificadas.</p>
            </div>
            {error && <p style={{ color: "var(--red)", fontSize: 13 }}>{error}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setPaso("form")} style={{ flex: 1 }} disabled={loading}>Cancelar</button>
              <button className="btn btn-primary" onClick={confirmar} style={{ flex: 2 }} disabled={loading}>{loading ? "Guardando..." : "Confirmar cambio"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PerfilBarbero() {
  const { id } = useParams();
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [reglaGeneral, setReglaGeneral] = useState(null);
  const [excepciones, setExcepciones] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { servicioIdFijo, reglaActual } | null
  const yo = usuarioActual();
  const puede = puedeGestionar(yo);

  const cargar = useCallback(() => {
    Promise.all([
      userApi.list(),
      comisiones.reglas({ barberoId: id }),
      comisiones.historial({ barberoId: id }),
      servicioApi.list(),
    ]).then(([lista, reglas, hist, servs]) => {
      setUsuario(lista.find((u) => u.id === id) || null);
      setReglaGeneral(reglas.find((r) => !r.servicioId) || null);
      setExcepciones(reglas.filter((r) => r.servicioId));
      setHistorial(hist);
      setServicios(servs);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

  function cerrarModal(saved) {
    setModal(null);
    if (saved) cargar();
  }

  if (loading) return <AppLayout><p style={{ color: "var(--text2)" }}>Cargando...</p></AppLayout>;
  if (!usuario) return <AppLayout><p style={{ color: "var(--text2)" }}>Usuario no encontrado</p></AppLayout>;

  const nombreCompleto = `${usuario.nombre} ${usuario.apellido || ""}`.trim();

  return (
    <AppLayout>
      <button onClick={() => router.push("/equipo")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--text2)", fontSize: 13, cursor: "pointer", marginBottom: 18 }}>
        <ArrowLeft size={15} /> Volver a Equipo
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: "var(--accent)", overflow: "hidden", flexShrink: 0 }}>
          {usuario.foto ? <img src={usuario.foto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : usuario.nombre[0]}
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>{nombreCompleto}</h1>
          <p style={{ fontSize: 13, color: "var(--text2)" }}>{ROL_LABEL[usuario.rol] || usuario.rol} · {usuario.email}</p>
        </div>
      </div>

      <div className="dash-profile-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card-glass" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
              <Percent size={16} color="var(--accent)" /> Acuerdo de comisión
            </h3>
            {reglaGeneral
              ? <ReglaGeneral regla={reglaGeneral} puede={puede} onEditar={() => setModal({ servicioIdFijo: null, reglaActual: reglaGeneral })} />
              : <EmptyRegla puede={puede} onConfigurar={() => setModal({ servicioIdFijo: null, reglaActual: null })} />}
          </div>

          <div className="card-glass" style={{ padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h3 style={{ fontSize: 14.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                <ScissorsSquare size={16} color="var(--accent)" /> Excepciones por servicio
              </h3>
              {puede && (
                <button onClick={() => setModal({ servicioIdFijo: undefined, reglaActual: null })} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 12.5, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  <Plus size={14} /> Agregar excepción
                </button>
              )}
            </div>
            {excepciones.length === 0 ? (
              <p style={{ fontSize: 12.5, color: "var(--text2)" }}>Sin excepciones — se aplica la regla general a todos los servicios.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {excepciones.map((r) => (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1a1a1a" }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500 }}>{r.servicio?.nombre}</p>
                      <p style={{ fontSize: 11, color: "var(--text2)" }}>Desde {fmtFecha(r.vigenteDesde)}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)" }}>{Number(r.barberoPct)}%</span>
                      {puede && <button onClick={() => setModal({ servicioIdFijo: r.servicioId, reglaActual: r })} style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer" }}><Pencil size={13} /></button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card-glass" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
            <History size={16} color="var(--accent)" /> Historial de comisiones
          </h3>
          {historial.length === 0 ? (
            <p style={{ fontSize: 12.5, color: "var(--text2)" }}>Sin cambios registrados todavía.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {historial.map((h) => (
                <div key={h.id} className="timeline-item" style={{ paddingLeft: 2 }}>
                  <p style={{ fontSize: 11.5, color: "#555", marginBottom: 4 }}>{fmtFechaHora(h.creadoEn)}</p>
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
      </div>

      {modal && (
        <ModalConfigurar
          barbero={usuario}
          servicios={servicios}
          reglaActual={modal.reglaActual}
          servicioIdFijo={modal.servicioIdFijo}
          onClose={() => setModal(null)}
          onSaved={() => cerrarModal(true)}
        />
      )}
    </AppLayout>
  );
}
