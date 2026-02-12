import React, { useEffect, useMemo, useState } from "react";

/**
 * Modal que simula "processando" com uma sobreposição rápida de fotos.
 * - Mostra a foto enviada (base64) e fica alternando opacidade para dar sensação de comparação.
 */
export default function ProcessingModal({ open, queryPreview, candidates=[], label="Processando comparação de imagens..." }){
  const [idx, setIdx] = useState(0);

  const candUrls = useMemo(() => {
    const arr = [];
    for (const r of candidates){
      const first = r?.photo_files?.[0]?.url;
      if (first) arr.push(first);
    }
    return arr.slice(0, 12);
  }, [candidates]);

  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setIdx(i => (i+1) % Math.max(1, candUrls.length)), 140);
    return () => clearInterval(t);
  }, [open, candUrls.length]);

  if (!open) return null;

  const top = candUrls.length ? candUrls[idx] : null;

  return (
    <div className="modalBack">
      <div className="modal card">
        <h2 style={{marginBottom:6}}>{label}</h2>
        <small>Isso é uma animação de processamento para o usuário ver que o PetVia está comparando as imagens.</small>
        <div style={{height:12}} />
        <div className="overlayBox">
          <div className="stack pulse">
            {queryPreview && <img alt="Query" src={queryPreview} />}
            {top && <img className="top" alt="Comparando" src={top} />}
          </div>
          <div className="card" style={{borderRadius:16}}>
            <div className="badge">Dica</div>
            <p style={{marginTop:10, marginBottom:0, lineHeight:1.45, opacity:.9}}>
              Comparação por semelhança (hash perceptual). Quanto mais nítida e de frente estiver a foto, melhor.
            </p>
            <hr />
            <div className="row" style={{gap:10}}>
              {candUrls.slice(0,6).map((u, i) => (
                <img key={i} src={u} alt="thumb" style={{width:78, height:58, objectFit:"cover", borderRadius:12, border:"1px solid #22304a"}} />
              ))}
              {!candUrls.length && (
                <div style={{opacity:.75}}>
                  Carregando candidatos...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
