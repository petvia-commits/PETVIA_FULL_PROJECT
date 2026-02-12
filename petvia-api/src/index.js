require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const sharp = require("sharp");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

const app = express();

/* =========================
   CONFIG BÁSICA
========================= */
const PORT = Number(process.env.PORT || 3000);
const BASE_URL = (process.env.BASE_URL || "").replace(/\/$/, "");
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME_NOW";

/* =========================
   CORS
========================= */
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* =========================
   UPLOADS (DISCO)
========================= */
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use("/uploads", express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    const name = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 3 },
  fileFilter: (req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);
    cb(ok ? null : new Error("Formato inválido. Use JPG/PNG/WEBP."), ok);
  }
});

/* =========================
   POSTGRES
========================= */
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

/* =========================
   HELPERS
========================= */
function hamming64hex(a, b) {
  if (!a || !b || a.length !== b.length) return 9999;
  const ba = BigInt("0x" + a);
  const bb = BigInt("0x" + b);
  let x = ba ^ bb;
  let count = 0;
  while (x) {
    x &= x - 1n;
    count++;
  }
  return count;
}

async function imageAHash64Hex(filePath) {
  // aHash 8x8 (64 bits): resize 8x8, grayscale, média, bits
  const buf = await sharp(filePath)
    .resize(8, 8, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer();

  let sum = 0;
  for (const v of buf) sum += v;
  const avg = sum / buf.length;

  let bits = 0n;
  for (let i = 0; i < buf.length; i++) {
    const bit = buf[i] >= avg ? 1n : 0n;
    bits = (bits << 1n) | bit;
  }

  // 64 bits => 16 hex chars
  return bits.toString(16).padStart(16, "0");
}

function makePublicUrl(filename) {
  if (!BASE_URL) return `/uploads/${filename}`;
  return `${BASE_URL}/uploads/${filename}`;
}

function authMiddleware(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!token) return res.status(401).json({ ok: false, error: "Sem token." });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ ok: false, error: "Token inválido." });
  }
}

/* =========================
   HEALTH
========================= */
app.get("/health", async (req, res) => {
  try {
    const r = await pool.query("SELECT 1 AS ok");
    res.json({ ok: true, db: r.rows[0].ok });
  } catch (e) {
    res.status(500).json({ ok: false, error: "DB offline", detail: e.message });
  }
});

/* =========================
   AUTH (USUÁRIOS)
========================= */
app.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password, whatsapp } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "email e password são obrigatórios." });
    }

    const passHash = await bcrypt.hash(String(password), 10);
    const id = crypto.randomUUID();

    const q = `
      INSERT INTO users (id, name, email, password_hash, whatsapp)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, whatsapp, created_at
    `;
    const r = await pool.query(q, [id, name || null, String(email).toLowerCase(), passHash, whatsapp || null]);

    const token = jwt.sign({ sub: r.rows[0].id, email: r.rows[0].email }, JWT_SECRET, { expiresIn: "7d" });
    return res.json({ ok: true, user: r.rows[0], token });
  } catch (e) {
    // unique violation
    if (String(e.message || "").includes("duplicate key")) {
      return res.status(409).json({ ok: false, error: "Email já cadastrado." });
    }
    return res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ ok: false, error: "email e password são obrigatórios." });

    const r = await pool.query("SELECT id, email, password_hash, name, whatsapp FROM users WHERE email=$1 LIMIT 1", [
      String(email).toLowerCase()
    ]);
    if (!r.rows.length) return res.status(401).json({ ok: false, error: "Credenciais inválidas." });

    const user = r.rows[0];
    const ok = await bcrypt.compare(String(password), user.password_hash);
    if (!ok) return res.status(401).json({ ok: false, error: "Credenciais inválidas." });

    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    return res.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name, whatsapp: user.whatsapp },
      token
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/* =========================
   REPORTS (FOUND / LOST)
========================= */
async function handleReport(req, res, reportType) {
  try {
    const { tipo, cidade, whatsapp, observacao, gps_lat, gps_lng, gps_accuracy } = req.body || {};

    const animal = String(tipo || "").trim().toLowerCase();
    if (!animal) return res.status(400).json({ ok: false, error: "Campo 'tipo' é obrigatório." });

    const id = crypto.randomUUID();

    const files = (req.files || []).map((f) => ({
      filename: f.filename,
      url: makePublicUrl(f.filename),
      originalname: f.originalname,
      mimetype: f.mimetype,
      size: f.size
    }));

    const hashes = [];
    for (const f of req.files || []) {
      const fp = path.join(UPLOAD_DIR, f.filename);
      const h = await imageAHash64Hex(fp);
      hashes.push(h);
    }

    const q = `
      INSERT INTO pet_reports
        (id, report_type, animal_type, cidade, whatsapp, observacao, gps_lat, gps_lng, gps_accuracy, photo_files, photo_hashes)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::text[])
      RETURNING *
    `;

    const r = await pool.query(q, [
      id,
      reportType,
      animal,
      cidade || null,
      whatsapp || null,
      observacao || null,
      gps_lat ? Number(gps_lat) : null,
      gps_lng ? Number(gps_lng) : null,
      gps_accuracy ? Number(gps_accuracy) : null,
      JSON.stringify(files),
      hashes
    ]);

    return res.json({
      ok: true,
      message: `Cadastro de ${reportType === "found" ? "ENCONTRO" : "PERDA"} recebido com sucesso.`,
      data: r.rows[0]
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}

// ⚠ Campo do upload tem que ser "photos"
app.post("/found", upload.array("photos", 3), (req, res) => handleReport(req, res, "found"));
app.post("/lost", upload.array("photos", 3), (req, res) => handleReport(req, res, "lost"));

/* =========================
   SEARCH POR IMAGEM (POST /search)
========================= */
app.post("/search", upload.array("photos", 1), async (req, res) => {
  try {
    if (!req.files || !req.files.length) {
      return res.status(400).json({ ok: false, error: "Envie 1 imagem no campo 'photos'." });
    }

    const file = req.files[0];
    const queryHash = await imageAHash64Hex(path.join(UPLOAD_DIR, file.filename));

    // Busca últimos N reports e calcula distância
    const limit = Math.min(Number(req.body.limit || 200), 500);

    const r = await pool.query(
      `
      SELECT id, report_type, animal_type, cidade, whatsapp, observacao,
             gps_lat, gps_lng, gps_accuracy, photo_files, photo_hashes, created_at
      FROM pet_reports
      ORDER BY created_at DESC
      LIMIT $1
    `,
      [limit]
    );

    const scored = [];
    for (const row of r.rows) {
      const hashes = row.photo_hashes || [];
      let best = 9999;
      for (const h of hashes) {
        const d = hamming64hex(queryHash, h);
        if (d < best) best = d;
      }

      scored.push({
        ...row,
        best_distance: best
      });
    }

    // quanto menor a distância, mais parecido
    scored.sort((a, b) => a.best_distance - b.best_distance);

    const topK = Math.min(Number(req.body.topK || 20), 50);
    const results = scored.slice(0, topK);

    return res.json({
      ok: true,
      query: { hash: queryHash },
      results
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/* =========================
   SEARCH POR TEXTO (GET /search/text)
========================= */
app.get("/search/text", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const animal = String(req.query.animal || "").trim().toLowerCase(); // cachorro|gato
    const reportType = String(req.query.type || "").trim().toLowerCase(); // found|lost
    const limit = Math.min(Number(req.query.limit || 50), 200);

    const where = [];
    const params = [];
    let i = 1;

    if (q) {
      where.push(`(cidade ILIKE $${i} OR observacao ILIKE $${i})`);
      params.push(`%${q}%`);
      i++;
    }
    if (animal) {
      where.push(`animal_type = $${i}`);
      params.push(animal);
      i++;
    }
    if (reportType) {
      where.push(`report_type = $${i}`);
      params.push(reportType);
      i++;
    }

    const sql = `
      SELECT id, report_type, animal_type, cidade, whatsapp, observacao,
             gps_lat, gps_lng, gps_accuracy, photo_files, created_at
      FROM pet_reports
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY created_at DESC
      LIMIT $${i}
    `;
    params.push(limit);

    const r = await pool.query(sql, params);
    return res.json({ ok: true, q, results: r.rows });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/* =========================
   ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  return res.status(400).json({ ok: false, error: err.message || "Erro." });
});

/* =========================
   START
========================= */
app.listen(PORT, () => {
  console.log(`petvia-api on :${PORT}`);
});
