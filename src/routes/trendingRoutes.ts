import express, { Request, Response } from 'express';
import { getTrending, getStatus } from '../controllers/trendingController.js';
import { validateStatusParams, validateTrendingParams } from '../middlewares/validateTrendingParams.js';

const router = express.Router();


router.get('/status', validateStatusParams, async (req: Request, res: Response): Promise<void> => {
    try {
        await getStatus(req, res);
    }
    catch (error) {
        console.error('Error in /trending/status route:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/:list/:timeSpan', validateTrendingParams, async (req: Request, res: Response): Promise<void> => {
    try {
        await getTrending(req, res);
    }
    catch (error) {
        console.error('Error in /trending route:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


export default router;