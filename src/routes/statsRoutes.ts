import express from 'express';
import {
    getGlobalStats,
    getTrends,
    getTrendingListStats,
    getTopUsers
} from '../controllers/statsController.js';

const router = express.Router();

router.get('/global', getGlobalStats);
router.get('/trends', getTrends);
router.get('/trending-lists/:listId', getTrendingListStats);
router.get('/users/top', getTopUsers);

export default router;
