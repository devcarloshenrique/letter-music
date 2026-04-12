import { letrasHttpClient } from '../../../shared/infra/http/letras-http.client';
import { LoginController } from './controller';
import { LoginUseCase } from './usecase';

const loginUseCase = new LoginUseCase(letrasHttpClient);

export const loginController = new LoginController(loginUseCase);
