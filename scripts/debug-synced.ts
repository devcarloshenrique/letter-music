import 'dotenv/config';
import { load } from 'cheerio';
import { LoginUseCase } from '../src/features/auth/login/usecase';
import { letrasHttpClient } from '../src/shared/infra/http/letras-http.client';
import { LETRAS_BROWSER_HEADERS } from '../src/shared/infra/http/letras-request';

async function main(): Promise<void> {
  const url = process.argv[2];
  if (!url) {
    throw new Error('Uso: tsx scripts/debug-synced.ts <url-corrigir-legenda>');
  }

  const login = new LoginUseCase(letrasHttpClient);
  await login.execute();

  const response = await letrasHttpClient.get<string>(url, { ...LETRAS_BROWSER_HEADERS });
  const html = String(response.data ?? '');
  const $ = load(html);

  console.log('status:', response.status);
  console.log('html-length:', html.length);
  console.log('#leg_sinc:', $('#leg_sinc').length);
  console.log('#lsin_ls:', $('#lsin_ls').length);
  console.log('#leg_sinc #lsin_ls li.lineItem:', $('#leg_sinc #lsin_ls li.lineItem').length);
  console.log('#lsin_ls li:', $('#lsin_ls li').length);
  console.log('.lineItem:', $('.lineItem').length);
  console.log('.lsin_c3:', $('.lsin_c3').length);
  console.log('input.legenda:', $('input.legenda').length);

  const legSincHtml = $('#leg_sinc').html() ?? '';
  const firstLi = $('#lsin_ls li').first().html() ?? '';
  console.log('leg_sinc-start:', legSincHtml.slice(0, 1500));
  console.log('first-li-start:', firstLi.slice(0, 1500));

  const scriptSnippets = $('script')
    .map((_, element) => ($(element).html() ?? '').replace(/\s+/g, ' ').trim())
    .get()
    .filter((script) =>
      /lsin|legenda|subtitle|song_id|video_id|start|end|Frase|correcao|lineItem|qxzQR5uwWsk/i.test(script)
    )
    .slice(0, 5);

  console.log('scripts-matched:', scriptSnippets.length);
  scriptSnippets.forEach((snippet, index) => {
    console.log(`script[${index}]-start:`, snippet.slice(0, 2000));
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
