import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";
import { getGps } from "../lib/geo.js";
import { useNavigate } from "react-router-dom";

export default function ReportForm({ type, me }){
  const nav = useNavigate();
  const isLost = type === "lost";
  const title = isLost ? "Perdi meu pet" : "Encontrei um pet";
  const [ufs, setUfs] = useState([]);
  const [cities, setCities] = useState([]);

  const [form, setForm] = useState({
    animal_type:"cachorro",
    uf: me?.uf || "GO",
    city_id: me?.city_id || "",
    cidade: "",
    whatsapp: me?.whatsapp || "",
    observacao:"",
    gps_lat:"",
    gps_lng:"",
    gps_accuracy:"",
    photos:[]
  });

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.ufs().then(r => setUfs(r.ufs)).catch(()=>{});
  }, []);

  useEffect(() => {
    if (!form.uf) return;
    api.cities(form.uf).then(r => setCities(r.cities)).catch(()=>setCities([]));
  }, [form.uf]);

  useEffect(() => {
    // pega GPS já ao abrir
    getGps().then(g => setForm(f => ({...f, gps_lat: g.lat ?? "", gps_lng: g.lng ?? "", gps_accuracy: g.accuracy ?? "" })));
  }, []);

  const canSubmit = useMemo(() => {
    if (!form.animal_type) return false;
    if (!form.uf || !form.city_id) return false;
    if (isLost && !String(form.whatsapp||"").trim()) return false;
    return true;
  }, [form, isLost]);

  async function submit(e){
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try{
      const fd = new FormData();
      fd.append("animal_type", form.animal_type);
      fd.append("tipo", form.animal_type); // compat
      fd.append("uf", form.uf);
      fd.append("city_id", String(form.city_id));
      fd.append("cidade", form.cidade);
      fd.append("whatsapp", form.whatsapp);
      fd.append("observacao", form.observacao);
      fd.append("gps_lat", String(form.gps_lat||""));
      fd.append("gps_lng", String(form.gps_lng||""));
      fd.append("gps_accuracy", String(form.gps_accuracy||""));
      for (const f of form.photos) fd.append("photos", f);

      const r = isLost ? await api.createLost(fd) : await api.createFound(fd);
      setMsg("✅ Enviado com sucesso!");
      setTimeout(() => nav("/search"), 700);
    }catch(err){
      setMsg("❌ " + String(err.message || err));
    }finally{
      setLoading(false);
    }
  }

  if (!me) {
    return (
      <div className="container">
        <div className="card">
          <h1>{title}</h1>
          <p style={{opacity:.9}}>Para evitar trote e manter a segurança, você precisa estar logado para cadastrar.</p>
          <button className="btn" onClick={() => nav("/login")}>Entrar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="card">
        <h1>{title}</h1>
        <small>GPS automático + validação de cidade pelo UF.</small>

        <form onSubmit={submit}>
          <div className="row">
            <div style={{flex:1, minWidth:180}}>
              <label>Animal</label>
              <select className="input" value={form.animal_type} onChange={e=>setForm({...form, animal_type:e.target.value})}>
                <option value="cachorro">Cachorro</option>
                <option value="gato">Gato</option>
              </select>
            </div>

            <div style={{flex:1, minWidth:120}}>
              <label>UF</label>
              <select className="input" value={form.uf} onChange={e=>setForm({...form, uf:e.target.value, city_id:""})}>
                {ufs.map(u => <option key={u.uf} value={u.uf}>{u.uf}</option>)}
              </select>
            </div>

            <div style={{flex:2, minWidth:220}}>
              <label>Cidade (valida UF)</label>
              <select className="input" value={form.city_id} onChange={e=>setForm({...form, city_id:e.target.value})}>
                <option value="">Selecione</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <label>Cidade (texto livre, opcional)</label>
          <input className="input" value={form.cidade} onChange={e=>setForm({...form, cidade:e.target.value})} placeholder="Ex.: Setor Bueno" />

          <label>WhatsApp {isLost ? "(obrigatório)" : "(opcional)"}</label>
          <input className="input" value={form.whatsapp} onChange={e=>setForm({...form, whatsapp:e.target.value})} placeholder="62999999999" />

          <label>Observação</label>
          <textarea className="input" rows={4} value={form.observacao} onChange={e=>setForm({...form, observacao:e.target.value})}
            placeholder="Cor, porte, coleira, ponto de referência, etc." />

          <label>Fotos (até 3)</label>
          <input className="input" type="file" accept="image/*" multiple onChange={(e)=>{
            const files = Array.from(e.target.files || []).slice(0,3);
            setForm({...form, photos: files});
          }} />

          <div style={{height:10}} />
          <div className="row" style={{gap:10}}>
            <div className="badge">GPS: {form.gps_lat ? "ok" : "não disponível"}</div>
            <button className="btn ghost" type="button" onClick={async ()=>{
              const g = await getGps();
              setForm(f => ({...f, gps_lat: g.lat ?? "", gps_lng: g.lng ?? "", gps_accuracy: g.accuracy ?? "" }));
            }}>Atualizar GPS</button>
          </div>

          <div style={{height:12}} />
          <button className="btn" type="submit" disabled={!canSubmit || loading}>
            {loading ? "Enviando..." : "Enviar"}
          </button>

          <div style={{height:12}} />
          {msg && <div className="badge" style={{background: msg.startsWith("✅") ? "#12331c" : "#3b1e1e", borderColor: msg.startsWith("✅") ? "#2a6b3a" : "#6b2a2a"}}>{msg}</div>}
        </form>
      </div>
    </div>
  )
}
