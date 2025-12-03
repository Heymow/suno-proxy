import { z } from 'zod';

export const UserInfoResponseSchema = z.object({
    cover_photo_url: z.string().optional(),
    user_inputted_genres: z.array(z.string()).optional(),
    section_order: z.array(z.string()).optional(),
    spotify_link: z.string().optional(),
    x_link: z.string().optional(),
    youtube_link: z.string().optional(),
});

export type UserInfo = z.infer<typeof UserInfoResponseSchema>;
