import { getDb } from './connection.js';
import { SongMetadata } from '../schemas/songSchema.js';
import { SongChange, SongDocument, ModifiableField, ModifiableRootField } from '../types/modelTypes.js'
import { handleMongoError } from '../utils/errorHandler.js';
import { DatabaseError } from '../utils/errors.js';


/**
 * Récupère une chanson par son ID
 * @param songId ID de la chanson à récupérer
 * @returns La chanson ou null si non trouvée
 */
export async function findSongById(songId: string): Promise<SongDocument | null> {
    try {
        const db = await getDb();
        const collection = db.collection<SongDocument>('songs');
        return await collection.findOne({ _id: songId });
    } catch (error) {
        console.error(`Erreur lors de la récupération de la chanson ${songId}:`, error);
        handleMongoError('findSongById', `song/${songId}`, error);
    }
}

/**
 * Sauvegarde ou met à jour une chanson dans la base de données
 * @param song Données de la chanson à sauvegarder
 * @returns La chanson sauvegardée
 */
export async function saveSong(song: Omit<SongDocument, 'updatedAt' | 'createdAt'>): Promise<SongDocument> {
    try {
        const db = await getDb();
        const collection = db.collection<SongDocument>('songs');
        const now = new Date();

        const result = await collection.findOneAndUpdate(
            { _id: song._id },
            {
                $set: {
                    ...song,
                    updatedAt: now
                },
                $setOnInsert: { createdAt: now }
            },
            {
                upsert: true,
                returnDocument: 'after'
            }
        );

        if (!result) {
            throw new DatabaseError('saveSong', `song/${song._id}`, undefined, 'Failed to save song, no document returned');
        }

        return result as SongDocument;
    } catch (error) {
        // Capture et gestion des erreurs spécifiques avant de déléguer à handleMongoError
        if (error instanceof DatabaseError) {
            throw error; // Erreur déjà formatée
        }

        console.error(`Erreur lors de la sauvegarde de la chanson ${song._id}:`, error);
        handleMongoError('saveSong', `song/${song._id}`, error);
    }
}

/**
 * Récupère plusieurs chansons par leurs IDs
 * @param songIds Liste des IDs de chansons à récupérer
 * @returns Liste des chansons trouvées
 */
export async function findSongsByIds(songIds: string[]): Promise<SongDocument[]> {
    if (!songIds.length) return [];

    const db = await getDb();
    const collection = db.collection<SongDocument>('songs');

    return collection.find({ _id: { $in: songIds } }).toArray();
}

/**
 * Met à jour une chanson en enregistrant les valeurs précédentes
 * @param songId ID de la chanson à mettre à jour
 * @param updates Valeurs à mettre à jour
 * @returns La chanson mise à jour
 */
export async function updateSongWithHistory(
    songId: string,
    updates: Partial<Pick<SongDocument, ModifiableRootField> & { metadata?: Partial<Pick<SongMetadata, 'prompt' | 'can_remix'>> }>
): Promise<SongDocument> {
    const db = await getDb();
    const songsCollection = db.collection<SongDocument>('songs');
    const changesCollection = db.collection<SongChange>('song_changes');
    // Récupérer l'état actuel
    const currentSong = await songsCollection.findOne({ _id: songId });
    if (!currentSong) throw new Error(`Song ${songId} not found`);

    // Identifier les changements et stocker les anciennes valeurs
    const changes: { field: ModifiableField; oldValue: any }[] = [];

    // Traiter les champs racine (sauf metadata)
    const modifiableFields = Object.keys(updates).filter(
        key => key !== 'metadata'
    ) as ModifiableRootField[];

    modifiableFields.forEach(field => {
        if (updates[field] !== undefined) {
            const oldValue = currentSong[field];
            if (JSON.stringify(oldValue) !== JSON.stringify(updates[field])) {
                changes.push({ field, oldValue });
            }
        }
    });

    // Traiter les champs metadata séparément
    if (updates.metadata) {
        if (updates.metadata.prompt !== undefined &&
            currentSong.metadata?.prompt !== updates.metadata.prompt) {
            changes.push({
                field: 'metadata.prompt',
                oldValue: currentSong.metadata?.prompt
            });
        }

        if (updates.metadata.can_remix !== undefined &&
            currentSong.metadata?.can_remix !== updates.metadata.can_remix) {
            changes.push({
                field: 'metadata.can_remix',
                oldValue: currentSong.metadata?.can_remix
            });
        }
    }

    // Enregistrer les changements s'il y en a
    if (changes.length > 0) {
        await changesCollection.insertOne({
            songId,
            timestamp: new Date(),
            changes
        });
    }

    // Mettre à jour le document principal
    const now = new Date();
    const updateObject: Record<string, any> = { updatedAt: now };

    // Ajouter les champs de premier niveau
    Object.keys(updates).forEach(key => {
        if (key !== 'metadata' && updates[key as keyof typeof updates] !== undefined) {
            updateObject[key] = updates[key as keyof typeof updates];
        }
    });

    // Gérer spécifiquement metadata si présent
    if (updates.metadata) {
        // Pour chaque propriété dans metadata, créer un opérateur $set avec dotNotation
        Object.entries(updates.metadata).forEach(([metaKey, metaValue]) => {
            updateObject[`metadata.${metaKey}`] = metaValue;
        });
    }

    // Effectuer la mise à jour avec l'objet restructuré
    // Éviter une requête supplémentaire en combinant l'update et le find
    const updatedSong = await songsCollection.findOneAndUpdate(
        { _id: songId },
        { $set: updateObject },
        { returnDocument: 'after' }
    );

    if (!updatedSong) {
        throw new Error(`Chanson ${songId} non trouvée après mise à jour`);
    }

    return updatedSong;
}

/**
 * Récupère l'historique des modifications d'une chanson
 * @param songId ID de la chanson
 * @returns Liste des changements effectués sur la chanson
 */
export async function getSongHistory(songId: string): Promise<SongChange[]> {
    const db = await getDb();
    const changesCollection = db.collection<SongChange>('song_changes');

    return changesCollection
        .find({ songId })
        .sort({ timestamp: -1 })
        .toArray();
}

/**
 * Récupère l'historique des modifications d'une chanson avec pagination
 * @param songId ID de la chanson
 * @param page Numéro de la page à récupérer (1 par défaut)
 * @param limit Nombre de changements par page (20 par défaut)
 * @returns Liste paginée des changements effectués sur la chanson
 */
export async function getSongHistoryPaginated(
    songId: string,
    page = 1,
    limit = 24
): Promise<{ changes: SongChange[]; total: number }> {
    const db = await getDb();
    const changesCollection = db.collection<SongChange>('song_changes');

    const skip = (page - 1) * limit;
    const total = await changesCollection.countDocuments({ songId });

    const changes = await changesCollection
        .find({ songId })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

    return { changes, total };
}

/**
 * Restaure une chanson à un état précédent
 * @param songId ID de la chanson
 * @param timestamp Date de l'état à restaurer
 * @returns La chanson restaurée
 */
export async function restoreSongToVersion(songId: string, timestamp: Date): Promise<SongDocument> {
    const db = await getDb();
    const songsCollection = db.collection<SongDocument>('songs');
    const changesCollection = db.collection<SongChange>('song_changes');

    // Récupérer l'état actuel
    const currentSong = await songsCollection.findOne({ _id: songId });
    if (!currentSong) throw new Error(`Song ${songId} not found`);

    // Récupérer tous les changements depuis le timestamp spécifié
    const changes = await changesCollection
        .find({ songId, timestamp: { $gt: timestamp } })
        .sort({ timestamp: 1 })
        .toArray();

    if (changes.length === 0) {
        return currentSong; // Rien à restaurer
    }

    // Restaurer en appliquant les valeurs précédentes
    const restoredSong = { ...currentSong } as Record<string, any>;
    const updates: Record<string, any> = {};

    changes.forEach(change => {
        change.changes.forEach(({ field, oldValue }) => {
            if (field.includes('.')) {
                const [parent, child] = field.split('.');
                if (!updates[parent]) updates[parent] = {};
                updates[parent][child] = oldValue;
            } else {
                updates[field] = oldValue;
            }
        });
    });

    // Appliquer les mises à jour au document temporaire
    for (const [key, value] of Object.entries(updates)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // Pour les objets (comme metadata), fusionner avec l'existant
            restoredSong[key] = {
                ...restoredSong[key],
                ...value
            };
        } else {
            // Pour les valeurs simples
            restoredSong[key] = value;
        }
    }

    // Mettre à jour le document dans la base
    const updateDoc = {
        ...restoredSong,
        updatedAt: new Date()
    };

    // Utiliser une assertion pour contourner le système de types
    await songsCollection.updateOne(
        { _id: songId },
        { $set: updateDoc as unknown as Partial<SongDocument> }
    );

    // Retourner le document restauré
    return restoredSong as unknown as SongDocument;
}