import express, { Request, Response } from 'express';
import { getClipInfo, getClipComments } from '../controllers/songController.js';

const router = express.Router();


// router.get('/user/:handle', async (req: Request, res: Response): Promise<void> => {
//     try {
//         const handle = req.params.handle;
//         if (!handle) {
//             res.status(400).json({ error: 'Missing handle' });
//         }
//         const userData = await getClipDataFromUser(handle);
//         res.json(userData);
//     } catch (error) {
//         console.error('Error in /userSongs route:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

router.get('/:songId', async (req: Request, res: Response): Promise<void> => {
    try {
        const songId = req.params.songId;
        if (!songId) {
            res.status(400).json({ error: 'Missing songId' });
        }
        const clipData = await getClipInfo(req, res);
        // res.json(clipData);
    }
    catch (error) {
        console.error('Error in /getClipInfo route:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
);

router.get('/comments/:songId', async (req: Request, res: Response): Promise<void> => {
    try {
        const songId = req.params.songId;
        if (!songId) {
            res.status(400).json({ error: 'Missing songId' });
        }
        const clipData = await getClipComments(req, res);
        // res.json(clipData);
    }
    catch (error) {
        console.error('Error in /getClipInfo route:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
);

// router.get('/scrap/:songId', async (req: Request, res: Response): Promise<void> => {
//     try {
//         await getSongInfo(req, res);
//     } catch (error) {
//         console.error('Error in /song route:', error);
//         res.status(500).send({ error: 'Internal Server Error' });
//     }
// });

export default router;