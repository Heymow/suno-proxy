import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createServer } from 'http';
import { connectRedis, getRedisClient } from '../../redisClient.js';

import appModule from '../../app';

let server: ReturnType<typeof createServer>;
const MAX_PAGE_NUMBER = Number(process.env.MAX_PAGE_NUMBER) || 20;

beforeAll(async () => {
    await connectRedis();
    server = createServer(appModule);
    server.listen();
});

afterAll(async () => {
    server.close();
    await getRedisClient().quit();
});

describe('API server routes', () => {

    it('GET /health should return 200 OK', async () => {
        const res = await request(server).get('/health');
        expect(res.status).toBe(200);
        expect(res.text).toBe('OK');
    });

    it('GET /docs should return 200 or redirect, and contain Swagger UI', async () => {
        const res = await request(server).get('/docs').redirects(1);
        expect([200, 301, 302]).toContain(res.status);
        expect(res.text.toLowerCase()).toContain('swagger');
    });

    describe('API internal routes', () => {
        it('GET /api should return 404', async () => {
            const res = await request(server).get('/api');
            expect(res.status).toBe(404);
        });

        it('GET /api/internal without token configured should return 500 or 404', async () => {
            const originalToken = process.env.MONITOR_TOKEN;
            delete process.env.MONITOR_TOKEN;

            const res = await request(server).get('/api/internal');
            expect([500, 404]).toContain(res.status);
            if (res.status === 500) {
                expect(res.body).toHaveProperty('error');
                expect(['Monitoring token not configured']).toContain(res.body.error);
            }

            process.env.MONITOR_TOKEN = originalToken;
        });

        it('GET /api/internal without token should return 401 or 404', async () => {
            const res = await request(server).get('/api/internal');
            expect([401, 404]).toContain(res.status);
            if (res.status === 401) {
                expect(res.body).toHaveProperty('error');
                expect(['Unauthorized']).toContain(res.body.error);
            }
        });

        it('GET /api/internal with invalid token should return 401 or 404', async () => {
            const res = await request(server)
                .get('/api/internal')
                .set('x-monitor-token', 'wrongtoken');
            expect([401, 404]).toContain(res.status);
            if (res.status === 401) {
                expect(res.body).toHaveProperty('error', 'Unauthorized');
            }
        });

        it('GET /api/internal with valid token should return 200 or 404', async () => {
            // Remplace 'vraimonitortoken' par la vraie valeur de process.env.MONITOR_TOKEN pour le test
            const res = await request(server)
                .get('/api/internal')
                .set('x-monitor-token', process.env.MONITOR_TOKEN || 'vraimonitortoken');
            expect([200, 404]).toContain(res.status);
        });
    });
});

describe('Client API routes', () => {

    describe('Songs routes', () => {
        describe('GET /song/:songId', () => {
            it('GET /song should return 404', async () => {
                const res = await request(server).get('/song');
                expect(res.status).toBe(404);
            });

            it('should return 400 for invalid songId', async () => {
                const res = await request(server).get('/song/not-a-uuid');
                expect(res.status).toBe(400);
                expect(res.body).toHaveProperty('error');
            });

            it('should return 404for valid but non-existent songId', async () => {
                const res = await request(server).get('/song/00000000-0000-0000-0000-000000000000');
                expect(res.status).toBe(404);
                expect(res.body).toHaveProperty('error', 'Clip not found');
            });

            it('should return 200 for a valid and existing songId', async () => {
                const res = await request(server).get('/song/77243785-6f44-461b-86c5-5b72592b336e');
                expect(res.status).toBe(200);
            });

            it('should return 200 for a valid shared songId', async () => {
                const res = await request(server).get('/song/ND4bSqhuFfM0kvfr');
                expect(res.status).toBe(200);
            });
        });
    });

    describe('Playlists routes', () => {
        describe('GET /playlist/:playlistId', () => {
            it('GET /playlist should return 404', async () => {
                const res = await request(server).get('/playlist');
                expect(res.status).toBe(404);
            });

            it('should return 400 for invalid playlistId', async () => {
                const res = await request(server).get('/playlist/not-a-uuid');
                expect(res.status).toBe(400);
                expect(res.body).toHaveProperty('error');
            });

            it('should return 404 for valid but non-existent playlistId', async () => {
                const res = await request(server).get('/playlist/00000000-0000-0000-0000-000000000000');
                expect(res.body).toHaveProperty('error', 'Playlist not found');
                expect(res.status).toBe(404);
            });

            it('should return 200 for a valid and existing playlistId', async () => {
                const res = await request(server).get('/playlist/4ecc762e-97fc-4973-ad22-b7a56375c157');
                expect(res.status).toBe(200);
            });
        });

        describe('GET /playlist/:playlistId/:page', () => {
            it('should return 400 for invalid page', async () => {
                const res = await request(server).get('/playlist/4ecc762e-97fc-4973-ad22-b7a56375c157/notanumber');
                expect(res.status).toBe(400);
                expect(res.body).toHaveProperty('error');
            });

            it('should return 200 for a valid playlistId and page', async () => {
                const res = await request(server).get('/playlist/4ecc762e-97fc-4973-ad22-b7a56375c157/1');
                expect(res.status).toBe(200);
            });

            it('should return 200 for a valid playlistId and page with no clips', async () => {
                const res = await request(server).get(`/playlist/4ecc762e-97fc-4973-ad22-b7a56375c157/${MAX_PAGE_NUMBER}`);
                expect(res.status).toBe(200);
            });

            it('should return 400 for page out of range', async () => {
                const res = await request(server).get(`/playlist/4ecc762e-97fc-4973-ad22-b7a56375c157/${MAX_PAGE_NUMBER + 1}`);
                expect(res.status).toBe(400);
                expect(res.body).toHaveProperty('error');
            });
        });
    });

    describe('Users routes', () => {
        describe('GET /user/:handle', () => {
            it('should return 404 for missing handle', async () => {
                const res = await request(server).get('/user/');
                expect(res.status).toBe(404);
            });

            it('should return 400 for invalid handle', async () => {
                const res = await request(server).get('/user/%20');
                expect(res.status).toBe(400);
                expect(res.body).toHaveProperty('error');
            });

            it('should return 404 for non-existent handle', async () => {
                const res = await request(server).get('/user/inexistantuser123vs1655eez88evz81ezf31');
                expect(res.status).toBe(404);
            });

            it('should return 200 for a valid and existing handle', async () => {
                const res = await request(server).get('/user/diggermc');
                expect(res.status).toBe(200);
                expect(res.body).toHaveProperty('user_id');
                expect(res.body).toHaveProperty('clips');
            });


        });

        describe('GET /user/:handle/:page', () => {
            it('should return 400 for invalid page', async () => {
                const res = await request(server).get('/user/diggermc/notanumber');
                expect(res.status).toBe(400);
                expect(res.body).toHaveProperty('error');
            });

            it('should return 404 for non-existent handle', async () => {
                const res = await request(server).get('/user/inexistantuser123vs1655eez88evz81ezf31/1');
                expect([404]).toContain(res.status);
            }
            );

            it('should return 200 for a valid handle and page', async () => {
                const res = await request(server).get('/user/diggermc/1');
                expect(res.status).toBe(200);
                expect(res.body).toHaveProperty('user_id');
                expect(res.body).toHaveProperty('clips');
            });

            it('should return 200 for a valid handle and page with no clips', async () => {
                const res = await request(server).get(`/user/diggermc/${MAX_PAGE_NUMBER}`);
                expect(res.status).toBe(200);
                expect(res.body).toHaveProperty('user_id');
                expect(res.body).toHaveProperty('clips');
            });

            it('should return 400 for page out of range', async () => {
                const res = await request(server).get(`/user/diggermc/${MAX_PAGE_NUMBER + 1}`);
                expect(res.status).toBe(400);
                expect(res.body).toHaveProperty('error');
            });
        });

        describe('GET /user/recent/:handle', () => {

            it('should return 400 for invalid handle', async () => {
                const res = await request(server).get('/user/recent/%20');
                expect(res.status).toBe(400);
                expect(res.body).toHaveProperty('error');
            });

            it('should return 404 for non-existent handle', async () => {
                const res = await request(server).get('/user/recent/inexistantuser123');
                expect([404]).toContain(res.status);
            });

            it('should return 200 for a valid and existing handle', async () => {
                const res = await request(server).get('/user/recent/diggermc');
                expect(res.status).toBe(200);
                expect(res.body).toHaveProperty('user_id');
                expect(res.body).toHaveProperty('clips');
            });
        });
    });

    describe('Trending routes', () => {
        describe('GET /trending/status', () => {
            it('GET /trending/status should return 200', async () => {
                const res = await request(server).get('/trending/status');
                expect(res.status).toBe(200);
            });
        }
        );
        describe('GET /trending/:list/:timeSpan', () => {
            it('GET /trending should return 404', async () => {
                const res = await request(server).get('/trending');
                expect(res.status).toBe(404);
            });

            it('should return 400 for invalid list', async () => {
                const res = await request(server).get('/trending/not-a-list/Now');
                expect(res.status).toBe(400);
                expect(res.body).toHaveProperty('error');
            });

            it('should return 400 for invalid timeSpan', async () => {
                const res = await request(server).get('/trending/English/not-a-timespan');
                expect(res.status).toBe(400);
                expect(res.body).toHaveProperty('error');
            });

            it('should return 200 for a valid list and timeSpan', async () => {
                const res = await request(server).get('/trending/Global/Now');
                expect(res.status).toBe(200);
            });
        }
        );
    }
    );
});