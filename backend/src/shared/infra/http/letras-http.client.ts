import { CookieJar } from 'tough-cookie';
import { AxiosHttpClient } from './axios-http.client';
import { letrasCookieJar } from './letras-session';

export const letrasHttpClient = AxiosHttpClient.createWithJar(letrasCookieJar);

export function createFreshLetrasHttpClient(): AxiosHttpClient {
	return AxiosHttpClient.createWithJar(new CookieJar());
}
