import { getArchiveDb, getArchiveClient } from '../models/archiveConnection.js';
import { getClient } from '../models/connection.js';
import { Db, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import { archiveSongsMinimal } from './archiveOldSongs.js';
// Importer les nouveaux types
import {
    PlaylistDocument,
    TrendDocument,
    UserActivityDocument,
    ArchiveConfig as TypedArchiveConfig
} from '../types/ArchiveTypes.js';

// Charger les variables d'environnement
dotenv.config();

// Définir des constantes pour les seuils par défaut et lire les variables d'environnement
const DEFAULT_THRESHOLD_SONGS = 90;   // 90 jours par défaut pour les songs
const DEFAULT_THRESHOLD_PLAYLISTS = 60;  // 60 jours par défaut pour les playlists
const DEFAULT_THRESHOLD_TRENDS = 30;     // 30 jours par défaut pour les tendances 
const DEFAULT_THRESHOLD_USERS = 14; // 14 jours par défaut pour les users

// Lire les seuils depuis les variables d'environnement ou utiliser les valeurs par défaut
const THRESHOLD_SONGS = parseInt(process.env.ARCHIVE_THRESHOLD_SONGS || '', 10) || DEFAULT_THRESHOLD_SONGS;
const THRESHOLD_PLAYLISTS = parseInt(process.env.ARCHIVE_THRESHOLD_PLAYLISTS || '', 10) || DEFAULT_THRESHOLD_PLAYLISTS;
const THRESHOLD_TRENDS = parseInt(process.env.ARCHIVE_THRESHOLD_TRENDS || '', 10) || DEFAULT_THRESHOLD_TRENDS;
const THRESHOLD_USERS = parseInt(process.env.ARCHIVE_THRESHOLD_USERS || '', 10) || DEFAULT_THRESHOLD_USERS;

// Interfaces et fonctions utilitaires existantes...

interface ArchiveConfig<T, U> {
    sourceCollection: string;
    archiveCollection: string;
    thresholdDays: number;
    transformer: (doc: any) => any;
    dryRun?: boolean; // mode simulation
}

// Fonction utilitaire pour les transformations communes
function createTransformer<T, U>(config: {
    keepFields: string[],
    dateFields?: { source: string[], target: string }[],
    arrayFields?: { source: string[], target: string, maxLength?: number }[]
}) {
    return (doc: any): Partial<U> => {
        const result: any = { _id: doc._id };

        // Copier les champs à conserver
        config.keepFields.forEach(field => {
            if (doc[field] !== undefined) result[field] = doc[field];
        });

        // Traiter les champs de date
        if (config.dateFields) {
            config.dateFields.forEach(({ source, target }) => {
                for (const srcField of source) {
                    if (doc[srcField] !== undefined) {
                        result[target] = doc[srcField] instanceof Date
                            ? doc[srcField]
                            : new Date(doc[srcField]);
                        break;
                    }
                }
            });
        }

        // Traiter les tableaux
        if (config.arrayFields) {
            config.arrayFields.forEach(({ source, target, maxLength }) => {
                for (const srcField of source) {
                    if (Array.isArray(doc[srcField])) {
                        let array = doc[srcField];
                        if (maxLength) array = array.slice(0, maxLength);
                        result[target] = array;
                        break;
                    }
                }
            });
        }

        return result as Partial<U>;
    };
}

/**
 * Archive les documents d'une collection spécifique vers une collection d'archive
 * selon des critères d'ancienneté et avec une transformation personnalisée
 * 
 * @param config Configuration de l'archivage avec collection source, destination et transformer
 * @returns Statistiques sur les documents archivés et l'espace économisé
 */
async function archiveCollection<T, U>(config: ArchiveConfig<T, U>) {
    let totalAssociatedItems = 0;
    const isDryRun = config.dryRun === true;

    try {
        // Utiliser les clients existants au lieu d'en créer de nouveaux
        const sourceClient = getClient(); // Récupère la connexion MongoDB
        const archiveClient = getArchiveClient(); // Récupère la connexion à la base d'archive

        // Vérifier que les connexions sont actives
        try {
            await sourceClient.db('admin').command({ ping: 1 });
            await archiveClient.db('admin').command({ ping: 1 });
            console.log(`✅ Connexions MongoDB existantes utilisées pour l'archivage de ${config.sourceCollection}`);
        } catch (err) {
            console.error("❌ Erreur lors de la vérification des connexions MongoDB:", err);
            throw new Error("Les connexions MongoDB ne sont pas disponibles.");
        }

        const sourceDb = sourceClient.db('suno');
        const targetDb = archiveClient.db('suno-archive'); // Accéder à la base de données

        const sourceCollection = sourceDb.collection(config.sourceCollection);
        const archiveCollection = targetDb.collection(config.archiveCollection);

        // Vérifier si la collection existe avant de l'interroger
        const collectionExists = async (db: Db, name: string): Promise<boolean> => {
            const collections = await db.listCollections({ name }).toArray();
            return collections.length > 0;
        };

        // Créer les index appropriés selon la collection
        await archiveCollection.createIndex({ createdAt: 1 });

        // Ajouter des index spécifiques par collection
        switch (config.sourceCollection) {
            case 'playlists':
                await archiveCollection.createIndex({ userId: 1 });
                await archiveCollection.createIndex({ name: 1 });
                break;
            case 'trends':
                await archiveCollection.createIndex({ date: 1 });
                break;
            case 'user_activities':
                await archiveCollection.createIndex({ userId: 1 });
                await archiveCollection.createIndex({ type: 1 });
                await archiveCollection.createIndex({ timestamp: 1 });
                break;
        }

        const threshold = new Date();
        threshold.setDate(threshold.getDate() - config.thresholdDays);

        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        console.log(`🔍 Recherche des documents ${config.sourceCollection} plus anciens que ${threshold.toISOString()}`);

        const query = {
            $or: [
                // Documents jamais touchés par l'archivage
                {
                    archiveInProgress: { $exists: false },
                    $or: [
                        { updatedAt: { $lt: threshold } },
                        { updated_at: { $lt: threshold.toISOString() } },
                        { createdAt: { $lt: threshold } },
                        { created_at: { $lt: threshold.toISOString() } }
                    ]
                },
                // Documents bloqués en archivage depuis plus de 24h (échec probable)
                {
                    archiveInProgress: { $lt: oneDayAgo }
                }
            ]
        };

        const batchSize = 100;
        let processed = 0;
        let batch;
        let hasMore = true;

        if (isDryRun) {
            console.log(`🔍 DRY RUN: Simulation d'archivage pour ${config.sourceCollection}`);
        }

        while (hasMore) {
            // 1. Récupérer et marquer en une seule opération
            const docsToArchive = await sourceCollection.find(query).limit(batchSize).toArray();
            const docIds = docsToArchive.map(doc => doc._id);

            if (docIds.length === 0) {
                hasMore = false;
                continue;
            }

            // En dry run, on ne marque pas les documents
            if (!isDryRun && docIds.length > 0) {
                // Marquer comme "en cours d'archivage"
                await sourceCollection.updateMany(
                    { _id: { $in: docIds } },
                    { $set: { archiveInProgress: new Date() } }
                );
            }

            // 2. Utiliser directement les documents déjà récupérés
            batch = docsToArchive;

            // Extraire les IDs pour les opérations associées
            const ids = batch.map(doc => doc._id);

            // Gérer les données associées spécifiques à chaque collection
            let associatedData: any[] = [];

            // Pour les playlists, archiver les relations playlist-songs
            if (config.sourceCollection === 'playlists') {
                // Récupérer les données associées mais ne pas les modifier en dry run
                const hasPlaylistItems = await collectionExists(sourceDb, 'playlist_songs');
                if (hasPlaylistItems) {
                    const playlistSongs = sourceDb.collection('playlist_songs');
                    associatedData = await playlistSongs.find({
                        playlistId: { $in: ids }
                    }).toArray();

                    if (associatedData.length > 0 && !isDryRun) {
                        await targetDb.collection('playlist_songs_archive').insertMany(
                            associatedData.map(item => ({ ...item, archivedAt: new Date() }))
                        );
                        await playlistSongs.deleteMany({ playlistId: { $in: ids } });
                    }
                    totalAssociatedItems += associatedData.length;
                }
            }

            // Pour les activities, archiver d'autres données si nécessaire
            if (config.sourceCollection === 'user_activities') {
                // Logique spécifique pour activities...
            }

            // Transformer les documents
            const transformedDocs = batch.map((doc) => config.transformer(doc as unknown as T));

            // Log de ce qui serait archivé
            if (isDryRun) {
                console.log(`📋 DRY RUN: ${transformedDocs.length} documents prêts à archiver`);
                if (associatedData.length > 0) {
                    console.log(`🔗 DRY RUN: ${associatedData.length} relations associées seraient archivées`);
                }
            } else {
                // Utiliser bulkWrite pour plus d'efficacité
                const bulkOps = transformedDocs.map(doc => ({
                    updateOne: {
                        filter: { _id: doc._id },
                        update: {
                            $set: {
                                ...doc,
                                archiveDate: new Date(),
                                // Champs utiles pour l'analyse
                                associatedItemsCount: associatedData.filter(a =>
                                    a.playlistId && a.playlistId.toString() === doc._id.toString()
                                ).length
                            }
                        },
                        upsert: true
                    }
                }));

                try {
                    const result = await archiveCollection.bulkWrite(bulkOps);
                    console.log(`📊 ${config.sourceCollection}: ${result.upsertedCount} nouveaux documents archivés, ${result.modifiedCount} mis à jour`);
                } catch (bulkError) {
                    console.error(`❌ Erreur lors de l'insertion des archives pour ${config.sourceCollection}:`, bulkError);
                    throw bulkError;
                }

                // 3. Si tout se passe bien, supprimer les originaux
                const deleteResult = await sourceCollection.deleteMany({
                    _id: { $in: docIds }
                });

                processed += deleteResult.deletedCount;

                console.log(`📦 ${config.sourceCollection}: ${deleteResult.deletedCount} documents archivés et supprimés`);
                if (associatedData.length > 0) {
                    console.log(`🔗 ${associatedData.length} documents associés archivés`);
                }
            }

            if (isDryRun) {
                // En dry run, on limite à un seul batch pour éviter les logs trop longs
                hasMore = false;
            }
        }

        // Statistiques et métriques
        const sourceStats = await sourceDb.stats();
        console.log(`📊 Base de données source - Taille totale: ${(sourceStats.dataSize / (1024 * 1024)).toFixed(2)} MB`);
        const collectionStats = await sourceDb.command({ collStats: config.sourceCollection });

        console.log(`✅ Archivage de ${config.sourceCollection} terminé. Total: ${processed} documents traités`);
        console.log(`📊 ${config.sourceCollection} - Taille restante: ${(collectionStats.size / (1024 * 1024)).toFixed(2)} MB`);
        console.log(`📊 ${config.sourceCollection} - Documents restants: ${collectionStats.count}`);

        return {
            collection: config.sourceCollection,
            archived: processed,
            sourceSize: collectionStats.size,
            sourceCount: collectionStats.count,
            associatedItemsArchived: totalAssociatedItems,
            isDryRun
        };

    } catch (err) {
        console.error(`❌ ${isDryRun ? 'DRY RUN: ' : ''}Erreur lors de l'archivage de ${config.sourceCollection}:`, err);
        throw err;
    }
}

/**
 * Exécute l'archivage pour toutes les collections configurées
 */
export async function runArchives(options: { dryRun?: boolean } = {}) {
    const isDryRun = options.dryRun === true;

    try {
        // Afficher les seuils d'archivage configurés
        console.log(`${isDryRun ? '🔍 MODE SIMULATION (DRY RUN)' : '🚀 MODE PRODUCTION'}`);
        console.log('📅 Seuils d\'archivage: ');
        console.log(`   - Songs: ${THRESHOLD_SONGS} jours (ARCHIVE_THRESHOLD_SONGS)`);
        console.log(`   - Playlists: ${THRESHOLD_PLAYLISTS} jours (ARCHIVE_THRESHOLD_PLAYLISTS)`);
        console.log(`   - Tendances: ${THRESHOLD_TRENDS} jours (ARCHIVE_THRESHOLD_TRENDS)`);
        console.log(`   - Activités: ${THRESHOLD_USERS} jours (ARCHIVE_THRESHOLD_USERS)`);

        const results = [];

        // Archiver les songs en utilisant le seuil configuré
        const songsResult = await archiveSongsMinimal({
            dryRun: isDryRun,
            threshold: THRESHOLD_SONGS
        });
        results.push({ collection: 'songs', ...songsResult });

        // Archiver les playlists
        const playlistResult = await archiveCollection<PlaylistDocument, Partial<PlaylistDocument>>({
            sourceCollection: 'playlists',
            archiveCollection: 'archived_playlists',  // Nom standardisé
            thresholdDays: THRESHOLD_PLAYLISTS,
            transformer: createTransformer<PlaylistDocument, Partial<PlaylistDocument>>({
                keepFields: ['_id', 'name', 'description', 'userId', 'createdAt', 'updatedAt'],
                dateFields: [
                    { source: ['createdAt', 'created_at'], target: 'createdAt' },
                    { source: ['updatedAt', 'updated_at'], target: 'updatedAt' }
                ],
                arrayFields: [
                    { source: ['songIds', 'song_ids', 'songs'], target: 'songIds' }
                ]
            }),
            dryRun: isDryRun
        });
        results.push(playlistResult);

        // 3. Archiver les tendances
        const trendsResult = await archiveCollection<TrendDocument, Partial<TrendDocument>>({
            sourceCollection: 'trends',
            archiveCollection: 'archived_trends',  // Nom standardisé
            thresholdDays: THRESHOLD_TRENDS,
            transformer: createTransformer<TrendDocument, Partial<TrendDocument>>({
                keepFields: ['_id', 'date', 'topTags', 'topSongs'],
                dateFields: [{ source: ['date'], target: 'date' }],
                arrayFields: [
                    { source: ['topSongs'], target: 'topSongIds', maxLength: 20 }
                ]
            }),
            dryRun: isDryRun
        });
        results.push(trendsResult);

        // 4. Archiver les activités utilisateurs
        const activitiesResult = await archiveCollection<UserActivityDocument, Partial<UserActivityDocument>>({
            sourceCollection: 'user_activities',
            archiveCollection: 'archived_user_activities',  // Nom standardisé
            thresholdDays: THRESHOLD_USERS,
            transformer: createTransformer<UserActivityDocument, Partial<UserActivityDocument>>({
                keepFields: ['_id', 'userId', 'type', 'objectId', 'createdAt'],
                dateFields: [
                    { source: ['createdAt', 'timestamp'], target: 'createdAt' }
                ]
            }),
            dryRun: isDryRun
        });
        results.push(activitiesResult);

        if (isDryRun) {
            console.log('📊 RÉSUMÉ DRY RUN:');
            for (const result of results) {
                console.log(`${result.collection}: ${result.archived} documents seraient archivés`);
            }
            console.log('🔍 Aucune modification n\'a été apportée à la base de données');
        }

        return results;
    } catch (err) {
        console.error(`❌ ${isDryRun ? 'DRY RUN: ' : ''}Erreur lors de l'archivage:`, err);
        throw err;
    }
}

// Exécuter si appelé directement (version ES modules)
import { fileURLToPath } from 'url';
if (import.meta.url === fileURLToPath(import.meta.url)) {
    runArchives().then(result => {
        console.log('✅ Archivage complet terminé:', result);
    }).catch(err => {
        console.error('❌ Échec de l\'archivage: ', err);
        process.exit(1);
    });
}