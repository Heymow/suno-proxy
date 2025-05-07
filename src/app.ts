import dotenv from 'dotenv';
dotenv.config(
    process.env.NODE_ENV === 'production' ? { path: '.env' } : { path: '.env.dev' }
);
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Host: ${process.env.HOST_}`);
console.log(`Redis URL: ${process.env.REDIS_URL}`);
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
import { getRedisClient, connectRedis } from './redisClient.js';
import { requireMonitorToken } from './middlewares/requireMonitorToken.js';
import { options } from './swagger/swagger-options.js';
import { connectMongo } from './models/connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.set('trust proxy', true);

if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        const proto = req.headers['x-forwarded-proto'];
        const host = req.headers.host || '';

        // ✅ Si on est en HTTP OU s'il n'y a PAS de proto (requête directe)
        const isHttpOrUnknown = proto !== 'https' || !proto;

        // ✅ Et on veut bloquer seulement si ce n'est PAS une requête depuis localhost (utile en dev)
        const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1');

        if (isHttpOrUnknown && !isLocal) {
            res.status(403).send('Access denied: HTTPS required');
        }

        next();
    });
}

const openApiDoc = JSON.parse(fs.readFileSync('./src/swagger/openapi.json', 'utf8'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDoc, options));
app.use('/public', express.static(path.join(__dirname, '../public')));

const rawOrigins = process.env.CORS_ORIGINS || '';
const allowedOrigins = rawOrigins.split(',').map(origin => origin.trim());

app.use(cors({
    origin: (origin, callback) => {
        if (allowedOrigins.includes('*')) {
            callback(null, true);
        } else if (!origin || allowedOrigins.includes(origin)) {
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
    if (req.path === '/health') return next();
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
    await connectRedis();
    server.listen(PORT, () => {
        console.log(`✅ New Suno API watching on ${process.env.NODE_ENV == 'production' ? process.env.HOST_ : `http://localhost:${PORT}`}`);
        console.log(`Swagger UI available at ${process.env.NODE_ENV == 'production' ? process.env.HOST_ : `http://localhost:${PORT}/docs`}`);
    });
})();
