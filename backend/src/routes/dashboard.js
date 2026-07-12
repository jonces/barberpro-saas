const router = require("express").Router();
const prisma = require("../lib/prisma");
const { auth } = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  try {
    const bid = req.usuario.barberiaId;
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const fin = new Date(); fin.setHours(23,59,59,999);
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const [ventasHoy, ventasMes, clientesTotal, clientesNuevosMes, citasHoy, cajaActiva, inventarioBajo, usuarios] = await Promise.all([
      prisma.venta.aggregate({ where: { barberiaId: bid, creadoEn: { gte: hoy, lte: fin }, estado: "COMPLETADA" }, _sum: { total: true }, _count: true }),
      prisma.venta.aggregate({ where: { barberiaId: bid, creadoEn: { gte: inicioMes }, estado: "COMPLETADA" }, _sum: { total: true }, _count: true }),
      prisma.cliente.count({ where: { barberiaId: bid, estado: true } }),
      prisma.cliente.count({ where: { barberiaId: bid, creadoEn: { gte: inicioMes } } }),
      prisma.cita.count({ where: { barberiaId: bid, fecha: { gte: hoy, lte: fin }, estado: { in: ["PENDIENTE","CONFIRMADA","EN_PROGRESO"] } } }),
      prisma.caja.findFirst({ where: { barberiaId: bid, estado: "ABIERTA" } }),
      prisma.producto.count({ where: { barberiaId: bid, estado: true, stock: { lte: prisma.producto.fields.stockMinimo } } }),
      prisma.usuario.count({ where: { barberiaId: bid, estado: true } }),
    ]);

    // Ventas últimos 7 días para gráfico
    const ultimos7 = await Promise.all(
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(hoy); d.setDate(d.getDate() - (6 - i));
        const f = new Date(d); f.setHours(23,59,59,999);
        return prisma.venta.aggregate({ where: { barberiaId: bid, creadoEn: { gte: d, lte: f }, estado: "COMPLETADA" }, _sum: { total: true } })
          .then(r => ({ fecha: d.toISOString().split("T")[0], total: Number(r._sum.total || 0) }));
      })
    );

    // Top servicios del mes
    const topServicios = await prisma.itemVenta.groupBy({
      by: ["nombre"],
      where: { venta: { barberiaId: bid, creadoEn: { gte: inicioMes }, estado: "COMPLETADA" }, servicioId: { not: null } },
      _sum: { cantidad: true, subtotal: true },
      orderBy: { _sum: { cantidad: "desc" } },
      take: 5,
    });

    res.json({
      ventasHoy: { total: Number(ventasHoy._sum.total || 0), cantidad: ventasHoy._count },
      ventasMes: { total: Number(ventasMes._sum.total || 0), cantidad: ventasMes._count },
      clientesTotal,
      clientesNuevosMes,
      citasHoy,
      cajaActiva: !!cajaActiva,
      inventarioBajo,
      usuarios,
      graficoVentas: ultimos7,
      topServicios,
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
