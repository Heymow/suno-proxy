import { z } from 'zod';
import { fetchWithRetry } from './fetchWithRetry.js';
import { getCachedItem, setCachedItem } from '../services/cacheService.js';

const userAgent = process.env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3';

export async function fetchAndCache<T>(
    params: {
        cacheType: string,
        id: string,
        forceRefresh: boolean,
        url: string,
        schema: z.ZodType<T>,
        notFoundMessage: string,
        logPrefix: string,
        method?: 'GET' | 'POST',
        body?: any,
        headers?: Record<string, string>,
    }
): Promise<T | { error: string; details?: any }> {
    const {
        cacheType, id, forceRefresh, url, schema,
        notFoundMessage, logPrefix, method = 'GET', body, headers
    } = params;

    const cached = getCachedItem<T>(cacheType, id, forceRefresh);
    if (cached) {
        console.log(`Returning cached ${cacheType} for id:`, id);
        return cached;
    }

    try {
        let response;
        if (method === 'POST') {
            response = await fetchWithRetry(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "Accept": "*/*",
                    "User-Agent": userAgent,
                    ...(headers || {}),

                },
                data: JSON.stringify(body),
            });
        } else {
            response = await fetchWithRetry(url, {
                method: 'GET',
                headers: {
                    ...(headers || {})
                }
            });
        }

        if (!response.data || (cacheType === 'comments' && !response.data.results)) {
            return { error: notFoundMessage };
        }

        const parseResult = schema.safeParse(response.data);
        if (!parseResult.success) {
            console.error(`Invalid API response:`, parseResult.error.format());
            return { error: `Invalid ${cacheType} response from API`, details: parseResult.error.format() };
        }

        const typedData = parseResult.data;
        setCachedItem<T>(cacheType, id, typedData);
        console.log(`Cached ${cacheType} data for id:`, id);

        return typedData;

    } catch (err) {
        console.error(`Error fetching ${cacheType} data:`, err);
        return { error: 'Internal error' };
    }
}