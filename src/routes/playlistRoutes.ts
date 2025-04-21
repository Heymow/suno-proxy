import express, { Request, Response } from 'express';
import { getPlaylistInfo } from '../controllers/playlistController.js';
import { validatePlaylistParams } from '../middlewares/validatePlaylistParams.js';

const router = express.Router();

router.get('/:playlistId', validatePlaylistParams, async (req: Request, res: Response): Promise<void> => {
    try {
        await getPlaylistInfo(req, res); // On lit tout depuis (req as any).playlistParams dans le contrôleur
    } catch (error) {
        console.error('Error in /playlists/:playlistId route:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
