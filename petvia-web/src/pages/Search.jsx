import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";
import ProcessingModal from "../components/ProcessingModal.jsx";
import { useSearchParams } from "react-router-dom";

export default function Search({ me }){
  const [sp] = useSearchParams();
  const presetAnimal = sp.get("animal_type") || "";

  const [ufs, setUfs] = useState([]);
  const [cities, setCities] = useState([]);
  const [uf, setUf] = useState(me?.uf || "GO");
  const [cityId, setCityId] = useState(me?.city_id || "");
  const [animal, setAnimal] = useState(presetAnimal || "cachorro");
  const [reportType, setReportType] = useState("found");
  const [days, setDays] = useState(14);
  const [maxDist, setMaxDist] = useState(10);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [results, setResults] = useState([]);
  const [msg, setMsg] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    api.ufs().then(r => setUfs(r.ufs)).catch(()=>{});
  }, []);

  useEffect(() => {
    api.cities(uf).then(r => setCities(r.cities)).catch(()=>setCities([]));
  }, [uf]);

  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const q = useMemo(() => {
    const params = new URLSearchParams();
    params.set("uf", uf);
    if (cityId) params.set("city_id", String(cityId));
    params.set("animal_type", animal);
    params.set("report_type", reportType);
    params.set("days", String(days));
    params.set("maxDist", String(maxDist));
    return "?" + params.toString();
  }, [uf, cityId, animal, reportType, days, maxDist]);

  async function submit(e){
    e.preventDefault();
    setMsg("");
    setResults([]);

    if (!file){
      setMsg("❌ Selecione uma foto para pesquisar.");
      return;
    }

    setProcessing(true);
    try{
      const fd = new FormData();
      fd.append("photo", file);
      const r = await api.search(fd, q);
      setResults(r.results || []);
      setMsg(r.results?.length ? `✅ Encontramos ${r.results.length} possíveis matches.` : "⚠️ Nenhum match encontrado nessa região/tempo.");
    }catch(err){
      setMsg("❌ " + String(err.message || err));
    }finally{
      setProcessing(false);
    }
  }

  function waLink(whatsapp, text){
    const num = String(whatsapp||"").replace(/\D/g,"");
    const msg = encodeURIComponent(text || "Olá! Vi seu registro no PetVia. Podemos falar sobre o pet?");
    return `https://wa.me/55${num}?text=${msg}`;
  }

  return (
    <div className="container">
      <div className="card">
        <h1>Pesquisar por imagem</h1>
        <small>Filtro por região (UF/cidade) + janela de tempo + distância de hash (semelhança).</small>

        <form onSubmit={submit}>
          <div className="row">
            <div style={{flex:1, minWidth:140}}>
              <label>UF</label>
              <select className="input" value={uf} onChange={e=>{ setUf(e.target.value); setCityId(""); }}>
                {ufs.map(u => <option key={u.uf} value={u.uf}>{u.uf}</option>)}
              </select>
            </div>
            <div style={{flex:2, minWidth:240}}>
              <label>Cidade</label>
              <select className="input" value={cityId} onChange={e=>setCityId(e.target.value)}>
                <option value="">(opcional)</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{flex:1, minWidth:160}}>
              <label>Animal</label>
              <select className="input" value={animal} onChange={e=>setAnimal(e.target.value)}>
                <option value="cachorro">Cachorro</option>
                <option value="gato">Gato</option>
              </select>
            </div>
          </div>

          <div className="row">
            <div style={{flex:1, minWidth:180}}>
              <label>Buscar em</label>
              <select className="input" value={reportType} onChange={e=>setReportType(e.target.value)}>
                <option value="found">Encontrados</option>
                <option value="lost">Perdidos</option>
              </select>
            </div>
            <div style={{flex:1, minWidth:160}}>
              <label>Janela (dias)</label>
              <input className="input" type="number" min="1" max="120" value={days} onChange={e=>setDays(Number(e.target.value||14))} />
            </div>
            <div style={{flex:1, minWidth:160}}>
              <label>Semelhança (0-64)</label>
              <input className="input" type="number" min="0" max="64" value={maxDist} onChange={e=>setMaxDist(Number(e.target.value||10))} />
            </div>
          </div>

          <label>Foto do pet</label>
          <input className="input" type="file" accept="image/*" onChange={(e)=> setFile((e.target.files||[])[0] || null)} />

          {preview && (
            <div style={{marginTop:12}}>
              <img className="thumb" src={preview} alt="preview" />
            </div>
          )}

          <div style={{height:12}} />
          <button className="btn" type="submit">Buscar</button>

          <div style={{height:12}} />
          {msg && <div className="badge" style={{background: msg.startsWith("✅") ? "#12331c" : msg.startsWith("⚠️") ? "#3b3416" : "#3b1e1e", borderColor: msg.startsWith("✅") ? "#2a6b3a" : msg.startsWith("⚠️") ? "#6b5b2a" : "#6b2a2a"}}>{msg}</div>}
        </form>
      </div>

      <div style={{height:16}} />

      <div className="grid">
        {results.map((r) => (
          <div key={r.id} className="card">
            <div className="row" style={{justifyContent:"space-between", alignItems:"center"}}>
              <div className="badge">{r.report_type.toUpperCase()} • score {r.score}</div>
              <div className="badge">{r.uf}{r.city_id ? ` • ${r.city_id}` : ""}</div>
            </div>
            <div style={{height:10}} />
            <img className="thumb" src={r.photo_files?.[0]?.url} alt="match" />
            <div style={{height:10}} />
            <small>{r.observacao || "(sem observação)"}</small>
            <div style={{height:10}} />

            {r.whatsapp ? (
              <a className="btn" href={waLink(r.whatsapp, "Olá! Achei um possível match do seu pet no PetVia. Podemos falar?")} target="_blank" rel="noreferrer">
                Abrir WhatsApp
              </a>
            ) : (
              <small>Sem WhatsApp neste registro.</small>
            )}
          </div>
        ))}
      </div>

      <ProcessingModal open={processing} queryPreview={preview} candidates={results} />
    </div>
  )
}
