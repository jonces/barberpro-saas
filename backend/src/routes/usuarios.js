const router = require("express").Router();
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const prisma = require("../lib/prisma");
const { auth } = require("../middleware/auth");

const PERMISOS_COMISION_FULL = ["commission.view","commission.manage","settlement.view","settlement.create","settlement.approve","settlement.void","advance.create","adjustment.create"];
const PERMISOS_COMISION_SUPERVISOR = ["commission.view","commission.manage","settlement.view","settlement.create","advance.create","adjustment.create"];

const PERMISOS_DEFAULT = {
  ADMIN: ["crear_usuarios","editar_usuarios","eliminar_usuarios","ver_costos","exportar_reportes","ver_estadisticas","administrar_inventario","abrir_caja","cerrar_caja","aprobar_descuentos","cambiar_precios","agregar_productos","eliminar_productos","anular_ventas", ...PERMISOS_COMISION_FULL],
  GERENTE_GENERAL: ["editar_usuarios","ver_costos","exportar_reportes","ver_estadisticas","administrar_inventario","abrir_caja","cerrar_caja","aprobar_descuentos","anular_ventas", ...PERMISOS_COMISION_FULL],
  SUPERVISOR: ["ver_estadisticas","ver_inventario","abrir_caja","cerrar_caja","aprobar_descuentos", ...PERMISOS_COMISION_SUPERVISOR],
  BARBERO: ["ver_agenda","registrar_servicios","registrar_ventas","registrar_clientes","ver_comisiones","commission.view"],
  CAJERO: ["cobrar","registrar_ventas","imprimir_recibos","abrir_caja","cerrar_caja"],
  RECEPCIONISTA: ["registrar_clientes","crear_citas","editar_citas"],
};

router.get("/", auth, async (req, res) => {
  const where = req.usuario.isSuperAdmin ? {} : { barberiaId: req.usuario.barberiaId };
  const usuarios = await prisma.usuario.findMany({ where, select: { id:true,nombre:true,apellido:true,email:true,telefono:true,cedula:true,foto:true,rol:true,permisos:true,estado:true,ultimoAcceso:true,creadoEn:true,sucursal:true } });
  // El correo autogenerado de un barbero sin acceso es un detalle interno
  // (garantiza unicidad en la BD) — no tiene sentido mostrarlo en la UI.
  res.json(usuarios.map(u => u.email.endsWith("@sin-acceso.invalid") ? { ...u, email: null, sinAcceso: true } : u));
});

// Un BARBERO es, ante todo, un perfil de staff: solo necesita nombre. No
// inicia sesión en el sistema, así que correo y contraseña son opcionales —
// si no llegan, se genera un correo interno único (nunca resoluble, dominio
// reservado .invalid) y una contraseña aleatoria que nadie conoce, para que
// la fila cumpla las columnas NOT NULL/UNIQUE sin abrir una puerta de acceso
// real. El resto de roles (quienes sí operan el sistema) siguen requiriendo
// correo y contraseña reales como antes.
router.post("/", auth, async (req, res) => {
  try {
    const { nombre, apellido, email, password, rol, telefono, sucursalId, permisos, cedula } = req.body;
    const rolFinal = rol || "BARBERO";
    const sinAcceso = rolFinal === "BARBERO" && !email;

    if (!sinAcceso && !email) return res.status(400).json({ error: "El correo es obligatorio para este rol" });
    if (!sinAcceso && !password) return res.status(400).json({ error: "La contraseña es obligatoria para este rol" });

    const emailFinal = sinAcceso ? `barbero.${crypto.randomBytes(8).toString("hex")}@sin-acceso.invalid` : email.toLowerCase();
    const passwordFinal = sinAcceso ? crypto.randomBytes(24).toString("hex") : password;
    const hash = await bcrypt.hash(passwordFinal, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nombre, apellido, email: emailFinal, password: hash, rol: rolFinal,
        telefono, sucursalId, cedula: cedula || null,
        barberiaId: req.usuario.isSuperAdmin ? req.body.barberiaId : req.usuario.barberiaId,
        permisos: permisos || PERMISOS_DEFAULT[rolFinal] || [],
      },
      select: { id:true,nombre:true,apellido:true,email:true,rol:true,permisos:true,estado:true,cedula:true },
    });
    res.status(201).json(sinAcceso ? { ...usuario, email: null, sinAcceso: true } : usuario);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

const CAMPOS_EDITABLES = ["nombre","apellido","email","telefono","cedula","foto","rol","permisos","estado","sucursalId","barberiaId"];

router.put("/:id", auth, async (req, res) => {
  try {
    const data = {};
    for (const campo of CAMPOS_EDITABLES) {
      if (req.body[campo] !== undefined) data[campo] = req.body[campo];
    }
    if (data.email) data.email = data.email.toLowerCase();
    if (req.body.password) data.password = await bcrypt.hash(req.body.password, 10);

    const u = await prisma.usuario.update({ where: { id: req.params.id }, data, select: { id:true,nombre:true,apellido:true,email:true,rol:true,permisos:true,estado:true } });
    res.json(u);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete("/:id", auth, async (req, res) => {
  await prisma.usuario.update({ where: { id: req.params.id }, data: { estado: false } });
  res.json({ ok: true });
});

module.exports = router;
