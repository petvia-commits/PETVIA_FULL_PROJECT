import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { api, getToken } from "./lib/api.js";
import Topbar from "./components/Topbar.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ReportForm from "./pages/ReportForm.jsx";
import Search from "./pages/Search.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";

export default function App(){
  const [me, setMe] = useState(null);

  async function refreshMe(){
    const token = getToken();
    if (!token){ setMe(null); return; }
    try{
      const r = await api.me();
      setMe(r.user);
    }catch{
      setMe(null);
    }
  }

  useEffect(() => { refreshMe(); }, []);

  return (
    <>
      <div className="container">
        <Topbar me={me} onRefreshMe={refreshMe} />
      </div>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login onLogged={refreshMe} />} />
        <Route path="/register" element={<Register onLogged={refreshMe} />} />
        <Route path="/found" element={<ReportForm type="found" me={me} />} />
        <Route path="/lost" element={<ReportForm type="lost" me={me} />} />
        <Route path="/search" element={<Search me={me} />} />

        <Route path="/admin/login" element={<AdminLogin onLogged={refreshMe} />} />
        <Route path="/admin" element={<AdminPanel me={me} />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
