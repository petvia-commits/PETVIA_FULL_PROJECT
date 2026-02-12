import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearToken, getToken } from "../lib/api.js";

export default function Topbar({ me, onRefreshMe }){
  const nav = useNavigate();
  const logged = Boolean(getToken());

  return (
    <div className="topbar">
      <Link to="/" className="badge">🐾 PetVia</Link>
      <div className="row" style={{gap:10, alignItems:"center", justifyContent:"flex-end"}}>
        {me?.role === "admin" && <Link className="btn ghost" to="/admin">Admin</Link>}
        {logged ? (
          <>
            <span className="badge">{me?.name || "Logado"}</span>
            <button className="btn ghost" onClick={() => { clearToken(); onRefreshMe?.(); nav("/"); }}>
              Sair
            </button>
          </>
        ) : (
          <>
            <Link className="btn ghost" to="/login">Entrar</Link>
            <Link className="btn" to="/register">Criar conta</Link>
          </>
        )}
      </div>
    </div>
  )
}
