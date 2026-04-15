import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '../../../shared/providers/http/ihttp-client';
import { LoginUseCase } from './usecase';

function createHttpClientMock(): IHttpClient {
  return {
    postForm: vi.fn(),
    postJson: vi.fn(),
    get: vi.fn(),
    getCookies: vi.fn()
  };
}

describe('LoginUseCase', () => {
  const originalEmail = process.env.LETRAS_EMAIL;
  const originalPassword = process.env.LETRAS_PASSWORD;

  afterEach(() => {
    process.env.LETRAS_EMAIL = originalEmail;
    process.env.LETRAS_PASSWORD = originalPassword;
    vi.restoreAllMocks();
  });

  it('realiza login com sucesso e retorna sessão quando cookies são recebidos', async () => {
    process.env.LETRAS_EMAIL = 'dev@example.com';
    process.env.LETRAS_PASSWORD = 'secret';

    const httpClient = createHttpClientMock();
    const useCase = new LoginUseCase(httpClient);

    vi.mocked(httpClient.postJson)
      .mockResolvedValueOnce({
        status: 200,
        data: {
          data: {
            auth: {
              token: 'jwt-token'
            }
          }
        }
      })
      .mockResolvedValueOnce({
        status: 200,
        data: {
          data: {
            viewer: {
              isSessionValid: true
            }
          }
        }
      });

    vi.mocked(httpClient.get).mockResolvedValueOnce({
      status: 307,
      data: '',
      headers: {
        location: 'https://accounts.letras.mus.br/v2/cookies/login?provider=direct&jwt=jwt-token'
      }
    });
    vi.mocked(httpClient.get).mockResolvedValueOnce({
      status: 307,
      data: '',
      headers: {
        location: 'https://accounts.palcomp3.com.br/v2/cookies/login?provider=direct&jwt=jwt-token'
      }
    });
    vi.mocked(httpClient.get).mockResolvedValueOnce({
      status: 200,
      data: '<html>letras-home</html>'
    });
    vi.mocked(httpClient.getCookies)
      .mockResolvedValueOnce(['sessionid=abc123'])
      .mockResolvedValueOnce(['accountsid=def456'])
      .mockResolvedValueOnce([]);

    const result = await useCase.execute();

    expect(result.authenticated).toBe(true);
    expect(result.cookieCount).toBe(2);
    expect(httpClient.postJson).toHaveBeenCalledTimes(2);
    expect(httpClient.get).toHaveBeenCalledTimes(3);
    expect(httpClient.getCookies).toHaveBeenCalledTimes(3);
  });

  it('lança erro para credenciais inválidas quando sessão não é estabelecida', async () => {
    process.env.LETRAS_EMAIL = 'dev@example.com';
    process.env.LETRAS_PASSWORD = 'wrong';

    const httpClient = createHttpClientMock();
    const useCase = new LoginUseCase(httpClient);

    vi.mocked(httpClient.postJson).mockResolvedValueOnce({
      status: 200,
      data: {
        errors: [
          {
            extensions: {
              code: 'INVALID_USER_PASSWORD'
            }
          }
        ]
      }
    });

    await expect(useCase.execute()).rejects.toMatchObject({ statusCode: 401 });
  });
});
