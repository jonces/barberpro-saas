const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase() },
      include: { barberia: true },
    });
    if (!usuario || !usuario.estado) return res.status(401).json({ error: "Credenciales inválidas" });
    const ok = await bcrypt.compare(password, usuario.password);
    if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });
    await prisma.usuario.update({ where: { id: usuario.id }, data: { ultimoAcceso: new Date() } });
    const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    const { password: _, ...user } = usuario;
    res.json({ token, usuario: user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/me", require("../middleware/auth").auth, async (req, res) => {
  const { password: _, ...user } = await prisma.usuario.findUnique({
    where: { id: req.usuario.id },
    include: { barberia: true, sucursal: true },
  });
  res.json(user);
});

module.exports = router;
