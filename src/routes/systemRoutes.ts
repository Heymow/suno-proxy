import express, { Request, Response } from 'express';
import {
    getApiStats,
    resetApiStats,
    getTimeline,
} from '../monitoring/apiMonitor.js';
import { runArchiveNow, testArchives } from '../cron/scheduleArchives.js';

const router = express.Router();

router.get('/monitoring', (req, res) => {
    try {
        const stats = getApiStats();
        res.status(200).json(stats);
    } catch (error) {
        console.error('Error retrieving monitoring stats:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/monitoring/reset', (req, res) => {
    try {
        resetApiStats();
        res.status(200).json({ message: 'Monitoring stats reset successfully' });
    } catch (error) {
        console.error('Error resetting monitoring stats:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/monitoring/timeline', (req, res) => {
    try {
        res.status(200).json(getTimeline());
    } catch (error) {
        console.error('Error getting timeline:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/monitoring/health', (req, res) => {
    try {
        res.status(200).json({ status: 'OK' });
    } catch (error) {
        console.error('Error checking health:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/archive/test', async (req, res) => {
    try {
        const result = await testArchives();
        res.status(200).json({ message: 'Archive test completed successfully', result });
    } catch (error) {
        console.error('Error running archive test:', error);
        res.status(500).json({ error: 'Internal Server Error' });
        throw error;
    }
});

router.get('/archive/now', async (req, res) => {
    try {
        const result = await runArchiveNow();
        res.status(200).json({ message: 'Archive run completed successfully', result });
    } catch (error) {
        console.error('Error running archive now:', error);
        res.status(500).json({ error: 'Internal Server Error' });
        throw error;
    }
});

export default router;
