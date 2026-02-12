import React, { useState } from "react";
import { postForm, API_URL } from "../lib/api.js";
import { Link } from "react-router-dom";

export default function SearchImage() {
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [results, setResults] = useState([]);

  async function search() {
    setMsg("Buscando...");
    setResults([]);

    if (!file) {
      setMsg("❌ Selecione uma imagem.");
      return;
    }

    const fd = new FormData();
    fd.append("photos", file); // ⚠ precisa ser "photos"
    fd.append("topK", "20");
    fd.append("limit", "200");

    const { status, json } = await postForm("/search", fd);
    if (status >= 200 && status < 300 && json.ok) {
      setMsg(`✅ Encontrados ${json.results?.length || 0} resultados`);
      setResults(json.results || []);
    } else {
      setMsg(`❌ HTTP ${status}\n${json.error || "Erro"}\nConfirme se a API está online e se a rota POST /search existe.`);
    }
  }

  return (
    <div style={{ background: "white", border: "1px solid #eee", borderRadius: 18, padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Link to="/" style={{ textDecoration: "none" }}>← Voltar</Link>
        <h2 style={{ margin: 0 }}>Buscar por imagem</h2>
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 10, maxWidth: 700 }}>
        <input type="file" accept="image/*" onChange={(e) => setFile((e.target.files || [])[0] || null)} />
        <button onClick={search} style={{ padding: 12, borderRadius: 12, border: 0, background: "#6c2bd9", color: "white", fontWeight: 900, cursor: "pointer" }}>
          Buscar
        </button>
        <div style={{ whiteSpace: "pre-wrap", color: "#444" }}>{msg}</div>
      </div>

      <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
        {results.map((it) => {
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
                <div style={{ marginTop: 8, fontSize: 12, color: "#888" }}>
                  Similaridade (distância): <b>{it.best_distance}</b> (menor = mais parecido)
                </div>
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
