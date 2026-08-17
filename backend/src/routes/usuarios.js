const router = require("express").Router();
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { auth } = require("../middleware/auth");

const PERMISOS_COMISION_FULL = ["commission.view","commission.manage","settlement.view","settlement.create","settlement.approve","settlement.void","advance.create","adjustment.create"];
const PERMISOS_COMISION_SUPERVISOR = ["commission.view","commission.manage","settlement.view","settlement.create","advance.create","adjustment.create"];

const PERMISOS_DEFAULT = {
  ADMIN: ["crear_usuarios","editar_usuarios","eliminar_usuarios","ver_costos","exportar_reportes","ver_estadisticas","administrar_inventario","abrir_caja","cerrar_caja","aprobar_descuentos","cambiar_precios","agregar_productos","eliminar_productos", ...PERMISOS_COMISION_FULL],
  GERENTE_GENERAL: ["editar_usuarios","ver_costos","exportar_reportes","ver_estadisticas","administrar_inventario","abrir_caja","cerrar_caja","aprobar_descuentos", ...PERMISOS_COMISION_FULL],
  SUPERVISOR: ["ver_estadisticas","ver_inventario","abrir_caja","cerrar_caja","aprobar_descuentos", ...PERMISOS_COMISION_SUPERVISOR],
  BARBERO: ["ver_agenda","registrar_servicios","registrar_ventas","registrar_clientes","ver_comisiones","commission.view"],
  CAJERO: ["cobrar","registrar_ventas","imprimir_recibos","abrir_caja","cerrar_caja"],
  RECEPCIONISTA: ["registrar_clientes","crear_citas","editar_citas"],
};

router.get("/", auth, async (req, res) => {
  const where = req.usuario.isSuperAdmin ? {} : { barberiaId: req.usuario.barberiaId };
  const usuarios = await prisma.usuario.findMany({ where, select: { id:true,nombre:true,apellido:true,email:true,telefono:true,foto:true,rol:true,permisos:true,estado:true,ultimoAcceso:true,creadoEn:true,sucursal:true } });
  res.json(usuarios);
});

router.post("/", auth, async (req, res) => {
  try {
    const { nombre, apellido, email, password, rol, telefono, sucursalId, permisos } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const usuario = await prisma.usuario.create({
      data: {
        nombre, apellido, email: email.toLowerCase(), password: hash, rol: rol || "BARBERO",
        telefono, sucursalId,
        barberiaId: req.usuario.isSuperAdmin ? req.body.barberiaId : req.usuario.barberiaId,
        permisos: permisos || PERMISOS_DEFAULT[rol] || [],
      },
      select: { id:true,nombre:true,apellido:true,email:true,rol:true,permisos:true,estado:true },
    });
    res.status(201).json(usuario);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

const CAMPOS_EDITABLES = ["nombre","apellido","email","telefono","foto","rol","permisos","estado","sucursalId","barberiaId"];

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
