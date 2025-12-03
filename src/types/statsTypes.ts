import { ObjectId } from 'mongodb';

export interface TrendingStats {
    play_count: number;
    upvote_count: number;
    comment_count: number;
}

export interface TrendingHistory {
    _id?: ObjectId;
    songId: string;
    listId: string; // e.g., "trending", "genre_techno"
    enteredAt: Date;
    exitedAt?: Date;
    rankAtEntry: number;
    statsAtEntry: TrendingStats;
    statsAtExit?: TrendingStats;
    durationInList?: number; // in milliseconds, calculated at exit
}

export interface SongSnapshot {
    _id?: ObjectId;
    songId: string;
    timestamp: Date;
    play_count: number;
    upvote_count: number;
    comment_count: number;
    trending_lists: string[]; // Lists the song is currently in
}
