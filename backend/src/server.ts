import 'dotenv/config';
import { app } from './app';

import { cookiePersistence, letrasCookieJar } from './shared/infra/http/letras-session';

const port = Number(process.env.PORT ?? 3000);

async function startServer() {
  await cookiePersistence.loadCookies(letrasCookieJar);

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API rodando em http://localhost:${port}`);
  });
}

startServer().catch(console.error);