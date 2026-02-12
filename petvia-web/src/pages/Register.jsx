import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setToken } from "../lib/api.js";

export default function Register({ onLogged }){
  const nav = useNavigate();
  const [ufs, setUfs] = useState([]);
  const [cities, setCities] = useState([]);

  const [form, setForm] = useState({
    name:"",
    email:"",
    password:"",
    whatsapp:"",
    uf:"GO",
    city_id:""
  });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.ufs().then(r => setUfs(r.ufs)).catch(()=>{});
  }, []);

  useEffect(() => {
    if (!form.uf) return;
    api.cities(form.uf).then(r => setCities(r.cities)).catch(()=>setCities([]));
  }, [form.uf]);

  async function submit(e){
    e.preventDefault();
    setMsg("");
    try{
      const payload = { ...form, city_id: form.city_id ? Number(form.city_id) : null };
      const r = await api.register(payload);
      setToken(r.token);
      onLogged?.();
      nav("/");
    }catch(err){
      setMsg(String(err.message || err));
    }
  }

  return (
    <div className="container">
      <div className="card" style={{maxWidth:620}}>
        <h1>Criar conta</h1>
        <form onSubmit={submit}>
          <div className="row">
            <div style={{flex:1, minWidth:240}}>
              <label>Nome</label>
              <input className="input" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
            </div>
            <div style={{flex:1, minWidth:240}}>
              <label>WhatsApp (opcional)</label>
              <input className="input" value={form.whatsapp} onChange={e=>setForm({...form, whatsapp:e.target.value})} placeholder="62999999999"/>
            </div>
          </div>

          <label>Email</label>
          <input className="input" value={form.email} onChange={e=>setForm({...form, email:e.target.value})}/>
          <label>Senha</label>
          <input className="input" type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})}/>

          <div className="row">
            <div style={{flex:1, minWidth:140}}>
              <label>UF</label>
              <select className="input" value={form.uf} onChange={e=>setForm({...form, uf:e.target.value, city_id:""})}>
                {ufs.map(u => <option key={u.uf} value={u.uf}>{u.uf} - {u.name}</option>)}
              </select>
            </div>
            <div style={{flex:2, minWidth:240}}>
              <label>Cidade</label>
              <select className="input" value={form.city_id} onChange={e=>setForm({...form, city_id:e.target.value})}>
                <option value="">Selecione</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{height:12}} />
          <button className="btn" type="submit">Criar conta</button>
          <div style={{height:12}} />
          {msg && <div className="badge" style={{background:"#3b1e1e", borderColor:"#6b2a2a"}}>{msg}</div>}
        </form>
        <hr />
        <small>Já tem conta? <Link to="/login">Entrar</Link></small>
      </div>
    </div>
  )
}
