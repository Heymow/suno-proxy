import { Request, Response, NextFunction } from 'express';

export function requireMonitorToken(req: Request, res: Response, next: NextFunction): void {
    if (!process.env.MONITOR_TOKEN) {
        res.status(500).json({ error: 'Monitoring token not configured' });
        return
    }
    if (!req.headers['x-monitor-token']) {
        res.status(401).json({ error: 'Unauthorized' });
        return
    }

    const token = req.headers['x-monitor-token'];
    if (token !== process.env.MONITOR_TOKEN) {
        res.status(401).json({ error: 'Unauthorized' });
        return
    }
    next();
}