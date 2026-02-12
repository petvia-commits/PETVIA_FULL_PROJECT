import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Home() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [animal, setAnimal] = useState("");
  const [type, setType] = useState("");

  function goSearch() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (animal) params.set("animal", animal);
    if (type) params.set("type", type);
    nav(`/search?${params.toString()}`);
  }

  const cardStyle = {
    flex: 1,
    background: "white",
    border: "1px solid #eee",
    borderRadius: 16,
    padding: 18,
    boxShadow: "0 6px 18px rgba(0,0,0,.05)",
    cursor: "pointer"
  };

  return (
    <div>
      <div style={{ background: "white", border: "1px solid #eee", borderRadius: 18, padding: 22, boxShadow: "0 6px 18px rgba(0,0,0,.05)" }}>
        <h1 style={{ margin: 0, fontSize: 42, letterSpacing: -1 }}>PetVia</h1>
        <p style={{ marginTop: 10, color: "#444", fontSize: 18 }}>
          Conectando quem encontrou com quem procura.
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Pesquisar por bairro/cidade ou observação..."
            style={{ flex: "1 1 320px", padding: 14, borderRadius: 12, border: "1px solid #ddd" }}
          />

          <select value={animal} onChange={(e) => setAnimal(e.target.value)} style={{ padding: 14, borderRadius: 12, border: "1px solid #ddd" }}>
            <option value="">Animal</option>
            <option value="cachorro">Cães</option>
            <option value="gato">Gatos</option>
          </select>

          <select value={type} onChange={(e) => setType(e.target.value)} style={{ padding: 14, borderRadius: 12, border: "1px solid #ddd" }}>
            <option value="">Tipo</option>
            <option value="lost">Perdido</option>
            <option value="found">Encontrado</option>
          </select>

          <button
            onClick={goSearch}
            style={{ padding: "14px 18px", borderRadius: 12, border: 0, background: "#6c2bd9", color: "white", fontWeight: 800, cursor: "pointer" }}
          >
            🔍 Buscar
          </button>

          <Link
            to="/search-image"
            style={{ padding: "14px 18px", borderRadius: 12, border: "1px solid #ddd", background: "white", fontWeight: 800, textDecoration: "none", color: "#222" }}
          >
            🖼 Buscar por imagem
          </Link>
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, marginTop: 18, flexWrap: "wrap" }}>
        <div style={{ ...cardStyle }} onClick={() => nav("/found")}>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#0b7" }}>Encontrei um pet</div>
          <div style={{ color: "#444", marginTop: 6 }}>Cadastre um animal encontrado (com fotos).</div>
        </div>

        <div style={{ ...cardStyle }} onClick={() => nav("/lost")}>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#06c" }}>Perdi meu pet</div>
          <div style={{ color: "#444", marginTop: 6 }}>Cadastre um animal perdido (com fotos).</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, marginTop: 18, flexWrap: "wrap" }}>
        <div style={{ ...cardStyle }} onClick={() => nav("/search?animal=cachorro")}>
          <div style={{ fontSize: 20, fontWeight: 900 }}>🐶 Cães</div>
          <div style={{ color: "#444", marginTop: 6 }}>Ver cães cadastrados.</div>
        </div>
        <div style={{ ...cardStyle }} onClick={() => nav("/search?animal=gato")}>
          <div style={{ fontSize: 20, fontWeight: 900 }}>🐱 Gatos</div>
          <div style={{ color: "#444", marginTop: 6 }}>Ver gatos cadastrados.</div>
        </div>
      </div>
    </div>
  );
}
