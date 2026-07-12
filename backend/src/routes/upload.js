const router = require("express").Router();
const multer = require("multer");
const { auth } = require("../middleware/auth");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg","image/png","image/webp","image/gif","video/mp4","video/quicktime","video/webm"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Tipo de archivo no permitido. Usa JPG, PNG, WebP, GIF, MP4, MOV o WebM"));
  },
});

router.post("/", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No se recibió archivo" });

    const esVideo = req.file.mimetype.startsWith("video/");

    // ── Cloudinary (si está configurado) ──
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      const cloudinary = require("cloudinary").v2;
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: "auto", folder: "barberpro", transformation: esVideo ? [] : [{ quality: "auto", fetch_format: "auto" }] },
          (err, r) => { if (err) reject(err); else resolve(r); }
        );
        stream.end(req.file.buffer);
      });
      return res.json({ url: result.secure_url, tipo: esVideo ? "video" : "imagen", publicId: result.public_id });
    }

    // ── Fallback: base64 (sin Cloudinary) ──
    if (esVideo && req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ error: "Para videos mayores a 10MB necesitas configurar Cloudinary. Contacta al administrador del sistema." });
    }
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    res.json({ url: base64, tipo: esVideo ? "video" : "imagen" });

  } catch (e) {
    if (e.message?.includes("File too large")) return res.status(400).json({ error: "El archivo es muy grande (máximo 100MB)" });
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
