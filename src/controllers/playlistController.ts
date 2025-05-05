import { Request, Response } from 'express';
import { isValidPlaylistId, isValidPageNumber } from '../utils/regex.js';
import { Playlist, PlaylistResponseSchema } from '../schemas/playlistSchema.js';
import { fetchAndCache } from '../utils/fetchAndCache.js';
import { getCachedItem, setCachedItem } from '../services/cacheService.js';

const listUrl = process.env.LIST_URL;

async function fetchAllPlaylistPages(
    baseUrl: string,
    playlistId: string,
    totalPages: number,
    schema: typeof PlaylistResponseSchema,
    forceRefresh: boolean = false
) {
    let allClips: typeof PlaylistResponseSchema._type['playlist_clips'] = [];

    for (let currentPage = 2; currentPage <= totalPages; currentPage++) {
        const pageUrl = `${baseUrl}${playlistId}?page=${currentPage}`;
        const result = await fetchAndCache<Playlist>({
            cacheType: 'playlist_page',
            id: `${playlistId}_page_${currentPage}`,
            forceRefresh,
            url: pageUrl,
            schema,
            notFoundMessage: `Playlist page ${currentPage} not found`,
            logPrefix: 'playlist_page'
        });

        if ('error' in result) {
            console.warn(`Invalid response for page ${currentPage}, skipping...`, result.details);
            continue;
        }
        allClips = allClips.concat(result.playlist_clips);
    }
    return allClips;
}

export const getPlaylistInfo = async (
    req: Request,
    res: Response
): Promise<Response | void> => {
    if (!listUrl) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const { playlistId } = req.params;
    const forceRefresh = req.query.refresh === 'true' || req.query.forceRefresh === 'true';


    if (!playlistId) {
        return res.status(400).json({ error: 'Missing playlistId' });
    }
    if (!isValidPlaylistId(playlistId)) {
        return res.status(400).json({ error: 'Invalid playlistId' });
    }

    const cachedPlaylist = await getCachedItem<Playlist>("playlist", playlistId, forceRefresh);
    if (cachedPlaylist) {
        console.log('Returning cached playlist data for playlistId:', playlistId);
        return res.json(cachedPlaylist);
    }

    console.time('API Call Time');
    try {
        const firstPage = await fetchAndCache<Playlist>({
            cacheType: 'playlist_page',
            id: `${playlistId}_page_1`,
            forceRefresh,
            url: `${listUrl}${playlistId}?page=1`,
            schema: PlaylistResponseSchema,
            notFoundMessage: 'Playlist not found',
            logPrefix: 'playlist_page'
        });

        if ('error' in firstPage) {
            return res.status(502).json({
                error: firstPage.error, details: firstPage.details,
                message: 'Error fetching playlist data'
            });
        }

        const playlist = firstPage;
        const totalClips = playlist.num_total_results || 0;
        const pageSize = Math.ceil(totalClips / playlist.playlist_clips.length || 50);
        console.log('Total pages for', playlistId, pageSize);
        const allClips = await fetchAllPlaylistPages(listUrl, playlistId, pageSize, PlaylistResponseSchema, forceRefresh);
        playlist.playlist_clips = playlist.playlist_clips.concat(allClips);

        await setCachedItem('playlist', playlistId, playlist);
        console.log('Cached playlist data for playlistId:', playlistId);
        return res.json(playlist);
    } catch (error) {
        console.error('Error fetching playlist data:', error);
        return res.status(500).json({ error: 'Internal error' });
    } finally {
        console.timeEnd('API Call Time');
    }
};

export const getPlaylistPage = async (
    req: Request,
    res: Response
): Promise<Response | void> => {

    if (!listUrl) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const { playlistId, page } = req.params;
    if (!playlistId) {
        return res.status(400).json({ error: 'Missing playlistId' });
    }
    const forceRefresh = req.query.refresh === 'true' || req.query.forceRefresh === 'true';

    if (!isValidPlaylistId(playlistId)) {
        return res.status(400).json({ error: 'Invalid playlistId' });
    }
    if (!isValidPageNumber(page)) {
        return res.status(400).json({ error: 'Invalid page number' });
    }
    const pageNumber = parseInt(req.params.page, 10);
    console.log('Page number:', pageNumber);

    console.time('API Call Time');
    try {
        const result = await fetchAndCache<typeof PlaylistResponseSchema._type>({
            cacheType: 'playlist_page',
            id: `${playlistId}_page_${pageNumber}`,
            forceRefresh,
            url: `${listUrl}${playlistId}?page=${pageNumber}`,
            schema: PlaylistResponseSchema,
            notFoundMessage: 'Playlist page not found',
            logPrefix: 'playlist_page'
        });

        if ('error' in result) {
            return res.status(502).json({ error: result.error, details: result.details });
        }

        return res.json(result);
    } catch (error) {
        console.error('Error fetching playlist page data:', error);
        return res.status(500).json({ error: 'Internal error' });
    } finally {
        console.timeEnd('API Call Time');
    }
};