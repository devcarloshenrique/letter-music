import { loginPathSpec } from '../../../features/auth/login/swagger';
import { getLyricsPathSpec } from '../../../features/lyrics/get-lyrics/get-lyrics.swagger';

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Letter Music API',
    version: '1.0.0',
    description: 'API para extração de letras do letras.mus.br via scraping.'
  },
  servers: [
    {
      url: 'http://localhost:3000'
    }
  ],
  tags: [{ name: 'Health' }, { name: 'Auth' }, { name: 'Lyrics' }],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Verifica se a API está online',
        responses: {
          '200': {
            description: 'API saudável',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', example: true }
                  },
                  required: ['ok']
                }
              }
            }
          }
        }
      }
    },
    ...loginPathSpec,
    ...getLyricsPathSpec
  }
} as const;
