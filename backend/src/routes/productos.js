const router = require("express").Router();
const prisma = require("../lib/prisma");
const { auth } = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  const productos = await prisma.producto.findMany({ where: { barberiaId: req.usuario.barberiaId }, include: { categoria: true }, orderBy: { nombre: "asc" } });
  res.json(productos);
});

function sanitizar(body) {
  const { nombre, descripcion, precio, costo, stock, stockMinimo, unidad, categoriaId, foto, video, estado } = body;
  return {
    ...(nombre !== undefined && { nombre }),
    ...(descripcion !== undefined && { descripcion: descripcion || null }),
    ...(precio !== undefined && { precio: parseFloat(precio) || 0 }),
    ...(costo !== undefined && { costo: parseFloat(costo) || 0 }),
    ...(stock !== undefined && { stock: parseInt(stock) || 0 }),
    ...(stockMinimo !== undefined && { stockMinimo: parseInt(stockMinimo) || 0 }),
    ...(unidad !== undefined && { unidad: unidad || "unidad" }),
    ...(categoriaId !== undefined && { categoriaId: categoriaId || null }),
    ...(foto !== undefined && { foto: foto || null }),
    ...(video !== undefined && { video: video || null }),
    ...(estado !== undefined && { estado: Boolean(estado) }),
  };
}

router.post("/", auth, async (req, res) => {
  try {
    const p = await prisma.producto.create({ data: { ...sanitizar(req.body), barberiaId: req.usuario.barberiaId } });
    res.status(201).json(p);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put("/:id", auth, async (req, res) => {
  try {
    const existe = await prisma.producto.findFirst({ where: { id: req.params.id, barberiaId: req.usuario.barberiaId } });
    if (!existe) return res.status(404).json({ error: "No encontrado" });
    const p = await prisma.producto.update({ where: { id: req.params.id }, data: sanitizar(req.body) });
    res.json(p);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Elimina el producto de verdad, tenga o no historial de ventas. Es seguro:
// un producto nunca genera comisión, y ItemVenta/MovimientoInventario ya
// guardan su propio nombre/precio/subtotal en el momento de la venta, así
// que un recibo o reporte pasado se sigue viendo igual (solo se pierde el
// vínculo al catálogo — ver ON DELETE SET NULL en el schema).
router.delete("/:id", auth, async (req, res) => {
  const existe = await prisma.producto.findFirst({ where: { id: req.params.id, barberiaId: req.usuario.barberiaId } });
  if (!existe) return res.status(404).json({ error: "No encontrado" });
  await prisma.producto.delete({ where: { id: req.params.id } });
  res.json({ ok: true, eliminado: true });
});

// Ajustar stock
router.post("/:id/stock", auth, async (req, res) => {
  const { cantidad, tipo, nota } = req.body;
  const prod = await prisma.producto.findUnique({ where: { id: req.params.id } });
  const nuevo = tipo === "ENTRADA" ? prod.stock + cantidad : prod.stock - cantidad;
  if (nuevo < 0) return res.status(400).json({ error: "Stock insuficiente" });
  await prisma.$transaction([
    prisma.producto.update({ where: { id: req.params.id }, data: { stock: nuevo } }),
    prisma.movimientoInventario.create({ data: { productoId: req.params.id, tipo, cantidad, stockAntes: prod.stock, stockDespues: nuevo, nota, usuarioId: req.usuario.id } }),
  ]);
  res.json({ stock: nuevo });
});

// Categorías
router.get("/categorias", auth, async (req, res) => {
  const cats = await prisma.categoriaProducto.findMany({ where: { barberiaId: req.usuario.barberiaId }, orderBy: { orden: "asc" } });
  res.json(cats);
});

router.post("/categorias", auth, async (req, res) => {
  const c = await prisma.categoriaProducto.create({ data: { ...req.body, barberiaId: req.usuario.barberiaId } });
  res.status(201).json(c);
});

module.exports = router;
