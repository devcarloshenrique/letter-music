import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../../shared/errors/app-error';
import { GetSyncedLyricsUseCase } from './get-synced-lyrics.usecase';

export class GetSyncedLyricsController {
  constructor(private readonly useCase: GetSyncedLyricsUseCase) {}

  handle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const url = typeof req.query.url === 'string' ? req.query.url : '';
      const output = await this.useCase.execute({ url });

      res.status(200).json({
        success: true,
        message: 'Legenda sincronizada extraída com sucesso.',
        data: {
          video_url: output.video_url,
          lines: output.lines
        },
        metadata: {
          timestamp: new Date().toISOString(),
          path: req.path,
          hidden: output.hidden
        }
      });
    } catch (error) {
      next(error);
    }
  };
}
