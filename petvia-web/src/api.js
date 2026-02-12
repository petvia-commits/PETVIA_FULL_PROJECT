export const API_BASE =
  (import.meta.env.VITE_API_BASE || "https://api.petvia.ihia.com.br").trim();

export async function postMultipart(path, formData) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    body: formData,
  });
  const txt = await res.text();
  let data = null;
  try { data = JSON.parse(txt); } catch { data = { raw: txt }; }
  if (!res.ok) {
    throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  }
  return data;
}

export function buildFormData(fields, files, fileFieldName = "photos", maxFiles = 3) {
  const fd = new FormData();
  Object.entries(fields || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    fd.append(k, String(v));
  });
  const arr = Array.from(files || []).slice(0, maxFiles);
  for (const f of arr) fd.append(fileFieldName, f);
  return fd;
}
