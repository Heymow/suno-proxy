interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const userCache: Record<string, CacheEntry<any>> = {};
const CACHE_EXPIRY_TIME = 60 * 60 * 1000;
const MAX_CACHE_SIZE = 1000;

export async function getCachedUserInfo<T = any>(handle: string): Promise<T | null> {
    const entry = userCache[handle];
    if (entry && (Date.now() - entry.timestamp) < CACHE_EXPIRY_TIME) {
        console.log(`Cache hit for user: ${handle}`);
        return entry.data;
    }
    console.log(`Cache miss for user: ${handle}`);
    return null;
}

export function setCacheUserInfo<T>(handle: string, data: T): void {
    if (Object.keys(userCache).length >= MAX_CACHE_SIZE) {
        cleanOldCache();
    }
    userCache[handle] = { data, timestamp: Date.now() };
    console.log(`Cache set for user: ${handle}`);
}

function cleanOldCache(): void {
    const sortedKeys = Object.keys(userCache).sort(
        (a, b) => userCache[a].timestamp - userCache[b].timestamp
    );
    const oldestKey = sortedKeys[0];
    delete userCache[oldestKey];
    console.log(`Cache cleaned, removed user: ${oldestKey}`);
}

export async function tryGetFromCache<T>(
    key: string,
    forceRefresh: boolean,
    getter: () => Promise<T>
): Promise<T> {
    if (!forceRefresh) {
        const cached = await getCachedUserInfo<T>(key);
        if (cached) return cached;
    }
    const data = await getter();
    setCacheUserInfo(key, data);
    return data;
}

setInterval(() => {
    const now = Date.now();
    for (const key in userCache) {
        if ((now - userCache[key].timestamp) > CACHE_EXPIRY_TIME) {
            delete userCache[key];
            console.log(`Expired cache removed for user: ${key}`);
        }
    }

}, 60 * 60 * 1000);
