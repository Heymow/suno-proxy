import express, { Request, Response } from 'express';
import { getUserInfo, getClipDataFromUser, getRecentClips } from '../controllers/userController.js';
import { validateUserParams } from "../middlewares/validateUserParams.js";

const router = express.Router();

router.get('/userSongs/:handle', validateUserParams, async (req: Request, res: Response): Promise<void> => {
    try {
        const { handle, forceRefresh } = (req as any).userParams;
        const userData = await getClipDataFromUser(handle, forceRefresh);
        res.json(userData);
    } catch (error) {
        console.error('Error in /userSongs route:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/recent/:handle', validateUserParams, async (req: Request, res: Response): Promise<void> => {
    try {
        await getRecentClips(req, res);
    } catch (error) {
        console.error('Error in /recent route:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/:handle/:page', validateUserParams, async (req: Request, res: Response): Promise<void> => {
    try {
        await getUserInfo(req, res);
    } catch (error) {
        console.error('Error in /user route:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

export default router;
