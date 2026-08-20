const router = require("express").Router();
const prisma = require("../lib/prisma");

// GET /publico/:slug — info de la barbería
router.get("/:slug", async (req, res) => {
  try {
    const b = await prisma.barberia.findUnique({
      where: { slug: req.params.slug },
      select: {
        id: true, nombre: true, slug: true, ciudad: true, telefono: true, email: true, descripcion: true, estado: true,
        logo: true, direccion: true, pais: true, sitioWeb: true, instagram: true, facebook: true, configuracion: true,
      },
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

// GET /publico/:slug/productos
router.get("/:slug/productos", async (req, res) => {
  try {
    const b = await prisma.barberia.findUnique({ where: { slug: req.params.slug }, select: { id: true } });
    if (!b) return res.status(404).json({ error: "Barbería no encontrada" });
    const productos = await prisma.producto.findMany({
      where: { barberiaId: b.id, estado: true },
      select: { id: true, nombre: true, descripcion: true, precio: true, foto: true, video: true, stock: true },
      orderBy: { nombre: "asc" },
    });
    res.json(productos);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /publico/:slug/barberos
router.get("/:slug/barberos", async (req, res) => {
  try {
    const b = await prisma.barberia.findUnique({ where: { slug: req.params.slug }, select: { id: true } });
    if (!b) return res.status(404).json({ error: "Barbería no encontrada" });
    const barberos = await prisma.usuario.findMany({
      where: { barberiaId: b.id, rol: { in: ["BARBERO", "ADMIN"] }, estado: true },
      select: { id: true, nombre: true, apellido: true, foto: true },
      orderBy: { nombre: "asc" },
    });
    res.json(barberos);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /publico/:slug/horarios
router.get("/:slug/horarios", async (req, res) => {
  try {
    const b = await prisma.barberia.findUnique({ where: { slug: req.params.slug }, select: { id: true } });
    if (!b) return res.status(404).json({ error: "Barbería no encontrada" });
    const horarios = await prisma.horario.findMany({
      where: { barberiaId: b.id },
      select: { diaSemana: true, abierto: true, apertura: true, cierre: true },
      orderBy: { diaSemana: "asc" },
    });
    res.json(horarios);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /publico/:slug/citas — crear cita sin login
router.post("/:slug/citas", async (req, res) => {
  try {
    const b = await prisma.barberia.findUnique({ where: { slug: req.params.slug }, select: { id: true, nombre: true } });
    if (!b) return res.status(404).json({ error: "Barbería no encontrada" });

    const { nombre, telefono, email, barberoId, fecha, duracion, notas, servicioIds } = req.body;
    if (!nombre || !telefono || !fecha) return res.status(400).json({ error: "Nombre, teléfono y fecha son requeridos" });

    const fechaCita = new Date(fecha);
    if (isNaN(fechaCita.getTime())) return res.status(400).json({ error: "Fecha inválida" });

    // Solo servicios que realmente pertenecen a esta barbería
    const serviciosValidos = servicioIds?.length
      ? await prisma.servicio.findMany({ where: { id: { in: servicioIds }, barberiaId: b.id } })
      : [];

    // El barbero debe pertenecer a esta barbería y estar activo
    let barberoIdFinal = null;
    if (barberoId) {
      const barbero = await prisma.usuario.findFirst({
        where: { id: barberoId, barberiaId: b.id, rol: { in: ["BARBERO", "ADMIN"] }, estado: true },
        select: { id: true },
      });
      if (barbero) barberoIdFinal = barbero.id;
    }

    const duracionFinal = duracion || 30;

    // Evitar choques exactos de horario con el mismo barbero
    if (barberoIdFinal) {
      const inicio = fechaCita;
      const fin = new Date(fechaCita.getTime() + duracionFinal * 60000);
      const conflicto = await prisma.cita.findFirst({
        where: {
          barberoId: barberoIdFinal,
          estado: { in: ["PENDIENTE", "CONFIRMADA"] },
          fecha: { lt: fin },
          AND: [{ fecha: { gte: new Date(inicio.getTime() - 4 * 60 * 60000) } }],
        },
      });
      if (conflicto) {
        const conflictoFin = new Date(conflicto.fecha.getTime() + conflicto.duracion * 60000);
        if (conflicto.fecha < fin && conflictoFin > inicio) {
          return res.status(400).json({ error: "Ese barbero ya tiene una cita en ese horario. Elige otra hora." });
        }
      }
    }

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
        barberoId: barberoIdFinal,
        fecha: fechaCita,
        duracion: duracionFinal,
        notas: notas || null,
        estado: "PENDIENTE",
        items: serviciosValidos.length ? {
          create: serviciosValidos.map((s) => ({ servicioId: s.id })),
        } : undefined,
      },
      include: { cliente: true, barbero: { select: { nombre: true } }, items: { include: { servicio: { select: { nombre: true } } } } },
    });

    res.status(201).json(cita);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
