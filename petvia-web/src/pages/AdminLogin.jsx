import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setToken } from "../lib/api.js";

export default function AdminLogin({ onLogged }){
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function submit(e){
    e.preventDefault();
    setMsg("");
    try{
      const r = await api.login(email, password);
      setToken(r.token);
      onLogged?.();
      // checa role
      const me = await api.me();
      if (me.user?.role !== "admin"){
        setMsg("❌ Você entrou, mas não é admin.");
        return;
      }
      nav("/admin");
    }catch(err){
      setMsg(String(err.message || err));
    }
  }

  return (
    <div className="container">
      <div className="card" style={{maxWidth:520}}>
        <h1>Admin</h1>
        <small>Somente administrador.</small>
        <form onSubmit={submit}>
          <label>Email</label>
          <input className="input" value={email} onChange={e=>setEmail(e.target.value)} />
          <label>Senha</label>
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <div style={{height:12}} />
          <button className="btn" type="submit">Entrar</button>
          <div style={{height:12}} />
          {msg && <div className="badge" style={{background:"#3b1e1e", borderColor:"#6b2a2a"}}>{msg}</div>}
        </form>
      </div>
    </div>
  )
}
