import { describe, it, expect, vi, type Mock } from 'vitest';
import { fetchAndCache } from '../../utils/fetchAndCache';
import { z } from 'zod';
import { getCachedItem, setCachedItem } from '../../services/cacheService';
import { fetchWithRetry } from '../../utils/fetchWithRetry';

vi.mock('../../services/cacheService', () => ({
    getCachedItem: vi.fn(),
    setCachedItem: vi.fn(),
}));

vi.mock('../../utils/fetchWithRetry', () => ({
    fetchWithRetry: vi.fn(),
}));

const mockSchema = z.object({
    id: z.string(),
    name: z.string(),
});

describe('fetchAndCache', () => {
    const params = {
        cacheType: 'testType',
        id: '123',
        forceRefresh: false,
        url: 'https://api.example.com/resource',
        schema: mockSchema,
        notFoundMessage: 'Resource not found',
        logPrefix: '[Test]',
        method: 'GET' as const,
        headers: { Authorization: 'Bearer token' },
    };

    it('should return cached data if available', async () => {
        const cachedData = { id: '123', name: 'Cached Item' };
        (getCachedItem as Mock).mockResolvedValue(cachedData);

        const result = await fetchAndCache(params);

        expect(getCachedItem).toHaveBeenCalledWith('testType', '123', false);
        expect(result).toEqual(cachedData);
    });

    it('should fetch data if not cached and cache it', async () => {
        const apiResponse = { data: { id: '123', name: 'Fetched Item' } };
        (getCachedItem as Mock).mockResolvedValue(null);
        (fetchWithRetry as Mock).mockResolvedValue(apiResponse);

        const result = await fetchAndCache(params);

        expect(fetchWithRetry).toHaveBeenCalledWith(
            'https://api.example.com/resource',
            {
                method: 'GET',
                headers: { Authorization: 'Bearer token' },
            },
            undefined,
            undefined
        );
        expect(setCachedItem).toHaveBeenCalledWith('testType', '123', apiResponse.data);
        expect(result).toEqual(apiResponse.data);
    });

    it('should return an error if the API response is invalid', async () => {
        const invalidApiResponse = { data: { id: 123, name: 456 } };
        (getCachedItem as Mock).mockResolvedValue(null);
        (fetchWithRetry as Mock).mockResolvedValue(invalidApiResponse);

        const result = await fetchAndCache(params);

        expect(result).toEqual({
            error: 'Invalid testType response from API',
            details: expect.any(Object),
            statusCode: 502,
        });
    });

    it('should return a 404 error if the resource is not found', async () => {
        const notFoundResponse = { status: 404 };
        (getCachedItem as Mock).mockResolvedValue(null);
        (fetchWithRetry as Mock).mockResolvedValue(notFoundResponse);

        const result = await fetchAndCache(params);

        expect(result).toEqual({ error: 'Resource not found', statusCode: 404 });
    });

    it('should handle errors during fetch and return a 502 error', async () => {
        const error = new Error('Network error');
        (getCachedItem as Mock).mockResolvedValue(null);
        (fetchWithRetry as Mock).mockRejectedValue(error);

        const result = await fetchAndCache(params);

        expect(result).toEqual({ error: 'Internal error', statusCode: 502 });
    });
});