import bcrypt from "bcryptjs";
import { query } from "./db.js";
import { signJwt, authRequired } from "./auth.js";
import { normText, normUf, parseIntOrNull, requireField } from "./validators.js";

export function mountAuth(app){
  app.post("/auth/register", async (req, res) => {
    try{
      const name = normText(req.body?.name);
      const email = normText(req.body?.email)?.toLowerCase();
      const password = normText(req.body?.password);
      const whatsapp = normText(req.body?.whatsapp);
      const uf = normUf(req.body?.uf);
      const city_id = parseIntOrNull(req.body?.city_id);

      if (!requireField(res, "name", name)) return;
      if (!requireField(res, "email", email)) return;
      if (!requireField(res, "password", password)) return;

      const password_hash = await bcrypt.hash(password, 10);

      const r = await query(
        `INSERT INTO users (name, email, password_hash, whatsapp, uf, city_id, role)
         VALUES ($1,$2,$3,$4,$5,$6,'user')
         RETURNING id, name, email, whatsapp, uf, city_id, role, created_at`,
        [name, email, password_hash, whatsapp, uf, city_id]
      );

      const user = r.rows[0];
      const token = signJwt({ sub: user.id, email: user.email, name: user.name, role: user.role });
      res.json({ ok:true, token, user });
    }catch(e){
      if (String(e).includes("users_email_key")) return res.status(409).json({ ok:false, error:"EMAIL_ALREADY_EXISTS" });
      res.status(500).json({ ok:false, error:"REGISTER_FAILED", detail: String(e) });
    }
  });

  app.post("/auth/login", async (req, res) => {
    try{
      const email = normText(req.body?.email)?.toLowerCase();
      const password = normText(req.body?.password);

      if (!requireField(res, "email", email)) return;
      if (!requireField(res, "password", password)) return;

      const r = await query(`SELECT id, name, email, password_hash, whatsapp, uf, city_id, role FROM users WHERE email=$1`, [email]);
      if (!r.rows.length) return res.status(401).json({ ok:false, error:"INVALID_CREDENTIALS" });

      const u = r.rows[0];
      const ok = await bcrypt.compare(password, u.password_hash);
      if (!ok) return res.status(401).json({ ok:false, error:"INVALID_CREDENTIALS" });

      const token = signJwt({ sub: u.id, email: u.email, name: u.name, role: u.role });
      delete u.password_hash;
      res.json({ ok:true, token, user: u });
    }catch(e){
      res.status(500).json({ ok:false, error:"LOGIN_FAILED", detail: String(e) });
    }
  });

  app.get("/auth/me", authRequired, async (req, res) => {
    try{
      const userId = req.user?.sub;
      const r = await query(`SELECT id, name, email, whatsapp, uf, city_id, role, created_at FROM users WHERE id=$1`, [userId]);
      if (!r.rows.length) return res.status(404).json({ ok:false, error:"NOT_FOUND" });
      res.json({ ok:true, user: r.rows[0] });
    }catch(e){
      res.status(500).json({ ok:false, error:"ME_FAILED", detail: String(e) });
    }
  });
}
