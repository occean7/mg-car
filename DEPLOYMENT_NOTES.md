# Fotos persistentes fora da Emergent

## O que mudou
- O backend deixou de depender de `INTEGRATION_PROXY_URL` e `EMERGENT_LLM_KEY`.
- `backend/object_storage.py` usa API S3 compatível por boto3; a implementação foi pensada para Cloudflare R2.
- As fotos continuam passando pelo backend (`POST /api/media` e `GET /api/media/{id}`). As credenciais nunca vão para o navegador.
- Uploads são normalizados para JPEG, corrigem a orientação EXIF, são redimensionados para até 1920×1920 e limitados a 10 MB de entrada e 40 megapixels.
- Fotos ainda não vinculadas a um veículo exigem autenticação do proprietário. Fotos vinculadas a anúncios podem ser exibidas publicamente.

## Configurar Cloudflare R2
1. Crie um bucket em Cloudflare R2 (por exemplo, `cuia-car-fotos`).
2. Crie uma API token de R2 com permissão de leitura e escrita somente nesse bucket. Guarde Access Key ID e Secret Access Key.
3. Use o endpoint `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`.
4. No serviço de API do Render, configure `STORAGE_ENDPOINT_URL`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY` e `STORAGE_REGION=auto`.
5. Configure também `MONGO_URL`, `DB_NAME`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `FRONTEND_URL`.
6. Faça deploy e teste upload, edição de veículo, carregamento público e remoção de fotos.

Não torne o bucket público: as imagens são servidas pela API. Nunca coloque chaves de storage em variáveis `REACT_APP_*`.

## Fluxo das fotos
1. Administrador autenticado envia foto para `POST /api/media`.
2. API valida o arquivo, corrige EXIF, reduz a imagem e converte para JPEG.
3. Objeto é salvo no bucket; metadados ficam em MongoDB na coleção `vehicle_photos`.
4. API devolve URL interna `/api/media/<uuid>`, usada pelo anúncio.
5. Navegador carrega a imagem pela API; nenhuma chave de storage chega ao cliente.

## Checklist de produção
- Configurar as credenciais reais do R2 e do MongoDB no painel do Render.
- Configurar `FRONTEND_URL` e `REACT_APP_BACKEND_URL` com as URLs definitivas.
- Testar autenticação, upload, edição, carregamento público e exclusão.
- Validar política de cookies/CORS entre os domínios; é um tema separado do storage.
- Não commitar arquivos `.env`. Se uma credencial real foi exposta, revogue-a e gere outra.
