const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

async function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token requerido" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await prisma.usuario.findUnique({ where: { id: payload.id } });
    if (!usuario || !usuario.estado) return res.status(401).json({ error: "Sin acceso" });
    req.usuario = usuario;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
}

function requirePermiso(permiso) {
  return (req, res, next) => {
    if (req.usuario.isSuperAdmin) return next();
    const permisos = req.usuario.permisos || [];
    if (!permisos.includes(permiso)) return res.status(403).json({ error: "Sin permiso: " + permiso });
    next();
  };
}

function requireRol(...roles) {
  return (req, res, next) => {
    if (req.usuario.isSuperAdmin) return next();
    if (!roles.includes(req.usuario.rol)) return res.status(403).json({ error: "Rol insuficiente" });
    next();
  };
}

module.exports = { auth, requirePermiso, requireRol };
