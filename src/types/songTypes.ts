export interface ClipMetadata {
    tags: string;
    prompt: string;
    edited_clip_id: string;
    type: string;
    duration: number;
    edit_session_id?: string;
    task?: string;
    can_remix: boolean;
    refund_credits?: boolean;
    stream?: boolean;
    upsample_clip_id?: string;
    priority?: number;
}

export interface ClipDetails {
    id: string;
    title: string;
    entity_type: string;
    video_url: string;
    audio_url: string;
    image_url: string;
    image_large_url: string;
    major_model_version: string;
    model_name: string;
    metadata: ClipMetadata;
    is_liked: boolean;
    user_id: string;
    display_name: string;
    handle: string;
    is_handle_updated: boolean;
    avatar_image_url: string;
    is_trashed: boolean;
    explicit?: boolean;
    comment_count: number;
    flag_count: number;
    created_at: string;
    status: string;
    play_count: number;
    upvote_count: number;
    is_public: boolean;
    allow_comments: boolean;
}