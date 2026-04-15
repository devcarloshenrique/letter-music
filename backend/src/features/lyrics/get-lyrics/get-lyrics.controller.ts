import type { NextFunction, Request, Response } from 'express';
import { GetLyricsUseCase } from './get-lyrics.usecase';

export class GetLyricsController {
  constructor(private readonly useCase: GetLyricsUseCase) {}

  handle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : '';
      const pageRaw = typeof req.query.page === 'string' ? Number(req.query.page) : undefined;

      const output = await this.useCase.execute({ q, page: pageRaw });
      const hasMore = output.songs.length >= output.pageSize;

      res.json({
        success: true,
        message: 'Busca realizada com sucesso.',
        data: output.songs,
        metadata: {
          page: output.page,
          pageSize: output.pageSize,
          totalPages: output.totalPages,
          hasMore,
          timestamp: new Date().toISOString(),
          path: req.path
        }
      });
    } catch (error) {
      next(error);
    }
  };
}
