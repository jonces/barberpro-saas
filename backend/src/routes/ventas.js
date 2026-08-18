const router = require("express").Router();
const prisma = require("../lib/prisma");
const { auth } = require("../middleware/auth");
const { resolverReglaVigente } = require("./comisiones");

function generarNumeroRecibo(barberiaId) {
  const fecha = new Date();
  const yy = String(fecha.getFullYear()).slice(-2);
  const mm = String(fecha.getMonth() + 1).padStart(2, "0");
  const dd = String(fecha.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `REC-${yy}${mm}${dd}-${rand}`;
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
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
    if (!items || items.length === 0) return res.status(400).json({ error: "La venta necesita al menos un ítem" });

    // ── Regla fundamental: no existe servicio cobrado sin barbero responsable
    // ni sin una regla de comisión configurada. Se valida TODO antes de
    // escribir nada — o se crea la venta completa, o no se crea nada.
    const resoluciones = []; // paralelo a items, null para productos
    for (const item of items) {
      if (!item.servicioId) { resoluciones.push(null); continue; }
      if (!item.barberoId) {
        return res.status(400).json({ error: `Falta asignar barbero al servicio "${item.nombre}"`, servicioId: item.servicioId });
      }
      const { regla } = await resolverReglaVigente(req.usuario.barberiaId, { barberoId: item.barberoId, servicioId: item.servicioId });
      if (!regla) {
        return res.status(400).json({
          error: `Comisión no configurada para este barbero en "${item.nombre}"`,
          codigo: "COMISION_NO_CONFIGURADA",
          barberoId: item.barberoId, servicioId: item.servicioId,
        });
      }
      resoluciones.push(regla);
    }

    const subtotal = items.reduce((s, i) => s + i.precio * i.cantidad - (i.descuento || 0), 0);
    const propinaTotal = round2(items.reduce((s, i) => s + Number(i.propina || 0), 0));
    const total = subtotal - descuento + propinaTotal;
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
          subtotal, descuento, propina: propinaTotal, total, efectivoRecibido, cambio,
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
              propina: i.propina || 0,
            }))
          }
        },
        include: { items: true, cliente: true },
      });

      // ── Snapshot de comisión por línea de servicio (orden preservado por
      // Prisma en nested-create, por eso se puede indexar en paralelo).
      for (let idx = 0; idx < items.length; idx++) {
        const regla = resoluciones[idx];
        if (!regla) continue;
        const itemVenta = v.items[idx];
        const neto = Number(itemVenta.subtotal);
        const barberoPct = Number(regla.barberoPct);
        const barberiaPct = Number(regla.barberiaPct);
        const montoBarbero = round2(neto * barberoPct / 100);
        const montoBarberia = round2(neto - montoBarbero); // garantiza que sumen exacto el neto

        await tx.comision.create({
          data: {
            barberiaId: req.usuario.barberiaId,
            usuarioId: itemVenta.barberoId,
            ventaId: v.id,
            itemVentaId: itemVenta.id,
            commissionRuleId: regla.id,
            monto: montoBarbero,
            porcentaje: barberoPct,
            montoBarberia,
            porcentajeBarberia: barberiaPct,
            propina: itemVenta.propina,
            estado: "PENDIENTE",
          },
        });
      }

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
  const v = await prisma.venta.findUnique({
    where: { id: req.params.id },
    include: {
      items: { include: { servicio: true, producto: true, comisiones: true } },
      cliente: true, usuario: { select: { id: true, nombre: true } }, caja: true,
    },
  });
  if (!v) return res.status(404).json({ error: "No encontrada" });
  res.json(v);
});

module.exports = router;
