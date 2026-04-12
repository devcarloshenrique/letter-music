export const loginPathSpec = {
  '/api/auth/login': {
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
                  authenticated: { type: 'boolean', example: true },
                  message: { type: 'string' },
                  cookieCount: { type: 'number', example: 12 }
                },
                required: ['authenticated', 'message', 'cookieCount']
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
                  error: { type: 'string' }
                },
                required: ['error']
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
                  error: { type: 'string' }
                },
                required: ['error']
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
