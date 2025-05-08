import http from 'http';
import app from './app.js';
import { connectRedis } from './redisClient.js';
import { connectMongo } from './models/connection.js';
import { setupWebSocket } from './websocket/wsServer.js';

const server = http.createServer(app);
const PORT = process.env.PORT || 8000;

(async () => {
    await connectMongo();
    await connectRedis();
    setupWebSocket(server);
    server.listen(PORT, () => {
        console.log(`✅ New Suno API watching on ${process.env.NODE_ENV == 'production' ? process.env.HOST_ : `http://localhost:${PORT}`}`);
        console.log(`Swagger UI available at ${process.env.NODE_ENV == 'production' ? process.env.HOST_ : `http://localhost:${PORT}/docs`}`);
    });
})();