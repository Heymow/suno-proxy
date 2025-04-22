export interface ClipMetadataBase {
    tags: string;
    prompt: string;
    type: string;
    duration: number;
    can_remix: boolean;
    edit_session_id?: string;
    edited_clip_id?: string;
}

export interface SongClipMetadata extends ClipMetadataBase {
    task?: string;
    refund_credits?: boolean;
    stream?: boolean;
    upsample_clip_id?: string;
    priority?: number;
}

export interface PlaylistClipMetadata extends ClipMetadataBase {
}