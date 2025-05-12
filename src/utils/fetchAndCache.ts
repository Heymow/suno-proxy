import { z } from 'zod';
import { fetchWithRetry } from './fetchWithRetry.js';
import { getCachedItem, setCachedItem } from '../services/cacheService.js';

const userAgent = process.env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3';

function isNotFound(responseOrError: any): boolean {
    // S'assurer que l'objet existe avant de vérifier ses propriétés
    if (!responseOrError) return false;

    return !!(
        responseOrError.status === 404 ||
        responseOrError?.data?.detail === "Not found." ||
        responseOrError?.response?.status === 404 ||
        responseOrError?.response?.data?.detail === "Not found." ||
        // Cas supplémentaire pour les résultats vides
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
            // Log l'erreur mais continue le traitement
            console.error(`Network error in fetchWithRetry: ${logPrefix}`, fetchError);

            // Si l'erreur contient des informations de réponse HTTP, on vérifie si c'est un "not found"
            if (isNotFound(fetchError)) {
                return { error: notFoundMessage, statusCode: 404 };
            }

            // Sinon, c'est une erreur réseau générique
            throw fetchError; // Re-throw pour être géré par le bloc catch externe
        }

        // Vérifier si la réponse existe
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

        // Vérifier si c'est une erreur "not found"
        if (isNotFound(err)) {
            return { error: notFoundMessage, statusCode: 404 };
        }

        // Pour toute autre erreur
        return { error: 'Internal error', statusCode: 502 };
    }
}