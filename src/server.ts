import http from 'http';
import app from './app.js';
import { initRedisConnection } from './redisClient.js';
import { connectMongo } from './models/connection.js';
import { connectMongoArchive } from './models/archiveConnection.js';
import { setupWebSocket } from './websocket/wsServer.js';
import { archiveClipsMinimal } from './scripts/archiveOldClips.js';
import cron from 'node-cron';

const server = http.createServer(app);
const PORT = process.env.PORT || 8000;

(async () => {
    try {
        await connectMongo();
        await connectMongoArchive();
        await initRedisConnection();
        setupWebSocket(server);

        // Programmer l'exécution de l'archivage quotidiennement à 02:00
        cron.schedule('0 2 * * *', async () => {
            console.log('🕒 Exécution de l\'archivage programmé...');
            try {
                await archiveClipsMinimal();
                console.log('✅ Archivage terminé avec succès');
            } catch (err) {
                console.error('❌ Erreur lors de l\'archivage:', err);
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