import dotenv from 'dotenv';
dotenv.config();
import { Request, Response } from 'express';
import { User, UserRecent, UserRecentSchema, UserSchema } from '../schemas/userSchema.js';
import { fetchAndCache } from '../utils/fetchAndCache.js';
import { getCachedItem, setCachedItem } from '../services/cacheService.js';
import { isValidPageNumber } from '../utils/regex.js';

const profileUrl = process.env.PROFILE_URL;
const lastUrl = process.env.LAST_URL;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchAllUserPages(
    handle: string,
    totalPages: number,
    schema: typeof UserSchema,
    forceRefresh: boolean = false
) {
    let allClips: User['clips'] = [];

    for (let currentPage = 2; currentPage <= totalPages; currentPage++) {
        const url = `${profileUrl}${handle}?page=${currentPage}&playlists_sort_by=upvote_count&clips_sort_by=created_at`;
        const result = await fetchAndCache<User>({
            cacheType: 'user_page',
            id: `${handle}_page_${currentPage}`,
            forceRefresh,
            url,
            schema,
            notFoundMessage: `User page ${currentPage} not found`,
            logPrefix: 'user'
        });

        if ('error' in result) {
            console.warn(`Invalid response for page ${currentPage}, skipping...`, result.details);
            continue;
        }
        allClips = allClips.concat(result.clips);
        await sleep(Math.random() * 600 + 200);
    }
    return allClips;
}

export const getUserPageInfo = async (req: Request,
    res: Response
): Promise<Response> => {
    if (!profileUrl) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const { handle, page } = req.params;
    if (!handle) {
        return res.status(400).json({ error: 'Missing handle' });
    }
    const forceRefresh = req.query.forceRefresh === 'true' || req.query.refresh === 'true';

    if (!isValidPageNumber(page)) {
        return res.status(400).json({ error: 'Invalid page number' });
    }
    if (!isValidPageNumber(page)) {
        return res.status(400).json({ error: 'Invalid page number' });
    }
    const pageNumber = parseInt(req.params.page, 10);
    console.log('Page number:', pageNumber);

    const url = `${profileUrl}${handle}?page=${pageNumber}&playlists_sort_by=upvote_count&clips_sort_by=created_at`;

    console.time('API Call Time');
    try {
        const result = await fetchAndCache<User>({
            cacheType: 'user_page',
            id: `${handle}_page_${pageNumber}`,
            forceRefresh,
            url,
            schema: UserSchema,
            notFoundMessage: 'User not found',
            logPrefix: 'user'
        });

        if ('error' in result) {
            return res.status(502).json({ error: result.error, details: result.details });
        }

        return res.json(result);
    } catch (err) {
        console.error('Error fetching user data:', err);
        return res.status(500).json({ error: 'Internal error' });
    } finally {
        console.timeEnd('API Call Time');
    }
};


export const getAllClipsFromUser = async (handle: string, forceRefresh = false): Promise<any> => {
    if (!profileUrl) {
        return { error: 'Server configuration error' };
    }
    if (!handle) {
        return { error: 'Missing handle' };
    }

    if (!forceRefresh) {
        const cachedUser = getCachedItem<User>('user', handle, forceRefresh);
        if (cachedUser) {
            console.log('Returning cached user data for handle:', handle);
            return cachedUser;
        }
    }

    try {
        const firstPage = await fetchAndCache<User>({
            cacheType: 'user_page',
            id: `${handle}_page_1`,
            forceRefresh,
            url: `${profileUrl}${handle}?page=1&playlists_sort_by=created_at&clips_sort_by=created_at`,
            schema: UserSchema,
            notFoundMessage: 'User not found',
            logPrefix: 'user'
        });

        if ('error' in firstPage) {
            return firstPage;
        }

        const totalClips = firstPage.num_total_clips || 0;
        const totalPages = Math.ceil(totalClips / 20);

        let allClips = [...firstPage.clips];
        const nextClips = await fetchAllUserPages(handle, totalPages, UserSchema, forceRefresh);
        allClips = allClips.concat(nextClips);

        firstPage.clips = allClips;

        firstPage.clips.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        const typedUser = UserSchema.safeParse(firstPage);
        if (!typedUser.success) {
            console.error('Error rebuilding user data:', typedUser.error.format());
            return { error: 'Error rebuilding user data:', details: typedUser.error.format() };
        }

        setCachedItem<User>('user', handle, typedUser.data);
        console.log('Cached user data for handle:', handle);

        return firstPage;
    } catch (error) {
        console.error('Error fetching user data:', error);
        return { error: 'Internal error' };
    }
};

export const getRecentClips = async (req: Request, res: Response): Promise<Response> => {
    if (!profileUrl || !lastUrl) {
        return res.status(500).json({ error: 'Server configuration error' });
    }
    const { handle } = req.params;
    const forceRefresh = req.query.forceRefresh === 'true' || req.query.refresh === 'true';

    if (!handle) return res.status(400).json({ error: 'Missing handle' });

    const url = `${profileUrl}${handle}${lastUrl}`;

    console.time('API Call Time');
    try {
        const result = await fetchAndCache<UserRecent>({
            cacheType: 'user_recent',
            id: handle,
            forceRefresh,
            url,
            schema: UserRecentSchema,
            notFoundMessage: 'User not found',
            logPrefix: 'user_recent'
        });

        if ('error' in result) {
            return res.status(502).json({ error: result.error, details: result.details });
        }

        return res.json(result);
    } catch (err) {
        console.error('Error fetching user recent clips:', err);
        return res.status(500).json({ error: 'Internal error' });
    } finally {
        console.timeEnd('API Call Time');
    }
};