import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SearchBar from "../ui/SearchBar.jsx";
import PetCards from "../ui/PetCards.jsx";

export default function Home() {
  const nav = useNavigate();
  const [tipo, setTipo] = useState("cachorro");

  function goSearch(params) {
    const q = new URLSearchParams(params).toString();
    nav(`/search?${q}`);
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brandMark">🐾</span>
          <span className="brandName">PetVia</span>
        </div>

        <div className="topbarRight">
          <button className="btn ghost" onClick={() => nav("/encontrei")}>Encontrei</button>
          <button className="btn primary" onClick={() => nav("/perdi")}>Perdi</button>
        </div>
      </header>

      <main className="hero">
        <div className="heroOverlay">
          <h1>Encontre seu pet mais rápido.</h1>
          <p>Compare por imagem + localização. Compartilhe e ajude outros a encontrar.</p>

          <div className="heroSearch">
            <SearchBar
              variant="home"
              initial={{ tipo }}
              onTipoChange={setTipo}
              onSearch={(values) => goSearch(values)}
            />
          </div>

          <div className="cardsWrap">
            <PetCards onPick={(t) => goSearch({ tipo: t, local: "Goiânia", raioKm: 10, dias: 7 })} />
          </div>

          <div className="hint">
            Dica: use uma foto nítida (rosto ou corpo inteiro) para melhorar o match.
          </div>
        </div>
      </main>

      <footer className="footer">
        <span>© {new Date().getFullYear()} PetVia</span>
      </footer>
    </div>
  );
}
