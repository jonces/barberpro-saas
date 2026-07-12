const router = require("express").Router();
const prisma = require("../lib/prisma");
const { auth } = require("../middleware/auth");

function generarNumeroRecibo(barberiaId) {
  const fecha = new Date();
  const yy = String(fecha.getFullYear()).slice(-2);
  const mm = String(fecha.getMonth() + 1).padStart(2, "0");
  const dd = String(fecha.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `REC-${yy}${mm}${dd}-${rand}`;
}

router.get("/", auth, async (req, res) => {
  const { desde, hasta, usuarioId, clienteId } = req.query;
  const where = { barberiaId: req.usuario.barberiaId };
  if (desde || hasta) where.creadoEn = { gte: desde ? new Date(desde) : undefined, lte: hasta ? new Date(hasta) : undefined };
  if (usuarioId) where.usuarioId = usuarioId;
  if (clienteId) where.clienteId = clienteId;
  const ventas = await prisma.venta.findMany({ where, include: { cliente: true, usuario: { select: { id:true,nombre:true } }, items: true }, orderBy: { creadoEn: "desc" }, take: 100 });
  res.json(ventas);
});

router.post("/", auth, async (req, res) => {
  try {
    const { clienteId, cajaId, items, descuento = 0, efectivoRecibido, notas } = req.body;
    const subtotal = items.reduce((s, i) => s + i.precio * i.cantidad - (i.descuento || 0), 0);
    const total = subtotal - descuento;
    const cambio = efectivoRecibido - total;
    if (cambio < 0) return res.status(400).json({ error: "Efectivo insuficiente" });

    const venta = await prisma.$transaction(async (tx) => {
      const v = await tx.venta.create({
        data: {
          barberiaId: req.usuario.barberiaId,
          usuarioId: req.usuario.id,
          clienteId: clienteId || null,
          cajaId: cajaId || null,
          numeroRecibo: generarNumeroRecibo(req.usuario.barberiaId),
          subtotal, descuento, total, efectivoRecibido, cambio,
          notas,
          items: {
            create: items.map(i => ({
              servicioId: i.servicioId || null,
              productoId: i.productoId || null,
              nombre: i.nombre,
              precio: i.precio,
              cantidad: i.cantidad,
              descuento: i.descuento || 0,
              subtotal: i.precio * i.cantidad - (i.descuento || 0),
              barberoId: i.barberoId || null,
            }))
          }
        },
        include: { items: true, cliente: true },
      });

      // Descontar inventario de productos
      for (const item of items.filter(i => i.productoId)) {
        const prod = await tx.producto.findUnique({ where: { id: item.productoId } });
        await tx.producto.update({ where: { id: item.productoId }, data: { stock: { decrement: item.cantidad } } });
        await tx.movimientoInventario.create({
          data: { productoId: item.productoId, tipo: "VENTA", cantidad: item.cantidad, stockAntes: prod.stock, stockDespues: prod.stock - item.cantidad, usuarioId: req.usuario.id }
        });
      }

      // Actualizar stats del cliente
      if (clienteId) {
        await tx.cliente.update({
          where: { id: clienteId },
          data: { totalVisitas: { increment: 1 }, totalGastado: { increment: total }, ultimaVisita: new Date() }
        });
      }

      // Actualizar caja
      if (cajaId) {
        await tx.caja.update({ where: { id: cajaId }, data: { totalVentas: { increment: total } } });
        await tx.movimientoCaja.create({
          data: { barberiaId: req.usuario.barberiaId, cajaId, tipo: "VENTA", monto: total, descripcion: `Venta ${v.numeroRecibo}`, usuarioId: req.usuario.id }
        });
      }

      return v;
    });

    res.status(201).json(venta);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.get("/:id", auth, async (req, res) => {
  const v = await prisma.venta.findUnique({ where: { id: req.params.id }, include: { items: { include: { servicio: true, producto: true } }, cliente: true, usuario: { select: { id:true,nombre:true } }, caja: true } });
  if (!v) return res.status(404).json({ error: "No encontrada" });
  res.json(v);
});

module.exports = router;
