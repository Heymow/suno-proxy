import { Playlist } from "@/schemas/playlistSchema";

interface CacheEntry {
    data: Playlist;
    timestamp: number;
}

const userCache: { [key: string]: CacheEntry } = {};
const CACHE_EXPIRY_TIME = 60 * 60 * 1000;
const MAX_CACHE_SIZE = 1000;

export async function getCachedPlaylistInfo(handle: string, forceRefresh = false): Promise<Playlist | null> {
    const entry = userCache[handle];
    if (!forceRefresh && entry && (Date.now() - entry.timestamp) < CACHE_EXPIRY_TIME) {
        console.log(`Cache hit for user: ${handle}`);
        return entry.data;
    }
    console.log(`Cache miss${forceRefresh ? ' (forced)' : ''} for playlist: ${handle}`);
    return null;
}

export function setCachePlaylistInfo(handle: string, data: Playlist): void {
    if (Object.keys(userCache).length >= MAX_CACHE_SIZE) {
        cleanOldCache();
    }
    userCache[handle] = { data, timestamp: Date.now() };
    console.log(`Cache set for playlist: ${handle}`);
}

function cleanOldCache(): void {
    const sortedKeys = Object.keys(userCache).sort((a, b) => userCache[a].timestamp - userCache[b].timestamp);
    const oldestKey = sortedKeys[0];
    delete userCache[oldestKey];
    console.log(`Cache cleaned, removed user: ${oldestKey}`);
}
