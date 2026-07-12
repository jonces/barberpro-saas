require("dotenv").config();
const prisma = require("./lib/prisma");
const bcrypt = require("bcryptjs");

async function main() {
  const hash = await bcrypt.hash("Admin123!", 10);

  // Superadmin
  const superadmin = await prisma.usuario.upsert({
    where: { email: "superadmin@barberpro.com" },
    update: {},
    create: { nombre: "Super Admin", email: "superadmin@barberpro.com", password: hash, rol: "SUPERADMIN", isSuperAdmin: true, permisos: [] },
  });
  console.log("✅ Superadmin:", superadmin.email);

  // Barbería demo
  const barberia = await prisma.barberia.upsert({
    where: { slug: "barberia-el-estilo" },
    update: {},
    create: {
      nombre: "Barbería El Estilo", slug: "barberia-el-estilo",
      telefono: "+505 8888-0000", email: "demo@barberia.com",
      ciudad: "Managua", colorPrimario: "#1a1a1a", colorSecundario: "#d4af37",
      horarios: { create: [0,1,2,3,4,5,6].map(d => ({ diaSemana: d, abierto: d >= 1, apertura: "09:00", cierre: "19:00" })) },
    },
  });

  const adminHash = await bcrypt.hash("Admin123!", 10);
  const admin = await prisma.usuario.upsert({
    where: { email: "admin@barberia.com" },
    update: {},
    create: { nombre: "Carlos", apellido: "López", email: "admin@barberia.com", password: adminHash, rol: "ADMIN", barberiaId: barberia.id, permisos: [] },
  });

  // Categorías de servicios
  const cat = await prisma.categoriaServicio.create({ data: { barberiaId: barberia.id, nombre: "Cortes", orden: 1 } }).catch(() => null);

  // Servicios
  const svcData = [
    { nombre: "Corte Clásico", precio: 150, duracion: 30, color: "#d4af37" },
    { nombre: "Fade", precio: 200, duracion: 45, color: "#3b82f6" },
    { nombre: "Barba", precio: 100, duracion: 20, color: "#22c55e" },
    { nombre: "Corte + Barba", precio: 250, duracion: 60, color: "#a855f7" },
    { nombre: "Lavado", precio: 80, duracion: 15, color: "#f97316" },
  ];
  for (const s of svcData) {
    await prisma.servicio.create({ data: { ...s, barberiaId: barberia.id, categoriaId: cat?.id } }).catch(() => null);
  }

  // Productos
  const catProd = await prisma.categoriaProducto.create({ data: { barberiaId: barberia.id, nombre: "Pomadas y Ceras", orden: 1 } }).catch(() => null);
  const prodData = [
    { nombre: "Pomada Matte", precio: 180, costo: 80, stock: 20 },
    { nombre: "Aceite de Barba", precio: 220, costo: 90, stock: 15 },
    { nombre: "Shampoo Profesional", precio: 250, costo: 100, stock: 10 },
  ];
  for (const p of prodData) {
    await prisma.producto.create({ data: { ...p, barberiaId: barberia.id, categoriaId: catProd?.id, stockMinimo: 5 } }).catch(() => null);
  }

  // Clientes demo
  const clientes = ["Juan Pérez", "Carlos García", "Miguel Torres", "Roberto Ramos"];
  for (const nombre of clientes) {
    const [n, a] = nombre.split(" ");
    await prisma.cliente.create({ data: { nombre: n, apellido: a, barberiaId: barberia.id, telefono: `+505 888${Math.floor(Math.random()*9000+1000)}` } }).catch(() => null);
  }

  console.log("✅ Barbería demo:", barberia.nombre);
  console.log("✅ Admin:", admin.email, "/ contraseña: Admin123!");
  console.log("✅ Servicios y productos creados");
}

main().then(() => { console.log("\n🎉 Seed completado"); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });
