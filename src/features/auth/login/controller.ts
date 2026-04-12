import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../../shared/errors/app-error';
import { LoginUseCase } from './usecase';

export class LoginController {
  constructor(private readonly useCase: LoginUseCase) {}

  handle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const email = typeof req.body?.email === 'string' ? req.body.email : undefined;
      const password = typeof req.body?.password === 'string' ? req.body.password : undefined;

      const output = await this.useCase.execute({ email, password });
      
      res.status(201).json({
        success: true,
        message: 'Sessão iniciada com sucesso.',
        data: output,
        metadata: {
          timestamp: new Date().toISOString(),
          path: req.path
        }
      });
    } catch (error) {
      next(error);
    }
  };
}
