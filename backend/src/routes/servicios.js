const router = require("express").Router();
const prisma = require("../lib/prisma");
const { auth } = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  const servicios = await prisma.servicio.findMany({ where: { barberiaId: req.usuario.barberiaId }, include: { categoria: true }, orderBy: [{ orden: "asc" }, { nombre: "asc" }] });
  res.json(servicios);
});

function sanitizar(body) {
  const { nombre, descripcion, precio, duracion, color, categoriaId, foto, video, estado, orden } = body;
  return {
    ...(nombre !== undefined && { nombre }),
    ...(descripcion !== undefined && { descripcion: descripcion || null }),
    ...(precio !== undefined && { precio: parseFloat(precio) || 0 }),
    ...(duracion !== undefined && { duracion: parseInt(duracion) || 30 }),
    ...(color !== undefined && { color }),
    ...(categoriaId !== undefined && { categoriaId: categoriaId || null }),
    ...(foto !== undefined && { foto: foto || null }),
    ...(video !== undefined && { video: video || null }),
    ...(estado !== undefined && { estado: Boolean(estado) }),
    ...(orden !== undefined && { orden: parseInt(orden) || 0 }),
  };
}

router.post("/", auth, async (req, res) => {
  try {
    const s = await prisma.servicio.create({ data: { ...sanitizar(req.body), barberiaId: req.usuario.barberiaId } });
    res.status(201).json(s);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put("/:id", auth, async (req, res) => {
  try {
    const s = await prisma.servicio.update({ where: { id: req.params.id }, data: sanitizar(req.body) });
    res.json(s);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete("/:id", auth, async (req, res) => {
  await prisma.servicio.update({ where: { id: req.params.id }, data: { estado: false } });
  res.json({ ok: true });
});

// Categorías
router.get("/categorias", auth, async (req, res) => {
  const cats = await prisma.categoriaServicio.findMany({ where: { barberiaId: req.usuario.barberiaId }, orderBy: { orden: "asc" } });
  res.json(cats);
});

router.post("/categorias", auth, async (req, res) => {
  const c = await prisma.categoriaServicio.create({ data: { ...req.body, barberiaId: req.usuario.barberiaId } });
  res.status(201).json(c);
});

module.exports = router;
