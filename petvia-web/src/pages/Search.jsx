import React, { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import SearchBar from "../ui/SearchBar.jsx";
import { buildFormData, postMultipart } from "../api.js";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function Search() {
  const q = useQuery();

  const initial = {
    tipo: q.get("tipo") || "cachorro",
    local: q.get("local") || "Goiânia",
    raioKm: Number(q.get("raioKm") || 10),
    dias: Number(q.get("dias") || 7),
    target: q.get("target") || "found",
  };

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  async function runSearch(values) {
    setErr("");
    setData(null);
    setLoading(true);
    try {
      const fd = buildFormData(
        {
          tipo: values.tipo,
          local: values.local,
          raioKm: values.raioKm,
          dias: values.dias,
          target: values.target,
        },
        values.files,
        "photos",
        3
      );
      const out = await postMultipart("/search", fd);
      setData(out);
    } catch (e) {
      setErr(e?.message || "Erro ao pesquisar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <header className="pageTop">
        <Link to="/" className="linkBack">← Voltar</Link>
        <div className="pageTitle">Pesquisar por imagem</div>
        <div className="pageSub">Envie uma foto e filtre por local e tempo.</div>
      </header>

      <section className="panel">
        <SearchBar variant="search" initial={initial} onSearch={runSearch} />
      </section>

      <section className="panel">
        {loading && <div className="status">🔎 Buscando matches…</div>}

        {!loading && err && (
          <div className="status error">
            ❌ {err}
            <div className="small">Confirme se a API está online e se a rota <span className="mono">POST /search</span> existe.</div>
          </div>
        )}

        {!loading && !err && data && (
          <>
            <div className="status ok">✅ {data.message || "Resultado recebido"}</div>
            <div className="results">
              {(data.matches || []).length === 0 ? (
                <div className="empty">Nenhum match. Tente outra foto ou aumente o período (dias).</div>
              ) : (
                (data.matches || []).map((m) => (
                  <div className="card" key={m.id}>
                    <div className="cardTop">
                      <div className="badge">{m.tipo}</div>
                      <div className="score">Similaridade: <b>{Math.round((m.score || 0) * 100)}%</b></div>
                    </div>
                    <div className="cardBody">
                      <div><b>Local:</b> {m.local || "—"}</div>
                      <div><b>Data:</b> {String(m.createdAt || "—").slice(0, 19).replace("T"," ")}</div>
                      <div><b>Obs:</b> {m.observacao || "—"}</div>
                    </div>
                    <div className="cardActions">
                      {m.whatsapp ? (
                        <a
                          className="btn primary"
                          target="_blank"
                          rel="noreferrer"
                          href={`https://wa.me/55${String(m.whatsapp).replace(/\D/g, "")}?text=${encodeURIComponent(
                            "Olá! Vi um possível match no PetVia. Podemos conversar?"
                          )}`}
                        >
                          Falar no WhatsApp
                        </a>
                      ) : (
                        <button className="btn disabled" disabled>WhatsApp não informado</button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {!loading && !err && !data && (
          <div className="empty">
            Faça uma busca enviando uma foto.
          </div>
        )}
      </section>
    </div>
  );
}
