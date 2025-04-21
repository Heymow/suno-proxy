import { PlaylistResponseSchema } from "../schemas/playlistSchema";
import { PlaylistData } from "../types/playlistTypes";

export function buildPlaylistDataFromApi(data: unknown): PlaylistData {
    const parseResult = PlaylistResponseSchema.safeParse(data);

    if (!parseResult.success) {
        console.error("Error in Playlist API response:", parseResult.error.format());
        throw new Error("Invalid Playlist response format");
    }

    const playlist = parseResult.data;

    return {
        ...playlist,
        total_pages: Math.ceil(playlist.num_total_results / 50),
        total_clips: playlist.num_total_results
    };
}
