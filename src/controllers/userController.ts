import dotenv from 'dotenv';
dotenv.config();
import { Request, Response } from 'express';
import { getCachedUserInfo, setCacheUserInfo } from '../services/userService.js';
import { fetchWithRetry } from '../utils/fetchWithRetry.js';

const profileUrl = process.env.PROFILE_URL;
const lastUrl = process.env.LAST_URL;

export const getClipDataFromUser = async (handle: string, forceRefresh = false): Promise<any> => {
    if (!profileUrl) {
        return { error: 'Server configuration error' };
    }

    try {
        if (!forceRefresh) {
            const cachedUserInfo = await getCachedUserInfo(handle);
            if (cachedUserInfo) {
                console.log('Returning data from cache');
                return cachedUserInfo;
            }
        }

        let allClips: any[] = [];
        let totalClips = 0;
        let totalPages = 1;

        const firstPageUrl = `${profileUrl}${handle}?page=1&playlists_sort_by=upvote_count&clips_sort_by=created_at`;
        const firstPageResponse = await fetchWithRetry(firstPageUrl);

        if (!firstPageResponse.data || !firstPageResponse.data.clips) {
            return { error: 'No clips found for this user' };
        }

        totalClips = firstPageResponse.data.num_total_clips || 0;
        totalPages = Math.ceil(totalClips / 20);

        allClips = allClips.concat(firstPageResponse.data.clips);

        for (let currentPage = 2; currentPage <= totalPages; currentPage++) {
            const pageUrl = `${profileUrl}${handle}?page=${currentPage}&playlists_sort_by=upvote_count&clips_sort_by=created_at`;
            const pageResponse = await fetchWithRetry(pageUrl);

            if (pageResponse.data && pageResponse.data.clips) {
                allClips = allClips.concat(pageResponse.data.clips);
            }
            setTimeout(() => { }, 1000); // Adding a delay to avoid hitting the API too fast
        }

        allClips.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const userData = {
            handle: handle,
            display_name: firstPageResponse.data.display_name,
            profile_description: firstPageResponse.data.profile_description,
            avatar_image_url: firstPageResponse.data.avatar_image_url,
            total_clips: totalClips,
            total_pages: totalPages,
            clips: allClips.map((clip: any) => ({
                id: clip.id,
                title: clip.title,
                created_at: clip.created_at,
                play_count: clip.play_count,
                upvote_count: clip.upvote_count,
                is_public: clip.is_public,
                audio_url: clip.audio_url,
                video_url: clip.video_url,
                image_url: clip.image_url,
                tags: clip.metadata?.tags || null,
                prompt: clip.metadata?.prompt || null
            }))
        };

        await setCacheUserInfo(handle, userData);

        return userData;

    } catch (error) {
        console.error('Error fetching user data:', error);
        return { error: 'Internal error' };
    }
};

export const getRecentClips = async (req: Request, res: Response): Promise<Response> => {
    const { handle } = req.params;
    const forceRefresh = req.query.forceRefresh === 'true';

    if (!handle) {
        return res.status(400).json({ error: 'Missing handle' });
    }

    if (!profileUrl || !lastUrl) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        if (!forceRefresh) {
            const cachedUserInfo = await getCachedUserInfo(handle);
            if (cachedUserInfo) {
                console.log('Returning data from cache');
                return res.json(cachedUserInfo);
            }
        }

        const clipsUrl = `${profileUrl}${handle}${lastUrl}`;
        const response = await fetchWithRetry(clipsUrl);

        if (!response.data || !response.data.clips) {
            return res.status(404).json({ error: 'User data or clips not found' });
        }

        const profile = response.data;

        const userInfo = {
            name: profile.display_name,
            avatar: profile.avatar_image_url,
            total_songs: profile.num_total_clips,
            profile_description: profile.profile_description || null,
            handle: profile.handle,
            user_id: profile.user_id,
            stats: profile.stats,
            playlists: profile.playlists || [],
            personas: profile.personas || [],
            songs: profile.clips.map((song: any) => ({
                title: song.title,
                created_at: song.created_at,
                upvote_count: song.upvote_count,
                song_url: song.audio_url,
                video_url: song.video_url,
                image_url: song.image_url,
                tags: song.metadata?.tags || null,
                prompt: song.metadata?.prompt || null
            }))
        };

        await setCacheUserInfo(handle, userInfo);

        return res.json(userInfo);

    } catch (err) {
        console.error('Error fetching user data:', err);
        return res.status(500).json({ error: 'Internal error' });
    }
};

export const getUserInfo = async (req: Request, res: Response): Promise<Response> => {
    const handle = req.params.handle;
    const page = parseInt(req.params.page || '1', 10);
    const forceRefresh = req.query.forceRefresh === 'true';

    if (!handle) {
        return res.status(400).json({ error: 'Missing handle' });
    }

    if (!profileUrl) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        if (!forceRefresh) {
            const cachedUserInfo = await getCachedUserInfo(handle);
            if (cachedUserInfo) {
                console.log('Returning data from cache');
                return res.json(cachedUserInfo);
            }
        }

        const clipsUrl = `${profileUrl}${handle}?page=${page}&playlists_sort_by=upvote_count&clips_sort_by=created_at`;
        const response = await fetchWithRetry(clipsUrl);

        if (!response.data || !response.data.clips) {
            return res.status(404).json({ error: 'User data or clips not found' });
        }

        const profile = response.data;

        const userInfo = {
            name: profile.display_name,
            avatar: profile.avatar_image_url,
            total_songs: profile.num_total_clips,
            profile_description: profile.profile_description || null,
            handle: profile.handle,
            user_id: profile.user_id,
            stats: profile.stats,
            playlists: profile.playlists || [],
            personas: profile.personas || [],
            songs: profile.clips.map((song: any) => ({
                title: song.title,
                created_at: song.created_at,
                upvote_count: song.upvote_count,
                song_url: song.audio_url,
                video_url: song.video_url,
                image_url: song.image_url,
                tags: song.metadata?.tags || null,
                prompt: song.metadata?.prompt || null
            }))
        };

        await setCacheUserInfo(handle, userInfo);

        return res.json(userInfo);

    } catch (err) {
        console.error('Error fetching user data:', err);
        return res.status(500).json({ error: 'Internal error' });
    }
};

