import express, { Request, Response } from 'express';
import {
    getApiStats,
    resetApiStats,
    getTimeline,
} from '../monitoring/apiMonitor.js';

const router = express.Router();

const checkToken = (req: Request, res: Response): boolean => {
    const token = req.headers['x-monitor-token'];
    if (!process.env.MONITOR_TOKEN) {
        res.status(500).json({ error: 'Monitoring token not configured' });
        return false;
    }
    if (token !== process.env.MONITOR_TOKEN) {
        res.status(403).json({ error: 'Forbidden' });
        return false;
    }
    return true;
};

router.get('/monitoring', (req, res) => {
    if (!checkToken(req, res)) return;

    try {
        const stats = getApiStats();
        res.status(200).json(stats);
    } catch (error) {
        console.error('Error retrieving monitoring stats:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/monitoring/reset', (req, res) => {
    if (!checkToken(req, res)) return;

    try {
        resetApiStats();
        res.status(200).json({ message: 'Monitoring stats reset successfully' });
    } catch (error) {
        console.error('Error resetting monitoring stats:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/monitoring/timeline', (req, res) => {
    if (!checkToken(req, res)) return;

    try {
        res.status(200).json(getTimeline());
    } catch (error) {
        console.error('Error getting timeline:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
