import { setCachedItem, getCachedItem } from '../../services/cacheService.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mRedis: any = {
    get: vi.fn(),
    set: vi.fn(),
};

vi.mock('../../redisClient', () => ({
    getRedisClient: () => mRedis,
}));

describe('cacheService', () => {
    beforeEach(() => {
        mRedis.get.mockReset();
        mRedis.set.mockReset();
    });

    describe('getCachedItem', () => {
        it('should return null if id is missing', async () => {
            const result = await getCachedItem('test', '');
            expect(result).toBeNull();
        });

        it('should return null if forceRefresh is true', async () => {
            const result = await getCachedItem('test', '123', true);
            expect(result).toBeNull();
        });

        it('should set and get cached item', async () => {
            mRedis.get.mockResolvedValueOnce(JSON.stringify({ foo: 'bar' }));
            const result = await getCachedItem('test', '123');
            expect(result).toEqual({ foo: 'bar' });
        });

        it('should return null if cached value is invalid JSON', async () => {
            mRedis.get.mockResolvedValueOnce('not a json');
            const result = await getCachedItem('test', 'bad');
            expect(result).toBeNull();
        });

        it('should return null if cache is missing', async () => {
            mRedis.get.mockResolvedValueOnce(null);
            const result = await getCachedItem('test', 'notfound');
            expect(result).toBeNull();
        });

        it('should set and get cached playlist info', async () => {
            mRedis.get.mockResolvedValueOnce(JSON.stringify({ foo: 'bar' }));
            const result = await getCachedItem('playlist', '123');
            expect(result).toEqual({ foo: 'bar' });
            await setCachedItem('playlist', '123', { foo: 'bar' }, 60);
            expect(mRedis.set).toHaveBeenCalledWith('playlist:123', JSON.stringify({ foo: 'bar' }), { EX: 60 });
        });
    });

    describe('setCachedItem', () => {
        it('should set cached item', async () => {
            await setCachedItem('test', '123', { foo: 'bar' }, 60);
            expect(mRedis.set).toHaveBeenCalledWith('test:123', JSON.stringify({ foo: 'bar' }), { EX: 60 });
        });

        it('should not set cached item if id or data is missing', async () => {
            await setCachedItem('test', '', { foo: 'bar' });
            expect(mRedis.set).not.toHaveBeenCalled();

            await setCachedItem('test', '123', null);
            expect(mRedis.set).not.toHaveBeenCalled();
        });

        it('should set cached item with default expiry', async () => {
            await setCachedItem('test', '123', { foo: 'bar' });
            expect(mRedis.set).toHaveBeenCalledWith(
                'test:123',
                JSON.stringify({ foo: 'bar' }),
                { EX: Number(process.env.CACHE_EXPIRY_TIME_MINUTES) * 60 || 60 * 60 }
            );
        });

        it('should set cached item with custom expiry', async () => {
            await setCachedItem('test', '123', { foo: 'bar' }, 120);
            expect(mRedis.set).toHaveBeenCalledWith('test:123', JSON.stringify({ foo: 'bar' }), { EX: 120 });
        });
    });
});