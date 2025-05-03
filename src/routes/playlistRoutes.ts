import express, { Request, Response } from 'express';
import { getPlaylistInfo, getPlaylistPage } from '../controllers/playlistController.js';
import { validatePlaylistParams } from '../middlewares/validatePlaylistParams.js';

const router = express.Router();

router.get('/:playlistId', validatePlaylistParams, async (req: Request, res: Response): Promise<void> => {
    try {
        await getPlaylistInfo(req, res);
    } catch (error) {
        console.error('Error in /playlists/:playlistId route:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/:playlistId/:page', validatePlaylistParams, async (req: Request, res: Response): Promise<void> => {
    try {
        await getPlaylistPage(req, res);
    } catch (error) {
        console.error('Error in /playlists/:playlistId/:page route:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
