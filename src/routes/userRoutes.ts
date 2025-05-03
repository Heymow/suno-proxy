import express, { Request, Response } from 'express';
import { getUserPageInfo, getAllClipsFromUser, getRecentClips } from '../controllers/userController.js';
import { validateUserParams } from "../middlewares/validateUserParams.js";

const router = express.Router();

router.get('/recent/:handle', validateUserParams, async (req: Request, res: Response): Promise<void> => {
    try {
        await getRecentClips(req, res);
    } catch (error) {
        console.error('Error in /user/recent route:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/:handle/:page', validateUserParams, async (req: Request, res: Response): Promise<void> => {
    try {
        await getUserPageInfo(req, res);
    } catch (error) {
        console.error('Error in /user/:handle/:page route:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/:handle', validateUserParams, async (req: Request, res: Response): Promise<void> => {
    try {
        const { handle, forceRefresh } = (req as any).userParams;
        const userData = await getAllClipsFromUser(handle, forceRefresh);
        res.json(userData);
    } catch (error) {
        console.error('Error in /user/userSongs route:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
