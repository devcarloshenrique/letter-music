import type { NextFunction, Request, Response } from 'express';
import { GetLyricsUseCase } from './get-lyrics.usecase';

export class GetLyricsController {
  constructor(private readonly useCase: GetLyricsUseCase) {}

  handle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : '';
      const pageRaw = typeof req.query.page === 'string' ? Number(req.query.page) : undefined;

      const output = await this.useCase.execute({ q, page: pageRaw });
      // Quando scrapamos o Yahoo, deduplicamos os resultados (restringindo para apenas links de músicas válidas).
      // Isso faz com que a requisição orgânica de 10 resulte em menos itens. Portanto, definimos `hasMore = true`
      // desde que tenhamos encontrado pelo menos 1 música, permitindo buscar a próxima página corretamente.
      const hasMore = output.songs.length > 0;

      res.json({
        success: true,
        message: 'Busca realizada com sucesso.',
        request: {
          query: q,
          timestamp: new Date().toISOString()
        },
        results: output.songs,
        pagination: {
          current: output.page,
          count: output.songs.length,
          next: hasMore ? output.page + 1 : null,
          prev: output.page > 1 ? output.page - 1 : null,
          hasMore
        }
      });
    } catch (error) {
      next(error);
    }
  };
}
