const router = require("express").Router();
const prisma = require("../lib/prisma");
const { auth } = require("../middleware/auth");

router.get("/activa", auth, async (req, res) => {
  const caja = await prisma.caja.findFirst({ where: { barberiaId: req.usuario.barberiaId, estado: "ABIERTA" }, include: { _count: { select: { ventas: true } } } });
  res.json(caja);
});

router.post("/abrir", auth, async (req, res) => {
  try {
    const { montoInicial, nombre, sucursalId } = req.body;
    const yaAbierta = await prisma.caja.findFirst({ where: { barberiaId: req.usuario.barberiaId, estado: "ABIERTA" } });
    if (yaAbierta) return res.status(400).json({ error: "Ya hay una caja abierta" });
    const caja = await prisma.caja.create({
      data: { barberiaId: req.usuario.barberiaId, sucursalId, nombre: nombre || "Caja Principal", montoInicial, estado: "ABIERTA", abiertaPor: req.usuario.id, abiertoEn: new Date() }
    });
    await prisma.movimientoCaja.create({
      data: { barberiaId: req.usuario.barberiaId, cajaId: caja.id, tipo: "APERTURA", monto: montoInicial, descripcion: "Apertura de caja", usuarioId: req.usuario.id }
    });
    res.status(201).json(caja);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post("/:id/cerrar", auth, async (req, res) => {
  try {
    const { montoFinal, notas } = req.body;
    const caja = await prisma.caja.findUnique({ where: { id: req.params.id } });
    if (!caja) return res.status(404).json({ error: "No encontrada" });
    const diferencia = montoFinal - (Number(caja.montoInicial) + Number(caja.totalVentas));
    const updated = await prisma.caja.update({
      where: { id: req.params.id },
      data: { estado: "CERRADA", montoFinal, diferencia, cerradaPor: req.usuario.id, cerradoEn: new Date(), notas }
    });
    await prisma.movimientoCaja.create({
      data: { barberiaId: req.usuario.barberiaId, cajaId: caja.id, tipo: "CIERRE", monto: montoFinal, descripcion: "Cierre de caja", usuarioId: req.usuario.id }
    });
    res.json(updated);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.get("/:id/movimientos", auth, async (req, res) => {
  const movs = await prisma.movimientoCaja.findMany({ where: { cajaId: req.params.id }, orderBy: { creadoEn: "desc" } });
  res.json(movs);
});

module.exports = router;
