const router = require("express").Router();
const { auth } = require("../middleware/auth");

// Plantillas de fallback cuando no hay API key de Claude
const PLANTILLAS = {
  corte: "Corte profesional a tijera y máquina con el estilo que prefieras, terminado con delineado perfecto para un look impecable.",
  barba: "Arreglo y perfilado de barba con navaja, dejando un acabado limpio y definido que realza tu estilo personal.",
  fade: "Degradado progresivo ejecutado con precisión, ideal para lucir un look moderno y fresco todos los días.",
  afeitado: "Afeitado clásico con navaja caliente que deja la piel suave y sin irritación, una experiencia de barbería tradicional.",
  lavado: "Lavado y acondicionamiento del cabello con productos premium que nutren y fortalecen cada hebra.",
  tinte: "Aplicación de color profesional con productos de alta calidad para un resultado vibrante y duradero.",
  tratamiento: "Tratamiento capilar profundo que hidrata, repara y fortalece el cabello desde la raíz hasta las puntas.",
  cejas: "Diseño y perfilado de cejas para enmarcar tu mirada con naturalidad y precisión.",
  masaje: "Masaje relajante en cuero cabelludo y cuello que alivia la tensión y estimula la circulación.",
  shampoo: "Lavado premium con shampoo especializado para tu tipo de cabello, dejándolo limpio y manejable.",
  producto: "Producto de calidad profesional seleccionado especialmente para el cuidado y estilo de tu cabello.",
  pomada: "Pomada de fijación fuerte y brillo natural para modelar tu peinado con un acabado elegante todo el día.",
  aceite: "Aceite nutritivo que hidrata en profundidad, controla la sequedad y aporta brillo natural al cabello y barba.",
  cera: "Cera de alta fijación para definir y moldear tu estilo con textura y control duradero.",
};

function descripcionFallback(nombre) {
  const lower = nombre.toLowerCase();
  for (const [clave, texto] of Object.entries(PLANTILLAS)) {
    if (lower.includes(clave)) return texto;
  }
  return `${nombre}: servicio profesional de barbería realizado con técnicas de alta calidad y productos premium para que luzcas siempre en tu mejor versión.`;
}

router.post("/descripcion", auth, async (req, res) => {
  const { nombre, tipo = "servicio" } = req.body;
  if (!nombre?.trim()) return res.status(400).json({ error: "Se requiere el nombre" });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.json({ descripcion: descripcionFallback(nombre) });
  }

  try {
    const Anthropic = require("@anthropic-ai/sdk");
    const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });

    const contextoBarberia = tipo === "producto"
      ? `Eres el copywriter de una barbería premium. Genera una descripción de venta atractiva para un PRODUCTO de barbería/peluquería llamado "${nombre}". La descripción debe ser en español, máximo 2 oraciones cortas (máximo 25 palabras en total), resalta el beneficio principal para el cliente, tono profesional y cercano. Responde SOLO la descripción, sin comillas, sin introducción.`
      : `Eres el copywriter de una barbería premium. Genera una descripción atractiva para un SERVICIO de barbería llamado "${nombre}". La descripción debe ser en español, máximo 2 oraciones cortas (máximo 25 palabras en total), resalta el resultado que obtiene el cliente, tono profesional y moderno. Responde SOLO la descripción, sin comillas, sin introducción.`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 120,
      messages: [{ role: "user", content: contextoBarberia }],
    });

    const descripcion = message.content[0]?.text?.trim() || descripcionFallback(nombre);
    res.json({ descripcion });
  } catch (e) {
    res.json({ descripcion: descripcionFallback(nombre) });
  }
});

module.exports = router;
