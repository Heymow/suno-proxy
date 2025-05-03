type CacheKey = string;

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const CACHE_EXPIRY_TIME = 60 * 60 * 1000;
const MAX_CACHE_SIZE = 1000;

const caches: Record<string, Record<CacheKey, CacheEntry<any>>> = {};

function getCache<T>(type: string): Record<CacheKey, CacheEntry<T>> {
    if (!caches[type]) caches[type] = {};
    return caches[type];
}

function cleanExpiredCache<T>(type: string) {
    const cache = getCache<T>(type);
    for (const key in cache) {
        if (cache[key].timestamp + CACHE_EXPIRY_TIME < Date.now()) {
            delete cache[key];
        }
    }
}

function cleanOldCache<T>(type: string) {
    const cache = getCache<T>(type);
    const sortedKeys = Object.keys(cache).sort((a, b) => cache[a].timestamp - cache[b].timestamp);
    if (sortedKeys.length === 0) return;
    delete cache[sortedKeys[0]];
}

export function getCachedItem<T>(type: string, id: string, forceRefresh = false): T | null {
    const cache = getCache<T>(type);
    const entry = cache[id];
    if (!forceRefresh && entry && (Date.now() - entry.timestamp) < CACHE_EXPIRY_TIME) {
        return entry.data;
    }
    return null;
}

export function setCachedItem<T>(type: string, id: string, data: T): void {
    if (!id || !data) return;
    cleanExpiredCache<T>(type);
    const cache = getCache<T>(type);
    if (Object.keys(cache).length >= MAX_CACHE_SIZE) {
        cleanOldCache<T>(type);
    }
    cache[id] = { data, timestamp: Date.now() };
}