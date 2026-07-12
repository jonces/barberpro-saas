require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth",      require("./routes/auth"));
app.use("/api/barberias", require("./routes/barberias"));
app.use("/api/usuarios",  require("./routes/usuarios"));
app.use("/api/clientes",  require("./routes/clientes"));
app.use("/api/servicios", require("./routes/servicios"));
app.use("/api/productos", require("./routes/productos"));
app.use("/api/ventas",    require("./routes/ventas"));
app.use("/api/caja",      require("./routes/caja"));
app.use("/api/citas",     require("./routes/citas"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/publico",   require("./routes/publico"));
app.use("/api/upload",    require("./routes/upload"));
app.use("/api/ai",        require("./routes/ai"));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Error interno" });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Backend corriendo en puerto ${port}`));
