import express, { Request, Response } from 'express';
import { getApiStats, resetApiStats } from '../monitoring/apiMonitor.js';

const router = express.Router();

router.get('/monitoring', (req: Request, res: Response): void => {
    const token = req.headers['x-monitor-token'];

    if (!process.env.MONITOR_TOKEN) {
        res.status(500).json({ error: 'Monitoring token not configured' });
        return;
    }

    if (token !== process.env.MONITOR_TOKEN) {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }

    try {
        const stats = getApiStats();
        if (!stats) {
            res.status(500).json({ error: 'Monitoring data unavailable' });
            return;
        }
        res.status(200).json(stats);
    } catch (error) {
        console.error('Error retrieving monitoring stats:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/monitoring/reset', (req: Request, res: Response): void => {
    const token = req.headers['x-monitor-token'];

    if (!process.env.MONITOR_TOKEN) {
        res.status(500).json({ error: 'Monitoring token not configured' });
        return;
    }

    if (token !== process.env.MONITOR_TOKEN) {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }

    try {
        resetApiStats();
        res.status(200).json({ message: 'Monitoring stats reset successfully' });
    } catch (error) {
        console.error('Error resetting monitoring stats:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
