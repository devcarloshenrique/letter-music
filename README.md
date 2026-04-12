# API de Scraping de Letras (Node.js + TypeScript + Express)

API que recebe uma URL do `letras.mus.br`, faz scraping da página e retorna a letra da música em JSON.

## Arquitetura

O projeto foi refatorado para **Vertical Slice + Use Case**, seguindo os princípios do `memory.md`:

- `src/features/lyrics/get-lyrics/`
  - `get-lyrics.controller.ts` (adaptador HTTP)
  - `get-lyrics.usecase.ts` (regra de negócio)
  - `get-lyrics.dto.ts` (contratos de entrada/saída)
  - `get-lyrics.swagger.ts` (documentação da feature)
  - `get-lyrics.spec.ts` (teste unitário do use case)
- `src/shared/providers/scraping/`
  - `iser-scraping.provider.ts` (abstração)
  - `cheerio-scraping.provider.ts` (implementação)
- `src/shared/infra/swagger/openapi.ts` (agregador OpenAPI)
- `src/shared/errors/app-error.ts` (erro de domínio com status HTTP)

## Endpoint

`GET /api/lyrics?url=<url-da-musica>`

## Documentação Swagger

- UI Swagger: `GET /docs`
- OpenAPI JSON: `GET /openapi.json`

Após iniciar a aplicação, acesse no navegador:

- `http://localhost:3000/docs`

### Exemplo de URL suportada

`https://www.letras.mus.br/harpa-crista/853769/`

### Resposta de sucesso (exemplo)

```json
{
  "sourceUrl": "https://www.letras.mus.br/harpa-crista/853769/",
  "title": "Porque Ele Vive - 545",
  "artist": "Harpa Cristã",
  "lyrics": "Deus enviou Seu Filho amado\nPra me salvar e perdoar...",
  "stanzas": [
    "Deus enviou Seu Filho amado\nPra me salvar e perdoar...",
    "Porque Ele vive, posso crer no amanhã..."
  ]
}
```

## Como rodar

1. Instale as dependências:

```bash
npm install
```

2. Rodar em desenvolvimento:

```bash
npm run dev
```

3. Build e execução em produção:

```bash
npm run build
npm start
```

## Testes

```bash
npm test
```

## Observações

- O endpoint valida se a URL pertence ao domínio `letras.mus.br`.
- A extração da letra usa o bloco HTML `.lyric-original p`.
- Em caso de falha de scraping, a API retorna erro com status apropriado.
- A documentação da API é gerada no padrão OpenAPI 3.0.3 e exibida via Swagger UI.