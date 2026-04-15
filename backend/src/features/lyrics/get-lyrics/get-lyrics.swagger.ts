export const getLyricsPathSpec = {
  '/api/lyrics': {
    get: {
      tags: ['Lyrics'],
      summary: 'Busca músicas no letras.mus.br por termo textual',
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
          description: 'Página da busca entre 1 e 10',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 10,
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
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string', example: 'Superman' },
                        description: {
                          type: 'string',
                          example: 'Música de Eminem com letra e tradução no Letras.'
                        },
                        url: {
                          type: 'string',
                          format: 'uri',
                          example: 'https://www.letras.mus.br/eminem/superman/'
                        }
                      },
                      required: ['title', 'description', 'url']
                    }
                  },
                  metadata: {
                    type: 'object',
                    properties: {
                      page: { type: 'integer', example: 2 },
                      pageSize: { type: 'integer', example: 10 },
                      totalPages: {
                        type: 'integer',
                        example: 10,
                        description: 'Total de itens retornados na página.'
                      },
                      hasMore: {
                        type: 'boolean',
                        example: true,
                        description: 'Indica se ainda existem páginas seguintes.'
                      },

                      timestamp: { type: 'string', format: 'date-time' },
                      path: { type: 'string', example: '/api/lyrics' }
                    },
                    required: [
                      'page',
                      'pageSize',
                      'totalPages',
                      'hasMore',
                      'timestamp',
                      'path'
                    ]
                  }
                },
                required: ['success', 'message', 'data', 'metadata']
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
          description: 'Nenhuma música encontrada para a busca',
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
