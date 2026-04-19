---
name: diagnostico-legendas-sincronizadas
description: "Use quando o endpoint /api/lyrics/synced nao retorna legenda mesmo existindo no Letras. Diagnostica causas de metadados, payload subtitle e fallback de video candidato, e orienta correcoes com testes de regressao."
---

# Skill: Diagnostico de Legendas Sincronizadas (PT-BR)

## Objetivo

Resolver erros de extracao no endpoint `/api/lyrics/synced` quando a pagina do Letras aparenta ter legenda sincronizada, mas a API retorna erro `APP_ERROR`.

## Quando usar

- Resposta com `Nao foi possivel localizar dados de legenda sincronizada na pagina da musica.`
- Resposta com `Nao foi possivel extrair legendas sincronizadas da resposta publica.`
- Casos em que `YoutubeID` vem vazio no `ui/lyric`/`ui/player`.
- Casos em que `URL` vem slug e o ID numerico vem em `ID`.

## Causas comuns

1. **`URL` nao numerica (slug)**
- Exemplo: `URL: "thank-u-next"`
- Correcao: usar `ID` numerico como fallback para `songId`.

2. **`YoutubeID` vazio na pagina**
- Exemplo: `YoutubeID: ""`
- Correcao: consultar `/api/v2/subtitle/{songId}/` para obter lista de videos candidatos e tentar cada `youtubeId` em `/api/v2/subtitle/{songId}/{youtubeId}/`.

3. **Payload subtitle em formato diferente**
- Exemplo real: resposta com `Original`/`Translation`, campo `Subtitle` como string JSON.
- Correcao: fazer `JSON.parse(Subtitle)` e extrair linhas `[text, start, end]`; video pode vir em `VideoID`.

4. **Fallback HTML sem dados extraiveis**
- Mesmo com URL de contribuicao, pagina pode nao conter bloco `#leg_sinc` util.
- Correcao: manter fallback, mas priorizar caminho publico quando houver metadados validos.

## Fluxo de diagnostico rapido

1. Reproduzir no use case real com a URL reportada.
2. Inspecionar HTML da pagina publica:
- `ui/lyric` ou `ui/player`
- campos `ID`, `URL`, `YoutubeID`
3. Testar endpoint publico:
- `/api/v2/subtitle/{songId}/{youtubeId}/`
- se `youtubeId` vazio: `/api/v2/subtitle/{songId}/`
4. Inspecionar shape da resposta subtitle:
- array direto
- objeto aninhado (`Original`/`Translation`)
- `Subtitle` serializado como string JSON
5. Ajustar parser com fallback sem quebrar contratos existentes.
6. Adicionar teste de regressao para a URL que falhou.

## Regras de implementacao

- Manter controller fino: validar -> use case -> envelope.
- Nao mover logica para controller/rota.
- Preservar envelope de sucesso/erro.
- Preferir mudanca minima no slice `get-synced-lyrics`.
- Evitar acoplamento cross-slice.

## Matriz minima de testes

1. Sucesso com `URL` numerica e `YoutubeID` presente.
2. Sucesso com `URL` slug + `ID` numerico.
3. Sucesso com `YoutubeID` vazio usando lista de candidatos.
4. Falha 404 quando nenhum candidato retorna linhas.
5. Falha 502 quando endpoint publico retorna erro upstream.
6. Regressao especifica da URL reportada.

## Comandos de verificacao

- `cd backend && npx vitest run src/features/lyrics/get-synced-lyrics/get-synced-lyrics.spec.ts tests/syncedLyricsRoute.integration.test.ts`
- Opcional completo: `cd backend && npm run test`

## Resultado esperado

- Endpoint `/api/lyrics/synced` resiliente para multiplos formatos do Letras.
- Novos cenarios cobertos por testes de regressao.
- Menos falsos negativos de "sem legenda" quando a legenda existe no provider.
