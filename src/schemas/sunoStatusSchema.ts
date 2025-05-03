import { trendingStatus } from '../swagger/example_responses/trending_status.js';
import {
    extendZodWithOpenApi
} from '@asteasolutions/zod-to-openapi';
import { z } from "zod";

extendZodWithOpenApi(z);

const TrendingFeedMetadataSchema = z.object({
    feed_metadata_type: z.string(),
    language: z.string().optional(),
    language_text: z.string().optional(),
    lang_map_keys: z.array(z.string()).optional(),
    ranking_map_keys: z.array(z.string()).optional(),
    rank_text: z.string().optional(),
});

const MetadataSchema = z.object({
    tags: z.string().optional(),
    prompt: z.string().optional(),
    concat_history: z.array(z.any()).optional(),
    type: z.string().optional(),
    duration: z.number().optional(),
    edit_session_id: z.string().optional(),
    can_remix: z.boolean().optional(),
    is_remix: z.boolean().optional(),
    refund_credits: z.boolean().optional(),
    stream: z.boolean().optional(),
    priority: z.number().optional(),
    is_audio_upload_tos_accepted: z.boolean().optional(),
    gpt_description_prompt: z.string().optional(),
    cover_clip_id: z.string().optional(),
    upsample_clip_id: z.string().optional(),
    task: z.string().optional(),
    free_quota_category: z.string().optional(),
    has_vocal: z.boolean().optional(),
    negative_tags: z.string().optional(),
    artist_clip_id: z.string().optional(),
    persona_id: z.string().optional(),
    video_upload_width: z.number().optional(),
    video_upload_height: z.number().optional(),
    edited_clip_id: z.string().optional(),
});

const SongItemSchema = z.object({
    id: z.string(),
    entity_type: z.string(),
    video_url: z.string().optional(),
    video_cover_url: z.string().optional(),
    preview_url: z.string().optional(),
    audio_url: z.string().optional(),
    image_url: z.string().optional(),
    image_large_url: z.string().optional(),
    major_model_version: z.string().optional(),
    model_name: z.string().optional(),
    metadata: MetadataSchema.optional(),
    caption: z.string().optional(),
    is_liked: z.boolean().optional(),
    user_id: z.string().optional(),
    display_name: z.string().optional(),
    handle: z.string().optional(),
    is_handle_updated: z.boolean().optional(),
    avatar_image_url: z.string().optional(),
    is_trashed: z.boolean().optional(),
    explicit: z.boolean().optional(),
    comment_count: z.number().optional(),
    flag_count: z.number().optional(),
    created_at: z.string().optional(),
    status: z.string().optional(),
    title: z.string().optional(),
    play_count: z.number().optional(),
    upvote_count: z.number().optional(),
    is_public: z.boolean().optional(),
    allow_comments: z.boolean().optional(),
    display_tags: z.string().optional(),
});

export const PlaylistItemSchema = z.object({
    id: z.string(),
    entity_type: z.string().optional(),
    image_url: z.string().optional(),
    playlist_clips: z.array(z.any()).optional(),
    current_page: z.number().optional(),
    num_total_results: z.number().optional(),
    is_owned: z.boolean().optional(),
    is_trashed: z.boolean().optional(),
    is_public: z.boolean().optional(),
    user_display_name: z.string().optional(),
    user_handle: z.string().optional(),
    user_avatar_image_url: z.string().optional(),
    upvote_count: z.number().optional(),
    dislike_count: z.number().optional(),
    flag_count: z.number().optional(),
    skip_count: z.number().optional(),
    play_count: z.number().optional(),
    song_count: z.number().optional(),
    name: z.string()
        .optional()
        .transform(val => {
            if (!val) return val;
            return val.replace(/^"(.*)"$/, '$1');
        }),
    description: z.string().optional(),
    is_discover_playlist: z.boolean().optional(),
});

const StyleItemSchema = z.object({
    id: z.string(),
    entity_type: z.string().optional(),
    name: z.string(),
    image_url: z.string(),
});

const FeedItemSchema = z.object({
    id: z.string(),
    title: z.string(),
    link: z.string(),
    mobile_link: z.string(),
    items: z.array(
        z.union([
            SongItemSchema,
            PlaylistItemSchema,
            StyleItemSchema,
        ])
    ),
    item_type: z.string(),
})

const SectionSchema = z.object({
    title: z.string(),
    id: z.string(),
    section_name: z.string().optional(),
    section_type: z.string(),
    style_type: z.string().optional(),
    link: z.string().optional(),
    items: z.array(
        z.union([
            SongItemSchema,
            PlaylistItemSchema,
            StyleItemSchema,
            FeedItemSchema,
        ])
    ),
    item_type: z.string().optional(),
    preview_items_count: z.number().optional(),
    feed_metadata: TrendingFeedMetadataSchema.optional(),
    feed_metadata_type: z.string().optional(),
});

export const SunoStatusResponseSchema = z.object({
    sections: z.array(SectionSchema),
    page: z.number().optional(),
    total_sections: z.number().optional(),
    page_size: z.number().optional(),
    start_index: z.number().optional(),
}).openapi({
    description: "Suno status response schema",
    required: ["sections"],
    example: trendingStatus
});

export type SunoStatus = z.infer<typeof SunoStatusResponseSchema>;

export type SunoStatusSection = z.infer<typeof SectionSchema>;
export type SunoStatusItem = z.infer<typeof FeedItemSchema>;
export type SunoStatusSongItem = z.infer<typeof SongItemSchema>;
export type SunoStatusPlaylistItem = z.infer<typeof PlaylistItemSchema>;
export type SunoStatusStyleItem = z.infer<typeof StyleItemSchema>;
export type SunoStatusMetadata = z.infer<typeof MetadataSchema>;
export type SunoStatusTrendingFeedMetadata = z.infer<typeof TrendingFeedMetadataSchema>;