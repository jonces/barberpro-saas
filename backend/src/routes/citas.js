const router = require("express").Router();
const prisma = require("../lib/prisma");
const { auth } = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  const { fecha, barberoId, estado } = req.query;
  const where = { barberiaId: req.usuario.barberiaId };
  if (estado) where.estado = estado;
  if (barberoId) where.barberoId = barberoId;
  if (fecha) {
    const d = new Date(fecha);
    const fin = new Date(fecha); fin.setDate(fin.getDate() + 1);
    where.fecha = { gte: d, lt: fin };
  }
  const citas = await prisma.cita.findMany({ where, include: { cliente: true, barbero: { select: { id:true,nombre:true,foto:true } }, items: { include: { servicio: true } } }, orderBy: { fecha: "asc" } });
  res.json(citas);
});

router.post("/", auth, async (req, res) => {
  try {
    const { clienteId, barberoId, fecha, duracion, notas, servicioIds } = req.body;
    const cita = await prisma.cita.create({
      data: {
        barberiaId: req.usuario.barberiaId, clienteId, barberoId, recepcionistaId: req.usuario.id,
        fecha: new Date(fecha), duracion, notas,
        items: { create: (servicioIds || []).map(id => ({ servicioId: id })) }
      },
      include: { cliente: true, barbero: { select: { id:true,nombre:true } }, items: { include: { servicio: true } } }
    });
    res.status(201).json(cita);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put("/:id", auth, async (req, res) => {
  const c = await prisma.cita.update({ where: { id: req.params.id }, data: req.body });
  res.json(c);
});

router.patch("/:id/estado", auth, async (req, res) => {
  const c = await prisma.cita.update({ where: { id: req.params.id }, data: { estado: req.body.estado } });
  res.json(c);
});

module.exports = router;
