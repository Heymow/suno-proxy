import { Request, Response } from 'express';
import { SongResponseSchema, Song, CommentsResponseSchema, CommentsResponse } from '../schemas/songSchema.js';
import { fetchAndCache } from '../utils/fetchAndCache.js';
import { isValidSongId, isSharedSongId } from '../utils/regex.js';
import { z } from 'zod';

const clip_url = process.env.CLIP_URL || 'https://studio-api.prod.suno.com/api/clip/';
const gen_url = process.env.GEN_URL || 'https://studio-api.prod.suno.com/api/gen/';
const shareUrl = process.env.SHARE_URL || 'https://studio-api.prod.suno.com/api/share/code/';

async function resolveSharedSongId(
    shareUrl: string,
    songId: string,
    forceRefresh: boolean
): Promise<string | { error: string }> {
    const result = await fetchAndCache<{ content_id: string }>({
        cacheType: 'share_link',
        id: songId,
        forceRefresh,
        url: `${shareUrl}${songId}`,
        schema: z.object({ content_id: z.string() }),
        notFoundMessage: 'Share link conversion error',
        logPrefix: 'share_link'
    });

    if ('error' in result) {
        return { error: result.error };
    }
    return result.content_id;
}

export const getClipInfo = async (
    req: Request,
    res: Response
): Promise<Response | void> => {

    if (!clip_url || !gen_url || !shareUrl) {
        console.error('Server configuration error: Missing URLs');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    let songId: string = req.params.songId;
    const forceRefresh = req.query.refresh === 'true' || req.query.forceRefresh === 'true';

    if (!songId) {
        return res.status(400).json({ error: 'Missing songId' });
    }

    if (isSharedSongId(songId)) {
        const resolved = await resolveSharedSongId(shareUrl, songId, forceRefresh);
        if (typeof resolved === 'object' && resolved.error) {
            return res.status(404).json({ error: resolved.error });
        }
        songId = resolved as string;
    }

    if (!isValidSongId(songId) && !isSharedSongId(songId)) {
        return res.status(400).json({ error: 'Invalid songId' });
    }

    console.time('API Call Time');

    const result = await fetchAndCache<Song>({
        cacheType: 'song',
        id: songId,
        forceRefresh,
        url: `${clip_url}${songId}`,
        schema: SongResponseSchema,
        notFoundMessage: 'Clip not found',
        logPrefix: 'clip'
    });

    if ('error' in result) {
        if (result.details) {
            return res.status(502).json({ error: result.error, details: result.details });
        }
        return res.status(404).json({ error: result.error });
    }
    console.timeEnd('API Call Time');
    return res.json(result);
};

export const getClipComments = async (req: Request, res: Response): Promise<Response | void> => {
    if (!gen_url) {
        return res.status(500).json({ error: 'Server configuration error' });
    }
    const songId: string = req.params.songId;
    const forceRefresh = req.query.refresh === 'true' || req.query.forceRefresh === 'true';

    if (!songId) {
        return res.status(400).json({ error: 'Missing songId' });
    }

    if (!isValidSongId(songId)) {
        return res.status(400).json({ error: 'Invalid songId' });
    }

    console.time('API Call Time');

    const result = await fetchAndCache<CommentsResponse>({
        cacheType: 'comments',
        id: songId,
        forceRefresh,
        url: `${gen_url}${songId}/comments?order=newest`,
        schema: CommentsResponseSchema.omit({ next_cursor: true }),
        notFoundMessage: 'Clip not found',
        logPrefix: 'comments'
    });

    if ('error' in result) {
        if (result.details) {
            return res.status(502).json({ error: result.error, details: result.details });
        }
        return res.status(404).json({ error: result.error });
    }
    console.timeEnd('API Call Time');
    return res.json(result);
};