import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;
const targetDomain = process.env.TARGET_DOMAIN || 'studio-api.prod.suno.com';

export function getRedisClient(): RedisClientType {
    if (!redisClient) {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        redisClient = createClient({ url: redisUrl });

        redisClient.on('error', (err) => console.error('Redis Client Error', err));
        redisClient.on('connect', () => {
            console.log('Connected to Redis');
        });
        redisClient.on('ready', () => {
            console.log('Redis Client is ready to use');
        });
    }
    if (!redisClient.isOpen && process.env.NODE_ENV == 'development') {
        console.warn('[Redis] getRedisClient() called but client is closed');
    }

    return redisClient;
}

export async function connectRedis(): Promise<RedisClientType> {
    const client = getRedisClient();

    console.log('✅ Redis open?', getRedisClient().isOpen);

    if (!client.isOpen) {
        await client.connect();
    }

    try {
        await client.del(`circuit_breaker:${targetDomain}`);
        await client.del(`consecutive_failures:${targetDomain}`);
    } catch (err) {
        console.warn('Failed to clear initial Redis keys:', err);
    }

    return client;
}

export function getSafeRedisClient() {
    const client = getRedisClient();
    if (!client || !client.isOpen && process.env.NODE_ENV == 'development') {
        console.warn('[Redis] getSafeRedisClient() called but client is closed', client);
    }
    return client;
}