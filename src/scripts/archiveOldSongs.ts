import { getArchiveDb, getArchiveClient } from '../models/archiveConnection.js';
import { getClient } from '../models/connection.js';
import { Db } from 'mongodb';
import dotenv from 'dotenv';
import { TrendingRecord } from '@/types/ArchiveSongTypes.js';
import { fileURLToPath } from 'url';
import { DatabaseError } from '../utils/errors.js';
import { handleMongoError } from '../utils/errorHandler.js';
import { ArchiveOptions } from '../types/ArchiveTypes.js';

dotenv.config();

const DEFAULT_ARCHIVE_THRESHOLD_DAYS = 90;
const DEFAULT_BATCH_SIZE = 100;

/**
 * Archive les anciennes songs en version minimale pour économiser l'espace
 * @param options Options pour l'archivage
 * @param options.dryRun Si vrai, n'effectue pas de modifications
 * @param options.threshold Nombre de jours pour considérer une song comme ancienne
 * @param options.batchSize Taille du lot pour l'archivage
 * @returns Nombre de songs archivées
 */
export async function archiveSongsMinimal(options: ArchiveOptions = {}) {
    // Validation des options
    if (typeof options !== 'object') {
        throw new Error('Les options doivent être un objet');
    }

    const isDryRun = Boolean(options.dryRun);
    const ARCHIVE_THRESHOLD_DAYS = options.threshold || DEFAULT_ARCHIVE_THRESHOLD_DAYS;
    const BATCH_SIZE = options.batchSize || DEFAULT_BATCH_SIZE;

    // Déclarer ces variables en dehors de la boucle pour qu'elles soient accessibles plus tard
    let totalRelatedChanges = 0;
    let totalRelatedPresence = 0;
    let totalRelatedTrending = 0;

    // Mesurer le temps d'exécution
    const startTime = Date.now();

    try {
        // Utiliser les clients existants au lieu d'en créer de nouveaux
        const sourceClient = getClient();
        const archiveClient = getArchiveClient();

        // Vérifier que les connexions sont actives avec un ping léger
        try {
            await sourceClient.db('admin').command({ ping: 1 });
            await archiveClient.db('admin').command({ ping: 1 });
            console.log("✅ Connexions MongoDB existantes utilisées pour l'archivage");
        } catch (err) {
            console.error("❌ Erreur lors de la vérification des connexions MongoDB:", err);
            throw new Error("Les connexions MongoDB ne sont pas disponibles. Assurez-vous que le serveur est démarré.");
        }

        const sourceDb = sourceClient.db('suno');
        const targetDb = getArchiveDb('suno-archive');

        const songs = sourceDb.collection('songs');
        const songChanges = sourceDb.collection('song_changes');
        const presenceLogs = sourceDb.collection('presence_logs');
        const songsArchive = targetDb.collection('archived_songs');
        const trendingStats = sourceDb.collection('trending_stats');
        const trendingArchive = targetDb.collection('archived_trending_stats');

        // === Amélioration 1: Indexation optimisée ===
        // await songsArchive.createIndex({ _id: 1 }, { unique: true });
        await songsArchive.createIndex({ createdAt: 1 });
        await songsArchive.createIndex({ tags: 1 });
        // Index composites pour les recherches fréquentes
        await songsArchive.createIndex({ userId: 1, createdAt: -1 });

        const threshold = new Date();
        threshold.setDate(threshold.getDate() - ARCHIVE_THRESHOLD_DAYS);

        console.log(`🔍 Recherche des songs plus anciens que ${threshold.toISOString()}`);

        // === Amélioration 2: Query plus précise ===
        // Recherche des songs inactifs avec une requête plus précise
        const query: any = {
            $or: [
                { updatedAt: { $lt: threshold } },
                { updated_at: { $lt: threshold.toISOString() } }
            ]
        };

        // Récupérer les IDs de songs modifiés récemment (compatible API Version 1)
        const recentlyModifiedSongsIds = await songChanges
            .find({ timestamp: { $gte: threshold } })
            .project({ songId: 1, _id: 0 })
            .map(doc => doc.songId)
            .toArray();

        // Si nous avons des songs récemment modifiés, les exclure de la requête
        if (recentlyModifiedSongsIds.length > 0) {
            (query as any)._id = { $nin: recentlyModifiedSongsIds };
        }

        let processed = 0;
        let hasMore = true;

        while (hasMore) {
            // Récupérer un lot de documents
            const songsToArchive = await songs.find(query)
                .limit(BATCH_SIZE)
                .toArray();

            if (songsToArchive.length === 0) {
                hasMore = false;
                continue;
            }

            // Extraire les IDs pour les opérations associées
            const songIds = songsToArchive.map(doc => doc._id);

            // Archiver les données associées
            // Avant d'interroger relatedChanges
            const hasChanges = await songChanges.countDocuments({}, { limit: 1 }) > 0;
            const relatedChanges = hasChanges
                ? await songChanges.find({ songId: { $in: songIds } }).toArray()
                : [];

            const relatedPresence = await presenceLogs.find({
                songId: { $in: songIds }
            }).toArray();

            // Vérifier si la collection existe avant de l'interroger
            const collectionExists = async (db: Db, name: string): Promise<boolean> => {
                const collections = await db.listCollections({ name }).toArray();
                return collections.length > 0;
            };

            // Utilisation
            const hasTrendingStats = await collectionExists(sourceDb, 'trending_stats');
            const relatedTrending = hasTrendingStats
                ? await trendingStats.find({ songId: { $in: songIds } }).toArray()
                : [];

            // Créer des versions minimales des documents
            const minimalDocs = songsToArchive.map(doc => {
                // Obtenir les variations historiques pour cette song
                const songChanges = relatedChanges.filter(c =>
                    c.songId.toString() === doc._id.toString()
                );

                // Obtenir les statistiques de trending pour cette song
                const trendingHistory = relatedTrending
                    .filter(t => t && t.songId && t.songId.toString() === doc._id.toString())
                    .map(toTrendingRecord);

                // Calculer les métriques dérivées des trending
                const firstTrendingSeen = trendingHistory.length > 0
                    ? new Date(Math.min(...trendingHistory.map(t => t.firstSeen.getTime())))
                    : null;
                const lastTrendingSeen = trendingHistory.length > 0
                    ? new Date(Math.max(...trendingHistory.map(t => t.lastSeen.getTime())))
                    : null;

                // Version complète des variations historiques
                const changesHistory = songChanges.map(change => ({
                    timestamp: change.timestamp,
                    changedFields: change.changedFields || [],
                    // Versions compactées des états avant/après pour préserver l'historique
                    before: {
                        title: change.before?.title,
                        tags: change.before?.tags,
                        prompt: change.before?.metadata?.prompt,
                        model: change.before?.model_name || change.before?.metadata?.model_name,
                        // Autres champs importants pour l'analyse
                    },
                    after: {
                        title: change.after?.title,
                        tags: change.after?.tags,
                        prompt: change.after?.metadata?.prompt,
                        model: change.after?.model_name || change.after?.metadata?.model_name,
                        // Autres champs importants pour l'analyse
                    }
                }));

                return {
                    _id: doc._id,
                    image_url: doc.image_url,
                    audio_url: doc.audio_url,
                    title: doc.title,
                    display_tags: Array.isArray(doc.display_tags) ? doc.display_tags :
                        (doc?.display_tags ? doc.display_tags.split(',').map((t: string) => t.trim()) : doc.metadata.tags.split(',').map((t: string) => t.trim())),
                    prompt: doc.metadata?.prompt.slice(0, 100) + '...' || '',
                    major_model_version: doc.major_model_version || '',
                    user_id: doc.user_id || doc.userId,
                    createdAt: doc.createdAt || new Date(doc.created_at),
                    updatedAt: doc.updatedAt || new Date(),
                    archivedAt: new Date(),

                    // Statistiques utiles pour l'analyse
                    play_count: doc.play_count || 0,
                    upvote_count: doc.upvote_count || 0,
                    comment_count: doc.comment_count || 0,

                    // Données sur les modifications
                    changeCount: songChanges.length,
                    changesHistory: changesHistory,

                    // Présence dans les playlists
                    playlistHistory: relatedPresence
                        .filter(p => p.songId.toString() === doc._id.toString())
                        .map(p => ({
                            playlistId: p.playlistId,
                            firstSeen: p.timestamp,
                            lastSeen: p.lastSeen || p.timestamp
                        })),

                    // Statistiques de tendance
                    trendingStats: {
                        count: trendingHistory.length,
                        firstSeen: firstTrendingSeen,
                        lastSeen: lastTrendingSeen,
                        history: trendingHistory.map((t: TrendingRecord) => ({
                            songId: t.songId,
                            list: t.list || 'Top',
                            timeSpan: t.timeSpan || 'Now',
                            position: t.position || 0,
                            firstSeen: t.firstSeen,
                            lastSeen: t.lastSeen,
                            peakPosition: t.peakPosition || t.position
                        }))
                    }
                };
            });

            if (minimalDocs.length > 0) {
                const archivePromises = minimalDocs.map(doc =>
                    songsArchive.findOneAndUpdate(
                        { uuid: doc._id },
                        {
                            $set: doc,
                            $setOnInsert: { initiallyArchivedAt: new Date() }
                        },
                        {
                            upsert: true,
                            returnDocument: 'after'
                        }
                    )
                );

                const archivedDocs = await Promise.all(archivePromises);
                const archivedCount = archivedDocs.filter(Boolean).length;
                console.log(`📦 ${archivedCount} songs archivés`);
            }

            // Extraire les IDs pour les opérations de suppression
            const deleteIds = songsToArchive.map(doc => doc._id);

            // Supprimer les documents archivés
            const deleteResult = await songs.deleteMany({
                _id: { $in: deleteIds }
            });

            console.log(`📦 ${deleteResult.deletedCount} songs supprimés du cluster principal`);
            processed += deleteResult.deletedCount;

            // À ajouter après chaque opération associée
            totalRelatedChanges += relatedChanges.length;
            totalRelatedPresence += relatedPresence.length;
            totalRelatedTrending += relatedTrending.length;
        }

        console.log(`✅ Archivage terminé. Total: ${processed} songs traités`);

        // === Amélioration 7: Surveillance et alertes améliorées ===
        const sourceStats = await sourceDb.stats();
        const archiveStats = await targetDb.stats();

        const sourceSizeMB = sourceStats.dataSize / (1024 * 1024);
        const archiveSizeMB = archiveStats.dataSize / (1024 * 1024);
        const archiveSizeGB = archiveStats.dataSize / (1024 * 1024 * 1024);

        console.log(`📊 Utilisation espace principal: ${sourceSizeMB.toFixed(2)} MB`);
        console.log(`📊 Utilisation espace archive: ${archiveSizeMB.toFixed(2)} MB`);

        // Calculer le taux de croissance pour prédiction
        const ATLAS_FLEX_LIMIT_GB = 5;
        const ALERT_THRESHOLD = 4.5;

        if (archiveSizeGB > ALERT_THRESHOLD) {
            const remainingSpace = ATLAS_FLEX_LIMIT_GB - archiveSizeGB;
            console.warn(`⚠️ ALERTE: L'archive approche la limite de 5GB d'Atlas Flex (${archiveSizeGB.toFixed(2)} GB)`);
            console.warn(`⚠️ Espace restant: ${remainingSpace.toFixed(2)} GB`);

            if (processed > 0) {
                // Estimer quand la limite sera atteinte
                const dataRatePerArchive = (archiveStats.dataSize - (archiveStats.dataSize - processed * 1000)) / processed;
                const estimatedDaysRemaining = remainingSpace * 1024 * 1024 * 1024 / dataRatePerArchive / processed;
                console.warn(`⚠️ Estimation: la limite sera atteinte dans ~${Math.round(estimatedDaysRemaining)} jours`);
            }
        }

        // Mesurer la durée totale
        const durationMs = Date.now() - startTime;
        console.log(`⏱️ Durée: ${(durationMs / 1000).toFixed(2)}s`);

        return {
            archived: processed,
            sourceSize: sourceStats.dataSize,
            archiveSize: archiveStats.dataSize,
            // Utiliser les totaux cumulés plutôt que les variables de la dernière itération
            associatedChangesArchived: totalRelatedChanges,
            associatedPresenceLogsArchived: totalRelatedPresence,
            associatedTrendingArchived: totalRelatedTrending
        };

    } catch (error) {
        if (error instanceof DatabaseError) {
            console.error(`❌ Erreur d'archivage (formatée): ${error.message}`);
            throw error;
        }

        console.error('❌ Erreur d\'archivage :', error);
        handleMongoError('archiveSongsMinimal', 'batch-operation', error);
    }
}

// Fonction utilitaire pour convertir les documents en enregistrements de trending
function toTrendingRecord(doc: any): TrendingRecord {
    if (!doc) {
        return {
            songId: doc._id,
            list: '',
            position: 0,
            timeSpan: '',
            firstSeen: new Date(),
            lastSeen: new Date(),
            peakPosition: 0,
            totalDays: 0,
            consecutiveDays: 0
        };
    }

    return {
        songId: doc.songId,
        list: doc.list || '',
        position: typeof doc.position === 'number' ? doc.position : 0,
        timeSpan: doc.timeSpan || '',
        firstSeen: doc.firstSeen ? new Date(doc.firstSeen) : new Date(),
        lastSeen: doc.lastSeen ? new Date(doc.lastSeen) : new Date(),
        peakPosition: typeof doc.peakPosition === 'number' ? doc.peakPosition : 0,
        totalDays: typeof doc.totalDays === 'number' ? doc.totalDays : 0,
        consecutiveDays: doc.consecutiveDays
    };
}

// Exécuter le script si appelé directement (version ES modules)
if (import.meta.url === fileURLToPath(import.meta.url)) {
    archiveSongsMinimal().catch(err => {
        console.error('❌ Erreur d\'archivage :', err);
        process.exit(1);
    });
}