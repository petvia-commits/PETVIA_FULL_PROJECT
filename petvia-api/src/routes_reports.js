import path from "path";
import fs from "fs";
import { query } from "./db.js";
import { authRequired } from "./auth.js";
import { makeMulter, ensureUploadDir } from "./uploads.js";
import { perceptualHashHex, hammingDistanceHex } from "./imagehash.js";
import { normText, normUf, parseIntOrNull, parseFloatOrNull, requireField } from "./validators.js";
import { v4 as uuidv4 } from "uuid";

const upload = makeMulter();
const uploadDirAbs = ensureUploadDir();

function publicUrlFor(filename){
  const base = (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, "");
  return base ? `${base}/uploads/${encodeURIComponent(filename)}` : `/uploads/${encodeURIComponent(filename)}`;
}

async function validateCityUf(uf, city_id){
  if (!uf || !city_id) return true;
  const r = await query(`SELECT 1 FROM br_cities WHERE id=$1 AND uf=$2`, [city_id, uf]);
  return r.rows.length > 0;
}

async function buildPhotosAndHashes(files){
  const photo_files = [];
  const photo_hashes = [];
  for (const f of files){
    const filename = path.basename(f.filename);
    const hash = await perceptualHashHex(f.path); // 16 hex chars
    photo_files.push({
      filename,
      url: publicUrlFor(filename),
      originalname: f.originalname,
      mimetype: f.mimetype,
      size: f.size
    });
    photo_hashes.push(hash);
  }
  return { photo_files, photo_hashes };
}

async function createReport(req, res, report_type){
  try{
    const userId = req.user?.sub || null;

    const animal_type = normText(req.body?.tipo || req.body?.animal_type);
    const uf = normUf(req.body?.uf);
    const city_id = parseIntOrNull(req.body?.city_id);
    const cidade = normText(req.body?.cidade);
    const whatsapp = normText(req.body?.whatsapp);
    const observacao = normText(req.body?.observacao);

    const gps_lat = parseFloatOrNull(req.body?.gps_lat);
    const gps_lng = parseFloatOrNull(req.body?.gps_lng);
    const gps_accuracy = parseFloatOrNull(req.body?.gps_accuracy);

    if (!requireField(res, "animal_type", animal_type)) return;
    if (!requireField(res, "uf", uf)) return;
    if (!requireField(res, "city_id", city_id)) return;

    if (report_type === "lost" && !requireField(res, "whatsapp", whatsapp)) return;

    const cityOk = await validateCityUf(uf, city_id);
    if (!cityOk) return res.status(400).json({ ok:false, error:"CITY_UF_MISMATCH" });

    const files = (req.files || []);
    const { photo_files, photo_hashes } = await buildPhotosAndHashes(files);

    const id = uuidv4();

    const r = await query(
      `INSERT INTO pet_reports
       (id, user_id, report_type, animal_type, uf, city_id, cidade, whatsapp, observacao,
        gps_lat, gps_lng, gps_accuracy, photo_files, photo_hashes)
       VALUES
       ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::text[])
       RETURNING *`,
      [
        id, userId, report_type, animal_type,
        uf, city_id, cidade, whatsapp, observacao,
        gps_lat, gps_lng, gps_accuracy,
        JSON.stringify(photo_files),
        photo_hashes
      ]
    );

    res.json({ ok:true, message:`Cadastro de ${report_type.toUpperCase()} recebido com sucesso.`, report: r.rows[0] });
  }catch(e){
    const msg = String(e);
    if (msg.includes("INVALID_FILE_TYPE")) return res.status(400).json({ ok:false, error:"INVALID_FILE_TYPE" });
    return res.status(500).json({ ok:false, error:"REPORT_FAILED", detail: msg });
  }
}

export function mountReports(app){
  app.post("/found", authRequired, upload.array("photos", 3), (req, res) => createReport(req, res, "found"));
  app.post("/lost", authRequired, upload.array("photos", 3), (req, res) => createReport(req, res, "lost"));

  /**
   * Busca por semelhança (perceptual hash + Hamming).
   * Form-data:
   * - photo: arquivo
   * Query params opcionais:
   * - uf=GO
   * - city_id=####
   * - animal_type=cachorro|gato
   * - report_type=found|lost
   * - days=14 (janela)
   * - maxDist=10 (0..64)
   */
  app.post("/search", upload.single("photo"), async (req, res) => {
    try{
      if (!req.file) return res.status(400).json({ ok:false, error:"MISSING_PHOTO" });

      const qHash = await perceptualHashHex(req.file.path);

      const uf = req.query?.uf ? String(req.query.uf).toUpperCase().slice(0,2) : null;
      const city_id = req.query?.city_id ? Number(req.query.city_id) : null;
      const animal_type = req.query?.animal_type ? String(req.query.animal_type) : null;
      const report_type = req.query?.report_type ? String(req.query.report_type) : null;

      const days = Number(req.query?.days || 14);
      const maxDist = Number(req.query?.maxDist || 10);

      const where = [];
      const params = [];
      let i = 1;

      where.push(`created_at >= now() - ($${i++}::text || ' days')::interval`); params.push(String(days));
      if (uf){ where.push(`uf=$${i++}`); params.push(uf); }
      if (Number.isFinite(city_id)){ where.push(`city_id=$${i++}`); params.push(city_id); }
      if (animal_type){ where.push(`animal_type=$${i++}`); params.push(animal_type); }
      if (report_type){ where.push(`report_type=$${i++}`); params.push(report_type); }

      // puxamos candidatos "recentes" e filtramos com Hamming no Node (mais simples para VPS)
      const sql = `
        SELECT id, report_type, animal_type, uf, city_id, cidade, whatsapp, observacao,
               gps_lat, gps_lng, gps_accuracy, photo_files, photo_hashes, created_at
          FROM pet_reports
          ${where.length ? "WHERE " + where.join(" AND ") : ""}
          ORDER BY created_at DESC
          LIMIT 300
      `;
      const r = await query(sql, params);

      const scored = [];
      for (const row of r.rows){
        const hashes = row.photo_hashes || [];
        let best = 999;
        for (const h of hashes){
          const d = hammingDistanceHex(qHash, h);
          if (d < best) best = d;
        }
        if (best <= maxDist){
          scored.push({ ...row, score: best });
        }
      }
      scored.sort((a,b) => a.score - b.score || (new Date(b.created_at) - new Date(a.created_at)));

      // remove photo_hashes do retorno (não precisa no front)
      const results = scored.slice(0, 50).map(({ photo_hashes, ...rest }) => rest);

      res.json({ ok:true, queryHash: qHash, maxDist, results });
    }catch(e){
      res.status(500).json({ ok:false, error:"SEARCH_FAILED", detail:String(e) });
    }
  });

  app.get("/reports", async (req, res) => {
    try{
      const report_type = req.query?.report_type;
      const animal_type = req.query?.animal_type;
      const uf = req.query?.uf ? String(req.query.uf).toUpperCase().slice(0,2) : null;
      const city_id = req.query?.city_id ? Number(req.query.city_id) : null;

      const where = [];
      const params = [];
      let i=1;

      if (report_type){ where.push(`report_type=$${i++}`); params.push(report_type); }
      if (animal_type){ where.push(`animal_type=$${i++}`); params.push(animal_type); }
      if (uf){ where.push(`uf=$${i++}`); params.push(uf); }
      if (Number.isFinite(city_id)){ where.push(`city_id=$${i++}`); params.push(city_id); }

      const sql = `
        SELECT id, report_type, animal_type, uf, city_id, cidade, whatsapp, observacao,
               gps_lat, gps_lng, gps_accuracy, photo_files, created_at
          FROM pet_reports
          ${where.length ? "WHERE " + where.join(" AND ") : ""}
          ORDER BY created_at DESC
          LIMIT 100
      `;
      const r = await query(sql, params);
      res.json({ ok:true, reports: r.rows });
    }catch(e){
      res.status(500).json({ ok:false, error:"LIST_FAILED", detail:String(e) });
    }
  });

  // util: serve upload dir
  app.get("/debug/uploads-count", async (_req, res) => {
    const count = fs.readdirSync(uploadDirAbs).length;
    res.json({ ok:true, count });
  });
}
