export function normText(v){
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}
export function normUf(v){
  const s = normText(v);
  if (!s) return null;
  return s.toUpperCase().slice(0,2);
}
export function requireField(res, name, v){
  if (v === undefined || v === null || String(v).trim() === ""){
    res.status(400).json({ ok:false, error:`MISSING_${name.toUpperCase()}` });
    return false;
  }
  return true;
}
export function parseFloatOrNull(v){
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
export function parseIntOrNull(v){
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}
