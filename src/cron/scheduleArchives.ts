import { runArchives } from '../scripts/archiveManager.js';
import cron from 'node-cron';

/**
 * Configure les tâches d'archivage planifiées
 * Optimisé pour MongoDB Atlas Flex
 */
export function setupArchiveSchedule() {
    // Exécuter 1 fois par jour (à 5h du matin)
    cron.schedule('0 5 * * *', async () => {
        console.log(`🕒 Démarrage de l'archivage planifié: ${new Date().toISOString()}`);
        try {
            await runArchives();
            console.log('✅ Archivage planifié terminé avec succès: tous les jours à 5h du matin');
        } catch (err) {
            console.error('❌ Échec de l\'archivage planifié: ', err);
        }
    });

    console.log('📅 Tâches d\'archivage planifiées(1 fois par jour)');
}

// Pour tester manuellement
export async function runArchiveNow() {
    console.log('🚀 Démarrage de l\'archivage manuel');
    try {
        const result = await runArchives();
        console.log('✅ Archivage manuel terminé', result);
        return result;
    } catch (err) {
        console.error('❌ Échec de l\'archivage manuel: ', err);
        throw err;
    }
}

// Mode simulation
export async function testArchives() {
    console.log('🚀 Démarrage de l\'archivage en mode simulation');
    await runArchives({ dryRun: true });
    console.log('✅ Archivage en mode simulation terminé');
}