import { ObjectId, Document as MongoDocument } from 'mongodb';

// Interface pour les documents de playlist
export interface PlaylistDocument extends MongoDocument {
    name: string;
    description?: string;
    userId: any;
    user_id?: any;
    songIds?: any[];
    songs?: any[];
    song_ids?: any[];
    createdAt?: Date;
    created_at?: string | Date;
    updatedAt?: Date;
    updated_at?: string | Date;
}

// De même pour les autres interfaces
export interface TrendDocument extends MongoDocument {
    date: Date;
    topTags?: string[];
    topSongs?: Array<{
        id: string;
        position?: number;
        _index?: number;
        tags?: string[];
    }>;
    createdAt?: Date;
}

export interface UserActivityDocument extends MongoDocument {
    userId: any;
    type: string;
    objectId: any;
    timestamp?: Date;
    createdAt?: Date;
}

// Interface générique pour la configuration d'archivage
export interface ArchiveConfig<T, U> {
    sourceCollection: string;
    archiveCollection: string;
    thresholdDays: number;
    transformer: (doc: T) => U;
    dryRun?: boolean;  // mode simulation
}