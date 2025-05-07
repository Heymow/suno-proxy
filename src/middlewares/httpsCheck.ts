import express from 'express';

export default function httpsCheck(app: express.Application) {
    app.set('trust proxy', true);

    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
        const policy = process.env.HTTPS_POLICY || 'forbid'; // allow | redirect | forbid

        app.use(((req: express.Request, res: express.Response, next: express.NextFunction) => {
            if (req.path === '/health') return next();

            const proto = req.headers['x-forwarded-proto'];
            const host = req.headers.host || '';

            const isHttpOrUnknown = proto !== 'https' || !proto;
            const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1');

            if (isHttpOrUnknown && !isLocal) {
                if (policy === 'forbid') {
                    return res.status(403).send('Access denied: HTTPS required');
                }
                if (policy === 'redirect') {
                    return res.redirect(`https://${host}${req.url}`);
                }
            }

            next();
        }) as express.RequestHandler);
    }
}