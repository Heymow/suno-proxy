export interface ApiStats {
    success: number;
    errors: number;
    timeouts: number;
    rateLimits: number;
    total: number;
    perStatus: Record<number, number>;
    perEndpoint: Record<string, number>;
    lastErrors: { url: string; status: number; message?: string; timestamp: number }[];
}

export interface LastError {
    timestamp: number;
    status: number;
    url: string;
    message?: string;
};

export interface RightMenuProps {
    stats: ApiStats | null;
    perStatus: Record<string, number>;
    perEndpoint: Record<string, number>;
    lastErrors: LastError[];
}

export interface ErrorProviderProps {
    children: React.ReactNode;
}

export type Point = {
    timestamp: number
    total: number
    errors: number
    timeouts: number
    rateLimits: number
}

export interface RequestTimelineVisxProps {
    data: Point[];
    width?: number;
    height?: number;
    duration?: number;
}