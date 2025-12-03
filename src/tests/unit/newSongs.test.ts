import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { Request, Response } from 'express';
import { getNewSongs } from '../../controllers/songController';
import { fetchAndCache } from '../../utils/fetchAndCache';
import { NewSongsResponseSchema } from '../../schemas/newSongsSchema';

vi.mock('../../utils/fetchAndCache', () => ({
    fetchAndCache: vi.fn()
}));

describe('getNewSongs', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let jsonMock: Mock;
    let statusMock: Mock;

    beforeEach(() => {
        vi.clearAllMocks();
        jsonMock = vi.fn();
        statusMock = vi.fn().mockReturnValue({ json: jsonMock });
        req = {
            query: {}
        };
        res = {
            json: jsonMock,
            status: statusMock
        };
    });

    it('should fetch and return new songs', async () => {
        const mockResponse = {
            entity_type: "playlist_schema",
            id: "new_songs",
            name: "New Songs",
            playlist_clips: []
        };

        (fetchAndCache as Mock).mockResolvedValue(mockResponse);

        await getNewSongs(req as Request, res as Response);

        expect(fetchAndCache).toHaveBeenCalledWith(expect.objectContaining({
            cacheType: 'playlist',
            id: 'new_songs',
            url: 'https://studio-api.prod.suno.com/api/playlist/new_songs',
            schema: NewSongsResponseSchema,
            httpCacheOptions: { ttl: 600 }
        }));
        expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

    it('should handle errors from fetchAndCache', async () => {
        const mockError = { error: 'Failed to fetch', statusCode: 502 };
        (fetchAndCache as Mock).mockResolvedValue(mockError);

        await getNewSongs(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(502);
        expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ error: 'Failed to fetch' }));
    });

    it('should pass forceRefresh parameter', async () => {
        req.query = { refresh: 'true' };
        const mockResponse = {
            entity_type: "playlist_schema",
            id: "new_songs",
            name: "New Songs",
            playlist_clips: []
        };
        (fetchAndCache as Mock).mockResolvedValue(mockResponse);

        await getNewSongs(req as Request, res as Response);

        expect(fetchAndCache).toHaveBeenCalledWith(expect.objectContaining({
            forceRefresh: true
        }));
    });
});
