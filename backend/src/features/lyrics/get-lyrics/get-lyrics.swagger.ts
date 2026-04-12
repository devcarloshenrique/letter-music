export const getLyricsPathSpec = {
  '/api/lyrics': {
    get: {
      tags: ['Lyrics'],
      summary: 'Extrai letra de uma URL do letras.mus.br',
      parameters: [
        {
          name: 'url',
          in: 'query',
          required: true,
          description: 'URL da música no letras.mus.br',
          schema: {
            type: 'string',
            format: 'uri',
            example: 'https://www.letras.mus.br/harpa-crista/853769/'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Letra extraída com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  sourceUrl: { type: 'string', format: 'uri' },
                  title: { type: 'string' },
                  artist: { type: 'string' },
                  lyrics: { type: 'string' },
                  stanzas: {
                    type: 'array',
                    items: { type: 'string' }
                  }
                },
                required: ['sourceUrl', 'title', 'artist', 'lyrics', 'stanzas']
              }
            }
          }
        },
        '400': {
          description: 'URL inválida ou ausente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string' }
                },
                required: ['error']
              }
            }
          }
        },
        '404': {
          description: 'Letra não encontrada na página',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string' }
                },
                required: ['error']
              }
            }
          }
        },
        '502': {
          description: 'Falha na comunicação com o site ou scraping',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: { type: 'string' }
                },
                required: ['error']
              }
            }
          }
        }
      }
    }
  }
} as const;
