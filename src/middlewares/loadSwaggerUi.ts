import express from "express";
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { options } from '../swagger/swagger-options.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function loadSwaggerUi(app: express.Application) {
    console.log('🔧 Loading Swagger UI...');
    console.log('🌍 Environment:', process.env.NODE_ENV);

    const openApiDoc = JSON.parse(fs.readFileSync('./src/swagger/openapi.json', 'utf8'));

    // Configuration dynamique des serveurs
    const servers = [];

    // 1. Relative URL (works for same-domain requests)
    servers.push({
        url: '/',
        description: 'Current Server'
    });

    // 2. Localhost (only in dev and if HOST_ is not set)
    if (process.env.NODE_ENV === 'development' && !process.env.HOST_) {
        servers.push({
            url: 'http://localhost:8000',
            description: 'Local Server'
        });
    }

    openApiDoc.servers = servers;
    console.log('🚀 Swagger Servers configured:', JSON.stringify(servers, null, 2));

    app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDoc, options));
    app.use('/public', express.static(path.join(__dirname, '../../public')));
}