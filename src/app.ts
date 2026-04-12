import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { loginController } from './features/auth/login';
import { getLyricsController } from './features/lyrics/get-lyrics';
import { openApiSpec } from './shared/infra/swagger/openapi';

export const app = express();

app.get('/openapi.json', (_req, res) => {
  res.json(openApiSpec);
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/login', loginController.handle);
app.get('/api/lyrics', getLyricsController.handle);