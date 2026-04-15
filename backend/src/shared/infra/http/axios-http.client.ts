import type { AxiosInstance } from 'axios';
import { CookieJar } from 'tough-cookie';
import type { HttpResponse, IHttpClient } from '../../providers/http/ihttp-client';

const axiosLib = require('axios') as typeof import('axios');
const { wrapper } = require('axios-cookiejar-support') as {
  wrapper: (axios: unknown) => unknown;
};

export class AxiosHttpClient implements IHttpClient {
  constructor(
    private readonly client: AxiosInstance,
    private readonly cookieJar: CookieJar
  ) {}

  static createWithJar(cookieJar: CookieJar): AxiosHttpClient {
    const baseClient = axiosLib.create({
      withCredentials: true,
      validateStatus: () => true
    });
    const client = wrapper(baseClient as any) as AxiosInstance;
    (client.defaults as any).jar = cookieJar;

    return new AxiosHttpClient(client, cookieJar);
  }

  async postForm<TData = unknown>(
    url: string,
    body: URLSearchParams,
    headers?: Record<string, string>
  ): Promise<HttpResponse<TData>> {
    const response = await this.client.post<TData>(url, body.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...headers
      }
    });

    return {
      status: response.status,
      data: response.data,
      headers: response.headers as Record<string, string | string[] | undefined>
    };
  }

  async postJson<TData = unknown>(
    url: string,
    body: unknown,
    headers?: Record<string, string>
  ): Promise<HttpResponse<TData>> {
    const response = await this.client.post<TData>(url, body, {
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });

    return {
      status: response.status,
      data: response.data,
      headers: response.headers as Record<string, string | string[] | undefined>
    };
  }

  async get<TData = unknown>(url: string, headers?: Record<string, string>): Promise<HttpResponse<TData>> {
    const response = await this.client.get<TData>(url, { headers });

    return {
      status: response.status,
      data: response.data,
      headers: response.headers as Record<string, string | string[] | undefined>
    };
  }

  async getCookies(url: string): Promise<string[]> {
    const cookies = await this.cookieJar.getCookies(url);
    return cookies.map((cookie) => cookie.cookieString());
  }
}
