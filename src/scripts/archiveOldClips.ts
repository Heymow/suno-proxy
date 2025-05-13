import { getArchiveDb, getArchiveClient } from '../models/archiveConnection.js';
import { getClient } from '../models/connection.js';
import { Db } from 'mongodb';
import dotenv from 'dotenv';
import { TrendingRecord } from '@/types/ArchiveSongTypes.js';
import { fileURLToPath } from 'url';

dotenv.config();

const ARCHIVE_THRESHOLD_DAYS = 90;
const BATCH_SIZE = 100;

/**
 * Archive les anciens clips en version minimale pour économiser l'espace
 * Optimisé pour fonctionner avec MongoDB Atlas Flex (5GB max)
 */
export async function archiveClipsMinimal(options: { dryRun?: boolean } = {}) {
    const isDryRun = options.dryRun === true;

    // Déclarer ces variables en dehors de la boucle pour qu'elles soient accessibles plus tard
    let totalRelatedChanges = 0;
    let totalRelatedPresence = 0;
    let totalRelatedTrending = 0;

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

        // Le reste du code d'archivage reste inchangé
        const clips = sourceDb.collection('clips');
        const clipChanges = sourceDb.collection('clip_changes');
        const presenceLogs = sourceDb.collection('presence_logs');
        const archive = targetDb.collection('clips_archive');

        // Collection pour les statistiques de trending (à créer)
        const trendingStats = sourceDb.collection('trending_stats');
        const trendingArchive = targetDb.collection('trending_stats_archive');

        // === Amélioration 1: Indexation optimisée ===
        await archive.createIndex({ uuid: 1 }, { unique: true });
        await archive.createIndex({ createdAt: 1 });
        await archive.createIndex({ tags: 1 });
        // Index composites pour les recherches fréquentes
        await archive.createIndex({ userId: 1, createdAt: -1 });

        const threshold = new Date();
        threshold.setDate(threshold.getDate() - ARCHIVE_THRESHOLD_DAYS);

        console.log(`🔍 Recherche des clips plus anciens que ${threshold.toISOString()}`);

        // === Amélioration 2: Query plus précise ===
        // Recherche des clips inactifs avec une requête plus précise
        const query: any = {
            $or: [
                { updatedAt: { $lt: threshold } },
                { updated_at: { $lt: threshold.toISOString() } }
            ]
        };

        // Récupérer les IDs de clip modifiés récemment (compatible API Version 1)
        const recentlyModifiedClipIds = await clipChanges
            .find({ timestamp: { $gte: threshold } })
            .project({ clipId: 1, _id: 0 })
            .map(doc => doc.clipId)
            .toArray();

        // Si nous avons des clips récemment modifiés, les exclure de la requête
        if (recentlyModifiedClipIds.length > 0) {
            (query as any)._id = { $nin: recentlyModifiedClipIds };
        }

        let processed = 0;
        let hasMore = true;

        while (hasMore) {
            // Récupérer un lot de documents
            const clipsToArchive = await clips.find(query)
                .limit(BATCH_SIZE)
                .toArray();

            if (clipsToArchive.length === 0) {
                hasMore = false;
                continue;
            }

            // Extraire les IDs pour les opérations associées
            const clipIds = clipsToArchive.map(doc => doc._id);

            // Archiver les données associées
            // Avant d'interroger relatedChanges
            const hasChanges = await clipChanges.countDocuments({}, { limit: 1 }) > 0;
            const relatedChanges = hasChanges
                ? await clipChanges.find({ clipId: { $in: clipIds } }).toArray()
                : [];

            const relatedPresence = await presenceLogs.find({
                clipId: { $in: clipIds }
            }).toArray();

            // Vérifier si la collection existe avant de l'interroger
            const collectionExists = async (db: Db, name: string): Promise<boolean> => {
                const collections = await db.listCollections({ name }).toArray();
                return collections.length > 0;
            };

            // Utilisation
            const hasTrendingStats = await collectionExists(sourceDb, 'trending_stats');
            const relatedTrending = hasTrendingStats
                ? await trendingStats.find({ clipId: { $in: clipIds } }).toArray()
                : [];

            // Créer des versions minimales des documents
            const minimalDocs = clipsToArchive.map(doc => {
                // Obtenir les variations historiques pour ce clip
                const clipChanges = relatedChanges.filter(c =>
                    c.clipId.toString() === doc._id.toString()
                );

                // Obtenir les statistiques de trending pour ce clip
                const trendingHistory = relatedTrending
                    .filter(t => t.clipId && t.clipId.toString() === doc._id.toString())
                    .map(toTrendingRecord);

                // Calculer les métriques dérivées des trending
                const firstTrendingSeen = trendingHistory.length > 0
                    ? new Date(Math.min(...trendingHistory.map(t => t.firstSeen.getTime())))
                    : null;
                const lastTrendingSeen = trendingHistory.length > 0
                    ? new Date(Math.max(...trendingHistory.map(t => t.lastSeen.getTime())))
                    : null;

                // Version complète des variations historiques
                const changesHistory = clipChanges.map(change => ({
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
                    id: doc.uuid || doc.id,
                    image_url: doc.image_url,
                    audio_url: doc.audio_url,
                    title: doc.title,
                    display_tags: Array.isArray(doc.display_tags) ? doc.display_tags :
                        (doc?.display_tags ? doc.display_tags.split(',').map((t: string) => t.trim()) : doc.metadata.tags.split(',').map((t: string) => t.trim())),
                    prompt: doc.metadata?.prompt.slice(0, 100) + '...' || '',
                    major_model_version: doc.major_model_version || '',
                    user_id: doc.user_id || doc.userId,
                    created_at: doc.created_at || new Date(doc.created_at),
                    updated_at: doc.updated_at || new Date(),
                    archiveDate: new Date(),

                    // Statistiques utiles pour l'analyse
                    play_count: doc.play_count || 0,
                    upvote_count: doc.upvote_count || 0,
                    comment_count: doc.comment_count || 0,

                    // Données sur les modifications
                    changeCount: clipChanges.length,
                    changesHistory: changesHistory,

                    // Présence dans les playlists
                    playlistHistory: relatedPresence
                        .filter(p => p.clipId.toString() === doc._id.toString())
                        .map(p => ({
                            playlistId: p.playlistId,
                            firstSeen: p.timestamp,
                            lastSeen: p.lastSeen || p.timestamp
                        })),

                    // Nouveau: historique des tendances
                    trendingStats: {
                        count: trendingHistory.length,
                        firstSeen: firstTrendingSeen,
                        lastSeen: lastTrendingSeen,
                        history: trendingHistory.map((t: TrendingRecord) => ({
                            clipId: t.clipId,
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
                // === Amélioration 5: Opérations atomiques ===
                const bulkOps = minimalDocs.map(doc => ({
                    updateOne: {
                        filter: { uuid: doc.id },
                        update: { $set: doc },
                        upsert: true
                    }
                }));

                const result = await archive.bulkWrite(bulkOps);

                // === Amélioration 6: Archivage des données associées ===
                if (relatedChanges.length > 0) {
                    await targetDb.collection('clip_changes_archive').insertMany(
                        relatedChanges.map(c => ({ ...c, archivedAt: new Date() }))
                    );
                    await clipChanges.deleteMany({ clipId: { $in: clipIds } });
                }

                if (relatedPresence.length > 0) {
                    await targetDb.collection('presence_logs_archive').insertMany(
                        relatedPresence.map(p => ({ ...p, archivedAt: new Date() }))
                    );
                    await presenceLogs.deleteMany({ clipId: { $in: clipIds } });
                }

                // Archiver les statistiques de trending associées
                if (relatedTrending.length > 0) {
                    await trendingArchive.insertMany(
                        relatedTrending.map(t => ({ ...t, archivedAt: new Date() }))
                    );
                    await trendingStats.deleteMany({ clipId: { $in: clipIds } });
                    console.log(`📊 ${relatedTrending.length} statistiques de trending archivées`);
                }

                // Supprimer les documents archivés
                const deleteResult = await clips.deleteMany({
                    _id: { $in: clipIds }
                });

                console.log(`📦 ${result.upsertedCount} nouveaux clips archivés, ${result.modifiedCount} mis à jour`);
                console.log(`🧹 ${deleteResult.deletedCount} clips supprimés du cluster principal`);
                processed += deleteResult.deletedCount;
            }

            // À ajouter après chaque opération associée
            totalRelatedChanges += relatedChanges.length;
            totalRelatedPresence += relatedPresence.length;
            totalRelatedTrending += relatedTrending.length;
        }

        console.log(`✅ Archivage terminé. Total: ${processed} clips traités`);

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

        return {
            archived: processed,
            sourceSize: sourceStats.dataSize,
            archiveSize: archiveStats.dataSize,
            // Utiliser les totaux cumulés plutôt que les variables de la dernière itération
            associatedChangesArchived: totalRelatedChanges,
            associatedPresenceLogsArchived: totalRelatedPresence,
            associatedTrendingArchived: totalRelatedTrending
        };

    } catch (err) {
        console.error('❌ Erreur d\'archivage :', err);
        throw err;
    }
}

// Fonction utilitaire pour convertir les documents en enregistrements de trending
function toTrendingRecord(doc: any): TrendingRecord {
    return {
        clipId: doc.clipId,
        list: doc.list || '',
        position: doc.position || 0,
        timeSpan: doc.timeSpan || '',
        firstSeen: doc.firstSeen ? new Date(doc.firstSeen) : new Date(),
        lastSeen: doc.lastSeen ? new Date(doc.lastSeen) : new Date(),
        peakPosition: doc.peakPosition || 0,
        totalDays: doc.totalDays || 0,
        consecutiveDays: doc.consecutiveDays
    };
}

// Exécuter le script si appelé directement (version ES modules)
if (import.meta.url === fileURLToPath(import.meta.url)) {
    archiveClipsMinimal().catch(err => {
        console.error('❌ Erreur d\'archivage :', err);
        process.exit(1);
    });
}