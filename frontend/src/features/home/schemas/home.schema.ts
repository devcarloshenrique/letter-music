import { z } from 'zod';

export const homeSearchSchema = z.object({
  query: z.string().min(1, 'Escreva o título, artista ou letra')
});

export type HomeSearchSchema = z.infer<typeof homeSearchSchema>;
