import pg from "pg";
const { Pool } = pg;

function bool(v, def=false){
  if (v === undefined || v === null || v === "") return def;
  return String(v).toLowerCase() === "true" || String(v) === "1";
}

export const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: bool(process.env.PGSSL, false) ? { rejectUnauthorized: false } : false,
});

export async function query(text, params){
  return await pool.query(text, params);
}
