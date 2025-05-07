import express from 'express';
import cors from 'cors';

const rawOrigins = process.env.CORS_ORIGINS || '';
const allowedOrigins = rawOrigins.split(',').map(origin => origin.trim());

export default function setupCors(app: express.Application) {
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
}