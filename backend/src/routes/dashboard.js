const router = require("express").Router();
const prisma = require("../lib/prisma");
const { auth } = require("../middleware/auth");

function pct(actual, anterior) {
  if (!anterior) return null;
  return Math.round(((actual - anterior) / anterior) * 1000) / 10;
}

function nombreCompleto(u) {
  if (!u) return null;
  return [u.nombre, u.apellido].filter(Boolean).join(" ");
}

router.get("/", auth, async (req, res) => {
  try {
    const bid = req.usuario.barberiaId;
    const puedeVerFinanzas = req.usuario.isSuperAdmin || req.usuario.rol === "ADMIN" || req.usuario.rol === "SUPERVISOR" || (req.usuario.permisos || []).includes("ver_estadisticas");

    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const finHoy = new Date(); finHoy.setHours(23, 59, 59, 999);
    const ayer = new Date(hoy); ayer.setDate(ayer.getDate() - 1);
    const finAyer = new Date(finHoy); finAyer.setDate(finAyer.getDate() - 1);
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const finMesAnterior = new Date(inicioMes.getTime() - 1);

    const periodo = ["7d", "30d", "mes"].includes(req.query.periodo) ? req.query.periodo : "7d";
    const dias = periodo === "30d" ? 30 : periodo === "mes" ? hoy.getDate() : 7;

    const [
      ventasHoy, ventasAyer, ventasMes, ventasMesAnterior,
      clientesTotal, clientesNuevosMes,
      citasHoyLista,
      cajaActiva,
      sinStock, stockBajo,
      topServicios,
      ventasRecientes, citasRecientes, cajasRecientes,
    ] = await Promise.all([
      prisma.venta.aggregate({ where: { barberiaId: bid, creadoEn: { gte: hoy, lte: finHoy }, estado: "COMPLETADA" }, _sum: { total: true }, _count: true }),
      prisma.venta.aggregate({ where: { barberiaId: bid, creadoEn: { gte: ayer, lte: finAyer }, estado: "COMPLETADA" }, _sum: { total: true } }),
      prisma.venta.aggregate({ where: { barberiaId: bid, creadoEn: { gte: inicioMes }, estado: "COMPLETADA" }, _sum: { total: true }, _count: true }),
      prisma.venta.aggregate({ where: { barberiaId: bid, creadoEn: { gte: inicioMesAnterior, lte: finMesAnterior }, estado: "COMPLETADA" }, _sum: { total: true } }),
      prisma.cliente.count({ where: { barberiaId: bid, estado: true } }),
      prisma.cliente.count({ where: { barberiaId: bid, creadoEn: { gte: inicioMes } } }),
      prisma.cita.findMany({
        where: { barberiaId: bid, fecha: { gte: hoy, lte: finHoy } },
        include: { cliente: true, barbero: { select: { id: true, nombre: true, apellido: true, foto: true } }, items: { include: { servicio: true } } },
        orderBy: { fecha: "asc" },
      }),
      prisma.caja.findFirst({ where: { barberiaId: bid, estado: "ABIERTA" } }),
      prisma.producto.count({ where: { barberiaId: bid, estado: true, stock: 0 } }),
      prisma.producto.count({ where: { barberiaId: bid, estado: true, stock: { gt: 0, lte: prisma.producto.fields.stockMinimo } } }),
      prisma.itemVenta.groupBy({
        by: ["nombre"],
        where: { venta: { barberiaId: bid, creadoEn: { gte: inicioMes }, estado: "COMPLETADA" }, servicioId: { not: null } },
        _sum: { cantidad: true, subtotal: true },
        orderBy: { _sum: { cantidad: "desc" } },
        take: 3,
      }),
      prisma.venta.findMany({ where: { barberiaId: bid, estado: "COMPLETADA" }, include: { items: true }, orderBy: { creadoEn: "desc" }, take: 5 }),
      prisma.cita.findMany({ where: { barberiaId: bid, estado: "COMPLETADA" }, include: { cliente: true, barbero: { select: { nombre: true, apellido: true } } }, orderBy: { actualizadoEn: "desc" }, take: 5 }),
      prisma.caja.findMany({ where: { barberiaId: bid, abiertoEn: { not: null } }, include: { }, orderBy: { abiertoEn: "desc" }, take: 3 }),
    ]);

    const cajaAperturasUsuarios = cajasRecientes.length
      ? await prisma.usuario.findMany({ where: { id: { in: cajasRecientes.map(c => c.abiertaPor).filter(Boolean) } }, select: { id: true, nombre: true, apellido: true } })
      : [];

    // Gráfico de ventas del período
    const graficoVentas = await Promise.all(
      Array.from({ length: dias }, (_, i) => {
        const d = new Date(hoy); d.setDate(d.getDate() - (dias - 1 - i));
        const f = new Date(d); f.setHours(23, 59, 59, 999);
        return prisma.venta.aggregate({ where: { barberiaId: bid, creadoEn: { gte: d, lte: f }, estado: "COMPLETADA" }, _sum: { total: true } })
          .then(r => ({ fecha: d.toISOString().split("T")[0], total: Number(r._sum.total || 0) }));
      })
    );
    const totalPeriodo = graficoVentas.reduce((s, p) => s + p.total, 0);
    const promedioDiario = dias ? totalPeriodo / dias : 0;

    // Citas de hoy
    const ahora = new Date();
    const proxima = citasHoyLista.find(c => new Date(c.fecha) >= ahora && ["PENDIENTE", "CONFIRMADA"].includes(c.estado));
    const citasProximas = citasHoyLista.slice(0, 5).map(c => ({
      id: c.id,
      hora: c.fecha,
      cliente: c.cliente ? nombreCompleto(c.cliente) : "Cliente sin registrar",
      clienteFoto: c.cliente?.foto || null,
      servicio: c.items.map(i => i.servicio?.nombre).filter(Boolean).join(" + ") || null,
      duracion: c.duracion,
      barbero: nombreCompleto(c.barbero),
      estado: c.estado,
    }));

    // Rendimiento del equipo (por servicio realizado, mes actual)
    const rendimientoRaw = await prisma.itemVenta.groupBy({
      by: ["barberoId"],
      where: { barberoId: { not: null }, venta: { barberiaId: bid, creadoEn: { gte: inicioMes }, estado: "COMPLETADA" }, servicioId: { not: null } },
      _sum: { cantidad: true, subtotal: true },
      orderBy: { _sum: { subtotal: "desc" } },
      take: 3,
    });
    const barberoIds = rendimientoRaw.map(r => r.barberoId);
    const barberos = barberoIds.length ? await prisma.usuario.findMany({ where: { id: { in: barberoIds } }, select: { id: true, nombre: true, apellido: true, foto: true } }) : [];
    const rendimientoEquipo = rendimientoRaw.map(r => {
      const b = barberos.find(x => x.id === r.barberoId);
      const esUnoMismo = r.barberoId === req.usuario.id;
      return {
        id: r.barberoId,
        nombre: nombreCompleto(b) || "Barbero",
        foto: b?.foto || null,
        servicios: r._sum.cantidad || 0,
        generado: (puedeVerFinanzas || esUnoMismo) ? Number(r._sum.subtotal || 0) : null,
      };
    });

    // Actividad reciente (combinada)
    const actividad = [];
    for (const v of ventasRecientes) {
      const soloProductos = v.items.length > 0 && v.items.every(i => i.productoId);
      if (soloProductos) {
        const primero = v.items[0];
        actividad.push({ tipo: "venta_producto", hora: v.creadoEn, titulo: "Venta de producto", detalle: `${primero.nombre} · ${primero.cantidad} unidad${primero.cantidad > 1 ? "es" : ""}` });
      } else {
        actividad.push({ tipo: "venta", hora: v.creadoEn, titulo: `Venta #${v.numeroRecibo}`, detalle: `C$ ${Number(v.total).toLocaleString("es-NI")} · ${v.metodoPago}` });
      }
    }
    for (const c of citasRecientes) {
      actividad.push({ tipo: "cita_completada", hora: c.actualizadoEn, titulo: "Cita completada", detalle: `${c.cliente ? nombreCompleto(c.cliente) : "Cliente"} · ${nombreCompleto(c.barbero) || "—"}` });
    }
    for (const c of cajasRecientes) {
      const u = cajaAperturasUsuarios.find(x => x.id === c.abiertaPor);
      actividad.push({ tipo: "caja_abierta", hora: c.abiertoEn, titulo: "Caja abierta", detalle: `${nombreCompleto(u) || "—"} · C$ ${Number(c.montoInicial).toLocaleString("es-NI")} inicial` });
    }
    actividad.sort((a, b) => new Date(b.hora) - new Date(a.hora));

    // Alertas
    const alertas = [];
    if (sinStock > 0) alertas.push({ tipo: "error", titulo: `${sinStock} producto${sinStock > 1 ? "s" : ""} sin stock`, detalle: "Requieren reposición inmediata" });
    if (stockBajo > 0) alertas.push({ tipo: "warning", titulo: `${stockBajo} producto${stockBajo > 1 ? "s" : ""} con stock bajo`, detalle: "Revisa tu inventario" });
    const citasPendientes = citasHoyLista.filter(c => c.estado === "PENDIENTE").length;
    if (citasPendientes > 0) alertas.push({ tipo: "info", titulo: `${citasPendientes} cita${citasPendientes > 1 ? "s" : ""} pendiente${citasPendientes > 1 ? "s" : ""} de confirmar`, detalle: "Confirma para evitar ausencias" });

    res.json({
      permisoFinanzas: puedeVerFinanzas,
      ventasHoy: { total: puedeVerFinanzas ? Number(ventasHoy._sum.total || 0) : null, cantidad: ventasHoy._count, variacion: puedeVerFinanzas ? pct(Number(ventasHoy._sum.total || 0), Number(ventasAyer._sum.total || 0)) : null },
      ventasMes: { total: puedeVerFinanzas ? Number(ventasMes._sum.total || 0) : null, cantidad: ventasMes._count, variacion: puedeVerFinanzas ? pct(Number(ventasMes._sum.total || 0), Number(ventasMesAnterior._sum.total || 0)) : null },
      clientesTotal, clientesNuevosMes,
      citasHoy: {
        total: citasHoyLista.length,
        confirmadas: citasHoyLista.filter(c => c.estado === "CONFIRMADA").length,
        pendientes: citasPendientes,
        proxima: proxima ? { hora: proxima.fecha, cliente: proxima.cliente ? nombreCompleto(proxima.cliente) : null } : null,
      },
      caja: cajaActiva ? {
        abierta: true,
        nombre: cajaActiva.nombre,
        montoActual: puedeVerFinanzas ? Number(cajaActiva.montoInicial) + Number(cajaActiva.totalVentas) : null,
        abiertoEn: cajaActiva.abiertoEn,
      } : { abierta: false },
      inventario: { sinStock, stockBajo, total: sinStock + stockBajo },
      periodo, graficoVentas, totalPeriodo, promedioDiario,
      citasProximas,
      topServicios: topServicios.map(s => ({ nombre: s.nombre, cantidad: s._sum.cantidad || 0, total: Number(s._sum.subtotal || 0) })),
      actividadReciente: actividad.slice(0, 6),
      rendimientoEquipo,
      alertas,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Stats superadmin
router.get("/superadmin", auth, async (req, res) => {
  if (!req.usuario.isSuperAdmin) return res.status(403).json({ error: "Solo superadmin" });
  const [totalBarberias, activas, suspendidas, totalUsuarios] = await Promise.all([
    prisma.barberia.count(),
    prisma.barberia.count({ where: { estado: "ACTIVA" } }),
    prisma.barberia.count({ where: { estado: "SUSPENDIDA" } }),
    prisma.usuario.count({ where: { isSuperAdmin: false } }),
  ]);
  const recientes = await prisma.barberia.findMany({ orderBy: { creadoEn: "desc" }, take: 5, include: { _count: { select: { usuarios: true } } } });
  res.json({ totalBarberias, activas, suspendidas, totalUsuarios, recientes });
});

module.exports = router;
