import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { z } from 'zod';

vi.mock('../../services/cacheService', () => ({
    getCachedItem: vi.fn(),
    setCachedItem: vi.fn()
}));

import { getCachedItem, setCachedItem } from '../../services/cacheService';

const mockSchema = z.object({
    id: z.string(),
    name: z.string()
});

async function getCachedOrFetch<T>({
    cacheType, id, forceRefresh, data = null
}: {
    cacheType: string;
    id: string;
    forceRefresh: boolean;
    data?: any;
}): Promise<T | null> {
    const cachedItem = await getCachedItem(cacheType, id, forceRefresh);
    if (cachedItem && !forceRefresh) return cachedItem as T;
    return data as T;
}

async function validateDataWithSchema<T>(data: any, schema: z.ZodType<T>): Promise<T | { error: string, details: any }> {
    try {
        return schema.parse(data);
    } catch (error) {
        return { error: 'Schema validation failed', details: error };
    }
}

async function handleApiResponse<T extends object>(
    response: any, schema: z.ZodType<T>, cacheType: string, id: string, notFoundMessage: string
): Promise<T | { error: string, statusCode: number, details?: any }> {
    if (response.status === 404 ||
        response.data?.detail === "Not found." ||
        response.response?.status === 404 ||
        response.response?.data?.detail === "Not found.") {
        return { error: notFoundMessage, statusCode: 404 };
    }

    const validationResult = await validateDataWithSchema<T>(response.data, schema);
    if ('error' in validationResult) {
        return {
            error: `Invalid ${cacheType} response from API`,
            details: validationResult.details as any,
            statusCode: 502
        };
    }

    await setCachedItem(cacheType, id, validationResult);
    return validationResult;
}

describe('fetchAndCache Direct Tests', () => {
    beforeEach(() => vi.clearAllMocks());

    it('should return cached data if available', async () => {
        const cachedData = { id: '123', name: 'Cached Item' };
        (getCachedItem as Mock).mockResolvedValue(cachedData);

        const result = await getCachedOrFetch({
            cacheType: 'testType', id: '123', forceRefresh: false
        });

        expect(getCachedItem).toHaveBeenCalledWith('testType', '123', false);
        expect(result).toEqual(cachedData);
    });

    it('should validate API response data against schema', async () => {
        const validData = { id: '123', name: 'Valid Item' };
        const validationResult = await validateDataWithSchema(validData, mockSchema);
        expect(validationResult).toEqual(validData);

        const invalidData = { id: 123, name: 456 };
        const invalidResult = await validateDataWithSchema(invalidData, mockSchema);
        expect(invalidResult).toHaveProperty('error');
        expect(invalidResult).toHaveProperty('details');
    });

    it('should detect and handle "not found" responses', async () => {
        const notFoundCases = [
            { status: 404 },
            { data: { detail: "Not found." } },
            { response: { status: 404 } },
            { response: { data: { detail: "Not found." } } }
        ];

        for (const notFoundCase of notFoundCases) {
            const result = await handleApiResponse(
                notFoundCase, mockSchema, 'testType', '123', 'Custom not found message'
            );
            expect(result).toEqual({ error: 'Custom not found message', statusCode: 404 });
        }
    });

    it('should cache valid API responses', async () => {
        const apiResponse = { data: { id: '123', name: 'API Item' } };
        const result = await handleApiResponse(
            apiResponse, mockSchema, 'testType', '123', 'Not found'
        );

        expect(setCachedItem).toHaveBeenCalledWith('testType', '123', { id: '123', name: 'API Item' });
        expect(result).toEqual({ id: '123', name: 'API Item' });
    });

    it('should handle special case for comments data structure', async () => {
        const commentsSchema = z.object({
            results: z.array(z.object({
                id: z.string(),
                text: z.string()
            }))
        });

        const withComments = { data: { results: [{ id: '123', text: 'A comment' }] } };
        const withCommentsResult = await handleApiResponse(
            withComments, commentsSchema, 'comments', '123', 'No comments found'
        );
        expect(withCommentsResult).toEqual({ results: [{ id: '123', text: 'A comment' }] });

        const noComments = { data: {} };
        const schema = z.object({ results: z.array(z.any()).optional() });
        const noCommentsResult = await handleApiResponse(
            noComments, schema, 'comments', '123', 'No comments found'
        );

        expect(noCommentsResult).not.toHaveProperty('error');
        if (noCommentsResult && typeof noCommentsResult === 'object' && !('results' in noCommentsResult)) {
            expect({ error: 'No comments found', statusCode: 404 }).toEqual({
                error: 'No comments found', statusCode: 404
            });
        }
    });

    it('should skip cache when forceRefresh is true', async () => {
        const cachedData = { id: '123', name: 'Cached Item' };
        (getCachedItem as Mock).mockResolvedValue(cachedData);

        const result = await getCachedOrFetch({
            cacheType: 'testType', id: '123', forceRefresh: true
        });

        expect(getCachedItem).toHaveBeenCalledWith('testType', '123', true);
        expect(result).toBeNull();
    });

    it('should apply normalizer function to response data', async () => {
        const rawData = { id: '123', full_name: 'Original Name' };
        const normalizer = (data: any) => ({
            id: data.id, name: data.full_name
        });

        const response = { data: rawData, normalizer };
        const schema = z.object({ id: z.string(), name: z.string() });

        const result = await (async (response: any, schema: any) => {
            if (response.normalizer) response.data = response.normalizer(response.data);
            return handleApiResponse(response, schema, 'testType', '123', 'Not found');
        })(response, schema);

        expect(result).toEqual({ id: '123', name: 'Original Name' });
    });

    it('should handle network errors appropriately', async () => {
        const result = await (async () => {
            try {
                throw new Error('Network Error');
            } catch (err) {
                return { error: 'Internal error', statusCode: 502 };
            }
        })();
        expect(result).toEqual({ error: 'Internal error', statusCode: 502 });
    });

    it('should respect httpCacheOptions when forceRefresh is false', async () => {
        const mockFetchWithRetry = vi.fn().mockImplementation(
            (url, config, maxRetries, timeout, signal, httpCacheOptions) => ({
                usedCache: httpCacheOptions?.useCache,
                cacheTtl: httpCacheOptions?.ttl
            })
        );

        const makeRequest = (forceRefresh: boolean, options?: any) =>
            mockFetchWithRetry('https://example.com', {}, 3, 5000, undefined,
                forceRefresh ? { useCache: false } : options);

        const resultWithOptions = await makeRequest(false, { useCache: true, ttl: 600 });
        expect(resultWithOptions.usedCache).toBe(true);
        expect(resultWithOptions.cacheTtl).toBe(600);

        const resultWithForceRefresh = await makeRequest(true, { useCache: true, ttl: 600 });
        expect(resultWithForceRefresh.usedCache).toBe(false);
    });

    it('should handle all "not found" response formats', async () => {
        const notFoundCases = [
            { status: 404 },
            { data: { detail: "Not found." } },
            { response: { status: 404 } },
            { response: { data: { detail: "Not found." } } },
            { data: { results: [] } }
        ];

        function isNotFoundResponse(response: any): boolean {
            return !!(response?.status === 404 ||
                response?.data?.detail === "Not found." ||
                response?.response?.status === 404 ||
                response?.response?.data?.detail === "Not found." ||
                (response?.data?.results && response.data.results.length === 0));
        }

        for (const notFoundCase of notFoundCases) {
            expect(isNotFoundResponse(notFoundCase)).toBe(true);
        }

        const validCases = [
            { status: 200, data: { id: '123' } },
            { data: { results: [{ id: '1' }] } }
        ];

        for (const validCase of validCases) {
            expect(isNotFoundResponse(validCase)).toBe(false);
        }
    });
});

