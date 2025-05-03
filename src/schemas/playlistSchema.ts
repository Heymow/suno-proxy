import { z } from "zod";

const ClipMetadataSchema = z.object({
    tags: z.string(),
    prompt: z.string(),
    edited_clip_id: z.string().optional(),
    type: z.string(),
    duration: z.number(),
    edit_session_id: z.string().optional(),
    can_remix: z.boolean(),
    is_remix: z.boolean()
});

const ClipSchema = z.object({
    id: z.string(),
    entity_type: z.string(),
    video_url: z.string(),
    audio_url: z.string(),
    image_url: z.string(),
    image_large_url: z.string(),
    major_model_version: z.string(),
    model_name: z.string(),
    metadata: ClipMetadataSchema,
    caption: z.string().optional(),
    is_liked: z.boolean(),
    user_id: z.string(),
    display_name: z.string(),
    handle: z.string(),
    is_handle_updated: z.boolean(),
    avatar_image_url: z.string(),
    is_trashed: z.boolean(),
    explicit: z.boolean().optional(),
    comment_count: z.number(),
    flag_count: z.number(),
    created_at: z.string(),
    status: z.string(),
    title: z.string(),
    play_count: z.number(),
    upvote_count: z.number(),
    is_public: z.boolean(),
    allow_comments: z.boolean()
});

const PlaylistClipSchema = z.object({
    clip: ClipSchema,
    relative_index: z.number()
});

export const PlaylistResponseSchema = z.object({
    entity_type: z.string(),
    id: z.string(),
    playlist_clips: z.array(PlaylistClipSchema),
    image_url: z.string().optional(),
    num_total_results: z.number(),
    current_page: z.number(),
    is_owned: z.boolean(),
    is_trashed: z.boolean(),
    is_public: z.boolean(),
    user_display_name: z.string().optional(),
    user_handle: z.string().optional(),
    user_avatar_image_url: z.string().optional(),
    upvote_count: z.number(),
    dislike_count: z.number(),
    flag_count: z.number(),
    skip_count: z.number(),
    play_count: z.number(),
    name: z.string(),
    description: z.string(),
    is_discover_playlist: z.boolean(),
    song_count: z.number(),
});

export type Playlist = z.infer<typeof PlaylistResponseSchema>;
export type PlaylistClipsSection = z.infer<typeof PlaylistClipSchema>;
export type PlaylistClip = z.infer<typeof ClipSchema>;
export type PlaylistClipMetadata = z.infer<typeof ClipMetadataSchema>;