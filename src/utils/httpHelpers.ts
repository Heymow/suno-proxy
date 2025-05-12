import { rateService } from '../services/RedisAdaptiveRateService.js';
import { acquireToken } from './tokenBucket.js';

export const MIN_DELAY = 100; // ms

// Métriques partagées 
export const metrics = {
    requestCount: 0,
    retryCount: 0,
    rateLimitCount: 0,
    circuitOpenCount: 0,
    avgDelay: 0,
    cacheHitCount: 0,
    cacheMissCount: 0
}

export function randomize(base: number, spread: number) {
    return base + Math.floor(Math.random() * spread);
}

export async function waitForToken(domain: string): Promise<void> {
    while (!(await acquireToken(domain))) {
        const waitMs = randomize(80, 70);
        await new Promise(res => setTimeout(res, waitMs));
    }
}

export async function applyAdaptiveDelay(domain: string): Promise<void> {
    const delay = await rateService.getDelay(domain);
    if (delay > 0) {
        const delayMs = Math.max(MIN_DELAY, randomize(delay, 200));
        await new Promise(res => setTimeout(res, delayMs));
    }
}

export async function handleRateLimit(domain: string, url: string, attempt: number): Promise<void> {
    const attemptMultiplier = Math.pow(1.5, attempt);
    await rateService.increaseDelay(domain, attemptMultiplier);

    const currentDelay = await rateService.getDelay(domain);
    const delayMs = randomize(currentDelay, 200);
    console.warn(`Rate limit reached. Retrying after ${delayMs}ms (adaptive)...`);
    await new Promise(res => setTimeout(res, delayMs));
    metrics.rateLimitCount++;
}

export async function handleTimeout(url: string, attempt: number): Promise<void> {
    const baseTimeoutDelay = 500;
    const delayMs = randomize(baseTimeoutDelay * Math.pow(1.5, attempt), 500);
    console.warn(`Timeout on attempt ${attempt} for ${url}, retrying after ${delayMs}ms...`);
    await new Promise(res => setTimeout(res, delayMs));
}

export async function checkCircuitBreaker(domain: string, failures: number): Promise<void> {
    if (failures > 5) {
        await rateService.openCircuit(domain, 60);
        console.warn(`Circuit breaker opened for ${domain} after ${failures} failures`);
        metrics.circuitOpenCount++;
    }
}