import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";

export default function AdminPanel({ me }){
  const [msg, setMsg] = useState("");
  const [reports, setReports] = useState([]);
  const [importCityId, setImportCityId] = useState("");
  const [importing, setImporting] = useState(false);

  async function load(){
    try{
      const r = await api.adminReports();
      setReports(r.reports || []);
    }catch(err){
      setMsg("❌ " + String(err.message || err));
    }
  }

  useEffect(() => { load(); }, []);

  if (!me || me.role !== "admin"){
    return (
      <div className="container">
        <div className="card">
          <h1>Admin</h1>
          <p style={{opacity:.9}}>Você precisa estar logado como admin.</p>
        </div>
      </div>
    )
  }

  async function delReport(id){
    if (!confirm("Excluir este registro e as fotos?")) return;
    setMsg("");
    try{
      await api.adminDeleteReport(id);
      setReports(r => r.filter(x => x.id !== id));
    }catch(err){
      setMsg("❌ " + String(err.message || err));
    }
  }

  async function delPhoto(id, filename){
    if (!confirm("Excluir só esta foto?")) return;
    setMsg("");
    try{
      await api.adminDeletePhoto(id, filename);
      await load();
    }catch(err){
      setMsg("❌ " + String(err.message || err));
    }
  }

  async function doImport(){
    setMsg("");
    if (!importCityId) { setMsg("❌ Informe o city_id de Goiânia."); return; }
    setImporting(true);
    try{
      const r = await api.adminImport({ uf:"GO", city_id: Number(importCityId), animal_type:"cachorro", onlyGoiania:true, limit: 300 });
      setMsg(`✅ Import: scanned=${r.scanned} imported=${r.imported} (skipped amostra=${(r.skipped||[]).length})`);
      await load();
    }catch(err){
      setMsg("❌ " + String(err.message || err));
    }finally{
      setImporting(false);
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h1>Painel Admin</h1>
        <small>Excluir registros/fotos e importar achados antigos por pasta (IMPORT_DIR).</small>

        <hr />

        <h2>Importar pasta (achados antigos)</h2>
        <div className="row">
          <div style={{flex:1, minWidth:220}}>
            <label>city_id (Goiânia)</label>
            <input className="input" value={importCityId} onChange={e=>setImportCityId(e.target.value)} placeholder="Ex.: 5208707 (exemplo)" />
            <small>Você pega o city_id pelo endpoint: /br/cities?uf=GO</small>
          </div>
          <div style={{display:"flex", alignItems:"end"}}>
            <button className="btn" onClick={doImport} disabled={importing}>{importing ? "Importando..." : "Importar"}</button>
          </div>
        </div>

        <div style={{height:12}} />
        {msg && <div className="badge" style={{background: msg.startsWith("✅") ? "#12331c" : "#3b1e1e", borderColor: msg.startsWith("✅") ? "#2a6b3a" : "#6b2a2a"}}>{msg}</div>}

        <hr />

        <div className="row" style={{justifyContent:"space-between", alignItems:"center"}}>
          <h2 style={{margin:0}}>Últimos registros</h2>
          <button className="btn ghost" onClick={load}>Atualizar</button>
        </div>

        <div style={{height:10}} />
        <div className="grid">
          {reports.map(r => (
            <div key={r.id} className="card" style={{borderRadius:16}}>
              <div className="row" style={{justifyContent:"space-between", alignItems:"center"}}>
                <span className="badge">{r.report_type.toUpperCase()}</span>
                <button className="btn danger" onClick={() => delReport(r.id)}>Excluir</button>
              </div>
              <div style={{height:10}} />
              {(r.photo_files || []).slice(0,3).map((p, i) => (
                <div key={i} style={{marginBottom:10}}>
                  <img className="thumb" src={p.url} alt="foto" />
                  <div style={{height:8}} />
                  <button className="btn ghost" onClick={() => delPhoto(r.id, p.filename)}>Excluir só esta foto</button>
                </div>
              ))}
              <small style={{opacity:.85}}>{r.observacao || "(sem observação)"}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
