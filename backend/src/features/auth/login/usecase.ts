import { AppError } from '../../../shared/errors/app-error';
import {
  ACCOUNTS_LETRAS_BASE_URL,
  ACCOUNTS_CIFRACLUB_BASE_URL,
  ACCOUNTS_GRAPHQL_URL,
  LETRAS_BASE_URL,
  LETRAS_BROWSER_HEADERS
} from '../../../shared/infra/http/letras-request';
import type { IHttpClient } from '../../../shared/providers/http/ihttp-client';
import type { LoginInputDto, LoginOutputDto } from './dto';

const ACCOUNTS_COOKIE_LOGIN_URL = 'https://accounts.cifraclub.com.br/v2/cookies/login';
const BLOCKED_COOKIE_REDIRECT_HOSTS = new Set(['accounts.palcomp3.com.br']);
const MAX_COOKIE_REDIRECT_STEPS = 5;

type AuthMutationResponse = {
  data?: {
    auth?: {
      tokenType?: string;
      token?: string;
    };
    viewer?: {
      isSessionValid?: boolean;
    };
  };
  errors?: Array<{
    extensions?: {
      code?: string;
    };
  }>;
};

export class LoginUseCase {
  constructor(private readonly httpClient: IHttpClient) {}

  private getRedirectLocation(
    headers?: Record<string, string | string[] | undefined>
  ): string | undefined {
    if (!headers) {
      return undefined;
    }

    const locationHeader = headers.location;
    if (Array.isArray(locationHeader)) {
      return locationHeader[0];
    }

    return locationHeader;
  }

  async execute(input?: LoginInputDto): Promise<LoginOutputDto> {
    const email = input?.email ?? process.env.LETRAS_EMAIL;
    const password = input?.password ?? process.env.LETRAS_PASSWORD;

    if (!email || !password) {
      throw new AppError('Credenciais não configuradas. Defina LETRAS_EMAIL e LETRAS_PASSWORD.', 500);
    }

    const authResponse = await this.httpClient.postJson<AuthMutationResponse>(
      ACCOUNTS_GRAPHQL_URL,
      {
        query: `
          mutation($input: AuthInput!) {
            auth(input: $input){
              tokenType
              token
            }
          }
        `,
        variables: {
          input: {
            email,
            password
          }
        }
      },
      {
        ...LETRAS_BROWSER_HEADERS
      }
    );

    if (authResponse.status >= 400) {
      throw new AppError('Falha ao realizar login no Letras.', 502);
    }

    const code = authResponse.data.errors?.[0]?.extensions?.code;
    if (code === 'INVALID_USER_PASSWORD') {
      throw new AppError('E-mail ou senha incorreto.', 401);
    }

    const token = authResponse.data.data?.auth?.token;
    if (!token) {
      throw new AppError('Credenciais inválidas ou sessão não estabelecida.', 401);
    }

    const loginUrl = new URL(ACCOUNTS_COOKIE_LOGIN_URL);
    loginUrl.searchParams.set('provider', 'direct');
    loginUrl.searchParams.set('jwt', token);
    loginUrl.searchParams.set('href', LETRAS_BASE_URL);

    let currentCookieUrl = loginUrl.toString();
    for (let step = 0; step < MAX_COOKIE_REDIRECT_STEPS; step += 1) {
      const cookieLoginResponse = await this.httpClient.get(
        currentCookieUrl,
        {
          ...LETRAS_BROWSER_HEADERS
        },
        {
          followRedirects: false
        }
      );

      if (cookieLoginResponse.status >= 400) {
        throw new AppError('Falha ao realizar login no Letras.', 502);
      }

      const location = this.getRedirectLocation(cookieLoginResponse.headers);
      if (!location || cookieLoginResponse.status < 300 || cookieLoginResponse.status >= 400) {
        break;
      }

      const nextCookieUrl = new URL(location, currentCookieUrl);
      if (BLOCKED_COOKIE_REDIRECT_HOSTS.has(nextCookieUrl.hostname.toLowerCase())) {
        break;
      }

      currentCookieUrl = nextCookieUrl.toString();
    }

    const letrasWarmupResponse = await this.httpClient.get(LETRAS_BASE_URL, {
      ...LETRAS_BROWSER_HEADERS
    });

    if (letrasWarmupResponse.status >= 400) {
      throw new AppError('Falha ao inicializar sessão no domínio do Letras.', 502);
    }

    const sessionCheckResponse = await this.httpClient.postJson<AuthMutationResponse>(
      ACCOUNTS_GRAPHQL_URL,
      {
        query: `
          query {
            viewer {
              isSessionValid
            }
          }
        `
      },
      {
        ...LETRAS_BROWSER_HEADERS
      }
    );

    const isSessionValid = sessionCheckResponse.data.data?.viewer?.isSessionValid;
    if (!isSessionValid) {
      throw new AppError('Credenciais inválidas ou sessão não estabelecida.', 401);
    }

    const cookies = [
      ...(await this.httpClient.getCookies(LETRAS_BASE_URL)),
      ...(await this.httpClient.getCookies(ACCOUNTS_LETRAS_BASE_URL)),
      ...(await this.httpClient.getCookies(ACCOUNTS_CIFRACLUB_BASE_URL))
    ];

    if (cookies.length === 0) {
      throw new AppError('Credenciais inválidas ou sessão não estabelecida.', 401);
    }

    return {
      authenticated: true,
      message: 'Login realizado com sucesso. Sessão persistida para próximos slices.',
      cookieCount: cookies.length
    };
  }
}
