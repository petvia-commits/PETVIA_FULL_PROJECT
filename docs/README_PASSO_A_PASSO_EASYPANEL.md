# PetVia V4 (porta 3000) — Passo a passo (EasyPanel) — para leigo

Este pacote já vem com:
- petvia-api (Node/Express) na porta **3000**
- petvia-web (React/Vite build) servido em **80**
- Admin (login) + painel para excluir fotos e importar “achados antigos”
- Busca por imagem (semelhança por hash perceptual)

---

## 1) Subir o Banco (Postgres) no EasyPanel

1. EasyPanel → **Databases** → **PostgreSQL**
2. Crie um Postgres com:
   - Database: `petvia`
   - User: `petvia`
   - Password: (defina uma senha)

3. Abra o **Client** (psql) do Postgres e rode:
   - `petvia-api/db/schema.sql`
   - `petvia-api/db/seed_ufs.sql`
   - (IMPORTANTE) depois você precisa inserir as cidades de GO (ou do Brasil) na tabela `br_cities`.

> Dica: Se ainda não tem cidades, eu consigo te gerar um arquivo SQL só de Goiânia/GO quando você pedir.

---

## 2) Subir a API (petvia-api)

1. EasyPanel → **Services** → New → App (Dockerfile)
2. Faça upload da pasta `petvia-api` (ou do zip completo) e selecione o Dockerfile da API.

3. Configurações do serviço:
   - Internal Port: **3000**
   - Domain: `api.petvia.ihia.com.br`

4. Environment (variáveis):
   - PORT=3000
   - CORS_ORIGIN=https://petvia.ihia.com.br,http://localhost:5173
   - JWT_SECRET=coloque_uma_senha_grande
   - PGHOST=(host do postgres no easypanel)
   - PGPORT=5432
   - PGDATABASE=petvia
   - PGUSER=petvia
   - PGPASSWORD=sua_senha
   - PGSSL=false
   - PUBLIC_BASE_URL=https://api.petvia.ihia.com.br

### Admin bootstrap (recomendado)
   - ADMIN_EMAIL=admin@petvia.local
   - ADMIN_PASSWORD=ChangeMe123!

> Assim que a API subir, ela cria o admin automaticamente.

5. Teste:
   - Abra: `https://api.petvia.ihia.com.br/health`
   - Deve retornar: `{ "ok": true }`

---

## 3) Subir o WEB (petvia-web)

1. EasyPanel → Services → New → App (Dockerfile)
2. Upload `petvia-web`
3. Domain: `petvia.ihia.com.br`
4. Build arg (se o EasyPanel permitir):
   - VITE_API_BASE = https://api.petvia.ihia.com.br

Se não tiver build arg, não tem problema: o front já usa como padrão `https://api.petvia.ihia.com.br`.

---

## 4) Login obrigatório

- “Encontrei” e “Perdi” exigem login (por segurança).
- “Perdi” exige WhatsApp obrigatório.
- O app tenta pegar GPS automaticamente.

---

## 5) Admin: excluir e importar fotos antigas

### 5.1 Login admin
- Acesse: `https://petvia.ihia.com.br/admin`
- Se não entrar, tente: `/admin/login`
- Use o ADMIN_EMAIL/ADMIN_PASSWORD.

### 5.2 Importar achados antigos por pasta

Você quer uma pasta “petvia” com:
- `foto1.jpg`
- `foto1.txt`
- `foto2.jpg`
- `foto2.txt`
...

#### Onde colocar a pasta?
Você precisa montar um volume/pasta no serviço da API.

**Opção simples:**
- No EasyPanel → Service `petvia-api` → Volumes (ou Mount)
- Crie um mount:
  - Host path: `/etc/easypanel/projects/petvia/import` (exemplo)
  - Container path: `/data/petvia`

Depois coloque os arquivos JPG/TXT nessa pasta do host.

No Environment da API:
- IMPORT_DIR=/data/petvia

No painel Admin, informe o city_id de Goiânia e clique “Importar”.

---

## 6) Busca por imagem (IA simplificada)

A busca usa:
- Hash perceptual (dhash) + distância de Hamming.
- Resultado retorna score (quanto menor, mais parecido).

No front, ao pesquisar:
- aparece uma “telinha” simulando comparação (sobreposição rápida).

---

## 7) Se ficar AMARELO no EasyPanel

Quase sempre é:
- Porta interna errada.
- Healthcheck não bate.

Confirme:
- API: Internal Port **3000**
- Web: Internal Port **80**
- API responde /health.
