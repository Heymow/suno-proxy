import express from "express";
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { options } from '../swagger/swagger-options.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function loadSwaggerUi(app: express.Application) {
    const openApiDoc = JSON.parse(fs.readFileSync('./src/swagger/openapi.json', 'utf8'));

    // Configuration dynamique des serveurs
    const servers = [];

    // 1. URL relative (fonctionne toujours si sur le même domaine)
    servers.push({
        url: '/',
        description: 'Serveur Courant (Relatif)'
    });

    // 2. URL de production si définie
    if (process.env.HOST_) {
        servers.push({
            url: `https://${process.env.HOST_}`,
            description: 'Serveur de Production'
        });
    }

    // 3. Localhost (toujours utile en dev)
    servers.push({
        url: 'http://localhost:8000',
        description: 'Serveur Local'
    });

    openApiDoc.servers = servers;

    app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDoc, options));
    app.use('/public', express.static(path.join(__dirname, '../../public')));
}