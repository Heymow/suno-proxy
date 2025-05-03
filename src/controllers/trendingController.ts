import dotenv from 'dotenv';
dotenv.config();
import { Request, Response } from 'express';
import { SunoStatusResponseSchema, SunoStatus } from '../schemas/sunoStatusSchema.js';
import { fetchAndCache } from '../utils/fetchAndCache.js';
import { TrendingResponseSchema } from '../schemas/trendingSchema.js';

const trendUrl = process.env.TREND_URL;

export async function getTrending(
    req: Request,
    res: Response
): Promise<Response | void> {
    if (!trendUrl) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const { list, timeSpan } = req.params;
    const allowedLists = [
        "Global",
        "Arabic",
        "Bengali",
        "Chinese",
        "Czech",
        "Dutch",
        "English",
        "Finnish",
        "French",
        "German",
        "Greek",
        "Gujarati",
        "Hebrew",
        "Hindi",
        "Hungarian",
        "Indonesian",
        "Italian",
        "Japanese",
        "Kazakh",
        "Korean",
        "Malay",
        "Persian",
        "Polish",
        "Portuguese",
        "Panjabi",
        "Russian",
        "Spanish",
        "Swedish",
        "Tagalog",
        "Tamil",
        "Telugu",
        "Thai",
        "Turkish",
        "Ukrainian",
        "Urdu",
        "Vietnamese"
    ];
    const allowedTimeSpans = [
        "Now",
        "Weekly",
        "Monthly",
        "All Time"
    ];

    if (!allowedLists.includes(list) || !allowedTimeSpans.includes(timeSpan)) {
        return res.status(400).json({ error: 'Invalid list or time span parameter' });
    }
    const forceRefresh = req.query.refresh === 'true' || req.query.forceRefresh === 'true';

    if (!list || !timeSpan) {
        return res.status(400).json({ error: 'Missing parameter' });
    }

    const body = {
        "start_index": 0,
        "page_size": 2,
        "section_name": "trending_songs",
        "section_content": list,
        "secondary_section_content": timeSpan,
        "page": 1,
        "section_size": 100,
        "disable_shuffle": true
    }

    const result = await fetchAndCache<typeof TrendingResponseSchema._type>({
        cacheType: 'trending',
        id: `${list}_${timeSpan}`,
        forceRefresh,
        url: `${trendUrl}`,
        schema: TrendingResponseSchema,
        notFoundMessage: 'Trending list not found',
        logPrefix: 'trending',
        method: 'POST',
        body
    });

    if ('error' in result) {
        return res.status(502).json({
            error: result.error,
            details: result.details ? JSON.stringify(result.details, null, 2) : undefined
        });
    }

    return res.json(result);
}

export async function getStatus(
    req: Request,
    res: Response
): Promise<Response | void> {

    if (!trendUrl) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const forceRefresh = req.query.refresh === 'true' || req.query.forceRefresh === 'true';

    const body = {
        "start_index": 0,
        "page_size": 5,
        "page": 1,
        "section_size": 1000,
        "disable_shuffle": true
    }

    console.log('Fetching Suno global status...');
    console.time('API Call Time');

    try {
        const result = await fetchAndCache<SunoStatus>({
            cacheType: 'sunoStatus',
            id: `sunoStatus`,
            forceRefresh,
            url: `${trendUrl}`,
            schema: SunoStatusResponseSchema,
            notFoundMessage: 'Status list not found',
            logPrefix: 'sunoStatus',
            method: 'POST',
            body
        });

        if ('error' in result) {
            return res.status(502).json({
                error: result.error,
                details: result.details ? JSON.stringify(result.details, null, 2) : undefined
            });
        }

        return res.json(result);
    } catch (error) {
        console.error('Error fetching Suno global status:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
    finally {
        console.timeEnd('API Call Time');
    }
}