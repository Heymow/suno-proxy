import express from 'express';

export default function redirectBrowserToStatus(app: express.Application) {
    app.use((req, res, next) => {
        if (req.path === '/health') return next();
        const ua = req.headers['user-agent'] || '';
        const isBrowser = /mozilla|chrome|safari|firefox/i.test(ua);
        const acceptHeader = req.headers.accept || '';
        const isApiRequest = acceptHeader.includes('application/json');
        const isApiRoute = ['/api', '/user', '/song', '/playlist', '/trending'].some(prefix =>
            req.path.startsWith(prefix)
        );

        if (isBrowser && !isApiRoute && !isApiRequest) {
            return res.redirect('https://status.suno-proxy.click');
        }

        next();
    });
}