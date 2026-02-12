import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { buildFormData, postMultipart } from "../api.js";

export default function Found() {
  const [tipo, setTipo] = useState("cachorro");
  const [cidade, setCidade] = useState("Goiânia");
  const [whatsapp, setWhatsapp] = useState("");
  const [observacao, setObservacao] = useState("");
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
          cidade,
          whatsapp,
          observacao,
          lat: gps?.lat,
          lng: gps?.lng,
          accuracy: gps?.accuracy,
        },
        files,
        "photos",
        3
      );
      const out = await postMultipart("/found", fd);
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
        <div className="pageTitle">Encontrei um pet</div>
        <div className="pageSub">Registre para ajudar alguém a reencontrar.</div>
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

            <label className="field grow">
              <span>Cidade / Bairro</span>
              <input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Ex: Goiânia - Bueno" />
            </label>
          </div>

          <div className="grid">
            <label className="field grow">
              <span>WhatsApp (DDD + número)</span>
              <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Ex: 62999999999" />
            </label>

            <label className="field">
              <span>Fotos (até 3)</span>
              <input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
              <span className="small">{files.length} selecionada(s)</span>
            </label>
          </div>

          <label className="field">
            <span>Observações</span>
            <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Cor, porte, coleira, comportamento..." />
          </label>

          <div className="row">
            <button className="btn primary big" type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Enviar"}
            </button>
            <div className="small">
              {gps ? `📍 GPS ok (${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)})` : "📍 GPS opcional"}
            </div>
          </div>

          {status && <div className="status">{status}</div>}
        </form>
      </section>
    </div>
  );
}
