const router = require("express").Router();
const prisma = require("../lib/prisma");
const { auth, requireRol } = require("../middleware/auth");

// Listar todas (superadmin)
router.get("/", auth, async (req, res) => {
  if (!req.usuario.isSuperAdmin) return res.status(403).json({ error: "Solo superadmin" });
  const barberias = await prisma.barberia.findMany({
    include: { _count: { select: { usuarios: true, clientes: true, ventas: true } } },
    orderBy: { creadoEn: "desc" },
  });
  res.json(barberias);
});

// Crear barbería (superadmin)
router.post("/", auth, async (req, res) => {
  if (!req.usuario.isSuperAdmin) return res.status(403).json({ error: "Solo superadmin" });
  try {
    const { nombre, slug, email, telefono, ciudad, plan, adminNombre, adminEmail, adminPassword } = req.body;
    const bcrypt = require("bcryptjs");
    const hash = await bcrypt.hash(adminPassword || "Admin123!", 10);
    const barberia = await prisma.barberia.create({
      data: {
        nombre, slug: slug.toLowerCase().replace(/\s+/g, "-"), email, telefono, ciudad, plan: plan || "BASICO",
        usuarios: { create: { nombre: adminNombre, email: adminEmail.toLowerCase(), password: hash, rol: "ADMIN", permisos: [] } },
        horarios: {
          create: [0,1,2,3,4,5,6].map(d => ({ diaSemana: d, abierto: d >= 1 && d <= 6, apertura: "09:00", cierre: "19:00" }))
        },
      },
      include: { usuarios: { select: { id: true, nombre: true, email: true, rol: true } } },
    });
    res.status(201).json(barberia);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Ver una barbería
router.get("/:id", auth, async (req, res) => {
  const b = await prisma.barberia.findUnique({
    where: { id: req.params.id },
    include: { sucursales: true, horarios: true, _count: { select: { usuarios: true, clientes: true, ventas: true, productos: true } } },
  });
  if (!b) return res.status(404).json({ error: "No encontrada" });
  res.json(b);
});

// Actualizar
router.put("/:id", auth, async (req, res) => {
  const b = await prisma.barberia.update({ where: { id: req.params.id }, data: req.body });
  res.json(b);
});

// Suspender / activar
router.patch("/:id/estado", auth, async (req, res) => {
  if (!req.usuario.isSuperAdmin) return res.status(403).json({ error: "Solo superadmin" });
  const b = await prisma.barberia.update({ where: { id: req.params.id }, data: { estado: req.body.estado } });
  res.json(b);
});

module.exports = router;
