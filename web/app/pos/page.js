"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { servicios as svcApi, productos as prodApi, clientes as clienteApi, ventas as ventaApi, caja as cajaApi, usuarios as userApi, comisiones } from "@/lib/api";

const fmt = (n) => new Intl.NumberFormat("es-NI").format(Number(n) || 0);
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/* ─── Selección obligatoria de barbero al agregar un servicio ─── */
function ModalSeleccionarBarbero({ servicio, barberos, actual, onClose, onConfirmar }) {
  const [busq, setBusq] = useState("");
  const filtrados = barberos.filter((b) => !busq || `${b.nombre} ${b.apellido || ""}`.toLowerCase().includes(busq.toLowerCase()));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 150, padding: 20 }}>
      <div className="card" style={{ width: "100%", maxWidth: 640, padding: 26, maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>¿Quién realizó el servicio?</h2>
            <p style={{ fontSize: 13, color: "var(--text2)", marginTop: 2 }}>Selecciona al barbero que atendió al cliente{servicio ? ` — ${servicio.nombre}` : ""}.</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text2)", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        <input className="input" placeholder="Buscar barbero..." value={busq} onChange={(e) => setBusq(e.target.value)} style={{ margin: "16px 0" }} autoFocus />

        {filtrados.length === 0 ? (
          <p style={{ color: "var(--text2)", fontSize: 13, textAlign: "center", padding: "24px 0" }}>
            No hay barberos activos disponibles en esta sucursal.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12 }}>
            {filtrados.map((b) => {
              const sel = actual === b.id;
              return (
                <button key={b.id} onClick={() => onConfirmar(b)} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "16px 10px",
                  borderRadius: 14, background: "var(--surface2)", cursor: "pointer", textAlign: "center",
                  border: sel ? "2px solid var(--accent)" : "2px solid transparent",
                  boxShadow: sel ? "0 0 0 1px var(--accent)" : "none",
                }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "var(--accent)", overflow: "hidden", flexShrink: 0 }}>
                    {b.foto ? <img src={b.foto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : b.nombre[0]}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.25 }}>{b.nombre} {b.apellido || ""}</p>
                    <p style={{ fontSize: 11, color: "var(--text2)" }}>Barbero</p>
                  </div>
                  <span style={{ fontSize: 10.5, color: "var(--green)", display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} /> Disponible
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Recibo imprimible ─── */
function Recibo({ venta, carrito, subtotal, descuento, propina, total, efectivo, cambio, cliente, barberia, onNuevaVenta }) {
  const ref = useRef();

  function imprimir() {
    const win = window.open("", "_blank", "width=400,height=600");
    win.document.write(`
      <html><head><title>Recibo</title><style>
        body{font-family:monospace;font-size:13px;margin:20px;color:#000}
        h2{text-align:center;font-size:16px;margin:0 0 4px}
        p{margin:2px 0}
        .center{text-align:center}
        .row{display:flex;justify-content:space-between}
        hr{border:none;border-top:1px dashed #000;margin:8px 0}
        .total{font-size:16px;font-weight:bold}
        .gracias{text-align:center;margin-top:12px;font-style:italic}
      </style></head><body>
        ${ref.current.innerHTML}
        <script>window.onload=()=>window.print()</script>
      </body></html>
    `);
    win.document.close();
  }

  const now = new Date();

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, maxWidth: 420, width: "100%", maxHeight: "90vh", overflowY: "auto", color: "#000" }}>
        {/* Contenido del recibo */}
        <div ref={ref} style={{ fontFamily: "monospace", fontSize: 13 }}>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <p style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>✂️ {barberia?.nombre || "Barbería"}</p>
            {barberia?.ciudad && <p style={{ margin: "2px 0", color: "#555" }}>{barberia.ciudad}</p>}
            {barberia?.telefono && <p style={{ margin: "2px 0", color: "#555" }}>{barberia.telefono}</p>}
          </div>
          <hr style={{ border: "none", borderTop: "1px dashed #ccc", margin: "10px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#555", marginBottom: 6 }}>
            <span>Recibo: <strong>{venta.numeroRecibo}</strong></span>
            <span>{now.toLocaleDateString("es-NI")} {now.toLocaleTimeString("es-NI", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          {cliente && <p style={{ margin: "4px 0", fontSize: 12 }}>Cliente: <strong>{cliente.nombre}</strong></p>}
          <hr style={{ border: "none", borderTop: "1px dashed #ccc", margin: "10px 0" }} />
          {/* Items */}
          {carrito.map((item, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ flex: 1 }}>{item.nombre}{item.cantidad > 1 ? ` x${item.cantidad}` : ""}</span>
                <span style={{ fontWeight: 600 }}>C$ {fmt(item.precio * item.cantidad)}</span>
              </div>
              {item.barberoNombre && <p style={{ margin: 0, fontSize: 11, color: "#777" }}>{item.barberoNombre}</p>}
            </div>
          ))}
          <hr style={{ border: "none", borderTop: "1px dashed #ccc", margin: "10px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", color: "#555", fontSize: 13 }}>
            <span>Subtotal</span><span>C$ {fmt(subtotal)}</span>
          </div>
          {descuento > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", color: "#e53e3e", fontSize: 13 }}>
              <span>Descuento</span><span>- C$ {fmt(descuento)}</span>
            </div>
          )}
          {propina > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span>Propina</span><span>C$ {fmt(propina)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 18, marginTop: 6 }}>
            <span>TOTAL</span><span>C$ {fmt(total)}</span>
          </div>
          <hr style={{ border: "none", borderTop: "1px dashed #ccc", margin: "10px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span>Efectivo recibido</span><span>C$ {fmt(efectivo)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15, color: "#1a7f37" }}>
            <span>Cambio</span><span>C$ {fmt(cambio)}</span>
          </div>
          <p style={{ textAlign: "center", marginTop: 16, fontStyle: "italic", fontSize: 12, color: "#555" }}>¡Gracias por su visita!</p>
        </div>

        {/* Botones */}
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={imprimir} style={{ flex: 1, padding: 12, borderRadius: 10, background: "#1a1a1a", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
            🖨️ Imprimir
          </button>
          <button onClick={onNuevaVenta} style={{ flex: 1, padding: 12, borderRadius: 10, background: "#d4af37", color: "#000", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
            ✓ Nueva Venta
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Tarjeta de servicio ─── */
function TarjetaItem({ item, tipo, onAgregar }) {
  return (
    <button onClick={() => onAgregar(item, tipo)}
      style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", cursor: "pointer", textAlign: "left", transition: "all .15s", display: "flex", flexDirection: "column" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(212,175,55,.15)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
      {/* Foto del producto/servicio */}
      {item.foto ? (
        <div style={{ width: "100%", height: 110, overflow: "hidden" }}>
          <img src={item.foto} alt={item.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      ) : (
        <div style={{ width: "100%", height: 80, background: tipo === "servicio" ? "linear-gradient(135deg,rgba(212,175,55,.15),rgba(212,175,55,.05))" : "linear-gradient(135deg,rgba(59,130,246,.15),rgba(59,130,246,.05))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
          {tipo === "servicio" ? (item.color ? <span style={{ width: 20, height: 20, borderRadius: "50%", background: item.color, display: "block" }} /> : "✂️") : "📦"}
        </div>
      )}
      <div style={{ padding: "12px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", lineHeight: 1.3 }}>{item.nombre}</p>
        {item.descripcion && <p style={{ fontSize: 11, color: "var(--text2)", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{item.descripcion}</p>}
        <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: "var(--accent)" }}>C$ {fmt(item.precio)}</p>
          {tipo === "servicio" && item.duracion && <span style={{ fontSize: 11, color: "var(--text2)", background: "var(--surface2)", padding: "2px 8px", borderRadius: 20 }}>⏱ {item.duracion}m</span>}
          {tipo === "producto" && <span style={{ fontSize: 11, color: item.stock <= item.stockMinimo ? "var(--red)" : "var(--text2)", background: "var(--surface2)", padding: "2px 8px", borderRadius: 20 }}>📦 {item.stock}</span>}
        </div>
      </div>
    </button>
  );
}

/* ─── POS principal ─── */
export default function POS() {
  const [tab, setTab] = useState("servicios");
  const [busqueda, setBusqueda] = useState("");
  const [servicios, setServicios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [cajaActiva, setCajaActiva] = useState(null);
  const [busqCliente, setBusqCliente] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [carrito, setCarrito] = useState([]);
  const [descuento, setDescuento] = useState(0);
  const [efectivo, setEfectivo] = useState("");
  const [loading, setLoading] = useState(false);
  const [recibo, setRecibo] = useState(null);
  const [editandoPrecio, setEditandoPrecio] = useState(null);
  const [barberos, setBarberos] = useState([]);
  const [pendienteServicio, setPendienteServicio] = useState(null); // servicio esperando barbero (nuevo)
  const [editandoBarberoKey, setEditandoBarberoKey] = useState(null); // key del item cuyo barbero se está cambiando
  const [propinaMonto, setPropinaMonto] = useState(0);
  const [propinaBarberoId, setPropinaBarberoId] = useState(null); // null = sin definir, "DIVIDIR" = repartir
  const [usuario] = useState(() => (typeof window !== "undefined" ? JSON.parse(localStorage.getItem("usuario") || "{}") : {}));
  const barberia = usuario.barberia;
  const puedeVerComision = usuario.isSuperAdmin || (usuario.permisos || []).includes("commission.view");
  const puedeGestionarComision = usuario.isSuperAdmin || (usuario.permisos || []).includes("commission.manage");

  useEffect(() => {
    Promise.all([svcApi.list(), prodApi.list(), cajaApi.activa(), userApi.list()])
      .then(([s, p, c, us]) => {
        setServicios(s.filter(x => x.estado)); setProductos(p.filter(x => x.estado)); setCajaActiva(c);
        setBarberos(us.filter(x => x.rol === "BARBERO" && x.estado && (!x.sucursal?.id || x.sucursal.id === usuario.sucursalId)));
      });
  }, [usuario.sucursalId]);

  useEffect(() => {
    if (busqCliente.length < 2) { setClientes([]); return; }
    clienteApi.list(busqCliente).then(setClientes);
  }, [busqCliente]);

  const subtotal = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const barberosEnCarrito = [...new Map(carrito.filter(i => i.tipo === "servicio" && i.barberoId).map(i => [i.barberoId, { id: i.barberoId, nombre: i.barberoNombre }])).values()];

  // Con un solo barbero en el carrito la propina se le asigna automáticamente;
  // con varios, el usuario decide (elegir uno o dividir) — sin efecto de por
  // medio, se deriva directamente del carrito en cada render.
  const propinaBarberoEfectivo = barberosEnCarrito.length === 1 ? barberosEnCarrito[0].id : propinaBarberoId;

  const distribucionPropina = {};
  if (Number(propinaMonto) > 0 && barberosEnCarrito.length > 0) {
    if (propinaBarberoEfectivo === "DIVIDIR") {
      const porBarbero = round2(Number(propinaMonto) / barberosEnCarrito.length);
      barberosEnCarrito.forEach((b) => {
        const linea = carrito.find(i => i.tipo === "servicio" && i.barberoId === b.id);
        if (linea) distribucionPropina[linea.lineId] = porBarbero;
      });
    } else if (propinaBarberoEfectivo) {
      const linea = carrito.find(i => i.tipo === "servicio" && i.barberoId === propinaBarberoEfectivo);
      if (linea) distribucionPropina[linea.lineId] = round2(Number(propinaMonto));
    }
  }
  const propinaTotal = Object.values(distribucionPropina).reduce((s, v) => s + v, 0);
  const total = Math.max(0, subtotal - Number(descuento || 0) + propinaTotal);
  const cambio = Number(efectivo || 0) - total;

  function nuevoLineId() { return `l${Date.now()}${Math.random().toString(36).slice(2, 8)}`; }

  function resolverComisionLinea(lineId, barberoId, servicioId) {
    setCarrito(c => c.map(x => x.lineId === lineId ? { ...x, comisionCargando: true, comisionError: null } : x));
    comisiones.vigente({ barberoId, servicioId })
      .then(({ regla }) => setCarrito(c => c.map(x => x.lineId === lineId ? { ...x, comisionCargando: false, comisionRegla: regla, comisionError: null } : x)))
      .catch((e) => setCarrito(c => c.map(x => x.lineId === lineId ? { ...x, comisionCargando: false, comisionRegla: null, comisionError: e.message } : x)));
  }

  function agregarItem(item, tipo) {
    if (tipo === "servicio") { setPendienteServicio(item); return; }
    setCarrito(c => {
      const existe = c.find(x => x.id === item.id && x.tipo === tipo);
      if (existe) return c.map(x => x.id === item.id && x.tipo === tipo ? { ...x, cantidad: x.cantidad + 1 } : x);
      return [...c, { ...item, tipo, cantidad: 1, lineId: nuevoLineId() }];
    });
  }

  function confirmarBarbero(barbero) {
    if (editandoBarberoKey) {
      const lineId = editandoBarberoKey;
      setCarrito(c => c.map(x => x.lineId === lineId ? { ...x, barberoId: barbero.id, barberoNombre: `${barbero.nombre} ${barbero.apellido || ""}`.trim(), barberoFoto: barbero.foto } : x));
      const linea = carrito.find(x => x.lineId === lineId);
      if (linea) resolverComisionLinea(lineId, barbero.id, linea.id);
      setEditandoBarberoKey(null);
      return;
    }
    if (pendienteServicio) {
      setCarrito(c => {
        const existe = c.find(x => x.tipo === "servicio" && x.id === pendienteServicio.id && x.barberoId === barbero.id);
        if (existe) return c.map(x => x.lineId === existe.lineId ? { ...x, cantidad: x.cantidad + 1 } : x);
        const lineId = nuevoLineId();
        resolverComisionLinea(lineId, barbero.id, pendienteServicio.id);
        return [...c, { ...pendienteServicio, tipo: "servicio", cantidad: 1, lineId, barberoId: barbero.id, barberoNombre: `${barbero.nombre} ${barbero.apellido || ""}`.trim(), barberoFoto: barbero.foto }];
      });
      setPendienteServicio(null);
    }
  }

  function cambiarCantidad(lineId, delta) {
    setCarrito(c => c.map(x => x.lineId === lineId ? { ...x, cantidad: Math.max(1, x.cantidad + delta) } : x));
  }

  function quitarItem(lineId) { setCarrito(c => c.filter(x => x.lineId !== lineId)); }

  function editarPrecioItem(lineId, nuevoPrecio) {
    setCarrito(c => c.map(x => x.lineId === lineId ? { ...x, precio: Number(nuevoPrecio) } : x));
    setEditandoPrecio(null);
  }

  const itemsFiltrados = (tab === "servicios" ? servicios : productos).filter(x =>
    !busqueda || x.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  async function finalizarVenta() {
    if (carrito.length === 0) return alert("Agrega al menos un servicio o producto");
    const sinComision = carrito.find(i => i.tipo === "servicio" && !i.comisionRegla);
    if (sinComision) return alert(`"${sinComision.nombre}" con ${sinComision.barberoNombre} no tiene una regla de comisión configurada. Configúrala antes de cobrar.`);
    if (!efectivo || Number(efectivo) < total) return alert("El efectivo recibido es menor al total");
    setLoading(true);
    try {
      const items = carrito.map(i => ({
        [i.tipo === "servicio" ? "servicioId" : "productoId"]: i.id,
        nombre: i.nombre, precio: i.precio, cantidad: i.cantidad, descuento: 0,
        barberoId: i.tipo === "servicio" ? i.barberoId : undefined,
        propina: distribucionPropina[i.lineId] || 0,
      }));
      const venta = await ventaApi.create({
        clienteId: clienteSeleccionado?.id, cajaId: cajaActiva?.id, items,
        descuento: Number(descuento || 0), efectivoRecibido: Number(efectivo),
      });
      setRecibo({ venta, carritoSnap: [...carrito], subtotalSnap: subtotal, descuentoSnap: Number(descuento || 0), propinaSnap: propinaTotal, totalSnap: total, efectivoSnap: Number(efectivo), cambioSnap: cambio, clienteSnap: clienteSeleccionado });
      setCarrito([]); setEfectivo(""); setDescuento(0); setClienteSeleccionado(null); setBusqCliente(""); setPropinaMonto(0); setPropinaBarberoId(null);
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  }

  return (
    <AppLayout title="Punto de Venta">
      {recibo && (
        <Recibo
          venta={recibo.venta}
          carrito={recibo.carritoSnap}
          subtotal={recibo.subtotalSnap}
          descuento={recibo.descuentoSnap}
          propina={recibo.propinaSnap}
          total={recibo.totalSnap}
          efectivo={recibo.efectivoSnap}
          cambio={recibo.cambioSnap}
          cliente={recibo.clienteSnap}
          barberia={barberia}
          onNuevaVenta={() => setRecibo(null)}
        />
      )}

      {(pendienteServicio || editandoBarberoKey) && (
        <ModalSeleccionarBarbero
          servicio={pendienteServicio || carrito.find(x => x.lineId === editandoBarberoKey)}
          barberos={barberos}
          actual={editandoBarberoKey ? carrito.find(x => x.lineId === editandoBarberoKey)?.barberoId : null}
          onClose={() => { setPendienteServicio(null); setEditandoBarberoKey(null); }}
          onConfirmar={confirmarBarbero}
        />
      )}

      {!cajaActiva && (
        <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 10, padding: "12px 16px", marginBottom: 18, color: "var(--red)", fontSize: 13, display: "flex", alignItems: "center", gap: 10 }}>
          ⚠️ No hay caja abierta. <a href="/caja" style={{ color: "var(--accent)", fontWeight: 600 }}>Abrir caja →</a>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, minHeight: "calc(100vh - 120px)", alignItems: "start" }}>
        {/* ── CATÁLOGO ── */}
        <div>
          {/* Búsqueda de cliente */}
          <div className="card" style={{ padding: "14px 16px", marginBottom: 16, borderColor: clienteSeleccionado ? "rgba(212,175,55,.4)" : "var(--border)" }}>
            <p style={{ fontSize: 10, color: "var(--text2)", fontWeight: 700, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>Cliente</p>
            {clienteSeleccionado ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", fontWeight: 700, fontSize: 16 }}>{clienteSeleccionado.nombre[0]}</div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14 }}>{clienteSeleccionado.nombre} {clienteSeleccionado.apellido || ""}</p>
                    <p style={{ fontSize: 12, color: "var(--text2)" }}>{clienteSeleccionado.telefono} · {clienteSeleccionado.totalVisitas || 0} visitas</p>
                  </div>
                </div>
                <button onClick={() => { setClienteSeleccionado(null); setBusqCliente(""); }} style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: 20, lineHeight: 1 }}>×</button>
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                <input className="input" placeholder="Buscar cliente por nombre o teléfono..." value={busqCliente} onChange={e => setBusqCliente(e.target.value)} style={{ paddingLeft: 36 }} />
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text2)", pointerEvents: "none" }}>🔍</span>
                {clientes.length > 0 && (
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, zIndex: 10, maxHeight: 220, overflowY: "auto", boxShadow: "0 8px 32px rgba(0,0,0,.4)" }}>
                    {clientes.map(c => (
                      <button key={c.id} onClick={() => { setClienteSeleccionado(c); setBusqCliente(""); setClientes([]); }}
                        style={{ width: "100%", padding: "10px 14px", background: "none", border: "none", color: "var(--text)", textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}>
                        <span style={{ fontWeight: 600 }}>{c.nombre} {c.apellido || ""}</span>
                        <span style={{ color: "var(--text2)", fontSize: 12 }}>{c.telefono}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tabs + búsqueda */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
            {[["servicios","✂️ Servicios"],["productos","📦 Productos"]].map(([t, l]) => (
              <button key={t} onClick={() => { setTab(t); setBusqueda(""); }}
                style={{ padding: "9px 18px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13,
                  background: tab === t ? "var(--accent)" : "var(--surface)", color: tab === t ? "#000" : "var(--text2)" }}>
                {l}
              </button>
            ))}
            <input className="input" placeholder={`Buscar ${tab}...`} value={busqueda} onChange={e => setBusqueda(e.target.value)} style={{ flex: 1, fontSize: 13 }} />
          </div>

          {/* Grid de items */}
          {itemsFiltrados.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, color: "var(--text2)" }}>
              <p style={{ fontSize: 36, marginBottom: 8 }}>{tab === "servicios" ? "✂️" : "📦"}</p>
              <p>No hay {tab} disponibles</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
              {itemsFiltrados.map(item => (
                <TarjetaItem key={item.id} item={item} tipo={tab === "servicios" ? "servicio" : "producto"} onAgregar={agregarItem} />
              ))}
            </div>
          )}
        </div>

        {/* ── CARRITO ── */}
        <div className="card" style={{ padding: 0, overflow: "hidden", position: "sticky", top: 20 }}>
          {/* Header carrito */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontWeight: 700, fontSize: 15 }}>Orden {carrito.length > 0 && <span style={{ background: "var(--accent)", color: "#000", borderRadius: 20, padding: "2px 8px", fontSize: 12, marginLeft: 6 }}>{carrito.reduce((s, i) => s + i.cantidad, 0)}</span>}</h3>
            {carrito.length > 0 && <button onClick={() => setCarrito([])} style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: 12 }}>Limpiar</button>}
          </div>

          {/* Items del carrito */}
          <div style={{ minHeight: 120, maxHeight: 320, overflowY: "auto", padding: carrito.length === 0 ? 0 : "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            {carrito.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 20px", color: "var(--text2)" }}>
                <p style={{ fontSize: 36, marginBottom: 8 }}>🛒</p>
                <p style={{ fontSize: 13 }}>Selecciona servicios o productos</p>
              </div>
            ) : carrito.map(item => (
              <div key={item.lineId} style={{ background: "var(--surface2)", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{item.nombre}</p>
                    <span style={{ fontSize: 11, color: "var(--text2)", background: "var(--surface)", padding: "1px 6px", borderRadius: 4 }}>{item.tipo}</span>
                  </div>
                  <button onClick={() => quitarItem(item.lineId)} style={{ background: "rgba(239,68,68,.15)", border: "none", color: "var(--red)", cursor: "pointer", width: 22, height: 22, borderRadius: 6, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
                </div>

                {/* Barbero asignado (solo servicios) */}
                {item.tipo === "servicio" && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, padding: "6px 8px", background: "var(--surface)", borderRadius: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "var(--accent)", overflow: "hidden", flexShrink: 0 }}>
                        {item.barberoFoto ? <img src={item.barberoFoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (item.barberoNombre || "?")[0]}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.barberoNombre}</span>
                    </div>
                    <button onClick={() => setEditandoBarberoKey(item.lineId)} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 11, cursor: "pointer", flexShrink: 0 }}>Cambiar</button>
                  </div>
                )}
                {item.tipo === "servicio" && item.comisionCargando && (
                  <p style={{ fontSize: 11, color: "var(--text2)", marginBottom: 8 }}>Calculando comisión...</p>
                )}
                {item.tipo === "servicio" && !item.comisionCargando && !item.comisionRegla && (
                  <div style={{ marginBottom: 8, padding: "6px 8px", background: "var(--orange-dim)", borderRadius: 8, fontSize: 11.5 }}>
                    <p style={{ color: "var(--orange)", fontWeight: 600 }}>⚠ Comisión no configurada</p>
                    <p style={{ color: "var(--text2)", marginTop: 2 }}>{item.barberoNombre} todavía no tiene una regla para este servicio.</p>
                    {puedeGestionarComision
                      ? <Link href={`/equipo/${item.barberoId}`} target="_blank" style={{ color: "var(--accent)" }}>Configurar comisión →</Link>
                      : <span style={{ color: "var(--text2)" }}>Solicita a un administrador que la configure.</span>}
                  </div>
                )}
                {item.tipo === "servicio" && item.comisionRegla && puedeVerComision && (
                  <p style={{ fontSize: 11, color: "var(--text2)", marginBottom: 8 }}>
                    Comisión {Number(item.comisionRegla.barberoPct)}/{Number(item.comisionRegla.barberiaPct)} · {item.barberoNombre.split(" ")[0]} C$ {fmt(round2(item.precio * item.cantidad * Number(item.comisionRegla.barberoPct) / 100))}
                  </p>
                )}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  {/* Editar precio */}
                  {editandoPrecio === item.lineId ? (
                    <input autoFocus type="number" defaultValue={item.precio} onBlur={e => editarPrecioItem(item.lineId, e.target.value)} onKeyDown={e => e.key === "Enter" && editarPrecioItem(item.lineId, e.target.value)}
                      style={{ width: 90, padding: "3px 6px", borderRadius: 6, border: "1px solid var(--accent)", background: "var(--surface)", color: "var(--text)", fontSize: 14, fontWeight: 700 }} />
                  ) : (
                    <button onClick={() => setEditandoPrecio(item.lineId)} style={{ background: "none", border: "1px dashed transparent", borderRadius: 6, color: "var(--accent)", fontWeight: 700, fontSize: 14, cursor: "pointer", padding: "2px 6px" }}
                      title="Clic para editar precio" onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"} onMouseLeave={e => e.currentTarget.style.borderColor = "transparent"}>
                      C$ {fmt(item.precio)}
                    </button>
                  )}
                  {/* Cantidad */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button onClick={() => cambiarCantidad(item.lineId, -1)} style={{ width: 26, height: 26, borderRadius: 8, background: "#333", border: "none", color: "var(--text)", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                    <span style={{ fontSize: 14, fontWeight: 700, minWidth: 22, textAlign: "center" }}>{item.cantidad}</span>
                    <button onClick={() => cambiarCantidad(item.lineId, 1)} style={{ width: 26, height: 26, borderRadius: 8, background: "#333", border: "none", color: "var(--text)", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                  </div>
                  <span style={{ color: "var(--text2)", fontSize: 13, minWidth: 70, textAlign: "right" }}>C$ {fmt(item.precio * item.cantidad)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Resumen de comisión (solo usuarios autorizados) */}
          {puedeVerComision && barberosEnCarrito.length > 0 && carrito.some(i => i.comisionRegla) && (
            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 4 }}>
              <p style={{ fontSize: 10, color: "var(--text2)", fontWeight: 700, letterSpacing: .5, textTransform: "uppercase", marginBottom: 2 }}>Distribución de comisión</p>
              {barberosEnCarrito.map((b) => {
                const monto = carrito.filter(i => i.tipo === "servicio" && i.barberoId === b.id && i.comisionRegla)
                  .reduce((s, i) => s + round2(i.precio * i.cantidad * Number(i.comisionRegla.barberoPct) / 100), 0);
                return <div key={b.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span style={{ color: "var(--text2)" }}>{b.nombre}</span><span style={{ fontWeight: 600 }}>C$ {fmt(monto)}</span></div>;
              })}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "var(--text2)" }}>Barbería</span>
                <span style={{ fontWeight: 600 }}>C$ {fmt(carrito.filter(i => i.tipo === "servicio" && i.comisionRegla).reduce((s, i) => s + round2(i.precio * i.cantidad * Number(i.comisionRegla.barberiaPct) / 100), 0))}</span>
              </div>
            </div>
          )}

          {/* Propina */}
          {barberosEnCarrito.length > 0 && (
            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ fontSize: 10, color: "var(--text2)", fontWeight: 700, letterSpacing: .5, textTransform: "uppercase" }}>¿Desea agregar propina?</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[0, 50, 100, 200].map((m) => (
                  <button key={m} onClick={() => setPropinaMonto(m)} style={{
                    padding: "6px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer",
                    border: Number(propinaMonto) === m ? "1px solid var(--accent)" : "1px solid var(--border)",
                    background: Number(propinaMonto) === m ? "var(--accent-dim)" : "var(--surface2)",
                    color: Number(propinaMonto) === m ? "var(--accent)" : "var(--text2)", fontWeight: 600,
                  }}>{m === 0 ? "Sin propina" : `C$ ${m}`}</button>
                ))}
                <input type="number" min="0" placeholder="Otro" value={[0, 50, 100, 200].includes(Number(propinaMonto)) ? "" : propinaMonto}
                  onChange={(e) => setPropinaMonto(e.target.value)}
                  style={{ width: 70, padding: "6px 8px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: 12 }} />
              </div>
              {Number(propinaMonto) > 0 && barberosEnCarrito.length > 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                  <p style={{ fontSize: 11.5, color: "var(--text2)" }}>¿Para quién es la propina?</p>
                  {barberosEnCarrito.map((b) => (
                    <label key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, cursor: "pointer" }}>
                      <input type="radio" name="propinaPara" checked={propinaBarberoEfectivo === b.id} onChange={() => setPropinaBarberoId(b.id)} /> {b.nombre}
                    </label>
                  ))}
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, cursor: "pointer" }}>
                    <input type="radio" name="propinaPara" checked={propinaBarberoEfectivo === "DIVIDIR"} onChange={() => setPropinaBarberoId("DIVIDIR")} /> Dividir entre todos
                  </label>
                </div>
              )}
              {Number(propinaMonto) > 0 && barberosEnCarrito.length === 1 && (
                <p style={{ fontSize: 11.5, color: "var(--text2)" }}>Propina para <strong style={{ color: "var(--text)" }}>{barberosEnCarrito[0].nombre}</strong></p>
              )}
            </div>
          )}

          {/* Totales y cobro */}
          <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text2)" }}>
              <span>Subtotal</span><span>C$ {fmt(subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
              <span style={{ color: "var(--text2)" }}>Descuento (C$)</span>
              <input type="number" min="0" max={subtotal} value={descuento} onChange={e => setDescuento(e.target.value)}
                style={{ width: 90, padding: "5px 8px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontSize: 13, textAlign: "right" }} />
            </div>
            {propinaTotal > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text2)" }}>
                <span>Propina</span><span>C$ {fmt(propinaTotal)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 20, padding: "10px 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
              <span>Total</span><span style={{ color: "var(--accent)" }}>C$ {fmt(total)}</span>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--text2)", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: .5 }}>Efectivo recibido</label>
              <input className="input" type="number" min="0" placeholder="0.00" value={efectivo} onChange={e => setEfectivo(e.target.value)}
                style={{ fontSize: 22, fontWeight: 700, textAlign: "center", letterSpacing: 1 }} />
            </div>
            {efectivo && Number(efectivo) >= total ? (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700, padding: "10px 14px", borderRadius: 10, background: "rgba(34,197,94,.08)", color: "var(--green)", border: "1px solid rgba(34,197,94,.2)" }}>
                <span>Cambio</span><span>C$ {fmt(cambio)}</span>
              </div>
            ) : efectivo && Number(efectivo) < total ? (
              <div style={{ fontSize: 13, color: "var(--red)", textAlign: "center", padding: "8px 0" }}>
                ⚠️ Faltan C$ {fmt(total - Number(efectivo))}
              </div>
            ) : null}
            <button onClick={finalizarVenta} disabled={loading || carrito.length === 0 || !efectivo || Number(efectivo) < total}
              style={{ width: "100%", padding: "14px", borderRadius: 12, background: carrito.length === 0 || !efectivo || Number(efectivo) < total ? "#333" : "var(--accent)", color: carrito.length === 0 || !efectivo || Number(efectivo) < total ? "var(--text2)" : "#000", border: "none", cursor: carrito.length === 0 ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 15, transition: "all .2s" }}>
              {loading ? "Procesando..." : "✓ Finalizar Venta"}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
