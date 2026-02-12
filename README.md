# PETVIA — Projeto Completo (petvia-web + petvia-api + postgres)

Este ZIP contém **os dois projetos completos** prontos para continuar no Codex/Cursor e para deploy no EasyPanel.

## Estrutura
```
PETVIA/
  petvia-api/         # Node.js (Express) + PostgreSQL + upload + busca por imagem (hash perceptual)
  petvia-web/         # React + Vite + React Router (Home + Buscar + Perdi + Encontrei)
  database/
    schema.sql        # tabelas e índices
  docker-compose.yml  # opcional para rodar localmente com Postgres
```

---

## 1) Banco de dados (Postgres)
### No EasyPanel
1. Abra o serviço `petvia-db`
2. Vá em **Console do Serviço → Postgres Client**
3. Conecte no banco `petvia` e rode o script `database/schema.sql`

### Local (docker-compose)
```bash
docker compose up -d db
```

---

## 2) Backend (petvia-api)
### Variáveis de ambiente
Copie `.env.example` para `.env` e ajuste:
- `DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD`
- `CORS_ORIGINS` (seu domínio do web)

### Rodar local
```bash
cd petvia-api
npm install
npm run dev
# API: http://localhost:3000/health
```

### Endpoints
- `GET /health`
- `POST /found`  (multipart, campo de arquivo: `photos`, até 3)
- `POST /lost`   (multipart, campo de arquivo: `photos`, até 3)
- `POST /search` (multipart, campo de arquivo: `photos`, até 3) → compara por imagem + filtros

---

## 3) Frontend (petvia-web)
### Variáveis de ambiente
Copie `.env.example` para `.env` e ajuste:
- `VITE_API_BASE=https://api.petvia.ihia.com.br`

### Rodar local
```bash
cd petvia-web
npm install
npm run dev
# Web: http://localhost:3001
```

---

## 4) Deploy no EasyPanel (recomendado)
### petvia-api
- Suba o ZIP da pasta `petvia-api` (sem `node_modules`)
- Configure envs do banco no serviço
- Domínio: `api.petvia.ihia.com.br`

### petvia-web
- Suba o ZIP da pasta `petvia-web` (sem `node_modules`)
- Configure `VITE_API_BASE` no build (env)
- Domínio: `petvia.ihia.com.br`

---

## Observação sobre busca por imagem
Nesta versão, a comparação de imagens é feita com **hash perceptual (aHash)** e distância de Hamming.
É leve e funciona bem como MVP.
Depois você pode evoluir para **pgvector + embeddings (CLIP)** quando quiser.

