export const getSyncedLyricsPathSpec = {
  '/api/lyrics/synced': {
    get: {
      tags: ['Lyrics'],
      summary: 'Extrai legenda sincronizada de página corrigir_legenda (requer sessão autenticada)',
      parameters: [
        {
          name: 'url',
          in: 'query',
          required: true,
          description: 'URL da página corrigir_legenda',
          schema: {
            type: 'string',
            format: 'uri',
            example:
              'https://www.letras.mus.br/contribuicoes/corrigir_legenda/felipe-rodrigues/tudo-e-perda/qxzQR5uwWsk/'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Legenda sincronizada extraída com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Legenda sincronizada extraída com sucesso.' },
                  data: {
                    type: 'object',
                    properties: {
                      video_url: {
                        type: 'string',
                        format: 'uri',
                        example: 'https://www.youtube.com/watch?v=qxzQR5uwWsk'
                      },
                      lines: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            start: { type: 'string', example: '21.8' },
                            end: { type: 'string', example: '31.1' },
                            text: { type: 'string', example: 'Frase da música' }
                          },
                          required: ['start', 'end', 'text']
                        }
                      }
                    },
                    required: ['lines']
                  },
                  metadata: {
                    type: 'object',
                    properties: {
                      timestamp: { type: 'string', format: 'date-time' },
                      path: { type: 'string', example: '/api/lyrics/synced' },
                      hidden: {
                        oneOf: [
                          {
                            type: 'object',
                            properties: {
                              song_id: { type: 'string', example: '12345' },
                              video_id: { type: 'string', example: '98765' },
                              subtitle_id: { type: 'string', example: '555' }
                            },
                            required: ['song_id', 'video_id', 'subtitle_id']
                          },
                          { type: 'null' }
                        ]
                      }
                    },
                    required: ['timestamp', 'path', 'hidden']
                  }
                },
                required: ['success', 'message', 'data', 'metadata']
              }
            }
          }
        },
        '400': {
          description: 'Parâmetros inválidos',
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
        '401': {
          description: 'Sessão não autenticada/expirada',
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
          description: 'Legenda sincronizada não encontrada',
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
        '500': {
          description: 'Erro interno do servidor',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: {
                    type: 'object',
                    properties: {
                      code: { type: 'string', example: 'INTERNAL_SERVER_ERROR' },
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
