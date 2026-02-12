import React, { useEffect, useState } from "react";
import { getJson, API_URL } from "../lib/api.js";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function SearchText() {
  const loc = useLocation();
  const nav = useNavigate();

  const params = new URLSearchParams(loc.search);
  const [q, setQ] = useState(params.get("q") || "");
  const [animal, setAnimal] = useState(params.get("animal") || "");
  const [type, setType] = useState(params.get("type") || "");
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");

  async function load() {
    setMsg("Carregando...");
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (animal) p.set("animal", animal);
    if (type) p.set("type", type);
    const { status, json } = await getJson(`/search/text?${p.toString()}`);
    if (status >= 200 && status < 300 && json.ok) {
      setItems(json.results || []);
      setMsg("");
    } else {
      setMsg(`❌ ${json.error || "Erro"}`);
    }
  }

  useEffect(() => { load(); }, [loc.search]);

  function apply() {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (animal) p.set("animal", animal);
    if (type) p.set("type", type);
    nav(`/search?${p.toString()}`);
  }

  return (
    <div style={{ background: "white", border: "1px solid #eee", borderRadius: 18, padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Link to="/" style={{ textDecoration: "none" }}>← Voltar</Link>
        <h2 style={{ margin: 0 }}>Buscar</h2>
        <div style={{ flex: 1 }} />
        <Link to="/search-image" style={{ textDecoration: "none", fontWeight: 800 }}>🖼 Buscar por imagem</Link>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cidade/bairro ou observação" style={{ flex: "1 1 280px", padding: 12, borderRadius: 10, border: "1px solid #ddd" }} />
        <select value={animal} onChange={(e) => setAnimal(e.target.value)} style={{ padding: 12, borderRadius: 10, border: "1px solid #ddd" }}>
          <option value="">Animal</option>
          <option value="cachorro">Cães</option>
          <option value="gato">Gatos</option>
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ padding: 12, borderRadius: 10, border: "1px solid #ddd" }}>
          <option value="">Tipo</option>
          <option value="lost">Perdido</option>
          <option value="found">Encontrado</option>
        </select>
        <button onClick={apply} style={{ padding: "12px 16px", borderRadius: 12, border: 0, background: "#6c2bd9", color: "white", fontWeight: 900, cursor: "pointer" }}>
          Buscar
        </button>
      </div>

      {msg ? <div style={{ marginTop: 14, color: "#444" }}>{msg}</div> : null}

      <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
        {items.map((it) => {
          const photos = it.photo_files || [];
          const first = photos[0]?.url ? (photos[0].url.startsWith("http") ? photos[0].url : `${API_URL}${photos[0].url}`) : "";
          return (
            <div key={it.id} style={{ border: "1px solid #eee", borderRadius: 14, padding: 12, display: "flex", gap: 12 }}>
              <div style={{ width: 110, height: 90, borderRadius: 12, background: "#f1f2f5", overflow: "hidden", flexShrink: 0 }}>
                {first ? <img src={first} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 900 }}>
                  {it.report_type === "found" ? "ENCONTRADO" : "PERDIDO"} • {it.animal_type?.toUpperCase()}
                </div>
                <div style={{ color: "#444", marginTop: 4 }}>{it.cidade || "-"}</div>
                <div style={{ color: "#666", marginTop: 6 }}>{it.observacao || ""}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: "#666" }}>{new Date(it.created_at).toLocaleString()}</div>
                {it.whatsapp ? <div style={{ marginTop: 8, fontWeight: 800 }}>{it.whatsapp}</div> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
