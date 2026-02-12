import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Found from "./pages/Found.jsx";
import Lost from "./pages/Lost.jsx";
import SearchText from "./pages/SearchText.jsx";
import SearchImage from "./pages/SearchImage.jsx";

export default function App() {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", background: "#f6f7fb", minHeight: "100vh" }}>
      <div style={{ background: "white", borderBottom: "1px solid #eee" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 16px", display: "flex", alignItems: "center", gap: 14 }}>
          <Link to="/" style={{ textDecoration: "none", color: "#111", fontWeight: 800, fontSize: 20 }}>
            🐾 PetVia
          </Link>
          <div style={{ flex: 1 }} />
          <Link to="/found" style={{ textDecoration: "none", color: "#0b7", fontWeight: 700 }}>Encontrei</Link>
          <Link to="/lost" style={{ textDecoration: "none", color: "#06c", fontWeight: 700 }}>Perdi</Link>
          <Link to="/search" style={{ textDecoration: "none", color: "#333", fontWeight: 700 }}>Buscar</Link>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/found" element={<Found />} />
          <Route path="/lost" element={<Lost />} />
          <Route path="/search" element={<SearchText />} />
          <Route path="/search-image" element={<SearchImage />} />
        </Routes>
      </div>
    </div>
  );
}
