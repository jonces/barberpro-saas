const router = require("express").Router();
const prisma = require("../lib/prisma");
const { auth, requirePermiso } = require("../middleware/auth");

const ROLES_GESTOR = ["ADMIN", "GERENTE_GENERAL", "SUPERVISOR"];

function esGestor(usuario) {
  return usuario.isSuperAdmin || ROLES_GESTOR.includes(usuario.rol);
}

// Un SUPERVISOR solo administra su propia sucursal; ADMIN/GERENTE_GENERAL administran toda la barbería.
function sucursalPermitida(usuario, sucursalId) {
  if (usuario.isSuperAdmin || usuario.rol === "ADMIN" || usuario.rol === "GERENTE_GENERAL") return true;
  if (usuario.rol === "SUPERVISOR") return !sucursalId || sucursalId === usuario.sucursalId;
  return false;
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function nombreCompleto(u) {
  if (!u) return null;
  return [u.nombre, u.apellido].filter(Boolean).join(" ");
}

async function generarNumeroLiquidacion(barberiaId) {
  const year = new Date().getFullYear();
  const prefijo = `LIQ-${year}-`;
  const count = await prisma.settlement.count({ where: { barberiaId, numero: { startsWith: prefijo } } });
  return `${prefijo}${String(count + 1).padStart(6, "0")}`;
}

// Rango de fechas por defecto: la semana en curso (lunes a hoy) si no se especifica.
function rango(req) {
  const hoy = new Date(); hoy.setHours(23, 59, 59, 999);
  let desde = req.query.desde ? new Date(req.query.desde) : null;
  if (!desde) { desde = new Date(); desde.setDate(desde.getDate() - 7); desde.setHours(0, 0, 0, 0); }
  else desde.setHours(0, 0, 0, 0);
  const hasta = req.query.hasta ? new Date(req.query.hasta) : hoy;
  hasta.setHours(23, 59, 59, 999);
  return { desde, hasta };
}

// Alcance de barberos que el usuario actual puede administrar/ver.
function whereBarberosVisibles(req) {
  const where = { barberiaId: req.usuario.barberiaId, rol: "BARBERO" };
  if (req.usuario.rol === "SUPERVISOR" && !req.usuario.isSuperAdmin) where.sucursalId = req.usuario.sucursalId;
  return where;
}

// Lo que realmente se le debe HOY a un barbero: comisiones+propinas sin
// liquidar, más bonos/ajustes positivos pendientes, menos deducciones y
// adelantos pendientes — la misma fórmula que usa POST / al liquidar.
// No se limita a un período: un adelanto del mes pasado sigue descontando.
async function saldoPendienteBarbero(barberiaId, barberoId) {
  const [comisiones, adelantos, ajustes] = await Promise.all([
    prisma.comision.aggregate({ where: { barberiaId, usuarioId: barberoId, estado: "PENDIENTE" }, _sum: { monto: true, propina: true } }),
    prisma.advance.aggregate({ where: { barberiaId, barberoId, settlementId: null }, _sum: { monto: true } }),
    prisma.adjustment.findMany({ where: { barberiaId, barberoId, settlementId: null } }),
  ]);
  const bonos = round2(ajustes.filter(a => ["BONO", "AJUSTE_POSITIVO"].includes(a.tipo)).reduce((s, a) => s + Number(a.monto), 0));
  const deducciones = round2(ajustes.filter(a => ["DEDUCCION", "AJUSTE_NEGATIVO"].includes(a.tipo)).reduce((s, a) => s + Number(a.monto), 0));
  return round2(Number(comisiones._sum.monto || 0) + Number(comisiones._sum.propina || 0) + bonos - deducciones - Number(adelantos._sum.monto || 0));
}

// ── GET /resumen — KPIs generales del período ──────────────────────────────
router.get("/resumen", auth, requirePermiso("settlement.view"), async (req, res) => {
  const { desde, hasta } = rango(req);
  const bid = req.usuario.barberiaId;
  const barberosVisibles = await prisma.usuario.findMany({ where: whereBarberosVisibles(req), select: { id: true } });
  const barberoIds = barberosVisibles.map(b => b.id);

  const [comisionesPeriodo, liquidadoPeriodo] = await Promise.all([
    prisma.comision.aggregate({
      where: { barberiaId: bid, usuarioId: { in: barberoIds }, creadoEn: { gte: desde, lte: hasta }, estado: { not: "ANULADA" } },
      _sum: { monto: true, montoBarberia: true, propina: true },
    }),
    prisma.settlementPayment.aggregate({
      where: { creadoEn: { gte: desde, lte: hasta }, settlement: { barberiaId: bid, barberoId: { in: barberoIds }, estado: { not: "ANULADA" } } },
      _sum: { monto: true },
    }),
  ]);

  // Saldo sin liquidar: lo que aún no entra a ninguna liquidación (comisiones,
  // bonos, adelantos sueltos) + el saldo abierto de liquidaciones ya creadas
  // pero todavía no pagadas del todo (CONFIRMADA con montoPagado < montoCalculado).
  const [saldosSueltos, abiertas] = await Promise.all([
    Promise.all(barberoIds.map(id => saldoPendienteBarbero(bid, id))),
    prisma.settlement.aggregate({ where: { barberiaId: bid, barberoId: { in: barberoIds }, estado: "CONFIRMADA" }, _sum: { montoCalculado: true, montoPagado: true } }),
  ]);
  const saldoEnLiquidacionesAbiertas = round2(Number(abiertas._sum.montoCalculado || 0) - Number(abiertas._sum.montoPagado || 0));

  res.json({
    ventasServicios: round2(Number(comisionesPeriodo._sum.monto || 0) + Number(comisionesPeriodo._sum.montoBarberia || 0)),
    participacionBarberia: round2(Number(comisionesPeriodo._sum.montoBarberia || 0)),
    generadoBarberos: round2(Number(comisionesPeriodo._sum.monto || 0)),
    propinas: round2(Number(comisionesPeriodo._sum.propina || 0)),
    pendienteLiquidar: round2(saldosSueltos.reduce((s, v) => s + v, 0) + saldoEnLiquidacionesAbiertas),
    yaLiquidado: round2(Number(liquidadoPeriodo._sum.monto || 0)),
  });
});

// ── GET /barberos — listado con saldos por barbero ──────────────────────────
router.get("/barberos", auth, requirePermiso("settlement.view"), async (req, res) => {
  const { desde, hasta } = rango(req);
  const bid = req.usuario.barberiaId;
  const barberos = await prisma.usuario.findMany({ where: whereBarberosVisibles(req), select: { id: true, nombre: true, apellido: true, foto: true } });

  const resultado = await Promise.all(barberos.map(async (b) => {
    const [comisiones, pagosPeriodo, saldoSettlements, saldoSuelto] = await Promise.all([
      prisma.comision.aggregate({ where: { barberiaId: bid, usuarioId: b.id, creadoEn: { gte: desde, lte: hasta }, estado: { not: "ANULADA" } }, _sum: { monto: true, montoBarberia: true, propina: true }, _count: true }),
      prisma.settlementPayment.aggregate({ where: { creadoEn: { gte: desde, lte: hasta }, settlement: { barberoId: b.id, estado: { not: "ANULADA" } } }, _sum: { monto: true } }),
      prisma.settlement.aggregate({ where: { barberoId: b.id, estado: "CONFIRMADA" }, _sum: { montoCalculado: true, montoPagado: true } }),
      saldoPendienteBarbero(bid, b.id),
    ]);
    const saldoEnLiquidacionesAbiertas = round2(Number(saldoSettlements._sum.montoCalculado || 0) - Number(saldoSettlements._sum.montoPagado || 0));
    return {
      id: b.id, nombre: nombreCompleto(b), foto: b.foto,
      servicios: comisiones._count,
      ventasGeneradas: round2(Number(comisiones._sum.monto || 0) + Number(comisiones._sum.montoBarberia || 0)),
      participacionBarbero: round2(Number(comisiones._sum.monto || 0)),
      participacionBarberia: round2(Number(comisiones._sum.montoBarberia || 0)),
      propinas: round2(Number(comisiones._sum.propina || 0)),
      pagado: round2(Number(pagosPeriodo._sum.monto || 0)),
      saldoPendiente: round2(saldoSuelto + saldoEnLiquidacionesAbiertas),
    };
  }));

  res.json(resultado);
});

// ── GET /estado-cuenta/:barberoId — detalle de un barbero ──────────────────
router.get("/estado-cuenta/:barberoId", auth, requirePermiso("commission.view"), async (req, res) => {
  const { barberoId } = req.params;
  if (req.usuario.rol === "BARBERO" && !req.usuario.isSuperAdmin && barberoId !== req.usuario.id) {
    return res.status(403).json({ error: "No puedes consultar el estado de cuenta de otro barbero" });
  }
  const { desde, hasta } = rango(req);
  const bid = req.usuario.barberiaId;

  const barbero = await prisma.usuario.findFirst({ where: { id: barberoId, barberiaId: bid }, select: { id: true, nombre: true, apellido: true, foto: true, sucursalId: true } });
  if (!barbero) return res.status(404).json({ error: "Barbero no encontrado" });
  if (!sucursalPermitida(req.usuario, barbero.sucursalId) && req.usuario.rol !== "BARBERO") {
    return res.status(403).json({ error: "No tienes autoridad sobre la sucursal de este barbero" });
  }

  const [comisiones, adelantos, ajustes, pagos, saldoSuelto, saldoAbiertas] = await Promise.all([
    prisma.comision.findMany({
      where: { barberiaId: bid, usuarioId: barberoId, creadoEn: { gte: desde, lte: hasta }, estado: { not: "ANULADA" } },
      include: { venta: { select: { numeroRecibo: true, metodoPago: true, cliente: { select: { nombre: true, apellido: true } } } }, itemVenta: { select: { nombre: true, precio: true, cantidad: true, descuento: true, subtotal: true } } },
      orderBy: { creadoEn: "desc" },
    }),
    prisma.advance.findMany({ where: { barberiaId: bid, barberoId, settlementId: null }, orderBy: { fecha: "desc" } }),
    prisma.adjustment.findMany({ where: { barberiaId: bid, barberoId, settlementId: null }, orderBy: { fecha: "desc" } }),
    prisma.settlementPayment.findMany({ where: { creadoEn: { gte: desde, lte: hasta }, settlement: { barberoId } }, include: { settlement: { select: { numero: true } } }, orderBy: { creadoEn: "desc" } }),
    saldoPendienteBarbero(bid, barberoId),
    prisma.settlement.aggregate({ where: { barberiaId: bid, barberoId, estado: "CONFIRMADA" }, _sum: { montoCalculado: true, montoPagado: true } }),
  ]);
  // Saldo real = lo que aún no entra a ninguna liquidación + lo que ya quedó
  // "cerrado" en una liquidación CONFIRMADA pero todavía no se ha pagado del todo.
  const saldoReal = round2(saldoSuelto + Number(saldoAbiertas._sum.montoCalculado || 0) - Number(saldoAbiertas._sum.montoPagado || 0));

  const totalComisiones = round2(comisiones.reduce((s, c) => s + Number(c.monto), 0));
  const totalPropinas = round2(comisiones.reduce((s, c) => s + Number(c.propina), 0));
  const totalAdelantos = round2(adelantos.reduce((s, a) => s + Number(a.monto), 0));
  const totalBonos = round2(ajustes.filter(a => ["BONO", "AJUSTE_POSITIVO"].includes(a.tipo)).reduce((s, a) => s + Number(a.monto), 0));
  const totalDeducciones = round2(ajustes.filter(a => ["DEDUCCION", "AJUSTE_NEGATIVO"].includes(a.tipo)).reduce((s, a) => s + Number(a.monto), 0));
  const totalPagado = round2(pagos.reduce((s, p) => s + Number(p.monto), 0));

  res.json({
    barbero: { id: barbero.id, nombre: nombreCompleto(barbero), foto: barbero.foto },
    periodo: { desde, hasta },
    kpis: {
      servicios: comisiones.length,
      ventasGeneradas: round2(totalComisiones + comisiones.reduce((s, c) => s + Number(c.montoBarberia || 0), 0)),
      comision: totalComisiones,
      propinas: totalPropinas,
      adelantos: totalAdelantos,
      bonos: totalBonos,
      deducciones: totalDeducciones,
      pagado: totalPagado,
      saldoPendiente: saldoReal,
    },
    detalle: comisiones.map(c => ({
      id: c.id, fecha: c.creadoEn, factura: c.venta.numeroRecibo,
      cliente: c.venta.cliente ? nombreCompleto(c.venta.cliente) : null,
      servicio: c.itemVenta?.nombre, precio: c.itemVenta?.precio, descuento: c.itemVenta?.descuento, neto: c.itemVenta?.subtotal,
      porcentaje: c.porcentaje, montoBarbero: c.monto, montoBarberia: c.montoBarberia, propina: c.propina, estado: c.estado,
    })),
    adelantosPendientes: adelantos, ajustesPendientes: ajustes, pagosDelPeriodo: pagos,
  });
});

// ── GET /adelantos y /ajustes — listado (para armar el modal de liquidar) ──
router.get("/adelantos", auth, requirePermiso("commission.view"), async (req, res) => {
  const { barberoId, pendientes } = req.query;
  const where = { barberiaId: req.usuario.barberiaId };
  if (req.usuario.rol === "BARBERO" && !req.usuario.isSuperAdmin) where.barberoId = req.usuario.id;
  else if (barberoId) where.barberoId = barberoId;
  if (pendientes === "true") where.settlementId = null;
  res.json(await prisma.advance.findMany({ where, orderBy: { fecha: "desc" }, take: 100 }));
});

router.get("/ajustes", auth, requirePermiso("commission.view"), async (req, res) => {
  const { barberoId, pendientes } = req.query;
  const where = { barberiaId: req.usuario.barberiaId };
  if (req.usuario.rol === "BARBERO" && !req.usuario.isSuperAdmin) where.barberoId = req.usuario.id;
  else if (barberoId) where.barberoId = barberoId;
  if (pendientes === "true") where.settlementId = null;
  res.json(await prisma.adjustment.findMany({ where, orderBy: { fecha: "desc" }, take: 100 }));
});

// ── POST /adelantos — registrar adelanto ────────────────────────────────────
router.post("/adelantos", auth, requirePermiso("advance.create"), async (req, res) => {
  try {
    const { barberoId, monto, metodo, motivo } = req.body;
    if (!barberoId || !(Number(monto) > 0)) return res.status(400).json({ error: "barberoId y monto (> 0) son obligatorios" });
    const barbero = await prisma.usuario.findFirst({ where: { id: barberoId, barberiaId: req.usuario.barberiaId } });
    if (!barbero) return res.status(404).json({ error: "Barbero no encontrado" });
    if (!sucursalPermitida(req.usuario, barbero.sucursalId)) return res.status(403).json({ error: "No tienes autoridad sobre la sucursal de este barbero" });

    const adelanto = await prisma.advance.create({
      data: { barberiaId: req.usuario.barberiaId, barberoId, monto: round2(Number(monto)), metodo: metodo || "EFECTIVO", motivo: motivo || null, responsableId: req.usuario.id },
    });
    res.status(201).json(adelanto);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ── POST /ajustes — registrar bono/deducción manual ─────────────────────────
router.post("/ajustes", auth, requirePermiso("adjustment.create"), async (req, res) => {
  try {
    const { barberoId, tipo, monto, motivo } = req.body;
    if (!barberoId || !tipo || !(Number(monto) > 0) || !motivo) {
      return res.status(400).json({ error: "barberoId, tipo, monto (> 0) y motivo son obligatorios" });
    }
    if (!["BONO", "DEDUCCION", "AJUSTE_POSITIVO", "AJUSTE_NEGATIVO"].includes(tipo)) {
      return res.status(400).json({ error: "Tipo de ajuste inválido" });
    }
    const barbero = await prisma.usuario.findFirst({ where: { id: barberoId, barberiaId: req.usuario.barberiaId } });
    if (!barbero) return res.status(404).json({ error: "Barbero no encontrado" });
    if (!sucursalPermitida(req.usuario, barbero.sucursalId)) return res.status(403).json({ error: "No tienes autoridad sobre la sucursal de este barbero" });

    const ajuste = await prisma.adjustment.create({
      data: { barberiaId: req.usuario.barberiaId, barberoId, tipo, monto: round2(Number(monto)), motivo, responsableId: req.usuario.id },
    });
    res.status(201).json(ajuste);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ── GET / — historial de liquidaciones ──────────────────────────────────────
router.get("/", auth, requirePermiso("settlement.view"), async (req, res) => {
  const { barberoId } = req.query;
  const where = { barberiaId: req.usuario.barberiaId };
  if (req.usuario.rol === "BARBERO" && !req.usuario.isSuperAdmin) where.barberoId = req.usuario.id;
  else if (barberoId) where.barberoId = barberoId;
  const liquidaciones = await prisma.settlement.findMany({
    where, include: { barbero: { select: { id: true, nombre: true, apellido: true, foto: true } }, creadoPor: { select: { nombre: true, apellido: true } } },
    orderBy: { creadoEn: "desc" }, take: 100,
  });
  res.json(liquidaciones);
});

// ── GET /:id — comprobante / detalle completo ───────────────────────────────
router.get("/:id", auth, requirePermiso("settlement.view"), async (req, res) => {
  const liq = await prisma.settlement.findFirst({
    where: { id: req.params.id, barberiaId: req.usuario.barberiaId },
    include: {
      barbero: { select: { id: true, nombre: true, apellido: true, foto: true } },
      creadoPor: { select: { nombre: true, apellido: true, rol: true } },
      anuladoPor: { select: { nombre: true, apellido: true, rol: true } },
      comisiones: true, adelantos: true, ajustes: true,
      pagos: { include: { registradoPor: { select: { nombre: true, apellido: true } } }, orderBy: { creadoEn: "asc" } },
    },
  });
  if (!liq) return res.status(404).json({ error: "No encontrada" });
  if (req.usuario.rol === "BARBERO" && !req.usuario.isSuperAdmin && liq.barberoId !== req.usuario.id) {
    return res.status(403).json({ error: "No puedes ver esta liquidación" });
  }
  res.json(liq);
});

// ── POST / — crear liquidación (Liquidar) ───────────────────────────────────
router.post("/", auth, requirePermiso("settlement.create"), async (req, res) => {
  try {
    if (!esGestor(req.usuario)) return res.status(403).json({ error: "Rol insuficiente para liquidar" });
    const { barberoId, periodoDesde, periodoHasta, notas, pago } = req.body;
    if (!barberoId || !periodoDesde || !periodoHasta) return res.status(400).json({ error: "barberoId, periodoDesde y periodoHasta son obligatorios" });

    const barbero = await prisma.usuario.findFirst({ where: { id: barberoId, barberiaId: req.usuario.barberiaId } });
    if (!barbero) return res.status(404).json({ error: "Barbero no encontrado" });
    if (!sucursalPermitida(req.usuario, barbero.sucursalId)) return res.status(403).json({ error: "No tienes autoridad sobre la sucursal de este barbero" });

    const desde = new Date(periodoDesde); desde.setHours(0, 0, 0, 0);
    const hasta = new Date(periodoHasta); hasta.setHours(23, 59, 59, 999);

    if (pago && Number(pago.monto) > 0 && !(req.usuario.isSuperAdmin || (req.usuario.permisos || []).includes("settlement.approve"))) {
      return res.status(403).json({ error: "No tienes permiso para registrar el pago; puedes crear la liquidación sin pago para que otro usuario lo apruebe" });
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const comisiones = await tx.comision.findMany({ where: { barberiaId: req.usuario.barberiaId, usuarioId: barberoId, creadoEn: { gte: desde, lte: hasta }, estado: "PENDIENTE" } });
      const adelantos = await tx.advance.findMany({ where: { barberiaId: req.usuario.barberiaId, barberoId, settlementId: null } });
      const ajustes = await tx.adjustment.findMany({ where: { barberiaId: req.usuario.barberiaId, barberoId, settlementId: null } });

      const totalComisiones = round2(comisiones.reduce((s, c) => s + Number(c.monto), 0));
      const totalPropinas = round2(comisiones.reduce((s, c) => s + Number(c.propina), 0));
      const totalAdelantos = round2(adelantos.reduce((s, a) => s + Number(a.monto), 0));
      const totalBonos = round2(ajustes.filter(a => ["BONO", "AJUSTE_POSITIVO"].includes(a.tipo)).reduce((s, a) => s + Number(a.monto), 0));
      const totalDeducciones = round2(ajustes.filter(a => ["DEDUCCION", "AJUSTE_NEGATIVO"].includes(a.tipo)).reduce((s, a) => s + Number(a.monto), 0));
      const montoCalculado = round2(totalComisiones + totalPropinas + totalBonos - totalDeducciones - totalAdelantos);

      if (comisiones.length === 0 && adelantos.length === 0 && ajustes.length === 0) {
        throw Object.assign(new Error("No hay comisiones, adelantos ni ajustes pendientes para liquidar en este período"), { status: 400 });
      }

      const numero = await generarNumeroLiquidacion(req.usuario.barberiaId);
      const montoPago = pago && Number(pago.monto) > 0 ? round2(Number(pago.monto)) : 0;
      if (montoPago > montoCalculado) throw Object.assign(new Error("El pago no puede ser mayor al monto calculado"), { status: 400 });

      const liq = await tx.settlement.create({
        data: {
          barberiaId: req.usuario.barberiaId, barberoId, numero,
          periodoDesde: desde, periodoHasta: hasta,
          totalComisiones, totalPropinas, totalBonos, totalDeducciones, totalAdelantos,
          montoCalculado, montoPagado: montoPago,
          estado: montoPago >= montoCalculado && montoCalculado > 0 ? "PAGADA" : "CONFIRMADA",
          notas: notas || null, creadoPorId: req.usuario.id,
        },
      });

      if (comisiones.length) await tx.comision.updateMany({ where: { id: { in: comisiones.map(c => c.id) } }, data: { estado: "LIQUIDADA", liquidacionId: liq.id } });
      if (adelantos.length) await tx.advance.updateMany({ where: { id: { in: adelantos.map(a => a.id) } }, data: { settlementId: liq.id } });
      if (ajustes.length) await tx.adjustment.updateMany({ where: { id: { in: ajustes.map(a => a.id) } }, data: { settlementId: liq.id } });

      if (montoPago > 0) {
        await tx.settlementPayment.create({
          data: { settlementId: liq.id, monto: montoPago, metodo: pago.metodo || "EFECTIVO", referencia: pago.referencia || null, notas: pago.notas || null, registradoPorId: req.usuario.id },
        });
      }

      return liq;
    });

    const conRelaciones = await prisma.settlement.findUnique({
      where: { id: resultado.id },
      include: { barbero: { select: { id: true, nombre: true, apellido: true } }, creadoPor: { select: { nombre: true, apellido: true, rol: true } }, pagos: true },
    });
    res.status(201).json(conRelaciones);
  } catch (e) { res.status(e.status || 400).json({ error: e.message }); }
});

// ── POST /:id/pagos — abono adicional a una liquidación con saldo pendiente ─
router.post("/:id/pagos", auth, requirePermiso("settlement.approve"), async (req, res) => {
  try {
    const { monto, metodo, referencia, notas } = req.body;
    if (!(Number(monto) > 0)) return res.status(400).json({ error: "El monto debe ser mayor a 0" });

    const liq = await prisma.settlement.findFirst({ where: { id: req.params.id, barberiaId: req.usuario.barberiaId } });
    if (!liq) return res.status(404).json({ error: "No encontrada" });
    if (liq.estado === "ANULADA") return res.status(400).json({ error: "Esta liquidación fue anulada" });
    if (liq.estado === "PAGADA") return res.status(400).json({ error: "Esta liquidación ya está completamente pagada" });
    if (!sucursalPermitida(req.usuario, (await prisma.usuario.findUnique({ where: { id: liq.barberoId } }))?.sucursalId)) {
      return res.status(403).json({ error: "No tienes autoridad sobre la sucursal de este barbero" });
    }

    const saldoPendiente = round2(Number(liq.montoCalculado) - Number(liq.montoPagado));
    if (round2(Number(monto)) > saldoPendiente) return res.status(400).json({ error: `El abono no puede exceder el saldo pendiente (C$ ${saldoPendiente})` });

    const actualizado = await prisma.$transaction(async (tx) => {
      await tx.settlementPayment.create({ data: { settlementId: liq.id, monto: round2(Number(monto)), metodo: metodo || "EFECTIVO", referencia: referencia || null, notas: notas || null, registradoPorId: req.usuario.id } });
      const nuevoPagado = round2(Number(liq.montoPagado) + Number(monto));
      return tx.settlement.update({ where: { id: liq.id }, data: { montoPagado: nuevoPagado, estado: nuevoPagado >= Number(liq.montoCalculado) ? "PAGADA" : "CONFIRMADA" } });
    });
    res.json(actualizado);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ── POST /:id/anular — anular liquidación sin pagos registrados ────────────
router.post("/:id/anular", auth, requirePermiso("settlement.void"), async (req, res) => {
  try {
    if (!esGestor(req.usuario)) return res.status(403).json({ error: "Rol insuficiente" });
    const { motivo } = req.body;
    if (!motivo) return res.status(400).json({ error: "El motivo es obligatorio" });

    const liq = await prisma.settlement.findFirst({ where: { id: req.params.id, barberiaId: req.usuario.barberiaId } });
    if (!liq) return res.status(404).json({ error: "No encontrada" });
    if (liq.estado === "ANULADA") return res.status(400).json({ error: "Ya está anulada" });
    if (Number(liq.montoPagado) > 0) {
      return res.status(400).json({ error: "No se puede anular una liquidación con pagos ya registrados. Registra un ajuste para corregirla." });
    }

    const actualizado = await prisma.$transaction(async (tx) => {
      await tx.comision.updateMany({ where: { liquidacionId: liq.id }, data: { estado: "PENDIENTE", liquidacionId: null } });
      await tx.advance.updateMany({ where: { settlementId: liq.id }, data: { settlementId: null } });
      await tx.adjustment.updateMany({ where: { settlementId: liq.id }, data: { settlementId: null } });
      return tx.settlement.update({ where: { id: liq.id }, data: { estado: "ANULADA", anuladoPorId: req.usuario.id, motivoAnulacion: motivo, anuladoEn: new Date() } });
    });
    res.json(actualizado);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;
