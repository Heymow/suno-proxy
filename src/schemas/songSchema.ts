import { z } from "zod";

const ClipMetadataSchema = z.object({
    tags: z.string(),
    prompt: z.string(),
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
    type: z.string(),
    duration: z.number(),
    refund_credits: z.boolean().optional(),
    stream: z.boolean().optional(),
    upsample_clip_id: z.string().optional(),
    task: z.string().optional(),
    persona_id: z.string().optional(),
    edit_session_id: z.string().optional(),
    can_remix: z.boolean(),
    is_remix: z.boolean(),
    priority: z.number().optional(),
});

export const ClipSchema = z.object({
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

export const CommentSchemaResponse = z.object({
    next_cursor: z.string().optional(),
    results: z.array(CommentSchema),
    allow_comment: z.boolean(),
    total_count: z.number(),
});

export type Song = z.infer<typeof ClipSchema>;
export type SongMetadata = z.infer<typeof ClipMetadataSchema>;

export type CommentsResponse = z.infer<typeof CommentSchemaResponse>;
export type Comment = z.infer<typeof CommentSchema>;