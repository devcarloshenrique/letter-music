import { AppError } from '../../../shared/errors/app-error';
import { cookiePersistence, letrasCookieJar } from '../../../shared/infra/http/letras-session';    
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

    const cookieLoginResponse = await this.httpClient.get(loginUrl.toString(), {
      ...LETRAS_BROWSER_HEADERS
    });

    if (cookieLoginResponse.status >= 400) {
      throw new AppError('Falha ao realizar login no Letras.', 502);
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

    await cookiePersistence.saveCookies(letrasCookieJar);

    return {
      authenticated: true,
      message: 'Login realizado com sucesso. Sessão persistida para próximos slices.',
      cookieCount: cookies.length
    };
  }
}
