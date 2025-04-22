import { PlaylistClipMetadata } from './clipTypes.js';

export interface Clip {
    id: string;
    entity_type: string;
    video_url: string;
    audio_url: string;
    image_url: string;
    image_large_url: string;
    major_model_version: string;
    model_name: string;
    metadata: PlaylistClipMetadata;
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
    title: string;
    play_count: number;
    upvote_count: number;
    is_public: boolean;
    allow_comments: boolean;
}

export interface PlaylistClip {
    clip: Clip;
    relative_index: number;
}

export interface PlaylistData {
    user_display_name: string;
    user_handle: string;
    user_avatar_image_url: string;
    upvote_count: number;
    dislike_count: number;
    flag_count: number;
    skip_count: number;
    play_count: number;
    name: string;
    description: string;
    is_discover_playlist: boolean;
    song_count: number;
    image_url: string;
    num_total_results: number;
    current_page: number;
    is_owned: boolean;
    is_trashed: boolean;
    is_public: boolean;
    playlist_clips: PlaylistClip[];
    total_clips: number;
    total_pages: number;
}
