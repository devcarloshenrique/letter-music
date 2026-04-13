import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { loginController } from './features/auth/login';
import { getLyricsController } from './features/lyrics/get-lyrics';
import { getSyncedLyricsController } from './features/lyrics/get-synced-lyrics';
import { openApiSpec } from './shared/infra/swagger/openapi';
import { errorHandler } from './shared/infra/http/error-handler';

export const app = express();

app.use(express.json());

app.get('/openapi.json', (_req, res) => {
  res.json(openApiSpec);
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API saudável.',
    data: {
      ok: true
    },
    metadata: {
      timestamp: new Date().toISOString(),
      path: '/health'
    }
  });
});

app.post('/api/auth/login', loginController.handle);
app.get('/api/lyrics', getLyricsController.handle);
app.get('/api/lyrics/synced', getSyncedLyricsController.handle);

app.use(errorHandler);