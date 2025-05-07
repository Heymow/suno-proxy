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
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDoc, options));
    app.use('/public', express.static(path.join(__dirname, '../../public')));
}