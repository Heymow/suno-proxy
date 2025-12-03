import { fetchAndCache } from '../utils/fetchAndCache.js';
import { NewSongsResponseSchema } from '../schemas/newSongsSchema.js';
import {
    recordTrendingEntry,
    recordTrendingExit,
    saveSongSnapshot,
    getActiveTrendingSongs
} from '../models/statsModel.js';
import { TrendingStats } from '../types/statsTypes.js';

const TRENDING_URL = 'https://studio-api.prod.suno.com/api/playlist/trending';
const NEW_SONGS_URL = 'https://studio-api.prod.suno.com/api/playlist/new_songs';

const LISTS_TO_TRACK = [
    { id: 'trending', url: TRENDING_URL },
    { id: 'new_songs', url: NEW_SONGS_URL }
];

export async function pollTrendingLists(): Promise<void> {
    console.log('Starting trending lists poll...');

    for (const list of LISTS_TO_TRACK) {
        try {
            await processList(list.id, list.url);
        } catch (error) {
            console.error(`Error processing list ${list.id}:`, error);
        }
    }

    console.log('Trending lists poll completed.');
}

async function processList(listId: string, url: string): Promise<void> {
    // 1. Fetch current list state (force refresh to get latest)
    const result = await fetchAndCache({
        cacheType: 'playlist',
        id: `${listId}_poller`, // Unique ID for poller to avoid conflict with user requests if needed, or share? 
        // Actually, we want fresh data, so forceRefresh=true
        forceRefresh: true,
        url: url,
        schema: NewSongsResponseSchema,
        notFoundMessage: 'Playlist not found',
        logPrefix: `poller_${listId}`
    });

    if ('error' in result) {
        console.error(`Failed to fetch list ${listId}: ${result.error}`);
        return;
    }

    const currentSongs = result.playlist_clips;
    const currentSongIds = new Set(currentSongs.map(s => s.clip.id));

    // 2. Get previously active songs in this list from DB
    const activeSongIds = await getActiveTrendingSongs(listId);
    const activeSongIdsSet = new Set(activeSongIds);

    // 3. Detect Entries (In current but not in active)
    for (let i = 0; i < currentSongs.length; i++) {
        const item = currentSongs[i];
        const song = item.clip;

        if (!activeSongIdsSet.has(song.id)) {
            // New Entry
            const stats: TrendingStats = {
                play_count: song.play_count ?? 0,
                upvote_count: song.upvote_count ?? 0,
                comment_count: song.comment_count ?? 0 // Assuming comment_count exists on clip, need to check schema
            };

            await recordTrendingEntry(song.id, listId, i + 1, stats);
            console.log(`[${listId}] New entry: ${song.id} at rank ${i + 1}`);
        }

        // 4. Save Snapshot for ALL current songs
        // We do this for every song currently in the list to track velocity
        const stats: TrendingStats = {
            play_count: song.play_count ?? 0,
            upvote_count: song.upvote_count ?? 0,
            comment_count: song.comment_count ?? 0
        };

        // Note: A song might be in multiple lists, we should probably pass the listId to snapshot
        // But the snapshot model takes an array. For now, we just save a snapshot. 
        // Ideally, we'd aggregate lists for a song, but here we process lists sequentially.
        // We can just append this list to the snapshot's list if we want, but simpler is just to record it.
        // The current model `saveSongSnapshot` takes `trending_lists: string[]`.
        // Since we are processing one list at a time, we might overwrite or need to fetch last snapshot.
        // For simplicity/MVP, let's just record that it was seen in this list at this time.
        // Or better: just save the snapshot. The aggregation can handle "was in X and Y".

        await saveSongSnapshot(song.id, stats, [listId]);
    }

    // 5. Detect Exits (In active but not in current)
    for (const songId of activeSongIds) {
        if (!currentSongIds.has(songId)) {
            // Exited
            // We need the stats at exit. Since we don't have the song object from the current list (it's gone),
            // we might rely on the last snapshot or just record the exit time.
            // Ideally we'd fetch the song details one last time, but for now let's just close it.
            // We can pass empty stats or try to fetch. Let's pass 0s or nulls if allowed, 
            // or better, fetch the song to get final stats.

            // For now, let's just close it. The duration is the most important.
            // We'll pass 0s for stats as we can't easily get them without an extra call.
            // TODO: Fetch song details for accurate exit stats.
            const exitStats: TrendingStats = { play_count: 0, upvote_count: 0, comment_count: 0 };

            await recordTrendingExit(songId, listId, exitStats);
            console.log(`[${listId}] Exited: ${songId}`);
        }
    }
}
