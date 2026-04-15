export type HttpResponse<TData = unknown> = {
  status: number;
  data: TData;
  headers?: Record<string, string | string[] | undefined>;
};

export type HttpRequestOptions = {
  followRedirects?: boolean;
};

export interface IHttpClient {
  postForm<TData = unknown>(
    url: string,
    body: URLSearchParams,
    headers?: Record<string, string>
  ): Promise<HttpResponse<TData>>;
  postJson<TData = unknown>(
    url: string,
    body: unknown,
    headers?: Record<string, string>
  ): Promise<HttpResponse<TData>>;
  get<TData = unknown>(
    url: string,
    headers?: Record<string, string>,
    options?: HttpRequestOptions
  ): Promise<HttpResponse<TData>>;
  getCookies(url: string): Promise<string[]>;
}
