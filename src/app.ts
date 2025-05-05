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
import { requireMonitorToken } from './middlewares/requireMonitorToken.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

const openApiDoc = JSON.parse(fs.readFileSync('./src/swagger/openapi.json', 'utf8'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDoc));

const rawOrigins = process.env.CORS_ORIGINS || '';
const allowedOrigins = rawOrigins.split(',').map(origin => origin.trim());

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked for origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'x-monitor-token'],
}));

app.use((req, res, next) => {
    const ua = req.headers['user-agent'] || '';
    const isBrowser = /mozilla|chrome|safari|firefox/i.test(ua);
    const isApiRoute = req.path.startsWith('/api');

    if (isBrowser && !isApiRoute) {
        // redirige vers uptime kuma en interne dans Railway
        return res.redirect('http://uptime-kuma:8080');
    }

    next();
});

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

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

app.use('/api/internal', requireMonitorToken, adminMonitoringRoutes);

setupWebSocket(server);

(async () => {
    await redisClient.connect();
    server.listen(PORT, () => {
        console.log(`✅ New Suno API watching on http://${process.env.HOST || "localhost"}:${PORT}`);
        console.log(`Swagger UI available at http://${process.env.HOST || "localhost"}:${PORT}/docs`);
    });
})();
