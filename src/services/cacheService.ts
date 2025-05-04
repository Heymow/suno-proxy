import redisClient from '../redisClient.js';

const DEFAULT_EXPIRY = Number(process.env.CACHE_EXPIRY_TIME_MINUTES) * 60 || 60 * 60; // seconds

export async function getCachedItem<T>(type: string, id: string, forceRefresh = false): Promise<T | null> {
    if (!id) return null;
    if (forceRefresh) return null;
    const key = `${type}:${id}`;
    const cached = await redisClient.get(key);
    if (!cached) return null;
    try {
        return JSON.parse(cached) as T;
    } catch {
        return null;
    }
}

export async function setCachedItem<T>(type: string, id: string, data: T, expiry: number = DEFAULT_EXPIRY): Promise<void> {
    if (!id || !data) return;
    const key = `${type}:${id}`;
    await redisClient.set(key, JSON.stringify(data), { EX: expiry });
}

// Helpers pour playlist (optionnel, pour compatibilité)
export async function getCachedPlaylistInfo(id: string, forceRefresh = false) {
    return getCachedItem('playlist', id, forceRefresh);
}
export async function setCachePlaylistInfo(id: string, data: any, expiry?: number) {
    return setCachedItem('playlist', id, data, expiry);
}