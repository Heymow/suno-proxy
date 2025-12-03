import {
    extendZodWithOpenApi
} from '@asteasolutions/zod-to-openapi';
import { z } from "zod";

extendZodWithOpenApi(z);

const ClipMetadataSchema = z.object({
    tags: z.string().optional(),
    prompt: z.string().optional(),
    concat_history: z.array(z.object({
        id: z.string(),
        type: z.string().optional(),
        infill: z.boolean().optional(),
        source: z.string().optional(),
        continue_at: z.number().optional(),
        infill_dur_s: z.number().optional(),
        infill_end_s: z.number().optional(),
        infill_lyrics: z.string().optional(),
        infill_start_s: z.number().optional(),
        include_future_s: z.number().optional(),
        include_history_s: z.number().optional(),
        infill_context_end_s: z.number().optional(),
        infill_context_start_s: z.number().optional(),
    })).optional(),
    edited_clip_id: z.string().optional(),
    type: z.string().optional(),
    duration: z.number().optional(),
    refund_credits: z.boolean().optional(),
    stream: z.boolean().optional(),
    upsample_clip_id: z.string().optional(),
    task: z.string().optional(),
    persona_id: z.string().optional(),
    edit_session_id: z.string().optional(),
    can_remix: z.boolean().optional(),
    is_remix: z.boolean().optional(),
    priority: z.number().optional(),
});

export const SongResponseSchema = z.object({
    id: z.string(),
    entity_type: z.string(),
    video_url: z.string(),
    audio_url: z.string(),
    image_url: z.string(),
    image_large_url: z.string(),
    major_model_version: z.string(),
    model_name: z.string(),
    metadata: ClipMetadataSchema.optional(),
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
    display_tags: z.string().optional(),
    created_at: z.string(),
    status: z.string(),
    title: z.string(),
    play_count: z.number(),
    upvote_count: z.number(),
    is_public: z.boolean(),
    allow_comments: z.boolean()
}).openapi({
    description: "Response schema for song",
    required: ["id", "entity_type", "video_url", "audio_url", "image_url", "image_large_url", "major_model_version", "model_name", "metadata", "is_liked", "user_id", "display_name", "handle", "is_handle_updated", "avatar_image_url", "is_trashed", "comment_count", "flag_count", "created_at", "status", "title", "play_count", "upvote_count", "is_public", "allow_comments"],
    example: {
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
            concat_history: [
                {
                    id: "2619926b-bbb6-449d-9072-bded6177f3a0",
                    type: "edit_crop",
                    infill: true,
                    source: "web",
                    infill_dur_s: 22.6,
                    infill_end_s: 244.16,
                    infill_lyrics: "[outro]\nyou are not the only one[End]",
                    infill_start_s: 221.56,
                    include_future_s: 2,
                    include_history_s: 2,
                    infill_context_end_s: 244.16,
                    infill_context_start_s: 191.56
                }
            ],
            type: "concat_infilling",
            duration: 244.84,
            edit_session_id: "2619926b-bbb6-449d-9072-bded6177f3a0",
            can_remix: true,
            is_remix: false
        },
        is_liked: true,
        user_id: "f7f434fd-0605-4721-8485-b0c4f1e5a2d3",
        display_name: "John Doe",
        handle: "johndoe",
        is_handle_updated: false,
        avatar_image_url: "https://example.com/avatar.jpg",
        is_trashed: false,
        comment_count: 10,
        flag_count: 0,
        display_tags: "pop, rock, electronic",
        created_at: "2024-04-16T18:11:01.938Z",
        status: "complete",
        title: "Song Title",
        play_count: 1000,
        upvote_count: 100,
        is_public: true,
        allow_comments: true
    },
});

const CommentSchema = z.object({
    id: z.string(),
    clip_id: z.string(),
    user_id: z.string(),
    user_display_name: z.string(),
    user_handle: z.string(),
    user_avatar_url: z.string(),
    user_comments_blocked: z.boolean(),
    content: z.string(),
    created_at: z.string(),
    num_likes: z.number(),
    num_replies: z.number().optional(),
    replies: z.array(z.object({
        id: z.string(),
        user_id: z.string(),
        user_display_name: z.string(),
        user_handle: z.string(),
        user_avatar_url: z.string(),
        user_comments_blocked: z.boolean(),
        content: z.string(),
        created_at: z.string(),
        num_likes: z.number()
    })).optional()
});

export const CommentsResponseSchema = z.object({
    next_cursor: z.string().optional(),
    results: z.array(CommentSchema),
    allow_comment: z.boolean(),
    total_count: z.number(),
}).openapi({
    description: "Response schema for comments",
    required: ["next_cursor", "results", "allow_comment", "total_count"],
    example: {
        next_cursor: "string",
        results: [
            {
                id: "2619926b-bbb6-449d-9072-bded6177f3a0",
                clip_id: "2619926b-bbb6-449d-9072-bded6177f3a0",
                user_id: "f7f434fd-0605-4721-8485-b0c4f1e5a2d3",
                user_display_name: "John Doe",
                user_handle: "johndoe",
                user_avatar_url: "https://example.com/avatar.jpg",
                user_comments_blocked: true,
                content: "❤️❤️❤️❤️",
                created_at: "2024-04-16T18:11:01.938Z",
                num_likes: 2,
                num_replies: 1,
                replies: [
                    {
                        id: "2619926b-bbb6-449d-9072-bded6177f3a0",
                        user_id: "f7f434fd-0605-4721-8485-b0c4f1e5a2d3",
                        user_display_name: "John Doe",
                        user_handle: "johndoe",
                        user_avatar_url: "https://example.com/avatar.jpg",
                        user_comments_blocked: true,
                        content: "Thanks a lot ❤️",
                        created_at: "2024-04-16T18:11:01.938Z",
                        num_likes: 2
                    }
                ]
            }
        ],
        allow_comment: true,
        total_count: 2,
    },
});


export type Song = z.infer<typeof SongResponseSchema>;
export type SongMetadata = z.infer<typeof ClipMetadataSchema>;

export type CommentsResponse = z.infer<typeof CommentsResponseSchema>;
export type Comment = z.infer<typeof CommentSchema>;