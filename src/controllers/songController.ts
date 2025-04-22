import dotenv from 'dotenv';
dotenv.config();
import { Request, Response } from 'express';
import { getCachedSongInfo, setCachesongInfo } from '../services/songService.js';
import { fetchWithRetry } from '../utils/fetchWithRetry.js';

const isValidSongId = (songId: string): boolean => {
    const regex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    return regex.test(songId);
};

// const profileUrl = process.env.PROFILE_URL;
// const lastUrl = process.env.LAST_URL;
const clip_url = process.env.CLIP_URL;
const gen_url = process.env.GEN_URL;

// export async function getClipDataFromUser(handle: string) {
//     if (!profileUrl || !lastUrl) {
//         return { error: 'Server configuration error' };
//     }
//     try {
//         const clipsUrl = `${profileUrl}${handle}${lastUrl}`;
//         const { data } = await fetchWithRetry(clipsUrl);
//         return data;
//     } catch (error) {
//         console.error('Error retrieving songs:', error);
//         throw new Error('Error retrieving songs');
//     }
// }

export const getClipInfo = async (req: Request, res: Response): Promise<Response | void> => {
    const songId: string = req.params.songId;

    if (!songId) {
        return res.status(400).json({ error: 'Missing songId' });
    }

    if (!isValidSongId(songId)) {
        return res.status(400).json({ error: 'Invalid songId' });
    }

    console.time('API Call Time');

    try {
        const clipUrl = `${clip_url}${songId}`;
        const clipsResponse = await fetchWithRetry(clipUrl);

        if (!clipsResponse.data) {
            return res.status(404).json({ error: 'Clip not found' });
        }

        const clip = clipsResponse.data;

        const songInfo = {
            id: clip.id,
            title: clip.title,
            lyrics: clip.metadata?.prompt || null,
            tags: clip.metadata?.tags || null,
            created_at: clip.created_at,
            artist: {
                handle: clip.handle,
                name: clip.display_name,
                avatar: clip.avatar_image_url
            },
            play_count: clip.play_count,
            upvote_count: clip.upvote_count,
            is_public: clip.is_public,
            audio_url: clip.audio_url,
            video_url: clip.video_url,
            image_url: clip.image_url,
            model_name: clip.model_name,
            duration: clip.duration,
            suno_url: `https://suno.com/song/${clip.id}`,
            image_large_url: clip.image_large_url,
            major_model_version: clip.major_model_version,
            metadata: clip.metadata,
            is_liked: clip.is_liked,
            user_id: clip.user_id,
            status: clip.status,
            allow_comments: clip.allow_comments
        };

        setCachesongInfo(clip.handle, songId);

        console.timeEnd('API Call Time');
        return res.json(songInfo);

    } catch (err) {
        console.error('Error fetching clip data:', err);
        console.timeEnd('API Call Time');

        if (!res.headersSent) {
            return res.status(500).json({ error: 'Internal error' });
        }
    }
};

export const getClipComments = async (req: Request, res: Response): Promise<Response | void> => {
    const songId: string = req.params.songId;

    if (!songId) {
        return res.status(400).json({ error: 'Missing songId' });
    }

    if (!isValidSongId(songId)) {
        return res.status(400).json({ error: 'Invalid songId' });
    }

    console.time('API Call Time');

    try {
        const clipUrl = `${gen_url}${songId}/comments?order=newest`;
        const clipsResponse = await fetchWithRetry(clipUrl);

        if (!clipsResponse.data || !clipsResponse.data.results) {
            return res.status(404).json({ error: 'Clip not found' });
        }

        const comments = clipsResponse.data.results;

        const commentsInfo = {
            allow_comment: clipsResponse.data.allow_comment,
            total_count: clipsResponse.data.total_count,
            comments: comments.map((comment: any) => ({
                id: comment.id,
                text: comment.content,
                created_at: comment.created_at,
                user_id: comment.user_id,
                user_name: comment.user_display_name,
                user_avatar: comment.user_avatar_url,
                num_likes: comment.num_likes
            }))
        };

        console.timeEnd('API Call Time');
        return res.json(commentsInfo);

    } catch (err) {
        console.error('Error fetching clip data:', err);
        console.timeEnd('API Call Time');

        if (!res.headersSent) {
            return res.status(500).json({ error: 'Internal error' });
        }
    }
};

// export const getSongInfo = async (req: Request, res: Response): Promise<Response> => {
//     const songId: string = req.params.songId;

//     if (!profileUrl || !lastUrl) {
//         return res.status(500).json({ error: 'Server configuration error' });
//     }

//     if (!songId) {
//         return res.status(400).json({ error: 'Missing songId' });
//     }

//     if (!isValidSongId(songId)) {
//         return res.status(400).json({ error: 'Invalid songId' });
//     }

//     console.time('API Call Time');

//     try {
//         const handle = await getCachedSongInfo(songId);

//         if (!handle) {
//             return res.status(404).json({ error: 'Handle not found' });
//         }

//         const clipsUrl = `${profileUrl}${handle}${lastUrl}`;
//         const clipsResponse = await fetchWithRetry(clipsUrl);
//         const clip = clipsResponse.data.clips.find((c: { id: string }) => c.id === songId);

//         if (!clip) {
//             return res.status(404).json({ error: 'Song not found in recent clips' });
//         }

//         const songInfo = {
//             id: clip.id,
//             title: clip.title,
//             lyrics: clip.metadata?.prompt || null,
//             tags: clip.metadata?.tags || null,
//             created_at: clip.created_at,
//             artist: {
//                 handle: clip.handle,
//                 name: clip.display_name,
//                 avatar: clip.avatar_image_url
//             },
//             play_count: clip.play_count,
//             upvote_count: clip.upvote_count,
//             is_public: clip.is_public,
//             audio_url: clip.audio_url,
//             video_url: clip.video_url,
//             image_url: clip.image_url,
//             model_name: clip.model_name,
//             duration: clip.duration,
//             suno_url: `https://suno.com/song/${clip.id}`
//         };

//         console.timeEnd('API Call Time');
//         return res.json(songInfo);

//     } catch (err) {
//         console.error(err);
//         console.timeEnd('API Call Time');
//         return res.status(500).json({ error: 'Internal error' });
//     }
// };