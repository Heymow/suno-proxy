import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

export function getRedisClient() {
    if (!redisClient) {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        redisClient = createClient({ url: redisUrl });
        console.log(`Connecting to Redis at ${redisUrl}`);

        redisClient.on('error', (err) => console.error('Redis Client Error', err));
        redisClient.on('connect', () => {
            console.log('Connected to Redis');
        });
        redisClient.on('ready', () => {
            console.log('Redis Client is ready to use');
        });
    }
    return redisClient;
}

export async function connectRedis() {
    const client = getRedisClient();
    await client.connect();
    return client;
}