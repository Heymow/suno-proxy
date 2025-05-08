import { z } from "zod";
import { Request, Response, NextFunction } from "express";

const songParamsSchema = z.object({
    songId: z.string().min(1).trim().min(1),
    forceRefresh: z
        .string()
        .optional()
        .transform((val) => val === "true"),
});

export function validateSongParams(req: Request, res: Response, next: NextFunction): void {
    const parseResult = songParamsSchema.safeParse({
        songId: req.params.songId,
        forceRefresh: req.query.forceRefresh,
    });

    if (!parseResult.success) {
        res.status(400).json({ error: "Invalid user parameters" });
    }

    (req as any).userParams = parseResult.data;
    next();
}
