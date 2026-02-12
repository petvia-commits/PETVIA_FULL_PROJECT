import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import bcrypt from "bcryptjs";

import { pool, query } from "./db.js";
import { mountAuth } from "./routes_auth.js";
import { mountGeo } from "./routes_geo.js";
import { mountReports } from "./routes_reports.js";
import { mountAdmin } from "./routes_admin.js";
import { ensureUploadDir } from "./uploads.js";

const app = express();

const corsOrigin = (process.env.CORS_ORIGIN || "*").split(",").map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (corsOrigin.includes("*")) return cb(null, true);
    if (corsOrigin.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true
}));

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("combined"));

const uploadDirAbs = ensureUploadDir();
app.use("/uploads", express.static(uploadDirAbs));

app.get("/health", (_req, res) => res.json({ ok:true }));

mountAuth(app);
mountGeo(app);
mountReports(app);
mountAdmin(app);

app.use((req, res) => res.status(404).send(`Cannot ${req.method} ${req.path}`));

const port = Number(process.env.PORT || 3000);

async function bootstrapAdmin(){
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = (process.env.ADMIN_PASSWORD || "").trim();
  if (!email || !password) return;

  const r = await query(`SELECT id, role FROM users WHERE email=$1`, [email]);
  if (r.rows.length){
    if (r.rows[0].role !== "admin"){
      await query(`UPDATE users SET role='admin' WHERE email=$1`, [email]);
      console.log("[admin] promoted existing user to admin:", email);
    }
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ('Admin', $1, $2, 'admin')`,
    [email, hash]
  );
  console.log("[admin] created admin user:", email);
}

async function boot(){
  await pool.query("SELECT 1");
  await bootstrapAdmin();
  app.listen(port, "0.0.0.0", () => console.log(`[petvia-api] listening on :${port}`));
}

boot().catch(err => {
  console.error("[petvia-api] failed to start:", err);
  process.exit(1);
});
