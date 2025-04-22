import path from 'path';
import { fileURLToPath } from 'url';
import express, { Request, Response } from 'express';
import songRoutes from './routes/songRoutes.js';
import userRoutes from './routes/userRoutes.js';
import playlistRoutes from './routes/playlistRoutes.js';
import adminMonitoringRoutes from './routes/systemRoutes.js';
import { retryOnRateLimit } from './middlewares/retryOnRateLimit.js';
import dotenv from 'dotenv';
dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const monitoringUiPath = path.join(__dirname, '../monitoring-ui/dist');
app.use('/monitoring-ui', express.static(monitoringUiPath));
app.get('/monitoring-ui/*', (req, res) => {
    res.sendFile(path.join(monitoringUiPath, 'index.html'));
});

app.use(express.urlencoded({ extended: true }));

app.use(retryOnRateLimit);

app.use('/song', songRoutes);
app.use('/user', userRoutes);
app.use('/playlist', playlistRoutes);
app.use('/api/internal', adminMonitoringRoutes);


app.listen(PORT, () => {
    console.log(`✅ Suno Analyzer watching on http://localhost:${PORT}`);
});
