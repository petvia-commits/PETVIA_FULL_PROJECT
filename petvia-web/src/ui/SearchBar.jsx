import React, { useEffect, useState } from "react";

export default function SearchBar({ variant = "search", initial, onSearch, onTipoChange }) {
  const [tipo, setTipo] = useState(initial?.tipo || "cachorro");
  const [local, setLocal] = useState(initial?.local || "Goiânia");
  const [raioKm, setRaioKm] = useState(initial?.raioKm ?? 10);
  const [dias, setDias] = useState(initial?.dias ?? 7);
  const [target, setTarget] = useState(initial?.target || "found");
  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (!initial) return;
    setTipo(initial.tipo || "cachorro");
    setLocal(initial.local || "Goiânia");
    setRaioKm(initial.raioKm ?? 10);
    setDias(initial.dias ?? 7);
    setTarget(initial.target || "found");
  }, [initial]);

  function handleTipo(v) {
    setTipo(v);
    onTipoChange?.(v);
  }

  function submit(e) {
    e.preventDefault();
    if (variant === "home") {
      onSearch?.({ tipo, local, raioKm, dias, target });
      return;
    }
    onSearch?.({ tipo, local, raioKm, dias, target, files });
  }

  return (
    <form className="searchBar" onSubmit={submit}>
      <div className="searchRow">
        <label className="field">
          <span>Tipo</span>
          <select value={tipo} onChange={(e) => handleTipo(e.target.value)}>
            <option value="cachorro">Cães</option>
            <option value="gato">Gatos</option>
          </select>
        </label>

        <label className="field grow">
          <span>Local</span>
          <input value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Ex: Goiânia, Setor Bueno" />
        </label>

        <label className="field">
          <span>Raio</span>
          <select value={raioKm} onChange={(e) => setRaioKm(Number(e.target.value))}>
            <option value={3}>3 km</option>
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={20}>20 km</option>
            <option value={50}>50 km</option>
            <option value={100}>100 km</option>
          </select>
        </label>

        <label className="field">
          <span>Tempo</span>
          <select value={dias} onChange={(e) => setDias(Number(e.target.value))}>
            <option value={1}>1 dia</option>
            <option value={3}>3 dias</option>
            <option value={7}>7 dias</option>
            <option value={14}>14 dias</option>
            <option value={30}>30 dias</option>
          </select>
        </label>

        {variant === "search" && (
          <label className="field">
            <span>Buscar em</span>
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="found">Encontrados</option>
              <option value="lost">Perdidos</option>
            </select>
          </label>
        )}
      </div>

      {variant === "search" && (
        <div className="searchRow">
          <label className="field grow">
            <span>Imagem (até 3)</span>
            <input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
            <span className="small">{files.length ? `${files.length} selecionada(s)` : "Nenhuma selecionada"}</span>
          </label>

          <button className="btn primary big" type="submit">Pesquisar</button>
        </div>
      )}

      {variant === "home" && (
        <div className="searchRow">
          <button className="btn primary big" type="submit">Abrir pesquisa</button>
        </div>
      )}
    </form>
  );
}
