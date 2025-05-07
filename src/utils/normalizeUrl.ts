export function normalizeUrl(url: string): string {
    try {
        const { pathname } = new URL(url);

        const patterns: [RegExp, string][] = [
            [/\/api\/profiles\/[^\/?]+\/recent_clips/, '/api/profiles/:slug/recent_clips'],
            [/\/api\/profiles\/[^\/?]+/, '/api/profiles/:slug'],
            [/\/api\/clip\/[^\/?]+/, '/api/clip/:uuid'],
            [/\/api\/gen\/[^\/?]+\/comments/, '/api/gen/:uuid/comments'],
            [/\/api\/playlist\/[^\/?]+/, '/api/playlist/:uuid'],
        ];

        for (const [regex, replacement] of patterns) {
            if (regex.test(pathname)) return pathname.replace(regex, replacement);
        }

        return pathname;
    } catch {
        return url;
    }
}