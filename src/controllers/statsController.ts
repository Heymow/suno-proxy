import { Request, Response } from 'express';
import { getDb } from '../models/connection.js';
import { SongDocument } from '../types/modelTypes.js';
import { TrendingHistory } from '../types/statsTypes.js';

export const getGlobalStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const db = await getDb();
        const collection = db.collection<SongDocument>('songs');

        // Basic stats from DB
        const totalSongs = await collection.countDocuments();

        // Aggregation for engagement and duration
        const [stats] = await collection.aggregate([
            {
                $group: {
                    _id: null,
                    totalPlays: { $sum: "$play_count" },
                    totalUpvotes: { $sum: "$upvote_count" },
                    avgDuration: { $avg: "$metadata.duration" }
                }
            }
        ]).toArray();

        res.json({
            total_songs: totalSongs,
            total_plays: stats?.totalPlays || 0,
            total_upvotes: stats?.totalUpvotes || 0,
            avg_duration: stats?.avgDuration || 0
        });
    } catch (error) {
        console.error('Error getting global stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getTrends = async (req: Request, res: Response): Promise<void> => {
    try {
        const db = await getDb();
        const collection = db.collection<SongDocument>('songs');
        const window = req.query.window === '7d' ? 7 : 1; // Default 24h

        const limit = parseInt(req.query.limit as string) || 10;

        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - window);

        // Aggregate tags
        const tags = await collection.aggregate([
            { $match: { created_at: { $gte: dateLimit.toISOString() } } },
            { $unwind: "$display_tags" }, // display_tags is a string, might need splitting if comma separated
            // Actually display_tags is a string like "tag1, tag2". We need to split it.
            // But MongoDB split is tricky in older versions. 
            // Let's assume we can use regex or just group by the whole string if it's a genre.
            // Better: use metadata.tags if it's an array? No, metadata.tags is also string.
            // Let's try to split by comma if possible, or just count exact matches for now.
            // For robust tag analysis, we might need a better data structure or text search.
            // Let's stick to simple grouping for now or use a regex to extract.
            {
                $project: {
                    tags: { $split: ["$display_tags", ", "] }
                }
            },
            { $unwind: "$tags" },
            {
                $group: {
                    _id: "$tags",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: limit }
        ]).toArray();

        res.json({
            window: `${window}d`,
            top_tags: tags.map(t => ({ tag: t._id, count: t.count }))
        });
    } catch (error) {
        console.error('Error getting trends:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getTrendingListStats = async (req: Request, res: Response): Promise<void> => {
    const listId = req.params.listId;
    try {
        const db = await getDb();
        const historyCollection = db.collection<TrendingHistory>('trending_history');

        // 1. Active Songs Stats
        const activeStats = await historyCollection.aggregate([
            { $match: { listId, exitedAt: { $exists: false } } },
            {
                $group: {
                    _id: null,
                    avgRank: { $avg: "$rankAtEntry" },
                    minPlays: { $min: "$statsAtEntry.play_count" },
                    avgPlays: { $avg: "$statsAtEntry.play_count" },
                    minUpvotes: { $min: "$statsAtEntry.upvote_count" },
                    avgUpvotes: { $avg: "$statsAtEntry.upvote_count" },
                    count: { $sum: 1 }
                }
            }
        ]).toArray();

        // 2. Lifecycle Stats (Exited songs)
        const lifecycleStats = await historyCollection.aggregate([
            { $match: { listId, exitedAt: { $exists: true } } },
            {
                $group: {
                    _id: null,
                    avgDurationMs: { $avg: "$durationInList" },
                    count: { $sum: 1 }
                }
            }
        ]).toArray();

        // 3. Common DNA (Tags of active songs)
        // We need to join with songs collection to get tags
        const commonDna = await historyCollection.aggregate([
            { $match: { listId, exitedAt: { $exists: false } } },
            {
                $lookup: {
                    from: "songs",
                    localField: "songId",
                    foreignField: "_id",
                    as: "song"
                }
            },
            { $unwind: "$song" },
            {
                $project: {
                    tags: { $split: ["$song.display_tags", ", "] }
                }
            },
            { $unwind: "$tags" },
            {
                $group: {
                    _id: "$tags",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]).toArray();

        const totalActive = activeStats[0]?.count || 0;

        res.json({
            list_id: listId,
            active_count: totalActive,
            entry_thresholds: {
                min_plays: activeStats[0]?.minPlays || 0,
                min_upvotes: activeStats[0]?.minUpvotes || 0,
            },
            averages: {
                plays: Math.round(activeStats[0]?.avgPlays || 0),
                upvotes: Math.round(activeStats[0]?.avgUpvotes || 0),
            },
            lifecycle: {
                avg_duration_minutes: Math.round((lifecycleStats[0]?.avgDurationMs || 0) / 1000 / 60),
                sample_size: lifecycleStats[0]?.count || 0
            },
            common_dna: commonDna.map(t => ({
                tag: t._id,
                count: t.count,
                percentage: totalActive > 0 ? Math.round((t.count / totalActive) * 100) : 0
            }))
        });
    } catch (error) {
        console.error('Error getting trending list stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getTopUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const db = await getDb();
        const collection = db.collection<SongDocument>('songs');

        const topUsers = await collection.aggregate([
            {
                $group: {
                    _id: "$user_id",
                    handle: { $first: "$handle" },
                    displayName: { $first: "$display_name" },
                    avatarUrl: { $first: "$avatar_image_url" },
                    totalSongs: { $sum: 1 },
                    totalUpvotes: { $sum: "$upvote_count" },
                    totalPlays: { $sum: "$play_count" }
                }
            },
            { $sort: { totalUpvotes: -1 } },
            { $limit: 10 }
        ]).toArray();

        res.json(topUsers);
    } catch (error) {
        console.error('Error getting top users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
