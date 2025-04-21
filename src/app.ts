import express, { Request, Response } from 'express';
import songRoutes from './routes/songRoutes.js';
import userRoutes from './routes/userRoutes.js';
import playlistRoutes from './routes/playlistRoutes.js';
import dotenv from 'dotenv';
dotenv.config();

import { retryOnRateLimit } from './middlewares/retryOnRateLimit.js';



const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));

app.use(retryOnRateLimit);

app.use('/song', songRoutes);
app.use('/user', userRoutes);
app.use('/playlist', playlistRoutes);

app.listen(PORT, () => {
    console.log(`✅ Suno Analyzer watching on http://localhost:${PORT}`);
});
