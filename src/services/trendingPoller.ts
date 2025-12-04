import { fetchAndCache } from '../utils/fetchAndCache.js';
import { NewSongsResponseSchema } from '../schemas/newSongsSchema.js';
import { TrendingResponseSchema } from '../schemas/trendingSchema.js';
import {
    recordTrendingEntry,
    recordTrendingExit,
    saveSongSnapshot,
    getActiveTrendingSongs
} from '../models/statsModel.js';
import { TrendingStats } from '../types/statsTypes.js';


const NEW_SONGS_URL = 'https://studio-api.prod.suno.com/api/playlist/new_songs';
const DISCOVER_URL = 'https://studio-api.prod.suno.com/api/discover';

interface TrackedList {
    id: string;
    url: string;
    method?: 'GET' | 'POST';
    body?: any;
    schema: any;
}

const LISTS_TO_TRACK: TrackedList[] = [

    {
        id: 'new_songs',
        url: NEW_SONGS_URL,
        schema: NewSongsResponseSchema
    },
    {
        id: 'global_now',
        url: DISCOVER_URL,
        method: 'POST',
        body: {
            "start_index": 0,
            "page_size": 100, // Fetch more to get a good sample
            "section_name": "trending_songs",
            "section_content": "Global",
            "secondary_section_content": "Now",
            "page": 1,
            "section_size": 100,
            "disable_shuffle": true
        },
        schema: TrendingResponseSchema
    },
    {
        id: 'global_weekly',
        url: DISCOVER_URL,
        method: 'POST',
        body: {
            "start_index": 0,
            "page_size": 100,
            "section_name": "trending_songs",
            "section_content": "Global",
            "secondary_section_content": "Weekly",
            "page": 1,
            "section_size": 100,
            "disable_shuffle": true
        },
        schema: TrendingResponseSchema
    },
    {
        id: 'english_now',
        url: DISCOVER_URL,
        method: 'POST',
        body: {
            "start_index": 0,
            "page_size": 100,
            "section_name": "trending_songs",
            "section_content": "English",
            "secondary_section_content": "Now",
            "page": 1,
            "section_size": 100,
            "disable_shuffle": true
        },
        schema: TrendingResponseSchema
    }
];

export async function pollTrendingLists(): Promise<void> {
    console.log('Starting trending lists poll...');

    for (const list of LISTS_TO_TRACK) {
        try {
            await processList(list);
        } catch (error) {
            console.error(`Error processing list ${list.id}:`, error);
        }
    }

    console.log('Trending lists poll completed.');
}

async function processList(list: TrackedList): Promise<void> {
    // 1. Fetch current list state (force refresh to get latest)
    const result = await fetchAndCache<any>({
        cacheType: 'playlist',
        id: `${list.id}_poller`,
        forceRefresh: true,
        url: list.url,
        schema: list.schema,
        notFoundMessage: 'Playlist not found',
        logPrefix: `poller_${list.id}`,
        method: list.method || 'GET',
        body: list.body,
        httpCacheOptions: { useCache: false }
    });

    if ('error' in result) {
        console.error(`Failed to fetch list ${list.id}: ${result.error}`);
        return;
    }

    // Normalize songs list based on schema type
    let currentSongs: any[] = [];
    if (result.playlist_clips) {
        currentSongs = result.playlist_clips.map((item: any) => item.clip);
    } else if (result.trending_songs) {
        currentSongs = result.trending_songs;
    } else if (result.sections) {
        // Extract songs from sections
        // Usually the songs are in the first section's items
        for (const section of result.sections) {
            if (section.items && section.items.length > 0) {
                currentSongs = [...currentSongs, ...section.items];
            }
        }
    }

    if (!currentSongs || currentSongs.length === 0) {
        console.log(`No songs found for list ${list.id}`);
        // Do not return, continue to process exits
    }

    const currentSongIds = new Set(currentSongs.map(s => s.id));

    // 2. Get previously active songs in this list from DB
    const activeSongIds = await getActiveTrendingSongs(list.id);
    const activeSongIdsSet = new Set(activeSongIds);

    // 3. Detect Entries (In current but not in active)
    for (let i = 0; i < currentSongs.length; i++) {
        const song = currentSongs[i];

        if (!activeSongIdsSet.has(song.id)) {
            // New Entry
            const stats: TrendingStats = {
                play_count: song.play_count ?? 0,
                upvote_count: song.upvote_count ?? 0,
                comment_count: song.comment_count ?? 0
            };

            await recordTrendingEntry(song.id, list.id, i + 1, stats);
            console.log(`[${list.id}] New entry: ${song.id} at rank ${i + 1}`);
        }

        // 4. Save Snapshot for ALL current songs
        const stats: TrendingStats = {
            play_count: song.play_count ?? 0,
            upvote_count: song.upvote_count ?? 0,
            comment_count: song.comment_count ?? 0
        };

        await saveSongSnapshot(song.id, stats, [list.id]);
    }

    // 5. Detect Exits (In active but not in current)
    for (const songId of activeSongIds) {
        if (!currentSongIds.has(songId)) {
            // Exited
            const exitStats: TrendingStats = { play_count: 0, upvote_count: 0, comment_count: 0 };
            await recordTrendingExit(songId, list.id, exitStats);
            console.log(`[${list.id}] Exited: ${songId}`);
        }
    }
}
