import { AxiosHttpClient } from '../../../shared/infra/http/axios-http.client';
import { letrasCookieJar } from '../../../shared/infra/http/letras-session';
import { LoginController } from './controller';
import { LoginUseCase } from './usecase';

const httpClient = AxiosHttpClient.createWithJar(letrasCookieJar);
const loginUseCase = new LoginUseCase(httpClient);

export const loginController = new LoginController(loginUseCase);
