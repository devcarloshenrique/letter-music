import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../../shared/errors/app-error';
import { GetLyricsUseCase } from './get-lyrics.usecase';

export class GetLyricsController {
  constructor(private readonly useCase: GetLyricsUseCase) {}

  handle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const url = typeof req.query.url === 'string' ? req.query.url : '';
      const output = await this.useCase.execute({ url });
      
      res.status(200).json({
        success: true,
        message: 'Letra extraída com sucesso.',
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
