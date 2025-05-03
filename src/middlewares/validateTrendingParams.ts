import { z } from "zod";
import { Request, Response, NextFunction } from "express";

const trendingParamsSchema = z.object({
    list: z.string().min(1),
    timeSpan: z.string().min(1),
    forceRefresh: z
        .union([z.string(), z.boolean()])
        .optional()
        .transform((val) => val === "true" || val === true),
});

const StatusParamsSchema = z.object({
    forceRefresh: z
        .union([z.string(), z.boolean()])
        .optional()
        .transform((val) => val === "true" || val === true),
});

export function validateTrendingParams(req: Request, res: Response, next: NextFunction): void {
    const { list, timeSpan } = req.params;
    const parseResult = trendingParamsSchema.safeParse({
        list,
        timeSpan,
        forceRefresh: req.query.forceRefresh,
    });

    if (!parseResult.success) {
        res.status(400).json({ error: "Invalid trending parameters" });
        return;
    }

    (req as any).userParams = parseResult.data;
    next();
}

export function validateStatusParams(req: Request, res: Response, next: NextFunction): void {
    const parseResult = StatusParamsSchema.safeParse({
        forceRefresh: req.query?.forceRefresh,
    });

    if (!parseResult.success) {
        res.status(400).json({ error: "Invalid trending parameters" });
        return;
    }

    (req as any).userParams = parseResult.data;
    next();
}
