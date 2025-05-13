import { z } from 'zod';
import { fetchWithRetry } from './fetchWithRetry.js';
import { getCachedItem, setCachedItem } from '../services/cacheService.js';

const userAgent = process.env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3';

function isNotFound(responseOrError: any): boolean {
    // Ensure the object exists before checking its properties
    if (!responseOrError) return false;

    return !!(
        responseOrError.status === 404 ||
        responseOrError?.data?.detail === "Not found." ||
        responseOrError?.response?.status === 404 ||
        responseOrError?.response?.data?.detail === "Not found." ||
        // Additional case for empty results
        (responseOrError?.data?.results && Array.isArray(responseOrError.data.results) && responseOrError.data.results.length === 0)
    );
}

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
        maxRetries?: number,
        timeout?: number,
        normalizer?: (data: any) => any,
        signal?: AbortSignal,
        httpCacheOptions?: {
            ttl?: number;
            useCache?: boolean;
        }
    }
): Promise<T | { error: string; details?: any; statusCode?: number }> {
    const {
        cacheType, id, forceRefresh, url, schema,
        notFoundMessage, logPrefix, method = 'GET', body, headers,
        maxRetries, timeout, normalizer,
        signal, httpCacheOptions
    } = params;

    const finalHttpCacheOptions = forceRefresh
        ? { useCache: false }
        : httpCacheOptions;

    const cached = await getCachedItem<T>(cacheType, id, forceRefresh);
    if (cached) {
        console.log(`Returning cached ${cacheType} for id:`, id);
        return cached;
    }

    try {
        let response;
        try {
            if (method === 'POST') {
                response = await fetchWithRetry(
                    url,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            "Accept": "*/*",
                            "User-Agent": userAgent,
                            ...(headers || {}),
                        },
                        data: JSON.stringify(body),
                    },
                    maxRetries,
                    timeout,
                    signal,
                    finalHttpCacheOptions
                );
            } else {
                response = await fetchWithRetry(
                    url,
                    {
                        method: 'GET',
                        headers: {
                            ...(headers || {})
                        }
                    },
                    maxRetries,
                    timeout,
                    signal,
                    finalHttpCacheOptions
                );
            }
        } catch (fetchError) {
            // Log the error but continue processing
            console.error(`Network error in fetchWithRetry: ${logPrefix}`, fetchError);

            // If the error contains HTTP response information, check if it's a "not found"
            if (isNotFound(fetchError)) {
                return { error: notFoundMessage, statusCode: 404 };
            }

            // Otherwise, it's a generic network error
            throw fetchError; // Re-throw to be handled by the outer catch block
        }

        // Check if the response exists
        if (!response) {
            console.error(`Empty response received from API: ${logPrefix}`);
            return { error: 'Empty response from API', statusCode: 502 };
        }

        if (isNotFound(response)) {
            return { error: notFoundMessage, statusCode: 404 };
        }

        let data = response.data;

        if (normalizer) {
            data = normalizer(data);
        }

        if (!data || (cacheType === 'comments' && !data.results)) {
            return { error: notFoundMessage, statusCode: 404 };
        }

        const parseResult = schema.safeParse(data);
        if (!parseResult.success) {
            console.error(`Invalid API response:`, parseResult.error.format());
            return { error: `Invalid ${cacheType} response from API`, details: parseResult.error.format(), statusCode: 502 };
        }

        const typedData = parseResult.data;
        await setCachedItem<T>(cacheType, id, typedData);
        console.log(`Cached ${cacheType} data for id:`, id);

        return typedData;

    } catch (err) {
        console.error(`Error fetching ${cacheType} data:`, err);

        // Check if it's a "not found" error
        if (isNotFound(err)) {
            return { error: notFoundMessage, statusCode: 404 };
        }

        // For any other error
        return { error: 'Internal error', statusCode: 502 };
    }
}