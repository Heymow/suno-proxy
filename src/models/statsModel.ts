import { getDb } from './connection.js';
import { TrendingHistory, SongSnapshot, TrendingStats } from '../types/statsTypes.js';
import { handleMongoError } from '../utils/errorHandler.js';

/**
 * Enregistre l'entrée d'une chanson dans une liste de tendances
 */
export async function recordTrendingEntry(
    songId: string,
    listId: string,
    rank: number,
    stats: TrendingStats
): Promise<void> {
    try {
        const db = await getDb();
        const collection = db.collection<TrendingHistory>('trending_history');

        // Vérifier si une entrée active existe déjà pour éviter les doublons
        const activeEntry = await collection.findOne({
            songId,
            listId,
            exitedAt: { $exists: false }
        });

        if (!activeEntry) {
            await collection.insertOne({
                songId,
                listId,
                enteredAt: new Date(),
                rankAtEntry: rank,
                statsAtEntry: stats
            });
        }
    } catch (error) {
        handleMongoError('recordTrendingEntry', `stats/${songId}`, error);
    }
}

/**
 * Enregistre la sortie d'une chanson d'une liste de tendances
 */
export async function recordTrendingExit(
    songId: string,
    listId: string,
    stats: TrendingStats
): Promise<void> {
    try {
        const db = await getDb();
        const collection = db.collection<TrendingHistory>('trending_history');

        const now = new Date();

        // Trouver l'entrée active
        const activeEntry = await collection.findOne({
            songId,
            listId,
            exitedAt: { $exists: false }
        });

        if (activeEntry) {
            const duration = now.getTime() - activeEntry.enteredAt.getTime();

            await collection.updateOne(
                { _id: activeEntry._id },
                {
                    $set: {
                        exitedAt: now,
                        statsAtExit: stats,
                        durationInList: duration
                    }
                }
            );
        }
    } catch (error) {
        handleMongoError('recordTrendingExit', `stats/${songId}`, error);
    }
}

/**
 * Sauvegarde un snapshot des stats d'une chanson
 */
export async function saveSongSnapshot(
    songId: string,
    stats: TrendingStats,
    trendingLists: string[]
): Promise<void> {
    try {
        const db = await getDb();
        const collection = db.collection<SongSnapshot>('song_snapshots');

        await collection.insertOne({
            songId,
            timestamp: new Date(),
            play_count: stats.play_count,
            upvote_count: stats.upvote_count,
            comment_count: stats.comment_count,
            trending_lists: trendingLists
        });
    } catch (error) {
        handleMongoError('saveSongSnapshot', `stats/${songId}`, error);
    }
}

/**
 * Récupère les chansons actuellement en trending pour une liste donnée
 */
export async function getActiveTrendingSongs(listId: string): Promise<string[]> {
    try {
        const db = await getDb();
        const collection = db.collection<TrendingHistory>('trending_history');

        const activeEntries = await collection.find({
            listId,
            exitedAt: { $exists: false }
        }).toArray();

        return activeEntries.map(entry => entry.songId);
    } catch (error) {
        handleMongoError('getActiveTrendingSongs', `stats/${listId}`, error);
        return [];
    }
}
