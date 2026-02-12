import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Search from "./pages/Search.jsx";
import Found from "./pages/Found.jsx";
import Lost from "./pages/Lost.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/search" element={<Search />} />
      <Route path="/encontrei" element={<Found />} />
      <Route path="/perdi" element={<Lost />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
