import fs from "fs";
import path from "path";
import express from "express";
import { spawn } from "child_process";
import { query } from "./db.js";
import { authRequired, adminRequired } from "./auth.js";
import { ensureUploadDir } from "./uploads.js";
import { perceptualHashHex } from "./imagehash.js";
import { v4 as uuidv4 } from "uuid";

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

function safeBasename(p){
  return path.basename(p).replace(/[^a-zA-Z0-9._-]/g, "_");
}

function copyIntoUploads(srcFile){
  const safe = safeBasename(srcFile);
  const dstName = `${Date.now()}-${safe}`;
  const dstPath = path.join(uploadDirAbs, dstName);
  fs.copyFileSync(srcFile, dstPath);
  return { filename: dstName, absPath: dstPath };
}

export function mountAdmin(app){
  const router = express.Router();

  // tudo aqui exige login + admin
  router.use(authRequired, adminRequired);

  // listar relatórios
  router.get("/reports", async (req, res) => {
    try{
      const limit = Math.min(Number(req.query?.limit || 100), 200);
      const r = await query(
        `SELECT id, report_type, animal_type, uf, city_id, cidade, whatsapp, observacao, photo_files, created_at
           FROM pet_reports
          ORDER BY created_at DESC
          LIMIT $1`,
        [limit]
      );
      res.json({ ok:true, reports: r.rows });
    }catch(e){
      res.status(500).json({ ok:false, error:"ADMIN_LIST_FAILED", detail:String(e) });
    }
  });

  // excluir relatório (apaga fotos também)
  router.delete("/reports/:id", async (req, res) => {
    try{
      const id = String(req.params.id);
      const r0 = await query(`SELECT photo_files FROM pet_reports WHERE id=$1`, [id]);
      if (!r0.rows.length) return res.status(404).json({ ok:false, error:"NOT_FOUND" });

      const photos = r0.rows[0].photo_files || [];
      await query(`DELETE FROM pet_reports WHERE id=$1`, [id]);

      for (const p of photos){
        if (p?.filename){
          const fp = path.join(uploadDirAbs, safeBasename(p.filename));
          if (fs.existsSync(fp)) fs.unlinkSync(fp);
        }
      }

      res.json({ ok:true, deleted:id, photosDeleted: photos.length });
    }catch(e){
      res.status(500).json({ ok:false, error:"ADMIN_DELETE_FAILED", detail:String(e) });
    }
  });

  // excluir uma foto de um relatório
  router.delete("/reports/:id/photo/:filename", async (req, res) => {
    try{
      const id = String(req.params.id);
      const filename = safeBasename(String(req.params.filename));

      const r0 = await query(`SELECT photo_files FROM pet_reports WHERE id=$1`, [id]);
      if (!r0.rows.length) return res.status(404).json({ ok:false, error:"NOT_FOUND" });

      const photo_files = (r0.rows[0].photo_files || []).filter(Boolean);
      const kept = photo_files.filter(p => p.filename !== filename);

      // recalcula hashes dos arquivos restantes (mais seguro)
      const newHashes = [];
      for (const p of kept){
        const fp = path.join(uploadDirAbs, safeBasename(p.filename));
        if (fs.existsSync(fp)){
          const h = await perceptualHashHex(fp);
          newHashes.push(h);
        }
      }

      await query(
        `UPDATE pet_reports SET photo_files=$2::jsonb, photo_hashes=$3::text[] WHERE id=$1`,
        [id, JSON.stringify(kept), newHashes]
      );

      const fp = path.join(uploadDirAbs, filename);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);

      res.json({ ok:true, report:id, removed: filename });
    }catch(e){
      res.status(500).json({ ok:false, error:"ADMIN_DELETE_PHOTO_FAILED", detail:String(e) });
    }
  });

  /**
   * Importar fotos antigas + TXT (mesmo nome).
   * - Lê a pasta IMPORT_DIR (env) com python3 script.
   * - Filtra por GOIÂNIA (no txt precisa conter "Goiania" ou "Goiânia")
   * - Cria reports "found" com observacao = dados do txt (data/local)
   *
   * Body JSON:
   * - uf (default GO)
   * - city_id (obrigatório)
   * - animal_type (default cachorro)
   * - onlyGoiania (default true)
   * - limit (default 200)
   */
  router.post("/import/found-from-folder", express.json(), async (req, res) => {
    try{
      const importDir = process.env.IMPORT_DIR || "/data/petvia";
      const uf = (req.body?.uf ? String(req.body.uf).toUpperCase().slice(0,2) : "GO");
      const city_id = Number(req.body?.city_id);
      const animal_type = req.body?.animal_type ? String(req.body.animal_type) : "cachorro";
      const onlyGoiania = req.body?.onlyGoiania !== false;
      const limit = Math.min(Number(req.body?.limit || 200), 500);

      if (!Number.isFinite(city_id)) return res.status(400).json({ ok:false, error:"MISSING_CITY_ID" });

      const okCity = await validateCityUf(uf, city_id);
      if (!okCity) return res.status(400).json({ ok:false, error:"CITY_UF_MISMATCH" });

      const py = spawn("python3", ["scripts/import_found_scan.py"], {
        cwd: process.cwd(),
        env: { ...process.env, IMPORT_DIR: importDir }
      });

      let out = "";
      let err = "";
      py.stdout.on("data", (d) => out += d.toString());
      py.stderr.on("data", (d) => err += d.toString());

      const code = await new Promise((resolve) => py.on("close", resolve));
      if (code !== 0){
        return res.status(500).json({ ok:false, error:"IMPORT_SCAN_FAILED", detail: err || `python exit ${code}` });
      }

      let items = [];
      try{ items = JSON.parse(out || "[]"); }catch{
        return res.status(500).json({ ok:false, error:"IMPORT_BAD_JSON", detail: out.slice(0,500) });
      }

      const imported = [];
      const skipped = [];
      for (const it of items.slice(0, limit)){
        const text = String(it.text || "");
        const t = text.toLowerCase();

        if (onlyGoiania){
          if (!(t.includes("goiania") || t.includes("goiânia"))){
            skipped.push({ reason:"NOT_GOIANIA", file: it.image_path });
            continue;
          }
        }

        if (!it.image_path || !fs.existsSync(it.image_path)){
          skipped.push({ reason:"MISSING_IMAGE", file: it.image_path });
          continue;
        }

        // copia imagem para uploads
        const copied = copyIntoUploads(it.image_path);

        const photoHash = await perceptualHashHex(copied.absPath);
        const photo_files = [{
          filename: copied.filename,
          url: publicUrlFor(copied.filename),
          originalname: safeBasename(it.image_path),
          mimetype: mimeFromExt(copied.filename),
          size: fs.statSync(copied.absPath).size
        }];

        const observacao = buildObs(text);

        const id = uuidv4();
        const r = await query(
          `INSERT INTO pet_reports
           (id, user_id, report_type, animal_type, uf, city_id, cidade, whatsapp, observacao,
            gps_lat, gps_lng, gps_accuracy, photo_files, photo_hashes)
           VALUES
           ($1,NULL,'found',$2,$3,$4,'Goiania',NULL,$5,NULL,NULL,NULL,$6::jsonb,$7::text[])
           RETURNING id, created_at`,
          [id, animal_type, uf, city_id, observacao, JSON.stringify(photo_files), [photoHash]]
        );

        imported.push({ id: r.rows[0].id, image: copied.filename });
      }

      res.json({ ok:true, scanned: items.length, imported: imported.length, skipped: skipped.slice(0,50), importedItems: imported.slice(0,50) });
    }catch(e){
      res.status(500).json({ ok:false, error:"IMPORT_FAILED", detail:String(e) });
    }
  });

  app.use("/admin", router);
}

function buildObs(text){
  const s = String(text||"").trim();
  if (!s) return "Importado de pasta (TXT vazio).";
  return `IMPORTADO\n${s}`;
}

function mimeFromExt(filename){
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}
