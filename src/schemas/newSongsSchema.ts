import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from "zod";
import { SongResponseSchema } from './songSchema.js';

extendZodWithOpenApi(z);

export const NewSongsResponseSchema = z.object({
    entity_type: z.string(),
    id: z.string(),
    name: z.string(),
    playlist_clips: z.array(z.object({
        clip: SongResponseSchema
    })),
}).openapi({
    description: "Response schema for new songs playlist",
    example: {
        entity_type: "playlist_schema",
        id: "new_songs",
        name: "New Songs",
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
                        type: "concat_infilling",
                        duration: 244.84,
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
                    created_at: "2024-04-16T18:11:01.938Z",
                    status: "complete",
                    title: "Song Title",
                    play_count: 1000,
                    upvote_count: 100,
                    is_public: true,
                    allow_comments: true
                }
            }
        ]
    }
});

export type NewSongsResponse = z.infer<typeof NewSongsResponseSchema>;
