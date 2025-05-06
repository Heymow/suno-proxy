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
import { options } from './swagger/swagger-options.js';
import { connectMongo } from './models/connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

const openApiDoc = JSON.parse(fs.readFileSync('./src/swagger/openapi.json', 'utf8'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDoc, options));
app.use('/public', express.static(path.join(__dirname, '../public')));

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
    const acceptHeader = req.headers.accept || '';
    const isApiRequest = acceptHeader.includes('application/json');
    const isApiRoute = ['/api', '/user', '/song', '/playlist', '/trending'].some(prefix =>
        req.path.startsWith(prefix)
    );

    if (isBrowser && !isApiRoute && !isApiRequest) {
        return res.redirect('https://status.suno-proxy.click');
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
    await connectMongo();
    await redisClient.connect();
    server.listen(PORT, () => {
        console.log(`✅ New Suno API watching on http://${process.env.HOST || "localhost"}:${PORT}`);
        console.log(`Swagger UI available at http://${process.env.HOST || "localhost"}:${PORT}/docs`);
    });
})();
