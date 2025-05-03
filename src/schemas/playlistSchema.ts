import {
    extendZodWithOpenApi
} from '@asteasolutions/zod-to-openapi';
import { z } from "zod";

extendZodWithOpenApi(z);

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
}).openapi({
    description: "Playlist response schema",
    required: ["entity_type", "id", "playlist_clips", "num_total_results", "current_page", "is_owned", "is_trashed", "is_public", "upvote_count", "dislike_count", "flag_count", "skip_count", "play_count", "name", "description", "is_discover_playlist"],
    example: {
        entity_type: "playlist_schema",
        id: "2619926b-bbb6-449d-9072-bded6177f3a0",
        playlist_clips: [
            {
                clip: {
                    id: "2619926b-bbb6-449d-9072-bded6177f3a0",
                    entity_type: "song_schema",
                    video_url: "https://example.com/video.mp4",
                    audio_url: "https://example.com/audio.mp3",
                    image_url: "https://example.com/image.jpg",
                    image_large_url: "https://example.com/image_large.jpg",
                    major_model_version: "v4",
                    model_name: "chirp-v4",
                    metadata: {
                        tags: "pop, rock, electronic",
                        prompt: "Generate a clip about nature",
                        edited_clip_id: "2619926b-bbb6-449d-9072-bded6177f3a0",
                        type: "audio",
                        duration: 120,
                        edit_session_id: "2619926b-bbb6-449d-9072-bded6177f3a0",
                        can_remix: true,
                        is_remix: false
                    },
                    caption: "This is a sample clip caption.",
                    is_liked: false,
                    user_id: "f7f434fd-0605-4721-8485-b0c4f1e5a2d3",
                    display_name: "John Doe",
                    handle: "johndoe",
                    is_handle_updated: false,
                    avatar_image_url: "https://example.com/avatar.jpg",
                    is_trashed: false,
                    explicit: false,
                    comment_count: 10,
                    flag_count: 0,
                    created_at: new Date().toISOString(),
                    status: "active",
                    title: "Song Title",
                    play_count: 1000,
                    upvote_count: 100,
                    is_public: true,
                    allow_comments: true
                },
                relative_index: 0
            }
        ],
        image_url: "https://example.com/playlist_image.jpg",
        num_total_results: 1,
        current_page: 1,
        is_owned: true,
        is_trashed: false,
        is_public: true,
        user_display_name: "John Doe",
        user_handle: "@johndoe",
        user_avatar_image_url: "https://example.com/avatar.jpg",
        upvote_count: 100,
        dislike_count: 0,
        flag_count: 0,
        skip_count: 0,
        play_count: 1000,
        name: "My Playlist",
        description: "This is a sample playlist description.",
        is_discover_playlist: false,
        song_count: 1
    },
});


export type Playlist = z.infer<typeof PlaylistResponseSchema>;
export type PlaylistClipsSection = z.infer<typeof PlaylistClipSchema>;
export type PlaylistClip = z.infer<typeof ClipSchema>;
export type PlaylistClipMetadata = z.infer<typeof ClipMetadataSchema>;