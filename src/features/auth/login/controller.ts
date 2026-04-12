import type { Request, Response } from 'express';
import { AppError } from '../../../shared/errors/app-error';
import { LoginUseCase } from './usecase';

export class LoginController {
  constructor(private readonly useCase: LoginUseCase) {}

  handle = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const output = await this.useCase.execute();
      return res.status(200).json(output);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      const message = error instanceof Error ? error.message : 'Erro inesperado no login';
      return res.status(502).json({ error: message });
    }
  };
}
