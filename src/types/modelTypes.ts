import { Song } from "@/schemas/songSchema";

/**
 * Interface pour le modèle de chanson en base de données
 * @interface SongDocument
 * @extends Song
 * @property {string} _id - ID de la chanson
 * @property {Date} cachedAt - Date de mise en cache
 * @property {Date} updatedAt - Date de mise à jour
 * @property {Date} createdAt - Date de création
 */
export interface SongDocument extends Song {
    _id: string;
    cachedAt: Date;
    updatedAt: Date;
    createdAt: Date;
}

// Définir les champs modifiables
export type ModifiableRootField =
    | 'video_url'
    | 'audio_url'
    | 'image_url'
    | 'image_large_url'
    | 'caption'
    | 'is_liked'
    | 'explicit'
    | 'comment_count'
    | 'flag_count'
    | 'title'
    | 'play_count'
    | 'upvote_count'
    | 'is_public'
    | 'allow_comments';

export type ModifiableMetadataField =
    | 'metadata.prompt'
    | 'metadata.can_remix';

/**
 * Type pour les champs modifiables
    * @type ModifiableField
    * @description Représente les champs modifiables d'une chanson
 */
export type ModifiableField = ModifiableRootField | ModifiableMetadataField;

/**
 * Interface pour les changements de chanson
 * @interface SongChange
 * @property {string} songId - ID de la chanson
 * @property {Date} timestamp - Date du changement
 * @property {Array<{ field: ModifiableField; oldValue: any }>} changes - Liste des changements effectués
 */
export interface SongChange {
    songId: string;
    timestamp: Date;
    changes: {
        field: ModifiableField;
        oldValue: any;
    }[];
}