import { AppError } from '../../../shared/errors/app-error';
import type { IHttpClient } from '../../../shared/providers/http/ihttp-client';
import type { LoginInputDto, LoginOutputDto } from './dto';

const ACCOUNTS_GRAPHQL_URL = 'https://accounts.letras.mus.br/v2/graphql';
const ACCOUNTS_COOKIE_LOGIN_URL = 'https://accounts.cifraclub.com.br/v2/cookies/login';
const LETRAS_BASE_URL = 'https://www.letras.mus.br/';
const ACCOUNTS_BASE_URL = 'https://accounts.letras.mus.br/';

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
        Referer: LETRAS_BASE_URL,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
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
      Referer: LETRAS_BASE_URL,
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
    });

    if (cookieLoginResponse.status >= 400) {
      throw new AppError('Falha ao realizar login no Letras.', 502);
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
        Referer: LETRAS_BASE_URL,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
      }
    );

    const isSessionValid = sessionCheckResponse.data.data?.viewer?.isSessionValid;
    if (!isSessionValid) {
      throw new AppError('Credenciais inválidas ou sessão não estabelecida.', 401);
    }

    const cookies = [
      ...(await this.httpClient.getCookies(LETRAS_BASE_URL)),
      ...(await this.httpClient.getCookies(ACCOUNTS_BASE_URL))
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
