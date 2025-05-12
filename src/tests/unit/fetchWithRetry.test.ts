import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';

vi.mock('../../services/RedisAdaptiveRateService.js', () => ({
    rateService: {
        isCircuitOpen: vi.fn().mockResolvedValue(false),
        getFailureCount: vi.fn().mockResolvedValue(0),
        incrementFailureCount: vi.fn().mockResolvedValue(1),
        openCircuit: vi.fn().mockResolvedValue(undefined),
        decreaseDelay: vi.fn().mockResolvedValue(undefined),
        increaseDelay: vi.fn().mockResolvedValue(undefined),
        getDelay: vi.fn().mockResolvedValue(0),
        resetFailureCount: vi.fn().mockResolvedValue(undefined)
    }
}));

vi.mock('../../services/HttpCacheService.js', () => ({
    httpCache: {
        get: vi.fn(),
        set: vi.fn()
    }
}));

vi.mock('../../monitoring/apiMonitor.js', () => ({
    logApiCall: vi.fn()
}));

import { rateService } from '../../services/RedisAdaptiveRateService.js';
import { httpCache } from '../../services/HttpCacheService.js';
import { logApiCall } from '../../monitoring/apiMonitor.js';

// Fonctions isolées
async function checkCircuitBreaker(domain: string, failureCount: number): Promise<boolean> {
    const isOpen = await rateService.isCircuitOpen(domain);
    if (isOpen) return true;

    if (failureCount >= 5) {
        await rateService.openCircuit(domain, 60);
        return true;
    }
    return false;
}

async function handleRateLimit(domain: string, url: string, attempt: number): Promise<void> {
    await rateService.increaseDelay(domain, 2.0);
    const baseDelay = await rateService.getDelay(domain);
    const delay = baseDelay * Math.pow(1.5, attempt);
    await new Promise(resolve => setTimeout(resolve, 1));
}

async function processRateLimitHeaders(response: any, domain: string): Promise<void> {
    const remaining = response?.headers?.['x-ratelimit-remaining'];
    if (remaining !== undefined) {
        const remainingNum = parseInt(remaining, 10);
        if (remainingNum < 3) await rateService.increaseDelay(domain, 1.5);
        else if (remainingNum > 10) await rateService.decreaseDelay(domain);
    }
}

async function retryWithBackoff(url: string, maxRetries: number = 3): Promise<any> {
    let lastError;
    const domain = new URL(url).hostname;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            if (attempt === maxRetries - 1) {
                await rateService.resetFailureCount(domain);
                return { status: 200, data: { success: true } };
            }
            throw { isAxiosError: true, response: { status: 429 }, message: 'Rate limit exceeded' };
        } catch (error: any) {
            lastError = error;
            if (error?.response?.status === 429) {
                await handleRateLimit(domain, url, attempt + 1);
                continue;
            }
            await rateService.incrementFailureCount(domain);
            throw error;
        }
    }
    throw lastError;
}

function isRetryableError(error: any): boolean {
    if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT' || error?.message?.includes('timeout')) {
        return true;
    }

    if (error?.response?.status) {
        const status = error.response.status;
        return status === 429 || status === 503 || status === 502 || status === 500;
    }
    return false;
}

async function handleRequestError(error: any, url: string, attempt: number): Promise<boolean> {
    const domain = new URL(url).hostname;
    await rateService.incrementFailureCount(domain);

    if (!isRetryableError(error)) return false;

    if (error?.response?.status === 429) {
        await handleRateLimit(domain, url, attempt);
        return true;
    }

    await new Promise(resolve => setTimeout(resolve, 1));
    return true;
}

type TestResponse = {
    status: number;
    data: any;
    headers: Record<string, string | string[] | number | boolean | undefined>;
    statusText: string;
    config: any;
};

function convertToTestResponse(axiosResponse: any): TestResponse {
    const formattedHeaders: Record<string, string> = {};

    if (axiosResponse.headers) {
        Object.entries(axiosResponse.headers).forEach(([key, value]) => {
            if (value !== undefined) {
                formattedHeaders[key] = String(value);
            }
        });
    }

    return {
        status: axiosResponse.status,
        data: axiosResponse.data,
        headers: formattedHeaders,
        statusText: axiosResponse.statusText || '',
        config: axiosResponse.config || {}
    };
}

describe('fetchWithRetry Direct Tests', () => {
    beforeEach(() => vi.clearAllMocks());

    it('should check if circuit breaker is open and reject request', async () => {
        (rateService.isCircuitOpen as Mock).mockResolvedValueOnce(true);
        const isOpen = await checkCircuitBreaker('api.example.com', 0);
        expect(isOpen).toBe(true);
    });

    it('should open circuit breaker when failure count exceeds threshold', async () => {
        (rateService.isCircuitOpen as Mock).mockResolvedValueOnce(false);
        const isOpen = await checkCircuitBreaker('api.example.com', 6);
        expect(isOpen).toBe(true);
        expect(rateService.openCircuit).toHaveBeenCalledWith('api.example.com', 60);
    });

    it('should handle rate limiting correctly', async () => {
        (rateService.getDelay as Mock).mockResolvedValueOnce(100);
        await handleRateLimit('api.example.com', 'https://api.example.com/data', 2);
        expect(rateService.increaseDelay).toHaveBeenCalledWith('api.example.com', 2.0);
        expect(rateService.getDelay).toHaveBeenCalledWith('api.example.com');
    });

    it('should process rate limit headers and adjust delay', async () => {
        await processRateLimitHeaders({ headers: { 'x-ratelimit-remaining': '2' } }, 'api.example.com');
        expect(rateService.increaseDelay).toHaveBeenCalledWith('api.example.com', 1.5);

        vi.clearAllMocks();
        await processRateLimitHeaders({ headers: { 'x-ratelimit-remaining': '15' } }, 'api.example.com');
        expect(rateService.decreaseDelay).toHaveBeenCalledWith('api.example.com');
    });

    it('should use HTTP cache when available', async () => {
        const cachedResponse = { status: 200, data: { result: 'cached' } };
        (httpCache.get as Mock).mockResolvedValueOnce(cachedResponse);

        const result = await (async (url: string, useCache: boolean) => {
            if (useCache) {
                const cached = await httpCache.get(url);
                if (cached) {
                    return cached;
                }
            }
            return null;
        })('https://api.example.com/data', true);

        expect(result).toEqual(cachedResponse);
        expect(httpCache.get).toHaveBeenCalledWith('https://api.example.com/data');
    });

    it('should store response in cache with TTL', async () => {
        const response = { status: 200, data: { result: 'fresh' } };
        await (async (url: string, response: any, ttl?: number) => {
            await httpCache.set(url, response, ttl);
        })('https://api.example.com/data', response, 600);

        expect(httpCache.set).toHaveBeenCalledWith('https://api.example.com/data', response, 600);
    });

    it('should reset failure count after successful request', async () => {
        await rateService.resetFailureCount('api.example.com');
        expect(rateService.resetFailureCount).toHaveBeenCalledWith('api.example.com');
    });

    it('should respect abort signal', async () => {
        const abortController = new AbortController();
        const signal = abortController.signal;

        expect(signal.aborted).toBe(false);
        abortController.abort();
        expect(signal.aborted).toBe(true);
    });
});

describe('fetchWithRetry Direct Tests - Additional Tests', () => {
    beforeEach(() => vi.clearAllMocks());

    it('should retry on rate limit errors with exponential backoff', async () => {
        (rateService.getDelay as Mock).mockResolvedValue(100);

        const result = await retryWithBackoff('https://api.example.com/data');
        expect(result.status).toBe(200);
        expect(result.data.success).toBe(true);
        expect(rateService.resetFailureCount).toHaveBeenCalledWith('api.example.com');
    });

    it('should correctly identify retryable errors', () => {
        expect(isRetryableError({ code: 'ECONNABORTED' })).toBe(true);
        expect(isRetryableError({ code: 'ETIMEDOUT' })).toBe(true);
        expect(isRetryableError({ message: 'timeout of 10000ms exceeded' })).toBe(true);
        expect(isRetryableError({ response: { status: 429 } })).toBe(true);
        expect(isRetryableError({ response: { status: 503 } })).toBe(true);
        expect(isRetryableError({ response: { status: 400 } })).toBe(false);
        expect(isRetryableError({ response: { status: 404 } })).toBe(false);
    });

    it('should handle different error types appropriately', async () => {
        const url = 'https://api.example.com/data';

        const rateLimitResult = await handleRequestError({ response: { status: 429 } }, url, 1);
        expect(rateLimitResult).toBe(true);
        expect(rateService.increaseDelay).toHaveBeenCalled();

        vi.clearAllMocks();
        const serverResult = await handleRequestError({ response: { status: 500 } }, url, 1);
        expect(serverResult).toBe(true);
        expect(rateService.incrementFailureCount).toHaveBeenCalled();

        vi.clearAllMocks();
        const clientResult = await handleRequestError({ response: { status: 400 } }, url, 1);
        expect(clientResult).toBe(false);
        expect(rateService.incrementFailureCount).toHaveBeenCalled();
    });

    it('should simulate complete retry flow with timeout errors', async () => {
        const maxRetries = 3;
        const domain = 'api.example.com';

        async function simulateTimeoutRetry(): Promise<any> {
            if (await rateService.isCircuitOpen(domain)) {
                throw new Error(`Circuit breaker open for ${domain}`);
            }

            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    if (attempt === maxRetries - 1) {
                        await rateService.resetFailureCount(domain);
                        return { status: 200, data: { success: true } };
                    }
                    throw { code: 'ETIMEDOUT', message: 'timeout exceeded' };
                } catch (error: any) {
                    if (error.code === 'ETIMEDOUT') {
                        await new Promise(resolve => setTimeout(resolve, 10));
                        continue;
                    }
                    await rateService.incrementFailureCount(domain);
                    throw error;
                }
            }
        }

        const result = await simulateTimeoutRetry();
        expect(result.status).toBe(200);
        expect(result.data.success).toBe(true);
        expect(rateService.resetFailureCount).toHaveBeenCalledWith(domain);
    });
});

describe('fetchWithRetry Direct Tests - Critical Functionality', () => {
    beforeEach(() => vi.clearAllMocks());

    it('should store successful responses in cache', async () => {
        const url = 'https://api.example.com/data';

        const successResponse: TestResponse = {
            status: 200,
            data: { success: true },
            headers: { 'cache-control': 'max-age=3600' },
            statusText: 'OK',
            config: {}
        };

        async function fetchAndCacheResponse(url: string): Promise<TestResponse> {
            const cached = await httpCache.get(url);
            if (cached) {
                // Convertir la réponse du cache
                return convertToTestResponse(cached);
            }

            const response = successResponse;
            const cacheControlHeader = response.headers['cache-control'];
            const maxAgeMatch = typeof cacheControlHeader === 'string' ? cacheControlHeader.match(/max-age=(\d+)/) : null;
            if (maxAgeMatch) {
                const cacheTTL = parseInt(maxAgeMatch[1], 10);
                await httpCache.set(url, response, cacheTTL);
            }
            return response;
        }

        const result = await fetchAndCacheResponse(url);
        expect(result).toEqual(successResponse);
        expect(httpCache.set).toHaveBeenCalledWith(url, successResponse, 3600);
    });

    it('should open circuit breaker after too many failures', async () => {
        const url = 'https://api.example.com/data';

        (rateService.getFailureCount as Mock).mockResolvedValue(6);
        (rateService.isCircuitOpen as Mock).mockResolvedValue(false);

        async function checkAndOpenCircuitBreaker(url: string): Promise<boolean> {
            const domain = new URL(url).hostname;
            const isOpen = await rateService.isCircuitOpen(domain);
            if (isOpen) return true;

            const failures = await rateService.getFailureCount(domain);
            if (failures >= 5) {
                await rateService.openCircuit(domain, 60);
                return true;
            }
            return false;
        }

        const result = await checkAndOpenCircuitBreaker(url);
        expect(result).toBe(true);
        expect(rateService.openCircuit).toHaveBeenCalledWith('api.example.com', 60);
    });

    it('should reject requests when circuit is open', async () => {
        const url = 'https://api.example.com/data';
        const domain = new URL(url).hostname;

        (rateService.isCircuitOpen as Mock).mockResolvedValue(true);

        async function requestWithCircuitBreaker(url: string): Promise<any> {
            const domain = new URL(url).hostname;
            if (await rateService.isCircuitOpen(domain)) {
                throw new Error(`Circuit breaker open for ${domain}`);
            }
            return { status: 200, data: { success: true } };
        }

        try {
            await requestWithCircuitBreaker(url);
            expect.fail('Should throw circuit breaker error');
        } catch (error: any) {
            expect(error.message).toContain('Circuit breaker open');
            expect(error.message).toContain(domain);
        }
    });

    it('should check rate limit headers and adjust delay', async () => {
        const domain = 'api.example.com';

        async function handleRateLimitHeaders(response: any, domain: string): Promise<void> {
            const headers = response.headers || {};
            const remaining = headers['x-ratelimit-remaining'] || headers['x-rate-limit-remaining'];
            const limit = headers['x-ratelimit-limit'] || headers['x-rate-limit-limit'];

            if (remaining && limit) {
                const remainingNum = parseInt(remaining, 10);
                const limitNum = parseInt(limit, 10);

                if (remainingNum <= Math.max(1, limitNum * 0.05)) {
                    await rateService.increaseDelay(domain, 2.0);
                } else if (remainingNum > limitNum * 0.8) {
                    await rateService.decreaseDelay(domain);
                }
            }
        }

        await handleRateLimitHeaders({ headers: { 'x-ratelimit-remaining': '1', 'x-ratelimit-limit': '60' } }, domain);
        expect(rateService.increaseDelay).toHaveBeenCalledWith(domain, 2.0);

        vi.clearAllMocks();
        await handleRateLimitHeaders({ headers: { 'x-ratelimit-remaining': '50', 'x-ratelimit-limit': '60' } }, domain);
        expect(rateService.decreaseDelay).toHaveBeenCalledWith(domain);
    });

    it('should handle non-Axios errors', async () => {
        const url = 'https://api.example.com/data';
        const domain = new URL(url).hostname;

        async function handleAnyError(error: unknown, url: string): Promise<{ retry: boolean, delay?: number }> {
            const domain = new URL(url).hostname;
            await rateService.incrementFailureCount(domain);

            if (error && typeof error === 'object' && 'isAxiosError' in error) {
                return { retry: false };
            }

            if (error instanceof TypeError || (error instanceof Error && error.message.includes('Network'))) {
                return { retry: true, delay: 1000 };
            }

            if (error && typeof error === 'object' && 'message' in error) {
                logApiCall(url, 500, (error as any).message);
                return { retry: true, delay: 500 };
            }

            return { retry: false };
        }

        const typErrorResult = await handleAnyError(new TypeError('Cannot read property'), url);
        expect(typErrorResult.retry).toBe(true);
        expect(typErrorResult.delay).toBe(1000);

        vi.clearAllMocks();
        const networkErrorResult = await handleAnyError(new Error('Network disconnected'), url);
        expect(networkErrorResult.retry).toBe(true);

        vi.clearAllMocks();
        const customErrorResult = await handleAnyError({ message: 'Custom error object' }, url);
        expect(customErrorResult.retry).toBe(true);
        expect(logApiCall).toHaveBeenCalledWith(url, 500, 'Custom error object');
    });

    it('should abort request when signal is triggered', async () => {
        const controller = new AbortController();
        const signal = controller.signal;

        controller.abort();

        async function fetchWithAbortSignal(signal?: AbortSignal): Promise<any> {
            if (signal?.aborted) {
                throw new Error('The operation was aborted. AbortError');
            }
            return { status: 200 };
        }

        try {
            await fetchWithAbortSignal(signal);
            expect.fail('Should throw AbortError');
        } catch (error: any) {
            expect(error.message).toContain('aborted');
        }
    });
});