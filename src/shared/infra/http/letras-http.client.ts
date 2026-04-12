import { AxiosHttpClient } from './axios-http.client';
import { letrasCookieJar } from './letras-session';

export const letrasHttpClient = AxiosHttpClient.createWithJar(letrasCookieJar);
