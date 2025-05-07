import express from 'express';

export default function redirectBrowserToStatus(app: express.Application) {
    const STATUS_PAGE_HOST = process.env.STATUS_PAGE_HOST || 'http://localhost:8000/status';

    app.use((req, res, next) => {
        if (req.path === '/health') return next();
        const ua = req.headers['user-agent'] || '';
        const isBrowser = /mozilla|chrome|safari|firefox/i.test(ua);
        const acceptHeader = req.headers.accept || '';
        const isApiRequest = acceptHeader.includes('application/json');
        const isApiRoute = ['/user', '/song', '/playlist', '/trending', '/docs', '/public', '/favicon.ico', '/status'].some(prefix =>
            req.path.startsWith(prefix)
        );

        if (isBrowser && !isApiRoute && !isApiRequest) {
            const redirectUrl = (STATUS_PAGE_HOST || 'http://localhost:8000');
            return res.redirect(redirectUrl);
        }
        next();
    });
}