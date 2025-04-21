interface CacheEntry {
    handle: string;
    timestamp: number;
}

const userCache: { [key: string]: { data: any, timestamp: number } } = {};
const CACHE_EXPIRY_TIME = 60 * 60 * 1000;
const MAX_CACHE_SIZE = 1000;

export async function getCachedUserInfo(handle: string): Promise<any | null> {
    if (userCache[handle] && (Date.now() - userCache[handle].timestamp) < CACHE_EXPIRY_TIME) {
        console.log(`Cache hit for user: ${handle}`);
        return userCache[handle].data;
    }
    console.log(`Cache miss for user: ${handle}`);
    return null;
}


export function setCacheUserInfo(handle: string, data: any) {
    if (Object.keys(userCache).length >= MAX_CACHE_SIZE) {
        cleanOldCache();
    }
    userCache[handle] = { data, timestamp: Date.now() };
    console.log(`Cache set for user: ${handle}`);
}


function cleanOldCache() {
    const sortedKeys = Object.keys(userCache).sort((a, b) => userCache[a].timestamp - userCache[b].timestamp);
    const oldestKey = sortedKeys[0];
    delete userCache[oldestKey];
    console.log(`Cache cleaned, removed user: ${oldestKey}`);
}