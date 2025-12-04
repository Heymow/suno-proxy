import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response } from 'express';
import { getGlobalStats, getTrends, getTrendingListStats, getTopUsers } from '../../controllers/statsController.js';
import { pollTrendingLists } from '../../services/trendingPoller.js';
import * as dbConnection from '../../models/connection.js';
import * as fetchAndCacheModule from '../../utils/fetchAndCache.js';
import * as statsModel from '../../models/statsModel.js';

// Mock dependencies
vi.mock('../../models/connection.js');
vi.mock('../../utils/fetchAndCache.js');
vi.mock('../../models/statsModel.js');

describe('Stats Controller', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let jsonMock: any;
    let statusMock: any;
    let mockDb: any;
    let mockCollection: any;

    beforeEach(() => {
        jsonMock = vi.fn();
        statusMock = vi.fn().mockReturnValue({ json: jsonMock });
        res = {
            json: jsonMock,
            status: statusMock
        };
        req = {};

        mockCollection = {
            countDocuments: vi.fn(),
            aggregate: vi.fn().mockReturnThis(),
            toArray: vi.fn()
        };
        mockDb = {
            collection: vi.fn().mockReturnValue(mockCollection)
        };
        vi.spyOn(dbConnection, 'getDb').mockResolvedValue(mockDb);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('getGlobalStats', () => {
        it('should return global stats', async () => {
            mockCollection.countDocuments.mockResolvedValue(100);
            mockCollection.toArray.mockResolvedValue([{
                totalPlays: 500,
                totalUpvotes: 50,
                avgDuration: 200
            }]);

            await getGlobalStats(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith({
                total_songs: 100,
                total_plays: 500,
                total_upvotes: 50,
                avg_duration: 200
            });
        });
    });

    describe('getTrends', () => {
        it('should return top tags', async () => {
            req.query = { window: '1d' };
            mockCollection.toArray.mockResolvedValue([
                { _id: 'pop', count: 10 },
                { _id: 'rock', count: 5 }
            ]);

            await getTrends(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith({
                window: '1d',
                top_tags: [
                    { tag: 'pop', count: 10 },
                    { tag: 'rock', count: 5 }
                ]
            });
        });
    });

    describe('getTrendingListStats', () => {
        it('should return trending list stats', async () => {
            req.params = { listId: 'trending' };

            // Mock multiple aggregate calls
            mockCollection.toArray
                .mockResolvedValueOnce([{ // Active stats
                    avgRank: 5,
                    minPlays: 100,
                    avgPlays: 500,
                    minUpvotes: 10,
                    avgUpvotes: 50,
                    count: 20
                }])
                .mockResolvedValueOnce([{ // Lifecycle stats
                    avgDurationMs: 600000,
                    count: 5
                }])
                .mockResolvedValueOnce([ // Common DNA
                    { _id: 'pop', count: 15 },
                    { _id: 'rock', count: 5 }
                ]);

            await getTrendingListStats(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                list_id: 'trending',
                active_count: 20,
                averages: { plays: 500, upvotes: 50 },
                lifecycle: { avg_duration_minutes: 10, sample_size: 5 },
                common_dna: expect.arrayContaining([
                    { tag: 'pop', count: 15, percentage: 75 },
                    { tag: 'rock', count: 5, percentage: 25 }
                ])
            }));
        });
    });

    describe('getTopUsers', () => {
        it('should return top users', async () => {
            mockCollection.aggregate.mockReturnThis();
            mockCollection.toArray.mockResolvedValue([
                { _id: 'user1', total_plays: 1000, total_upvotes: 500, song_count: 5 },
                { _id: 'user2', total_plays: 800, total_upvotes: 300, song_count: 3 }
            ]);

            await getTopUsers(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith([
                { _id: 'user1', total_plays: 1000, total_upvotes: 500, song_count: 5 },
                { _id: 'user2', total_plays: 800, total_upvotes: 300, song_count: 3 }
            ]);
        });
    });
});

describe('Trending Poller', () => {
    it('should poll lists and record entries', async () => {
        // Mock fetchAndCache to return some songs
        vi.spyOn(fetchAndCacheModule, 'fetchAndCache').mockResolvedValue({
            playlist_clips: [
                { clip: { id: 'song1', play_count: 100, upvote_count: 10 } },
                { clip: { id: 'song2', play_count: 200, upvote_count: 20 } }
            ]
        } as any);

        // Mock getActiveTrendingSongs to return empty (all new)
        vi.spyOn(statsModel, 'getActiveTrendingSongs').mockResolvedValue([]);

        await pollTrendingLists();

        // Should record entry for both songs
        expect(statsModel.recordTrendingEntry).toHaveBeenCalledTimes(10); // 5 lists * 2 songs
        expect(statsModel.saveSongSnapshot).toHaveBeenCalledTimes(10);
    });

    it('should detect exits', async () => {
        // Mock fetchAndCache to return empty list
        vi.spyOn(fetchAndCacheModule, 'fetchAndCache').mockResolvedValue({
            playlist_clips: []
        } as any);

        // Mock getActiveTrendingSongs to return one song (which is now missing)
        vi.spyOn(statsModel, 'getActiveTrendingSongs').mockResolvedValue(['song1']);

        await pollTrendingLists();

        // Should record exit for song1
        expect(statsModel.recordTrendingExit).toHaveBeenCalledTimes(5); // 5 lists * 1 song
    });
});
