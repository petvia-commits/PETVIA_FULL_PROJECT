"use strict";

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const sharp = require("sharp");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "petvia_secret";

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432
});

const upload = multer({ storage: multer.memoryStorage() });

const UPLOAD_DIR = "uploads";
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// ================= AUTH =================

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      "INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3) RETURNING id",
      [name, email, hash]
    );
    res.json({ ok: true, id: result.rows[0].id });
  } catch (err) {
    res.status(400).json({ error: "Email já existe" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await pool.query("SELECT * FROM users WHERE email=$1", [email]);

  if (!user.rows.length) return res.status(401).json({ error: "Usuário não encontrado" });

  const valid = await bcrypt.compare(password, user.rows[0].password_hash);
  if (!valid) return res.status(401).json({ error: "Senha inválida" });

  const token = jwt.sign({ id: user.rows[0].id }, JWT_SECRET, { expiresIn: "7d" });

  res.json({ ok: true, token });
});

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Token requerido" });

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
}

// ================= REPORT =================

async function saveImage(file) {
  const filename = crypto.randomUUID() + ".jpg";
  const filepath = path.join(UPLOAD_DIR, filename);

  const buffer = await sharp(file.buffer)
    .resize(1000)
    .jpeg({ quality: 80 })
    .toBuffer();

  fs.writeFileSync(filepath, buffer);
  return filename;
}

app.post("/found", auth, upload.array("photos", 3), async (req, res) => {
  const { tipo, cidade, observacao } = req.body;
  const files = req.files || [];

  const savedFiles = [];
  for (const f of files) {
    const name = await saveImage(f);
    savedFiles.push(name);
  }

  await pool.query(
    "INSERT INTO pet_reports(user_id,report_type,animal_type,cidade,observacao,photo_files) VALUES($1,'found',$2,$3,$4,$5)",
    [req.user.id, tipo, cidade, observacao, JSON.stringify(savedFiles)]
  );

  res.json({ ok: true });
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => console.log("API rodando"));
