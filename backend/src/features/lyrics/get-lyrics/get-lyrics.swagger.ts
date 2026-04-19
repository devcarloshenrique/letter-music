export const getLyricsPathSpec = {
  '/api/lyrics': {
    get: {
      tags: ['Lyrics'],
      summary: 'Busca músicas no letras.mus.br com legenda sincronizada disponível',
      parameters: [
        {
          name: 'q',
          in: 'query',
          required: true,
          description: 'Termo de busca (música/artista)',
          schema: {
            type: 'string',
            example: 'eminem superman'
          }
        },
        {
          name: 'page',
          in: 'query',
          required: false,
          description: 'Página da busca (inteiro maior ou igual a 1)',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          }
        }
      ],
      responses: {
        '200': {
          description: 'Busca realizada com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Busca realizada com sucesso.' },
                  request: {
                    type: 'object',
                    properties: {
                      query: { type: 'string', example: 'eminem superman' },
                      timestamp: { type: 'string', format: 'date-time' }
                    },
                    required: ['query', 'timestamp']
                  },
                  results: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', example: 'superman-id' },
                        title: { type: 'string', example: 'Superman' },
                        artist: { type: 'string', example: 'Eminem' },
                        preview: { type: 'string', example: 'Música do Eminem no Letras.' },
                        url: { type: 'string', format: 'uri', example: 'https://www.letras.mus.br/eminem/superman/' }
                      },
                      required: ['id', 'title', 'artist', 'preview', 'url']
                    }
                  },
                  pagination: {
                    type: 'object',
                    properties: {
                      current: { type: 'integer', example: 5 },
                      skipped: {
                        type: 'array',
                        items: { type: 'integer' },
                        example: [4],
                        description: 'Páginas que falharam e foram puladas por retry/skip.'
                      },
                      count: { type: 'integer', example: 10 },
                      next: { type: 'integer', nullable: true, example: 6 },
                      prev: { type: 'integer', nullable: true, example: 4 },
                      hasMore: { type: 'boolean', example: true }
                    },
                    required: ['current', 'skipped', 'count', 'next', 'prev', 'hasMore']
                  }
                },
                required: ['success', 'message', 'request', 'results', 'pagination']
              }
            }
          }
        },
        '400': {
          description: 'Parâmetros de busca inválidos',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: {
                    type: 'object',
                    properties: {
                      code: { type: 'string', example: 'APP_ERROR' },
                      message: { type: 'string' }
                    },
                    required: ['code', 'message']
                  }
                },
                required: ['success', 'error']
              }
            }
          }
        },
        '404': {
          description: 'Nenhuma música com legenda sincronizada encontrada para a busca',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: {
                    type: 'object',
                    properties: {
                      code: { type: 'string', example: 'APP_ERROR' },
                      message: { type: 'string' }
                    },
                    required: ['code', 'message']
                  }
                },
                required: ['success', 'error']
              }
            }
          }
        },
        '502': {
          description: 'Falha técnica no scraping da busca',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: {
                    type: 'object',
                    properties: {
                      code: { type: 'string', example: 'APP_ERROR' },
                      message: { type: 'string' }
                    },
                    required: ['code', 'message']
                  }
                },
                required: ['success', 'error']
              }
            }
          }
        }
      }
    }
  }
} as const;
