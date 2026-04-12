export const loginPathSpec = {
  '/api/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Realiza login programático no Letras',
      description:
        'Usa process.env.LETRAS_EMAIL e process.env.LETRAS_PASSWORD para autenticar em https://www.letras.mus.br/contribuicoes/entrar/ e persistir cookies de sessão.',
      responses: {
        '200': {
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
