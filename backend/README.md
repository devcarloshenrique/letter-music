# API de Scraping de Letras (Node.js + TypeScript + Express)

API para busca de músicas no `letras.mus.br` e extração de letras sincronizadas.

## Arquitetura

O projeto foi refatorado para **Vertical Slice + Use Case**, seguindo os princípios do `memory.md`:

- `src/features/lyrics/get-lyrics/`
  - `get-lyrics.controller.ts` (adaptador HTTP)
  - `get-lyrics.usecase.ts` (regra de negócio)
  - `get-lyrics.dto.ts` (contratos de entrada/saída)
  - `get-lyrics.swagger.ts` (documentação da feature)
  - `get-lyrics.spec.ts` (teste unitário do use case)
- `src/shared/providers/scraping/`
  - `iser-scraping.provider.ts` (abstrações)
  - `playwright-scraping.provider.ts` (implementação da busca textual)
- `src/shared/infra/swagger/openapi.ts` (agregador OpenAPI)
- `src/shared/errors/app-error.ts` (erro de domínio com status HTTP)

## Endpoint

`GET /api/lyrics?q=<termo-da-busca>&page=<1-10>`

`GET /api/lyrics/synced?url=<url-corrigir-legenda>`

> Requer sessão autenticada (faça login antes via `/api/auth/login`).

`POST /api/auth/login`

> Esse endpoint usa `LETRAS_EMAIL` e `LETRAS_PASSWORD` do ambiente para autenticação programática e persistência de sessão (cookies).

### Exemplo de resposta da busca textual

```json
{
  "success": true,
  "message": "Busca realizada com sucesso.",
  "data": [
    {
      "title": "Superman",
      "description": "Música de Eminem com letra no Letras.",
      "url": "https://www.letras.mus.br/eminem/superman/"
    }
  ],
  "metadata": {
    "page": 2,
    "hasMore": true,
    "total": null,
    "timestamp": "2026-04-14T10:00:00.000Z",
    "path": "/api/lyrics"
  }
}
```

### Exemplo de resposta de letras sincronizadas

```json
[
  { "time": "00:12.50", "text": "Primeira frase" },
  { "time": "00:15.75", "text": "Segunda frase" }
]
```

## Documentação Swagger

- UI Swagger: `GET /docs`
- OpenAPI JSON: `GET /openapi.json`

Após iniciar a aplicação, acesse no navegador:

- `http://localhost:3000/docs`

### Exemplo de busca suportada

`/api/lyrics?q=eminem&page=2`

## Como rodar

### Com Docker

O backend sobe junto com o frontend a partir da raiz do repositório:

```bash
docker compose up --build
```

Se quiser expor o ngrok junto com a aplicação:

```bash
docker compose --profile ngrok up --build
```

Os endpoints principais ficam disponíveis em:

- `http://localhost:3000/docs`
- `http://localhost:3000/openapi.json`

### Sem Docker

Se preferir rodar apenas o backend localmente:

```bash
npm install
npx playwright install
npm run dev
```

Para build de produção:

```bash
npm run build
npm start
```

## Testes

```bash
npm test
```

## Observações

- O endpoint `/api/lyrics` valida `q` obrigatório e `page` entre 1 e 10.
- A busca textual usa a API interna do `letras.mus.br` (Solr) como estratégia primária, com fallback via Playwright.
- Em caso de falha de scraping, a API retorna erro com status apropriado.
- A documentação da API é gerada no padrão OpenAPI 3.0.3 e exibida via Swagger UI.