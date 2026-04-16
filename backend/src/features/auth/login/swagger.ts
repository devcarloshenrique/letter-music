export const loginPathSpec = {
  '/api/auth/connect-letras': {
    post: {
      tags: ['Auth'],
      summary: 'Realiza login programático no Letras',
      description:
        'Usa credenciais do body (quando enviadas) ou fallback em process.env (LETRAS_EMAIL/LETRAS_PASSWORD) para autenticar e persistir cookies de sessão.',
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                email: { type: 'string', format: 'email' },
                password: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Login realizado com sessão persistida',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Sessão iniciada com sucesso.' },
                  data: {
                    type: 'object',
                    properties: {
                      authenticated: { type: 'boolean', example: true },
                      message: { type: 'string' },
                      cookieCount: { type: 'number', example: 12 }
                    },
                    required: ['authenticated', 'message', 'cookieCount']
                  },
                  metadata: {
                    type: 'object',
                    properties: {
                      timestamp: { type: 'string', format: 'date-time' },
                      path: { type: 'string', example: '/api/auth/connect-letras' }
                    },
                    required: ['timestamp', 'path']
                  }
                },
                required: ['success', 'message', 'data', 'metadata']
              }
            }
          }
        },
        '401': {
          description: 'Credenciais inválidas',
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
          description: 'Variáveis de ambiente ausentes',
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
          description: 'Falha de comunicação com o site alvo',
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
