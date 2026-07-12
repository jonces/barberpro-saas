const router = require("express").Router();
const prisma = require("../lib/prisma");
const { auth } = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  const { q } = req.query;
  const where = { barberiaId: req.usuario.barberiaId, estado: true };
  if (q) where.OR = [{ nombre: { contains: q, mode: "insensitive" } }, { telefono: { contains: q } }, { email: { contains: q, mode: "insensitive" } }];
  const clientes = await prisma.cliente.findMany({ where, orderBy: { nombre: "asc" }, take: 50 });
  res.json(clientes);
});

router.post("/", auth, async (req, res) => {
  const c = await prisma.cliente.create({ data: { ...req.body, barberiaId: req.usuario.barberiaId } });
  res.status(201).json(c);
});

router.get("/:id", auth, async (req, res) => {
  const c = await prisma.cliente.findUnique({ where: { id: req.params.id }, include: { ventas: { take: 10, orderBy: { creadoEn: "desc" }, include: { items: true } }, citas: { take: 5, orderBy: { fecha: "desc" } } } });
  res.json(c);
});

router.put("/:id", auth, async (req, res) => {
  const c = await prisma.cliente.update({ where: { id: req.params.id }, data: req.body });
  res.json(c);
});

module.exports = router;
