const router = require("express").Router();
const prisma = require("../lib/prisma");
const { auth, requirePermiso } = require("../middleware/auth");

const ROLES_GESTOR = ["ADMIN", "GERENTE_GENERAL", "SUPERVISOR"];

function nombreCompleto(u) {
  if (!u) return null;
  return [u.nombre, u.apellido].filter(Boolean).join(" ");
}

function esGestor(usuario) {
  return usuario.isSuperAdmin || ROLES_GESTOR.includes(usuario.rol);
}

// Un SUPERVISOR solo administra su propia sucursal; ADMIN/GERENTE_GENERAL administran toda la barbería.
function sucursalPermitida(usuario, sucursalId) {
  if (usuario.isSuperAdmin || usuario.rol === "ADMIN" || usuario.rol === "GERENTE_GENERAL") return true;
  if (usuario.rol === "SUPERVISOR") return !sucursalId || sucursalId === usuario.sucursalId;
  return false;
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// Ventana temporal vigente "ahora": estado ACTIVA (no anulada explícitamente) +
// vigenteDesde ya llegó + (sin vigenteHasta, o vigenteHasta todavía no llega).
// OJO: al programar un cambio futuro, la regla ANTERIOR debe seguir resolviendo
// hasta que llegue su vigenteHasta — por eso NO filtramos solo por estado.
function ventanaVigente(extra = {}) {
  const ahora = new Date();
  return {
    estado: "ACTIVA",
    AND: [
      { vigenteDesde: { lte: ahora } },
      { OR: [{ vigenteHasta: null }, { vigenteHasta: { gt: ahora } }] },
      ...(extra.sucursalId !== undefined ? [{ OR: [{ sucursalId: extra.sucursalId }, { sucursalId: null }] }] : []),
    ],
  };
}

// ─── Resolver la regla vigente según jerarquía: barbero+servicio > barbero general > default de sucursal ──
async function resolverReglaVigente(barberiaId, { barberoId, servicioId, sucursalId }) {
  if (barberoId && servicioId) {
    const especifica = await prisma.commissionRule.findFirst({
      where: { barberiaId, barberoId, servicioId, ...ventanaVigente({ sucursalId }) },
      orderBy: [{ sucursalId: "desc" }, { vigenteDesde: "desc" }],
    });
    if (especifica) return { regla: especifica, nivel: "barbero_servicio" };
  }
  if (barberoId) {
    const general = await prisma.commissionRule.findFirst({
      where: { barberiaId, barberoId, servicioId: null, ...ventanaVigente({ sucursalId }) },
      orderBy: [{ sucursalId: "desc" }, { vigenteDesde: "desc" }],
    });
    if (general) return { regla: general, nivel: "barbero_general" };
  }
  if (sucursalId) {
    const defaultSucursal = await prisma.commissionRule.findFirst({
      where: { barberiaId, barberoId: null, servicioId: null, sucursalId, ...ventanaVigente() },
      orderBy: { vigenteDesde: "desc" },
    });
    if (defaultSucursal) return { regla: defaultSucursal, nivel: "sucursal_default" };
  }
  return { regla: null, nivel: null };
}

// GET /api/comisiones/reglas — listar reglas vigentes (y su historial si se pide)
router.get("/reglas", auth, requirePermiso("commission.view"), async (req, res) => {
  const { barberoId, servicioId, sucursalId, incluirInactivas } = req.query;
  const where = { barberiaId: req.usuario.barberiaId };

  if (req.usuario.rol === "BARBERO" && !req.usuario.isSuperAdmin) {
    where.barberoId = req.usuario.id; // un barbero solo ve sus propias reglas
  } else if (barberoId) {
    where.barberoId = barberoId;
  }
  if (servicioId) where.servicioId = servicioId;
  if (sucursalId) where.sucursalId = sucursalId;
  // Sin incluirInactivas: mostrar solo la versión vigente/próxima de cada
  // combinación (la fila "abierta", sin vigenteHasta), no todo el historial.
  if (!incluirInactivas) { where.estado = "ACTIVA"; where.vigenteHasta = null; }

  const reglas = await prisma.commissionRule.findMany({
    where,
    include: {
      barbero: { select: { id: true, nombre: true, apellido: true, foto: true } },
      servicio: { select: { id: true, nombre: true } },
      sucursal: { select: { id: true, nombre: true } },
      creadoPor: { select: { id: true, nombre: true, apellido: true, rol: true } },
    },
    orderBy: { creadoEn: "desc" },
  });
  res.json(reglas);
});

// GET /api/comisiones/reglas/vigente — resolver qué regla aplicaría ahora mismo
router.get("/reglas/vigente", auth, requirePermiso("commission.view"), async (req, res) => {
  const { barberoId, servicioId, sucursalId } = req.query;
  const bId = req.usuario.rol === "BARBERO" && !req.usuario.isSuperAdmin ? req.usuario.id : barberoId;
  if (!bId) return res.status(400).json({ error: "barberoId requerido" });
  if (req.usuario.rol === "BARBERO" && !req.usuario.isSuperAdmin && barberoId && barberoId !== req.usuario.id) {
    return res.status(403).json({ error: "No puedes consultar la comisión de otro barbero" });
  }

  const { regla, nivel } = await resolverReglaVigente(req.usuario.barberiaId, { barberoId: bId, servicioId, sucursalId });
  if (!regla) {
    return res.status(404).json({ error: "Este barbero no tiene una regla de comisión configurada.", barberoId: bId, servicioId: servicioId || null, sucursalId: sucursalId || null });
  }
  res.json({ regla, nivel });
});

// POST /api/comisiones/reglas — crear una nueva versión de regla (nunca edita la vigente)
router.post("/reglas", auth, requirePermiso("commission.manage"), async (req, res) => {
  try {
    if (!esGestor(req.usuario)) return res.status(403).json({ error: "Rol insuficiente para configurar comisiones" });

    let { barberoId = null, servicioId = null, sucursalId = null, barberoPct, barberiaPct, vigenteDesde, motivo } = req.body;
    barberoPct = Number(barberoPct);
    barberiaPct = barberiaPct === undefined || barberiaPct === null || barberiaPct === "" ? round2(100 - barberoPct) : Number(barberiaPct);

    if (!Number.isFinite(barberoPct) || !Number.isFinite(barberiaPct) || barberoPct < 0 || barberiaPct < 0) {
      return res.status(400).json({ error: "Porcentajes inválidos" });
    }
    if (round2(barberoPct + barberiaPct) !== 100) {
      return res.status(400).json({ error: "El porcentaje de barbero + barbería debe sumar 100%" });
    }
    if (!sucursalPermitida(req.usuario, sucursalId)) {
      return res.status(403).json({ error: "No tienes autoridad sobre esa sucursal" });
    }
    if (barberoId) {
      const barbero = await prisma.usuario.findFirst({ where: { id: barberoId, barberiaId: req.usuario.barberiaId } });
      if (!barbero) return res.status(404).json({ error: "Barbero no encontrado" });
      if (barbero.sucursalId && !sucursalPermitida(req.usuario, barbero.sucursalId)) {
        return res.status(403).json({ error: "No tienes autoridad sobre la sucursal de este barbero" });
      }
    }

    const desde = vigenteDesde ? new Date(vigenteDesde) : new Date();

    const resultado = await prisma.$transaction(async (tx) => {
      // "anterior" = la versión abierta actual de esta combinación exacta
      // (barbero+servicio+sucursal), sin importar si ya está vigente o
      // todavía es un cambio programado a futuro.
      const anterior = await tx.commissionRule.findFirst({
        where: { barberiaId: req.usuario.barberiaId, barberoId, servicioId, sucursalId, estado: "ACTIVA", vigenteHasta: null },
      });

      if (anterior && !motivo) {
        throw Object.assign(new Error("El motivo es obligatorio al modificar una regla existente"), { status: 400 });
      }
      if (anterior && desde <= anterior.vigenteDesde) {
        throw Object.assign(new Error("La nueva vigencia debe ser posterior a la vigencia actual"), { status: 400 });
      }

      if (anterior) {
        // Solo cerramos su ventana temporal — su estado sigue ACTIVA porque
        // no fue anulada, simplemente fue reemplazada por la nueva versión.
        await tx.commissionRule.update({
          where: { id: anterior.id },
          data: { vigenteHasta: desde },
        });
      }

      const nueva = await tx.commissionRule.create({
        data: {
          barberiaId: req.usuario.barberiaId,
          sucursalId, barberoId, servicioId,
          barberoPct, barberiaPct,
          vigenteDesde: desde,
          motivo: motivo || null,
          version: (anterior?.version || 0) + 1,
          creadoPorId: req.usuario.id,
        },
      });

      await tx.commissionRuleHistory.create({
        data: {
          barberiaId: req.usuario.barberiaId,
          reglaNuevaId: nueva.id,
          reglaAnteriorId: anterior?.id || null,
          barberoId, sucursalId, servicioId,
          barberoPctAnterior: anterior?.barberoPct ?? null,
          barberiaPctAnterior: anterior?.barberiaPct ?? null,
          barberoPctNuevo: barberoPct,
          barberiaPctNuevo: barberiaPct,
          motivo: motivo || null,
          actorUserId: req.usuario.id,
          actorNombre: nombreCompleto(req.usuario) || req.usuario.email,
          actorRol: req.usuario.rol,
        },
      });

      return nueva;
    });

    const conRelaciones = await prisma.commissionRule.findUnique({
      where: { id: resultado.id },
      include: {
        barbero: { select: { id: true, nombre: true, apellido: true } },
        servicio: { select: { id: true, nombre: true } },
        sucursal: { select: { id: true, nombre: true } },
        creadoPor: { select: { id: true, nombre: true, apellido: true, rol: true } },
      },
    });
    res.status(201).json(conRelaciones);
  } catch (e) {
    res.status(e.status || 400).json({ error: e.message });
  }
});

// PATCH /api/comisiones/reglas/:id/desactivar — desactivar sin reemplazo (queda sin regla vigente en ese nivel)
router.patch("/reglas/:id/desactivar", auth, requirePermiso("commission.manage"), async (req, res) => {
  try {
    if (!esGestor(req.usuario)) return res.status(403).json({ error: "Rol insuficiente para configurar comisiones" });
    const { motivo } = req.body;
    if (!motivo) return res.status(400).json({ error: "El motivo es obligatorio" });

    const regla = await prisma.commissionRule.findFirst({ where: { id: req.params.id, barberiaId: req.usuario.barberiaId } });
    if (!regla) return res.status(404).json({ error: "Regla no encontrada" });
    if (!sucursalPermitida(req.usuario, regla.sucursalId)) return res.status(403).json({ error: "No tienes autoridad sobre esa sucursal" });

    const actualizada = await prisma.$transaction(async (tx) => {
      const r = await tx.commissionRule.update({ where: { id: regla.id }, data: { estado: "INACTIVA", vigenteHasta: new Date() } });
      await tx.commissionRuleHistory.create({
        data: {
          barberiaId: req.usuario.barberiaId,
          reglaNuevaId: r.id,
          reglaAnteriorId: r.id,
          barberoId: r.barberoId, sucursalId: r.sucursalId, servicioId: r.servicioId,
          barberoPctAnterior: r.barberoPct, barberiaPctAnterior: r.barberiaPct,
          barberoPctNuevo: r.barberoPct, barberiaPctNuevo: r.barberiaPct,
          motivo, actorUserId: req.usuario.id, actorNombre: nombreCompleto(req.usuario) || req.usuario.email, actorRol: req.usuario.rol,
        },
      });
      return r;
    });
    res.json(actualizada);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// GET /api/comisiones/historial — auditoría de cambios
router.get("/historial", auth, requirePermiso("commission.view"), async (req, res) => {
  const { barberoId } = req.query;
  const where = { barberiaId: req.usuario.barberiaId };
  if (req.usuario.rol === "BARBERO" && !req.usuario.isSuperAdmin) {
    where.barberoId = req.usuario.id;
  } else if (barberoId) {
    where.barberoId = barberoId;
  }
  const historial = await prisma.commissionRuleHistory.findMany({ where, orderBy: { creadoEn: "desc" }, take: 100 });
  res.json(historial);
});

module.exports = router;
module.exports.resolverReglaVigente = resolverReglaVigente;
