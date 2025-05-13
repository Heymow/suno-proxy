import { AxiosResponse } from 'axios';
import { getRedisClient } from '../redisClient.js';
import { normalizeUrl } from '../utils/normalizeUrl.js';
import crypto from 'crypto';

interface CacheEntry<T> {
    response: AxiosResponse<T>;
    timestamp: number;
}

export interface HttpCacheService {
    get<T>(key: string): Promise<AxiosResponse<T> | null>;
    set<T>(key: string, response: AxiosResponse<T>, ttlSeconds: number): Promise<void>;
    invalidate(domain: string): Promise<void>;
}

export class RedisHttpCacheService implements HttpCacheService {
    private getCacheKey(url: string, body?: any): string {
        const normalizedUrl = normalizeUrl(url);
        let cacheKey = `http_cache:${normalizedUrl}`;

        // Add a hash of the body for POST requests
        if (body) {
            const bodyHash = crypto
                .createHash('md5')
                .update(JSON.stringify(body))
                .digest('hex')
                .substring(0, 10); // 10 chars only to keep it short
            cacheKey += `:${bodyHash}`;
        }

        return cacheKey;
    }

    private getDomainCacheKey(domain: string): string {
        return `http_cache:domain:${domain}:*`;
    }

    private redis() {
        return getRedisClient();
    }

    async get<T>(url: string, params?: Record<string, any>): Promise<AxiosResponse<T> | null> {
        let cacheKey = this.getCacheKey(url);

        if (params) {
            const paramString = Object.entries(params)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([k, v]) => `${k}=${v}`)
                .join('&');
            cacheKey += `:${paramString}`;
        }

        const cached = await this.redis().get(cacheKey);

        if (!cached) {
            return null;
        }

        try {
            const entry: CacheEntry<T> = JSON.parse(cached);
            return entry.response;
        } catch (e) {
            console.error('Error parsing cached response:', e);
            return null;
        }
    }

    async set<T>(url: string, response: AxiosResponse<T>, ttlSeconds: number = 300, body?: any): Promise<void> {
        // Pass the body to getCacheKey to create a unique key
        const cacheKey = this.getCacheKey(url, body);

        // Don't cache error responses
        if (response.status >= 400) {
            return;
        }

        // Extract cache-control headers if present
        const cacheControl = response.headers['cache-control'];
        if (cacheControl?.includes('no-store') || cacheControl?.includes('no-cache')) {
            return;
        }

        // Override TTL if max-age is specified
        if (cacheControl) {
            const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
            if (maxAgeMatch && maxAgeMatch[1]) {
                ttlSeconds = parseInt(maxAgeMatch[1], 10);
            }
        }

        const entry: CacheEntry<T> = {
            response,
            timestamp: Date.now()
        };

        await this.redis().set(cacheKey, JSON.stringify(entry), { EX: ttlSeconds });
    }

    async invalidate(domain: string): Promise<void> {
        const pattern = this.getDomainCacheKey(domain);
        const keys = await this.redis().keys(pattern);

        if (keys.length > 0) {
            await this.redis().del(keys);
        }
    }

    async invalidateUrl(url: string): Promise<void> {
        const cacheKey = this.getCacheKey(url);
        await this.redis().del(cacheKey);
    }
}

// Export singleton instance
export const httpCache = new RedisHttpCacheService();