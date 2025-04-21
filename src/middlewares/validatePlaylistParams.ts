import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

const playlistParamsSchema = z.object({
    playlistId: z.string().uuid(),
    forceRefresh: z
        .string()
        .optional()
        .transform((val) => val === 'true'),
});

export function validatePlaylistParams(req: Request, res: Response, next: NextFunction): void {
    const parseResult = playlistParamsSchema.safeParse({
        playlistId: req.params.playlistId,
        forceRefresh: req.query.forceRefresh,
    });

    if (!parseResult.success) {
        res.status(400).json({ error: 'Invalid playlist parameters' });
        return;
    }

    (req as any).playlistParams = parseResult.data;
    next();
}
