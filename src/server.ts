import http from 'http';
import app from './app.js';
import { initRedisConnection } from './redisClient.js';
import { connectMongo, closeMongoConnection } from './models/connection.js';
import { connectMongoArchive } from './models/archiveConnection.js';
import { setupWebSocket } from './websocket/wsServer.js';
import { archiveSongsMinimal } from './scripts/archiveOldSongs.js';
import { setupIndexes } from './scripts/setupDatabase.js';
import { pollTrendingLists } from './services/trendingPoller.js';
import cron from 'node-cron';

const server = http.createServer(app);
const PORT = process.env.PORT || 8000;

(async () => {
    try {
        await connectMongo();
        await connectMongoArchive();
        await initRedisConnection();
        await setupIndexes();
        setupWebSocket(server);

        // Programmer l'exécution de l'archivage quotidiennement à 02:00
        cron.schedule('0 2 * * *', async () => {
            console.log('🕒 Exécution de l\'archivage programmé...');
            try {
                await archiveSongsMinimal();
                console.log('✅ Archivage terminé avec succès');
            } catch (err) {
                console.error('❌ Erreur lors de l\'archivage:', err);
            }
        });

        // Programmer le polling des tendances toutes les 5 minutes
        cron.schedule('*/5 * * * *', async () => {
            console.log('📈 Exécution du polling des tendances...');
            try {
                await pollTrendingLists();
                console.log('✅ Polling des tendances terminé');
            } catch (err) {
                console.error('❌ Erreur lors du polling des tendances:', err);
            }
        });

        server.listen(PORT, () => {
            console.log(`✅ New Suno API watching on ${process.env.NODE_ENV !== 'development' ? `https://${process.env.HOST_}` : `http://localhost:${PORT}`}`);
            console.log(`✅ Swagger UI available at ${process.env.NODE_ENV !== 'development' ? `https://${process.env.HOST_}/docs` : `http://localhost:${PORT}/docs`}`);
        });
    }
    catch (err) {
        console.error('🚨 Failed to start server:', err);
        process.exit(1);
    }
})();

// En fin de fichier, après server.listen
const gracefulShutdown = async () => {
    console.log('🛑 Shutting down gracefully...');
    await closeMongoConnection();
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
};

// Gérer les signaux d'arrêt
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);