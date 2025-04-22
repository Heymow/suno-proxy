import dotenv from 'dotenv';
dotenv.config();
import { Request, Response } from 'express';
import { getCachedPlaylistInfo, setCachePlaylistInfo } from '../services/playlistService.js';
import type { PlaylistData } from '../types/';
import { PlaylistResponseSchema } from '../schemas/playlistSchema.js';
import { fetchWithRetry } from '../utils/fetchWithRetry.js';

const listUrl = process.env.LIST_URL;

const isValidPlaylistId = (playlistId: string): boolean => {
    const regex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    return regex.test(playlistId);
};

export const getPlaylistInfo = async (
    req: Request,
    res: Response
): Promise<void> => {
    if (!listUrl) {
        res.status(500).json({ error: 'Server configuration error' });
        return;
    }

    const { playlistId } = req.params;
    const forceRefresh = req.query.refresh === 'true';

    if (!playlistId) {
        res.status(400).json({ error: 'Missing playlistId' });
        return;
    }
    if (!isValidPlaylistId(playlistId)) {
        res.status(400).json({ error: 'Invalid playlistId' });
        return;
    }

    const cachedPlaylist = await getCachedPlaylistInfo(playlistId, forceRefresh);
    if (cachedPlaylist) {
        console.log('Returning cached playlist data');
        res.json(cachedPlaylist);
        return;
    }

    console.time('API Call Time');

    try {
        const firstPageUrl = `${listUrl}${playlistId}?page=1`;
        console.log(`Fetching page 1`);
        const firstPageResponse = await fetchWithRetry(firstPageUrl);

        const parseResult = PlaylistResponseSchema.safeParse(firstPageResponse.data);
        if (!parseResult.success) {
            console.error('Invalid API response for page 1:', parseResult.error.format());
            res.status(502).json({ error: 'Invalid playlist response from API' });
            return;
        }

        const playlist = parseResult.data;
        const totalClips = playlist.num_total_results || 0;
        const totalPages = Math.ceil(totalClips / 50);

        let allClips = playlist.playlist_clips;
        console.log(`Fetched ${allClips.length} clips from page 1`);

        for (let currentPage = 2; currentPage <= totalPages; currentPage++) {
            const pageUrl = `${listUrl}${playlistId}?page=${currentPage}`;
            console.log(`Fetching page ${currentPage} of ${totalPages}`);
            try {
                const pageResponse = await fetchWithRetry(pageUrl);
                const pageParse = PlaylistResponseSchema.safeParse(pageResponse.data);
                if (pageParse.success) {
                    allClips = allClips.concat(pageParse.data.playlist_clips);
                } else {
                    console.warn(`Invalid response for page ${currentPage}, skipping...`);
                }
            } catch (error) {
                console.error(`Failed to fetch page ${currentPage}:`, error);
            }
        }

        const playlistData: PlaylistData = {
            ...playlist,
            playlist_clips: allClips,
            total_clips: totalClips,
            total_pages: totalPages
        };

        await setCachePlaylistInfo(playlistId, playlistData);
        console.timeEnd('API Call Time');
        res.json(playlistData);
        return;
    } catch (error) {
        console.error('Error fetching playlist data:', error);
        res.status(500).json({ error: 'Internal error' });
        return;
    }
};