import dotenv from 'dotenv';
import path from 'path';
import { createClient, RedisClientType } from 'redis';

if (process.env.NODE_ENV === 'development') {
    const result = dotenv.config({ path: path.resolve(process.cwd(), '.env.dev') });
}

let redisClient: RedisClientType | null = null;
const targetDomain = process.env.TARGET_DOMAIN || 'studio-api.prod.suno.com';

/**
 * Variable globale du client Redis connecté
 */
let connectedRedisClient: RedisClientType | null = null;

/**
 * Obtient l'instance client Redis existante ou en crée une nouvelle
 * ATTENTION: Ce client peut ne pas être connecté, utilisez connectRedis() pour garantir la connexion
 */
export function getRedisClient(): RedisClientType {
    if (!redisClient) {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        redisClient = createClient({ url: redisUrl });

        redisClient.on('error', (err) => console.error('Redis Client Error', err));
        redisClient.on('connect', () => {
            process.env.NODE_ENV == 'development' && console.log('Connecting to Redis...');
        });
        redisClient.on('ready', () => {
            console.log('✅ Redis Client is ready to use');
        });
    }

    if (!redisClient.isOpen) {
        console.warn('[Redis] Client exists but is not connected');
    }

    return redisClient;
}

/**
 * Assure la connexion au client Redis et réinitialise les clés du circuit-breaker
 * @returns Client Redis connecté
 * @throws Error si la connexion échoue
 */
export async function connectRedis(): Promise<RedisClientType> {
    const client = getRedisClient();

    if (!client.isOpen) {
        try {
            await client.connect();
        } catch (err) {
            console.error("❌ Failed to connect to Redis:", err);
            throw new Error("Redis connection failed");
        }
    }

    try {
        await client.del(`circuit_breaker:${targetDomain}`);
        await client.del(`consecutive_failures:${targetDomain}`);
    } catch (err) {
        console.warn('Failed to clear initial Redis keys:', err);
        // On continue même si la suppression des clés échoue
    }

    return client;
}

/**
 * Obtient un client Redis connecté de façon sécurisée (non-async)
 * @throws Error si le client n'est pas disponible ou connecté
 */
export function getSafeRedisClient(): RedisClientType {
    if (!connectedRedisClient || !connectedRedisClient.isOpen) {
        throw new Error("Redis client not connected. Call connectRedis() first");
    }
    return connectedRedisClient;
}

/**
 * Initialise et connecte le client Redis pour une utilisation ultérieure avec getSafeRedisClient()
 */
export async function initRedisConnection(): Promise<void> {
    const client = getRedisClient();
    if (!client.isOpen) {
        try {
            await client.connect();
        } catch (err) {
            console.error("❌ Failed to connect to Redis:", err);
            throw new Error("Redis connection failed");
        }
    }
    connectedRedisClient = client;
}