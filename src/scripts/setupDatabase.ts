import { getDb, getClient } from '../models/connection.js';
import { fileURLToPath } from 'url';

export async function setupIndexes() {
    try {
        const db = await getDb();

        // Collection songs
        const songsCollection = db.collection('songs');
        await songsCollection.createIndex({ artist: 1, cachedAt: -1 });
        await songsCollection.createIndex({ tags: 1 });
        await songsCollection.createIndex({ cachedAt: 1 });
        await songsCollection.createIndex({ sharedSongId: 1 });

        // Collection changes
        const changesCollection = db.collection('song_changes');
        await changesCollection.createIndex({ songId: 1, timestamp: -1 });

        console.log('✅ Database indexes created successfully');
    } catch (error) {
        console.error('Error creating indexes:', error);
    }
}

const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
    setupIndexes().catch(console.error);
}