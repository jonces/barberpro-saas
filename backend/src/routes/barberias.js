const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const { auth, requireRol } = require("../middleware/auth");
const { PERMISOS_DEFAULT } = require("./usuarios");

// Rutas de primer nivel que ya existen en el frontend (app/<estas>/page.js) —
// una barbería nunca puede quedarse con uno de estos slugs o su página
// pública sería inalcanzable (Next.js siempre prioriza la ruta estática).
const SLUGS_RESERVADOS = new Set([
  "api", "login", "registro", "dashboard", "pos", "citas", "clientes",
  "servicios", "inventario", "caja", "equipo", "liquidaciones", "reportes",
  "superadmin", "favicon.ico",
]);

function generarSlugBase(nombre) {
  const base = (nombre || "")
    .toLowerCase().trim()
    .normalize("NFD") // separa "ó" en "o" + acento combinado
    .replace(/[^a-z0-9\s-]/g, "") // el acento combinado no es a-z0-9, se cae aquí
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "barberia";
}

// ── POST /registro — autoservicio, SIN auth. Cualquier dueño de barbería
// puede crear su cuenta sin depender del superadmin. rol e isSuperAdmin
// SIEMPRE se fijan aquí en el servidor (ADMIN / false) — nunca desde el
// body, así el endpoint público no puede usarse para crear un superadmin.
router.post("/registro", async (req, res) => {
  try {
    const { nombreBarberia, adminNombre, adminApellido, adminEmail, adminPassword, telefono, ciudad } = req.body;
    if (!nombreBarberia?.trim() || !adminNombre?.trim() || !adminEmail?.trim() || !adminPassword) {
      return res.status(400).json({ error: "El nombre de la barbería, tu nombre, correo y contraseña son obligatorios" });
    }
    if (adminPassword.length < 8) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
    }

    const emailNorm = adminEmail.toLowerCase().trim();
    const existente = await prisma.usuario.findUnique({ where: { email: emailNorm } });
    if (existente) return res.status(400).json({ error: "Ya existe una cuenta con ese correo" });

    let slug = generarSlugBase(nombreBarberia);
    if (SLUGS_RESERVADOS.has(slug)) slug = `${slug}-barberia`;
    let intento = 1;
    // eslint-disable-next-line no-await-in-loop
    while (SLUGS_RESERVADOS.has(slug) || (await prisma.barberia.findUnique({ where: { slug } }))) {
      intento++;
      slug = `${generarSlugBase(nombreBarberia)}-${intento}`;
    }

    const hash = await bcrypt.hash(adminPassword, 10);
    const creada = await prisma.barberia.create({
      data: {
        nombre: nombreBarberia.trim(), slug, telefono: telefono?.trim() || null, ciudad: ciudad?.trim() || null,
        plan: "BASICO", estado: "ACTIVA",
        usuarios: {
          create: {
            nombre: adminNombre.trim(), apellido: adminApellido?.trim() || null, email: emailNorm, password: hash,
            rol: "ADMIN", isSuperAdmin: false, permisos: PERMISOS_DEFAULT.ADMIN,
          },
        },
        horarios: { create: [0, 1, 2, 3, 4, 5, 6].map(d => ({ diaSemana: d, abierto: d >= 1 && d <= 6, apertura: "09:00", cierre: "19:00" })) },
      },
      include: { usuarios: true },
    });

    const nuevoUsuario = creada.usuarios[0];
    const token = jwt.sign({ id: nuevoUsuario.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    const { password: _pw, ...usuarioSafe } = nuevoUsuario;
    const { usuarios: _u, ...barberiaSafe } = creada;
    res.status(201).json({ token, usuario: { ...usuarioSafe, barberia: barberiaSafe, sucursal: null } });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

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
