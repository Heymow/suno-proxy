import express, { Request, Response } from 'express';
import { getClipInfo, getClipComments, getNewSongs } from '../controllers/songController.js';
import { validateSongParams } from '../middlewares/validateSongParams.js';

const router = express.Router();

router.get('/new_songs', async (req: Request, res: Response): Promise<void> => {
    try {
        await getNewSongs(req, res);
    } catch (error) {
        console.error('Error in /song/new_songs route:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


router.get('/:songId', validateSongParams, async (req: Request, res: Response): Promise<void> => {
    try {
        const songId = req.params.songId;
        if (!songId) {
            res.status(400).json({ error: 'Missing songId' });
        }
        await getClipInfo(req, res);
    }
    catch (error) {
        console.error('Error in /song/:songId route:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
);

router.get('/comments/:songId', validateSongParams, async (req: Request, res: Response): Promise<void> => {
    try {
        const songId = req.params.songId;
        if (!songId) {
            res.status(400).json({ error: 'Missing songId' });
        }
        await getClipComments(req, res);
    }
    catch (error) {
        console.error('Error in /song/comments/:songId route:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
);

export default router;