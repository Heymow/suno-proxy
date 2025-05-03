import { z } from "zod";

const UserMetadataSchema = z.object({
    tags: z.string(),
    prompt: z.string(),
    edited_clip_id: z.string().optional(),
    type: z.string(),
    duration: z.number(),
    has_vocal: z.boolean().optional(),
    video_upload_width: z.number().optional(),
    video_upload_height: z.number().optional(),
    edit_session_id: z.string().optional(),
    can_remix: z.boolean(),
    is_remix: z.boolean(),
});

const UserSongSchema = z.object({
    id: z.string(),
    entity_type: z.string(),
    video_url: z.string(),
    audio_url: z.string(),
    image_url: z.string(),
    image_large_url: z.string(),
    major_model_version: z.string(),
    model_name: z.string(),
    metadata: UserMetadataSchema,
    caption: z.string().optional(),
    is_liked: z.boolean(),
    user_id: z.string(),
    display_name: z.string(),
    handle: z.string(),
    is_handle_updated: z.boolean(),
    avatar_image_url: z.string(),
    is_trashed: z.boolean(),
    is_pinned: z.boolean().optional(),
    explicit: z.boolean().optional(),
    comment_count: z.number(),
    flag_count: z.number(),
    created_at: z.string(),
    status: z.string(),
    title: z.string(),
    play_count: z.number(),
    upvote_count: z.number(),
    is_public: z.boolean(),
    allow_comments: z.boolean(),
});

const UserPlaylistSchema = z.object({
    id: z.string(),
    entity_type: z.string(),
    image_url: z.string(),
    playlist_clips: z.array(z.unknown()),
    current_page: z.number(),
    num_total_results: z.number(),
    is_owned: z.boolean(),
    is_trashed: z.boolean(),
    is_public: z.boolean(),
    user_display_name: z.string(),
    user_handle: z.string(),
    user_avatar_image_url: z.string(),
    upvote_count: z.number(),
    dislike_count: z.number(),
    flag_count: z.number(),
    skip_count: z.number(),
    play_count: z.number(),
    song_count: z.number(),
    name: z.string(),
    description: z.string().optional(),
    is_discover_playlist: z.boolean(),
});

const PersonasSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    image_s3_id: z.string().url(),
    root_clip_id: z.string(),
    clip: z.object({
        id: z.string(),
        entity_type: z.string(),
        video_url: z.string(),
        audio_url: z.string(),
        image_url: z.string(),
        image_large_url: z.string(),
        major_model_version: z.string(),
        model_name: z.string(),
        metadata: UserMetadataSchema,
        caption: z.string().optional(),
        is_liked: z.boolean(),
        user_id: z.string(),
        display_name: z.string(),
        handle: z.string(),
        is_handle_updated: z.boolean(),
        avatar_image_url: z.string(),
        is_trashed: z.boolean(),
        explicit: z.boolean().optional(),
        created_at: z.string(),
        status: z.string(),
        title: z.string(),
        play_count: z.number(),
        upvote_count: z.number(),
        is_public: z.boolean(),
        allow_comments: z.boolean()
    }),
    user_display_name: z.string(),
    user_handle: z.string(),
    user_image_url: z.string(),
    persona_clips: z.array(z.unknown()),
    is_suno_persona: z.boolean(),
    is_trashed: z.boolean(),
    is_owned: z.boolean(),
    is_public: z.boolean(),
    is_public_approved: z.boolean(),
    is_loved: z.boolean(),
    upvote_count: z.number(),
    clip_count: z.number()
});


export const UserSchema = z.object({
    user_id: z.string(),
    display_name: z.string(),
    handle: z.string(),
    profile_description: z.string(),
    clips: z.array(UserSongSchema),
    stats: z.union([
        z.object({
            upvote_count__sum: z.number(),
            play_count__sum: z.number(),
            followers_count: z.number(),
            following_count: z.number(),
        }),
        z.object({}).strict(),
    ]),
    is_flagged: z.boolean(),
    is_following: z.boolean(),
    num_total_clips: z.number(),
    current_page: z.number(),
    playlists: z.array(UserPlaylistSchema),
    avatar_image_url: z.string(),
    favorite_songs: z.array(z.unknown()),
    personas: z.array(PersonasSchema),
    user_comments_blocked: z.boolean(),
});

const UserRecentSongSchema = z.object({
    id: z.string(),
    entity_type: z.string(),
    video_url: z.string(),
    audio_url: z.string(),
    image_url: z.string(),
    image_large_url: z.string(),
    major_model_version: z.string(),
    model_name: z.string(),
    metadata: UserMetadataSchema,
    caption: z.string().optional(),
    is_liked: z.boolean(),
    user_id: z.string(),
    display_name: z.string(),
    handle: z.string(),
    is_handle_updated: z.boolean(),
    avatar_image_url: z.string(),
    is_trashed: z.boolean(),
    explicit: z.boolean().optional(),
    created_at: z.string(),
    status: z.string(),
    title: z.string(),
    play_count: z.number(),
    upvote_count: z.number(),
});

export const UserRecentSchema = z.object({
    user_id: z.string(),
    display_name: z.string(),
    handle: z.string(),
    clips: z.array(UserRecentSongSchema),
});

export type User = z.infer<typeof UserSchema>;
export type UserSong = z.infer<typeof UserSongSchema>;
export type UserSongMetadata = z.infer<typeof UserMetadataSchema>;
export type UserPlaylist = z.infer<typeof UserPlaylistSchema>;
export type UserPersonas = z.infer<typeof PersonasSchema>;

export type UserRecent = z.infer<typeof UserRecentSchema>;
export type UserRecentSong = z.infer<typeof UserRecentSongSchema>;
export type UserRecentSongMetadata = z.infer<typeof UserMetadataSchema>;
