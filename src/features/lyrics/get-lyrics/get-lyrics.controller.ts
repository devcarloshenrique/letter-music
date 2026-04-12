import type { Request, Response } from 'express';
import { AppError } from '../../../shared/errors/app-error';
import { GetLyricsUseCase } from './get-lyrics.usecase';

export class GetLyricsController {
  constructor(private readonly useCase: GetLyricsUseCase) {}

  handle = async (req: Request, res: Response): Promise<Response> => {
    try {
      const url = typeof req.query.url === 'string' ? req.query.url : '';
      const output = await this.useCase.execute({ url });
      return res.status(200).json(output);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      const message = error instanceof Error ? error.message : 'Falha ao extrair a letra';
      return res.status(502).json({ error: message });
    }
  };
}
