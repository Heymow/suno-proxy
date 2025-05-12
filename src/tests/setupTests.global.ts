vi.mock('../redisClient.js'
    , () => {
        console.log('>>> REDIS MOCK APPLIED');
        const mRedis = {
            get: vi.fn(),
            set: vi.fn(),
            quit: vi.fn(),
            isOpen: true,
        };
        return {
            connectRedis: vi.fn(),
            getRedisClient: () => mRedis,
            getSafeRedisClient: () => mRedis,
        };
    });

vi.mock('axios');

vi.mock('../utils/tokenBucket.js', () => ({
    acquireToken: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../utils/httpHelpers.js', () => ({
    waitForToken: vi.fn().mockResolvedValue(undefined),
    applyAdaptiveDelay: vi.fn().mockResolvedValue(undefined),
    handleRateLimit: vi.fn().mockResolvedValue(undefined),
    handleTimeout: vi.fn().mockResolvedValue(undefined),
    checkCircuitBreaker: vi.fn().mockResolvedValue(undefined),
    metrics: { cacheHitCount: 0, requestCount: 0, retryCount: 0 }
}));

import dotenv from 'dotenv';
const envFile = process.env.NODE_ENV === 'production' ? '.env' :
    process.env.NODE_ENV === 'staging' ? '.env.staging' : '.env.dev';
dotenv.config({ path: envFile });
import { beforeAll, afterAll, afterEach } from 'vitest';
import { connectRedis, getSafeRedisClient } from '../redisClient.js';
import {
    resetAxiosMocks,
} from '../utils/testUtils.js';

console.log('>>> setupTests.global.ts loaded');

beforeAll(async () => {
    console.log('>>> beforeAll: connectRedis');
    await connectRedis();
});

afterAll(async () => {
    console.log('>>> afterAll: about to quit redis');
    const redis = getSafeRedisClient();
    if (redis?.isOpen) {
        await redis.quit();
        console.log('Redis connection closed');
    } else {
        console.warn('Redis was already closed before afterAll');
    }
});

afterEach(async (context) => {
    resetAxiosMocks();
});
