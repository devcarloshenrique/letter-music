export type HttpResponse<TData = unknown> = {
  status: number;
  data: TData;
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
  get<TData = unknown>(url: string, headers?: Record<string, string>): Promise<HttpResponse<TData>>;
  getCookies(url: string): Promise<string[]>;
}
