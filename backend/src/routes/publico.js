const router = require("express").Router();
const prisma = require("../lib/prisma");

// GET /publico/:slug — info de la barbería
router.get("/:slug", async (req, res) => {
  try {
    const b = await prisma.barberia.findUnique({
      where: { slug: req.params.slug },
      select: { id: true, nombre: true, slug: true, ciudad: true, telefono: true, email: true, descripcion: true, estado: true },
    });
    if (!b || b.estado === "SUSPENDIDA") return res.status(404).json({ error: "Barbería no encontrada" });
    res.json(b);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /publico/:slug/servicios
router.get("/:slug/servicios", async (req, res) => {
  try {
    const b = await prisma.barberia.findUnique({ where: { slug: req.params.slug }, select: { id: true } });
    if (!b) return res.status(404).json({ error: "Barbería no encontrada" });
    const servicios = await prisma.servicio.findMany({
      where: { barberiaId: b.id, estado: true },
      select: { id: true, nombre: true, descripcion: true, precio: true, duracion: true, color: true, foto: true, video: true },
      orderBy: { nombre: "asc" },
    });
    res.json(servicios);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /publico/:slug/barberos
router.get("/:slug/barberos", async (req, res) => {
  try {
    const b = await prisma.barberia.findUnique({ where: { slug: req.params.slug }, select: { id: true } });
    if (!b) return res.status(404).json({ error: "Barbería no encontrada" });
    const barberos = await prisma.usuario.findMany({
      where: { barberiaId: b.id, rol: { in: ["BARBERO", "ADMIN"] }, estado: true },
      select: { id: true, nombre: true, apellido: true },
      orderBy: { nombre: "asc" },
    });
    res.json(barberos);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /publico/:slug/citas — crear cita sin login
router.post("/:slug/citas", async (req, res) => {
  try {
    const b = await prisma.barberia.findUnique({ where: { slug: req.params.slug }, select: { id: true, nombre: true } });
    if (!b) return res.status(404).json({ error: "Barbería no encontrada" });

    const { nombre, telefono, email, barberoId, fecha, duracion, notas, servicioIds } = req.body;
    if (!nombre || !telefono || !fecha) return res.status(400).json({ error: "Nombre, teléfono y fecha son requeridos" });

    // Buscar o crear cliente
    let cliente = await prisma.cliente.findFirst({ where: { barberiaId: b.id, telefono } });
    if (!cliente) {
      cliente = await prisma.cliente.create({
        data: { barberiaId: b.id, nombre, telefono, email: email || null },
      });
    }

    // Crear cita con servicios
    const cita = await prisma.cita.create({
      data: {
        barberiaId: b.id,
        clienteId: cliente.id,
        barberoId: barberoId || null,
        fecha: new Date(fecha),
        duracion: duracion || 30,
        notas: notas || null,
        estado: "PENDIENTE",
        items: servicioIds?.length ? {
          create: await Promise.all(servicioIds.map(async (sid) => {
            const s = await prisma.servicio.findUnique({ where: { id: sid } });
            return { servicioId: sid, precio: s?.precio || 0 };
          })),
        } : undefined,
      },
      include: { cliente: true, barbero: { select: { nombre: true } }, items: { include: { servicio: { select: { nombre: true } } } } },
    });

    res.status(201).json(cita);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
