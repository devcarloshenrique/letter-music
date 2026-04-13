import { loginPathSpec } from '../../../features/auth/login/swagger';
import { getLyricsPathSpec } from '../../../features/lyrics/get-lyrics/get-lyrics.swagger';
import { getSyncedLyricsPathSpec } from '../../../features/lyrics/get-synced-lyrics/get-synced-lyrics.swagger';

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
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'API saudável.' },
                    data: {
                      type: 'object',
                      properties: {
                        ok: { type: 'boolean', example: true }
                      },
                      required: ['ok']
                    },
                    metadata: {
                      type: 'object',
                      properties: {
                        timestamp: { type: 'string', format: 'date-time' },
                        path: { type: 'string', example: '/health' }
                      },
                      required: ['timestamp', 'path']
                    }
                  },
                  required: ['success', 'message', 'data', 'metadata']
                }
              }
            }
          }
        }
      }
    },
    ...loginPathSpec,
    ...getLyricsPathSpec,
    ...getSyncedLyricsPathSpec
  }
} as const;
