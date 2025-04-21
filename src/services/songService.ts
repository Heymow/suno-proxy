interface CacheEntry {
    handle: string;
    timestamp: number;
}

const songCache: { [key: string]: { handle: any, timestamp: number } } = {};
const CACHE_EXPIRY_TIME = 60 * 60 * 1000;
const MAX_CACHE_SIZE = 1000;

export async function getCachedSongInfo(songId: string): Promise<any | null> {
    if (songCache[songId] && (Date.now() - songCache[songId].timestamp) < CACHE_EXPIRY_TIME) {
        console.log(`Cache hit for song: ${songId}`);
        return songCache[songId].handle;
    }
    console.log(`Cache miss for song: ${songId}`);
    return null;
}


export function setCachesongInfo(handle: string, songId: any) {
    if (Object.keys(songCache).length >= MAX_CACHE_SIZE) {
        cleanOldCache();
    }
    songCache[handle] = { handle, timestamp: Date.now() };
    console.log(`Cache set for song: ${songId}`);
}


function cleanOldCache() {
    const sortedKeys = Object.keys(songCache).sort((a, b) => songCache[a].timestamp - songCache[b].timestamp);
    const oldestKey = sortedKeys[0];
    delete songCache[oldestKey];
    console.log(`Cache cleaned, removed song: ${oldestKey}`);
}

// async function getHandleFromSongPage(songId: string): Promise<string> {
//     const url = `https://suno.com/song/${songId}`;
//     let browser;
//     let handle: string = '';

//     try {
//         browser = await playwright.chromium.launch({ headless: true });
//         const context = await browser.newContext({
//             userAgent: process.env.USER_AGENT
//         });
//         const page = await context.newPage();

//         await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 1500 });

//         const response = await page.waitForResponse(response => response.url().includes('/api/profiles/') && response.status() === 200, { timeout: 5000 });

//         const data = await response.json();
//         const clip = data.clips.find((c: { id: string }) => c.id === songId);

//         if (!clip) {
//             console.log('Song not found in network response');
//             throw new Error('Song not found');
//         }

//         handle = clip.handle;

//     } catch (error) {
//         console.error('Error while fetching handle for songId:', songId, error);
//         throw error;
//     } finally {
//         if (browser) {
//             await browser.close();
//         }
//     }

//     return handle;
// }
