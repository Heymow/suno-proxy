import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { Request, Response } from 'express';
import { getUserInfo } from '../../controllers/userController';
import { fetchAndCache } from '../../utils/fetchAndCache';
import { UserInfoResponseSchema } from '../../schemas/userInfoSchema';

vi.mock('../../utils/fetchAndCache', () => ({
    fetchAndCache: vi.fn()
}));

describe('getUserInfo', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let jsonMock: Mock;
    let statusMock: Mock;

    beforeEach(() => {
        vi.clearAllMocks();
        jsonMock = vi.fn();
        statusMock = vi.fn().mockReturnValue({ json: jsonMock });
        req = {
            params: {},
            query: {}
        };
        res = {
            json: jsonMock,
            status: statusMock
        };
    });

    it('should fetch and return user info', async () => {
        req.params = { handle: 'draystation' };
        const mockResponse = {
            cover_photo_url: "https://cdn1.suno.ai/b9d59cde.webp",
            user_inputted_genres: ["Rap"],
            section_order: ["hooks"],
            spotify_link: "open.spotify.com/artist/4IV82Sy3wa0My09391S4WF",
            x_link: "https://x.com/Dray_AI",
            youtube_link: "https://www.youtube.com/@DrayStation"
        };

        (fetchAndCache as Mock).mockResolvedValue(mockResponse);

        await getUserInfo(req as Request, res as Response);

        expect(fetchAndCache).toHaveBeenCalledWith(expect.objectContaining({
            cacheType: 'user_info',
            id: 'draystation',
            url: expect.stringContaining('/draystation/info'),
            schema: UserInfoResponseSchema,
            httpCacheOptions: { ttl: 3600 }
        }));
        expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

    it('should handle missing handle', async () => {
        req.params = {};
        await getUserInfo(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({ error: 'Missing handle' });
    });

    it('should handle errors from fetchAndCache', async () => {
        req.params = { handle: 'draystation' };
        const mockError = { error: 'Failed to fetch', statusCode: 502 };
        (fetchAndCache as Mock).mockResolvedValue(mockError);

        await getUserInfo(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(502);
        expect(jsonMock).toHaveBeenCalledWith({ error: 'Failed to fetch' });
    });

    it('should pass forceRefresh parameter', async () => {
        req.params = { handle: 'draystation' };
        req.query = { refresh: 'true' };
        const mockResponse = {
            cover_photo_url: "url"
        };
        (fetchAndCache as Mock).mockResolvedValue(mockResponse);

        await getUserInfo(req as Request, res as Response);

        expect(fetchAndCache).toHaveBeenCalledWith(expect.objectContaining({
            forceRefresh: true
        }));
    });
});
