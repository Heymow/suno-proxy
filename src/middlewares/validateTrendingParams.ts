import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { allowedLists, allowedTimeSpans } from "../controllers/trendingController.js";

const trendingParamsSchema = z.object({
    list: z
        .enum(allowedLists as [string, ...string[]], {
            errorMap: () => ({ message: "Invalid list parameter" }),
        })
        .transform((val) => val.toLowerCase()),
    timeSpan: z.enum(allowedTimeSpans as [string, ...string[]], {
        errorMap: () => ({ message: "Invalid time span parameter" }),
    }),
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
