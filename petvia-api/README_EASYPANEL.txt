PETVIA-API (clean) - SEM BAGUNÇA
- Porta: 3000
- Healthcheck: GET /health

EASYPANEL (passo a passo):
1) petvia-api > Fonte > Upload: envie este ZIP
2) Construção: selecione "Dockerfile"
3) Ambiente (Environment):
   PORT=3000
4) Domínios > Destination:
   http://petvia_petvia-api:3000/
5) Implantar

Teste externo:
https://SEU-DOMINIO/health  ->  {"ok":true}
