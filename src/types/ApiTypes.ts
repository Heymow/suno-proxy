export type ApiStats = {
    success: number;
    errors: number;
    timeouts: number;
    rateLimits: number;
    total: number;
    perStatus: Record<number, number>;
    perEndpoint: Record<string, number>;
    lastErrors: { url: string; status: number; message?: string; timestamp: number }[];
};

export type TimelinePoint = {
    timestamp: number;
    total: number;
    errors: number;
    timeouts: number;
    rateLimits: number;
};