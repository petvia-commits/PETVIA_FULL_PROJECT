import { query } from "./db.js";
import { normUf } from "./validators.js";

export function mountGeo(app){
  app.get("/br/ufs", async (_req, res) => {
    try{
      const r = await query(`SELECT uf, name FROM br_ufs ORDER BY uf`, []);
      res.json({ ok:true, ufs: r.rows });
    }catch(e){
      res.status(500).json({ ok:false, error:"UFS_FAILED", detail:String(e) });
    }
  });

  app.get("/br/cities", async (req, res) => {
    try{
      const uf = normUf(req.query?.uf);
      if (!uf) return res.status(400).json({ ok:false, error:"MISSING_UF" });
      const r = await query(`SELECT id, uf, name FROM br_cities WHERE uf=$1 ORDER BY name`, [uf]);
      res.json({ ok:true, cities: r.rows });
    }catch(e){
      res.status(500).json({ ok:false, error:"CITIES_FAILED", detail:String(e) });
    }
  });
}
