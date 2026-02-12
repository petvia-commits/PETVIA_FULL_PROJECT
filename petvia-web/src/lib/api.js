const API_BASE = import.meta.env.VITE_API_BASE || "https://api.petvia.ihia.com.br";

export function getToken(){
  return localStorage.getItem("petvia_token") || "";
}
export function setToken(t){
  localStorage.setItem("petvia_token", t);
}
export function clearToken(){
  localStorage.removeItem("petvia_token");
}

async function http(path, opts={}){
  const headers = opts.headers || {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  const ct = res.headers.get("content-type") || "";
  const body = ct.includes("application/json") ? await res.json().catch(()=>null) : await res.text().catch(()=>null);
  if (!res.ok){
    const msg = body?.error ? `${body.error}${body.detail ? " - "+body.detail : ""}` : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body;
}

export const api = {
  base: API_BASE,
  me: () => http("/auth/me"),
  login: (email, password) => http("/auth/login", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ email, password }) }),
  register: (payload) => http("/auth/register", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) }),

  ufs: () => http("/br/ufs"),
  cities: (uf) => http(`/br/cities?uf=${encodeURIComponent(uf)}`),

  createFound: (formData) => http("/found", { method:"POST", body: formData }),
  createLost: (formData) => http("/lost", { method:"POST", body: formData }),

  search: (formData, q) => http(`/search${q||""}`, { method:"POST", body: formData }),

  adminReports: () => http("/admin/reports"),
  adminDeleteReport: (id) => http(`/admin/reports/${encodeURIComponent(id)}`, { method:"DELETE" }),
  adminDeletePhoto: (id, filename) => http(`/admin/reports/${encodeURIComponent(id)}/photo/${encodeURIComponent(filename)}`, { method:"DELETE" }),
  adminImport: (payload) => http("/admin/import/found-from-folder", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) }),
};
