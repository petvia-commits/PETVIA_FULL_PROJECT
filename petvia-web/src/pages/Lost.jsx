import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { buildFormData, postMultipart } from "../api.js";

export default function Lost() {
  const [tipo, setTipo] = useState("cachorro");
  const [castrado, setCastrado] = useState("nao");
  const [cidade, setCidade] = useState("Goiânia");
  const [whatsapp, setWhatsapp] = useState("");
  const [observacao, setObservacao] = useState("");
  const [dataSumico, setDataSumico] = useState("");
  const [raioKm, setRaioKm] = useState(10);
  const [files, setFiles] = useState([]);
  const [gps, setGps] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  async function submit(e) {
    e.preventDefault();
    setStatus("");
    setLoading(true);
    try {
      const fd = buildFormData(
        {
          tipo,
          castrado,
          cidade,
          whatsapp,
          observacao,
          dataSumico,
          raioKm,
          lat: gps?.lat,
          lng: gps?.lng,
          accuracy: gps?.accuracy,
        },
        files,
        "photos",
        3
      );
      const out = await postMultipart("/lost", fd);
      setStatus("✅ Enviado! ID: " + out?.data?.id);
    } catch (err) {
      setStatus("❌ " + (err?.message || "Erro ao enviar"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <header className="pageTop">
        <Link to="/" className="linkBack">← Voltar</Link>
        <div className="pageTitle">Perdi meu pet</div>
        <div className="pageSub">Registre e pesquise por imagem.</div>
      </header>

      <section className="panel">
        <form className="form" onSubmit={submit}>
          <div className="grid">
            <label className="field">
              <span>Tipo</span>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="cachorro">Cachorro</option>
                <option value="gato">Gato</option>
              </select>
            </label>

            <label className="field">
              <span>Castrado?</span>
              <select value={castrado} onChange={(e) => setCastrado(e.target.value)}>
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
            </label>

            <label className="field grow">
              <span>Cidade / Bairro</span>
              <input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Ex: Goiânia - Jardim América" />
            </label>
          </div>

          <div className="grid">
            <label className="field">
              <span>Data do sumiço</span>
              <input type="date" value={dataSumico} onChange={(e) => setDataSumico(e.target.value)} />
            </label>

            <label className="field">
              <span>Raio (km)</span>
              <select value={raioKm} onChange={(e) => setRaioKm(Number(e.target.value))}>
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </label>

            <label className="field grow">
              <span>WhatsApp (DDD + número)</span>
              <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Ex: 62999999999" />
            </label>
          </div>

          <div className="grid">
            <label className="field grow">
              <span>Fotos (até 3)</span>
              <input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
              <span className="small">{files.length} selecionada(s)</span>
            </label>
          </div>

          <label className="field">
            <span>Observações</span>
            <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Cor, porte, sinais, coleira..." />
          </label>

          <div className="row">
            <button className="btn primary big" type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Enviar"}
            </button>
            <Link className="btn ghost big" to="/search">Pesquisar por imagem</Link>
          </div>

          <div className="small">
            {gps ? `📍 GPS ok (${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)})` : "📍 GPS opcional"}
          </div>

          {status && <div className="status">{status}</div>}
        </form>
      </section>
    </div>
  );
}
