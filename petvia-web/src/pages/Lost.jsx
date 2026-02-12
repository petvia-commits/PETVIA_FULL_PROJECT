import React, { useState } from "react";
import { postForm } from "../lib/api.js";
import { Link } from "react-router-dom";

export default function Lost() {
  const [tipo, setTipo] = useState("cachorro");
  const [cidade, setCidade] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [observacao, setObservacao] = useState("");
  const [photos, setPhotos] = useState([]);
  const [msg, setMsg] = useState("");

  async function submit() {
    setMsg("Enviando...");
    const fd = new FormData();
    fd.append("tipo", tipo);
    fd.append("cidade", cidade);
    fd.append("whatsapp", whatsapp);
    fd.append("observacao", observacao);
    for (const f of photos) fd.append("photos", f); // ⚠ campo "photos"

    const { status, json } = await postForm("/lost", fd);
    if (status >= 200 && status < 300 && json.ok) setMsg("✅ Enviado com sucesso!");
    else setMsg(`❌ Erro: ${json.error || "Falha"}`);
  }

  return (
    <div style={{ background: "white", border: "1px solid #eee", borderRadius: 18, padding: 18 }}>
      <Link to="/" style={{ textDecoration: "none" }}>← Voltar</Link>
      <h2 style={{ marginTop: 10 }}>Perdi meu pet</h2>

      <div style={{ display: "grid", gap: 10, maxWidth: 700 }}>
        <label>Tipo</label>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={{ padding: 12, borderRadius: 10, border: "1px solid #ddd" }}>
          <option value="cachorro">Cachorro</option>
          <option value="gato">Gato</option>
        </select>

        <label>Cidade/Bairro</label>
        <input value={cidade} onChange={(e) => setCidade(e.target.value)} style={{ padding: 12, borderRadius: 10, border: "1px solid #ddd" }} />

        <label>WhatsApp (com DDD)</label>
        <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Ex: 62999999999" style={{ padding: 12, borderRadius: 10, border: "1px solid #ddd" }} />

        <label>Fotos (até 3)</label>
        <input type="file" multiple accept="image/*" onChange={(e) => setPhotos(Array.from(e.target.files || []).slice(0, 3))} />

        <label>Observações</label>
        <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={4} style={{ padding: 12, borderRadius: 10, border: "1px solid #ddd" }} />

        <button onClick={submit} style={{ padding: 12, borderRadius: 12, border: 0, background: "#06c", color: "white", fontWeight: 900, cursor: "pointer" }}>
          Enviar
        </button>

        <div style={{ color: "#444", whiteSpace: "pre-wrap" }}>{msg}</div>
      </div>
    </div>
  );
}
