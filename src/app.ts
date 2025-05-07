import dotenv from 'dotenv';
dotenv.config(
    process.env.NODE_ENV === 'production' ? { path: '.env' } : { path: '.env.dev' }
);
import http from 'http';
import express from 'express';
import songRoutes from './routes/songRoutes.js';
import userRoutes from './routes/userRoutes.js';
import playlistRoutes from './routes/playlistRoutes.js';
import trendingRoutes from './routes/trendingRoutes.js';
import adminMonitoringRoutes from './routes/systemRoutes.js';
import { retryOnRateLimit } from './middlewares/retryOnRateLimit.js';
import { setupWebSocket } from './websocket/wsServer.js';
import { connectRedis } from './redisClient.js';
import { requireMonitorToken } from './middlewares/requireMonitorToken.js';
import { connectMongo } from './models/connection.js';
import httpsCheck from './middlewares/httpsCheck.js';
import loadSwaggerUi from './middlewares/loadSwaggerUi.js';
import loadMonitoringUi from './middlewares/loadMonitoringUi.js';
import redirectBrowserToStatus from './middlewares/redirectBrowserToStatus.js';
import setupCors from './middlewares/corsSetup.js';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8000;

setupCors(app);
httpsCheck(app);
loadSwaggerUi(app);
redirectBrowserToStatus(app);

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.use(express.urlencoded({ extended: true }));
app.use(retryOnRateLimit);

app.use('/song', songRoutes);
app.use('/playlist', playlistRoutes);
app.use('/trending', trendingRoutes);
app.use('/user', userRoutes);

loadMonitoringUi(app);
app.use('/api/internal', requireMonitorToken, adminMonitoringRoutes);
setupWebSocket(server);

(async () => {
    await connectMongo();
    await connectRedis();
    server.listen(PORT, () => {
        console.log(`✅ New Suno API watching on ${process.env.NODE_ENV == 'production' ? process.env.HOST_ : `http://localhost:${PORT}`}`);
        console.log(`Swagger UI available at ${process.env.NODE_ENV == 'production' ? process.env.HOST_ : `http://localhost:${PORT}/docs`}`);
    });
})();
