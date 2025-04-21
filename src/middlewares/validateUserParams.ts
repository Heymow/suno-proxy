import { z } from "zod";
import { Request, Response, NextFunction } from "express";

const userParamsSchema = z.object({
    handle: z.string().min(1),
    forceRefresh: z
        .string()
        .optional()
        .transform((val) => val === "true"),
});

export function validateUserParams(req: Request, res: Response, next: NextFunction): void {
    const parseResult = userParamsSchema.safeParse({
        handle: req.params.handle,
        forceRefresh: req.query.forceRefresh,
    });

    if (!parseResult.success) {
        res.status(400).json({ error: "Invalid user parameters" });
    }

    (req as any).userParams = parseResult.data;
    next();
}
