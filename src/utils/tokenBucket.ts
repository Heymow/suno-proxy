import { getRedisClient } from '../redisClient.js';

export async function acquireToken(key: string, limit: number = 10, refillTime: number = 1000): Promise<boolean> {
    const redis = getRedisClient();
    const now = Date.now();
    const bucketKey = `token_bucket:${key}`;

    const [tokens, lastRefillRaw] = await Promise.all([
        redis.get(`${bucketKey}:tokens`).then(v => parseInt(v || '0')),
        redis.get(`${bucketKey}:lastRefill`).then(v => parseInt(v || '0'))
    ]);
    const lastRefill = lastRefillRaw || (now - refillTime); // Correction ici
    const timePassed = now - lastRefill;
    const refillAmount = Math.floor(timePassed / refillTime) * limit;
    const newTokens = Math.min(limit, tokens + refillAmount);

    if (newTokens > 0) {
        await Promise.all([
            redis.set(`${bucketKey}:tokens`, newTokens - 1),
            redis.set(`${bucketKey}:lastRefill`, now)
        ]);
        return true;
    }
    return false;
}