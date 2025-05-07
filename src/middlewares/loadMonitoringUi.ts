import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function loadMonitoringUi(app: express.Application) {
    const monitoringUiEnabled = process.env.MONITORING_UI_ENABLED || 'false';
    if (monitoringUiEnabled !== 'false') return
    const monitoringUiPath = path.join(__dirname, '../monitoring-ui/dist');
    app.use('/monitoring-ui', express.static(monitoringUiPath));
    app.get('/monitoring-ui/*', (req, res) => {
        res.sendFile(path.join(monitoringUiPath, 'index.html'));
    });
}