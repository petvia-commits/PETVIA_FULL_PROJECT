import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Home(){
  const nav = useNavigate();

  return (
    <div className="container">
      <div className="card">
        <h1>PetVia</h1>
        <p style={{opacity:.9, marginTop:8}}>
          Encontrei um pet na rua ou perdi meu pet? Aqui você cria o registro e pesquisa por imagem para fazer o match.
        </p>
        <div className="row" style={{marginTop:12}}>
          <button className="btn" onClick={() => nav("/search")}>🔎 Pesquisar por imagem</button>
          <Link className="btn ghost" to="/found">🐶 Encontrei (cadastrar)</Link>
          <Link className="btn ghost" to="/lost">😢 Perdi (cadastrar)</Link>
        </div>
      </div>

      <div style={{height:16}} />

      <div className="grid">
        <div className="card">
          <div className="badge">Cães</div>
          <h2 style={{marginTop:10}}>Encontrar cão</h2>
          <p style={{opacity:.85, marginTop:8}}>Envie uma foto e filtre por UF/cidade e tempo.</p>
          <button className="btn" onClick={() => nav("/search?animal_type=cachorro")}>Pesquisar cães</button>
        </div>

        <div className="card">
          <div className="badge">Gatos</div>
          <h2 style={{marginTop:10}}>Encontrar gato</h2>
          <p style={{opacity:.85, marginTop:8}}>Envie uma foto e filtre por UF/cidade e tempo.</p>
          <button className="btn" onClick={() => nav("/search?animal_type=gato")}>Pesquisar gatos</button>
        </div>

        <div className="card">
          <div className="badge">Segurança</div>
          <h2 style={{marginTop:10}}>Sem trote</h2>
          <p style={{opacity:.85, marginTop:8}}>Cadastro obrigatório para registrar “Encontrei” e “Perdi”.</p>
          <Link className="btn ghost" to="/register">Criar conta</Link>
        </div>
      </div>
    </div>
  )
}
