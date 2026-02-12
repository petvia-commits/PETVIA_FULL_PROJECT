const API_URL = import.meta.env.VITE_API_URL || "https://api.petvia.ihia.com.br";

export async function postForm(path, formData) {
  const r = await fetch(`${API_URL}${path}`, { method: "POST", body: formData });
  const txt = await r.text();
  try {
    return { status: r.status, json: JSON.parse(txt) };
  } catch {
    return { status: r.status, json: { ok: false, error: txt } };
  }
}

export async function getJson(path) {
  const r = await fetch(`${API_URL}${path}`);
  const txt = await r.text();
  try {
    return { status: r.status, json: JSON.parse(txt) };
  } catch {
    return { status: r.status, json: { ok: false, error: txt } };
  }
}

export { API_URL };
