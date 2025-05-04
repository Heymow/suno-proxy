import dotenv from 'dotenv';
import 'dotenv/config';
dotenv.config();
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import express, { Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import songRoutes from './routes/songRoutes.js';
import userRoutes from './routes/userRoutes.js';
import playlistRoutes from './routes/playlistRoutes.js';
import trendingRoutes from './routes/trendingRoutes.js';
import adminMonitoringRoutes from './routes/systemRoutes.js';
import { retryOnRateLimit } from './middlewares/retryOnRateLimit.js';
import { setupWebSocket } from './websocket/wsServer.js';
import cors from 'cors';
import fs from 'fs';
import redisClient from './redisClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

const openApiDoc = JSON.parse(fs.readFileSync('./src/swagger/openapi.json', 'utf8'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDoc));

app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'x-monitor-token'],
}));

const monitoringUiPath = path.join(__dirname, '../monitoring-ui/dist');
app.use('/monitoring-ui', express.static(monitoringUiPath));
app.get('/monitoring-ui/*', (req, res) => {
    res.sendFile(path.join(monitoringUiPath, 'index.html'));
});

app.use(express.urlencoded({ extended: true }));

app.use(retryOnRateLimit);

app.use('/song', songRoutes);
app.use('/playlist', playlistRoutes);
app.use('/trending', trendingRoutes);
app.use('/user', userRoutes);

app.use('/api/internal', adminMonitoringRoutes);

setupWebSocket(server);

(async () => {
    await redisClient.connect();
    server.listen(PORT, () => {
        console.log(`✅ Suno Analyzer watching on http://localhost:${PORT}`);
        console.log(`Swagger UI available at http://localhost:${PORT}/docs`);
    });
})();
