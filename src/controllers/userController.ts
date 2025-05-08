import { Request, Response } from 'express';
import { User, UserRecent, UserRecentPageResponseSchema, UserPageResponseSchema } from '../schemas/userSchema.js';
import { fetchAndCache } from '../utils/fetchAndCache.js';
import { getCachedItem, setCachedItem } from '../services/cacheService.js';
import { isValidPageNumber } from '../utils/regex.js';

const profileUrl = process.env.PROFILE_URL || 'https://studio-api.prod.suno.com/api/profiles/';
const lastUrl = process.env.LAST_URL || '/recent_clips';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchAllUserPages(
    handle: string,
    totalPages: number,
    schema: typeof UserPageResponseSchema,
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
            logPrefix: 'user',
            normalizer: data => {
                if (data.clips && !Array.isArray(data.clips)) {
                    data.clips = Object.values(data.clips).filter(
                        v => typeof v === 'object' && v !== null && !Array.isArray(v)
                    );
                }
                return data;
            }
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
): Promise<void> => {
    if (!profileUrl) {
        res.status(500).json({ error: 'Server configuration error' });
        return;
    }

    const { handle, page } = req.params;
    if (!handle) {
        res.status(400).json({ error: 'Missing handle' });
        return;
    }
    const forceRefresh = req.query.forceRefresh === 'true' || req.query.refresh === 'true';

    if (!isValidPageNumber(page)) {
        res.status(400).json({ error: 'Invalid page number' });
        return;
    }
    if (!isValidPageNumber(page)) {
        res.status(400).json({ error: 'Invalid page number' });
        return;
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
            schema: UserPageResponseSchema,
            notFoundMessage: 'User not found',
            logPrefix: 'user'
        });

        if ('error' in result) {
            const statusCode = result.statusCode ?? 502;
            res.status(statusCode).json({ error: result.error, details: result.details });
            return;
        }

        res.json(result);
        return;
    } catch (err) {
        console.error('Error fetching user data:', err);
        res.status(500).json({ error: 'Internal error' });
        return;
    } finally {
        console.timeEnd('API Call Time');
    }
};


export const getAllClipsFromUser = async (
    req: Request,
    res: Response
): Promise<void> => {
    if (!profileUrl) {
        res.status(500).json({ error: 'Server configuration error' });
        return;
    }
    const { handle } = req.params;
    const forceRefresh = req.query.forceRefresh === 'true' || req.query.refresh === 'true';

    if (!handle) {
        res.status(400).json({ error: 'Missing handle' });
        return;
    }

    if (!forceRefresh) {
        const cachedUser = await getCachedItem<User>('user', handle, forceRefresh);
        if (cachedUser) {
            console.log('Returning cached user data for handle:', handle);
            res.json(cachedUser);
            return;
        }
    }

    try {
        const firstPage = await fetchAndCache<User>({
            cacheType: 'user_page',
            id: `${handle}_page_1`,
            forceRefresh,
            url: `${profileUrl}${handle}?page=1&playlists_sort_by=created_at&clips_sort_by=created_at`,
            schema: UserPageResponseSchema,
            notFoundMessage: 'User not found',
            logPrefix: 'user'
        });

        if ('error' in firstPage) {
            const statusCode = firstPage.statusCode ?? 502;
            res.status(statusCode).json({ error: firstPage.error, details: firstPage.details });
            return;
        }

        const totalClips = firstPage.num_total_clips || 0;
        const totalPages = Math.ceil(totalClips / 20);

        let allClips = [...firstPage.clips];
        const nextClips = await fetchAllUserPages(handle, totalPages, UserPageResponseSchema, forceRefresh);
        allClips = allClips.concat(nextClips);

        firstPage.clips = allClips;

        firstPage.clips.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        const typedUser = UserPageResponseSchema.safeParse(firstPage);
        if (!typedUser.success) {
            console.error('Error rebuilding user data:', typedUser.error.format());
            res.status(500).json({ error: 'Error rebuilding user data:', details: typedUser.error.format() });
            return;
        }

        setCachedItem<User>('user', handle, typedUser.data);
        console.log('Cached user data for handle:', handle);

        res.json(firstPage);
        return;
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: 'Internal error' });
        return;
    }
};

export const getRecentClips = async (req: Request, res: Response): Promise<void> => {
    if (!profileUrl || !lastUrl) {
        res.status(500).json({ error: 'Server configuration error' });
        return;
    }
    const { handle } = req.params;
    const forceRefresh = req.query.forceRefresh === 'true' || req.query.refresh === 'true';

    if (!handle) {
        res.status(400).json({ error: 'Missing handle' });
        return;
    }

    const url = `${profileUrl}${handle}${lastUrl}`;

    console.time('API Call Time');
    try {
        const result = await fetchAndCache<UserRecent>({
            cacheType: 'user_recent',
            id: handle,
            forceRefresh,
            url,
            schema: UserRecentPageResponseSchema,
            notFoundMessage: 'User not found',
            logPrefix: 'user_recent'
        });

        if ('error' in result) {
            const statusCode = result.statusCode ?? 502;
            res.status(statusCode).json({ error: result.error });
            return;
        }

        res.json(result);
        return;
    } catch (err) {
        console.error('Error fetching user recent clips:', err);
        res.status(500).json({ error: 'Internal error' });
        return;
    } finally {
        console.timeEnd('API Call Time');
    }
};